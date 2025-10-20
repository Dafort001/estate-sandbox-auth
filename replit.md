# pix.immo - Real Estate Media Platform

## Overview
pix.immo is a professional real estate media platform built with Node.js 22, TypeScript, and React. Its core purpose is to connect real estate professionals with photography services, streamlining the ordering and management of property photography. Key features include an order management system, robust session-based authentication with role-based access control, and a React SPA frontend. The platform is designed for future integration with AI for image analysis and deployment to Cloudflare Workers, aiming to enhance property listings with high-quality, AI-analyzed media.

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
- **Photo Workflow System**: Manages jobs, shoots, image stacks (bracketed images), RAW file handling, secure editor tokens, filename conventions, auto-stacking, ZIP handoff packages, and editor returns.
- **Client Gallery with Collaboration Features**: Displays completed projects, an image viewer with lightbox, a favorites system, and a comments system for client feedback on images. Includes bulk and individual image download functionality.
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

### System Design Choices
The architecture emphasizes Cloudflare Workers compatibility using Hono. It separates development (Express+Vite) and production (Hono) environments. Security features include Scrypt hashing, HTTP-only cookies, `SameSite=lax`, and secure environment variable management. Specific implementations for the homepage, gallery, and blog use custom JavaScript and CSS techniques for precise layout and responsiveness. SEO is handled via a `SEOHead` component, Schema.org templates, a sitemap, and robots.txt.

## External Dependencies
- **Database**: PostgreSQL (Neon)
- **Email Service**: Mailgun (planned)
- **AI Services**: Modal Labs (USA) for image analysis, Replicate (USA) for advanced retouching. Both process anonymous, encrypted data.