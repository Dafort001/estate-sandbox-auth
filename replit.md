# Auth Development Sandbox

## Overview
A Node.js + TypeScript authentication sandbox built with Hono web framework. Designed for local development with future Cloudflare Workers deployment. Features cookie-based sessions, in-memory storage with optional JSON persistence, and a beautiful testing interface.

## Purpose
Development sandbox for real-estate website authentication flows. Allows rapid testing of signup, login, logout, and session management before migrating to production (Cloudflare D1 + Workers).

## Current State
**Status**: ✅ Fully functional MVP
- Hono server with auth routes
- Custom session management (cookie-based)
- Scrypt password hashing
- In-memory storage with optional persistence
- Beautiful HTML test interface with dark/light mode
- Complete type safety with TypeScript

## Recent Changes
**2025-10-17**: Initial implementation
- Created Hono-based auth server (replacing Express)
- Implemented custom authentication (Lucia v3 was deprecated)
- Built storage layer with in-memory + optional JSON persistence
- Created beautiful auth.html test interface
- Added scrypt password hashing
- Configured cookie-based sessions (httpOnly, sameSite=lax)

## Project Architecture

### Backend (Hono)
- **Framework**: Hono (Cloudflare Workers compatible)
- **Auth Routes**: `/api/signup`, `/api/login`, `/api/logout`, `/api/me`
- **Storage**: In-memory with optional JSON file persistence
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
- **Password**: Scrypt (Node.js crypto)
- **Storage**: In-memory Map (swappable to D1)

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

### With Persistence
```bash
DEV_PERSIST=true npm run dev
```
Data saved to: `data/auth-data.json`

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
- `server/storage.ts` - Storage interface + in-memory implementation
- `shared/schema.ts` - Shared types and validation schemas
- `public/auth.html` - Test interface

## Environment Variables

- `PORT` - Server port (default: 5000)
- `DEV_PERSIST` - Enable JSON persistence (default: false)
- `NODE_ENV` - Environment mode

## Security Configuration

- **Cookie Name**: `auth_session`
- **HttpOnly**: true (prevents XSS)
- **SameSite**: lax (prevents CSRF)
- **Secure**: false (dev), true (production)
- **Expiration**: 30 days
- **Password Hash**: Scrypt (N=16384, r=8, p=1, keylen=64)
