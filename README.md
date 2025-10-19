# pix.immo - Real Estate Media Platform

A professional real estate media platform built with Node.js 22 + TypeScript. Features AI-based image captioning (Replicate API), secure authentication, role-based access control, and property photography order management. Designed for Cloudflare Workers deployment with a dual-server development architecture.

## 🚧 Current Status

**Task #1 of Technical Briefing: Core Foundation in Progress**

Completed features:
- ✅ Session-based authentication (cookie sessions)
- ✅ Role-based access control (admin/client)
- ✅ Order management system
- ✅ Password reset flow with secure tokens
- ✅ React SPA with 6 pages (Home, Login, Register, Dashboard, Gallery, OrderForm)
- ✅ Rate limiting on all auth endpoints
- ✅ PostgreSQL database with Drizzle ORM
- ✅ Complete E2E test coverage

Upcoming tasks:
- 🔄 AI image captioning via Replicate API (Task #2)
- 🔄 Mailgun email integration for password reset (Task #3)
- 🔄 Image upload to Cloudflare R2 (Task #4)
- 🔄 Admin dashboard and analytics (Task #5)

## Tech Stack

- **Runtime**: Node.js 22 (Cloudflare Workers compatible)
- **Backend**: Hono v4 (edge-native web framework)
- **Frontend**: React 18 + Wouter + Shadcn UI + Tailwind CSS
- **Database**: PostgreSQL (Neon) + Drizzle ORM
- **Auth**: Session cookies (primary), JWT/Bearer tokens (optional for API)
- **Dev Server**: Express + Vite (HMR enabled)
- **AI**: Replicate API (CogVLM image captioning)
- **Email**: Mailgun (transactional emails)
- **Deployment**: Cloudflare Workers + Pages

## System Architecture

### Core Components

**Cloudflare Workers + R2**
- Serverless API endpoints (Hono framework)
- Object storage for images and metadata
- Edge computing for low-latency responses

**Replicate (AI Captioning)**
- CogVLM-based image analysis
- Generates marketing-ready property descriptions
- Returns `.txt` (human-readable) and `.json` (CRM-compatible) formats

**PostgreSQL + Drizzle ORM**
- User accounts, sessions, and order data
- Type-safe database queries
- Secure credential storage

**Mailgun**
- Password reset emails
- Order notifications
- Transactional messaging

**React SPA**
- Client dashboard and gallery
- Order form with property details
- Responsive design with dark/light mode

### Development vs Production

**Development Mode** (`npm run dev`):
- Express + Vite dev server with HMR
- API proxy to Hono backend
- Hot reload for instant feedback
- Runs on http://localhost:5000

**Production Mode** (Cloudflare Workers):
- Hono app deployed to Workers
- Static assets served from Pages or R2
- PostgreSQL connection via Neon
- Global edge deployment

## Getting Started

### Prerequisites

- Node.js 22+
- PostgreSQL database (or Replit's built-in database)
- Environment variables configured (see below)

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file (never commit to git) or use Replit Secrets:

```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Authentication
SESSION_SECRET=your-session-secret-here
JWT_SECRET=your-jwt-secret-here

# Email (Mailgun)
MAILGUN_API_KEY=your-mailgun-key-here
MAILGUN_DOMAIN=mg.yourdomain.com
MAILGUN_FROM=noreply@pix.immo

# AI Services
REPLICATE_API_TOKEN=your-replicate-token-here

# Runtime
NODE_ENV=development
PORT=5000
```

**⚠️ Security Note**: Never hardcode API keys or secrets in source code. Always use environment variables.

### Development

```bash
# Start development server with HMR
npm run dev

# Run database migrations
npm run db:push

# Type checking
npm run check
```

Visit:
- React App: http://localhost:5000/
- Auth Sandbox: http://localhost:5000/public/auth.html

### Production Build

```bash
# Build React frontend and Hono backend
npm run build

# Start production server
npm start
```

## API Endpoints

### Authentication
- `POST /api/signup` - Create user + session (default role: client)
- `POST /api/login` - Authenticate (cookie or JWT with ?token=true)
- `POST /api/logout` - Invalidate session
- `GET /api/me` - Get current user (cookie or Bearer token)
- `POST /api/token/refresh` - Refresh JWT access token

### Password Reset
- `POST /api/password-reset/request` - Request reset token
- `POST /api/password-reset/confirm` - Confirm reset with token

### Orders
- `POST /api/orders` - Create property photography order
- `GET /api/orders` - Get orders (clients: own, admins: all)
- `GET /api/orders/:id` - Get single order
- `PATCH /api/orders/:id/status` - Update order status (admin only)

### Health
- `GET /api/health` - Health check

## Frontend Routes

- `/` - Home page (landing)
- `/login` - Login form
- `/register` - Registration form
- `/dashboard` - User dashboard with orders
- `/gallery` - Property gallery (responsive grid)
- `/order` - Order creation form

## Data Models

### User
```typescript
{
  id: string;              // UUID
  email: string;           // Unique
  hashedPassword: string;  // Scrypt
  role: "admin" | "client";
  createdAt: number;
}
```

### Session
```typescript
{
  id: string;        // UUID
  userId: string;
  expiresAt: number; // 30 days
}
```

### Order
```typescript
{
  id: string;
  userId: string;
  propertyName: string;
  propertyAddress: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  preferredDate: string;
  notes: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
}
```

## Authorization

### Client Role
- Create orders
- View own orders only
- Access personal dashboard

### Admin Role
- View all orders
- Update order status
- Full system access

## Security Features

- **Password Hashing**: Scrypt with secure parameters (N=16384, r=8, p=1)
- **Session Cookies**: HttpOnly, SameSite=lax, 30-day expiry
- **Rate Limiting**: IP-based protection on auth endpoints
  - Login: 5/min per IP
  - Signup: 3/min per IP
  - Password Reset: 10/hour per IP
- **CSRF Protection**: SameSite cookies
- **XSS Prevention**: HttpOnly cookies
- **Role-Based Access**: Enforced at API level

## Cloudflare Workers Deployment

The application is designed for seamless Workers deployment:

### Architecture Benefits
- **Hono Framework**: Built for edge runtimes (Workers, Deno, Bun)
- **No Node.js APIs**: Routes use standard Web APIs
- **Modular Storage**: Drizzle ORM works with D1 or Neon PostgreSQL
- **Static Assets**: React SPA deploys to Pages or R2

### Deployment Steps
1. Build React app: `npm run build`
2. Deploy Hono backend to Cloudflare Workers
3. Serve static files from Cloudflare Pages or R2
4. Configure environment variables in Workers dashboard
5. Connect to Neon PostgreSQL (Workers-compatible)

### Why It Works
- All HTTP handling uses Hono's Workers-compatible API
- Database queries use Drizzle ORM (supports D1 and PostgreSQL)
- No Node.js-specific dependencies in route handlers
- Session management can use Workers KV or external store

## Project Structure

```
├── server/
│   ├── dev.ts          # Express + Vite development server
│   ├── index.ts        # Hono production server (Workers-ready)
│   ├── auth.ts         # Password hashing & session config
│   ├── jwt.ts          # JWT utilities (optional)
│   ├── storage.ts      # Storage interface + PostgreSQL adapter
│   └── db.ts           # Drizzle database connection
├── client/
│   └── src/
│       ├── App.tsx     # Router configuration
│       ├── pages/      # React pages
│       └── lib/        # TanStack Query config
├── shared/
│   └── schema.ts       # Drizzle schema + Zod validation
├── public/
│   └── auth.html       # Legacy auth sandbox
└── package.json
```

## Rate Limiting

All authentication endpoints are protected:

| Endpoint | Limit | Window |
|----------|-------|--------|
| Login | 5 requests | 1 minute |
| Signup | 3 requests | 1 minute |
| Password Reset | 10 requests | 1 hour |
| Token Refresh | 10 requests | 1 minute |

Exceeded limits return `429 Too Many Requests` with `RateLimit-*` headers.

## Development Workflow

1. **Make changes** to frontend or backend
2. **Auto-reload** via Vite HMR
3. **Test** with integrated auth sandbox
4. **Migrate database** with `npm run db:push`
5. **Deploy** to Cloudflare Workers

## GDPR & Privacy

- Images are anonymized before AI processing (e.g., "Livingroom_01.jpg")
- No personal identifiers sent to external servers
- Processing transparency disclosed to users
- Non-EU AI processing (Replicate) explicitly stated

## Next Steps (Roadmap)

According to the technical briefing:

1. **Task #2**: Cloudflare Upload Worker Integration
2. **Task #3**: AI Caption Automation (Replicate API)
3. **Task #4**: Gallery JSON Integration + CRM Export
4. **Task #5**: Admin Dashboard + Analytics
5. **Task #6**: Optional Modal Migration (performance)

## Contributing

This is a private project following the pix.immo technical briefing v2.

## License

MIT

---

Built with ❤️ for modern real estate workflows.
