# pix.immo System Check Framework

## Überblick

Das System-Check Framework validiert automatisch kritische Systemkomponenten von pix.immo und generiert detaillierte Reports über den Gesundheitszustand der Anwendung.

## Features

- ✅ **Authentication Check**: JWT/Session Secrets, Scrypt Hashing, Rate Limiting
- ✅ **API Routes Check**: Kritische Endpunkte, Auth-Routes, QA-Autofix, Upload-Endpoints
- ✅ **Upload System Check**: Cloudflare R2 Config, RAW-Format-Support (30+ Formate), Naming v3.1
- ✅ **Naming Policy Check**: Room Taxonomy (30+ Typen), v3.1 Pattern, Synonyme (100+)

## Verwendung

### Grundlegender Check

```bash
tsx server/selftest/cli.ts
```

### Mit Auto-Fix (zukünftig)

```bash
tsx server/selftest/cli.ts --auto-fix
```

### Verschiedene Report-Formate

```bash
# JSON Report (Standard)
tsx server/selftest/cli.ts --format=json

# Markdown Report
tsx server/selftest/cli.ts --format=markdown
```

### Verbose Output

```bash
tsx server/selftest/cli.ts --verbose
```

## Exit Codes

- `0`: Alle Checks erfolgreich
- `1`: Einige Checks fehlgeschlagen (P1/P2)
- `2`: Kritische Failures (P0)
- `3`: Fataler Fehler während der Ausführung

## Report-Struktur

Reports werden gespeichert in: `server/selftest/reports/`

### JSON Report

```json
{
  "timestamp": "2025-10-23T06:46:14.796Z",
  "environment": "development",
  "totalChecks": 15,
  "passed": 14,
  "failed": 0,
  "warnings": 1,
  "summary": {
    "p0Failures": 0,
    "p1Failures": 0,
    "p2Failures": 0
  },
  "results": [...]
}
```

### Markdown Report

Human-readable Report mit:
- Summary-Tabelle
- Severity Breakdown
- Detaillierte Failed Checks
- Warnings
- Auto-Fix Status

## Plugin-System

### Verfügbare Plugins

1. **AuthCheckPlugin** (`auth-check.ts`)
   - JWT_SECRET Validierung
   - SESSION_SECRET Validierung
   - Scrypt Password Hashing Test
   - Rate Limiting Configuration

2. **RoutesCheckPlugin** (`routes-check.ts`)
   - Critical API Endpoints
   - Authentication Endpoints
   - QA-Autofix Endpoints
   - Upload Endpoints

3. **UploadCheckPlugin** (`upload-check.ts`)
   - Cloudflare R2 Configuration
   - RAW Format Support (30+ Formate)
   - File Naming Utilities v3.1
   - Upload Size Limits

4. **NamingCheckPlugin** (`naming-check.ts`)
   - Room Type Taxonomy (30+ Typen)
   - Naming Pattern v3.1
   - Room Type Synonyms (100+)

### Eigenes Plugin erstellen

```typescript
import type { CheckPlugin, CheckResult } from "../types";

export class MyCustomPlugin implements CheckPlugin {
  id = "my-plugin";
  name = "My Custom Check";
  description = "Describes what this plugin checks";
  enabled = true;

  async run(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    
    // Add your checks here
    results.push({
      id: "my-check-1",
      name: "My First Check",
      status: "pass",
      severity: "INFO",
      message: "Check passed successfully",
      timestamp: new Date().toISOString(),
    });

    return results;
  }
}
```

Dann registrieren in `cli.ts`:

```typescript
import { MyCustomPlugin } from "./plugins/my-custom-plugin";

runner.registerPlugin(new MyCustomPlugin());
```

## Check Severities

- **P0 (Critical)**: Blockiert Produktion, muss sofort behoben werden
- **P1 (High)**: Wichtiges Problem, sollte bald behoben werden
- **P2 (Medium)**: Kleineres Problem, kann später behoben werden
- **INFO**: Informativ, kein Action Required

## Auto-Fix System (Zukünftig)

Das Framework unterstützt automatische Reparaturen für bestimmte Probleme:

- ✅ Check erkennt Problem
- 🔧 Auto-Fix verfügbar
- ⚡ Auto-Fix angewendet (mit `--auto-fix` Flag)
- ✅ Re-Check bestätigt Behebung

## CI/CD Integration

### GitHub Actions (Zukünftig)

```yaml
name: System Health Check

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 09:00 CET
  push:
    branches: [main, develop]

jobs:
  selftest:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: tsx server/selftest/cli.ts
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: selftest-report
          path: server/selftest/reports/
```

## Entwicklung

### Tests hinzufügen

1. Öffne das entsprechende Plugin in `server/selftest/plugins/`
2. Füge neue Check-Methode hinzu
3. Registriere den Check in der `run()`-Methode
4. Teste lokal: `tsx server/selftest/cli.ts`

### Debugging

```bash
# Verbose Output
tsx server/selftest/cli.ts --verbose

# Inspect specific report
cat server/selftest/reports/selftest-*.md
```

## Roadmap

- [ ] Database Schema Check Plugin
- [ ] Performance Benchmarks Plugin
- [ ] Security Audit Plugin
- [ ] Auto-Fix Logic für P0/P1 Issues
- [ ] Slack/Discord Notifications
- [ ] GitHub Actions Integration
- [ ] Pre-commit Hook
