import { randomUUID } from "crypto";

export interface LogContext {
  requestId?: string;
  userId?: string;
  method?: string;
  path?: string;
  [key: string]: any;
}

/**
 * Enhanced logging with request_id and context
 */
export class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  /**
   * Log info message with context
   */
  info(message: string, context?: LogContext): void {
    const logEntry = this.formatLog("INFO", message, context);
    console.log(logEntry);
  }

  /**
   * Log error message with context
   * In production, stack traces are suppressed
   */
  error(message: string, error?: any, context?: LogContext): void {
    const logEntry = this.formatLog("ERROR", message, context);
    
    if (this.isProduction) {
      // In production, don't log stack traces or sensitive data
      const sanitizedError = error ? {
        message: error.message || String(error),
        code: error.code,
        status: error.status
      } : undefined;
      
      console.error(logEntry, sanitizedError ? { error: sanitizedError } : "");
    } else {
      // In development, include full error details
      console.error(logEntry, error || "");
    }
  }

  /**
   * Log warning message with context
   */
  warn(message: string, context?: LogContext): void {
    const logEntry = this.formatLog("WARN", message, context);
    console.warn(logEntry);
  }

  /**
   * Log debug message with context (only in development)
   */
  debug(message: string, context?: LogContext): void {
    if (!this.isProduction) {
      const logEntry = this.formatLog("DEBUG", message, context);
      console.log(logEntry);
    }
  }

  /**
   * Format log entry with timestamp, level, request_id, and context
   */
  private formatLog(level: string, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const parts = [
      `[${timestamp}]`,
      `[${level}]`,
    ];

    if (context?.requestId) {
      parts.push(`[req:${context.requestId.substring(0, 8)}]`);
    }

    if (context?.userId) {
      parts.push(`[user:${context.userId.substring(0, 8)}]`);
    }

    if (context?.method && context?.path) {
      parts.push(`[${context.method} ${context.path}]`);
    }

    parts.push(message);

    // Add additional context fields
    if (context) {
      const { requestId, userId, method, path, ...rest } = context;
      if (Object.keys(rest).length > 0) {
        parts.push(JSON.stringify(rest));
      }
    }

    return parts.join(" ");
  }
}

/**
 * Global logger instance
 */
export const logger = new Logger();

/**
 * Generate a unique request ID
 */
export function generateRequestId(): string {
  return randomUUID();
}
