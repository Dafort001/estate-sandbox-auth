import type { CheckPlugin, CheckResult } from "../types";

export class RoutesCheckPlugin implements CheckPlugin {
  id = "routes";
  name = "API Routes Check";
  description = "Validates API endpoints, error handlers, and routing configuration";
  enabled = true;

  async run(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // Check 1: Critical API endpoints exist
    results.push(await this.checkCriticalEndpoints());

    // Check 2: Authentication endpoints
    results.push(await this.checkAuthEndpoints());

    // Check 3: QA-Autofix endpoints
    results.push(await this.checkQaAutofixEndpoints());

    // Check 4: Upload endpoints
    results.push(await this.checkUploadEndpoints());

    return results;
  }

  private async checkCriticalEndpoints(): Promise<CheckResult> {
    const requiredEndpoints = [
      "/api/users/me",
      "/api/jobs",
      "/api/shoots",
      "/api/images",
    ];

    try {
      // Check if server/index.ts file exists and contains route definitions
      const fs = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      
      // Go up to workspace root (from server/selftest/plugins to workspace)
      const currentFile = fileURLToPath(import.meta.url);
      const workspaceRoot = path.join(path.dirname(currentFile), "../../..");
      const serverIndexPath = path.join(workspaceRoot, "server/index.ts");
      const content = await fs.readFile(serverIndexPath, "utf-8");

      // Check for route definitions in the file
      const missingEndpoints = requiredEndpoints.filter(endpoint => {
        const escaped = endpoint.replace(/\//g, "\\/");
        return !content.includes(endpoint);
      });

      if (missingEndpoints.length > 0) {
        return {
          id: "routes-critical-missing",
          name: "Critical API Endpoints",
          status: "warning",
          severity: "P1",
          message: "Some critical API endpoints may not be defined",
          details: `Potentially missing: ${missingEndpoints.join(", ")}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "routes-critical",
        name: "Critical API Endpoints",
        status: "pass",
        severity: "INFO",
        message: `All critical API endpoints appear to be defined`,
        details: `Checked: ${requiredEndpoints.join(", ")}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "routes-critical-error",
        name: "Critical API Endpoints",
        status: "fail",
        severity: "P0",
        message: "Failed to verify critical API endpoints",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkAuthEndpoints(): Promise<CheckResult> {
    const authEndpoints = [
      "/api/login",
      "/api/logout",
      "/api/users/me",
    ];

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      
      const currentFile = fileURLToPath(import.meta.url);
      const workspaceRoot = path.join(path.dirname(currentFile), "../../..");
      const serverIndexPath = path.join(workspaceRoot, "server/index.ts");
      const content = await fs.readFile(serverIndexPath, "utf-8");

      const missingEndpoints = authEndpoints.filter(endpoint => !content.includes(endpoint));

      if (missingEndpoints.length > 0) {
        return {
          id: "routes-auth-missing",
          name: "Authentication Endpoints",
          status: "fail",
          severity: "P0",
          message: "Some authentication endpoints are not defined",
          details: `Missing: ${missingEndpoints.join(", ")}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "routes-auth",
        name: "Authentication Endpoints",
        status: "pass",
        severity: "INFO",
        message: "Authentication endpoints are defined",
        details: `Endpoints: ${authEndpoints.join(", ")}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "routes-auth-error",
        name: "Authentication Endpoints",
        status: "fail",
        severity: "P0",
        message: "Failed to verify authentication endpoints",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkQaAutofixEndpoints(): Promise<CheckResult> {
    const qaEndpoints = [
      "/api/roomtypes",
      "/api/images/:id/classify",
      "/api/images/classify/bulk",
    ];

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      
      const currentFile = fileURLToPath(import.meta.url);
      const workspaceRoot = path.join(path.dirname(currentFile), "../../..");
      const serverIndexPath = path.join(workspaceRoot, "server/index.ts");
      const content = await fs.readFile(serverIndexPath, "utf-8");

      const missingEndpoints = qaEndpoints.filter(endpoint => !content.includes(endpoint));

      if (missingEndpoints.length > 0) {
        return {
          id: "routes-qa-autofix-missing",
          name: "QA-Autofix Endpoints",
          status: "warning",
          severity: "P2",
          message: "Some QA-Autofix endpoints may not be defined",
          details: `Potentially missing: ${missingEndpoints.join(", ")}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "routes-qa-autofix",
        name: "QA-Autofix Endpoints",
        status: "pass",
        severity: "INFO",
        message: "QA-Autofix endpoints are defined",
        details: `Endpoints: ${qaEndpoints.join(", ")}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "routes-qa-autofix-error",
        name: "QA-Autofix Endpoints",
        status: "warning",
        severity: "P2",
        message: "Could not verify QA-Autofix endpoints",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkUploadEndpoints(): Promise<CheckResult> {
    const uploadEndpoints = [
      "/api/demo/upload",
      "/api/shoots/:id/upload-raw",
    ];

    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      
      const currentFile = fileURLToPath(import.meta.url);
      const workspaceRoot = path.join(path.dirname(currentFile), "../../..");
      const serverIndexPath = path.join(workspaceRoot, "server/index.ts");
      const content = await fs.readFile(serverIndexPath, "utf-8");

      const missingEndpoints = uploadEndpoints.filter(endpoint => !content.includes(endpoint));

      if (missingEndpoints.length > 0) {
        return {
          id: "routes-upload-missing",
          name: "Upload Endpoints",
          status: "fail",
          severity: "P1",
          message: "Some upload endpoints are not defined",
          details: `Missing: ${missingEndpoints.join(", ")}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "routes-upload",
        name: "Upload Endpoints",
        status: "pass",
        severity: "INFO",
        message: "Upload endpoints are defined",
        details: `Endpoints: ${uploadEndpoints.join(", ")}`,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "routes-upload-error",
        name: "Upload Endpoints",
        status: "warning",
        severity: "P1",
        message: "Could not verify upload endpoints",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
