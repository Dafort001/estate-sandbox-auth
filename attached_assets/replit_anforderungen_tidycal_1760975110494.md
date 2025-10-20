# Replit-Anforderungen – Buchungsseite, Orders-API & Tidycal-Webhook (pix.immo)

Diese Datei beschreibt die Umsetzung in Replit, damit die Preislisten-/Buchungsseite Bestellungen annimmt, die Summe berechnet und die Daten an Tidycal (bzw. deine Tidycal-Automation) übergibt, die dann eine SMS-Bestätigung versendet. Alle Beispiele sind minimal gehalten und können 1:1 übernommen und erweitert werden.

---

## 1) Ziel / Scope
- **Frontend**: Formular mit Checkboxen/Mengenfeldern für Leistungen, Live-Endsumme (Netto, MwSt. 19 %, Brutto), Kontaktblock (Name/E-Mail optional, **Mobilnummer erforderlich**), Objektadresse optional, AGB-Checkbox.
- **Backend**: `POST /api/orders` (Hono/TypeScript) mit serverseitiger Re-Kalkulation und **Forward** der Order an **Tidycal Webhook** (damit von dort die SMS bestätigt wird).
- **Datenquelle**: `/data/preise_piximmo_internal.json` (alle Positionen mit Preis/Einheit/Kategorie).
- **Währung/Satz**: **EUR**, **19 % MwSt.**

---

## 2) Dateien & Pfade
- Frontend: `/public/orders.html`  
- Server-Route: `/server/routes/orders.ts`  
- Preisliste (JSON): `/data/preise_piximmo_internal.json`  
- (optional) Diese Anleitung: `/docs/replit_anforderungen_tidycal.md`

Statische Auslieferung der `/public`-Dateien sowie Routing über Hono wird im Projekt-Setup konfiguriert.

---

## 3) Environment-Variablen (Replit Secrets)
```
TIDYCAL_WEBHOOK_URL=https://<dein-tidycal-automation-endpunkt>
TIDYCAL_API_KEY=<optional, falls dein Endpoint/Bearer nötig ist>
```
> `TIDYCAL_WEBHOOK_URL` ist die URL, an die der Server nach dem Order-POST das JSON schickt. Dort löst deine Automationskette die **SMS an die Mobilnummer** aus.

---

## 4) Frontend – /public/orders.html (Kurzüberblick)
- Leistungen werden aus `/data/preise_piximmo_internal.json` geladen und gruppiert (Fotografie, Drohne, …).
- Einheiten: `flat` (Checkbox), `per_item` (Anzahl-Eingabe), `per_km` (Kilometer, nur bei Region „EXT“, **Hin- und Rückweg** wird serverseitig mit 2× berücksichtigt).
- Region-Logik:
  - **Hamburg (≤30 km)**: Anfahrt inkl., `AEX` ausgeblendet
  - **Berlin (S-Bahn-Ring)**: Anfahrt inkl., `AEX` ausgeblendet
  - **Erweiterte Anfahrt (EXT)**: `AEX` aktiv + Kilometerfeld
- Pflicht: AGB-Checkbox, Mobilnummer. Adresse **optional** (für Fälle ohne Google-Listing).
- Beim Absenden: `POST /api/orders` mit Payload (siehe unten). Popup-Hinweis und Info, dass eine SMS folgt.

**Payload-Beispiel (vom Browser an den Server):**
```json
{
  "region": "HH|B|EXT",
  "address": "Musterstraße 1, 20095 Hamburg",
  "contact": { "name": "Max Mustermann", "email": "max@acme.de", "phone": "+49 170 1234567" },
  "items": [
    { "code": "F20", "unit": "flat", "qty": 1, "price": 240 },
    { "code": "FEX", "unit": "per_item", "qty": 3, "price": 9 },
    { "code": "AEX", "unit": "per_km", "qty": 42, "price": 0.8 }
  ],
  "totals": { "net": 0, "vat_rate": 0.19, "vat_amount": 0, "gross": 0, "currency": "EUR" }
}
```

---

## 5) Backend – /server/routes/orders.ts (Kurzüberblick)
- **Validierung**: `region`, `items` und `contact.phone` müssen vorhanden sein. Codes/Einheiten werden gegen die Preisliste gematcht.
- **Re-Kalkulation** (Server **vertraut** nicht den Clientpreisen):
  - `flat` → Preis einmal
  - `per_item` → Preis × Menge
  - `per_km` → **nur bei `region=EXT`** und dann × Kilometer × **2** (Hin- und Rückweg)
- **Totals**: Netto, MwSt. 19 %, Brutto (EUR)
- **Order-ID**: z. B. `ORD-AB12CD` (random). Persistenz ist vorbereitet (TODO).
- **Forward an Tidycal** (Webhook/Automation):
  - URL: `TIDYCAL_WEBHOOK_URL` (aus Env)
  - Header: `Content-Type: application/json`, optional `Authorization: Bearer ${TIDYCAL_API_KEY}`
  - **Payload** (für Tidycal-Automation inkl. SMS-Versand):
    ```json
    {
      "source": "pix.immo",
      "event": "order.created",
      "order_id": "ORD-AB12CD",
      "region": "HH|B|EXT",
      "address": "Musterstraße 1, 20095 Hamburg",
      "contact": { "name": "Max", "email": "max@acme.de", "phone": "+49 170 1234567" },
      "items": [ { "code": "F20", "unit": "flat", "qty": 1 }, { "code": "FEX", "unit": "per_item", "qty": 3 } ],
      "totals": { "net": 240, "vat_rate": 0.19, "vat_amount": 45.6, "gross": 285.6, "currency": "EUR" }
    }
    ```
  - **Erwartung**: Deine Tidycal-Automation triggert die **SMS** (z. B. über integrierten SMS-Dienst oder Zapier/Make/MessageBird/Twilio), nutzt `contact.phone`, kann `order_id` in die Nachricht übernehmen und optional einen Tidycal-Link mitsenden.

---

## 6) JSON-Daten – /data/preise_piximmo_internal.json
- Enthält alle Leistungen mit `code`, `category`, `title`, `price_net`, `unit` (`flat`/`per_item`/`per_km`/`range`/`from`), `notes`.
- Spezialfälle:
  - `FEX` → `per_item`
  - `AEX` → `per_km` (nur Region `EXT` aktiv)
  - `SBR/SFX` → `range`/`from` (auf Anfrage, nicht in Kalkulation)

---

## 7) Sicherheit & Datenschutz
- **Serverseitige Re-Kalkulation** (kein Blindvertrauen in Client).
- **AGB/DSGVO-Checkbox** im Frontend Pflicht.
- Webhook-URL geheim halten (Env). Optional: Signaturprüfung im Automations-Endpoint.
- Keine personenbezogenen Daten in URL-Querystrings (außer `order_id`, falls nötig).

---

## 8) QA-Checkliste
- [ ] Live-Endsumme korrekt (Netto/MwSt./Brutto, EUR, 19 %).
- [ ] Region-Logik: `AEX` nur bei „EXT“ berechnet; Hin- und Rückweg = ×2.
- [ ] Pflichtfelder: Mobilnummer + AGB-Checkbox.
- [ ] `POST /api/orders` liefert `order_id` und korrekte Totals zurück (Server).
- [ ] **Forward** an `TIDYCAL_WEBHOOK_URL` kommt an; SMS aus der Automation wird versendet.
- [ ] Adresse wird im Payload übertragen und in der SMS/Bestätigung genutzt (falls gewünscht).

---

## 9) Nächste Schritte (optional)
- Persistenz via Drizzle: Tabellen `orders`, `order_items`, `bookings`.
- E-Mail-Bestätigung zusätzlich zur SMS (Mailgun/Resend).
- Admin-Ansicht für Aufträge/Termine.

---

## 10) Snippets (optional)

### 10.1. Hono Bootstrap
```ts
// server/index.ts
import { Hono } from 'hono'
import orders from './routes/orders'

const app = new Hono()
app.route('/', orders)

export default app
```

### 10.2. Static Files (Beispiel Express-ähnlich; bei Hono entsprechend Middleware nutzen)
```ts
// pseudo: serve /public und /data
```

---

**Hinweis:** Diese Anforderungen sind auf **Replit** ausgelegt, funktionieren aber genauso in beliebigen Node/Hono-Deployments (Cloudflare Workers, Vercel, etc.).
