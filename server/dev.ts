import express from "express";
import { createServer } from "http";
import { setupVite } from "./vite";

const app = express();
const server = createServer(app);

async function startDevServer() {
  const port = process.env.PORT || 5000;

  // Parse JSON body for POST/PUT/PATCH requests
  app.use(express.json());

  // Proxy API requests to the Hono server (running in same process)
  app.use("/api", async (req, res, next) => {
    try {
      // Import the Hono app (it's exported from index.ts in development mode)
      const { default: honoApp } = await import("./index");
      
      // Convert Express req to fetch Request
      // Note: req.url is relative to /api, so prepend /api
      const fullPath = `/api${req.url}`;
      const url = new URL(fullPath, `http://localhost:${port}`);
      
      const headers = new Headers();
      Object.entries(req.headers).forEach(([key, value]) => {
        if (value) headers.set(key, Array.isArray(value) ? value[0] : value);
      });
      
      // Pass client IP for rate limiting
      const clientIP = req.ip || req.socket.remoteAddress || "127.0.0.1";
      headers.set("x-forwarded-for", clientIP);

      // Get raw body for POST/PUT/PATCH
      let body = undefined;
      if (req.method !== "GET" && req.method !== "HEAD" && req.body) {
        body = JSON.stringify(req.body);
        headers.set("Content-Type", "application/json");
      }

      const request = new Request(url.toString(), {
        method: req.method,
        headers,
        body,
      });

      // Call Hono app.fetch()
      const response = await honoApp.fetch(request);
      
      // Convert Response to Express response
      res.status(response.status);
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      const text = await response.text();
      res.send(text);
    } catch (error) {
      console.error("API proxy error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Setup Vite middleware for React app
  await setupVite(app, server);

  server.listen(port, () => {
    console.log(`🚀 Dev server running on http://localhost:${port}`);
    console.log(`🎨 React app: http://localhost:${port}/`);
    console.log(`📝 Auth sandbox: http://localhost:${port}/public/auth.html`);
    console.log(`💾 Database: PostgreSQL (Neon)`);
    console.log(`⚡ Hot Module Replacement enabled`);
  });
}

startDevServer().catch((error) => {
  console.error("Failed to start dev server:", error);
  process.exit(1);
});
