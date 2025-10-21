# pix.immo - Real Estate Media Platform

A professional real estate media platform built with Node.js 22 + TypeScript. Features AI-based image captioning (Replicate API), custom session-based authentication (Lucia-compatible), role-based access control, and property photography order management. Designed for Cloudflare Workers deployment with a dual-server development architecture.

> **Authentication**: Custom session implementation using Scrypt password hashing and HTTP-only cookies. Architecture is Lucia-compatible; migration to Lucia Auth library is optional and can be implemented in future phases.

## 🚧 Current Status

**Task #1 of Technical Briefing: Core Foundation in Progress**

Completed features:
- ✅ Custom session-based authentication (Lucia-compatible design)
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
- **Auth**: Custom session cookies (Lucia-compatible) + optional JWT/Bearer tokens for API
- **Dev Server**: Express + Vite (HMR enabled)
- **AI**: Replicate API (CogVLM image captioning) - planned
- **Email**: Mailgun (transactional emails) - planned
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
- `GET /api/health` - Health check (legacy)
- `GET /healthz` - Healthcheck for monitoring/CI/CD

### Upload & File Management
- `POST /api/uploads/init` - Initialize shoot for uploading
- `POST /api/shoots/:id/presign` - Get presigned URLs for direct upload to object storage (**RECOMMENDED**)
- `GET /api/shoots/:id` - Get shoot details
- `GET /api/shoots/:id/stacks` - Get all stacks for a shoot
- `GET /api/shoots/:id/images` - Get all images for a shoot
- `PUT /api/stacks/:id/room-type` - Assign room type to a stack
- `POST /api/projects/:jobId/handoff/:shootId` - Generate handoff package

**Note:** The legacy multipart upload route (`POST /api/uploads/:shootId`) has been removed. All clients should now use the presigned upload flow for better security and scalability.

#### Presigned Upload Flow

**Step 1: Initialize a shoot**
```bash
POST /api/uploads/init
Content-Type: application/json
Authorization: Bearer <token>

{
  "jobNumber": "J-123456"
}

Response:
{
  "shootId": "abc-123",
  "shootCode": "ABC12",
  "jobId": "def-456"
}
```

**Step 2: Request presigned URLs**
```bash
POST /api/shoots/:shootId/presign
Content-Type: application/json
Authorization: Bearer <token>

{
  "files": [
    {
      "filename": "20241021-ABC12_kitchen_01_v1.jpg",
      "contentType": "image/jpeg",
      "size": 5242880
    }
  ]
}

Response:
{
  "urls": [
    {
      "filename": "20241021-ABC12_kitchen_01_v1.jpg",
      "uploadUrl": "https://storage.googleapis.com/...",
      "expiresIn": 120
    }
  ]
}
```

**Step 3: Upload files directly to object storage**
```bash
PUT <uploadUrl>
Content-Type: image/jpeg
Content-Length: 5242880
<binary data>
```

**Security Features:**
- Ownership validation: Only shoot owners can request presigned URLs
- Filename validation: Files must conform to v3.1 naming schema
- Rate limiting: 20 presign requests per minute per IP
- Short-lived URLs: 120-second TTL
- Max 50 files per request, 50MB per file

## File Naming Convention (v3.1)

All uploaded files must follow the v3.1 naming schema:

```
{date}-{shootcode}_{room_type}_{index}_v{version}.{ext}

Examples:
- 20241021-ABC12_kitchen_01_v1.jpg
- 20241021-ABC12_bedroom_02_v2.heic
- 20241021-ABC12_bathroom_01_v1.jpg
```

**Components:**
- **date**: YYYYMMDD format
- **shootcode**: 5-character uppercase code
- **room_type**: Room identifier (kitchen, bedroom, bathroom, livingroom, exterior, etc.)
- **index**: 2-digit sequence number (01-99)
- **version**: Version number (v1, v2, v3, etc.)
- **ext**: File extension (jpg, jpeg, heic, heif, png)

**Validation:**
- Filenames are validated on upload
- Invalid filenames return 422 Unprocessable Entity
- Date must be valid YYYYMMDD format
- Shootcode must match the shoot's code

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

## Deployment

### Cloudflare Workers Deployment (Wrangler)

The application is designed for seamless Cloudflare Workers deployment using Wrangler:

#### Prerequisites
```bash
npm install -g wrangler
wrangler login
```

#### Development Deployment
```bash
# Deploy to development environment
wrangler deploy --env development

# Watch mode (auto-deploy on changes)
wrangler dev
```

#### Production Deployment
```bash
# Build the application
npm run build

# Deploy to production
wrangler deploy --env production
```

#### Environment Configuration

The `wrangler.toml` file defines two environments:

**Development:**
- Namespace: `pix-immo-dev`
- Auto-deploys for testing
- Uses development secrets

**Production:**
- Namespace: `pix-immo`
- Manual deployments only
- Separate production secrets
- Custom domain routing

#### Required Secrets

Set secrets using Wrangler CLI (never commit to source):

```bash
# Development secrets
wrangler secret put DATABASE_URL --env development
wrangler secret put SESSION_SECRET --env development
wrangler secret put JWT_SECRET --env development

# Production secrets
wrangler secret put DATABASE_URL --env production
wrangler secret put SESSION_SECRET --env production
wrangler secret put JWT_SECRET --env production
wrangler secret put MAILGUN_API_KEY --env production
wrangler secret put REPLICATE_API_KEY --env production
```

#### R2 Bucket Setup

Uncomment and configure R2 bindings in `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "IMAGES_BUCKET"
bucket_name = "pix-immo-images"
preview_bucket_name = "pix-immo-images-dev"
```

Create buckets:
```bash
wrangler r2 bucket create pix-immo-images
wrangler r2 bucket create pix-immo-images-dev
```

### Architecture Benefits
- **Hono Framework**: Built for edge runtimes (Workers, Deno, Bun)
- **No Node.js APIs**: Routes use standard Web APIs
- **Modular Storage**: Drizzle ORM works with D1 or Neon PostgreSQL
- **Static Assets**: React SPA deploys to Pages or R2
- **Global CDN**: Sub-100ms response times worldwide

### Why It Works
- All HTTP handling uses Hono's Workers-compatible API
- Database queries use Drizzle ORM (supports D1 and PostgreSQL)
- No Node.js-specific dependencies in route handlers
- Session management can use Workers KV or external store
- Environment separation prevents dev/prod conflicts

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
