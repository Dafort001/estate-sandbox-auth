# pix.immo - Real Estate Media Platform

## Overview
pix.immo is a professional real estate media platform built with Node.js 22, TypeScript, and React. Its core purpose is to connect real estate professionals with photography services, streamlining the ordering and management of property photography. Key features include an order management system, robust session-based authentication with role-based access control, a React SPA frontend, and a Progressive Web App (PWA) mobile camera integration for on-site photo capture. The platform is designed for future integration with AI for image analysis and deployment to Cloudflare Workers, aiming to enhance property listings with high-quality, AI-analyzed media.

## User Preferences
- Hono for Cloudflare Workers compatibility
- React SPA with Wouter routing
- Shadcn components for consistent UI
- TypeScript for type safety
- Clean, modern developer-focused interfaces
- Secure environment variable management (no hardcoded secrets)

## System Architecture

### UI/UX Decisions
The frontend is a React 18 SPA using Wouter for routing, Shadcn UI components, and Tailwind CSS for a modern, responsive design with dark/light mode support. Forms are managed with `react-hook-form` and `zod` for validation.

### Technical Implementations
- **Backend**: Hono v4 framework (Cloudflare Workers compatible) on Node.js 22.
- **Frontend**: React 18 SPA with Wouter, Shadcn UI, Tailwind CSS, `react-hook-form` + `zod`, and TanStack Query v5.
- **Database**: PostgreSQL (Neon) with Drizzle ORM.
- **Object Storage**: Replit Object Storage (Google Cloud Storage) for RAW images, edited files, and handoff packages.
- **Authentication**: Custom session-based authentication with HTTP-only cookies and Scrypt password hashing, designed to be Lucia-compatible, with password reset flows and rate limiting.
- **Order Management**: API for creating, viewing, and updating property photography orders with role-based authorization.
- **Service Catalog & Booking System**: Comprehensive catalog of 25 services across 7 categories, an internal price list, and a multi-step booking wizard.
- **Google Maps Integration**: Rooftop-accurate address verification using Google Places Autocomplete, Geocoding API for validation, and Static Maps API for thumbnail previews. Address data (lat/lng/placeId/formatted) stored in orders, jobs, and bookings tables.
- **Photo Workflow System**: Manages jobs, shoots, image stacks (bracketed images), RAW file handling, secure editor tokens, filename conventions, auto-stacking, ZIP handoff packages, and editor returns.
- **Client Gallery with Collaboration Features**: Displays completed projects, an image viewer with lightbox, a favorites system, and a comments system for client feedback on images. Includes bulk and individual image download functionality.
- **QA-Autofix System with Naming Policy v3.1**: System-Check Framework with plugin-based architecture validating authentication, routes, upload system, naming conventions, room taxonomy (34 types). Reports in JSON/Markdown format, severity-based exit codes (0/1/2/3). CLI: `tsx server/selftest/cli.ts`
- **Mobile Camera Integration (PWA)**: Progressive Web App with /capture routes for on-site photo capture. Features: Camera page with MediaDevices API, front/back camera flip, photo capture, review page, upload integration with R2 storage. Includes Service Worker for offline support and install-to-homescreen capability.
- **Mobile App (/app/\*)**: Standalone mobile-first PWA app with 4 screens implementing complete photo workflow. Uses iOS design patterns with StatusBar, HapticButton, BottomNav components. Includes Safe-Area CSS utilities for notch support, MediaDevices API with proper cleanup (streamRef pattern), sessionStorage photo management, and comprehensive data-testid coverage for QA automation.
- **Development Server**: Express + Vite middleware for HMR and proxied API requests.
- **Production Server**: Hono serves static files and API requests, optimized for Cloudflare Workers.

### Feature Specifications
- **Authentication**: Signup, login, logout, password reset, session management, and optional JWT token refresh.
- **User Roles**: "admin" and "client" with distinct access.
- **Order Management**: Create, view, and update orders with defined statuses.
- **Rate Limiting**: IP-based rate limiting on authentication endpoints.
- **Homepage**: Minimalist design with a sticky header, hero section, horizontal scrolling image strip, and minimalist footer.
- **Gallery**: JavaScript-driven masonry layout with responsive columns, progressive image loading, and a lightbox modal.
- **Blog**: Two-page system with an overview grid and detailed post pages, using mock data.
- **Preise (Pricing Page)**: Comprehensive pricing for 8 service sections including photography, drone, video, virtual tours, staging, image optimization, and travel fees.
- **Legal & Information Pages**: Includes Impressum, AGB, Datenschutz, Kontakt, Kontakt-Formular, About, and FAQ pages.
- **Mobile Camera Capture**: PWA-enabled camera interface at /capture/* with 4 pages (index, camera, review, upload). Uses browser MediaDevices API for native camera access, supports front/back flip, captures high-res photos, integrates with existing R2 upload endpoints. Camera cleanup uses ref pattern to ensure MediaStream stops on all navigation methods.
- **Mobile App Screens (/app/\*)**: SplashScreen (/app), CameraScreen (/app/camera), GalleryScreen (/app/gallery), UploadScreen (/app/upload). iOS-style design with StatusBar (notch support), HapticButton (vibration feedback), BottomNav (tab navigation). All dynamic status elements have data-testid attributes for QA automation. Photo workflow: camera → gallery → upload with sessionStorage persistence and animated progress indicators.
- **Web Portal (/portal/\*)**: Professional client portal with 5 screens for complete photo order workflow. Includes UploadsOverview (/portal/uploads) with job listing and status tracking, GallerySelection (/portal/gallery/:jobId) with multi-select image interface, Payment (/portal/payment/:jobId) with Stripe checkout integration, StatusTimeline (/portal/status/:jobId) with 5-step progress tracker, and Delivery (/portal/delivery/:jobId) with download packages. All screens implement comprehensive loading skeletons, explicit error states with retry/navigation, apiRequest mutation pattern, queryClient cache invalidation, and complete data-testid coverage for QA automation.
- **Legacy Routes (/capture/\*)**: DEPRECATED - Original PWA camera implementation at /capture/* (index, camera, review, upload) pages. Superseded by improved /app/* mobile app with better iOS design patterns, haptic feedback, and sessionStorage workflow. Legacy routes remain for backwards compatibility but new development should use /app/* routes.

### System Design Choices
The architecture emphasizes Cloudflare Workers compatibility using Hono. It separates development (Express+Vite) and production (Hono) environments. Security features include Scrypt hashing, HTTP-only cookies, `SameSite=lax`, and secure environment variable management. Specific implementations for the homepage, gallery, and blog use custom JavaScript and CSS techniques for precise layout and responsiveness. SEO is handled via a `SEOHead` component, Schema.org templates, a sitemap, and robots.txt.

### Quality Assurance & CI/CD
**Safe-Check Framework (v2.0.0 Planned):**
- **Current (v1.0.0)**: Plugin-based validation system with 4 operational plugins (Auth, Routes, Upload, Naming). Reports real issues, detected missing endpoints in production code.
- **Planned Extensions**: OpenAPI schema validation, TypeScript/Lint checks, mock services (R2/Stripe/Mailgun), database migration dry-run, E2E smoke flow (Upload→Payment→AI→Delivery).
- **CI/CD Integration**: GitHub Actions workflow, pre-commit hooks (Husky), automated PR comments, deployment gates based on severity.
- **Architecture**: See `server/selftest/ARCHITECTURE.md` for detailed plugin specs, roadmap, and technical decisions.

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **Email Service**: Mailgun (planned)
- **AI Services**: Modal Labs (USA) for image analysis, Replicate (USA) for advanced retouching. Both process anonymous, encrypted data.