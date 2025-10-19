# Design Guidelines: pix.immo - Real Estate Media Platform

## Design Approach
**Reference-Based Hybrid**: Combining Airbnb's property showcase aesthetics, Unsplash's gallery mastery, and Linear's professional B2B polish. Creates a premium, trustworthy platform that balances visual richness with operational efficiency.

**Core Principles**: Trust through sophistication, clarity in complexity, visual hierarchy that celebrates property imagery.

## Core Design Elements

### A. Color Palette

**Dark Mode** (primary interface for professionals):
- Background: 222 20% 11%
- Surface: 222 18% 15%
- Surface Elevated: 222 16% 19%
- Primary (Brand Blue): 217 89% 61%
- Accent Gold: 43 74% 66% (sparingly - premium badges, highlights)
- Success: 142 76% 45%
- Warning: 38 92% 50%
- Error: 0 84% 60%
- Text Primary: 222 15% 96%
- Text Secondary: 222 12% 71%
- Border Subtle: 222 15% 25%

**Light Mode** (client-facing default):
- Background: 0 0% 99%
- Surface: 0 0% 100%
- Surface Elevated: 220 20% 97%
- Primary: 217 89% 51%
- Accent Gold: 43 74% 56%
- Success: 142 71% 42%
- Warning: 38 92% 45%
- Error: 0 72% 50%
- Text Primary: 222 20% 13%
- Text Secondary: 222 15% 45%
- Border Subtle: 222 12% 88%

### B. Typography

**Font Stack**:
- Primary: "Inter", -apple-system, system-ui (body, UI)
- Display: "Plus Jakarta Sans" (headings, hero text)
- Monospace: "JetBrains Mono" (order IDs, metadata)

**Scale & Weights**:
- Hero Display: 700 weight, text-5xl to text-7xl, tracking-tight
- Section Headings: 600 weight, text-2xl to text-3xl
- Card Titles: 600 weight, text-lg
- Body Text: 400 weight, text-base, leading-relaxed (1.7)
- Captions: 500 weight, text-sm, tracking-wide uppercase for labels

### C. Layout System

**Spacing Primitives**: Tailwind units of 4, 6, 8, 12, 16, 24
- Page padding: px-6 md:px-12 lg:px-24
- Section spacing: py-16 md:py-24 lg:py-32
- Card padding: p-6 to p-8
- Gallery gaps: gap-4 md:gap-6
- Form spacing: space-y-6

**Grid System**:
- Container: max-w-7xl for main content, max-w-6xl for forms
- Gallery grids: grid-cols-2 md:grid-cols-3 lg:grid-cols-4 (property thumbnails)
- Dashboard: grid-cols-1 lg:grid-cols-3 (sidebar + main + details)
- Full-bleed image sections: w-full with nested max-w containers for text

### D. Component Library

**Navigation**:
- Top nav: Sticky, backdrop-blur-lg, border-b, height 16-20
- Logo + primary actions (Upload, Orders, Profile)
- Role indicator badge (Admin/Client) in gold accent
- Search bar with icon, rounded-full, min-w-96

**Hero Section** (Marketing Landing):
- Full-viewport (min-h-screen), gradient overlay on property image
- Centered headline + subtext + dual CTAs (Start Order + View Gallery)
- Variant outline buttons with backdrop-blur-md background
- Scroll indicator at bottom

**Property Gallery Cards**:
- Aspect ratio 4:3, rounded-xl, overflow-hidden
- Hover: scale-105 transform, subtle shadow elevation
- Overlay on hover: Property address, order status badge
- Click: Opens lightbox modal with full resolution

**Order Dashboard Cards**:
- White/surface background, rounded-2xl, border-subtle
- Header: Order ID (monospace) + status badge (pill shape)
- Content: Property thumbnail grid (2x2 preview) + metadata
- Footer: Action buttons (View Details, Download, Generate Captions)
- Dividers between sections using border-t

**Image Upload Zone**:
- Dashed border-2, rounded-2xl, min-h-64
- Drag-and-drop active state: border-primary, bg-primary/5
- Icon (upload cloud) + "Drop images here or click to browse"
- File list below with remove icons

**AI Caption Generator**:
- Side panel or modal, two-column layout
- Left: Selected image preview (max-h-96)
- Right: Generated caption text area (editable), Copy + Regenerate buttons
- Progress indicator during generation
- Batch mode: Checkbox list of images with "Generate All" CTA

**Status Badges**:
- Pill shape (rounded-full), px-3 py-1, text-xs font-medium
- Pending: bg-warning/20 text-warning
- Processing: bg-primary/20 text-primary with animated pulse
- Completed: bg-success/20 text-success with checkmark
- Delivered: bg-accent/20 text-accent

**Forms**:
- Inputs: rounded-lg, border, px-4 py-3, focus:ring-2 ring-primary/30
- Labels: text-sm font-medium mb-2
- Grouped fields: grid-cols-2 gap-6 for related inputs (address, city)
- File inputs: Custom styled upload zones (see above)

**Data Tables** (Admin Orders View):
- Zebra striping: odd rows with subtle bg-surface-elevated
- Sortable headers: font-medium with arrow indicators
- Row actions: Dropdown menu (three dots) on hover
- Pagination: Centered below table with page numbers + arrows

**Modals/Lightboxes**:
- Image lightbox: Full-screen overlay, backdrop-blur-xl, close button top-right
- Navigation arrows for gallery browsing
- Image details panel (slide in from right): EXIF data, caption, download options
- Confirmation modals: Centered card, max-w-md, shadow-2xl

**Empty States**:
- Centered icon (large, text-6xl in text-secondary)
- Headline "No orders yet" + descriptive subtext
- Primary CTA "Create Your First Order"
- Illustration or minimal graphic (camera icon for gallery)

### E. Layout Structures

**Marketing Landing Page**:
1. Hero: Full-screen property image with gradient overlay, centered value proposition, dual CTAs
2. Features Grid: 3-column (icon + title + description) showcasing AI captions, fast delivery, quality guarantee
3. Gallery Showcase: Masonry grid of 8-12 sample property images with subtle hover effects
4. How It Works: 3-step timeline (Upload → AI Processing → Delivery) with illustrations
5. Social Proof: 2-column testimonials with agent photos and company logos
6. Pricing Cards: 3 tiers side-by-side, centered, with recommended badge on middle tier
7. Final CTA: Full-width section with background image, "Start Your First Order" emphasis
8. Footer: 4-column (Product, Company, Resources, Contact) with newsletter signup

**Dashboard (Authenticated)**:
- Three-column layout: Sidebar nav (fixed, w-64) + Main content (flex-1) + Details panel (w-80, conditional)
- Sidebar: Logo, role badge, menu items with icons, dark background
- Main: Orders grid/table with filters at top, pagination at bottom
- Details panel: Slides in when order selected, shows full metadata and image previews

**Order Detail View**:
- Breadcrumb navigation at top
- Header card: Order info, client details, status timeline
- Image gallery: Responsive grid with lightbox functionality
- AI caption panel: Collapsible sections per image with edit capability
- Action bar (sticky bottom): Download All, Generate Reports, Mark Complete

### F. Images

**Hero Image**: High-quality luxury property exterior or interior shot, aspect 21:9, subtle gradient overlay (from bottom: black opacity 70% to transparent). Image should convey professionalism and premium quality.

**Feature Section Backgrounds**: Subtle abstract patterns or blurred property images at 20% opacity behind content cards.

**Gallery Showcase**: 8-12 diverse property images (exteriors, interiors, aerial shots) demonstrating platform capabilities. Mix of residential and commercial properties.

**Testimonial Photos**: Professional headshots of real estate agents/photographers, circular crop, 64px to 80px diameter.

**Empty State Illustrations**: Minimalist line-art icons (camera, checklist, sparkles for AI) in brand primary color.

### G. Interactions & Microanimations

- Image hover: Smooth scale transform (transition-transform duration-300)
- Button clicks: Brief scale-95 feedback
- Status changes: Fade transition between badge states
- Gallery load: Stagger animation (items fade in sequentially)
- AI generation: Typing effect for caption reveal (letter-by-letter)
- Upload progress: Linear progress bar with percentage label
- Modal entry: Fade + scale-95 to scale-100 animation (duration-200)

**Performance**: Lazy load images below fold, use blur placeholders, optimize with WebP format.