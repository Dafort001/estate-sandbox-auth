# Safe-Check Framework – Architecture & Extension Plan

> **Status:** Architecture Planning Phase  
> **Last Updated:** 2025-10-23  
> **Version:** 2.0.0 (CI/CD Extension)

## 1. Current State Analysis

### ✅ Existing Infrastructure (v1.0.0)

**System-Check Framework:**
- Plugin-based architecture with `CheckPlugin` interface
- 4 operational plugins: Auth, Routes, Upload, Naming
- Report generation: JSON + Markdown
- Severity-based exit codes (0/1/2/3)
- CLI interface: `tsx server/selftest/cli.ts`
- 15 validation checks total

**Plugin Structure:**
```typescript
interface CheckPlugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  run(): Promise<CheckResult[]>;
}

interface CheckResult {
  id: string;
  name: string;
  status: "pass" | "fail" | "warning" | "skip";
  severity: "P0" | "P1" | "P2" | "INFO";
  message: string;
  details?: string;
  autoFixAvailable?: boolean;
  autoFixApplied?: boolean;
  timestamp: string;
}
```

**Proven Capabilities:**
- ✅ Real route validation (detected missing `/api/users/me`, upload endpoints)
- ✅ R2 config validation
- ✅ Naming Policy v3.1 enforcement
- ✅ Room taxonomy validation (34 types)

### 🎯 Target State (v2.0.0 – CI/CD Gate)

**New Requirements from Spec:**
1. **OpenAPI Schema Validation** – API contract verification
2. **TypeScript & Lint Checks** – Static analysis (tsc, ESLint)
3. **Mock Services** – R2, Stripe, Mailgun test doubles
4. **Database Migration Dry-Run** – Drizzle schema validation
5. **E2E Smoke Flow** – Full workflow testing (Upload → Payment → AI → Delivery)
6. **CI/CD Integration** – GitHub Actions, pre-commit hooks

---

## 2. Plugin Architecture Extensions

### 2.1 OpenAPI Validation Plugin

**Purpose:** Validate Hono routes against OpenAPI 3.1 spec

**Implementation Strategy:**
```typescript
// server/selftest/plugins/openapi-check.ts
export class OpenAPICheckPlugin implements CheckPlugin {
  id = "openapi-validation";
  name = "OpenAPI Schema Validation";
  
  async run(): Promise<CheckResult[]> {
    // 1. Parse OpenAPI spec (server/openapi.yaml or generated)
    // 2. Extract Hono routes from server/index.ts
    // 3. Compare route definitions
    // 4. Validate request/response schemas
    // 5. Check security definitions (JWT/Session)
    
    return [
      await this.checkSpecExists(),
      await this.checkRoutesCoverage(),
      await this.checkSchemaTypes(),
      await this.checkSecuritySchemes(),
    ];
  }
}
```

**Dependencies:**
- `openapi-types` – Type definitions
- `@apidevtools/swagger-parser` – Spec parser
- Custom Hono route extractor (similar to existing routes-check.ts)

**Checks:**
- [ ] OpenAPI spec file exists and is valid
- [ ] All critical routes documented
- [ ] Request schemas match Zod definitions
- [ ] Response schemas consistent
- [ ] Security schemes defined (JWT/Session)

### 2.2 TypeScript & Lint Check Plugin

**Purpose:** Static code analysis without runtime execution

**Implementation Strategy:**
```typescript
// server/selftest/plugins/static-analysis-check.ts
export class StaticAnalysisCheckPlugin implements CheckPlugin {
  id = "static-analysis";
  name = "TypeScript & Lint Check";
  
  async run(): Promise<CheckResult[]> {
    // 1. Run tsc --noEmit --pretty false
    // 2. Parse TypeScript errors
    // 3. Run ESLint programmatically (if configured)
    // 4. Check shared/schema.ts consistency
    
    return [
      await this.checkTypeScript(),
      await this.checkESLint(),
      await this.checkSchemaConsistency(),
    ];
  }
  
  private async checkTypeScript(): Promise<CheckResult> {
    const { execSync } = await import("child_process");
    try {
      execSync("npx tsc --noEmit --pretty false", { 
        cwd: process.cwd(),
        stdio: "pipe" 
      });
      return { status: "pass", ... };
    } catch (error) {
      // Parse tsc output, count errors
      return { status: "fail", severity: "P1", ... };
    }
  }
}
```

**Checks:**
- [ ] Zero TypeScript compilation errors
- [ ] ESLint passes (if configured)
- [ ] shared/schema.ts exports all table types
- [ ] No `any` types in critical paths (optional strict mode)

### 2.3 Mock Services Plugin

**Purpose:** Unit/Integration tests with service test doubles

**Implementation Strategy:**
```typescript
// server/selftest/plugins/integration-test-check.ts
export class IntegrationTestCheckPlugin implements CheckPlugin {
  id = "integration-tests";
  name = "Mock Services Integration Tests";
  
  private mockR2: MockR2Service;
  private mockStripe: MockStripeService;
  private mockMailgun: MockMailgunService;
  
  async run(): Promise<CheckResult[]> {
    // 1. Initialize mock services
    // 2. Run integration tests
    // 3. Verify API calls without hitting real services
    
    return [
      await this.testR2Upload(),
      await this.testStripePayment(),
      await this.testMailgunEmail(),
    ];
  }
}
```

**Mock Service Implementations:**

**MockR2Service:**
```typescript
// server/selftest/mocks/mock-r2.ts
export class MockR2Service {
  private files = new Map<string, Buffer>();
  
  async put(key: string, value: Buffer): Promise<void> {
    this.files.set(key, value);
  }
  
  async get(key: string): Promise<Buffer | null> {
    return this.files.get(key) || null;
  }
  
  // Track calls for verification
  public callLog: Array<{ method: string; key: string }> = [];
}
```

**MockStripeService:**
```typescript
// server/selftest/mocks/mock-stripe.ts
export class MockStripeService {
  async createPaymentIntent(amount: number): Promise<{ id: string }> {
    return { id: `pi_mock_${Date.now()}` };
  }
  
  async retrievePaymentIntent(id: string): Promise<{ status: string }> {
    return { status: "succeeded" };
  }
}
```

**Checks:**
- [ ] Mock R2 upload/download works
- [ ] Mock Stripe payment flow complete
- [ ] Mock Mailgun email sending tracked
- [ ] All API calls verified (no real service hits)

### 2.4 Database Migration Dry-Run Plugin

**Purpose:** Validate Drizzle schema changes without applying

**Implementation Strategy:**
```typescript
// server/selftest/plugins/migration-check.ts
export class MigrationCheckPlugin implements CheckPlugin {
  id = "migration-validation";
  name = "Database Migration Dry-Run";
  
  async run(): Promise<CheckResult[]> {
    // 1. Run drizzle-kit generate (dry-run)
    // 2. Detect breaking changes
    // 3. Validate constraints
    // 4. Check for data loss warnings
    
    return [
      await this.checkSchemaSyntax(),
      await this.checkBreakingChanges(),
      await this.checkConstraints(),
    ];
  }
  
  private async checkBreakingChanges(): Promise<CheckResult> {
    const { execSync } = await import("child_process");
    try {
      // Simulate: npm run db:push -- --dry-run
      const output = execSync("npx drizzle-kit push --dry-run", {
        stdio: "pipe",
        encoding: "utf-8"
      });
      
      // Parse output for warnings
      if (output.includes("⚠️") || output.includes("data loss")) {
        return { 
          status: "warning", 
          severity: "P1",
          message: "Migration contains potential breaking changes",
          details: output
        };
      }
      return { status: "pass", ... };
    } catch (error) {
      return { status: "fail", severity: "P0", ... };
    }
  }
}
```

**Checks:**
- [ ] shared/schema.ts syntax valid
- [ ] No breaking schema changes detected
- [ ] Foreign key constraints consistent
- [ ] Index definitions optimized
- [ ] No data loss warnings

### 2.5 E2E Smoke Flow Plugin

**Purpose:** End-to-end workflow validation with Playwright

**Implementation Strategy:**
```typescript
// server/selftest/plugins/e2e-smoke-check.ts
export class E2ESmokeCheckPlugin implements CheckPlugin {
  id = "e2e-smoke";
  name = "E2E Smoke Flow Test";
  
  async run(): Promise<CheckResult[]> {
    // 1. Launch Playwright browser
    // 2. Execute complete workflow
    // 3. Use mock services
    // 4. Capture screenshots on failure
    
    return [
      await this.testUploadFlow(),
      await this.testSelectionFlow(),
      await this.testPaymentFlow(),
      await this.testEditingFlow(),
      await this.testAIProcessing(),
      await this.testDelivery(),
    ];
  }
}
```

**Smoke Flow Scenario:**
```
1. Upload Flow:
   - Login as test user
   - Navigate to /upload
   - Select RAW files (use test fixtures)
   - Verify upload progress
   - Check R2 storage (via mock)

2. Selection Flow:
   - View uploaded images in gallery
   - Select images for processing
   - Verify selection state persists

3. Payment Flow:
   - Proceed to checkout
   - Use Stripe test card (mock)
   - Verify payment confirmation

4. Editing Flow:
   - Access editor interface
   - Apply basic edits
   - Verify changes saved

5. AI Processing:
   - Trigger AI captioning
   - Mock AI service response
   - Verify captions applied

6. Delivery:
   - Generate ZIP package
   - Download handoff
   - Verify file integrity
```

**Infrastructure Requirements:**
```json
// package.json additions
{
  "devDependencies": {
    "@playwright/test": "^1.40.0",
    "playwright": "^1.40.0"
  }
}
```

**Checks:**
- [ ] Complete workflow executes without errors
- [ ] All pages render correctly
- [ ] Mock services respond appropriately
- [ ] Data persists across steps
- [ ] Final deliverable generated

---

## 3. CI/CD Integration Architecture

### 3.1 GitHub Actions Workflow

**File:** `.github/workflows/safe-check.yml`

```yaml
name: Safe-Check CI Gate

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    # Daily at 09:00 CET
    - cron: '0 7 * * *'

jobs:
  safe-check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js 22
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Safe-Check Framework
        id: safe_check
        run: |
          tsx server/selftest/cli.ts --format=json --verbose > report.json
          echo "EXIT_CODE=$?" >> $GITHUB_OUTPUT
        continue-on-error: true
      
      - name: Upload Reports
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: safe-check-report
          path: |
            server/selftest/reports/*.json
            server/selftest/reports/*.md
      
      - name: Comment PR with Results
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('report.json', 'utf8'));
            const summary = `
            ## 🔍 Safe-Check Results
            
            - ✅ Passed: ${report.passed}
            - ❌ Failed: ${report.failed}
            - ⚠️  Warnings: ${report.warnings}
            - 🚨 P0 Failures: ${report.summary.p0Failures}
            
            [Full Report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})
            `;
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
      
      - name: Gate Deployment
        if: steps.safe_check.outputs.EXIT_CODE == '2'
        run: |
          echo "❌ CRITICAL FAILURES DETECTED - Blocking deployment"
          exit 1
```

### 3.2 Pre-Commit Hooks (Husky + lint-staged)

**Setup:**
```bash
npm install --save-dev husky lint-staged
npx husky init
```

**File:** `.husky/pre-commit`
```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run quick checks (skip E2E)
tsx server/selftest/cli.ts --skip-plugin=e2e-smoke
```

**File:** `.lintstagedrc.json`
```json
{
  "*.ts": [
    "eslint --fix",
    "prettier --write"
  ],
  "shared/schema.ts": [
    "tsx server/selftest/cli.ts --plugin=naming-check --plugin=migration-check"
  ]
}
```

### 3.3 Deployment Gate Configuration

**Cloudflare Workers Deploy:**
```yaml
# .github/workflows/deploy-workers.yml
jobs:
  deploy:
    needs: safe-check
    if: success()
    steps:
      - name: Deploy to Cloudflare Workers
        run: npx wrangler deploy
```

**Exit Code Strategy:**
- `0` → Deploy allowed
- `1` → Deploy with warnings (manual approval)
- `2` → Deploy blocked (P0 failures)
- `3` → Fatal error (block + alert)

---

## 4. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Install test dependencies (Playwright, OpenAPI tools)
- [ ] Create mock service implementations
- [ ] Set up plugin skeletons (no logic yet)
- [ ] Document plugin interfaces

### Phase 2: Core Plugins (Week 2)
- [ ] Implement OpenAPI validation plugin
- [ ] Implement Static Analysis plugin
- [ ] Implement Migration Check plugin
- [ ] Integration tests for each plugin

### Phase 3: Advanced Testing (Week 3)
- [ ] Implement Mock Services plugin
- [ ] Implement E2E Smoke Flow plugin
- [ ] Create test fixtures and scenarios
- [ ] Screenshot capture on failures

### Phase 4: CI/CD Integration (Week 4)
- [ ] GitHub Actions workflow
- [ ] Husky pre-commit hooks
- [ ] PR comment automation
- [ ] Deployment gate logic

### Phase 5: Documentation & Training (Week 5)
- [ ] Update README with new plugins
- [ ] Create troubleshooting guide
- [ ] Record demo videos
- [ ] Team training session

---

## 5. Technical Decisions & Rationale

### 5.1 Why Plugin Architecture?

**Advantages:**
- ✅ Modular: Add/remove checks independently
- ✅ Testable: Each plugin can be unit-tested
- ✅ Maintainable: Clear separation of concerns
- ✅ Extensible: Community can contribute plugins

**Proven Success:**
Current framework already demonstrates value by detecting real issues (missing endpoints).

### 5.2 Why Mock Services?

**Rationale:**
- ✅ Faster tests (no network calls)
- ✅ Deterministic results (no flakiness)
- ✅ Cost-effective (no Stripe test charges)
- ✅ Safe (no accidental production emails)

**Trade-off:**
Mocks may not catch API version changes. Mitigation: Monthly integration tests against real staging services.

### 5.3 Why E2E Smoke vs Full E2E Suite?

**Decision:** Smoke tests only in CI gate

**Rationale:**
- **Smoke:** 6 critical paths, runs in <3 minutes
- **Full Suite:** Would include edge cases, take >15 minutes
- **Strategy:** Smoke in CI, full suite nightly

### 5.4 Why OpenAPI First?

**Decision:** Require OpenAPI spec before API changes

**Rationale:**
- ✅ API-first design encourages planning
- ✅ Auto-generates client SDKs (iOS app)
- ✅ Validates contracts before implementation
- ✅ Documentation stays in sync

---

## 6. Success Metrics

### Pre-Launch (Architecture Phase)
- [x] Architecture document complete
- [ ] All plugin interfaces defined
- [ ] Mock service contracts documented
- [ ] CI/CD workflow drafted

### Post-Implementation
- [ ] 100% critical routes covered by OpenAPI
- [ ] Zero TypeScript errors in CI
- [ ] E2E smoke flow <3min execution time
- [ ] <5% flaky test rate
- [ ] 90% test coverage for plugins

### Operational
- [ ] CI checks run on every commit
- [ ] P0 failures block deploys
- [ ] Daily scheduled runs at 09:00 CET
- [ ] Report retention: 90 days

---

## 7. Risk Assessment

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| E2E tests too slow | High | Medium | Parallelize, use snapshots |
| Mock services drift | Medium | High | Monthly real service validation |
| False positives | Medium | Medium | Severity tuning, skip flags |
| OpenAPI maintenance overhead | Low | Medium | Auto-generate from code |
| CI quota limits | High | Low | Self-hosted runners for E2E |

---

## 8. Appendix

### 8.1 Plugin Template

```typescript
// server/selftest/plugins/template-check.ts
import type { CheckPlugin, CheckResult } from "../types";

export class TemplateCheckPlugin implements CheckPlugin {
  id = "template-check";
  name = "Template Check Description";
  description = "What this plugin validates";
  enabled = true;

  async run(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];
    
    results.push(await this.checkExample());
    
    return results;
  }

  private async checkExample(): Promise<CheckResult> {
    try {
      // Validation logic here
      
      return {
        id: `${this.id}-example`,
        name: "Example Check",
        status: "pass",
        severity: "P1",
        message: "Check passed successfully",
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        id: `${this.id}-example`,
        name: "Example Check",
        status: "fail",
        severity: "P0",
        message: "Check failed",
        details: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}
```

### 8.2 Integration Points

**Existing Systems:**
- `server/index.ts` – Hono routes (validate via OpenAPI)
- `shared/schema.ts` – Drizzle models (validate via migration check)
- `server/objectStorage.ts` – R2 integration (mock for tests)
- `client/src/pages/*` – React pages (E2E smoke flow)

**Future Integrations:**
- iOS App API contract (OpenAPI)
- AI service endpoints (mock for smoke tests)
- Mailgun templates (validate via mock)

---

**Document Status:** ✅ Architecture Planning Complete  
**Next Action:** Review with stakeholders, begin Phase 1 implementation
