# Auth Development Sandbox

A Node.js + TypeScript web application with Hono and custom authentication, designed as a development sandbox for real-estate website projects. Built for local development with future Cloudflare Workers deployment in mind.

## Features

- **Hono Web Framework**: Lightweight, fast, and Cloudflare Workers-compatible
- **Cookie-Based Sessions**: Secure, httpOnly cookies with scrypt password hashing
- **In-Memory Storage**: Default storage with optional JSON file persistence
- **Beautiful Test Interface**: Dark/light mode, real-time session status, JSON response viewer
- **TypeScript**: Full type safety across frontend and backend
- **Ready for Migration**: Designed to easily swap to Cloudflare D1 later

## Tech Stack

- **Runtime**: Node.js 20
- **Framework**: Hono (Express alternative, CF Workers compatible)
- **Auth**: Custom session management with scrypt password hashing
- **Storage**: In-memory with optional JSON persistence
- **Language**: TypeScript

## Getting Started

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

### Enable Persistence (Optional)
```bash
DEV_PERSIST=true npm run dev
```

The server starts on `http://localhost:5000` and serves the auth sandbox at `/public/auth.html`.

## API Routes

### POST /api/signup
Create a new user account and session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "minimum8chars"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": 1234567890
  },
  "session": {
    "id": "uuid",
    "expiresAt": 1234567890
  }
}
```

### POST /api/login
Authenticate and create a session.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": 1234567890
  },
  "session": {
    "id": "uuid",
    "expiresAt": 1234567890
  }
}
```

### GET /api/me
Get current authenticated user.

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "createdAt": 1234567890
  },
  "session": {
    "id": "uuid",
    "expiresAt": 1234567890
  }
}
```

### POST /api/logout
Invalidate current session.

**Response:**
```json
{
  "success": true
}
```

## Data Models

### User
```typescript
{
  id: string;              // UUID
  email: string;           // Unique
  hashedPassword: string;  // Scrypt hashed
  createdAt: number;       // Epoch milliseconds
}
```

### Session
```typescript
{
  id: string;        // UUID
  userId: string;    // Reference to user
  expiresAt: number; // Epoch milliseconds (30 days)
}
```

## Project Structure

```
├── server/
│   ├── index.ts      # Hono server with all routes
│   ├── auth.ts       # Password hashing & session config
│   └── storage.ts    # In-memory storage with persistence
├── shared/
│   └── schema.ts     # Shared TypeScript types and validation
├── public/
│   └── auth.html     # Beautiful test interface
└── package.json
```

## Environment Variables

- `PORT`: Server port (default: 5000)
- `DEV_PERSIST`: Enable JSON file persistence (default: false)
- `NODE_ENV`: Environment (development/production)

## Cookie Configuration

- **Name**: `auth_session`
- **HttpOnly**: `true`
- **SameSite**: `lax`
- **Secure**: `false` (dev), `true` (production)
- **Max-Age**: 30 days
- **Path**: `/`

## Future Migration to Cloudflare D1

The storage interface (`IStorage`) is designed for easy swapping:

1. Replace `MemStorage` with a D1 adapter
2. Update storage methods to use D1 queries
3. Deploy to Cloudflare Workers
4. Routes remain unchanged

## Security Features

- Scrypt password hashing with secure parameters
- HttpOnly cookies prevent XSS attacks
- SameSite cookies prevent CSRF
- Session expiration after 30 days
- Automatic expired session cleanup

## Development

### Type Checking
```bash
npm run check
```

### Build for Production
```bash
npm run build
npm start
```

## Notes

- Data resets on server restart (unless persistence is enabled)
- Designed for development/testing only
- Sessions are stored in-memory (swap for Redis/D1 in production)
- Perfect for prototyping auth flows before production deployment
