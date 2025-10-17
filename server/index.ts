import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { storage } from "./storage";
import { hashPassword, verifyPassword, SESSION_CONFIG } from "./auth";
import { signupSchema, loginSchema, type UserResponse } from "@shared/schema";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";

const app = new Hono();

// Serve static files from public directory
app.use("/public/*", serveStatic({ root: "./" }));
app.use("/favicon.ico", serveStatic({ path: "./public/favicon.ico" }));

// Middleware to get current user from session
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

// POST /api/login
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

// GET /api/me
app.get("/api/me", async (c) => {
  try {
    const sessionUser = await getSessionUser(c);

    if (!sessionUser) {
      return c.json({ error: "Not authenticated" }, 401);
    }

    const { user, session } = sessionUser;

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
    console.error("Get user error:", error);
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

const port = process.env.PORT || 5000;

console.log(`🚀 Server starting on http://0.0.0.0:${port}`);
console.log(`📝 Auth sandbox available at http://localhost:${port}/public/auth.html`);
console.log(`💾 Persistence: ${process.env.DEV_PERSIST === "true" ? "ENABLED (JSON file)" : "DISABLED (in-memory only)"}`);

serve({
  fetch: app.fetch,
  port: Number(port),
  hostname: "0.0.0.0",
});
