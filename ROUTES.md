# pix.immo Routes Documentation

> **Last Updated:** 2025-10-21  
> **Version:** 1.0.0

This document provides a comprehensive overview of all frontend routes and API endpoints in the pix.immo application.

---

## Frontend Routes (Client-Side)

All frontend routes are defined in `client/src/App.tsx` using Wouter routing.

### Public Pages

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/` | Home | Homepage with hero section, image strip, and minimalist footer | No |
| `/login` | Login | User login form | No |
| `/register` | Register | User registration form | No |
| `/about` | About | About pix.immo and services | No |
| `/kontakt` | Contact | Contact information | No |
| `/kontakt-formular` | KontaktFormular | Contact form for inquiries | No |
| `/preise` | Pricing | Public pricing page (8 service sections) | No |
| `/faq` | FAQ | Frequently asked questions | No |

### Blog System

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/blog` | Blog | Blog overview with grid layout | No |
| `/blog/:slug` | BlogPost | Individual blog post detail page | No |

### Legal & Compliance Pages

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/impressum` | Imprint | Legal imprint (German requirement) | No |
| `/agb` | AGB | Terms and conditions (Allgemeine Geschäftsbedingungen) | No |
| `/datenschutz` | Datenschutz | Privacy policy (GDPR compliance) | No |

### Client Portal (Protected)

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/dashboard` | Dashboard | User dashboard with order overview | Yes |
| `/gallery` | Gallery | Property gallery with responsive masonry layout | Yes |
| `/galerie` | Galerie | Client gallery with collaboration features (favorites, comments) | Yes |
| `/order` | OrderForm | Create new order for property photography | Yes |
| `/buchen` | Booking | Multi-step booking wizard | Yes |
| `/booking-confirmation` | BookingConfirmation | Booking confirmation page | Yes |
| `/intake` | Intake | Intake form for project details | Yes |

### Workflow Pages (Protected)

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/jobs` | Jobs | List of all photography jobs | Yes (Client/Admin) |
| `/review/:jobId/:shootId` | Review | Review and approve shoot images | Yes (Client/Admin) |
| `/preisliste` | Preisliste | Internal price list | Yes (Admin) |

### Admin Pages

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `/admin/editorial` | AdminEditorial | Editorial management (blog posts, change requests) | Yes (Admin) |

### Error Pages

| Route | Component | Description | Auth Required |
|-------|-----------|-------------|---------------|
| `*` (catch-all) | NotFound | 404 Not Found page | No |

---

## API Endpoints (Backend)

All API endpoints are defined in `server/routes.ts` (Express/dev) and `server/index.ts` (Hono/production).

### Authentication & User Management

| Method | Endpoint | Description | Auth Required | Rate Limit |
|--------|----------|-------------|---------------|------------|
| POST | `/api/signup` | Create new user account (role: client) | No | 3/min |
| POST | `/api/login` | Authenticate user, create session | No | 5/min |
| POST | `/api/logout` | End user session | Yes | - |
| GET | `/api/me` | Get current authenticated user | Yes | - |
| POST | `/api/token/refresh` | Refresh JWT access token | Yes | 10/min |
| POST | `/api/password-reset/request` | Request password reset token | No | 10/hour |
| POST | `/api/password-reset/confirm` | Confirm password reset with token | No | 10/hour |

**Authentication Methods:**
- Session cookie (HttpOnly, SameSite=lax)
- JWT Bearer token (optional, for API clients)

**Rate Limiting:**
- All auth endpoints have IP-based rate limiting
- Exceeded limits return `429 Too Many Requests`

---

### Job Management

| Method | Endpoint | Description | Auth Required | Access |
|--------|----------|-------------|---------------|--------|
| POST | `/api/jobs` | Create new photography job | Yes | All users |
| GET | `/api/jobs` | List all jobs (admin) or user's jobs | Yes | Client: own, Admin: all |
| GET | `/api/jobs/:id` | Get specific job details | Yes | Owner or Admin |

**Job Status Flow:**
1. `created` - Initial state
2. `in_progress` - Shoot active
3. `edited_returned` - Editor uploaded files
4. `completed` - Handoff delivered

---

### Upload & Shoot Management

| Method | Endpoint | Description | Auth Required | Rate Limit |
|--------|----------|-------------|---------------|------------|
| POST | `/api/uploads/init` | Initialize shoot for job number | Yes | - |
| POST | `/api/shoots/:id/presign` | Get presigned URLs for upload | Yes | 20/min |
| POST | `/api/shoots/:id/upload` | **DEPRECATED** - Use presign flow | Yes | 30/min |
| GET | `/api/shoots/:id` | Get shoot details | Yes | - |
| GET | `/api/shoots/:id/stacks` | Get all stacks for shoot | Yes | - |
| GET | `/api/shoots/:id/images` | Get all images for shoot | Yes | - |

**Presigned Upload Flow:**

1. **Initialize Shoot:**
   ```bash
   POST /api/uploads/init
   Body: { "jobNumber": "J-123456" }
   Response: { "shootId": "...", "shootCode": "...", "jobId": "..." }
   ```

2. **Request Presigned URLs:**
   ```bash
   POST /api/shoots/:shootId/presign
   Body: { 
     "files": [
       {
         "filename": "20241021-ABC12_kitchen_01_v1.jpg",
         "contentType": "image/jpeg",
         "size": 5242880
       }
     ]
   }
   Response: {
     "urls": [
       {
         "filename": "...",
         "uploadUrl": "https://storage.googleapis.com/...",
         "expiresIn": 120
       }
     ]
   }
   ```

3. **Upload Directly to Storage:**
   ```bash
   PUT <uploadUrl>
   Headers: Content-Type, Content-Length
   Body: <binary data>
   ```

**Security Features:**
- Ownership validation
- v3.1 filename schema validation
- 120-second URL expiration
- Max 50 files per request
- Max 50MB per file

---

### Stack & Image Management

| Method | Endpoint | Description | Auth Required | Access |
|--------|----------|-------------|---------------|--------|
| PUT | `/api/stacks/:id/room-type` | Assign room type to stack | Yes | Owner or Admin |
| GET | `/api/images/:shootId` | Get images for gallery | Yes | Owner or Admin |
| POST | `/api/images/:imageId/favorite` | Toggle favorite status | Yes | Owner or Admin |
| POST | `/api/images/:imageId/comment` | Add comment to image | Yes | Owner or Admin |
| GET | `/api/images/:imageId/comments` | Get all comments for image | Yes | Owner or Admin |

**Room Types:**
- `living_room`
- `kitchen`
- `bathroom`
- `bedroom`
- `dining_room`
- `hallway`
- `office`
- `exterior`
- `undefined_space`

---

### Handoff & Editor Workflow

| Method | Endpoint | Description | Auth Required | Rate Limit |
|--------|----------|-------------|---------------|------------|
| POST | `/api/projects/:jobId/handoff/:shootId` | Generate handoff package (ZIP) | Yes | 10/min |
| POST | `/api/editor/:token/upload` | Editor upload endpoint (secure token) | Token | - |

**Handoff Package Structure:**
```
handoff_J-123456_ABC12_20241021.zip
├── RAW/
│   ├── 20241021-ABC12_kitchen_01_v1.jpg
│   └── ...
├── EDITED/
│   ├── 20241021-ABC12_kitchen_01_FINAL.jpg
│   └── ...
└── metadata.json
```

**Editor Tokens:**
- Type: `upload` or `download`
- Expiration: 7 days (upload), 30 days (download)
- One-time use enforcement
- Secure random token generation

---

### Services & Booking

| Method | Endpoint | Description | Auth Required | Access |
|--------|----------|-------------|---------------|--------|
| GET | `/api/services` | Get all available services | No | Public |
| POST | `/api/bookings` | Create new booking | Yes | All users |
| GET | `/api/bookings/:id` | Get booking details | Yes | Owner or Admin |

**Service Categories:**
1. Photography (F10-F40)
2. Drone (D10-D30)
3. Video (V10-V40)
4. Virtual Tours (VT10-VT30)
5. Staging (S10-S20)
6. Optimization (O10-O30)
7. Travel Fees (TR10-TR30)

**Total Services:** 25 across 7 categories

---

### Editorial Management (Admin)

| Method | Endpoint | Description | Auth Required | Access |
|--------|----------|-------------|---------------|--------|
| GET | `/api/editorial` | Get editorial items | Yes | Admin |
| POST | `/api/editorial` | Create editorial item | Yes | Admin |
| PATCH | `/api/editorial/:id` | Update editorial item | Yes | Admin |
| POST | `/api/editorial/:id/comments` | Add comment to item | Yes | Admin |

**Editorial Item Types:**
- `blog_post` - Blog content
- `change_request` - System change requests

**Editorial Categories:**
- `photo` - Photography related
- `ai` - AI/ML features
- `marketing` - Marketing content
- `infra` - Infrastructure changes
- `legal` - Legal/compliance
- `other` - Miscellaneous

**Editorial Status Flow:**
1. `idea` - Initial concept
2. `queued` - Approved for work
3. `drafting` - Work in progress
4. `in_review` - Ready for review
5. `scheduled` - Scheduled for publish
6. `published` - Live (blog posts)
7. `done` - Completed (change requests)

---

### Orders (Legacy - Deprecated)

| Method | Endpoint | Description | Auth Required | Access |
|--------|----------|-------------|---------------|--------|
| POST | `/api/orders` | Create order | Yes | All users |
| GET | `/api/orders` | List orders | Yes | Client: own, Admin: all |
| GET | `/api/orders/:id` | Get order details | Yes | Owner or Admin |
| PATCH | `/api/orders/:id/status` | Update order status | Yes | Admin only |

**Note:** The legacy order system is being replaced by the Jobs → Shoots → Stacks workflow.

---

### Health & Monitoring

| Method | Endpoint | Description | Auth Required | Format |
|--------|----------|-------------|---------------|--------|
| GET | `/api/health` | Legacy health check | No | `{ "status": "ok", "timestamp": ... }` |
| GET | `/healthz` | Health check for CI/CD | No | `{ "status": "ok", "env": "...", "timestamp": "...", "service": "pix.immo", "version": "..." }` |

**Use Cases:**
- `/api/health` - Legacy compatibility
- `/healthz` - Monitoring services, load balancers, CI/CD pipelines

---

## File Naming Convention (v3.1)

All uploaded files **must** follow the v3.1 naming schema:

```
{date}-{shootcode}_{room_type}_{index}_v{version}.{ext}
```

**Examples:**
- ✅ `20241021-ABC12_kitchen_01_v1.jpg`
- ✅ `20241021-ABC12_bedroom_02_v2.heic`
- ✅ `20241021-ABC12_exterior_01_v1.jpg`
- ❌ `IMG_1234.jpg` (invalid format)
- ❌ `kitchen_photo.jpg` (invalid format)

**Components:**
- **date:** YYYYMMDD format (e.g., `20241021`)
- **shootcode:** 5-character uppercase code (e.g., `ABC12`)
- **room_type:** Room identifier from enum
- **index:** 2-digit sequence (01-99)
- **version:** Version number (v1, v2, v3, etc.)
- **ext:** File extension (jpg, jpeg, heic, heif, png)

**Validation:**
- Server validates all filenames on upload
- Invalid filenames return `422 Unprocessable Entity`
- Date must be valid YYYYMMDD
- Shootcode must match the shoot's code

---

## Error Responses

All API endpoints follow consistent error response format:

```json
{
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful request
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation failed
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

---

## Navigation Structure

### Main Navigation (Public)
- Home
- Preise (Pricing)
- Galerie (Gallery)
- Blog
- Über uns (About)
- Kontakt (Contact)

### User Navigation (Authenticated)
- Dashboard
- Meine Aufträge (My Orders)
- Galerie (Gallery)
- Buchen (Booking)
- Profil (Profile)
- Abmelden (Logout)

### Admin Navigation (Admin Role)
- Dashboard
- Alle Aufträge (All Orders)
- Editorial
- Statistiken (Analytics)
- Einstellungen (Settings)

### Footer Navigation
- Impressum (Imprint)
- AGB (Terms)
- Datenschutz (Privacy)
- Kontakt (Contact)
- FAQ

---

## Route Patterns

### Parameter Routes
- `/blog/:slug` - Blog post by slug
- `/review/:jobId/:shootId` - Review specific shoot
- `/api/jobs/:id` - Job by UUID
- `/api/shoots/:id` - Shoot by UUID
- `/api/stacks/:id` - Stack by UUID
- `/api/editor/:token/upload` - Editor upload with token

### Query Parameters
- `/api/login?token=true` - Request JWT instead of session cookie
- `/api/orders?status=pending` - Filter orders by status (future)
- `/api/jobs?userId=...` - Filter jobs by user (future)

### Nested Routes
- `/api/projects/:jobId/handoff/:shootId` - Handoff for specific job+shoot
- `/api/shoots/:id/stacks` - Stacks for specific shoot
- `/api/shoots/:id/images` - Images for specific shoot
- `/api/images/:imageId/comments` - Comments for specific image

---

## Route Protection

### Public Routes (No Auth)
All public pages, blog, legal pages, health checks, services API

### Protected Routes (Auth Required)
Dashboard, gallery, orders, jobs, bookings, profile, upload endpoints

### Admin Routes (Admin Role)
Admin editorial, all orders, user management (future), system settings (future)

### Token-Based Routes
Editor upload endpoint (requires valid editor token)

---

## Future Routes (Planned)

### User Management (Admin)
- `GET /api/admin/users` - List all users
- `PATCH /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user

### Analytics & Reporting
- `GET /api/analytics/dashboard` - Dashboard metrics
- `GET /api/analytics/jobs` - Job statistics
- `GET /api/analytics/revenue` - Revenue reports

### Payment Processing
- `POST /api/payments/intent` - Create payment intent
- `POST /api/payments/confirm` - Confirm payment
- `GET /api/invoices` - List invoices
- `GET /api/invoices/:id` - Get invoice details

### AI Integration
- `POST /api/ai/caption` - Generate image captions
- `POST /api/ai/analyze` - Analyze image quality
- `GET /api/ai/status/:jobId` - Check AI processing status

---

**Note:** This document should be updated whenever new routes are added or existing routes are modified. Use `git grep "Route path=" client/src/App.tsx` to verify frontend routes and `git grep "app\.(get|post|put|patch|delete)" server/` to verify API endpoints.
