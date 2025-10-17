# Auth Development Sandbox

## Overview
A Node.js + TypeScript authentication sandbox built with Hono web framework. Features PostgreSQL database with Drizzle ORM, dual authentication (cookie sessions + JWT/Bearer tokens), and a beautiful testing interface. Production-ready with password reset and rate limiting capabilities.

## Purpose
Development sandbox for real-estate website authentication flows. Provides complete auth system with database persistence, supporting both traditional cookie sessions and modern JWT-based authentication.

## Current State
**Status**: ✅ JWT/Bearer Auth Complete + Additional Features In Progress
- Hono server with dual auth modes (cookie + JWT)
- PostgreSQL database with Drizzle ORM
- Cookie-based sessions (30-day expiry)
- JWT/Bearer token auth (15-min access, 7-day refresh)
- Scrypt password hashing
- Beautiful HTML test interface with dark/light mode
- Complete type safety with TypeScript

## Recent Changes
**2025-10-17 (Phase 3)**: JWT/Bearer Token Authentication
- Added refresh_tokens table for secure token storage
- Implemented JWT utilities with required secret validation
- Extended login endpoint to support ?token=true for JWT mode
- Created /api/token/refresh endpoint with token rotation
- Added Bearer token middleware alongside cookie auth
- Both auth methods work independently (backward compatible)
- All e2e tests passing

**2025-10-17 (Phase 2)**: PostgreSQL Migration
- Migrated from in-memory storage to PostgreSQL database
- Added Drizzle ORM schema with users and sessions tables
- Created DatabaseStorage adapter implementing IStorage interface
- Fixed case-insensitive email lookups
- All routes work unchanged (same interface)

**2025-10-17 (Phase 1)**: Initial implementation
- Created Hono-based auth server (replacing Express)
- Implemented custom authentication (Lucia v3 was deprecated)
- Built storage layer with flexible IStorage interface
- Created beautiful auth.html test interface
- Added scrypt password hashing
- Configured cookie-based sessions (httpOnly, sameSite=lax)

## Project Architecture

### Backend (Hono)
- **Framework**: Hono (Cloudflare Workers compatible)
- **Auth Routes**: `/api/signup`, `/api/login`, `/api/logout`, `/api/me`, `/api/token/refresh`
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Auth Methods**: Cookie sessions (30-day) + JWT/Bearer tokens (15-min access, 7-day refresh)
- **Security**: Scrypt hashing, httpOnly cookies, JWT with token rotation, CSRF protection

### Frontend
- **Interface**: Vanilla HTML/CSS/JS (`public/auth.html`)
- **Features**: Dark/light mode, real-time session status, JSON viewer
- **Design**: Clean developer-focused UI following Material Design principles

### Data Models
**User**: `{ id, email, hashedPassword, createdAt }`
**Session**: `{ id, userId, expiresAt }`
**RefreshToken**: `{ id, userId, token, expiresAt, createdAt }`

## Tech Stack
- **Runtime**: Node.js 20
- **Framework**: Hono v4
- **Language**: TypeScript 5.6
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Password**: Scrypt (Node.js crypto)

## User Preferences
- Wants Hono for Cloudflare Workers compatibility
- Prefers in-memory storage for development
- Desires easy migration path to Cloudflare D1
- Values clean, functional developer interfaces

## Running the Project

### Development Mode
```bash
npm run dev
```
Server: http://localhost:5000
Interface: http://localhost:5000/public/auth.html

### Database Migration
```bash
npm run db:push
```
Syncs Drizzle schema to PostgreSQL database

## API Endpoints

**POST /api/signup** - Create user + session
**POST /api/login** - Authenticate + create session (or JWT with ?token=true)
**POST /api/token/refresh** - Refresh access token using refresh token
**GET /api/me** - Get current user (supports both cookie and Bearer auth)
**POST /api/logout** - Invalidate session
**GET /api/health** - Health check

### JWT Authentication
- Login with tokens: `POST /api/login?token=true` → Returns `{accessToken, refreshToken}`
- Use Bearer token: `Authorization: Bearer <access_token>`
- Refresh tokens: `POST /api/token/refresh` with `{refreshToken}` → New token pair

## Migration Path to Cloudflare Workers

1. Create D1 database schema
2. Implement D1 storage adapter (same `IStorage` interface)
3. Update `server/storage.ts` to use D1
4. Deploy to Cloudflare Workers
5. Routes remain unchanged ✨

## Key Files

- `server/index.ts` - Hono server with all routes
- `server/auth.ts` - Password hashing & session config
- `server/jwt.ts` - JWT utilities (access & refresh tokens)
- `server/storage.ts` - Storage interface + DatabaseStorage implementation
- `server/db.ts` - Drizzle database connection
- `shared/schema.ts` - Drizzle schema, types, and validation
- `public/auth.html` - Test interface

## Environment Variables

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `JWT_SECRET` - Secret key for JWT signing (required for JWT auth)
- `SESSION_SECRET` - Secret key for session cookies
- `NODE_ENV` - Environment mode

## Security Configuration

- **Cookie Name**: `auth_session`
- **HttpOnly**: true (prevents XSS)
- **SameSite**: lax (prevents CSRF)
- **Secure**: false (dev), true (production)
- **Expiration**: 30 days
- **Password Hash**: Scrypt (N=16384, r=8, p=1, keylen=64)
