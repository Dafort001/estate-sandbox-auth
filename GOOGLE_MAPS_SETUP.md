# Google Maps Integration - Setup Anleitung

## Übersicht

Die Google Maps Integration ermöglicht **Rooftop-genaue Adressvalidierung** mit Autocomplete und statischen Map-Thumbnails für das Booking-Formular.

## Implementierte Features

### 1. **Backend API** (`server/google-maps.ts`)
- ✅ `geocodeAddress()` - Konvertiert Adresse → Lat/Lng
- ✅ `validateAddress()` - Prüft Rooftop-Genauigkeit
- ✅ `getStaticMapUrl()` - Generiert Static Map Thumbnail URLs

### 2. **API Endpoints** (`server/routes.ts`)
- ✅ `POST /api/google/geocode` - Adresse validieren
- ✅ `GET /api/google/static-map` - Static Map URL generieren

### 3. **Database Schema**
- ✅ `orders` table: `addressLat`, `addressLng`, `addressPlaceId`, `addressFormatted`, `addressLocationType`
- ✅ `jobs` table: `addressLat`, `addressLng`, `addressPlaceId`, `addressFormatted`
- ✅ `bookings` table: `addressLat`, `addressLng`, `addressPlaceId`, `addressFormatted`

### 4. **Frontend Komponenten**
- ✅ `AddressAutocomplete.tsx` - Google Places Autocomplete mit Validation
- ✅ `StaticMapThumbnail.tsx` - Map Preview mit Marker
- ✅ Integration in `booking.tsx` - Autocomplete ersetzt Textarea

## 🔑 API Keys einrichten

### Schritt 1: Google Cloud Console Setup

1. **Google Cloud Console öffnen**: https://console.cloud.google.com/
2. **Neues Projekt erstellen** (oder bestehendes auswählen)
3. **APIs aktivieren**:
   - Places API (New)
   - Geocoding API
   - Maps Static API

### Schritt 2: API Key erstellen

1. **Navigation**: APIs & Services → Credentials
2. **"Create Credentials"** → API Key
3. **Key Name**: `pix-immo-production` (oder ähnlich)
4. **API Key kopieren** (z.B. `AIzaSyC...`)

### Schritt 3: API Key absichern

⚠️ **WICHTIG**: API Key NIEMALS im Code hardcoden!

1. **Key Restrictions**:
   - **Application restrictions**: 
     - HTTP referrers: `*.replit.dev/*`, `*.replit.app/*`, `pix.immo/*`
   - **API restrictions**:
     - Nur aktivierte APIs: Places API, Geocoding API, Maps Static API

2. **Quota Limits setzen** (optional):
   - Places API: 1000 requests/day (anpassbar)
   - Geocoding API: 1000 requests/day
   - Static Maps: 1000 requests/day

### Schritt 4: Environment Variables in Replit setzen

**Secrets hinzufügen** (im Replit Secrets Pane):

```bash
# Backend API Key
GOOGLE_MAPS_API_KEY=AIzaSyC...

# Frontend API Key (muss mit VITE_ prefixed sein!)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...
```

**Hinweis**: Sie können denselben API Key für Backend und Frontend verwenden, oder separate Keys für bessere Sicherheit.

### Schritt 5: Workflow neustarten

Nach dem Hinzufügen der Environment Variables:

1. **Workflow stoppen** (falls läuft)
2. **Workflow neustarten**: `npm run dev`
3. **Testen**: Booking-Formular öffnen und Adresse eingeben

## 🧪 Testing

### Manuelle Tests

1. **Booking-Formular öffnen**: `/booking`
2. **Adresse eingeben**: "Reeperbahn 1, Hamburg"
3. **Autocomplete auswählen**: Adresse aus Dropdown wählen
4. **Map Thumbnail prüfen**: Sollte erscheinen nach Auswahl
5. **Formular abschicken**: Booking sollte erstellt werden
6. **Database prüfen**: `addressLat`, `addressLng`, `addressPlaceId` sollten gespeichert sein

### E2E Tests (TODO)

```bash
# Test wird implementiert in maps8
npm run test:e2e
```

## 📊 API Kosten

**Google Maps Preise** (Stand 2024):

- **Places Autocomplete**: $2.83 pro 1000 Requests
- **Geocoding API**: $5.00 pro 1000 Requests
- **Static Maps**: $2.00 pro 1000 Requests

**Kostenkontrolle**:
- Setzen Sie Quota Limits in Google Cloud Console
- Aktivieren Sie Billing Alerts

## 🔧 Troubleshooting

### Problem: "API key not valid"
- ✅ Prüfen Sie API Key in Replit Secrets
- ✅ Aktivieren Sie alle 3 APIs in Google Cloud Console
- ✅ Warten Sie 5 Minuten nach API-Aktivierung

### Problem: "Autocomplete zeigt keine Vorschläge"
- ✅ `VITE_GOOGLE_MAPS_API_KEY` korrekt gesetzt?
- ✅ Browser Console auf Fehler prüfen
- ✅ API Restrictions prüfen (HTTP referrers)

### Problem: "Map Thumbnail lädt nicht"
- ✅ `GOOGLE_MAPS_API_KEY` (Backend) korrekt gesetzt?
- ✅ Static Maps API aktiviert?
- ✅ Network Tab prüfen auf 403 Errors

## 📝 Weitere Schritte

- [ ] **maps1**: API Keys in Replit Secrets hinzufügen
- [ ] **maps8**: E2E Testing mit Playwright
- [x] **maps2-7**: Implementierung abgeschlossen

## 🎯 Nächste Features (Optional)

- **Address Validation für Orders**: Gleiche Integration wie Bookings
- **Geocoding Caching**: Wiederholte Requests vermeiden
- **Alternative Geocoding APIs**: OpenStreetMap Nominatim als Fallback
- **Map Interaktiv**: Embedded Map statt Static Image
