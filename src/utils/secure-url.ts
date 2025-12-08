/**
 * SECURITY: URL validation utilities for HTTPS enforcement
 * Issue #55: Enforce HTTPS-only for API connections
 */

import { logger } from './logger.js';

const LOCALHOST_HOSTS = ['localhost', '127.0.0.1', '::1', '0.0.0.0'];

/**
 * Validates that a URL uses HTTPS protocol.
 * HTTP allowed for localhost ONLY when ALLOW_INSECURE_LOCALHOST=true
 */
export function validateSecureUrl(url: string): void {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('SECURITY: Invalid URL format provided');
  }

  if (parsedUrl.protocol !== 'https:') {
    const isLocal = LOCALHOST_HOSTS.includes(parsedUrl.hostname.toLowerCase());
    const allowInsecureLocalhost = process.env.ALLOW_INSECURE_LOCALHOST === 'true';

    if (isLocal && allowInsecureLocalhost && parsedUrl.protocol === 'http:') {
      logger.warn(
        'SECURITY WARNING: HTTP connection to localhost. ' +
          'Ensure ALLOW_INSECURE_LOCALHOST is not set in production.'
      );
    } else if (isLocal && !allowInsecureLocalhost) {
      throw new Error(
        'SECURITY: HTTPS required for API connections. ' +
          'To allow HTTP for localhost development, set ALLOW_INSECURE_LOCALHOST=true'
      );
    } else {
      throw new Error(
        'SECURITY: HTTPS required for API connections. ' +
          `Refusing insecure ${parsedUrl.protocol} connection to ${parsedUrl.hostname}`
      );
    }
  }

  // Reject embedded credentials (security risk)
  if (parsedUrl.username || parsedUrl.password) {
    throw new Error('SECURITY: URLs with embedded credentials are not permitted');
  }
}

/**
 * Check if a hostname is localhost
 */
export function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return LOCALHOST_HOSTS.includes(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}
