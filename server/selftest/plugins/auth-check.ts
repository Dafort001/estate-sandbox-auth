import type { CheckPlugin, CheckResult } from "../types";
import { scrypt } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export class AuthCheckPlugin implements CheckPlugin {
  id = "auth";
  name = "Authentication Check";
  description = "Validates authentication system, sessions, JWT, and rate limiting";
  enabled = true;

  async run(): Promise<CheckResult[]> {
    const results: CheckResult[] = [];

    // Check 1: JWT_SECRET environment variable
    results.push(await this.checkJwtSecret());

    // Check 2: SESSION_SECRET environment variable
    results.push(await this.checkSessionSecret());

    // Check 3: Scrypt password hashing
    results.push(await this.checkScryptHashing());

    // Check 4: Rate limiting configuration
    results.push(await this.checkRateLimiting());

    return results;
  }

  private async checkJwtSecret(): Promise<CheckResult> {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      return {
        id: "auth-jwt-secret-missing",
        name: "JWT Secret",
        status: "fail",
        severity: "P0",
        message: "JWT_SECRET environment variable is not set",
        details: "Required for iOS app authentication. Set in environment configuration.",
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }

    if (secret.length < 32) {
      return {
        id: "auth-jwt-secret-weak",
        name: "JWT Secret",
        status: "warning",
        severity: "P1",
        message: "JWT_SECRET is too short (should be at least 32 characters)",
        details: `Current length: ${secret.length} characters`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      id: "auth-jwt-secret",
      name: "JWT Secret",
      status: "pass",
      severity: "INFO",
      message: "JWT_SECRET is properly configured",
      timestamp: new Date().toISOString(),
    };
  }

  private async checkSessionSecret(): Promise<CheckResult> {
    const secret = process.env.SESSION_SECRET;

    if (!secret) {
      return {
        id: "auth-session-secret-missing",
        name: "Session Secret",
        status: "fail",
        severity: "P0",
        message: "SESSION_SECRET environment variable is not set",
        details: "Required for secure session management. Set in environment configuration.",
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }

    if (secret.length < 32) {
      return {
        id: "auth-session-secret-weak",
        name: "Session Secret",
        status: "warning",
        severity: "P1",
        message: "SESSION_SECRET is too short (should be at least 32 characters)",
        details: `Current length: ${secret.length} characters`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }

    return {
      id: "auth-session-secret",
      name: "Session Secret",
      status: "pass",
      severity: "INFO",
      message: "SESSION_SECRET is properly configured",
      timestamp: new Date().toISOString(),
    };
  }

  private async checkScryptHashing(): Promise<CheckResult> {
    try {
      // Test scrypt with a sample password
      const testPassword = "test-password-123";
      const salt = Buffer.from("test-salt-16byte");
      
      const hash = await scryptAsync(testPassword, salt, 64) as Buffer;

      if (!hash || hash.length !== 64) {
        return {
          id: "auth-scrypt-fail",
          name: "Scrypt Password Hashing",
          status: "fail",
          severity: "P0",
          message: "Scrypt hashing failed or returned unexpected result",
          details: `Expected 64 bytes, got ${hash?.length || 0}`,
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "auth-scrypt",
        name: "Scrypt Password Hashing",
        status: "pass",
        severity: "INFO",
        message: "Scrypt password hashing is working correctly",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "auth-scrypt-error",
        name: "Scrypt Password Hashing",
        status: "fail",
        severity: "P0",
        message: "Scrypt hashing test failed",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }

  private async checkRateLimiting(): Promise<CheckResult> {
    // Check if rate limiting middleware exists in package.json
    try {
      const fs = await import("fs/promises");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      
      // Go up to workspace root (from server/selftest/plugins to workspace)
      const currentFile = fileURLToPath(import.meta.url);
      const workspaceRoot = path.join(path.dirname(currentFile), "../../..");
      const packageJsonPath = path.join(workspaceRoot, "package.json");
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
      
      const hasRateLimiter = packageJson.dependencies?.["hono-rate-limiter"] || 
                             packageJson.devDependencies?.["hono-rate-limiter"];

      if (!hasRateLimiter) {
        return {
          id: "auth-rate-limiting-missing",
          name: "Rate Limiting Configuration",
          status: "warning",
          severity: "P2",
          message: "hono-rate-limiter package not found in dependencies",
          autoFixAvailable: false,
          timestamp: new Date().toISOString(),
        };
      }

      return {
        id: "auth-rate-limiting",
        name: "Rate Limiting Configuration",
        status: "pass",
        severity: "INFO",
        message: "Rate limiting middleware (hono-rate-limiter) is installed",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        id: "auth-rate-limiting-error",
        name: "Rate Limiting Configuration",
        status: "warning",
        severity: "P2",
        message: "Could not verify rate limiting configuration",
        details: `Error: ${error}`,
        autoFixAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
