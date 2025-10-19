
# 📘 pix.immo — Technical Briefing v2 (Strategic Document)

## Current Progress Snapshot (October 2025)

- Cloudflare Worker and R2 bucket for uploads are operational (`piximmo-upload-worker`, tested locally with Wrangler).
- Upload demo page layout complete and serving as design baseline for final UI.
- DSGVO/Privacy notice concept finalized (anonymous image processing on non-EU servers).
- Google Places API and TidyCal integrations defined for booking page functionality.
- CRM compatibility format (.txt + .json) confirmed as standard deliverable format.
- Replit environment established for backend and UI development (Lucia Auth, Hono, Drizzle ORM).

---

## 1. Overview & Objectives

**pix.immo** is a next-generation real estate photography and media automation platform.  
It integrates AI-assisted image captioning, automated gallery generation, and client-facing dashboards to streamline how real estate agents and photographers manage property presentations.  

### Core Objectives
- Simplify the media workflow from upload to delivery.
- Automate image captioning and text generation for Exposés.
- Enable clients to access and download their content through a secure login area.
- Ensure all data processing complies with European GDPR standards.
- Maintain interoperability with professional CRM systems such as FIO, onOffice, and Propstack.

---

## 2. System Architecture

The pix.immo system architecture is modular, cloud-based, and API-driven.  
It ensures scalability, resilience, and ease of maintenance while minimizing vendor lock-in.

### 2.1 Core Components

**1. Cloudflare Workers + R2**
- Hosts serverless logic for uploads, file routing, and API endpoints.
- R2 serves as the central object storage for images, captions, and gallery metadata.

**2. Replicate (AI Captioning Service)**
- Provides AI-powered image captioning based on CogVLM models.
- Processes anonymized image data (e.g., “Livingroom_01.jpg”).
- Returns structured captions in both `.txt` (readable) and `.json` (machine-parsable) formats.
- Future migration path: Modal integration for enhanced performance.

**3. Mailgun**
- Handles all transactional email flows such as password resets, notifications, and confirmations.

**4. PostgreSQL + Drizzle ORM**
- Stores user data, authentication sessions, orders, and metadata.
- Provides secure and auditable data persistence.

**5. Google Places API**
- Supports address autocomplete and coordinate validation during the booking process.

**6. TidyCal**
- Integrated via iframe to allow clients to book photography sessions directly within the platform.

**7. Frontend Layer (Replit + Cloudflare Pages)**
- Developed with Hono framework and Rapid UI components.
- Provides structured pages: Home, Upload, Dashboard, Gallery, Order Form, and Booking.

---

## 3. Functional Modules

### 3.1 Upload & File Handling
- Clients upload media directly to the Cloudflare R2 bucket via signed URLs.
- File naming conventions (e.g., “Kitchen_01”) determine AI caption prompts.
- Uploaded files are processed asynchronously through Replicate’s API.

### 3.2 AI Captioning (Replicate API)
- Images are analyzed using CogVLM to extract descriptive language for marketing use.
- Captions are stored in two synchronized formats:
  - `.txt` — human-readable text for agents and clients.
  - `.json` — machine-readable metadata for CRM import.

### 3.3 Client Authentication (Lucia Auth)
- Secure authentication managed via Lucia (Hono + PostgreSQL).
- Session handling through secure HTTP-only cookies.
- Password resets handled via Mailgun with unique tokens.

### 3.4 Dashboard
- Central client area displaying:
  - Upload status and links to generated captions.
  - Gallery access and order history.
  - Embedded booking link (TidyCal iframe).

### 3.5 Gallery
- Organized, responsive gallery displaying processed images and captions.
- Each gallery includes download options for both `.txt` and `.json` files.

### 3.6 Order Form
- Digital intake form for property photography requests.
- Fields include name, contact, property details, and preferred dates.
- Placeholder logic currently displays success confirmation; backend persistence follows.

### 3.7 CRM Compatibility
- Each gallery exports image metadata in `.txt` and `.json` formats.
- Compatible with FIO, onOffice, and Propstack data import structures.
- Enables agents to reuse generated text directly in Exposés.

---

## 4. Infrastructure & Deployment

**Hosting & Deployment**
- Frontend: Cloudflare Pages
- Backend: Cloudflare Workers (API logic, upload handling)
- AI Captioning: Replicate API (transition-ready for Modal)
- Database: PostgreSQL via Drizzle ORM
- Email: Mailgun
- Development Environment: Replit (Node.js + Hono + Lucia)

**Workflow Sequence**
1. User logs in → Uploads media.
2. Worker sends upload data → R2 storage.
3. Trigger → Replicate API generates captions.
4. Captions returned and stored in `.txt` + `.json`.
5. Client accesses results via secure dashboard and gallery view.

---

## 5. Privacy & GDPR Compliance

### Principles
- Images are anonymized prior to AI processing (e.g., “Livingroom_01”).
- No personal identifiers (faces, names, or addresses) are sent to external servers.
- Processing transparency and data minimization are integral to platform design.
- Non-EU processing (Replicate servers) is explicitly disclosed to users.

### Example Policy Statement
> “Images uploaded to pix.immo are pseudonymized and processed through trusted third-party AI services outside the EU solely for descriptive purposes. No personal data is transmitted or retained. This ensures GDPR-compliant transparency and accountability.”

---

## 6. Implementation Task #1 — Replit

### Title
**Lucia Authentication + Dashboard + Client Gallery + Order Form**

### Objective
Develop the complete authentication and client-area foundation, enabling secure logins, personalized dashboards, and structured UI components for galleries and order management.

### Scope
- Authentication via Lucia (register, login, logout, password reset).
- Secure session handling with cookies.
- Dashboard with user greeting, upload overview, and navigation.
- Gallery layout (responsive grid with placeholders).
- Order form with property details and date selection.
- Password reset using Mailgun transactional emails.
- Role system: `admin` and `client` roles for access control.

### Deliverables
- Fully functional login and registration flow.
- Dashboard with navigation and placeholder components for uploads, gallery, and orders.
- Working password reset through Mailgun.
- Placeholder gallery and order form connected to routes.
- Consistent layout styling across all pages (Rapid or Tailwind).

### Security & Environment Notes
- All API keys (Mailgun, Replicate) must be managed as environment variables.  
- No hardcoding or plaintext storage of credentials is permitted.  
- The system should prompt for API credentials when required.

### Expected Outcome
After successful implementation, clients can:
- Register and authenticate securely.  
- Access their dashboard and view available galleries.  
- Submit property orders via the order form.  
- Receive password reset and notification emails through Mailgun.  

---

## 7. Future Tasks (Phase Roadmap)

**Task #2** — Cloudflare Upload Worker Integration (full client flow).  
**Task #3** — AI Caption Automation via Replicate (trigger workflow and JSON handling).  
**Task #4** — Gallery JSON integration and CRM export automation.  
**Task #5** — Admin dashboard and analytics interface.  
**Task #6** — Migration to Modal (optional performance optimization).  

---

_End of Document – pix.immo Technical Briefing v2_
