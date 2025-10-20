# pix.immo - Real Estate Media Platform

## Overview
pix.immo is a professional real estate media platform designed to connect real estate professionals with photography services. Built with Node.js 22 and TypeScript, it features an order management system for property photography, robust session-based authentication with role-based access control, and a React single-page application (SPA) frontend. Future enhancements include AI-powered image analysis for automated caption generation via the Replicate API and seamless deployment to Cloudflare Workers, leveraging Hono as the backend framework for edge compatibility. The platform aims to streamline the process of ordering and managing property photography, ultimately enhancing property listings with high-quality, AI-analyzed media.

## User Preferences
- Hono for Cloudflare Workers compatibility
- React SPA with Wouter routing
- Shadcn components for consistent UI
- TypeScript for type safety
- Clean, modern developer-focused interfaces
- Secure environment variable management (no hardcoded secrets)

## System Architecture

### UI/UX Decisions
The frontend is a React 18 SPA utilizing Wouter for routing. It employs Shadcn UI components with Tailwind CSS for a modern, responsive design that supports dark/light modes. Forms are managed with `react-hook-form` and `zod` for validation. Interactive elements include `data-testid` attributes for testing.

### Technical Implementations
- **Backend**: Hono v4 framework (Cloudflare Workers compatible) running on Node.js 22.
- **Frontend**: React 18 SPA with Wouter, Shadcn UI, Tailwind CSS, `react-hook-form` + `zod`, and TanStack Query v5 for data fetching.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Object Storage**: Replit Object Storage (Google Cloud Storage) for RAW images, edited files, and handoff packages. Structure: `/projects/{job_id}/raw/{shoot_id}/`, `/projects/{job_id}/edits/{shoot_id}/final/`, `/projects/{job_id}/handoff/`, `/projects/{job_id}/meta/`.
- **Authentication**: Custom session-based authentication using HTTP-only cookies and Scrypt password hashing. The design is Lucia-compatible, with optional JWT/Bearer token support for API access. Features include password reset flows with secure one-time tokens and rate limiting on all authentication endpoints.
- **Order Management**: API endpoints for creating, viewing, and updating property photography orders, with role-based authorization.
- **Photo Workflow System (Sprint 1 - PRODUCTION READY)**:
  - **Jobs**: Each property photography project gets a unique job with `job_number` format `PIX-{timestamp}-{random}`
  - **Shoots**: Photo shoot sessions with 5-character `shoot_code` (first 5 chars of UUID)
  - **Stacks**: Groups of 3 or 5 bracketed images with room-type assignment, automatic grouping by exposure sequence
  - **Images**: RAW files with metadata tracking (EXIF dates, exposure values, file paths), object storage integration
  - **Editor Tokens**: Secure 36-hour signed tokens for handoff download and editor upload
  - **Filename Convention**: RAW handoff: `{date}-{shootcode}_{room_type}_{index}_g{stack}_e{ev}.{ext}`, Final: `{date}-{shootcode}_{room_type}_{index}_v{ver}.jpg`
  - **Auto-Stacking**: Intelligent bracketing detection supporting 3-frame and 5-frame exposures with proper sequence ordering
  - **Handoff Package**: ZIP generation with manifest.json, renamed files per convention, signed download links
  - **Editor Return**: ZIP uploads persisted to object storage at `/projects/{job_id}/edits/{shoot_id}/editor_return.zip`
  - **Background Queue**: 60-minute quiet window before processing editor returns (stub implementation)
  - **Notifications**: Email and SMS alerts for handoff-ready and editor-upload-complete events (stub implementation)
  - **Production Routes**: All Sprint 1 workflow routes fully migrated to Hono (server/index.ts) for Cloudflare Workers compatibility. Development routes (server/routes.ts) maintained for HMR/debugging parity.
- **Development Server**: Express + Vite middleware for development with HMR, proxied API requests to the Hono backend.
- **Production Server**: Hono serves static files and handles API requests, designed for Cloudflare Workers.

### Feature Specifications
- **Authentication**: Signup, login, logout, password reset, session management, optional JWT token refresh.
- **User Roles**: "admin" and "client" with distinct access privileges.
- **Order Management**: Create new orders, view orders (clients see own, admins see all), view single order, update order status (admin only). Order statuses include pending, confirmed, completed, cancelled.
- **Rate Limiting**: IP-based rate limiting on authentication endpoints for brute-force protection (e.g., 5 requests/minute for login).
- **Homepage**: Minimalist design inspired by NewApology aesthetic. Features sticky header with hamburger menu, generous whitespace (35vh), hero section with "PIX.IMMO" title and "Corporate real estate photography" subtitle, plain text navigation links (Portfolio, Preise, Blog, Login), horizontal scrolling image strip with 11px gaps and infinite loop animation, and minimal footer with legal links (Impressum, Datenschutz, Kontakt).
- **Gallery**: JavaScript-driven masonry layout with absolute positioning for exact 11px spacing (both horizontal and vertical). Features responsive columns (1/2/3/4 based on viewport), progressive image loading with retry mechanism, dark overlay on hover with caption text, and lightbox modal for full-size viewing.
- **Blog**: Two-page blog system with overview and detail pages. Overview page (/blog) displays 9 blog posts in a responsive grid (1/2/3 columns) with portrait images (2:3 aspect ratio), 11px gaps, and dark overlay on hover showing title. Detail pages (/blog/:slug) feature full-width portrait hero image with title overlay, narrow centered text column (max-w-xl/576px), and landscape images embedded between paragraphs using -mx-6 negative margins to extend to article gutter. All content in German.
- **Preise** (/preise): Comprehensive pricing page with 8 service sections:
  - Immobilienfotografie (Real Estate Photography) - from €180
  - Drohnenaufnahmen (Drone shots) - from €150 (or €100 as package add-on)
  - Videoaufnahmen (Video recordings) - from €199
  - Virtuelle Rundgänge/360° Tours - from €100 (basic) or €239 (extended)
  - Virtuelles Staging (Virtual Staging) - on request
  - Bildoptimierung und KI-Retusche (Image optimization) - from €3.90/image
  - Travel fees and service area information (Hamburg & Berlin)
  - Call-to-action section linking to login and contact pages
- **Legal Pages**: Three information pages accessible from footer and hamburger menu:
  - **Impressum** (/impressum): Company information, legal notice (§5 TMG, §18 MStV), TDM copyright notice (§44b UrhG), and data protection summary
  - **AGB** (/agb): Complete terms and conditions with 9 sections covering contracts, image rights, usage licensing, fees, liability, and dispute resolution
  - **Kontakt** (/kontakt): Contact information for Hamburg (main office - Daniel Fortmann) and Berlin (partner - Nino Gehrig Photography) with emails and phone numbers

### System Design Choices
The architecture is designed for Cloudflare Workers compatibility, leveraging Hono for its edge-native capabilities. The application separates the development server (Express+Vite) from the production server (Hono) to optimize both environments. Security features include Scrypt hashing, HTTP-only cookies, `SameSite=lax`, and secure environment variable management.

**Homepage Implementation**: Minimalist single-page design with black/white/gray color scheme (except for image strip). Features horizontal scrolling strip with CSS gradient dummy images (mixed aspect ratios: 3:2 landscape, 2:3 portrait, 1:1 square). Strip uses 11px gaps and infinite loop animation (120s duration, translates -66.667% to scroll through 2 of 3 image sets for seamless loop). Animation pauses on hover. Hamburger menu opens full-screen overlay with all navigation items, closes on Escape key or click outside, prevents body scroll when open.

**Gallery Implementation**: Uses JavaScript-driven absolute positioning instead of CSS Grid to achieve exact 11px spacing. CSS Grid with row-spanning cannot achieve consistent vertical spacing due to Math.ceil() creating 0-11px slack per image. The JS solution tracks column heights, places each image in the shortest column using `transform: translate(x, y)`, and guarantees both horizontal and vertical gaps are exactly 11px. Includes progressive image loading with error handling, fallback timeout (2s), and retry mechanism (5 retries @ 1s intervals).

**Blog Implementation**: Frontend-only blog using mock data (no database). Blog overview (/blog) uses CSS Grid (grid-cols-1 md:grid-cols-2 lg:grid-cols-3) with 11px gap and portrait images. Each card has hover effect (dark overlay with title) and links to detail page. Blog post detail pages (/blog/:slug) use narrow content container (max-w-xl/576px) with embedded landscape images that break out to gutter using -mx-6. Navigation from homepage uses proper routes (/blog) not hash anchors. All text in German.

## External Dependencies
- **Database**: PostgreSQL (specifically Neon for cloud deployment)
- **Email Service**: Mailgun (planned for email delivery, e.g., password resets)
- **AI Service**: Replicate API (planned for AI image captioning)