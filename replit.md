# pix.immo - Real Estate Media Platform

## Overview
A professional real estate media platform built with Node.js 22 + TypeScript, featuring AI-based image captioning (Replicate API), dual authentication (Lucia sessions + optional JWT tokens), role-based access control, and property photography order management. Uses Hono web framework for Cloudflare Workers compatibility and React SPA for the frontend.

## Purpose
Professional property photography platform connecting real estate professionals with photography services. Features order management, property galleries, and AI-powered image analysis for automated caption generation.

## Current State
**Status**: 🚧 Core Foundation in Progress (Task #1 of Technical Briefing)

**Completed:**
- ✅ React SPA frontend with Wouter routing (6 pages)
- ✅ Dual server architecture (Express+Vite dev, Hono production)
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Session-based authentication (cookie sessions)
- ✅ Role-based access control (admin/client)
- ✅ Order management system for property photography
- ✅ Password reset flow with secure token handling
- ✅ Rate limiting on all auth endpoints
- ✅ Complete E2E test coverage

**Planned (Later Tasks):**
- 🔄 AI image captioning via Replicate API
- 🔄 Mailgun email delivery for password reset
- 🔄 Image upload and storage
- 🔄 Advanced admin dashboard
- 🔄 Property portfolio management

## Recent Changes
**2025-10-19 (Phase 7)**: React Frontend & Development Server
- Created React SPA with 6 pages: Home, Login, Register, Dashboard, Gallery, OrderForm
- Implemented Wouter routing with proper SPA navigation
- Created dual server architecture:
  - `server/dev.ts`: Express + Vite middleware with HMR for development
  - `server/index.ts`: Hono production server (Cloudflare Workers ready)
- Fixed API proxy in dev.ts to forward requests to Hono app.fetch()
- Fixed getClientIP to work with proxied requests (x-forwarded-for in dev)
- All pages use Shadcn components with react-hook-form + zod validation
- Added data-testid attributes for testing
- E2E tests passing: complete user flow (register → order → dashboard → gallery → logout/login)

**2025-10-19 (Phase 6)**: Order Management System
- Added orders table with property photography request fields
- Implemented order API with role-based authorization:
  - POST /api/orders: Create order (authenticated users)
  - GET /api/orders: Get orders (clients see own, admins see all)
  - GET /api/orders/:id: Get single order with authorization check
  - PATCH /api/orders/:id/status: Update order status (admin only)
- Order statuses: pending, confirmed, completed, cancelled
- Complete integration with frontend dashboard and order form

**2025-10-19 (Phase 5)**: Role-Based Access Control
- Extended users table with role field (admin/client)
- Default role: "client" for new signups
- Role propagated through signup, login, and /api/me endpoints
- Authorization middleware for admin-only endpoints
- Frontend displays user role badge on dashboard

**Earlier Phases**: Authentication Foundation
- Hono server with session-based authentication (cookie sessions)
- Optional JWT/Bearer token support for API access
- PostgreSQL database with Drizzle ORM
- Cookie-based sessions (30-day expiry)
- Password reset flow with secure one-time tokens
- Rate limiting on all auth endpoints (brute-force protection)
- Scrypt password hashing

## Project Architecture

### Backend (Hono)
- **Framework**: Hono v4 (Cloudflare Workers compatible)
- **Runtime**: Node.js 22 (target for Cloudflare compatibility)
- **Auth Routes**: `/api/signup`, `/api/login`, `/api/logout`, `/api/me`, `/api/token/refresh`
- **Password Reset**: `/api/password-reset/request`, `/api/password-reset/confirm`
- **Order Routes**: `/api/orders` (POST/GET), `/api/orders/:id` (GET/PATCH)
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Auth Strategy**: Session cookies (primary), JWT tokens (optional for API access)
- **Security**: Scrypt hashing, httpOnly cookies, optional JWT with token rotation, rate limiting, role-based access

### Frontend (React SPA)
- **Framework**: React 18 + Wouter routing
- **Pages**: Home, Login, Register, Dashboard, Gallery, OrderForm, NotFound
- **Components**: Shadcn UI with Tailwind CSS
- **Forms**: react-hook-form + zod validation
- **Data Fetching**: TanStack Query (React Query v5)
- **Design**: Modern, responsive, dark/light mode support
- **Testing**: data-testid attributes on all interactive elements

### Development Server
- **Dev Mode**: Express + Vite middleware with HMR (`server/dev.ts`)
- **Production**: Hono serve() with static files (`server/index.ts`)
- **API Proxy**: Dev server proxies `/api/*` to Hono app.fetch()
- **Client IP**: Forwarded via x-forwarded-for header for rate limiting
- **Hot Reload**: Frontend changes trigger instant updates

### Data Models
**User**: `{ id, email, hashedPassword, role, createdAt }`
- Roles: "admin" | "client"

**Session**: `{ id, userId, expiresAt }`

**RefreshToken**: `{ id, userId, token, expiresAt, createdAt }`
- Optional: Used only when JWT authentication is enabled

**PasswordResetToken**: `{ id, userId, token, expiresAt, createdAt }`
- One-time use tokens with 1-hour expiry

**Order**: `{ id, userId, propertyName, propertyAddress, contactName, contactPhone, contactEmail, preferredDate, notes, status, createdAt, updatedAt }`
- Statuses: "pending" | "confirmed" | "completed" | "cancelled"

## Tech Stack
- **Runtime**: Node.js 22 (target for Cloudflare Workers compatibility)
- **Backend**: Hono v4 (Cloudflare Workers native)
- **Frontend**: React 18 + Wouter + Shadcn UI + Tailwind CSS
- **Language**: TypeScript 5.6
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Dev Server**: Express + Vite middleware
- **Auth**: Session cookies (primary), optional JWT for API access
- **Forms**: react-hook-form + zod validation
- **Data Fetching**: TanStack Query v5
- **Password Hashing**: Scrypt (Node.js crypto)

## User Preferences
- Hono for Cloudflare Workers compatibility
- React SPA with Wouter routing
- Shadcn components for consistent UI
- TypeScript for type safety
- Clean, modern developer-focused interfaces
- Secure environment variable management (no hardcoded secrets)

## Running the Project

### Development Mode
```bash
npm run dev
```
- Server: http://localhost:5000
- React App: http://localhost:5000/ (with HMR)
- Auth Sandbox: http://localhost:5000/public/auth.html
- Hot Module Replacement enabled
- API proxy to Hono backend

### Database Migration
```bash
npm run db:push
```
Syncs Drizzle schema to PostgreSQL database. Use `--force` if data loss warning appears.

## API Endpoints

### Authentication
- **POST /api/signup** - Create user + session (default role: client)
- **POST /api/login** - Authenticate + create session (or JWT with ?token=true)
- **POST /api/token/refresh** - Refresh access token using refresh token (JWT mode only)
- **GET /api/me** - Get current user with role (supports cookie and Bearer auth)
- **POST /api/logout** - Invalidate session

### Password Reset
- **POST /api/password-reset/request** - Request password reset token
- **POST /api/password-reset/confirm** - Confirm password reset with token

### Orders
- **POST /api/orders** - Create property photography order (authenticated)
- **GET /api/orders** - Get orders (clients: own orders, admins: all orders)
- **GET /api/orders/:id** - Get single order (authorization check)
- **PATCH /api/orders/:id/status** - Update order status (admin only)

### Health Check
- **GET /api/health** - Health check

## Authorization Rules

### Client Role
- Can create orders
- Can view own orders only
- Cannot update order status
- Default role for new signups

### Admin Role
- Can view all orders
- Can update order status
- Full system access

## Rate Limiting
All auth endpoints are rate-limited to prevent brute-force attacks:
- **Login**: 5 requests/minute per IP
- **Signup**: 3 requests/minute per IP
- **Password Reset**: 10 requests/hour per IP
- **Token Refresh**: 10 requests/minute per IP
- Returns `429 Too Many Requests` when limit exceeded
- Includes `RateLimit-*` headers (draft-6 standard)

## Frontend Routes

- `/` - Home page (landing)
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - User dashboard with orders list
- `/gallery` - Property gallery (placeholder images)
- `/order` - Order creation form
- `*` - NotFound page (404)

## Migration Path to Cloudflare Workers

The application is designed for seamless deployment to Cloudflare Workers:

1. **Build React app**: `npm run build` (generates static assets)
2. **Database**: Use Neon PostgreSQL (Workers-compatible) or migrate to D1
3. **Static Files**: Serve from Workers Static Assets or R2
4. **Hono App**: Deploy `server/index.ts` to Workers (already compatible)
5. **Environment Variables**: Set in Workers dashboard
6. **Routes**: No changes needed - all routes are Workers-compatible ✨

### Why This Architecture Works

- **Hono Framework**: Built specifically for edge runtimes (Workers, Deno, Bun)
- **No Node.js APIs in Routes**: All route handlers use standard Web APIs
- **Modular Storage**: Storage interface can swap to D1 or other Workers-compatible stores
- **Static Assets**: React build outputs standard static files
- **Session Management**: Can use Workers KV or external session store

## Key Files

### Backend
- `server/dev.ts` - Express + Vite development server with API proxy
- `server/index.ts` - Hono production server (Cloudflare Workers ready)
- `server/auth.ts` - Password hashing & session config
- `server/jwt.ts` - JWT utilities (optional, for API access tokens)
- `server/storage.ts` - Storage interface + DatabaseStorage implementation
- `server/db.ts` - Drizzle database connection
- `shared/schema.ts` - Drizzle schema, types, and validation

### Frontend
- `client/src/App.tsx` - Router configuration with Wouter
- `client/src/pages/home.tsx` - Landing page
- `client/src/pages/login.tsx` - Login form
- `client/src/pages/register.tsx` - Registration form
- `client/src/pages/dashboard.tsx` - User dashboard with orders
- `client/src/pages/gallery.tsx` - Property gallery
- `client/src/pages/order-form.tsx` - Order creation form
- `client/src/lib/queryClient.ts` - TanStack Query configuration

### Legacy
- `public/auth.html` - Original auth sandbox test interface (still functional)

## Environment Variables

All secrets and API keys are managed securely via environment variables. **Never hardcode secrets in source code.**

### Required Environment Variables

**Database:**
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit, or manually configure)
- `PGHOST`, `PGPORT`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` - Individual PostgreSQL credentials

**Authentication:**
- `SESSION_SECRET` - Secret key for session cookies (required)
- `JWT_SECRET` - Secret key for JWT signing (required if using JWT auth mode)

**Email (Mailgun):**
- `MAILGUN_API_KEY` - Mailgun API key for sending emails (required for password reset emails)
- `MAILGUN_DOMAIN` - Mailgun domain for sending emails (e.g., mg.yourdomain.com)

**AI Services (Future):**
- `REPLICATE_API_TOKEN` - Replicate API token for AI image captioning (required for AI features)

**Runtime:**
- `NODE_ENV` - Environment mode (development/production)
- `PORT` - Server port (default: 5000)

### Setting Environment Variables

**Development (Replit):**
Use the Secrets tab in Replit to securely store all environment variables. The application will prompt for missing required secrets.

**Production (Cloudflare Workers):**
Set environment variables in the Cloudflare Workers dashboard under Settings → Variables and Secrets.

**Local Development:**
Create a `.env` file (never commit to git):
```bash
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here
MAILGUN_API_KEY=your-mailgun-key-here
MAILGUN_DOMAIN=mg.yourdomain.com
REPLICATE_API_TOKEN=your-replicate-token-here
```

## Security Configuration

- **Cookie Name**: `auth_session`
- **HttpOnly**: true (prevents XSS)
- **SameSite**: lax (prevents CSRF)
- **Secure**: false (dev), true (production)
- **Expiration**: 30 days
- **Password Hash**: Scrypt (N=16384, r=8, p=1, keylen=64)
- **Rate Limiting**: IP-based (x-forwarded-for in dev, cf-connecting-ip in production)

## Next Steps (Technical Briefing Roadmap)

1. **Task #2: AI Image Captioning** - Integrate Replicate API for automated property photo captions
2. **Task #3: Email Integration** - Replace console logging with Mailgun email delivery for password reset
3. **Task #4: Image Upload System** - Add property photo upload and storage (Cloudflare R2 or similar)
4. **Task #5: Admin Dashboard** - Build comprehensive admin panel for order and user management
5. **Task #6: Portfolio Management** - Enable users to create and manage property portfolios
6. **Task #7: Production Deployment** - Deploy to Cloudflare Workers with optimized asset delivery

## Notes

- **Authentication Strategy**: Currently using session cookies as primary auth method. JWT support is available for API-only access but is optional.
- **AI Captioning**: Replicate API integration is planned for a later task. Current gallery shows placeholder images.
- **Email Delivery**: Password reset currently logs to console. Mailgun integration will be added in a future task.
- **Cloudflare Workers**: The architecture is designed from the ground up for Workers deployment. All components (Hono, Drizzle, React SPA) are Workers-compatible.
