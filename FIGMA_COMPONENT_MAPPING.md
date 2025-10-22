# pix.immo - Figma Component Mapping & Design System

## 📐 Anleitung: Shadcn Components → Figma umsetzen

Diese Dokumentation zeigt, welche UI-Components aktuell im Projekt verwendet werden und wie Sie diese in Figma als Design System aufbauen sollten.

---

## 🎨 Design System Struktur in Figma

### Empfohlene Figma-Organisation:

```
📁 pix.immo Design System
  ├── 🎨 Page 1: Foundations
  │   ├── Colors (Light Mode + Dark Mode)
  │   ├── Typography
  │   ├── Spacing & Grid
  │   ├── Elevation/Shadows
  │   └── Border Radius
  │
  ├── 🧩 Page 2: Components Library
  │   ├── Buttons
  │   ├── Inputs & Forms
  │   ├── Cards
  │   ├── Navigation
  │   ├── Modals & Dialogs
  │   ├── Feedback (Alerts, Toasts, Badges)
  │   └── Data Display
  │
  ├── 📱 Page 3: Mobile Components
  │   └── (Mobile variants aller Components)
  │
  └── 🖼️ Page 4+: Layouts (High Priority Pages)
```

---

## 1. FOUNDATIONS (Grundlagen)

### 🎨 Colors

**In Figma als Styles anlegen:**

#### Light Mode:
```
Background:
  - background: hsl(0, 0%, 100%) // Weiß
  - foreground: hsl(222.2, 84%, 4.9%) // Fast Schwarz

Cards & Surfaces:
  - card: hsl(0, 0%, 100%)
  - card-foreground: hsl(222.2, 84%, 4.9%)

Primary (Hauptfarbe - zu definieren):
  - primary: hsl(222.2, 47.4%, 11.2%)
  - primary-foreground: hsl(210, 40%, 98%)

Secondary:
  - secondary: hsl(210, 40%, 96.1%)
  - secondary-foreground: hsl(222.2, 47.4%, 11.2%)

Accent:
  - accent: hsl(210, 40%, 96.1%)
  - accent-foreground: hsl(222.2, 47.4%, 11.2%)

Muted (Gedämpft):
  - muted: hsl(210, 40%, 96.1%)
  - muted-foreground: hsl(215.4, 16.3%, 46.9%)

Destructive (Fehler/Löschen):
  - destructive: hsl(0, 84.2%, 60.2%)
  - destructive-foreground: hsl(210, 40%, 98%)

Border:
  - border: hsl(214.3, 31.8%, 91.4%)
  - input: hsl(214.3, 31.8%, 91.4%)
  - ring: hsl(222.2, 84%, 4.9%)
```

#### Dark Mode:
```
Background:
  - background: hsl(222.2, 84%, 4.9%)
  - foreground: hsl(210, 40%, 98%)

Cards & Surfaces:
  - card: hsl(222.2, 84%, 4.9%)
  - card-foreground: hsl(210, 40%, 98%)

// ... (analog zu Light Mode mit dunkleren Werten)
```

**⚙️ Figma Setup:**
- Erstellen Sie Color Styles: `Primary/500`, `Primary/Foreground`, etc.
- Nutzen Sie Figma Variables für Light/Dark Mode Switching
- Dokumentieren Sie HSL-Werte in Beschreibung

---

### 📝 Typography

**Font Family**: Inter (oder Ihre gewählte Font)

**Type Styles in Figma:**

```
Headings:
  - H1: 36px / 40px (Line Height), Bold (700), -0.02em (Letter Spacing)
  - H2: 30px / 36px, Bold (700), -0.01em
  - H3: 24px / 32px, Semibold (600)
  - H4: 20px / 28px, Semibold (600)
  - H5: 18px / 24px, Medium (500)
  - H6: 16px / 22px, Medium (500)

Body:
  - Body Large: 16px / 24px, Regular (400)
  - Body: 14px / 20px, Regular (400)
  - Body Small: 13px / 18px, Regular (400)

Utility:
  - Caption: 12px / 16px, Regular (400)
  - Overline: 12px / 16px, Medium (500), Uppercase
  - Label: 14px / 20px, Medium (500)
```

**⚙️ Figma Setup:**
- Text Styles: `Heading/H1`, `Body/Regular`, `Caption`, etc.
- Konsistente Line Heights und Letter Spacing

---

### 📏 Spacing System

**8px Grid System:**

```
spacing-0: 0px
spacing-1: 4px   (0.25rem)
spacing-2: 8px   (0.5rem)
spacing-3: 12px  (0.75rem)
spacing-4: 16px  (1rem)
spacing-5: 20px  (1.25rem)
spacing-6: 24px  (1.5rem)
spacing-8: 32px  (2rem)
spacing-10: 40px (2.5rem)
spacing-12: 48px (3rem)
spacing-16: 64px (4rem)
spacing-20: 80px (5rem)
spacing-24: 96px (6rem)
```

**⚙️ Figma Setup:**
- Auto Layout Spacing: 4, 8, 16, 24, 32px
- Konsistent verwenden für Padding, Gap, Margin

---

### 🌓 Elevation & Shadows

```
Shadow SM: 0 1px 2px 0 rgba(0, 0, 0, 0.05)
Shadow MD: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)
Shadow LG: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)
Shadow XL: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)
```

**⚙️ Figma Setup:**
- Effect Styles: `Shadow/SM`, `Shadow/MD`, `Shadow/LG`
- Sparsam verwenden (nur bei floating elements)

---

### ⭕ Border Radius

```
radius-none: 0px
radius-sm: 4px
radius-md: 6px (Standard für Cards, Buttons)
radius-lg: 8px
radius-full: 9999px (Circles, Pills)
```

**⚙️ Figma Setup:**
- Konsistenter Radius: 6px für die meisten Elemente
- Dokumentiert in Component Descriptions

---

## 2. COMPONENTS LIBRARY

### 🔘 BUTTON

**Verwendung im Projekt**: `@/components/ui/button.tsx`

**Variants:**
1. **default** (Primary Button)
2. **secondary**
3. **destructive** (Rot, für Löschen/Gefährliche Aktionen)
4. **outline** (Transparenter BG mit Border)
5. **ghost** (Transparenter BG ohne Border)
6. **link** (Aussehen wie Link, verhält sich wie Button)

**Sizes:**
1. **sm** (Small): min-h-8, px-3, text-sm
2. **default**: min-h-9, px-4, py-2
3. **lg** (Large): min-h-10, px-8
4. **icon**: h-9, w-9 (Square, nur Icon)

**States:**
- Default
- Hover (leicht aufgehellt via `hover-elevate`)
- Active (gedrückt via `active-elevate-2`)
- Disabled (opacity-50, cursor-not-allowed)
- Loading (mit Spinner-Icon)

**⚙️ Figma Setup:**
```
Component: Button
  ├── Variant: default / secondary / destructive / outline / ghost / link
  ├── Size: sm / default / lg / icon
  └── State: default / hover / active / disabled / loading
```

**Properties:**
- Boolean: `disabled`
- Boolean: `loading`
- Text: `Label` (für Button-Text)
- Instance Swap: `Left Icon`, `Right Icon` (optional)

**Auto Layout:**
- Direction: Horizontal
- Gap: 8px (zwischen Icon und Text)
- Padding: px-4, py-2 (entsprechend Size)
- Hug contents (width), Fixed height

**Beispiel-Varianten in Figma:**
- `Button / default / default / default` → Standard Primary Button
- `Button / outline / sm / hover` → Kleiner Outline Button im Hover-State
- `Button / ghost / icon / default` → Icon-Only Ghost Button

---

### 📝 INPUT

**Verwendung**: `@/components/ui/input.tsx`

**Variants:**
- Standard (mit Border)
- Error (rote Border bei Validierungsfehler)

**States:**
- Default
- Focus (Ring, highlight)
- Disabled
- Error

**⚙️ Figma Setup:**
```
Component: Input
  ├── State: default / focus / disabled / error
  └── Type: text / email / password / number
```

**Auto Layout:**
- Fixed width (or responsive)
- Height: h-9 (36px)
- Padding: px-3, py-2
- Border: 1px solid border-color
- Border Radius: 6px

**Properties:**
- Text: `Placeholder`
- Text: `Value`
- Boolean: `disabled`
- Boolean: `error`
- Instance Swap: `Left Icon`, `Right Icon` (optional)

---

### 📦 CARD

**Verwendung**: `@/components/ui/card.tsx`

**Sub-Components:**
- `Card` (Container)
- `CardHeader`
- `CardTitle`
- `CardDescription`
- `CardContent`
- `CardFooter`

**Variants:**
- Default (mit Border & Background)
- Elevated (mit Shadow)
- Interactive (mit Hover-State)

**⚙️ Figma Setup:**
```
Component: Card
  ├── Variant: default / elevated / interactive
  └── State: default / hover (nur bei interactive)
```

**Auto Layout:**
- Direction: Vertical
- Gap: 0 (Sections haben eigenes Padding)
- Padding: p-6 (Standard)
- Border: 1px solid border
- Border Radius: 8px
- Background: card-background

**Sub-Component CardHeader:**
- Padding: p-6
- Gap: 4px (zwischen Title und Description)

**Sub-Component CardContent:**
- Padding: px-6, pb-6

**Sub-Component CardFooter:**
- Padding: px-6, pb-6
- Justify: space-between (für Buttons links/rechts)

**Beispiel-Use-Cases:**
- Job Card (in `/jobs`)
- Blog Card (in `/blog`)
- Service Card (in `/preise`)
- Pricing Card (in `/buchen`)

---

### 🏷️ BADGE

**Verwendung**: `@/components/ui/badge.tsx`

**Variants:**
1. **default** (Standard)
2. **secondary**
3. **destructive**
4. **outline**
5. **success** (Grün, z.B. "completed")
6. **warning** (Gelb, z.B. "pending")

**⚙️ Figma Setup:**
```
Component: Badge
  ├── Variant: default / secondary / destructive / outline / success / warning
  └── Size: sm / default
```

**Auto Layout:**
- Direction: Horizontal
- Padding: px-2.5, py-0.5
- Height: min-h-5 (für sm), min-h-6 (default)
- Gap: 4px (wenn Icon vorhanden)
- Border Radius: 9999px (volle Abrundung - Pill-Shape)
- Hug contents

**Properties:**
- Text: `Label`
- Instance Swap: `Icon` (optional)

**Beispiel-Use-Cases:**
- Status-Badges: `pending`, `in_progress`, `completed`, `cancelled`
- Job-Status in `/jobs`
- Kategorie-Tags in `/blog`

---

### 🖼️ DIALOG / MODAL

**Verwendung**: `@/components/ui/dialog.tsx`

**Sub-Components:**
- `Dialog` (Container/Trigger)
- `DialogContent`
- `DialogHeader`
- `DialogTitle`
- `DialogDescription`
- `DialogFooter`

**Variants:**
- Default (Medium Width)
- Large (Full Width Content)
- Small (Confirmation Dialogs)

**⚙️ Figma Setup:**
```
Component: Dialog
  ├── Size: sm / md / lg
  └── Content: (Slot für variable Inhalte)
```

**DialogContent:**
- Width: max-w-lg (32rem = 512px) für Standard
- Padding: p-6
- Border Radius: 8px
- Background: card-background
- Shadow: XL (floating)
- Overlay: rgba(0, 0, 0, 0.5)

**Beispiel-Use-Cases:**
- Image Lightbox (in `/review`, `/galerie`)
- Confirmation Dialogs
- Form Modals

---

### 📋 FORM COMPONENTS

#### SELECT (Dropdown)

**Verwendung**: `@/components/ui/select.tsx`

**States:**
- Default
- Open (Dropdown aufgeklappt)
- Disabled

**⚙️ Figma Setup:**
```
Component: Select
  ├── State: default / open / disabled
  └── Selected: (Text der gewählten Option)
```

**Properties:**
- Text: `Placeholder` / `Selected Value`
- Boolean: `disabled`

---

#### CHECKBOX

**Verwendung**: `@/components/ui/checkbox.tsx`

**States:**
- Unchecked
- Checked
- Indeterminate (teilweise ausgewählt)
- Disabled

**⚙️ Figma Setup:**
```
Component: Checkbox
  ├── State: unchecked / checked / indeterminate
  └── Disabled: false / true
```

**Size**: 16x16px (h-4 w-4)

---

#### TEXTAREA

**Verwendung**: `@/components/ui/textarea.tsx`

**States:**
- Default
- Focus
- Disabled
- Error

**⚙️ Figma Setup:**
```
Component: Textarea
  ├── State: default / focus / disabled / error
  └── Rows: 3 / 5 / 10 (Höhe variabel)
```

**Auto Layout:**
- Padding: p-3
- Border: 1px solid border
- Border Radius: 6px
- Min-height: 80px (3 Zeilen)

---

#### LABEL

**Verwendung**: `@/components/ui/label.tsx`

**⚙️ Figma Setup:**
- Text Style: `Label` (14px, Medium)
- Color: foreground
- Margin-bottom: 8px (Abstand zum Input)

---

### 🔔 TOAST (Notification)

**Verwendung**: `@/components/ui/toast.tsx`

**Variants:**
- Default
- Success
- Error
- Warning
- Info

**⚙️ Figma Setup:**
```
Component: Toast
  ├── Variant: default / success / error / warning / info
  └── Action: (optionaler Button)
```

**Auto Layout:**
- Direction: Horizontal
- Gap: 12px
- Padding: p-4
- Border Radius: 6px
- Shadow: LG (floating)
- Background: abhängig von Variant

**Position**: Bottom-right (in Figma als separate Frame außerhalb)

---

### 🧭 NAVIGATION COMPONENTS

#### HEADER (Sticky Navigation)

**Verwendung**: Auf Homepage, Galerie, etc.

**Elements:**
- Logo (links)
- Navigation Links (center/rechts)
- CTA Button "Buchen" (rechts)
- User Avatar/Login (ganz rechts)

**⚙️ Figma Setup:**
```
Component: Header
  ├── Variant: logged-out / logged-in
  └── State: default / sticky (scroll)
```

**Auto Layout:**
- Direction: Horizontal
- Justify: space-between
- Padding: px-6, py-4
- Border-bottom: 1px solid border
- Background: background (sticky) oder transparent (hero)

**Height**: 64px (h-16)

---

#### FOOTER

**Verwendung**: Auf allen Seiten

**Elements:**
- Copyright
- Links (Impressum, AGB, Datenschutz, Kontakt)
- Social Media Icons (optional)

**⚙️ Figma Setup:**
```
Component: Footer
  └── Layout: single-column / multi-column
```

**Auto Layout:**
- Direction: Horizontal oder Vertical (responsive)
- Padding: py-8, px-6
- Border-top: 1px solid border

---

### 🎯 TABS

**Verwendung**: `@/components/ui/tabs.tsx`

**Sub-Components:**
- `Tabs` (Container)
- `TabsList` (Horizontale Button-Gruppe)
- `TabsTrigger` (Einzelner Tab-Button)
- `TabsContent` (Content-Bereich)

**⚙️ Figma Setup:**
```
Component: Tabs
  ├── Number of Tabs: 2 / 3 / 4 / 5
  └── Active Tab: 0 / 1 / 2 / ...
```

**TabsList:**
- Background: muted
- Border Radius: 6px
- Padding: p-1

**TabsTrigger:**
- State: inactive / active
- Padding: px-3, py-1.5
- Border Radius: 4px
- Background: transparent (inactive), background (active)

---

### 📊 PROGRESS

**Verwendung**: `@/components/ui/progress.tsx`

**Variants:**
- Linear Progress Bar
- Circular Progress (optional)

**⚙️ Figma Setup:**
```
Component: Progress
  ├── Value: 0% / 25% / 50% / 75% / 100%
  └── Variant: default / success / error
```

**Auto Layout:**
- Width: 100% (responsive)
- Height: h-2 (8px)
- Border Radius: 9999px (volle Abrundung)
- Background: secondary (Track)
- Foreground: primary (Progress)

**Beispiel-Use-Cases:**
- Booking Wizard Steps
- Upload Progress (in `/upload-raw`)
- Job Completion Status

---

### 🔽 ACCORDION

**Verwendung**: `@/components/ui/accordion.tsx`

**Sub-Components:**
- `Accordion` (Container)
- `AccordionItem`
- `AccordionTrigger` (Header mit Icon)
- `AccordionContent`

**⚙️ Figma Setup:**
```
Component: Accordion Item
  └── State: collapsed / expanded
```

**AccordionTrigger:**
- Direction: Horizontal
- Justify: space-between
- Padding: py-4
- Icon: ChevronDown (rotiert bei expanded)

**AccordionContent:**
- Padding: pb-4, pt-0
- Nur sichtbar bei expanded

**Beispiel-Use-Cases:**
- FAQ (in `/faq`)
- Service-Details (in `/preise`)

---

### 🗓️ SEPARATOR

**Verwendung**: `@/components/ui/separator.tsx`

**Variants:**
- Horizontal (Standard)
- Vertical

**⚙️ Figma Setup:**
```
Component: Separator
  └── Orientation: horizontal / vertical
```

**Horizontal:**
- Width: 100%
- Height: 1px
- Background: border

**Vertical:**
- Width: 1px
- Height: 100% (oder feste Höhe)
- Background: border

---

### 🖱️ TOOLTIP

**Verwendung**: `@/components/ui/tooltip.tsx`

**⚙️ Figma Setup:**
```
Component: Tooltip
  └── Content: (Text)
```

**Auto Layout:**
- Padding: px-3, py-1.5
- Background: foreground (dunkel)
- Color: background (weiß)
- Border Radius: 4px
- Shadow: MD

**Position**: Top/Bottom/Left/Right des Trigger-Elements

---

### ⚠️ ALERT

**Verwendung**: `@/components/ui/alert.tsx`

**Variants:**
- Default
- Destructive (Error)
- Warning
- Success

**⚙️ Figma Setup:**
```
Component: Alert
  ├── Variant: default / destructive / warning / success
  └── Dismissible: false / true
```

**Sub-Components:**
- `AlertTitle`
- `AlertDescription`

**Auto Layout:**
- Direction: Horizontal
- Gap: 12px
- Padding: p-4
- Border: 1px solid (Farbe abhängig von Variant)
- Border Radius: 6px
- Background: transparent oder leicht eingefärbt

---

### 🖼️ SKELETON

**Verwendung**: `@/components/ui/skeleton.tsx`

**⚙️ Figma Setup:**
```
Component: Skeleton
  ├── Shape: rectangle / circle
  └── Size: custom (width x height)
```

**Properties:**
- Background: muted
- Border Radius: 4px (für rectangle), 50% (für circle)
- Animation: Pulse/Shimmer (in Figma als Dokumentation, nicht animiert)

**Beispiel-Use-Cases:**
- Loading States für Job Cards
- Loading States für Gallery Images
- Loading States für User Avatar

---

## 3. CUSTOM COMPONENTS (pix.immo-spezifisch)

### 📍 ADDRESS AUTOCOMPLETE

**Verwendung**: `@/components/AddressAutocomplete.tsx`

**Sub-Components:**
- Input mit Google Places Autocomplete
- Dropdown mit Vorschlägen

**⚙️ Figma Setup:**
```
Component: Address Autocomplete
  └── State: default / suggestions-open
```

**Elements:**
- Input Field (mit Location Icon links)
- Dropdown mit 5 Suggestion Items
- Jede Suggestion: Icon + Adresse (Primary) + Details (Secondary)

**Beispiel-Use-Cases:**
- Buchungs-Wizard (`/buchen` Step 2)
- Intake-Formular (`/intake`)

---

### 🗺️ STATIC MAP THUMBNAIL

**Verwendung**: `@/components/StaticMapThumbnail.tsx`

**⚙️ Figma Setup:**
```
Component: Map Thumbnail
  ├── Size: sm / md / lg
  └── Marker: false / true
```

**Sizes:**
- sm: 200x150px
- md: 400x300px
- lg: 600x400px

**Elements:**
- Image Frame (Google Static Maps API Bild)
- Marker (roter Pin in der Mitte)
- Optional: Overlay mit Adresse

**Beispiel-Use-Cases:**
- Job Detail (`/job/:id`)
- Buchungsbestätigung (`/booking-confirmation`)

---

### 🖼️ LIGHTBOX (Image Viewer)

**Verwendung**: In `/review/:jobId/:shootId`, `/galerie`

**⚙️ Figma Setup:**
```
Component: Lightbox
  ├── Controls: true / false
  └── Image: (Placeholder Image)
```

**Elements:**
- Full-Screen Overlay (schwarz, 90% opacity)
- Image (max-width: 90vw, max-height: 90vh, centered)
- Navigation: Previous/Next Buttons (links/rechts)
- Close Button (X, top-right)
- Image Counter (unten: "5 / 20")
- Actions: Download, Favorite, Comment (unten-rechts)

**States:**
- Default
- Loading (mit Spinner)
- Error (Bild nicht geladen)

---

### 📸 IMAGE CARD (Gallery)

**Verwendung**: In `/galerie`, `/review`

**⚙️ Figma Setup:**
```
Component: Image Card
  ├── Aspect Ratio: 16:9 / 4:3 / 1:1
  └── Overlay: none / hover / always
```

**Elements:**
- Image (Cover-fit)
- Overlay (gradient, nur bei hover)
- Actions (bei hover):
  - Favorite Icon (Heart)
  - Comment Icon
  - Download Icon
- Meta Info (optional):
  - Filename
  - Date
  - Resolution

---

### 📋 JOB CARD

**Verwendung**: In `/jobs`, `/dashboard`

**⚙️ Figma Setup:**
```
Component: Job Card
  └── Status: pending / in_progress / completed / cancelled
```

**Elements:**
- Card Container
- Header:
  - Job Number (z.B. "J-2025-001")
  - Status Badge
- Content:
  - Property Name
  - Address (mit Location Icon)
  - Services (Comma-separated oder Icons)
  - Shoot Date
- Footer:
  - View Details Button
  - Quick Actions (optional: Edit, Delete)

**Auto Layout:**
- Card mit p-6
- Gap: 16px zwischen Sections

---

### 📝 BOOKING WIZARD STEPPER

**Verwendung**: In `/buchen`

**⚙️ Figma Setup:**
```
Component: Booking Stepper
  ├── Total Steps: 5
  └── Current Step: 1 / 2 / 3 / 4 / 5
```

**Elements:**
- Step Indicators (5 Circles, horizontal)
  - Completed: Grün mit Checkmark
  - Active: Primary Color mit Border
  - Upcoming: Grau
- Connecting Lines (zwischen Steps)
- Step Labels (unter Circles):
  1. "Service"
  2. "Adresse"
  3. "Termin"
  4. "Kontakt"
  5. "Bestätigung"

**Auto Layout:**
- Horizontal
- Justify: space-between
- Gap: 8px (Circles), 100% (Lines zwischen)

---

## 4. RESPONSIVE BREAKPOINTS

### Desktop (1024px+)
- Multi-Column Layouts
- Sidebar Navigation
- Full-width Hero Images

### Tablet (768px - 1023px)
- Reduzierte Columns
- Collapsible Sidebar
- Stacked Content

### Mobile (320px - 767px)
- Single Column
- Hamburger Menu
- Touch-optimierte Buttons (min 44x44px)
- Bottom Navigation (optional)

**⚙️ Figma Setup:**
- Erstellen Sie Frames für alle 3 Breakpoints
- Nutzen Sie Auto Layout für responsive Components
- Dokumentieren Sie Breakpoint-Verhalten

---

## 5. STATES & INTERACTIONS

### Hover States
- Buttons: `hover-elevate` (leicht aufgehellt)
- Cards: Leichter Shadow-Lift
- Links: Underline

### Active States
- Buttons: `active-elevate-2` (deutlich gedrückt)
- Inputs: Focus Ring (2px primary color)

### Loading States
- Skeleton Loaders
- Spinner Icons
- Progress Bars

### Error States
- Rote Borders
- Error-Icon
- Error-Text (unterhalb)

### Disabled States
- 50% Opacity
- Cursor: not-allowed
- Keine Hover-Interaktion

**⚙️ Figma Setup:**
- Dokumentieren Sie alle States als Variants
- Nutzen Sie Interactive Components für Prototyping

---

## 6. ICON SYSTEM

**Library**: Lucide React Icons

**Häufig verwendete Icons:**
- Navigation: `Menu`, `X`, `ChevronDown`, `ChevronRight`
- Actions: `Plus`, `Edit`, `Trash2`, `Download`, `Upload`, `Share2`
- Status: `Check`, `AlertCircle`, `Info`, `XCircle`
- Media: `Image`, `Video`, `Camera`, `Eye`, `Heart`
- User: `User`, `Mail`, `Phone`, `MapPin`, `Calendar`
- Files: `File`, `FileText`, `Folder`, `FolderOpen`

**Sizes:**
- sm: 16x16px (h-4 w-4)
- md: 20x20px (h-5 w-5)
- lg: 24x24px (h-6 w-6)

**⚙️ Figma Setup:**
- Importieren Sie Lucide Icons aus Figma Community
- Oder erstellen Sie Icon Components mit Instance Swap
- Konsistente Sizes verwenden

---

## 7. DARK MODE

**Wichtig**: Alle Components müssen Dark Mode unterstützen!

**⚙️ Figma Setup:**
1. Nutzen Sie **Figma Variables** für alle Farben
2. Erstellen Sie zwei Modi: `Light` und `Dark`
3. Definieren Sie für jede Farbe beide Varianten:
   - `background/light`: hsl(0, 0%, 100%)
   - `background/dark`: hsl(222.2, 84%, 4.9%)
4. Wenden Sie Variables auf alle Components an
5. Testen Sie jeden Component in beiden Modi

**Dark Mode Toggle Component:**
```
Component: Theme Toggle
  └── Theme: light / dark
```
- Icon: Sun (Light Mode) / Moon (Dark Mode)
- Position: Header rechts oben

---

## 8. ANIMATION & TRANSITIONS

**Wichtig**: Alle Animationen sollten subtil sein!

**Transitions:**
- Hover: 150ms ease-in-out
- Focus: 200ms ease
- Modal Open/Close: 200ms ease-in-out
- Accordion Expand: 300ms ease

**Animations:**
- Skeleton: Pulse (2s infinite)
- Spinner: Rotate (1s linear infinite)
- Toast Enter: Slide-in from right (300ms)

**⚙️ Figma Setup:**
- Dokumentieren Sie Timing in Component Descriptions
- Nutzen Sie Smart Animate für Prototyping
- Easing: Ease-in-out für die meisten Fälle

---

## 9. ACCESSIBILITY (a11y)

**Wichtig für Figma Design:**

### Kontrast
- Text/Background: Mindestens 4.5:1 (WCAG AA)
- Large Text (18px+): Mindestens 3:1
- UI-Components: Mindestens 3:1

**⚙️ Figma Plugins:**
- "Stark" - Contrast Checker
- "A11y - Focus Orderer" - Tab-Order prüfen

### Focus States
- Alle interaktiven Elemente brauchen sichtbaren Focus Ring
- Focus Ring: 2px primary color, 2px offset

### Touch Targets
- Minimum: 44x44px (Mobile)
- Empfohlen: 48x48px

---

## 10. FIGMA BEST PRACTICES

### Naming Convention
```
Category / Component / Variant / State

Beispiele:
- Button / default / default / default
- Card / elevated / interactive / hover
- Input / text / default / focus
```

### Auto Layout
- Nutzen Sie Auto Layout für alle Components
- Definieren Sie Padding, Gap, Alignment
- Hug Contents oder Fixed Width (dokumentieren!)

### Constraints
- Definieren Sie, wie Components sich bei Resize verhalten
- Left/Right für full-width
- Center für zentrierte Elemente

### Component Properties
- Boolean: `disabled`, `loading`, `error`
- Text: `label`, `placeholder`, `value`
- Instance Swap: Icons, Images

### Documentation
- Beschreiben Sie jede Component
- Notieren Sie Usage Guidelines
- Verlinken Sie zu Code-Implementierung (GitHub)

---

## 11. CHECKLISTE für Figma-Setup

### Phase 1: Foundations
- [ ] Color Styles (Light & Dark Mode) erstellt
- [ ] Typography Styles definiert
- [ ] Spacing System dokumentiert
- [ ] Shadow Styles erstellt
- [ ] Border Radius definiert

### Phase 2: Core Components
- [ ] Button (alle Variants & States)
- [ ] Input (Text, Textarea, Select)
- [ ] Card
- [ ] Badge
- [ ] Checkbox, Radio
- [ ] Label
- [ ] Separator

### Phase 3: Complex Components
- [ ] Dialog/Modal
- [ ] Tabs
- [ ] Accordion
- [ ] Progress
- [ ] Toast
- [ ] Alert
- [ ] Tooltip
- [ ] Skeleton

### Phase 4: Navigation
- [ ] Header
- [ ] Footer
- [ ] Breadcrumbs (optional)

### Phase 5: Custom Components
- [ ] Address Autocomplete
- [ ] Static Map Thumbnail
- [ ] Lightbox
- [ ] Image Card
- [ ] Job Card
- [ ] Booking Stepper

### Phase 6: Layouts
- [ ] Homepage Layout
- [ ] Buchung Layout (5 Steps)
- [ ] Dashboard Layout
- [ ] Review/Gallery Layout
- [ ] Jobs List Layout
- [ ] Blog Layout

### Phase 7: Mobile Variants
- [ ] Responsive Components
- [ ] Mobile Navigation
- [ ] Mobile-specific Components

### Phase 8: Prototyping
- [ ] Link Pages
- [ ] Add Interactions
- [ ] Test User Flows

---

## 12. RESSOURCEN & PLUGINS

### Empfohlene Figma Plugins:
1. **Stark** - Accessibility Checker (Kontrast, Focus)
2. **Content Reel** - Realistische Mock-Daten
3. **Unsplash** - Stock Images für Galerie
4. **Iconify** - Lucide Icons importieren
5. **Auto Layout Helper** - Auto Layout optimieren
6. **Design Lint** - Design-Fehler finden

### Externe Ressourcen:
- **Shadcn UI Dokumentation**: https://ui.shadcn.com
- **Tailwind CSS Docs**: https://tailwindcss.com/docs
- **Lucide Icons**: https://lucide.dev
- **Radix UI Primitives**: https://radix-ui.com (für Behavior-Referenz)

---

## 📊 ZUSAMMENFASSUNG

**Gesamt zu erstellende Components:**
- **15 Basis-Components** (Button, Input, Card, etc.)
- **10 Complex Components** (Dialog, Tabs, Accordion, etc.)
- **5 Navigation Components** (Header, Footer, etc.)
- **6 Custom Components** (Address Autocomplete, Lightbox, etc.)

**= 36 Components insgesamt**

**Empfohlene Reihenfolge:**
1. Foundations (2-3 Stunden)
2. Core Components (4-6 Stunden)
3. Complex Components (4-6 Stunden)
4. Custom Components (3-4 Stunden)
5. Layouts (6-8 Stunden)

**Geschätzte Gesamtzeit**: 20-30 Stunden für komplettes Design System

---

**Viel Erfolg bei der Erstellung Ihres Figma Design Systems! 🎨**

Bei Fragen zur Umsetzung einzelner Components stehe ich gerne zur Verfügung.
