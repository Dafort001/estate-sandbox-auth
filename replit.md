# Auth Development Sandbox

## Overview
A Node.js + TypeScript authentication sandbox built with Hono web framework. Features PostgreSQL database with Drizzle ORM, cookie-based sessions, and a beautiful testing interface. Designed for production use with plans for JWT auth, password reset, and rate limiting.

## Purpose
Development sandbox for real-estate website authentication flows. Provides complete auth system with database persistence for signup, login, logout, and session management.

## Current State
**Status**: ✅ PostgreSQL Migration Complete + Next Phase Features In Progress
- Hono server with auth routes
- PostgreSQL database with Drizzle ORM
- Custom session management (cookie-based)
- Scrypt password hashing
- Beautiful HTML test interface with dark/light mode
- Complete type safety with TypeScript

## Recent Changes
**2025-10-17 (Phase 2)**: PostgreSQL Migration
- Migrated from in-memory storage to PostgreSQL database
- Added Drizzle ORM schema with users and sessions tables
- Created DatabaseStorage adapter implementing IStorage interface
- All routes work unchanged (same interface)
- Removed JSON file persistence (no longer needed)

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
- **Auth Routes**: `/api/signup`, `/api/login`, `/api/logout`, `/api/me`
- **Database**: PostgreSQL (Neon) with Drizzle ORM
- **Sessions**: 30-day cookie-based sessions with auto-expiration
- **Security**: Scrypt hashing, httpOnly cookies, CSRF protection

### Frontend
- **Interface**: Vanilla HTML/CSS/JS (`public/auth.html`)
- **Features**: Dark/light mode, real-time session status, JSON viewer
- **Design**: Clean developer-focused UI following Material Design principles

### Data Models
**User**: `{ id, email, hashedPassword, createdAt }`
**Session**: `{ id, userId, expiresAt }`

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
**POST /api/login** - Authenticate + create session  
**GET /api/me** - Get current user
**POST /api/logout** - Invalidate session
**GET /api/health** - Health check

## Migration Path to Cloudflare Workers

1. Create D1 database schema
2. Implement D1 storage adapter (same `IStorage` interface)
3. Update `server/storage.ts` to use D1
4. Deploy to Cloudflare Workers
5. Routes remain unchanged ✨

## Key Files

- `server/index.ts` - Hono server with all routes
- `server/auth.ts` - Password hashing & session config
- `server/storage.ts` - Storage interface + DatabaseStorage implementation
- `server/db.ts` - Drizzle database connection
- `shared/schema.ts` - Drizzle schema, types, and validation
- `public/auth.html` - Test interface

## Environment Variables

- `PORT` - Server port (default: 5000)
- `DATABASE_URL` - PostgreSQL connection string (auto-set by Replit)
- `NODE_ENV` - Environment mode

## Security Configuration

- **Cookie Name**: `auth_session`
- **HttpOnly**: true (prevents XSS)
- **SameSite**: lax (prevents CSRF)
- **Secure**: false (dev), true (production)
- **Expiration**: 30 days
- **Password Hash**: Scrypt (N=16384, r=8, p=1, keylen=64)
