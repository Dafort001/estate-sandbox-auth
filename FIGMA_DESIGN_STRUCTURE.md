# pix.immo - Figma Design Struktur & Seitenübersicht

## 📋 Anleitung für Figma-Projekt

### Empfohlene Figma-Struktur:
1. **Neues Figma-Projekt erstellen**: "pix.immo UI Design System"
2. **Pages in Figma anlegen** (entsprechend den Kategorien unten)
3. **Design System zuerst**: Farben, Typography, Components (Buttons, Cards, Forms)
4. **Dann Layouts**: Mobile-First → Desktop

---

## 🎨 Kategorisierte Seitenübersicht

### 1️⃣ PUBLIC MARKETING PAGES (Öffentlich zugänglich)

#### **Homepage** (`/`)
- **Funktion**: Hauptseite, erste Anlaufstelle für Besucher
- **Elemente**: 
  - Hero-Sektion mit Value Proposition
  - Horizontaler Image-Scrollstrip (Portfolio-Showcase)
  - Service-Übersicht
  - Call-to-Action für Buchung
  - Sticky Header mit Navigation
  - Minimalistischer Footer
- **Zielgruppe**: Alle Besucher (Immobilienmakler, Eigentümer)
- **Status**: ✅ Implementiert
- **Besonderheiten**: Minimalistisches Design, Fokus auf hochwertige Bilder

---

#### **Galerie** (`/galerie`)
- **Funktion**: Portfolio-Galerie mit abgeschlossenen Projekten
- **Elemente**:
  - Masonry-Layout (responsive Spalten)
  - Progressive Image Loading
  - Lightbox Modal für Vollbildansicht
  - Filter-/Kategorisierungsoptionen
- **Zielgruppe**: Potenzielle Kunden zur Qualitätsbewertung
- **Status**: ✅ Implementiert
- **Besonderheiten**: JavaScript-gesteuert, Performance-optimiert

---

#### **Blog Übersicht** (`/blog`)
- **Funktion**: Blog-Übersichtsseite mit Artikeln
- **Elemente**:
  - Grid-Layout mit Blog-Post-Cards
  - Thumbnail, Titel, Excerpt, Datum
  - Kategorien/Tags
  - Search/Filter
- **Zielgruppe**: SEO, Content Marketing, Kundenbildung
- **Status**: ✅ Implementiert (Mock-Daten)
- **Besonderheiten**: Schema.org für SEO

---

#### **Blog Post** (`/blog/:slug`)
- **Funktion**: Einzelner Blog-Artikel
- **Elemente**:
  - Hero-Bild
  - Artikel-Content (Markdown/Rich Text)
  - Author Info, Datum
  - Related Posts
  - Share-Buttons
- **Zielgruppe**: Leser, SEO
- **Status**: ✅ Implementiert (Mock-Daten)

---

#### **Über uns** (`/about`)
- **Funktion**: Unternehmensvorstellung, Team, Vision
- **Elemente**:
  - Team-Mitglieder
  - Unternehmensgeschichte
  - Werte & Mission
  - Equipment/Technologie
- **Zielgruppe**: Vertrauensaufbau
- **Status**: ✅ Implementiert

---

### 2️⃣ SERVICE & BOOKING PAGES

#### **Preise** (`/preise`)
- **Funktion**: Umfassende Preisübersicht aller Services
- **Elemente**:
  - 8 Service-Sektionen:
    1. Fotografie (Interior, Exterior, Twilight)
    2. Drohnen-Fotografie/-Video
    3. Video-Produktion
    4. Virtuelle Touren (360°, Matterport)
    5. Virtual Staging
    6. Bildoptimierung
    7. Zusatzleistungen
    8. Anfahrtskosten
  - Preis-Tabellen, FAQ pro Sektion
- **Zielgruppe**: Kunden, die Transparenz suchen
- **Status**: ✅ Implementiert
- **Besonderheiten**: Sehr detailliert, viele Optionen

---

#### **Preisliste** (`/preisliste`)
- **Funktion**: Interne Preisliste (kompakte Version)
- **Elemente**:
  - Service-Katalog mit 25 Services in 7 Kategorien
  - Preise, Beschreibungen
  - Möglicherweise downloadbar als PDF
- **Zielgruppe**: Interne Referenz, B2B-Kunden
- **Status**: ✅ Implementiert

---

#### **Buchung** (`/buchen`)
- **Funktion**: Multi-Step Booking Wizard
- **Elemente**:
  - **Step 1**: Service-Auswahl (Checkboxen, 25 Services)
  - **Step 2**: Adresse (Google Places Autocomplete + Karte)
  - **Step 3**: Termin-Auswahl (TidyCal Integration)
  - **Step 4**: Kontaktdaten
  - **Step 5**: Zusammenfassung & Bestätigung
  - Progress Indicator
  - Back/Next Navigation
- **Zielgruppe**: Neue Kunden
- **Status**: ✅ Implementiert
- **Besonderheiten**: Google Maps Integration, TidyCal, komplexe State-Verwaltung

---

#### **Buchungsbestätigung** (`/booking-confirmation`)
- **Funktion**: Bestätigungsseite nach erfolgreicher Buchung
- **Elemente**:
  - Erfolgs-Meldung
  - Buchungsdetails
  - Nächste Schritte
  - Email-Bestätigung Info
- **Zielgruppe**: Kunden nach Buchung
- **Status**: ✅ Implementiert

---

#### **FAQ** (`/faq`)
- **Funktion**: Häufig gestellte Fragen
- **Elemente**:
  - Accordion-Layout
  - Kategorisiert nach Themen
  - Suchfunktion
- **Zielgruppe**: Alle Besucher
- **Status**: ✅ Implementiert

---

### 3️⃣ LEGAL & INFORMATION PAGES

#### **Impressum** (`/impressum`)
- **Funktion**: Gesetzlich vorgeschriebenes Impressum
- **Elemente**: Firmeninfo, Anschrift, Kontakt, USt-ID, etc.
- **Status**: ✅ Implementiert

---

#### **AGB** (`/agb`)
- **Funktion**: Allgemeine Geschäftsbedingungen
- **Elemente**: Rechtliche Texte, strukturiert
- **Status**: ✅ Implementiert

---

#### **Datenschutz** (`/datenschutz`)
- **Funktion**: Datenschutzerklärung (DSGVO)
- **Elemente**: Datenschutzrichtlinien, Cookie-Policy
- **Status**: ✅ Implementiert

---

#### **Kontakt** (`/kontakt`)
- **Funktion**: Kontaktinformationen-Seite
- **Elemente**:
  - Anschrift, Telefon, Email
  - Öffnungszeiten
  - Karte (optional)
  - Link zum Kontaktformular
- **Status**: ✅ Implementiert

---

#### **Kontaktformular** (`/kontakt-formular`)
- **Funktion**: Kontaktformular für Anfragen
- **Elemente**:
  - Name, Email, Betreff, Nachricht
  - Validierung
  - Mailgun Integration (geplant)
- **Status**: ✅ Implementiert

---

### 4️⃣ AUTHENTICATION

#### **Login** (`/login`)
- **Funktion**: Benutzer-Anmeldung
- **Elemente**:
  - Email/Password-Felder
  - "Passwort vergessen"-Link
  - Session-basierte Auth
- **Zielgruppe**: Registrierte Kunden & Admins
- **Status**: ✅ Implementiert
- **Besonderheiten**: Scrypt Hashing, HTTP-only Cookies

---

#### **Registrierung** (`/register`)
- **Funktion**: Neuer Account erstellen
- **Elemente**:
  - Name, Email, Passwort
  - Validierung
  - Auto-Login nach Signup
- **Zielgruppe**: Neue Kunden
- **Status**: ✅ Implementiert

---

### 5️⃣ CUSTOMER PORTAL (Authentifiziert)

#### **Dashboard** (`/dashboard`)
- **Funktion**: Kunden-Übersichtsseite nach Login
- **Elemente**:
  - Willkommens-Meldung
  - Aktive Jobs/Projekte
  - Letzte Aktivitäten
  - Quick Actions (Neues Projekt, Downloads)
  - Navigation zu Jobs, Reviews, Downloads
- **Zielgruppe**: Eingeloggte Kunden
- **Status**: ✅ Implementiert
- **Besonderheiten**: Zentrale Hub-Seite

---

#### **Jobs** (`/jobs`)
- **Funktion**: Übersicht aller Fotografie-Aufträge des Kunden
- **Elemente**:
  - Job-Liste (Cards/Tabelle)
  - Status-Badges (pending, in_progress, completed, etc.)
  - Filter/Sort nach Status, Datum
  - Details-Button zu Job-Detail-Seite
- **Zielgruppe**: Eingeloggte Kunden
- **Status**: ✅ Implementiert
- **Besonderheiten**: Rolle-basierter Zugriff

---

#### **Job Detail** (`/job/:id`)
- **Funktion**: Detailansicht eines einzelnen Jobs
- **Elemente**:
  - Job-Informationen (Adresse, Services, Datum)
  - Status-Timeline
  - Shoots zugeordnet
  - Bilder/Downloads
  - Kommentare/Notes
- **Zielgruppe**: Kunden & Admins
- **Status**: ✅ Implementiert (als `demo-job-detail.tsx`)

---

#### **Review/Gallery** (`/review/:jobId/:shootId`)
- **Funktion**: Client Gallery - Kunden sehen finale Bilder eines Shoots
- **Elemente**:
  - Lightbox Image Viewer
  - Favoriten-System (❤️)
  - Kommentar-System (💬 Feedback zu einzelnen Bildern)
  - Bulk-Download & Individual Download
  - Filter (Alle, Favoriten, Kommentiert)
- **Zielgruppe**: Kunden nach Shoot-Abschluss
- **Status**: ✅ Implementiert
- **Besonderheiten**: Kollaborations-Features, Download-Links

---

#### **Downloads** (`/downloads`)
- **Funktion**: Download-Zentrale für alle Dateien
- **Elemente**:
  - Liste aller verfügbaren Downloads
  - RAW-Files, Bearbeitete Bilder, ZIP-Pakete
  - Filter nach Job, Datum, Typ
  - Download-Status
- **Zielgruppe**: Kunden
- **Status**: ✅ Implementiert

---

### 6️⃣ INTERNAL WORKFLOW PAGES

#### **Intake** (`/intake`)
- **Funktion**: Intake-Formular für neue Aufträge (interner Prozess)
- **Elemente**:
  - Detaillierte Auftragserfassung
  - Kunde, Adresse, Services, Sonderwünsche
  - Interne Notes
- **Zielgruppe**: Admins, Fotografen
- **Status**: ✅ Implementiert

---

#### **Upload RAW** (`/upload-raw`)
- **Funktion**: RAW-Datei-Upload durch Fotografen
- **Elemente**:
  - Multi-File-Upload (30+ RAW-Formate)
  - Presigned URL Upload zu R2/GCS
  - Auto-Stacking (Bracket-Detection)
  - Filename-Konvention: `jobNumber_stackNumber_roomType_exposure.CR3`
  - Progress-Tracking
  - Shoot-Auswahl (via Shoot-Code oder Job-Nummer)
- **Zielgruppe**: Fotografen (manuell oder iOS App)
- **Status**: ✅ Implementiert
- **Besonderheiten**: Komplexer Upload-Flow, Object Storage Integration

---

#### **Demo Upload** (`/demo-upload`)
- **Funktion**: Demo/Test-Upload-Seite (Development)
- **Elemente**: Simplified Upload für Testing
- **Zielgruppe**: Development/Testing
- **Status**: ✅ Implementiert

---

#### **Demo Jobs** (`/demo-jobs`)
- **Funktion**: Demo Job-Liste (Development)
- **Elemente**: Seeded Demo-Daten für Testing
- **Zielgruppe**: Development/Testing
- **Status**: ✅ Implementiert

---

### 7️⃣ ADMIN TOOLS (Nur für Admins)

#### **Admin Editorial** (`/admin/editorial`)
- **Funktion**: Content-Management für Blog, Galerie
- **Elemente**:
  - Blog-Post-Verwaltung (CRUD)
  - Galerie-Verwaltung
  - Rich-Text-Editor
  - Media Library
- **Zielgruppe**: Admins
- **Status**: ✅ Implementiert

---

#### **Admin SEO** (`/admin/seo`)
- **Funktion**: SEO-Management-Dashboard
- **Elemente**:
  - Meta-Tag-Verwaltung pro Seite
  - Sitemap-Generierung
  - Robots.txt
  - Analytics-Integration
- **Zielgruppe**: Admins
- **Status**: ✅ Implementiert

---

#### **AI Lab** (`/ai-lab`)
- **Funktion**: AI-Bildverarbeitung Testumgebung
- **Elemente**:
  - Replicate API Integration
  - Image Upload & Verarbeitung
  - Verschiedene AI-Modelle testen
  - Preview & Download
- **Zielgruppe**: Admins, Development
- **Status**: ✅ Implementiert
- **Besonderheiten**: Replicate API, Modal Labs Integration (geplant)

---

### 8️⃣ LEGACY/OLD PAGES (Möglicherweise zu vereinheitlichen)

#### **Gallery (Old)** (`/gallery`)
- **Funktion**: Alte Gallery-Seite (vs. `/galerie`)
- **Status**: ⚠️ Duplikat - zu konsolidieren mit `/galerie`

---

#### **Order Form (Old)** (`/order`)
- **Funktion**: Altes Bestellformular
- **Status**: ⚠️ Möglicherweise veraltet - vs. `/buchen`

---

#### **Pricing (Old)** (`/preise` vs `/preisliste`)
- **Status**: ⚠️ Zwei ähnliche Seiten - zu vereinheitlichen

---

### 9️⃣ ERROR & UTILITY

#### **404 - Not Found** (`/*`)
- **Funktion**: Fehlerseite für nicht existierende URLs
- **Status**: ✅ Implementiert

---

## 🎯 Zusammenfassung nach Priorität

### HIGH PRIORITY (Kundenorientiert):
1. **Homepage** - Haupteinstieg
2. **Buchung** - Conversion-Seite
3. **Preise** - Information
4. **Dashboard** - Customer Portal Hub
5. **Review/Gallery** - Kundenkollaboration
6. **Login/Register** - Authentication

### MEDIUM PRIORITY:
7. **Jobs** - Job-Management
8. **Downloads** - File Delivery
9. **Galerie** - Portfolio
10. **Blog** - Content Marketing
11. **FAQ** - Support

### LOW PRIORITY (Legal/Admin):
12. Legal Pages (Impressum, AGB, Datenschutz)
13. Admin Tools
14. Internal Workflows

---

## 📐 Figma Design System Empfehlungen

### Components Library (zu erstellen):
- **Navigation**: Header (sticky), Footer, Breadcrumbs
- **Buttons**: Primary, Secondary, Ghost, Icon-Only
- **Forms**: Input, Textarea, Select, Checkbox, Radio, Date Picker
- **Cards**: Job Card, Blog Card, Service Card, Image Card
- **Modals**: Lightbox, Confirmation, Alert
- **Badges**: Status (pending, in_progress, completed, etc.)
- **Progress**: Steps (Booking Wizard), Progress Bar, Skeleton Loader
- **Tables**: Job List, Download List
- **Typography**: H1-H6, Body, Caption, Link
- **Colors**: Primary, Secondary, Accent, Background, Text (Light/Dark Mode)
- **Icons**: Lucide React Icons (konsistent verwenden)

### Responsive Breakpoints:
- Mobile: 320px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Design-Prinzipien (aus replit.md):
- Minimalistisch
- Modern
- Developer-fokussiert
- Clean
- Hochwertig (Premium-Feeling für Immobilien-Branche)

---

## 🚀 Nächste Schritte für Figma

1. **Figma-Projekt erstellen**: "pix.immo UI/UX Design System"
2. **Pages anlegen**:
   - Page 1: Design System (Colors, Typography, Components)
   - Page 2: Public Pages
   - Page 3: Customer Portal
   - Page 4: Admin & Internal
   - Page 5: Mobile Views
3. **Frames erstellen** für jede Seite (Desktop 1440px, Mobile 375px)
4. **Design System zuerst**: Definieren Sie Farben, Fonts, Component Library
5. **Dann Layouts**: Arbeiten Sie sich durch die Prioritätsliste
6. **Prototyping**: Verlinken Sie die Seiten für User Flow Testing

---

## 📊 Statistik

- **Gesamt**: 32 einzigartige Seiten
- **Public Marketing**: 5 Seiten
- **Service/Booking**: 6 Seiten
- **Legal/Info**: 5 Seiten
- **Auth**: 2 Seiten
- **Customer Portal**: 5 Seiten
- **Internal Workflow**: 4 Seiten
- **Admin Tools**: 3 Seiten
- **Legacy/Duplikate**: 2 Seiten (zu konsolidieren)

---

**Erstellt am**: Oktober 2025  
**Projekt**: pix.immo Real Estate Media Platform  
**Tech Stack**: React, TypeScript, Hono, PostgreSQL, Cloudflare R2
