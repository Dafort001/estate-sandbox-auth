import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getConnInfo } from "@hono/node-server/conninfo";
import { cors } from "hono/cors";
import { storage } from "./storage";
import { hashPassword, verifyPassword, SESSION_CONFIG } from "./auth";
import { signupSchema, loginSchema, passwordResetRequestSchema, passwordResetConfirmSchema, createOrderSchema, createOrderApiSchema, createJobSchema, initUploadSchema, assignRoomTypeSchema, type UserResponse, type CreateOrderApiInput } from "@shared/schema";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateTokenPair, verifyAccessToken, extractBearerToken } from "./jwt";
import { randomUUID, randomBytes } from "crypto";
import { rateLimiter } from "hono-rate-limiter";
import { generateHandoffPackage, generateHandoffToken } from "./handoffPackage";
import { scheduleEditorReturnProcessing } from "./backgroundQueue";
import { notifyHandoffReady, notifyEditorUploadComplete } from "./notifications";
// Removed: processUploadedFiles - legacy multipart upload handler no longer needed
import { processEditorReturnZip } from "./zipProcessor";
import { generateFinalHandoff } from "./finalHandoff";
// Removed: writeFile, mkdir, join, tmpdir - no longer needed after removing multipart upload
import { uploadFile, downloadFile, generateObjectPath, generatePresignedPutUrl } from "./objectStorage";
import { extractStackNumberFromFilename, extractRoomTypeFromFilename } from "./raw-upload-helpers";
import { scheduleCleanup } from "./cleanup";
import { logger, generateRequestId, type LogContext } from "./logger";

const app = new Hono();

// Request ID middleware - Attach unique request_id to every request
app.use("*", async (c, next) => {
  const requestId = generateRequestId();
  const requestStart = Date.now();
  
  // Attach request ID to response header for tracing
  c.header("X-Request-ID", requestId);
  
  await next();
  
  const duration = Date.now() - requestStart;
  const logContext: LogContext = {
    requestId,
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${duration}ms`,
  };
  
  logger.info(`Request completed`, logContext);
});

// CORS Configuration - Explicit allowlist, no wildcards on protected routes
const getAllowedOrigins = () => {
  if (process.env.NODE_ENV === "production") {
    // Production: Add your production domain(s) here
    return [
      "https://pix.immo",
      "https://www.pix.immo",
      process.env.PRODUCTION_URL || "",
    ].filter(Boolean);
  }
  // Development: Allow localhost and Replit domains
  return [
    "http://localhost:5000",
    "http://localhost:3000",
    "http://127.0.0.1:5000",
    process.env.REPL_SLUG ? `https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co` : "",
  ].filter(Boolean);
};

// Apply CORS to all API routes
app.use(
  "/api/*",
  cors({
    origin: (origin) => {
      const allowedOrigins = getAllowedOrigins();
      // If no origin header (same-origin request) or origin is in allowlist, allow it
      if (!origin || allowedOrigins.includes(origin)) {
        return origin || allowedOrigins[0];
      }
      // Reject other origins
      return allowedOrigins[0];
    },
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
    credentials: true,
  })
);

// Handle OPTIONS preflight requests
app.options("/api/*", (c) => {
  return new Response(null, { status: 204 });
});

// Helper to get client IP (prioritizes trusted, non-spoofable sources)
function getClientIP(c: any): string {
  // In production with Cloudflare, use cf-connecting-ip (trusted, set by Cloudflare edge)
  const cfIP = c.req.header("cf-connecting-ip");
  if (cfIP && process.env.NODE_ENV === "production") {
    return cfIP;
  }

  // In development with Express proxy, use x-forwarded-for set by dev.ts
  if (process.env.NODE_ENV === "development") {
    const forwardedFor = c.req.header("x-forwarded-for");
    if (forwardedFor) {
      return forwardedFor.split(",")[0].trim();
    }
  }

  // Use Hono's getConnInfo to get the real socket IP (can't be spoofed)
  try {
    const connInfo = getConnInfo(c);
    if (connInfo.remote.address) {
      return connInfo.remote.address;
    }
  } catch (error) {
    // getConnInfo may fail in dev mode with proxied requests
  }

  // Fallback for local development (all requests will share this key)
  return "local";
}

// Rate limiters - stricter limits for sensitive auth operations
const loginLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 5, // 5 login attempts per minute per IP
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIP(c),
});

const signupLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 3, // 3 signup attempts per minute per IP
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIP(c),
});

const passwordResetLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 10, // 10 password reset requests per hour per IP
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIP(c),
});

const tokenRefreshLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 10, // 10 token refresh attempts per minute per IP
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIP(c),
});

// Security headers middleware
app.use("*", async (c, next) => {
  await next();
  
  // Prevent clickjacking
  c.res.headers.set("X-Frame-Options", "DENY");
  
  // Prevent MIME-type sniffing
  c.res.headers.set("X-Content-Type-Options", "nosniff");
  
  // Enable XSS filter in older browsers
  c.res.headers.set("X-XSS-Protection", "1; mode=block");
  
  // Referrer policy
  c.res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  
  // Content Security Policy - stricter in production
  const isProduction = process.env.NODE_ENV === "production";
  const scriptSrc = isProduction 
    ? "'self'" 
    : "'self' 'unsafe-inline' 'unsafe-eval'"; // Dev needs these for Vite HMR
  const styleSrc = isProduction
    ? "'self'"
    : "'self' 'unsafe-inline'"; // Dev needs inline styles for Vite/React
  
  c.res.headers.set(
    "Content-Security-Policy",
    `default-src 'self'; ` +
    `script-src ${scriptSrc}; ` +
    `style-src ${styleSrc}; ` +
    `img-src 'self' data: https: blob:; ` +
    `font-src 'self' data:; ` +
    `connect-src 'self' https://storage.googleapis.com; ` +
    `frame-ancestors 'none';`
  );
  
  // HSTS (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    c.res.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  }
});

// Serve static files from public directory
app.use("/public/*", serveStatic({ root: "./" }));
app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));

// Middleware to get current user from session cookie
async function getSessionUser(c: any) {
  const sessionId = getCookie(c, SESSION_CONFIG.cookieName);
  
  if (!sessionId) {
    return null;
  }

  const session = await storage.getSession(sessionId);
  
  if (!session) {
    return null;
  }

  const user = await storage.getUser(session.userId);
  
  if (!user) {
    await storage.deleteSession(sessionId);
    return null;
  }

  return { user, session };
}

// Middleware to get current user from Bearer token
async function getBearerUser(c: any) {
  const authHeader = c.req.header("Authorization");
  const token = extractBearerToken(authHeader);
  
  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  
  if (!payload) {
    return null;
  }

  const user = await storage.getUser(payload.userId);
  
  if (!user) {
    return null;
  }

  return { user };
}

// Middleware to get current user from either session or Bearer token
async function getAuthUser(c: any) {
  // Try Bearer token first
  const bearerUser = await getBearerUser(c);
  if (bearerUser) {
    return bearerUser;
  }

  // Fallback to session cookie
  return await getSessionUser(c);
}

// POST /api/signup
app.post("/api/signup", signupLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validation = signupSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { email, password } = validation.data;

    // Check if user already exists
    const existingUser = await storage.getUserByEmail(email);
    if (existingUser) {
      return c.json({ error: "Email already registered" }, 400);
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const user = await storage.createUser(email, hashedPassword);

    // Create session
    const expiresAt = Date.now() + SESSION_CONFIG.expiresIn;
    const session = await storage.createSession(user.id, expiresAt);

    // Set cookie
    setCookie(c, SESSION_CONFIG.cookieName, session.id, SESSION_CONFIG.cookieOptions);

    // Return user data (without password)
    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return c.json({
      user: userResponse,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/login (supports both cookie and JWT auth via ?token=true)
app.post("/api/login", loginLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { email, password } = validation.data;
    const useToken = c.req.query("token") === "true";

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    // If JWT requested, generate tokens
    if (useToken) {
      const tokens = generateTokenPair(user.id, user.email);
      
      // Store refresh token in database
      await storage.createRefreshToken(
        tokens.refreshTokenId,
        user.id,
        tokens.refreshToken,
        tokens.refreshTokenExpiry
      );

      return c.json({
        user: userResponse,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      });
    }

    // Otherwise, create cookie-based session
    const expiresAt = Date.now() + SESSION_CONFIG.expiresIn;
    const session = await storage.createSession(user.id, expiresAt);

    // Set cookie
    setCookie(c, SESSION_CONFIG.cookieName, session.id, SESSION_CONFIG.cookieOptions);

    return c.json({
      user: userResponse,
      session: {
        id: session.id,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/logout
app.post("/api/logout", async (c) => {
  try {
    const sessionId = getCookie(c, SESSION_CONFIG.cookieName);

    if (sessionId) {
      await storage.deleteSession(sessionId);
    }

    deleteCookie(c, SESSION_CONFIG.cookieName);

    return c.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/me (supports both cookie and Bearer token auth)
app.get("/api/me", async (c) => {
  try {
    const authUser = await getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const userResponse: UserResponse = {
      id: authUser.user.id,
      email: authUser.user.email,
      role: authUser.user.role,
      createdAt: authUser.user.createdAt,
    };

    // If session exists, include it
    if ("session" in authUser) {
      const sessionAuth = authUser as { user: any; session: any };
      return c.json({
        user: userResponse,
        session: {
          id: sessionAuth.session.id,
          expiresAt: sessionAuth.session.expiresAt,
        },
      });
    }

    // Bearer token auth - no session
    return c.json({
      user: userResponse,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/credits/balance - Get user credit balance
app.get("/api/credits/balance", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    
    const credits = await storage.getUserCredits(authUser.user.id);
    return c.json({ credits });
  } catch (error) {
    console.error("Error fetching credits:", error);
    return c.json({ error: "Failed to fetch credits" }, 500);
  }
});

// Deprecated: Database-based services endpoint removed
// Services now loaded from JSON file via GET /api/services below

// POST /api/token/refresh - Refresh access token using refresh token
app.post("/api/token/refresh", tokenRefreshLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: "Refresh token required" }, 400);
    }

    // Verify refresh token exists in database
    const storedToken = await storage.getRefreshToken(refreshToken);
    
    if (!storedToken) {
      return c.json({ error: "Invalid refresh token" }, 401);
    }

    // Get user
    const user = await storage.getUser(storedToken.userId);
    
    if (!user) {
      await storage.deleteRefreshToken(refreshToken);
      return c.json({ error: "User not found" }, 401);
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email);
    
    // Delete old refresh token
    await storage.deleteRefreshToken(refreshToken);
    
    // Store new refresh token
    await storage.createRefreshToken(
      tokens.refreshTokenId,
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiry
    );

    return c.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error("Token refresh error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/password-reset/request - Request password reset token
app.post("/api/password-reset/request", passwordResetLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validation = passwordResetRequestSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { email } = validation.data;

    // Find user
    const user = await storage.getUserByEmail(email);
    
    // For security, always return success even if user doesn't exist
    if (!user) {
      console.log(`Password reset requested for non-existent email: ${email}`);
      return c.json({ success: true, message: "If the email exists, a reset link will be sent" });
    }

    // Generate reset token (valid for 1 hour)
    const token = randomUUID();
    const id = randomUUID();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

    // Delete any existing reset tokens for this user
    await storage.deleteUserPasswordResetTokens(user.id);

    // Store reset token
    await storage.createPasswordResetToken(id, user.id, token, expiresAt);

    // In development, log the reset link to console
    // In production, this would send an email
    const resetLink = `http://localhost:${process.env.PORT || 5000}/public/auth.html?reset=${token}`;
    console.log(`\n📧 Password Reset Link for ${email}:\n${resetLink}\n`);

    return c.json({ 
      success: true, 
      message: "If the email exists, a reset link will be sent",
      // Only include token in development
      ...(process.env.NODE_ENV === "development" && { resetToken: token })
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/password-reset/confirm - Confirm password reset with token
app.post("/api/password-reset/confirm", passwordResetLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validation = passwordResetConfirmSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { token, newPassword } = validation.data;

    // Verify reset token
    const resetToken = await storage.getPasswordResetToken(token);
    
    if (!resetToken) {
      return c.json({ error: "Invalid or expired reset token" }, 401);
    }

    // Get user
    const user = await storage.getUser(resetToken.userId);
    
    if (!user) {
      await storage.deletePasswordResetToken(token);
      return c.json({ error: "User not found" }, 401);
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user password
    await storage.updateUserPassword(user.id, hashedPassword);
    
    // Delete the reset token (one-time use)
    await storage.deletePasswordResetToken(token);
    
    // Invalidate all sessions and refresh tokens for security
    await storage.deleteUserSessions(user.id);
    await storage.deleteUserRefreshTokens(user.id);

    console.log(`✅ Password reset successful for ${user.email}`);

    return c.json({ 
      success: true, 
      message: "Password reset successful. Please log in with your new password." 
    });
  } catch (error) {
    console.error("Password reset confirm error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ====================================================================
// iOS Capture App API Endpoints
// ====================================================================

// Rate limiter for iOS upload endpoints
const iosUploadLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  limit: 30, // 30 requests per minute
  standardHeaders: "draft-6",
  keyGenerator: (c) => getClientIP(c),
});

// POST /api/ios/auth/login - JWT-only authentication for iOS app
app.post("/api/ios/auth/login", loginLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const validation = loginSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { email, password } = validation.data;

    // Find user
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Verify password
    const isValid = await verifyPassword(password, user.hashedPassword);
    if (!isValid) {
      return c.json({ error: "Invalid email or password" }, 401);
    }

    // Generate JWT tokens (no session cookies for iOS)
    const tokens = generateTokenPair(user.id, user.email);
    
    // Store refresh token in database
    await storage.createRefreshToken(
      tokens.refreshTokenId,
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiry
    );

    const userResponse: UserResponse = {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };

    return c.json({
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error("iOS login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/ios/auth/refresh - Refresh access token for iOS app
app.post("/api/ios/auth/refresh", tokenRefreshLimiter, async (c) => {
  try {
    const body = await c.req.json();
    const { refreshToken } = body;

    if (!refreshToken) {
      return c.json({ error: "Refresh token required" }, 400);
    }

    // Verify refresh token exists in database
    const storedToken = await storage.getRefreshToken(refreshToken);
    
    if (!storedToken) {
      return c.json({ error: "Invalid refresh token" }, 401);
    }

    // Get user
    const user = await storage.getUser(storedToken.userId);
    
    if (!user) {
      await storage.deleteRefreshToken(refreshToken);
      return c.json({ error: "User not found" }, 401);
    }

    // Generate new token pair
    const tokens = generateTokenPair(user.id, user.email);
    
    // Delete old refresh token
    await storage.deleteRefreshToken(refreshToken);
    
    // Store new refresh token
    await storage.createRefreshToken(
      tokens.refreshTokenId,
      user.id,
      tokens.refreshToken,
      tokens.refreshTokenExpiry
    );

    return c.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: 900, // 15 minutes in seconds
    });
  } catch (error) {
    console.error("iOS token refresh error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/ios/upload/init - Initialize upload session (iOS-specific, uses jobId instead of jobNumber)
app.post("/api/ios/upload/init", iosUploadLimiter, async (c) => {
  const logCtx: LogContext = { request_id: c.get("request_id") };
  
  try {
    // Authenticate user via JWT Bearer token
    const bearerUser = await getBearerUser(c);
    if (!bearerUser) {
      logger.warn("iOS upload init: Not authenticated", logCtx);
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { jobId } = body;

    if (!jobId) {
      logger.warn("Missing jobId in iOS upload init request", logCtx);
      return c.json({ error: "jobId is required" }, 400);
    }

    // Verify job exists
    const job = await storage.getJob(jobId);
    if (!job) {
      logger.warn(`Job not found: ${jobId}`, logCtx);
      return c.json({ error: "Job not found" }, 404);
    }

    // Check if there's an active shoot for this job
    let shoot = await storage.getActiveShootForJob(jobId);

    // If no active shoot, create a new one
    if (!shoot) {
      shoot = await storage.createShoot(jobId);
      await storage.updateJobStatus(jobId, "in_progress");
      logger.info(`Created new shoot ${shoot.id} for job ${jobId}`, logCtx);
    }

    logger.info(`iOS upload initialized for job ${jobId}, shoot ${shoot.id}`, logCtx);

    return c.json({
      shootId: shoot.id,
      shootCode: shoot.shootCode,
      jobId: job.id,
      jobNumber: job.jobNumber,
    });
  } catch (error) {
    logger.error("Error initializing iOS upload", error, logCtx);
    return c.json({ error: "Failed to initialize upload" }, 500);
  }
});

// POST /api/ios/upload/presigned - Get presigned upload URLs for RAW files
app.post("/api/ios/upload/presigned", iosUploadLimiter, async (c) => {
  try {
    // Authenticate user via JWT Bearer token
    const bearerUser = await getBearerUser(c);
    if (!bearerUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { jobId, shootId, files } = body;

    // Validation
    if (!jobId || !shootId || !Array.isArray(files) || files.length === 0) {
      return c.json({ 
        error: "Missing required fields: jobId, shootId, and files array" 
      }, 400);
    }

    if (files.length > 100) {
      return c.json({ 
        error: "Maximum 100 files per request" 
      }, 400);
    }

    // Verify job exists and belongs to user (or user is admin)
    const job = await storage.getJob(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    if (job.userId !== bearerUser.user.id && bearerUser.user.role !== "admin") {
      return c.json({ error: "Access denied" }, 403);
    }

    // Verify shoot exists
    const shoot = await storage.getShoot(shootId);
    if (!shoot || shoot.jobId !== jobId) {
      return c.json({ error: "Shoot not found or does not belong to job" }, 404);
    }

    // Generate presigned URLs for each file
    const presignedUrls: Array<{
      filename: string;
      url: string;
      expiresAt: number;
    }> = [];

    const expiresAt = Date.now() + 300 * 1000; // 5 minutes

    for (const file of files) {
      const { filename, contentType } = file;
      
      if (!filename || typeof filename !== 'string') {
        return c.json({ 
          error: `Invalid filename: ${filename}` 
        }, 400);
      }

      // Generate object path: projects/{jobId}/raw/{shootId}/{filename}
      const objectPath = generateObjectPath(jobId, shootId, filename, 'raw');
      
      // Generate presigned PUT URL (5 minutes TTL)
      const result = await generatePresignedPutUrl(objectPath, 300);
      
      if (!result.ok || !result.url) {
        console.error(`Failed to generate presigned URL for ${filename}:`, result.error);
        return c.json({ 
          error: `Failed to generate presigned URL for ${filename}` 
        }, 500);
      }

      presignedUrls.push({
        filename,
        url: result.url,
        expiresAt,
      });
    }

    return c.json({
      jobId,
      shootId,
      urls: presignedUrls,
      expiresAt,
    });
  } catch (error) {
    console.error("iOS presigned URL generation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/ios/upload/confirm - Confirm upload completion and trigger AI processing
app.post("/api/ios/upload/confirm", iosUploadLimiter, async (c) => {
  try {
    // Authenticate user via JWT Bearer token
    const bearerUser = await getBearerUser(c);
    if (!bearerUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { jobId, shootId, files } = body;

    // Validation
    if (!jobId || !shootId || !Array.isArray(files) || files.length === 0) {
      return c.json({ 
        error: "Missing required fields: jobId, shootId, and files array" 
      }, 400);
    }

    // Verify job exists and belongs to user (or user is admin)
    const job = await storage.getJob(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    if (job.userId !== bearerUser.user.id && bearerUser.user.role !== "admin") {
      return c.json({ error: "Access denied" }, 403);
    }

    // Verify shoot exists
    const shoot = await storage.getShoot(shootId);
    if (!shoot || shoot.jobId !== jobId) {
      return c.json({ error: "Shoot not found or does not belong to job" }, 404);
    }

    // Process uploaded files and create image records
    const processedImages: Array<{ filename: string; imageId: string; stackNumber?: string }> = [];

    for (const file of files) {
      const { filename, filesize, contentType } = file;
      
      if (!filename || typeof filename !== 'string') {
        console.warn(`Skipping invalid filename: ${filename}`);
        continue;
      }

      // Extract metadata from filename (v3.1 schema)
      const stackNumber = extractStackNumberFromFilename(filename) || "001";
      const roomType = extractRoomTypeFromFilename(filename) || "";

      // Check if stack exists, create if not
      const existingStacks = await storage.getShootStacks(shootId);
      let stack = existingStacks.find(s => s.stackNumber === stackNumber);
      
      if (!stack) {
        stack = await storage.createStack(
          shootId,
          stackNumber,
          1, // frameCount - will be updated later
          roomType || "unassigned"
        );
      }

      // Create image record
      const filePath = generateObjectPath(jobId, shootId, filename, 'raw');
      const image = await storage.createImage({
        shootId,
        stackId: stack.id,
        originalFilename: filename,
        filePath,
        fileSize: filesize || 0,
        mimeType: contentType || "application/octet-stream",
      });

      processedImages.push({
        filename,
        imageId: image.id,
        stackNumber,
      });
    }

    // Update shoot status to indicate upload completion
    await storage.updateShootStatus(shootId, "uploaded", "updatedAt");

    // Trigger AI processing in background (CogVLM for image analysis, OCR, etc.)
    // This would typically enqueue background jobs for:
    // 1. Image quality analysis
    // 2. Room detection/classification
    // 3. OCR for text extraction
    // 4. Auto-stacking bracketed exposures
    console.log(`🚀 Triggering AI processing for shoot ${shootId} (${processedImages.length} images)`);
    
    // TODO: Implement background job queue for AI processing
    // await scheduleAICaptioning(shootId);

    return c.json({
      success: true,
      jobId,
      shootId,
      processedImages,
      message: `Successfully processed ${processedImages.length} images. AI analysis queued.`,
    });
  } catch (error) {
    console.error("iOS upload confirmation error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ====================================================================
// End iOS Capture App API Endpoints
// ====================================================================

// GET /api/services - Get service catalog from JSON file (public endpoint)
app.get("/api/services", async (c) => {
  try {
    const servicesData = await import("../data/preise_piximmo_internal.json");
    // Return the default export which contains services and meta
    return c.json(servicesData.default || servicesData);
  } catch (error) {
    console.error("Get services error:", error);
    return c.json({ error: "Failed to load services" }, 500);
  }
});

// GET /api/roomtypes - Get room taxonomy (public endpoint)
app.get("/api/roomtypes", async (c) => {
  try {
    const { 
      ALL_ROOM_TYPES, 
      getRoomsByCategory, 
      getAllRoomsWithMeta,
      ROOM_SYNONYMS,
      ROOM_CATEGORIES,
      KEYBOARD_SHORTCUTS,
    } = await import("../shared/room-types");
    
    return c.json({
      roomTypes: ALL_ROOM_TYPES,
      byCategory: getRoomsByCategory(),
      withMeta: getAllRoomsWithMeta(),
      synonyms: ROOM_SYNONYMS,
      categories: ROOM_CATEGORIES,
      shortcuts: KEYBOARD_SHORTCUTS,
      version: "v3.1",
    });
  } catch (error) {
    console.error("Get room types error:", error);
    return c.json({ error: "Failed to load room types" }, 500);
  }
});

// POST /api/orders - Create new order (authenticated users only)
app.post("/api/orders", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const validation = createOrderApiSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const orderData: CreateOrderApiInput = validation.data;

    // Load services from JSON to validate and calculate prices
    const servicesData = await import("../data/preise_piximmo_internal.json");
    const servicesList = servicesData.services;
    const VAT_RATE = servicesData.meta.vat_rate; // 0.19

    // Server-side price calculation (don't trust client)
    let totalNet = 0;
    const validatedItems: Array<{ code: string; unit: string; qty: number; price: number }> = [];

    for (const item of orderData.items) {
      const service = servicesList.find((s: any) => s.code === item.code);
      
      if (!service) {
        return c.json({ error: `Invalid service code: ${item.code}` }, 400);
      }

      let itemTotal = 0;
      
      if (service.unit === "per_km") {
        // AEX service - only valid for EXT region
        if (orderData.region !== "EXT") {
          return c.json({ error: `Service ${item.code} (per_km) is only valid for EXT region` }, 400);
        }
        // Calculate: kilometers × 2 (round trip) × price
        const km = orderData.kilometers || 0;
        itemTotal = km * 2 * (service.price_net || 0);
      } else if (service.unit === "per_item") {
        // Per-item services like FEX, B02, etc.
        itemTotal = (service.price_net || 0) * item.qty;
      } else if (service.unit === "flat") {
        // Flat-rate services
        itemTotal = service.price_net || 0;
      }
      // Note: "range" and "from" services have null price_net and are handled as special quotes

      totalNet += itemTotal;
      validatedItems.push({
        code: item.code,
        unit: service.unit,
        qty: item.qty,
        price: itemTotal,
      });
    }

    // Calculate VAT and gross
    const vatAmount = totalNet * VAT_RATE;
    const grossAmount = totalNet + vatAmount;

    // Create booking record
    const serviceSelections: Record<string, number> = {};
    orderData.items.forEach(item => {
      serviceSelections[item.code] = item.qty;
    });

    const booking = await storage.createBooking(authUser.user.id, {
      region: orderData.region,
      kilometers: orderData.kilometers,
      contactName: orderData.contact.name,
      contactEmail: orderData.contact.email,
      contactMobile: orderData.contact.mobile,
      propertyName: orderData.propertyName,
      propertyAddress: orderData.propertyAddress,
      // Google Maps verified address data
      addressLat: orderData.addressLat,
      addressLng: orderData.addressLng,
      addressPlaceId: orderData.addressPlaceId,
      addressFormatted: orderData.addressFormatted,
      propertyType: orderData.propertyType,
      preferredDate: orderData.preferredDate,
      preferredTime: orderData.preferredTime,
      specialRequirements: orderData.specialRequirements,
      totalNetPrice: Math.round(totalNet * 100), // Store in cents
      vatAmount: Math.round(vatAmount * 100), // Store in cents
      grossAmount: Math.round(grossAmount * 100), // Store in cents
      agbAccepted: orderData.agbAccepted,
      serviceSelections,
    });

    // Return order with calculated totals
    const response = {
      id: booking.booking.id,
      region: orderData.region,
      kilometers: orderData.kilometers,
      contact: orderData.contact,
      propertyName: orderData.propertyName,
      propertyAddress: orderData.propertyAddress,
      propertyType: orderData.propertyType,
      preferredDate: orderData.preferredDate,
      preferredTime: orderData.preferredTime,
      specialRequirements: orderData.specialRequirements,
      agbAccepted: orderData.agbAccepted,
      items: validatedItems,
      totals: {
        net: totalNet,
        vat_rate: VAT_RATE,
        vat_amount: vatAmount,
        gross: grossAmount,
        currency: "EUR",
      },
      createdAt: booking.booking.createdAt,
      status: booking.booking.status,
    };

    console.log(`✅ Order created: ${booking.booking.id} for ${authUser.user.email}`);

    // Forward to Tidycal webhook for SMS notification
    const tidycalWebhookUrl = process.env.TIDYCAL_WEBHOOK_URL;
    if (tidycalWebhookUrl) {
      try {
        const webhookPayload = {
          source: "pix.immo",
          event: "order.created",
          order_id: booking.booking.id,
          region: orderData.region,
          address: orderData.propertyAddress || "",
          contact: {
            name: orderData.contact.name || "",
            email: orderData.contact.email || "",
            mobile: orderData.contact.mobile,
          },
          items: validatedItems.map(item => ({
            code: item.code,
            unit: item.unit,
            qty: item.qty,
          })),
          totals: {
            net: totalNet,
            vat_rate: VAT_RATE,
            vat_amount: vatAmount,
            gross: grossAmount,
            currency: "EUR",
          },
        };

        const tidycalResponse = await fetch(tidycalWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(process.env.TIDYCAL_API_KEY 
              ? { "Authorization": `Bearer ${process.env.TIDYCAL_API_KEY}` }
              : {}
            ),
          },
          body: JSON.stringify(webhookPayload),
        });

        if (tidycalResponse.ok) {
          console.log(`✅ Tidycal webhook sent successfully for order ${booking.booking.id}`);
        } else {
          console.warn(`⚠️  Tidycal webhook failed (${tidycalResponse.status}): ${await tidycalResponse.text()}`);
        }
      } catch (webhookError) {
        console.error(`❌ Tidycal webhook error for order ${booking.booking.id}:`, webhookError);
        // Don't fail the order creation if webhook fails
      }
    } else {
      console.log("ℹ️  TIDYCAL_WEBHOOK_URL not configured, skipping SMS notification");
    }

    return c.json(response, 201);
  } catch (error) {
    console.error("Create order error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/orders - Get orders (role-based: admins get all, clients get their own)
app.get("/api/orders", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    let orders;
    
    if (authUser.user.role === "admin") {
      // Admins see all orders
      orders = await storage.getAllOrders();
    } else {
      // Clients see only their own orders
      orders = await storage.getUserOrders(authUser.user.id);
    }

    return c.json({ orders });
  } catch (error) {
    console.error("Get orders error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/orders/:id - Get single order (owner or admin only)
app.get("/api/orders/:id", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const orderId = c.req.param("id");
    const order = await storage.getOrder(orderId);

    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    // Check authorization: must be order owner or admin
    if (order.userId !== authUser.user.id && authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: You can only view your own orders" }, 403);
    }

    return c.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /api/orders/:id/status - Update order status (admin only)
app.patch("/api/orders/:id/status", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    // Only admins can update order status
    if (authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const orderId = c.req.param("id");
    const body = await c.req.json();
    const { status } = body;

    // Validate status
    const validStatuses = ["pending", "confirmed", "completed", "cancelled"];
    if (!status || !validStatuses.includes(status)) {
      return c.json({ error: "Invalid status. Must be one of: pending, confirmed, completed, cancelled" }, 400);
    }

    const order = await storage.getOrder(orderId);
    if (!order) {
      return c.json({ error: "Order not found" }, 404);
    }

    const updatedOrder = await storage.updateOrderStatus(orderId, status);

    return c.json({ order: updatedOrder });
  } catch (error) {
    console.error("Update order status error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== Booking Routes ==========

// POST /api/bookings - Create new booking (authenticated users only) - DEPRECATED, use /api/orders instead
app.post("/api/bookings", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { region, kilometers, contactName, contactEmail, contactMobile, propertyName, propertyAddress, propertyType, preferredDate, preferredTime, specialRequirements, agbAccepted, serviceSelections } = body;

    if (!propertyName) {
      return c.json({ error: "Property name is required" }, 400);
    }

    if (!contactMobile) {
      return c.json({ error: "Mobile number is required" }, 400);
    }

    if (!region) {
      return c.json({ error: "Region is required" }, 400);
    }

    if (!serviceSelections || Object.keys(serviceSelections).length === 0) {
      return c.json({ error: "At least one service must be selected" }, 400);
    }

    // Calculate total net price from service selections
    let totalNetPrice = 0;
    const allServices = await storage.getAllServices();
    const VAT_RATE = 0.19;
    
    for (const [serviceId, quantity] of Object.entries(serviceSelections)) {
      if (typeof quantity === 'number' && quantity > 0) {
        const service = allServices.find(s => s.id === serviceId);
        if (service && service.netPrice) {
          totalNetPrice += service.netPrice * quantity;
        }
      }
    }

    const vatAmount = totalNetPrice * VAT_RATE;
    const grossAmount = totalNetPrice + vatAmount;

    const result = await storage.createBooking(authUser.user.id, {
      region: region || "HH",
      kilometers,
      contactName,
      contactEmail,
      contactMobile,
      propertyName,
      propertyAddress,
      propertyType,
      preferredDate,
      preferredTime,
      specialRequirements,
      totalNetPrice,
      vatAmount,
      grossAmount,
      agbAccepted: agbAccepted || false,
      serviceSelections,
    });

    return c.json(result, 201);
  } catch (error) {
    console.error("Create booking error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/bookings - Get bookings (role-based: admins get all, clients get their own)
app.get("/api/bookings", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    let bookings;
    
    if (authUser.user.role === "admin") {
      bookings = await storage.getAllBookings();
    } else {
      bookings = await storage.getUserBookings(authUser.user.id);
    }

    return c.json({ bookings });
  } catch (error) {
    console.error("Get bookings error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== Client Gallery Routes ==========

// GET /api/client/gallery - Get client's gallery (jobs with approved images)
app.get("/api/client/gallery", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const galleryData = await storage.getClientGallery(authUser.user.id);

    return c.json({ jobs: galleryData });
  } catch (error) {
    console.error("Get client gallery error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/image/:id - Serve image by ID (authenticated)
app.get("/api/image/:id", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const imageId = c.req.param("id");
    const image = await storage.getEditedImage(imageId);

    if (!image) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Verify the image belongs to the user
    const shoot = await storage.getShoot(image.shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }

    const job = await storage.getJob(shoot.jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // Admin can view all, clients can only view their own
    if (authUser.user.role !== "admin" && job.userId !== authUser.user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Get image from object storage
    const { Client } = await import("@replit/object-storage");
    const objectStorage = new Client();
    
    try {
      const result = await objectStorage.downloadAsBytes(image.filePath);
      
      if (!result.ok) {
        console.error("Error fetching image from storage:", result.error);
        return c.json({ error: "Image not found in storage" }, 404);
      }

      const imageData = Array.isArray(result.value) ? result.value[0] : result.value;
      
      // Determine content type
      let contentType = "image/jpeg";
      if (image.filename.toLowerCase().endsWith(".png")) {
        contentType = "image/png";
      } else if (image.filename.toLowerCase().endsWith(".webp")) {
        contentType = "image/webp";
      }

      return new Response(imageData, {
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=31536000",
        },
      });
    } catch (storageError) {
      console.error("Error fetching image from storage:", storageError);
      return c.json({ error: "Image not found in storage" }, 404);
    }
  } catch (error) {
    console.error("Get image error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/download/image/:id - Download image by ID (authenticated)
app.get("/api/download/image/:id", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const imageId = c.req.param("id");
    const image = await storage.getEditedImage(imageId);

    if (!image) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Verify the image belongs to the user
    const shoot = await storage.getShoot(image.shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }

    const job = await storage.getJob(shoot.jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }

    // Admin can download all, clients can only download their own
    if (authUser.user.role !== "admin" && job.userId !== authUser.user.id) {
      return c.json({ error: "Forbidden" }, 403);
    }

    // Get image from object storage
    const { Client } = await import("@replit/object-storage");
    const objectStorage = new Client();
    
    try {
      const result = await objectStorage.downloadAsBytes(image.filePath);
      
      if (!result.ok) {
        console.error("Error fetching image from storage:", result.error);
        return c.json({ error: "Image not found in storage" }, 404);
      }

      const imageData = Array.isArray(result.value) ? result.value[0] : result.value;
      
      // Determine content type
      let contentType = "image/jpeg";
      if (image.filename.toLowerCase().endsWith(".png")) {
        contentType = "image/png";
      } else if (image.filename.toLowerCase().endsWith(".webp")) {
        contentType = "image/webp";
      }

      return new Response(imageData, {
        headers: {
          "Content-Type": contentType,
          "Content-Disposition": `attachment; filename="${image.filename}"`,
        },
      });
    } catch (storageError) {
      console.error("Error fetching image from storage:", storageError);
      return c.json({ error: "Image not found in storage" }, 404);
    }
  } catch (error) {
    console.error("Download image error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== Image Interaction Routes (Favorites & Comments) ==========

// Helper to verify image ownership
async function verifyImageOwnership(imageId: string, userId: string, userRole: string): Promise<{ authorized: boolean; error?: string }> {
  const image = await storage.getEditedImage(imageId);
  if (!image) {
    return { authorized: false, error: "Image not found" };
  }

  const shoot = await storage.getShoot(image.shootId);
  if (!shoot) {
    return { authorized: false, error: "Shoot not found" };
  }

  const job = await storage.getJob(shoot.jobId);
  if (!job) {
    return { authorized: false, error: "Job not found" };
  }

  // Admin can access all, clients can only access their own
  if (userRole !== "admin" && job.userId !== userId) {
    return { authorized: false, error: "Forbidden" };
  }

  return { authorized: true };
}

// POST /api/image/:id/favorite - Toggle favorite on an image
app.post("/api/image/:id/favorite", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const imageId = c.req.param("id");
    
    // Verify ownership before allowing favorite
    const ownership = await verifyImageOwnership(imageId, authUser.user.id, authUser.user.role);
    if (!ownership.authorized) {
      return c.json({ error: ownership.error }, ownership.error === "Image not found" || ownership.error === "Shoot not found" || ownership.error === "Job not found" ? 404 : 403);
    }

    const result = await storage.toggleFavorite(authUser.user.id, imageId);
    return c.json(result);
  } catch (error) {
    console.error("Toggle favorite error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/favorites - Get user's favorited image IDs
app.get("/api/favorites", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const favorites = await storage.getUserFavorites(authUser.user.id);
    return c.json({ favorites });
  } catch (error) {
    console.error("Get favorites error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// POST /api/image/:id/comment - Add a comment to an image
app.post("/api/image/:id/comment", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const imageId = c.req.param("id");
    const body = await c.req.json();
    
    if (!body.comment || typeof body.comment !== "string" || body.comment.trim().length === 0) {
      return c.json({ error: "Comment is required" }, 400);
    }

    // Verify ownership before allowing comment
    const ownership = await verifyImageOwnership(imageId, authUser.user.id, authUser.user.role);
    if (!ownership.authorized) {
      return c.json({ error: ownership.error }, ownership.error === "Image not found" || ownership.error === "Shoot not found" || ownership.error === "Job not found" ? 404 : 403);
    }

    const altText = body.altText && typeof body.altText === "string" ? body.altText.trim() : undefined;
    const comment = await storage.addComment(authUser.user.id, imageId, body.comment.trim(), altText);
    return c.json(comment, 201);
  } catch (error) {
    console.error("Add comment error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/image/:id/comments - Get comments for an image
app.get("/api/image/:id/comments", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const imageId = c.req.param("id");
    
    // Verify ownership before retrieving comments
    const ownership = await verifyImageOwnership(imageId, authUser.user.id, authUser.user.role);
    if (!ownership.authorized) {
      return c.json({ error: ownership.error }, ownership.error === "Image not found" || ownership.error === "Shoot not found" || ownership.error === "Job not found" ? 404 : 403);
    }

    const comments = await storage.getImageComments(imageId);
    return c.json({ comments });
  } catch (error) {
    console.error("Get comments error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /api/images/:id/classify - Classify a single RAW image with room type
app.patch("/api/images/:id/classify", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    // Only admins can classify images
    if (authUser.user.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const imageId = c.req.param("id");
    const body = await c.req.json();
    const { classifyImageSchema } = await import("@shared/schema");
    
    const validation = classifyImageSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: validation.error.errors[0].message }, 400);
    }

    const { roomType } = validation.data;

    // Validate room type against taxonomy
    const { isValidRoomType } = await import("../shared/room-types");
    if (!isValidRoomType(roomType)) {
      return c.json({ error: `Invalid room type: ${roomType}` }, 400);
    }

    // Get the image
    const { db } = await import("./db");
    const { images } = await import("@shared/schema");
    const { eq } = await import("drizzle-orm");
    
    const existingImage = await db.query.images.findFirst({
      where: eq(images.id, imageId),
    });

    if (!existingImage) {
      return c.json({ error: "Image not found" }, 404);
    }

    // Update the image with room type and classification timestamp
    await db
      .update(images)
      .set({
        roomType,
        classifiedAt: Date.now(),
      })
      .where(eq(images.id, imageId));

    return c.json({
      success: true,
      imageId,
      roomType,
      classifiedAt: Date.now(),
    });
  } catch (error) {
    console.error("Classify image error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// PATCH /api/images/classify/bulk - Classify multiple RAW images with the same room type
app.patch("/api/images/classify/bulk", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    // Only admins can classify images
    if (authUser.user.role !== "admin") {
      return c.json({ error: "Admin access required" }, 403);
    }

    const body = await c.req.json();
    const { bulkClassifyImagesSchema } = await import("@shared/schema");
    
    const validation = bulkClassifyImagesSchema.safeParse(body);
    if (!validation.success) {
      return c.json({ error: validation.error.errors[0].message }, 400);
    }

    const { imageIds, roomType } = validation.data;

    // Validate room type against taxonomy
    const { isValidRoomType } = await import("../shared/room-types");
    if (!isValidRoomType(roomType)) {
      return c.json({ error: `Invalid room type: ${roomType}` }, 400);
    }

    // Update all images
    const { db } = await import("./db");
    const { images } = await import("@shared/schema");
    const { inArray } = await import("drizzle-orm");
    
    const classifiedAt = Date.now();
    
    await db
      .update(images)
      .set({
        roomType,
        classifiedAt,
      })
      .where(inArray(images.id, imageIds));

    return c.json({
      success: true,
      count: imageIds.length,
      roomType,
      classifiedAt,
    });
  } catch (error) {
    console.error("Bulk classify images error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// GET /api/download/favorites - Download all favorited images as ZIP
app.get("/api/download/favorites", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const favoriteIds = await storage.getUserFavorites(authUser.user.id);
    
    if (favoriteIds.length === 0) {
      return c.json({ error: "No favorites to download" }, 400);
    }

    // Get all favorited images with authorization check
    const images = [];
    for (const imageId of favoriteIds) {
      const image = await storage.getEditedImage(imageId);
      if (!image) continue;

      // Verify ownership
      const shoot = await storage.getShoot(image.shootId);
      if (!shoot) continue;

      const job = await storage.getJob(shoot.jobId);
      if (!job) continue;

      // Admin can download all, clients can only download their own
      if (authUser.user.role === "admin" || job.userId === authUser.user.id) {
        images.push(image);
      }
    }

    if (images.length === 0) {
      return c.json({ error: "No authorized favorites to download" }, 400);
    }

    // Create ZIP archive
    const archiver = (await import("archiver")).default;
    const { Readable } = await import("stream");
    const { Client } = await import("@replit/object-storage");
    const objectStorage = new Client();

    // Create a readable stream that will be returned
    const archive = archiver("zip", {
      zlib: { level: 9 }
    });

    // Fetch images from object storage and add to archive
    for (const image of images) {
      try {
        const result = await objectStorage.downloadAsBytes(image.filePath);
        
        if (result.ok) {
          const imageData = Array.isArray(result.value) ? result.value[0] : result.value;
          archive.append(Buffer.from(imageData), { name: image.filename });
        }
      } catch (err) {
        console.error(`Error fetching image ${image.id}:`, err);
        // Continue with other images
      }
    }

    // Finalize the archive
    archive.finalize();

    return new Response(archive as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="pix-immo-favorites-${Date.now()}.zip"`,
      },
    });
  } catch (error) {
    console.error("Download favorites error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== Sprint 1: Photo Workflow Routes ==========

// Helper to ensure demo user exists
async function ensureDemoUser() {
  const demoEmail = "demo@pix.immo";
  let demoUser = await storage.getUserByEmail(demoEmail);
  
  if (!demoUser) {
    // Create demo user for development (no password hash for demo)
    demoUser = await storage.createUser(demoEmail, "demo-password-hash", "admin");
    console.log("✓ Demo user created:", demoEmail);
  }
  
  return demoUser;
}

// POST /api/jobs - Create a new job
app.post("/api/jobs", async (c) => {
  try {
    const body = await c.req.json();
    const validation = createJobSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const demoUser = await ensureDemoUser();
    const { propertyName, propertyAddress } = validation.data;
    const job = await storage.createJob(demoUser.id, propertyName, propertyAddress);
    
    return c.json(job, 201);
  } catch (error) {
    console.error("Error creating job:", error);
    return c.json({ error: "Failed to create job" }, 500);
  }
});

// GET /api/jobs - Get all jobs
app.get("/api/jobs", async (c) => {
  try {
    const jobs = await storage.getAllJobs();
    return c.json(jobs);
  } catch (error) {
    console.error("Error getting jobs:", error);
    return c.json({ error: "Failed to get jobs" }, 500);
  }
});

// GET /api/jobs/:jobId/shoots - Get all shoots for a specific job
app.get("/api/jobs/:jobId/shoots", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const shoots = await storage.getJobShoots(jobId);
    return c.json(shoots);
  } catch (error) {
    console.error("Error getting job shoots:", error);
    return c.json({ error: "Failed to get shoots" }, 500);
  }
});

// GET /api/jobs/:id - Get single job
app.get("/api/jobs/:id", async (c) => {
  try {
    const jobId = c.req.param("id");
    const job = await storage.getJob(jobId);
    
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    return c.json(job);
  } catch (error) {
    console.error("Error getting job:", error);
    return c.json({ error: "Failed to get job" }, 500);
  }
});

// POST /api/uploads/init - Initialize upload
app.post("/api/uploads/init", async (c) => {
  try {
    const body = await c.req.json();
    const validation = initUploadSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { jobNumber } = validation.data;
    
    // Verify job exists
    const job = await storage.getJobByNumber(jobNumber);
    if (!job) {
      return c.json({ error: "Job not found with this job number" }, 404);
    }
    
    // Create shoot
    const shoot = await storage.createShoot(job.id);
    
    return c.json({
      shootId: shoot.id,
      shootCode: shoot.shootCode,
      jobId: job.id,
      jobNumber: job.jobNumber,
    });
  } catch (error) {
    console.error("Error initializing upload:", error);
    return c.json({ error: "Failed to initialize upload" }, 500);
  }
});

// GET /api/shoots/:id - Get shoot details
app.get("/api/shoots/:id", async (c) => {
  try {
    const shootId = c.req.param("id");
    const shoot = await storage.getShoot(shootId);
    
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    return c.json(shoot);
  } catch (error) {
    console.error("Error getting shoot:", error);
    return c.json({ error: "Failed to get shoot" }, 500);
  }
});

// GET /api/shoots/:id/stacks - Get stacks for shoot
app.get("/api/shoots/:id/stacks", async (c) => {
  try {
    const shootId = c.req.param("id");
    const stacks = await storage.getShootStacks(shootId);
    
    return c.json(stacks);
  } catch (error) {
    console.error("Error getting stacks:", error);
    return c.json({ error: "Failed to get stacks" }, 500);
  }
});

// PUT /api/stacks/:id/room-type - Assign room type to stack
app.put("/api/stacks/:id/room-type", async (c) => {
  try {
    const stackId = c.req.param("id");
    const body = await c.req.json();
    const validation = assignRoomTypeSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const { roomType } = validation.data;
    
    // Update room type
    await storage.updateStackRoomType(stackId, roomType);
    
    // Get updated stack
    const stack = await storage.getStack(stackId);
    
    return c.json(stack);
  } catch (error) {
    console.error("Error updating room type:", error);
    return c.json({ error: "Failed to update room type" }, 500);
  }
});

// REMOVED: Legacy multipart upload route
// The old POST /api/uploads/:shootId route has been replaced with the presigned upload flow.
// Clients should now use POST /api/shoots/:id/presign to get presigned URLs and upload directly to object storage.
// This eliminates server-side file buffering and improves security and scalability.

// POST /api/projects/:jobId/handoff/:shootId - Generate handoff package
app.post("/api/projects/:jobId/handoff/:shootId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const shootId = c.req.param("shootId");
    
    // Verify job and shoot exist
    const job = await storage.getJob(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    // Generate handoff package
    const packageResult = await generateHandoffPackage(jobId, shootId);
    if (!packageResult.ok) {
      return c.json({ error: packageResult.error || "Failed to generate handoff package" }, 500);
    }
    
    // Generate download token
    const downloadTokenResult = await generateHandoffToken(shootId);
    if (!downloadTokenResult.ok) {
      return c.json({ error: downloadTokenResult.error || "Failed to generate download token" }, 500);
    }
    
    // Generate upload token
    const uploadToken = randomBytes(32).toString('hex');
    const expiresAt = Date.now() + (36 * 60 * 60 * 1000); // 36 hours
    await storage.createEditorToken(shootId, 'upload', uploadToken, expiresAt);
    
    // Send notification
    const downloadUrl = `${process.env.BASE_URL || 'http://localhost:5000'}/api/handoff/download/${downloadTokenResult.token}`;
    await notifyHandoffReady({
      email: "demo@pix.immo",
      jobNumber: job.jobNumber,
      shootCode: shoot.shootCode,
      downloadUrl,
    });
    
    return c.json({
      downloadUrl: `/api/handoff/download/${downloadTokenResult.token}`,
      uploadToken: uploadToken,
      expiresAt: downloadTokenResult.expiresAt,
    });
  } catch (error) {
    console.error("Error generating handoff package:", error);
    return c.json({ error: "Failed to generate handoff package" }, 500);
  }
});

// GET /api/handoff/download/:token - Download handoff package
app.get("/api/handoff/download/:token", async (c) => {
  try {
    const token = c.req.param("token");
    
    // Verify token
    const editorToken = await storage.getEditorToken(token);
    if (!editorToken || editorToken.tokenType !== 'download') {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
    
    // Get handoff package path
    const shoot = await storage.getShoot(editorToken.shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    const job = await storage.getJob(shoot.jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    // Mark token as used
    await storage.markEditorTokenUsed(token);
    
    // TODO: Stream the ZIP file from object storage
    // For now, return success response
    return c.json({ 
      message: "Download would start here",
      note: "File streaming from object storage needs Hono-compatible implementation"
    });
  } catch (error) {
    console.error("Error downloading handoff package:", error);
    return c.json({ error: "Failed to download handoff package" }, 500);
  }
});

// POST /api/editor/:token/upload - Editor upload endpoint
app.post("/api/editor/:token/upload", async (c) => {
  try {
    const token = c.req.param("token");
    
    // Parse multipart form data
    const formData = await c.req.formData();
    const file = formData.get("package");
    
    if (!file || !(file instanceof File)) {
      return c.json({ error: "No file uploaded" }, 400);
    }
    
    // Verify token
    const editorToken = await storage.getEditorToken(token);
    if (!editorToken || editorToken.tokenType !== 'upload') {
      return c.json({ error: "Invalid or expired token" }, 401);
    }
    
    // Get shoot and job info for notifications
    const shoot = await storage.getShoot(editorToken.shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    const job = await storage.getJob(shoot.jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    // Mark token as used
    await storage.markEditorTokenUsed(token);
    
    // Save uploaded ZIP to object storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `/projects/${job.id}/edits/${editorToken.shootId}/editor_return.zip`;
    
    const uploadResult = await uploadFile(storagePath, buffer, file.type || "application/zip");
    if (!uploadResult.ok) {
      console.error("Failed to upload editor return package:", uploadResult.error);
      return c.json({ error: "Failed to store editor return package" }, 500);
    }
    
    console.log(`📦 Editor uploaded ${file.size} bytes for shoot ${editorToken.shootId} to ${storagePath}`);
    
    // Update shoot status
    await storage.updateShootStatus(editorToken.shootId, 'editor_returned', 'editorReturnedAt');
    
    // Schedule background processing (60-minute quiet window)
    const queueJobId = scheduleEditorReturnProcessing(editorToken.shootId);
    
    // Send notification to producer
    await notifyEditorUploadComplete({
      email: "demo@pix.immo", // TODO: Get from user/job settings
      jobNumber: job.jobNumber,
      shootCode: shoot.shootCode,
      imageCount: 0, // TODO: Get actual count from unpacked ZIP
    });
    
    return c.json({ 
      success: true, 
      message: "Upload received successfully",
      queueJobId,
    });
  } catch (error) {
    console.error("Error handling editor upload:", error);
    return c.json({ error: "Failed to process upload" }, 500);
  }
});

// POST /api/projects/:jobId/process-editor-return/:shootId - Process editor return ZIP
app.post("/api/projects/:jobId/process-editor-return/:shootId", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const shootId = c.req.param("shootId");
    
    // Verify job and shoot exist
    const job = await storage.getJob(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    // Verify shoot status
    if (shoot.status !== 'editor_returned') {
      return c.json({ error: `Cannot process: shoot status is ${shoot.status}, expected 'editor_returned'` }, 400);
    }
    
    console.log(`🔄 Processing editor return for shoot ${shoot.shootCode} (job ${job.jobNumber})`);
    
    // Process the ZIP file
    const result = await processEditorReturnZip(storage, shootId, jobId);
    
    if (!result.success) {
      console.error(`❌ Failed to process editor return:`, result.errors);
      return c.json({ 
        error: "Failed to process editor return", 
        details: result.errors,
        processedCount: result.processedCount,
        skippedCount: result.skippedCount,
      }, 500);
    }
    
    console.log(`✅ Successfully processed editor return: ${result.processedCount} images, ${result.skippedCount} skipped`);
    
    return c.json({
      success: true,
      processedCount: result.processedCount,
      skippedCount: result.skippedCount,
      errors: result.errors,
      message: `Processed ${result.processedCount} edited images`,
    });
  } catch (error) {
    console.error("Error processing editor return:", error);
    return c.json({ error: "Failed to process editor return" }, 500);
  }
});

// GET /api/projects/:jobId/shoots/:shootId/edited-images - Get edited images for client review
app.get("/api/projects/:jobId/shoots/:shootId/edited-images", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const shootId = c.req.param("shootId");
    
    // Verify job and shoot exist
    const job = await storage.getJob(jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    // Fetch edited images
    const editedImages = await storage.getEditedImagesByShoot(shootId);
    
    // Fetch stacks for before/after comparison
    const stacks = await storage.getStacksByShoot(shootId);
    
    // Fetch original images for each stack
    const stacksWithImages = await Promise.all(
      stacks.map(async (stack) => {
        const originalImages = await storage.getStackImages(stack.id);
        return {
          ...stack,
          images: originalImages,
        };
      })
    );
    
    // Group edited images by version and room type
    const groupedImages: Record<number, Record<string, any[]>> = {};
    
    for (const editedImage of editedImages) {
      const version = editedImage.version;
      const roomType = editedImage.roomType || 'uncategorized';
      
      if (!groupedImages[version]) {
        groupedImages[version] = {};
      }
      
      if (!groupedImages[version][roomType]) {
        groupedImages[version][roomType] = [];
      }
      
      // Find matching stack for before/after comparison
      const matchingStack = editedImage.stackId 
        ? stacksWithImages.find(s => s.id === editedImage.stackId)
        : null;
      
      groupedImages[version][roomType].push({
        ...editedImage,
        stack: matchingStack,
      });
    }
    
    return c.json({
      job,
      shoot,
      editedImages: groupedImages,
      totalImages: editedImages.length,
    });
  } catch (error) {
    console.error("Error fetching edited images:", error);
    return c.json({ error: "Failed to fetch edited images" }, 500);
  }
});

// PUT /api/edited-images/:id/approve - Approve edited image
app.put("/api/edited-images/:id/approve", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { notes } = body;
    
    const editedImage = await storage.getEditedImage(id);
    if (!editedImage) {
      return c.json({ error: "Edited image not found" }, 404);
    }
    
    await storage.updateEditedImageApprovalStatus(id, 'approved', 'clientApprovedAt');
    
    console.log(`✅ Image ${id} approved${notes ? ` with notes: ${notes}` : ''}`);
    
    return c.json({
      success: true,
      message: "Image approved",
      imageId: id,
    });
  } catch (error) {
    console.error("Error approving image:", error);
    return c.json({ error: "Failed to approve image" }, 500);
  }
});

// PUT /api/edited-images/:id/reject - Reject edited image
app.put("/api/edited-images/:id/reject", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json().catch(() => ({}));
    const { notes } = body;
    
    const editedImage = await storage.getEditedImage(id);
    if (!editedImage) {
      return c.json({ error: "Edited image not found" }, 404);
    }
    
    await storage.updateEditedImageApprovalStatus(id, 'rejected', 'clientRejectedAt');
    
    console.log(`❌ Image ${id} rejected${notes ? ` with notes: ${notes}` : ''}`);
    
    return c.json({
      success: true,
      message: "Image rejected",
      imageId: id,
      notes,
    });
  } catch (error) {
    console.error("Error rejecting image:", error);
    return c.json({ error: "Failed to reject image" }, 500);
  }
});

// POST /api/projects/:jobId/shoots/:shootId/generate-handoff - Generate final client handoff
app.post("/api/projects/:jobId/shoots/:shootId/generate-handoff", async (c) => {
  try {
    const jobId = c.req.param("jobId");
    const shootId = c.req.param("shootId");
    const body = await c.req.json().catch(() => ({}));
    const { version } = body;
    
    console.log(`📦 Generating final handoff for job ${jobId}, shoot ${shootId}${version ? `, version ${version}` : ''}`);
    
    const result = await generateFinalHandoff(storage, jobId, shootId, version);
    
    if (!result.success) {
      return c.json({ error: result.error }, 400);
    }
    
    return c.json({
      success: true,
      downloadUrl: result.downloadUrl,
      manifest: result.manifest,
      totalImages: result.totalImages,
    });
  } catch (error) {
    console.error("Error generating handoff:", error);
    return c.json({ error: "Failed to generate handoff package" }, 500);
  }
});

// GET /api/handoff/download/:token - Download handoff package
app.get("/api/handoff/download/:token", async (c) => {
  try {
    const token = c.req.param("token");
    
    // Verify token exists
    const editorToken = await storage.getEditorToken(token);
    if (!editorToken) {
      return c.json({ error: "Invalid or expired download token" }, 401);
    }
    
    // Verify token type
    if (editorToken.tokenType !== 'download') {
      return c.json({ error: "Invalid token type" }, 401);
    }
    
    // Check if token has expired
    if (editorToken.expiresAt < Date.now()) {
      return c.json({ error: "Download token has expired" }, 401);
    }
    
    // Check if token has already been used
    if (editorToken.usedAt) {
      return c.json({ error: "Download token has already been used" }, 401);
    }
    
    // Verify token has an associated file path
    if (!editorToken.filePath) {
      return c.json({ error: "Invalid token: no file path associated" }, 400);
    }
    
    // Mark token as used BEFORE streaming the file
    await storage.markEditorTokenUsed(token);
    
    // Download file from object storage
    const downloadResult = await downloadFile(editorToken.filePath);
    
    if (!downloadResult.ok || !downloadResult.value) {
      return c.json({ error: "File not found" }, 404);
    }
    
    // Return file
    const filename = editorToken.filePath.split('/').pop() || 'download.zip';
    return c.body(downloadResult.value, 200, {
      'Content-Type': 'application/zip',
      'Content-Disposition': `attachment; filename="${filename}"`,
    });
  } catch (error) {
    console.error("Error downloading handoff:", error);
    return c.json({ error: "Failed to download file" }, 500);
  }
});

// ========== Editorial Management (Admin Only) ==========

// Get all editorial items (with optional filters)
app.get("/api/editorial", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const items = await storage.getEditorialItems();
    return c.json({ items });
  } catch (error) {
    console.error("Get editorial items error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create new editorial item
app.post("/api/editorial", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const body = await c.req.json();
    
    const item = await storage.createEditorialItem({
      ...body,
      createdBy: authUser.user.id,
    });

    return c.json({ item });
  } catch (error) {
    console.error("Create editorial item error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update editorial item
app.patch("/api/editorial/:id", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const id = c.req.param("id");
    const body = await c.req.json();
    
    const item = await storage.updateEditorialItem(id, body);
    
    if (!item) {
      return c.json({ error: "Editorial item not found" }, 404);
    }

    return c.json({ item });
  } catch (error) {
    console.error("Update editorial item error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete editorial item
app.delete("/api/editorial/:id", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const id = c.req.param("id");
    await storage.deleteEditorialItem(id);

    return c.json({ success: true });
  } catch (error) {
    console.error("Delete editorial item error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Add comment to editorial item
app.post("/api/editorial/:id/comments", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const itemId = c.req.param("id");
    const body = await c.req.json();
    
    const comment = await storage.createEditorialComment({
      itemId,
      userId: authUser.user.id,
      comment: body.comment,
    });

    return c.json({ comment });
  } catch (error) {
    console.error("Create editorial comment error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get comments for editorial item
app.get("/api/editorial/:id/comments", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Forbidden: Admin access required" }, 403);
    }

    const itemId = c.req.param("id");
    const comments = await storage.getEditorialComments(itemId);

    return c.json({ comments });
  } catch (error) {
    console.error("Get editorial comments error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== SEO Metadata Management (Admin Only) ==========

// Get all SEO metadata
app.get("/api/seo-metadata", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 403);
    }
    
    const metadata = await storage.getAllSeoMetadata();
    return c.json({ metadata });
  } catch (error) {
    console.error("Get SEO metadata error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get single SEO metadata by page path
app.get("/api/seo-metadata/:pagePath", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 403);
    }
    
    const pagePath = decodeURIComponent(c.req.param("pagePath"));
    const metadata = await storage.getSeoMetadata(pagePath);
    
    if (!metadata) {
      return c.json({ error: "Not found" }, 404);
    }
    
    return c.json({ metadata });
  } catch (error) {
    console.error("Get SEO metadata error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Upsert SEO metadata
app.post("/api/seo-metadata", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 403);
    }
    
    const body = await c.req.json();
    const { pagePath, pageTitle, metaDescription, ogImage, altText } = body;
    
    if (!pagePath || !pageTitle || !metaDescription) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const metadata = await storage.upsertSeoMetadata({
      pagePath,
      pageTitle,
      metaDescription,
      ogImage,
      altText,
      updatedBy: authUser.user.id,
    });
    
    return c.json({ metadata });
  } catch (error) {
    console.error("Upsert SEO metadata error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete SEO metadata
app.delete("/api/seo-metadata/:pagePath", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser || authUser.user.role !== "admin") {
      return c.json({ error: "Unauthorized" }, 403);
    }
    
    const pagePath = decodeURIComponent(c.req.param("pagePath"));
    await storage.deleteSeoMetadata(pagePath);
    
    return c.json({ success: true });
  } catch (error) {
    console.error("Delete SEO metadata error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Health check endpoint (legacy, kept for backwards compatibility)
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Healthz endpoint for monitoring and CI/CD
app.get("/healthz", (c) => {
  return c.json({
    status: "ok",
    env: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    service: "pix.immo",
    version: "1.0.0",
  });
});

// Start server with async initialization (production mode)
async function startServer() {
  const port = process.env.PORT || 5000;

  // Initialize storage before starting server
  await storage.ready();

  // Schedule cleanup job to remove orphaned temp files every 6 hours
  scheduleCleanup(6, 6);

  console.log(`🚀 Server starting on http://0.0.0.0:${port}`);
  console.log(`📝 Auth sandbox available at http://localhost:${port}/public/auth.html`);
  console.log(`💾 Database: PostgreSQL (Neon)`);
  console.log(`🧹 Temp file cleanup scheduled every 6 hours`);

  serve({
    fetch: app.fetch,
    port: Number(port),
    hostname: "0.0.0.0",
  });
}

// Only start if not in development mode (dev.ts handles dev mode)
if (process.env.NODE_ENV !== "development") {
  startServer();
}

// Export Hono app for use in dev.ts
export default app;
