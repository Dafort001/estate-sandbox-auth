# pix.immo – Replit Full Specification (Backend, Portal & iPhone App)

> ⚠️ **Projektregel:**  
> Der Implementierungsprozess in Replit beginnt **erst**, wenn das finale Design aus **Figma** über den **MCP-Server** geliefert, geprüft und freigegeben wurde.  
> Bis dahin werden ausschließlich Architektur, API-Schnittstellen, Datenmodelle und Safe-Check-Strukturen vorbereitet.

> ✅ **Safe-Check (CI-Gate) in Replit):**  
> Jeder Commit oder Merge läuft automatisch durch:  
> - API-Schema-Validierung (OpenAPI)  
> - Type- & Lint-Checks  
> - Unit- und Integration-Tests (Mock-R2, Mock-Stripe, Mock-Mailgun)  
> - Datenbank-Migrations-Dry-Run  
> - E2E-Smoke-Flow: Upload → Selection → Payment → Editing → AI → Delivery  

---

## 1. Systemübersicht

### Struktur

| Komponente | Aufgabe | Technologie |
|-------------|----------|-------------|
| iPhone App | Aufnahme & Upload | Swift / AVFoundation |
| Cloudflare Worker API | Upload, Auth, Routing | Hono / TypeScript |
| Replit Frontend | Kundenportal (Galerie, Zahlung, Status) | React / Next / Tailwind |
| R2 Storage | RAW / Edited / Staging Buckets | Cloudflare R2 |
| Modal/Runpod | AI Captioning / OCR | CogVLM / Gemini |
| Stripe | Payment / Rechnungen | Stripe API |
| Mailgun | Benachrichtigungen | Mailgun API |
| DB | Users, Shoots, Orders, Invoices | D1 / Neon PostgreSQL |

**Workflow:**  
App → Worker → R2 → Portal → Payment → Editing → AI → Delivery

---

## 2. Datenmodell

### Tabellen

**users**
| Feld | Typ | Beschreibung |
|------|-----|---------------|
| id | uuid | Eindeutige ID |
| email | string | Login / Kontakt |
| org | string | Organisation / Maklerbüro |
| invoice_allowed | bool | Zahlungsart |
| stripe_customer_id | string | Referenz zu Stripe |
| created_at | timestamp |  |

**shoots**
| id | uuid |  |
| user_id | uuid |  |
| shoot_code | string(5) | Kurzcode |
