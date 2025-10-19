import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { getConnInfo } from "@hono/node-server/conninfo";
import { storage } from "./storage";
import { hashPassword, verifyPassword, SESSION_CONFIG } from "./auth";
import { signupSchema, loginSchema, passwordResetRequestSchema, passwordResetConfirmSchema, createOrderSchema, type UserResponse } from "@shared/schema";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateTokenPair, verifyAccessToken, extractBearerToken } from "./jwt";
import { randomUUID } from "crypto";
import { rateLimiter } from "hono-rate-limiter";

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
