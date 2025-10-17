import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { storage } from "./storage";
import { hashPassword, verifyPassword, SESSION_CONFIG } from "./auth";
import { signupSchema, loginSchema, type UserResponse } from "@shared/schema";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { generateTokenPair, verifyAccessToken, extractBearerToken } from "./jwt";

const app = new Hono();

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
app.post("/api/signup", async (c) => {
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
app.post("/api/login", async (c) => {
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
app.post("/api/token/refresh", async (c) => {
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

// Health check
app.get("/api/health", (c) => {
  return c.json({ status: "ok", timestamp: Date.now() });
});

// Root route - redirect to auth.html
app.get("/", (c) => {
  return c.redirect("/public/auth.html");
});

// Start server with async initialization
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

startServer();
