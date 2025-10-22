# pix.immo - Figma Quick Start Guide

## 🚀 In 10 Schritten zum Design System

### Schritt 1: Neues Figma-Projekt erstellen (5 Min)

1. Öffnen Sie Figma
2. Klicken Sie auf **"New Design File"**
3. Benennen Sie es: **"pix.immo UI Design System"**
4. Speichern Sie es in Ihrem Team-Workspace

---

### Schritt 2: Pages strukturieren (5 Min)

Erstellen Sie folgende Pages in Figma:

```
📄 Page 1: Foundations
📄 Page 2: Components Library
📄 Page 3: High Priority Layouts
📄 Page 4: Medium Priority Layouts
📄 Page 5: Mobile Views
📄 Page 6: Prototypes
```

**Wie**: Rechtsklick auf Page → Rename → Neue Page mit "+"

---

### Schritt 3: Foundations Setup (1-2 Stunden)

#### 3.1 Color Styles erstellen

**Desktop Grid erstellen:**
1. Frame erstellen (Desktop, 1440x900px)
2. Benennen: "Color System"

**Light Mode Colors:**
```
Erstellen Sie Rechtecke (100x100px) mit folgenden Farben:

Background:
- background: #FFFFFF
- foreground: #09090B

Primary (Beispiel - anpassen nach Ihrer Marke):
- primary: #18181B
- primary-foreground: #FAFAFA

Secondary:
- secondary: #F4F4F5
- secondary-foreground: #18181B

Accent:
- accent: #F4F4F5
- accent-foreground: #18181B

Muted:
- muted: #F4F4F5
- muted-foreground: #71717A

Destructive:
- destructive: #EF4444
- destructive-foreground: #FAFAFA

Border:
- border: #E4E4E7
- input: #E4E4E7
- ring: #18181B

Card:
- card: #FFFFFF
- card-foreground: #09090B
```

**Für jede Farbe:**
1. Rechteck auswählen
2. Rechtsklick → "Create Style"
3. Benennen: `Primary/500`, `Primary/Foreground`, etc.

**Dark Mode:**
- Wiederholen Sie den Prozess mit dunkleren Farben
- Benennen: `Primary/500 Dark`, etc.

**Tipp**: Nutzen Sie später Figma Variables für automatisches Switching

---

#### 3.2 Typography Styles erstellen

**Frame erstellen**: "Typography System"

**Erstellen Sie folgende Text-Styles:**

```
H1:
- Font: Inter Bold (oder Ihre Font)
- Size: 36px
- Line Height: 40px (111%)
- Letter Spacing: -0.02em

H2:
- Font: Inter Bold
- Size: 30px
- Line Height: 36px (120%)
- Letter Spacing: -0.01em

H3:
- Font: Inter Semibold
- Size: 24px
- Line Height: 32px (133%)

H4:
- Font: Inter Semibold
- Size: 20px
- Line Height: 28px (140%)

Body Large:
- Font: Inter Regular
- Size: 16px
- Line Height: 24px (150%)

Body:
- Font: Inter Regular
- Size: 14px
- Line Height: 20px (143%)

Caption:
- Font: Inter Regular
- Size: 12px
- Line Height: 16px (133%)
```

**Für jeden Style:**
1. Text-Element erstellen
2. Styling anwenden
3. Rechtsklick → "Create Text Style"
4. Benennen: `Heading/H1`, `Body/Regular`, etc.

---

#### 3.3 Spacing dokumentieren

**Frame erstellen**: "Spacing System"

Erstellen Sie Rechtecke mit Auto Layout:
- 4px (spacing-1)
- 8px (spacing-2)
- 16px (spacing-4)
- 24px (spacing-6)
- 32px (spacing-8)
- 48px (spacing-12)

**Tipp**: Notieren Sie sich diese Werte - Sie werden sie konstant nutzen!

---

### Schritt 4: Erste Components erstellen (2-3 Stunden)

#### 4.1 Button Component

**Frame erstellen auf Page "Components Library"**

1. **Basis-Button erstellen:**
   - Rechteck mit Auto Layout
   - Padding: Left/Right 16px, Top/Bottom 8px
   - Border Radius: 6px
   - Height: 36px (min-h-9)
   - Background: Primary Color
   - Text: "Button", weiß, 14px Medium

2. **Als Component definieren:**
   - Rechtsklick → "Create Component"
   - Benennen: "Button"

3. **Variants erstellen:**
   - Rechtsklick auf Component → "Add Variant"
   - Property hinzufügen: `variant` (Variant)
   - Optionen: `default`, `secondary`, `destructive`, `outline`, `ghost`, `link`
   
4. **Size Variants:**
   - Property: `size` (Variant)
   - Optionen: `sm`, `default`, `lg`, `icon`
   - Passen Sie Padding und Height an:
     - sm: 32px height, 12px padding
     - default: 36px height, 16px padding
     - lg: 40px height, 32px padding
     - icon: 36x36px, kein Text

5. **State Variants:**
   - Property: `state` (Variant)
   - Optionen: `default`, `hover`, `active`, `disabled`
   - Hover: Leicht aufhellen (z.B. 10% opacity)
   - Active: Noch mehr aufhellen
   - Disabled: 50% opacity

6. **Properties hinzufügen:**
   - Property: `label` (Text)
   - Property: `disabled` (Boolean)
   - Property: `leftIcon` (Instance Swap, optional)
   - Property: `rightIcon` (Instance Swap, optional)

**✅ Fertig!** Sie haben jetzt einen kompletten Button-Component!

---

#### 4.2 Input Component

1. **Basis-Input:**
   - Rechteck mit Auto Layout
   - Padding: 12px Left/Right, 8px Top/Bottom
   - Border: 1px solid (border color)
   - Border Radius: 6px
   - Height: 36px
   - Background: Weiß
   - Placeholder-Text: "Enter text...", grau, 14px

2. **Als Component definieren**

3. **States:**
   - `default`, `focus`, `disabled`, `error`
   - Focus: Border 2px primary, Ring 2px außen
   - Error: Border rot

4. **Properties:**
   - `placeholder` (Text)
   - `value` (Text)
   - `disabled` (Boolean)
   - `error` (Boolean)

---

#### 4.3 Card Component

1. **Basis-Card:**
   - Frame mit Auto Layout (Vertical)
   - Padding: 24px
   - Border: 1px solid (border color)
   - Border Radius: 8px
   - Background: Card color
   - Shadow: Optional (SM oder MD)

2. **Sub-Components:**
   - **CardHeader**: Auto Layout, Gap 4px
     - CardTitle (H3 Style)
     - CardDescription (Body Small, muted)
   - **CardContent**: Padding 24px (anpassbar)
   - **CardFooter**: Padding 24px, Justify Space-between

3. **Als Component mit Slots:**
   - Nutzen Sie "Instance Swap" für flexible Inhalte

---

### Schritt 5: Badge Component (30 Min)

1. **Basis-Badge:**
   - Auto Layout Horizontal
   - Padding: 10px Left/Right, 2px Top/Bottom
   - Border Radius: 9999px (volle Abrundung)
   - Height: min-h-5 (20px)
   - Text: 12px Medium

2. **Variants:**
   - `default`, `secondary`, `destructive`, `outline`, `success`, `warning`
   - Farben entsprechend anpassen

3. **Properties:**
   - `label` (Text)
   - `icon` (Instance Swap, optional)

---

### Schritt 6: Icons integrieren (30 Min)

**Option A: Lucide Icons Plugin**
1. Installieren Sie "Iconify" Plugin
2. Suchen Sie "Lucide"
3. Importieren Sie häufig genutzte Icons:
   - Menu, X, ChevronDown, Plus, Edit, Trash, Heart, etc.

**Option B: Manuelle Icons**
1. Erstellen Sie einfache Icon-Frames (24x24px)
2. Nutzen Sie für Prototyping

**Icons als Components:**
- Erstellen Sie Component "Icon"
- Variants für verschiedene Icons
- Nutzen Sie in Buttons, Inputs, etc. als Instance Swap

---

### Schritt 7: Navigation Components (1 Stunde)

#### Header

1. **Frame erstellen:**
   - Width: 1440px (oder 100%)
   - Height: 64px
   - Auto Layout Horizontal
   - Padding: 16px Left/Right
   - Justify: Space-between
   - Background: Transparent oder weiß
   - Border Bottom: 1px solid

2. **Content:**
   - **Links**: Logo (Text oder Image)
   - **Center**: Navigation Links (Home, Galerie, Blog, etc.)
   - **Rechts**: 
     - CTA Button "Buchen" (Primary)
     - User Avatar oder Login Button

3. **Als Component:**
   - Variants: `logged-out`, `logged-in`

#### Footer

1. **Frame erstellen:**
   - Width: 1440px
   - Auto Layout Vertical
   - Padding: 32px
   - Border Top: 1px solid

2. **Content:**
   - Links (Impressum, AGB, Datenschutz, Kontakt)
   - Copyright Text
   - Optional: Social Media Icons

---

### Schritt 8: Custom Components (2-3 Stunden)

#### Job Card (für `/jobs` Seite)

1. **Card als Basis nutzen**
2. **Header:**
   - Job Number (z.B. "J-2025-001")
   - Status Badge (pending/in_progress/completed)
3. **Content:**
   - Property Name (H4)
   - Address (Body, mit MapPin Icon)
   - Services (Comma-separated)
   - Date
4. **Footer:**
   - "View Details" Button

---

#### Lightbox (für Gallery)

1. **Overlay:**
   - Frame 1440x900px
   - Background: Schwarz 90% opacity
2. **Image Container:**
   - Max-width: 90%, centered
3. **Controls:**
   - Close Button (X, top-right)
   - Previous/Next (Arrows, left/right)
   - Image Counter (Bottom: "5 / 20")
   - Actions (Download, Favorite, Comment)

---

### Schritt 9: High-Priority Layouts erstellen (4-6 Stunden)

**Auf Page "High Priority Layouts"**

#### Homepage Layout

1. **Frame**: 1440x900px (Desktop)
2. **Sections:**
   - Header (Sticky, 64px)
   - Hero Section (600px height)
     - H1 Title
     - Subtitle
     - CTA Button "Jetzt buchen"
     - Background Image (mit Overlay)
   - Image Strip (Horizontal Scroll, 400px height)
   - Services Grid (3 Columns)
   - Footer (200px)

---

#### Buchung Layout (5-Step Wizard)

1. **Frame**: 1440x900px
2. **Header**: Mit Stepper (5 Steps)
3. **Content Area**: 
   - Step 1: Service-Auswahl (Grid mit Checkboxen)
   - Step 2: Adresse (Address Autocomplete + Map)
   - Step 3: Termin (Calendar/TidyCal Embed)
   - Step 4: Kontaktdaten (Form)
   - Step 5: Zusammenfassung
4. **Footer**: Back/Next Buttons

**Tipp**: Erstellen Sie jedes Step als separate Frame, dann verlinken für Prototyping

---

#### Dashboard Layout

1. **Frame**: 1440x900px
2. **Sections:**
   - Header
   - Welcome Section
     - "Willkommen zurück, [Name]"
     - Quick Stats (Jobs aktiv, Downloads verfügbar)
   - Job Cards Grid (2-3 Columns)
   - Quick Actions (Buttons)
   - Footer

---

#### Review/Gallery Layout

1. **Frame**: 1440x900px
2. **Left Sidebar** (300px):
   - Job Info
   - Filters (Alle, Favoriten, Kommentiert)
   - Download-Buttons
3. **Main Area**:
   - Image Grid (Masonry Layout)
   - Klick → Lightbox öffnet

---

### Schritt 10: Mobile Variants (3-4 Stunden)

**Auf Page "Mobile Views"**

1. **Frame**: 375x812px (iPhone 13 Pro)
2. **Anpassungen:**
   - Single Column Layouts
   - Hamburger Menu statt horizontaler Navigation
   - Größere Touch Targets (min 44x44px)
   - Stacked Content
   - Bottom Navigation (optional)

**Components:**
- Erstellen Sie Mobile-Varianten Ihrer wichtigsten Components
- Nutzen Sie Auto Layout für responsive Behavior

---

## ✅ CHECKLISTE

Nach diesem Quick Start sollten Sie haben:

### Foundations:
- [ ] Color Styles (Light Mode)
- [ ] Color Styles (Dark Mode) - optional für später
- [ ] Typography Styles (H1-H6, Body, Caption)
- [ ] Spacing dokumentiert

### Core Components:
- [ ] Button (alle Variants)
- [ ] Input
- [ ] Card (mit Sub-Components)
- [ ] Badge

### Navigation:
- [ ] Header
- [ ] Footer

### Icons:
- [ ] Icon-System integriert (Lucide/Iconify)

### Custom Components:
- [ ] Job Card
- [ ] Lightbox (optional)

### Layouts:
- [ ] Homepage (Desktop)
- [ ] Buchung Wizard (Desktop)
- [ ] Dashboard (Desktop)
- [ ] Review/Gallery (Desktop)

### Mobile:
- [ ] Homepage (Mobile) - optional
- [ ] Wichtigste Seiten (Mobile) - optional

---

## 🎯 NÄCHSTE SCHRITTE

Nach diesem Quick Start:

1. **Vervollständigen Sie die Components Library**
   - Nutzen Sie `FIGMA_COMPONENT_MAPPING.md` als Referenz
   - Arbeiten Sie sich durch alle 36 Components

2. **Erstellen Sie alle Layouts**
   - Nutzen Sie `FIGMA_DESIGN_STRUCTURE.md` für Seitendetails
   - Priorisieren Sie nach HIGH → MEDIUM → LOW

3. **Prototyping**
   - Verlinken Sie alle Pages
   - Erstellen Sie interaktive User Flows
   - Testen Sie mit Stakeholdern

4. **Handoff für Development**
   - Nutzen Sie Figma "Inspect" für CSS-Export
   - Dokumentieren Sie Component-Props
   - Teilen Sie Figma-File mit Entwicklern

---

## 💡 TIPPS & TRICKS

### Efficiency Hacks:
1. **Copy/Paste zwischen Components**: Erstellen Sie ein Component, dann duplizieren und anpassen
2. **Plugins nutzen**: Content Reel für Mock-Daten, Unsplash für Bilder
3. **Keyboard Shortcuts**:
   - `Cmd/Ctrl + D`: Duplicate
   - `Cmd/Ctrl + G`: Group/Frame
   - `Option/Alt + Drag`: Copy
   - `Shift + A`: Auto Layout
4. **Component Libraries**: Nutzen Sie Community-Files als Inspiration (suchen Sie "Shadcn" in Figma Community)

### Häufige Fehler vermeiden:
- ❌ Zu viele Variants auf einmal → Start einfach, erweitern später
- ❌ Inkonsistente Spacing → Nutzen Sie 8px Grid
- ❌ Zu komplexe Auto Layouts → Testen Sie mit echten Inhalten
- ❌ Fehlende States → Denken Sie an hover, active, disabled, error!

---

## 📚 RESSOURCEN

- **Dieses Projekt**:
  - `FIGMA_COMPONENT_MAPPING.md` - Detaillierte Component-Specs
  - `FIGMA_DESIGN_STRUCTURE.md` - Alle 32 Seiten dokumentiert
  - `SEITEN_UEBERSICHT.csv` - Quick Reference Tabelle

- **Externe Hilfe**:
  - Shadcn UI Docs: https://ui.shadcn.com
  - Figma Learn: https://help.figma.com
  - YouTube: "Figma Design System Tutorial"

---

## ⏱️ ZEITPLAN

**Realistischer Zeitplan für komplettes Design System:**

- **Tag 1 (4-6h)**: Foundations + Core Components (Button, Input, Card, Badge)
- **Tag 2 (4-6h)**: Complex Components (Dialog, Tabs, Accordion, etc.)
- **Tag 3 (4-6h)**: Navigation + Custom Components
- **Tag 4 (4-6h)**: High Priority Layouts (Homepage, Buchung, Dashboard)
- **Tag 5 (4-6h)**: Medium Priority Layouts (Jobs, Galerie, Blog)
- **Tag 6 (3-4h)**: Mobile Variants
- **Tag 7 (2-3h)**: Prototyping & Testing

**Total: 25-37 Stunden** für professionelles Design System

---

**Viel Erfolg! 🚀**

Bei Fragen stehe ich Ihnen gerne zur Verfügung.
