# pix.immo – Mobile Camera Integration Plan

> **Ziel:** Integration des Figma Make Camera-Prototyps in die pix.immo WebApp als Progressive Web App (PWA) mit nativer Kamera-Funktionalität

## 1. Übersicht

### Strategie: Dual-Mode WebApp

**Desktop-Modus:**
- Vollständiges Portal (Orders, Gallery, Booking, etc.)
- Datei-Upload via Drag & Drop
- Umfassende Admin-Features

**Mobile-Modus (Photographer):**
- Optimiertes Kamera-Interface
- Vor-Ort-Fotografie-Workflow
- Schneller Upload zum Backend
- PWA-Installation auf Homescreen

---

## 2. Architektur

### 2.1 Route-Struktur

**Neue Mobile-First Routes:**
```
/capture             → Camera Interface (Mobile)
/capture/gallery     → Shot Review & Selection
/capture/upload      → Upload Queue & Progress
```

**Bestehende Routes bleiben:**
```
/                    → Homepage
/gallery             → Client Gallery
/orders              → Order Management
/admin               → Admin Dashboard
```

### 2.2 Responsive Design Strategy

**Mobile Detection:**
```typescript
// hooks/useDeviceType.ts
export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        window.innerWidth < 768
      );
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  return { isMobile };
}
```

**Automatic Redirect:**
- Mobile-Geräte → `/capture` (Kamera-Interface)
- Desktop → `/` (Portal)
- User kann manuell wechseln

---

## 3. Figma Make Components Integration

### 3.1 Component Mapping

**Aus Figma Make übernehmen:**

| Figma Component | Ziel in pix.immo | Status |
|-----------------|------------------|--------|
| `SplashScreen.tsx` | `/capture` Landing | ✅ Adaptieren |
| `CameraScreen.tsx` | `/capture/shoot` | ✅ Integrieren |
| `GalleryScreen.tsx` | `/capture/review` | ✅ Integrieren |
| `UploadScreen.tsx` | `/capture/upload` | ✅ An Backend anbinden |
| `PhoneFrame.tsx` | Mobile Layout Wrapper | ✅ Übernehmen |
| `StatusBar.tsx` | iOS-Style StatusBar | ✅ Übernehmen |
| `HapticButton.tsx` | Touch Feedback | ✅ Übernehmen |

**Anpassungen erforderlich:**
- Backend-Integration (API-Aufrufe an `/api/ios/upload/init`)
- Authentication (Session/JWT)
- Shoot-Code Generation
- R2 Upload-Flow

### 3.2 File Structure

**Neue Verzeichnisse:**
```
client/src/
├── pages/
│   ├── capture/
│   │   ├── index.tsx           # Landing/Splash
│   │   ├── camera.tsx          # Camera Interface
│   │   ├── review.tsx          # Shot Review
│   │   └── upload.tsx          # Upload Queue
│   └── ...existing pages
├── components/
│   ├── mobile/
│   │   ├── PhoneFrame.tsx      # From Figma Make
│   │   ├── StatusBar.tsx       # From Figma Make
│   │   ├── HapticButton.tsx    # From Figma Make
│   │   └── CameraControls.tsx  # Custom
│   └── ...existing components
└── hooks/
    ├── useCamera.ts            # Camera API wrapper
    ├── useHaptic.ts            # From Figma Make
    └── useDeviceType.ts        # Mobile detection
```

---

## 4. Camera API Integration

### 4.1 Native Camera Access

**Browser API:**
```typescript
// hooks/useCamera.ts
export function useCamera() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const startCamera = async (facingMode: 'user' | 'environment' = 'environment') => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode,
          width: { ideal: 4032 },  // 12MP
          height: { ideal: 3024 },
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
    }
  };
  
  const capturePhoto = async (): Promise<Blob> => {
    const canvas = document.createElement('canvas');
    const video = videoRef.current!;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
    });
  };
  
  return { stream, videoRef, startCamera, capturePhoto };
}
```

**Features:**
- ✅ Rear Camera (facingMode: environment)
- ✅ High-Resolution Capture (12MP+)
- ✅ JPEG Compression (95% quality)
- ✅ Orientation handling (EXIF)

### 4.2 Advanced Camera Features

**HDR Bracketing (für später):**
```typescript
// Capture 3 exposures: -2 EV, 0, +2 EV
async function captureHDRBracket() {
  const track = stream.getVideoTracks()[0];
  const capabilities = track.getCapabilities();
  
  if (capabilities.exposureCompensation) {
    const bracket = [];
    for (const ev of [-2, 0, 2]) {
      await track.applyConstraints({
        advanced: [{ exposureCompensation: ev }]
      });
      await new Promise(resolve => setTimeout(resolve, 200)); // Settle time
      bracket.push(await capturePhoto());
    }
    return bracket;
  }
}
```

---

## 5. Upload Flow Integration

### 5.1 Bestehende API nutzen

**Endpoints bereits vorhanden:**
```
POST /api/ios/upload/init          ← Shoot-Session starten
POST /api/ios/upload/presigned     ← R2 Upload-URL holen
POST /api/ios/upload/confirm       ← Upload bestätigen
```

**Flow:**
```typescript
// pages/capture/upload.tsx
async function uploadPhotos(photos: Blob[], shootCode: string) {
  // 1. Init Session
  const session = await fetch('/api/ios/upload/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ shootCode })
  }).then(r => r.json());
  
  // 2. Upload Each Photo
  for (const [index, photo] of photos.entries()) {
    // Get presigned URL
    const { uploadUrl, key } = await fetch('/api/ios/upload/presigned', {
      method: 'POST',
      body: JSON.stringify({ 
        fileName: `${shootCode}_${index + 1}.jpg`,
        contentType: 'image/jpeg'
      })
    }).then(r => r.json());
    
    // Upload to R2
    await fetch(uploadUrl, {
      method: 'PUT',
      body: photo,
      headers: { 'Content-Type': 'image/jpeg' }
    });
    
    // Confirm
    await fetch('/api/ios/upload/confirm', {
      method: 'POST',
      body: JSON.stringify({ key, shootCode })
    });
  }
}
```

### 5.2 Progressive Upload UI

**Features:**
- ✅ Queue-based upload (nicht alle auf einmal)
- ✅ Progress-Tracking pro Foto
- ✅ Retry bei Fehlern
- ✅ Offline-Queue (IndexedDB)

---

## 6. PWA Configuration

### 6.1 Manifest.json

```json
{
  "name": "pix.immo Camera",
  "short_name": "pix.immo",
  "description": "Professional Real Estate Photography",
  "start_url": "/capture",
  "display": "standalone",
  "orientation": "portrait",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ],
  "permissions": [
    "camera",
    "storage"
  ],
  "categories": ["photography", "productivity"]
}
```

### 6.2 Service Worker (für Offline-Funktionalität)

```typescript
// client/public/sw.js
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('pix-immo-v1').then((cache) => {
      return cache.addAll([
        '/capture',
        '/capture/camera',
        '/styles/globals.css',
        // Critical assets
      ]);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Create `/capture` route structure
- [ ] Copy Figma Make components to `client/src/components/mobile/`
- [ ] Implement `useCamera` hook
- [ ] Basic camera preview working
- [ ] Mobile detection & redirect

### Phase 2: Camera Interface (Week 2)
- [ ] Camera controls (shutter, flip, flash)
- [ ] Photo capture & preview
- [ ] Gallery review screen
- [ ] Delete/retake functionality
- [ ] Haptic feedback integration

### Phase 3: Upload Integration (Week 3)
- [ ] Connect to existing `/api/ios/upload/*` endpoints
- [ ] Shoot-Code generation UI
- [ ] Progress tracking
- [ ] Error handling & retry logic
- [ ] Offline queue (IndexedDB)

### Phase 4: PWA Features (Week 4)
- [ ] manifest.json configuration
- [ ] Service worker for offline
- [ ] Install prompt ("Add to Home Screen")
- [ ] iOS-specific meta tags
- [ ] Push notifications (optional)

### Phase 5: Testing & Optimization (Week 5)
- [ ] Test on real devices (iPhone, Android)
- [ ] Performance optimization
- [ ] Battery usage optimization
- [ ] Network efficiency (compression)
- [ ] E2E tests (Playwright mobile mode)

---

## 8. Technical Decisions

### 8.1 Warum Web statt Native App?

**Vorteile:**
- ✅ Einheitliche Codebasis (Web + Mobile)
- ✅ Keine App-Store-Approval nötig
- ✅ Sofortige Updates (kein App-Download)
- ✅ Cross-Platform (iOS + Android)
- ✅ Einfachere Wartung

**Trade-offs:**
- ⚠️ Leicht reduzierte Performance vs. native
- ⚠️ Begrenzte Kamera-Features (kein ProRAW auf iOS Web)
- ⚠️ Abhängig von Browser-Unterstützung

**Mitigation:**
- Für Pro-Features: Separate native iOS App später möglich
- Fallback auf File-Upload wenn Camera API nicht verfügbar

### 8.2 Offline-First Architecture

**Strategy:**
- Fotos lokal speichern (IndexedDB)
- Upload im Hintergrund (Background Sync API)
- Retry-Queue bei Netzwerkfehlern
- Sync-Status-Indicator

---

## 9. Integration mit bestehendem System

### 9.1 Backend-Endpoints (keine Änderungen nötig!)

**Bereits vorhanden:**
- ✅ `/api/ios/auth/login` – JWT-basierte Auth
- ✅ `/api/ios/upload/init` – Session starten
- ✅ `/api/ios/upload/presigned` – R2 Upload-URLs
- ✅ `/api/ios/upload/confirm` – Upload bestätigen

**Neue Endpoints (optional):**
- `POST /api/shoots/generate-code` – Shoot-Code generieren
- `GET /api/shoots/:code/status` – Upload-Status prüfen

### 9.2 Datenmodell (bereits vorhanden)

**Tabellen:**
- `shoots` – Shoot-Sessions
- `images` – Hochgeladene Fotos
- `users` – Fotografen

**Keine Änderungen nötig!**

---

## 10. UI/UX Konzept

### 10.1 Mobile-First Design

**Layout:**
```
┌─────────────────────┐
│  Status Bar         │ ← iOS-Style (Uhrzeit, Akku)
├─────────────────────┤
│                     │
│   Camera Preview    │ ← Fullscreen
│   (Live Feed)       │
│                     │
├─────────────────────┤
│  [📷] [🔄] [⚡]   │ ← Controls (Shutter, Flip, Flash)
└─────────────────────┘
```

**Gestures:**
- Tap → Capture Photo
- Swipe Left → Review Gallery
- Swipe Right → Settings
- Pinch → Zoom (wenn verfügbar)

### 10.2 Color Scheme (aus Figma übernehmen)

**Dark Mode (Standard für Kamera):**
- Background: `#000000`
- Controls: `#FFFFFF` mit 20% Opacity
- Accent: Brand Color (aus design_guidelines.md)

---

## 11. Security & Privacy

### 11.1 Camera Permissions

**User Consent:**
- Clear permission request
- Explanation why needed
- Fallback auf File-Upload

### 11.2 Data Handling

**Privacy:**
- Fotos nur zu R2 (verschlüsselt)
- Keine lokale Speicherung nach Upload
- EXIF-Daten optional strip

---

## 12. Next Steps

### Immediate Actions:

1. **Review Figma Make Code:**
   - Analyse der Components
   - Extraktion von Assets
   - Anpassungsbedarf identifizieren

2. **Create Route Structure:**
   - `/capture` Routes anlegen
   - Routing in `App.tsx` konfigurieren

3. **Implement Camera Hook:**
   - `useCamera.ts` erstellen
   - Browser-Kompatibilität testen

4. **PWA Setup:**
   - `manifest.json` erstellen
   - Service Worker skeleton

### Benötigt noch:

- [ ] Icons für PWA (192x192, 512x512)
- [ ] Shoot-Code Generator UI-Design
- [ ] Error-Handling Strategie
- [ ] Testing-Plan für mobile Geräte

---

**Status:** 📋 Architecture Planning Complete  
**Bereit für:** Implementation Phase 1
