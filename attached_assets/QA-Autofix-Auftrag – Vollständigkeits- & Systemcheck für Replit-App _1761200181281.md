# QA-Autofix-Auftrag – Vollständigkeits- & Systemcheck für Replit-App (pix.immo)

## 1. Ziel
Ein kontinuierlicher, autonomer Selbsttest der gesamten Anwendung:
- prüft **Vollständigkeit, Funktionsfähigkeit, Naming-Konsistenz und Datenfluss**,
- erkennt Abweichungen oder Fehler automatisch,
- **repariert sie selbstständig** (Dev/Staging sofort, Prod via Auto-PR),
- dokumentiert jede Änderung nachvollziehbar.

## 2. Rahmen
**Umgebung:** Dev / Staging / Prod  
**Rollen:** public · customer · admin · editor  
**Zeitzone:** Europe/Berlin  
**Mandant:** `TEST_*` (für saubere Testläufe)  
**Berichtsordner:** `/selftest/reports/`  
**Täglicher Lauf:** 09:00 CET + on-commit

---

## 3. Naming-Policy v3.1
`{date}-{shootcode}_{room_type}_{index}_v{ver}.jpg`  
Beispiel: `2025-10-23-abc12_wohnzimmer_01_v1.jpg`  
- **Fallback:** `undefined_space`  
- **Quiet-Window:** automatische Caption-Verarbeitung pro Shoot  
- **Prüfung:** 100 % aller Dateien entsprechen dieser Struktur

---

## 4. Raum-Taxonomie
### Innenräume
wohnzimmer · schlafzimmer · kinderzimmer · gästezimmer · esszimmer · küche · bad · duschbad · gäste_wc · wc_separat · arbeitszimmer · ankleide · flur · diele · treppenhaus · hobbyraum · hauswirtschaftsraum · abstellraum · keller · dachboden  
### Außen & Umfeld
balkon · terrasse · garten · außenansicht · eingangsbereich · stellplatz · garage · carport · umgebung · aussicht  
### Dokumente & Sonstiges
grundriss · lageplan · technikraum · undefined_space  

**Replit erstellt:**
- `/api/roomtypes` → Liste + Synonym-Mapping  
- `/docs/rooms-spec` → Leseseite + Download (.txt / .json)  
- Validierung aller Uploads gegen diese Liste

---

## 5. Galerie-Klassifizierung
Neue Seite: **`/gallery/classify/{shoot_id}`**
- Grid-Ansicht aller Bilder  
- Shortcuts (1 = Wohnzimmer … 0 = undefined)  
- Bulk-Assign, Auto-Vorschlag (z. B. „Küche (82 %)“)  
- Speichern → Rename nach v3.1 oder Mapping  
- Fortschritts- und Fehleranzeige  
- Export .json + .txt für CRM  
- Pflicht: kein Verlassen ohne Klassifizierung / Fallback

---

## 6. System- & Vollständigkeits-Check
Umfasst:
- Auth & Rollenrechte (Login / Token / Menü-Leaks)
- Sitemap / API-Erreichbarkeit (200/302/403/404)
- Buchung & SLA (shoot_id, shoot_code, 36 h, TZ Berlin)
- Uploads (HEIC / ProRAW, Resumable, Downscale 3000 px sRGB Q85)
- Stack & Naming (g001… / v3.1 / Raumtyp)
- Editor-Bundle / Rücklauf (Manifest, URL, Reso)
- Captioning (Modal / CogVLM → .txt + .json)
- Galerie-Auslieferung (signierte Links, noindex)
- Recht & CORS / CSRF / Cookie-Banners
- Performance (GET < 800 ms · Uploads < 60 s)
- Infra / R2 (HEAD 200 · ETag · Lifecycle-Tagging)

**Berichte:**  
- `reports/system_summary.md` (Ampel + Top-Blocker)  
- `reports/findings.json` (Detail)  
- `reports/gaps.csv` (Fehlende/Falsche Routen)  
- `reports/autofix_log.md` (Änderungsverlauf)

---

## 7. Auto-Repair-Regeln
### P0 – Sofort beheben (Dev/Staging)
- 500 auf Kernrouten (/login / admin / upload / booking)  
- Admin-Menü öffentlich sichtbar  
- Fehlende `/api/roomtypes`, `/docs/rooms-spec`, `/gallery/classify`  
→ automatisch erzeugen mit Basisinhalt  

### P1 – Hoch, automatisch korrigieren
- 404 auf Menü-Routen → Seite scaffolden oder Link reparieren  
- Falsche Rollenrechte / Guards / Redirects  
- Naming-Abweichung → Rename oder Mapping-Migration  

### P2 – Mittel, auto-fix wenn trivial
- Leere-Zustände / Hinweistexte  
- CORS-Whitelist ergänzen (iOS/Web)

**Dev/Staging:** Auto-commit & merge  
**Prod:** Auto-PR (Label `autofix`) → Auto-Review → merge bei grünen Checks  
**Rollback:** Letzter Build bleibt verfügbar

---

## 8. Akzeptanzkriterien
- `/api/roomtypes` + `/docs/rooms-spec` verfügbar  
- `/gallery/classify/{shoot_id}` funktioniert vollständig  
- 100 % Naming v3.1 konform / validiert  
- Keine P0/P1 Fehler offen nach Lauf  
- Reports vollständig und CI integriert  
- Quiet-Window / Caption-Trigger arbeitet regelkonform

---

## 9. Laufzyklus
1. Täglicher CI-Run 09:00 CET + bei jedem Commit  
2. Ergebnisse → `/selftest/reports/`  
3. Auto-Fix → Commit / PR / Merge  
4. Zusammenfassung → Slack / E-Mail optional  
5. Wöchentlicher Health-Snapshot in `/docs/system-health.md`

---

**Status:**  
> Auftrag erteilt — Autonomer Self-Check & Repair aktivieren  
> Erstlauf heute nach Einrichtung, anschließend täglich  
> Verantwortlich: Replit-Runner / pix.immo Dev-Bot
