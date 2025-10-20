# Replit Requirements Checklist · pix.immo (as of Oct 20 2025)

## A. Public Pages (SEO / Conversion)
- [x] **Home Page** – basic layout done; fine-tuning for hero section, menu overlay, typography, spacing.
- [x] **Portfolio / Gallery** – completed.
- [x] **Blog / News** – completed.
- [ ] **Public Price List** – short overview for SEO; link to customer login for full booking options.
- [ ] **Contact Page** – form + GDPR notice, spam protection.
- [ ] **About / Services** – short description of photo, drone, 360°, and text services.
- [ ] **FAQ** – typical questions (process, delivery time, rights).
- [ ] **References / Testimonials** – optional, later phase.

## B. Legal Pages
- [ ] **Imprint** – integrate final contact details (Hamburg + Berlin offices).
- [ ] **Privacy Policy** – must include note about anonymized, non-EU image processing via Modal/Replicate.
- [ ] **Terms & Conditions (AGB)** – reviewed version ready to include.

## C. Authentication & Client Area
- [ ] **Login / Registration** – Lucia/Auth (Cloudflare compatible) with email verification.
- [ ] **Client Dashboard** – overview of active orders, uploads, delivery status, invoices.
- [ ] **Booking Form (inside login)** – checkbox-based package/add-on selection with live total price.
- [ ] **Address Verification** – Google Places API (Autocomplete + Place Details + Map loaded after input).
- [ ] **Upload Page (production)** – based on the existing demo; upload to R2 buckets per shoot/stack (3- or 5-frame blocks).
- [ ] **Filename Schema** – enforce v3.1 format: `{date}-{shootcode}_{room_type}_{index}_v{ver}.jpg`.
- [ ] **Editor Handover** – one signed download link + one upload link; return as single ZIP (email + SMS, no WhatsApp).
- [ ] **Notifications** – Mailgun/SMS for booking confirmation, upload success, and delivery ready.

## D. Pricing & Booking Logic
- [ ] **Pricing Calculation** – 19 % VAT, EUR; checkbox add-ons; live total sum; include address data.
- [ ] **TidyCal Webhook** – “Book Now” button triggers TidyCal event with property address; SMS confirmation via TidyCal.
- [ ] **Alternative: TidyCal iFrame (fallback)** – if webhook fails.
- [ ] **Invoice / Payment Status** – Stripe link or invoice email (optional, phase 2).

## E. Gallery / Delivery Specification
- [x] **Alt-Text Export** – provide both `.txt` and `.json` per image (CRM-ready: FIO, onOffice, Propstack).
- [ ] **Download Center** – final images, alt-text packages, optional Exposé (PDF or Markdown).

## F. Automations & AI Workflow
- [x] **Quiet-Window Trigger** – 60 min post-shoot: OCR / Caption / Exposé trigger defined.
- [ ] **CogVLM2 Captioning Pipeline** – send to Modal job; downscale to 3000 px sRGB Q85 before processing.
- [ ] **Room-Type Mapping** – list of room names → prompt mapping; worker routing per room type.
- [ ] **Exposé Generator** – enrich captions with booking and location data; store result in client account.
- [ ] **Retouch System (Clients Only)** – Replicate models; works only for pix.immo-produced images; pricing visible.
- [ ] **OCR / JSON Sidecars** – structured metadata per image.

## G. Media / Data Flow
- [x] **Stacks (3 or 5 Frames)** – must stay together in order; used for HDR merging.
- [x] **No Google Drive** – confirmed decision.
- [ ] **R2 Buckets Structure** – `intake / processed / delivery`; signed URLs; finalize CORS rules.
- [ ] **Worker Chain** – Upload Worker → Analysis → Text → Gallery Writer; logging + retry mechanism.

## H. UI Components
- [ ] **Masonry Grid** – 4 columns, ~25 rows; 75 % landscape (1500×1000), 10 % portrait (1000×1500), 15 % square (1000×1000); hover overlay with alt-text in white.
- [ ] **Hero Section** – remove large Pix.Immo logo; menu overlay must not blur the page; adjust spacing and type size.
- [ ] **Form Validation** – required fields, error messages in DE/EN.

## I. Content / SEO
- [ ] **Structured Data (Schema.org)** – LocalBusiness, Service, FAQ, Breadcrumb.
- [ ] **Meta Tags / Open Graph** – per page.
- [ ] **Sitemap / Robots.txt** – auto-generated on deploy.

## J. DevOps / Deployment
- [ ] **Replit → GitHub** – sync repo and include docs + readme.
- [ ] **GitHub → Cloudflare** – CI deploy via Wrangler; set environment variables (Mailgun, Replicate, Modal, Google Places).
- [ ] **Staging / Production Environments** – feature flags (e.g., Retouch = beta).
- [ ] **Monitoring / Logs** – Worker logs, error alerts via mail or SMS.
