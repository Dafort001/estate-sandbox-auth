#!/usr/bin/env tsx

/**
 * pix.immo System Check CLI
 * Usage: npm run selftest [--auto-fix] [--format json|markdown]
 */

import { SelfTestRunner } from "./runner";
import { AuthCheckPlugin } from "./plugins/auth-check";
import { RoutesCheckPlugin } from "./plugins/routes-check";
import { UploadCheckPlugin } from "./plugins/upload-check";
import { NamingCheckPlugin } from "./plugins/naming-check";
import type { CheckContext } from "./types";

async function main() {
  const args = process.argv.slice(2);
  
  const autoFix = args.includes("--auto-fix");
  const verbose = args.includes("--verbose") || args.includes("-v");
  const formatArg = args.find(arg => arg.startsWith("--format="));
  const format = formatArg ? formatArg.split("=")[1] as "json" | "markdown" : "json";

  const context: CheckContext = {
    autoFix,
    verbose,
    env: process.env.NODE_ENV || "development",
  };

  const runner = new SelfTestRunner(context);

  // Register plugins
  runner.registerPlugin(new AuthCheckPlugin());
  runner.registerPlugin(new RoutesCheckPlugin());
  runner.registerPlugin(new UploadCheckPlugin());
  runner.registerPlugin(new NamingCheckPlugin());

  try {
    // Run all checks
    const report = await runner.runAll();

    // Save report
    const reportPath = await runner.saveReport(report, format);
    console.log(`\n📄 Report saved: ${reportPath}`);

    // Also save markdown version if JSON was primary
    if (format === "json") {
      const mdPath = await runner.saveReport(report, "markdown");
      console.log(`📄 Markdown report: ${mdPath}`);
    }

    // Exit with appropriate code
    if (report.summary.p0Failures > 0) {
      console.log(`\n❌ CRITICAL FAILURES DETECTED - Exiting with code 2`);
      process.exit(2);
    } else if (report.failed > 0) {
      console.log(`\n⚠️  Some checks failed - Exiting with code 1`);
      process.exit(1);
    } else {
      console.log(`\n✅ All checks passed!`);
      process.exit(0);
    }
  } catch (error) {
    console.error(`\n💥 Fatal error during selftest:`, error);
    process.exit(3);
  }
}

main();
