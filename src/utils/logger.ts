/**
 * Enhanced production-ready logger for MCP server with automatic sanitization
 *
 * This logger wraps @toolprint/mcp-logger and provides:
 * - Automatic sanitization of sensitive data (API tokens, credentials)
 * - Structured logging with metadata support
 * - Configurable log levels
 * - Singleton pattern for ease of use
 *
 * @module utils/logger
 */

import { createLoggerSync, type Logger as McpLogger } from '@toolprint/mcp-logger';

/**
 * Sanitization rule definition
 */
interface SanitizationRule {
  pattern: RegExp;
  replacement: string;
}

/**
 * Comprehensive sanitization rules for sensitive data
 * Applied to all log messages and metadata before output
 */
const SANITIZATION_RULES: SanitizationRule[] = [
  // API Token in Headers (BusinessMap uses "apikey" header)
  { pattern: /("apikey"\s*:\s*)"[^"]+"/gi, replacement: '$1"[REDACTED]"' },

  // Environment Variable API Tokens
  {
    pattern: /(BUSINESSMAP_API_TOKEN[_A-Z]*)\s*[=:]\s*["']?([a-zA-Z0-9_-]{20,})["']?/gi,
    replacement: '$1=[REDACTED]',
  },

  // Bearer Token Pattern
  { pattern: /(bearer\s+)([a-zA-Z0-9_.-]+)/gi, replacement: '$1[REDACTED]' },

  // Authorization Header
  { pattern: /(["']?Authorization["']?\s*:\s*)["'][^"']+["']/gi, replacement: '$1"[REDACTED]"' },

  // API Token in URL Query Parameters
  { pattern: /([?&])(api[_-]?token|key|apikey)=([^&\s]+)/gi, replacement: '$1$2=[REDACTED]' },

  // JWT tokens (three base64 segments separated by dots)
  {
    pattern: /\b(eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*)\b/g,
    replacement: '[REDACTED_JWT]',
  },
];

/**
 * Log level types
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

/**
 * Logger interface
 */
export interface Logger {
  /**
   * Log error messages
   * @param msg - The log message
   * @param meta - Optional structured metadata
   */
  error(msg: string, meta?: Record<string, unknown>): void;

  /**
   * Log warning messages
   * @param msg - The log message
   * @param meta - Optional structured metadata
   */
  warn(msg: string, meta?: Record<string, unknown>): void;

  /**
   * Log informational messages
   * @param msg - The log message
   * @param meta - Optional structured metadata
   */
  info(msg: string, meta?: Record<string, unknown>): void;

  /**
   * Log debug messages
   * @param msg - The log message
   * @param meta - Optional structured metadata
   */
  debug(msg: string, meta?: Record<string, unknown>): void;
}

/**
 * Logger creation options
 */
export interface LoggerOptions {
  /**
   * Minimum log level to output
   * @default 'info'
   */
  level?: LogLevel;
}

/**
 * Sanitizes a string by applying all sanitization rules
 * @param input - The string to sanitize
 * @returns Sanitized string with sensitive data redacted
 */
function sanitizeString(input: string): string {
  let sanitized = input;

  for (const rule of SANITIZATION_RULES) {
    sanitized = sanitized.replace(rule.pattern, rule.replacement);
  }

  return sanitized;
}

/**
 * Sanitizes metadata object by stringifying and applying sanitization rules
 * @param meta - The metadata object to sanitize
 * @returns Sanitized metadata object
 */
function sanitizeMetadata(meta: Record<string, unknown>): Record<string, unknown> {
  try {
    // Stringify the metadata to catch nested sensitive data
    const stringified = JSON.stringify(meta);
    const sanitized = sanitizeString(stringified);

    // Parse back to object
    return JSON.parse(sanitized) as Record<string, unknown>;
  } catch (error) {
    // If parsing fails, return a safe error object
    return {
      error: 'Failed to sanitize metadata',
      originalType: typeof meta,
    };
  }
}

/**
 * Creates a sanitizing logger instance
 * @param options - Logger configuration options
 * @returns Logger instance with automatic sanitization
 */
export function createLogger(options?: LoggerOptions): Logger {
  const level = options?.level || (process.env.LOG_LEVEL as LogLevel) || 'info';

  // Map our log levels to mcp-logger levels
  const mcpLevel = level === 'debug' ? 'debug' : level;
  const mcpLogger: McpLogger = createLoggerSync({ level: mcpLevel });

  return {
    error(msg: string, meta?: Record<string, unknown>): void {
      const sanitizedMsg = sanitizeString(msg);
      if (meta) {
        const sanitizedMeta = sanitizeMetadata(meta);
        mcpLogger.error(sanitizedMsg, sanitizedMeta);
      } else {
        mcpLogger.error(sanitizedMsg);
      }
    },

    warn(msg: string, meta?: Record<string, unknown>): void {
      const sanitizedMsg = sanitizeString(msg);
      if (meta) {
        const sanitizedMeta = sanitizeMetadata(meta);
        mcpLogger.warn(sanitizedMsg, sanitizedMeta);
      } else {
        mcpLogger.warn(sanitizedMsg);
      }
    },

    info(msg: string, meta?: Record<string, unknown>): void {
      const sanitizedMsg = sanitizeString(msg);
      if (meta) {
        const sanitizedMeta = sanitizeMetadata(meta);
        mcpLogger.info(sanitizedMsg, sanitizedMeta);
      } else {
        mcpLogger.info(sanitizedMsg);
      }
    },

    debug(msg: string, meta?: Record<string, unknown>): void {
      const sanitizedMsg = sanitizeString(msg);
      if (meta) {
        const sanitizedMeta = sanitizeMetadata(meta);
        mcpLogger.debug(sanitizedMsg, sanitizedMeta);
      } else {
        mcpLogger.debug(sanitizedMsg);
      }
    },
  };
}

/**
 * Default singleton logger instance
 * Uses LOG_LEVEL environment variable or defaults to 'info'
 */
export const logger: Logger = createLogger();
