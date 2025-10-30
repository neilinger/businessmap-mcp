/**
 * Simple production-ready logger for MCP server
 * Provides structured logging with different severity levels
 */

/* eslint-disable no-console */
export const logger = {
  /**
   * Log informational messages
   */
  info: (msg: string, meta?: Record<string, unknown>): void => {
    console.log(`[INFO] ${msg}`, meta ? JSON.stringify(meta) : '');
  },

  /**
   * Log warning messages
   */
  warn: (msg: string, meta?: Record<string, unknown>): void => {
    console.warn(`[WARN] ${msg}`, meta ? JSON.stringify(meta) : '');
  },

  /**
   * Log error messages
   */
  error: (msg: string, error?: Error): void => {
    console.error(`[ERROR] ${msg}`, error?.message || '');
  },
};
/* eslint-enable no-console */
