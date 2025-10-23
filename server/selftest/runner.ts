import type { CheckPlugin, CheckResult, SystemReport, CheckContext } from "./types";
import * as fs from "fs/promises";
import * as path from "path";

export class SelfTestRunner {
  private plugins: CheckPlugin[] = [];
  private context: CheckContext;

  constructor(context: CheckContext) {
    this.context = context;
  }

  registerPlugin(plugin: CheckPlugin): void {
    if (plugin.enabled) {
      this.plugins.push(plugin);
    }
  }

  async runAll(): Promise<SystemReport> {
    const startTime = Date.now();
    const results: CheckResult[] = [];

    console.log(`\n🔍 pix.immo System Check Framework`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`Environment: ${this.context.env}`);
    console.log(`Auto-fix: ${this.context.autoFix ? "enabled" : "disabled"}`);
    console.log(`Plugins loaded: ${this.plugins.length}\n`);

    for (const plugin of this.plugins) {
      console.log(`\n📋 Running: ${plugin.name}`);
      console.log(`   ${plugin.description}`);
      
      try {
        const pluginResults = await plugin.run();
        results.push(...pluginResults);
        
        const passed = pluginResults.filter(r => r.status === "pass").length;
        const failed = pluginResults.filter(r => r.status === "fail").length;
        const warnings = pluginResults.filter(r => r.status === "warning").length;
        
        if (failed > 0) {
          console.log(`   ❌ ${failed} failed, ${warnings} warnings, ${passed} passed`);
        } else if (warnings > 0) {
          console.log(`   ⚠️  ${warnings} warnings, ${passed} passed`);
        } else {
          console.log(`   ✅ ${passed} checks passed`);
        }
      } catch (error) {
        console.error(`   ❌ Plugin error: ${error}`);
        results.push({
          id: `${plugin.id}-error`,
          name: `${plugin.name} - Error`,
          status: "fail",
          severity: "P0",
          message: `Plugin execution failed: ${error}`,
          timestamp: new Date().toISOString(),
        });
      }
    }

    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    const report = this.generateReport(results);
    
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`\n📊 Test Summary`);
    console.log(`   Total Checks: ${report.totalChecks}`);
    console.log(`   ✅ Passed: ${report.passed}`);
    console.log(`   ❌ Failed: ${report.failed}`);
    console.log(`   ⚠️  Warnings: ${report.warnings}`);
    console.log(`   ⏭️  Skipped: ${report.skipped}`);
    console.log(`\n🔧 Auto-Fix Summary`);
    console.log(`   Available: ${report.summary.autoFixesAvailable}`);
    console.log(`   Applied: ${report.summary.autoFixesApplied}`);
    console.log(`\n⏱️  Duration: ${duration}s`);

    if (report.summary.p0Failures > 0) {
      console.log(`\n🚨 P0 FAILURES: ${report.summary.p0Failures} critical issues found!`);
    }

    return report;
  }

  private generateReport(results: CheckResult[]): SystemReport {
    const passed = results.filter(r => r.status === "pass").length;
    const failed = results.filter(r => r.status === "fail").length;
    const warnings = results.filter(r => r.status === "warning").length;
    const skipped = results.filter(r => r.status === "skip").length;

    const p0Failures = results.filter(r => r.status === "fail" && r.severity === "P0").length;
    const p1Failures = results.filter(r => r.status === "fail" && r.severity === "P1").length;
    const p2Failures = results.filter(r => r.status === "fail" && r.severity === "P2").length;

    const autoFixesAvailable = results.filter(r => r.autoFixAvailable).length;
    const autoFixesApplied = results.filter(r => r.autoFixApplied).length;

    return {
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: this.context.env,
      totalChecks: results.length,
      passed,
      failed,
      warnings,
      skipped,
      results,
      summary: {
        p0Failures,
        p1Failures,
        p2Failures,
        autoFixesAvailable,
        autoFixesApplied,
      },
    };
  }

  async saveReport(report: SystemReport, format: "json" | "markdown" = "json"): Promise<string> {
    const reportsDir = path.join(process.cwd(), "server/selftest/reports");
    await fs.mkdir(reportsDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `selftest-${timestamp}.${format === "json" ? "json" : "md"}`;
    const filepath = path.join(reportsDir, filename);

    if (format === "json") {
      await fs.writeFile(filepath, JSON.stringify(report, null, 2), "utf-8");
    } else {
      const markdown = this.generateMarkdownReport(report);
      await fs.writeFile(filepath, markdown, "utf-8");
    }

    return filepath;
  }

  private generateMarkdownReport(report: SystemReport): string {
    let md = `# pix.immo System Check Report\n\n`;
    md += `**Generated:** ${new Date(report.timestamp).toLocaleString("de-DE")}\n`;
    md += `**Version:** ${report.version}\n`;
    md += `**Environment:** ${report.environment}\n\n`;

    md += `## Summary\n\n`;
    md += `| Metric | Count |\n`;
    md += `|--------|-------|\n`;
    md += `| Total Checks | ${report.totalChecks} |\n`;
    md += `| ✅ Passed | ${report.passed} |\n`;
    md += `| ❌ Failed | ${report.failed} |\n`;
    md += `| ⚠️ Warnings | ${report.warnings} |\n`;
    md += `| ⏭️ Skipped | ${report.skipped} |\n\n`;

    md += `### Severity Breakdown\n\n`;
    md += `| Severity | Failures |\n`;
    md += `|----------|----------|\n`;
    md += `| 🚨 P0 (Critical) | ${report.summary.p0Failures} |\n`;
    md += `| ⚠️ P1 (High) | ${report.summary.p1Failures} |\n`;
    md += `| 📋 P2 (Medium) | ${report.summary.p2Failures} |\n\n`;

    if (report.summary.autoFixesAvailable > 0) {
      md += `### Auto-Fix\n\n`;
      md += `- **Available:** ${report.summary.autoFixesAvailable}\n`;
      md += `- **Applied:** ${report.summary.autoFixesApplied}\n\n`;
    }

    const failedChecks = report.results.filter(r => r.status === "fail");
    if (failedChecks.length > 0) {
      md += `## ❌ Failed Checks\n\n`;
      for (const result of failedChecks) {
        md += `### ${result.name} (${result.severity})\n\n`;
        md += `- **ID:** \`${result.id}\`\n`;
        md += `- **Message:** ${result.message}\n`;
        if (result.details) {
          md += `- **Details:**\n  \`\`\`\n  ${result.details}\n  \`\`\`\n`;
        }
        if (result.autoFixAvailable) {
          md += `- **Auto-Fix:** ${result.autoFixApplied ? "✅ Applied" : "⚠️ Available (not applied)"}\n`;
        }
        md += `\n`;
      }
    }

    const warningChecks = report.results.filter(r => r.status === "warning");
    if (warningChecks.length > 0) {
      md += `## ⚠️ Warnings\n\n`;
      for (const result of warningChecks) {
        md += `- **${result.name}:** ${result.message}\n`;
      }
      md += `\n`;
    }

    return md;
  }
}
