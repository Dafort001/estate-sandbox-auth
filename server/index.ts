import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getConnInfo } from "@hono/node-server/conninfo";
import { storage } from "./storage";
import { hashPassword, verifyPassword, SESSION_CONFIG } from "./auth";
import { signupSchema, loginSchema, passwordResetRequestSchema, passwordResetConfirmSchema, createOrderSchema, createJobSchema, initUploadSchema, assignRoomTypeSchema, type UserResponse } from "@shared/schema";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateTokenPair, verifyAccessToken, extractBearerToken } from "./jwt";
import { randomUUID, randomBytes } from "crypto";
import { rateLimiter } from "hono-rate-limiter";
import { generateHandoffPackage, generateHandoffToken } from "./handoffPackage";
import { scheduleEditorReturnProcessing } from "./backgroundQueue";
import { notifyHandoffReady, notifyEditorUploadComplete } from "./notifications";
import { processUploadedFiles } from "./uploadHandler";
import { processEditorReturnZip } from "./zipProcessor";
import { generateFinalHandoff } from "./finalHandoff";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { tmpdir } from "os";
import { uploadFile, downloadFile } from "./objectStorage";

const app = new Hono();

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

// GET /api/services - Get all active services for price list
app.get("/api/services", async (c) => {
  try {
    const authUser = await getAuthUser(c);

    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const services = await storage.getAllServices();
    return c.json(services);
  } catch (error) {
    console.error("Get services error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});

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

// POST /api/orders - Create new order (authenticated users only)
app.post("/api/orders", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const validation = createOrderSchema.safeParse(body);

    if (!validation.success) {
      return c.json(
        { error: validation.error.errors[0].message },
        400,
      );
    }

    const order = await storage.createOrder(authUser.user.id, validation.data);

    return c.json({ order }, 201);
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

// POST /api/bookings - Create new booking (authenticated users only)
app.post("/api/bookings", async (c) => {
  try {
    const authUser = await getAuthUser(c);
    
    if (!authUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const body = await c.req.json();
    const { propertyName, propertyAddress, propertyType, preferredDate, preferredTime, specialRequirements, serviceSelections } = body;

    if (!propertyName || !propertyAddress) {
      return c.json({ error: "Property name and address are required" }, 400);
    }

    if (!serviceSelections || Object.keys(serviceSelections).length === 0) {
      return c.json({ error: "At least one service must be selected" }, 400);
    }

    // Calculate total net price from service selections
    let totalNetPrice = 0;
    const allServices = await storage.getAllServices();
    
    for (const [serviceId, quantity] of Object.entries(serviceSelections)) {
      if (typeof quantity === 'number' && quantity > 0) {
        const service = allServices.find(s => s.id === serviceId);
        if (service && service.netPrice) {
          totalNetPrice += service.netPrice * quantity;
        }
      }
    }

    const result = await storage.createBooking(authUser.user.id, {
      propertyName,
      propertyAddress,
      propertyType,
      preferredDate,
      preferredTime,
      specialRequirements,
      totalNetPrice,
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

// POST /api/uploads/:shootId - Upload photos
app.post("/api/uploads/:shootId", async (c) => {
  try {
    const shootId = c.req.param("shootId");
    
    // Verify shoot exists
    const shoot = await storage.getShoot(shootId);
    if (!shoot) {
      return c.json({ error: "Shoot not found" }, 404);
    }
    
    // Parse multipart form data
    const formData = await c.req.formData();
    const files = formData.getAll("photos");
    
    if (!files || files.length === 0) {
      return c.json({ error: "No files uploaded" }, 400);
    }
    
    // Get frame count from formData (default to 5)
    const frameCountValue = formData.get("frameCount");
    let frameCount: 3 | 5 = 5;
    if (frameCountValue === "3") {
      frameCount = 3;
    }
    
    // Convert FormData files to format expected by processUploadedFiles
    // Save files to temporary directory first
    const tmpDir = join(tmpdir(), `upload-${shootId}-${Date.now()}`);
    await mkdir(tmpDir, { recursive: true });
    
    const multerFiles = [];
    for (const file of files) {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        const filename = file.name;
        const filepath = join(tmpDir, filename);
        
        await writeFile(filepath, buffer);
        
        // Create multer-like file object
        multerFiles.push({
          fieldname: "photos",
          originalname: filename,
          encoding: "7bit",
          mimetype: file.type || "application/octet-stream",
          destination: tmpDir,
          filename: filename,
          path: filepath,
          size: buffer.length,
          buffer: buffer,
        });
      }
    }
    
    // Get jobId from shoot
    const job = await storage.getJob(shoot.jobId);
    if (!job) {
      return c.json({ error: "Job not found" }, 404);
    }
    
    // Process uploaded files using existing handler
    const result = await processUploadedFiles(shootId, job.id, multerFiles as any, frameCount);
    
    if (!result.success) {
      return c.json({ error: result.error || "Failed to process files" }, 500);
    }
    
    return c.json({ 
      success: true, 
      stackCount: result.stackCount,
      imageCount: result.imageCount,
    });
  } catch (error) {
    console.error("Error uploading files:", error);
    return c.json({ error: "Failed to upload files" }, 500);
  }
});

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

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Start server with async initialization (production mode)
async function startServer() {
  const port = process.env.PORT || 5000;

  // Initialize storage before starting server
  await storage.ready();

  console.log(`🚀 Server starting on http://0.0.0.0:${port}`);
  console.log(`📝 Auth sandbox available at http://localhost:${port}/public/auth.html`);
  console.log(`💾 Database: PostgreSQL (Neon)`);

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
