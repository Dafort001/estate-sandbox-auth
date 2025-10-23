export type CheckSeverity = "P0" | "P1" | "P2" | "INFO";
export type CheckStatus = "pass" | "fail" | "warning" | "skip";

export interface CheckResult {
  id: string;
  name: string;
  status: CheckStatus;
  severity: CheckSeverity;
  message: string;
  details?: string;
  autoFixAvailable?: boolean;
  autoFixApplied?: boolean;
  timestamp: string;
}

export interface CheckPlugin {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  run(): Promise<CheckResult[]>;
}

export interface SystemReport {
  timestamp: string;
  version: string;
  environment: string;
  totalChecks: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  results: CheckResult[];
  summary: {
    p0Failures: number;
    p1Failures: number;
    p2Failures: number;
    autoFixesAvailable: number;
    autoFixesApplied: number;
  };
}

export interface CheckContext {
  autoFix: boolean;
  verbose: boolean;
  env: string;
}
