/**
 * Test Error Messages Infrastructure Module
 * Provides centralized, standardized error messages for integration tests.
 *
 * Purpose:
 * - Centralize error message definitions to reduce duplication
 * - Provide tiered error approach (short message + guidance reference)
 * - Improve test maintainability by standardizing error handling
 *
 * Usage:
 * - Use testError() for standard errors with optional context
 * - Use safetyError() for safety-check related errors (archive/delete operations)
 *
 * Example:
 * ```typescript
 * // Standard error with context
 * throw testError('NO_BOARDS', 'Could not find fimancia instance boards');
 *
 * // Safety check error
 * throw safetyError('archive', 'workspace', 123);
 * ```
 */

/**
 * Standard test errors with short message + guidance reference
 * All messages follow the format: Brief description (2-5 words)
 * Guidance points to relevant documentation or setup instructions
 */
export const TEST_ERRORS = {
  NO_BOARDS: {
    message: 'No accessible boards found',
    guidance: 'Set BUSINESSMAP_TEST_CARD_ID env var or configure .mcp.json with test board access',
  },
  NO_COLUMNS: {
    message: 'Board has no columns',
    guidance: 'Verify test board has at least one workflow with columns',
  },
  NO_LANES: {
    message: 'Board has no lanes',
    guidance: 'Verify test board has at least one lane configured',
  },
  NO_WORKFLOWS: {
    message: 'Board must have at least one workflow',
    guidance: 'Create a workflow in the test board before running tests',
  },
  INSUFFICIENT_COLUMNS: {
    message: 'Workflow must have at least 2 columns',
    guidance: 'Add additional columns to the workflow for move operation tests',
  },
  CARD_CREATION_FAILED: {
    message: 'Unable to create test card',
    guidance: 'Verify board structure (columns/lanes exist) and API permissions are sufficient',
  },
  NO_CREDENTIALS: {
    message: 'No BusinessMap credentials available',
    guidance: 'See docs/ONBOARDING.md - configure BUSINESSMAP_API_TOKEN_* environment variables',
  },
  UNSAFE_ARCHIVE: {
    message: 'Unsafe workspace archive operation',
    guidance: 'Use resource IDs marked as safe for testing to prevent data loss',
  },
  UNSAFE_DELETE: {
    message: 'Unsafe board delete operation',
    guidance: 'Use resource IDs marked as safe for testing to prevent data loss',
  },
} as const;

/**
 * Create a test error with optional context
 * @param key - Error type from TEST_ERRORS
 * @param context - Optional additional context to append to error message
 * @returns Error instance with full message and guidance
 *
 * @example
 * throw testError('NO_BOARDS', 'in fimancia instance');
 */
export function testError(key: keyof typeof TEST_ERRORS, context?: string): Error {
  const errorDef = TEST_ERRORS[key];
  const fullMessage = context ? `${errorDef.message} (${context})` : errorDef.message;
  const error = new Error(`${fullMessage}\nGuidance: ${errorDef.guidance}`);
  error.name = `TEST_${key}`;
  return error;
}

/**
 * Create a safety check error for archive/delete operations
 * Used to prevent accidental deletion of important test data
 * @param operation - Operation type: 'archive' or 'delete'
 * @param resourceType - Resource type: 'workspace' or 'board'
 * @param resourceId - The ID of the resource being operated on
 * @returns Error instance with operation details
 *
 * @example
 * throw safetyError('delete', 'board', 123);
 */
export function safetyError(
  operation: 'archive' | 'delete',
  resourceType: 'workspace' | 'board',
  resourceId: number | string
): Error {
  const opLabel = operation === 'archive' ? 'ARCHIVE' : 'DELETE';
  const resourceLabel = resourceType.toUpperCase();
  const message = `Unsafe ${resourceType} ${operation} operation: ${resourceId}`;
  const guidance =
    operation === 'archive'
      ? TEST_ERRORS.UNSAFE_ARCHIVE.guidance
      : TEST_ERRORS.UNSAFE_DELETE.guidance;

  const error = new Error(`${message}\nGuidance: ${guidance}`);
  error.name = `TEST_SAFETY_${opLabel}_${resourceLabel}`;
  return error;
}
