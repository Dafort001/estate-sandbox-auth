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
- **Authentication**: Custom session-based authentication using HTTP-only cookies and Scrypt password hashing. The design is Lucia-compatible, with optional JWT/Bearer token support for API access. Features include password reset flows with secure one-time tokens and rate limiting on all authentication endpoints.
- **Order Management**: API endpoints for creating, viewing, and updating property photography orders, with role-based authorization.
- **Development Server**: Express + Vite middleware for development with HMR, proxied API requests to the Hono backend.
- **Production Server**: Hono serves static files and handles API requests, designed for Cloudflare Workers.

### Feature Specifications
- **Authentication**: Signup, login, logout, password reset, session management, optional JWT token refresh.
- **User Roles**: "admin" and "client" with distinct access privileges.
- **Order Management**: Create new orders, view orders (clients see own, admins see all), view single order, update order status (admin only). Order statuses include pending, confirmed, completed, cancelled.
- **Rate Limiting**: IP-based rate limiting on authentication endpoints for brute-force protection (e.g., 5 requests/minute for login).
- **Homepage**: Minimalist design inspired by NewApology aesthetic. Features sticky header with hamburger menu, generous whitespace (35vh), hero section with "PIX.IMMO" title and "Corporate real estate photography" subtitle, plain text navigation links (Portfolio, Preise, Blog, Login), horizontal scrolling image strip with 11px gaps and infinite loop animation, and minimal footer with legal links (Impressum, Datenschutz, Kontakt).
- **Gallery**: JavaScript-driven masonry layout with absolute positioning for exact 11px spacing (both horizontal and vertical). Features responsive columns (1/2/3/4 based on viewport), progressive image loading with retry mechanism, dark overlay on hover with caption text, and lightbox modal for full-size viewing.

### System Design Choices
The architecture is designed for Cloudflare Workers compatibility, leveraging Hono for its edge-native capabilities. The application separates the development server (Express+Vite) from the production server (Hono) to optimize both environments. Security features include Scrypt hashing, HTTP-only cookies, `SameSite=lax`, and secure environment variable management.

**Homepage Implementation**: Minimalist single-page design with black/white/gray color scheme (except for image strip). Features horizontal scrolling strip with CSS gradient dummy images (mixed aspect ratios: 3:2 landscape, 2:3 portrait, 1:1 square). Strip uses 11px gaps and infinite loop animation (120s duration, translates -66.667% to scroll through 2 of 3 image sets for seamless loop). Animation pauses on hover. Hamburger menu opens full-screen overlay with all navigation items, closes on Escape key or click outside, prevents body scroll when open.

**Gallery Implementation**: Uses JavaScript-driven absolute positioning instead of CSS Grid to achieve exact 11px spacing. CSS Grid with row-spanning cannot achieve consistent vertical spacing due to Math.ceil() creating 0-11px slack per image. The JS solution tracks column heights, places each image in the shortest column using `transform: translate(x, y)`, and guarantees both horizontal and vertical gaps are exactly 11px. Includes progressive image loading with error handling, fallback timeout (2s), and retry mechanism (5 retries @ 1s intervals).

## External Dependencies
- **Database**: PostgreSQL (specifically Neon for cloud deployment)
- **Email Service**: Mailgun (planned for email delivery, e.g., password resets)
- **AI Service**: Replicate API (planned for AI image captioning)