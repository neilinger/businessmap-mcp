/**
 * Custom error classes for Test Card Factory.
 *
 * Following the pattern established in `src/types/instance-config.ts`,
 * these errors provide structured error information with codes and context.
 *
 * @module test-card-factory/errors
 */

/**
 * Base class for test setup errors.
 *
 * All test card factory errors inherit from this class, providing
 * consistent error handling with error codes and contextual details.
 *
 * @example
 * ```typescript
 * try {
 *   // test setup operation
 * } catch (error) {
 *   if (error instanceof TestSetupError) {
 *     console.error(`Error ${error.code}: ${error.message}`);
 *     console.error('Context:', error.context);
 *   }
 * }
 * ```
 */
export class TestSetupError extends Error {
  /**
   * Create a new TestSetupError.
   *
   * @param message - Human-readable error message
   * @param code - Machine-readable error code (e.g., 'BOARD_NOT_FOUND')
   * @param context - Additional contextual information about the error
   */
  constructor(
    message: string,
    public readonly code: string,
    public readonly context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'TestSetupError';
    Object.setPrototypeOf(this, TestSetupError.prototype);
  }
}

/**
 * Error thrown when board discovery fails.
 *
 * Occurs when:
 * - No accessible boards are found
 * - Specified board cannot be found
 * - Board lacks required structure (columns, lanes, etc.)
 *
 * @example
 * ```typescript
 * throw new BoardDiscoveryError(
 *   'No boards with columns found',
 *   'BOARD_STRUCTURE_MISSING',
 *   { boardsSearched: 5, requiresLanes: true }
 * );
 * ```
 */
export class BoardDiscoveryError extends TestSetupError {
  /**
   * Create a new BoardDiscoveryError.
   *
   * @param message - Description of discovery failure
   * @param code - Error code such as 'NO_ACCESSIBLE_BOARDS', 'BOARD_NOT_FOUND', 'BOARD_STRUCTURE_MISSING'
   * @param context - Details like boardsSearched, boardName, requiresLanes, etc.
   */
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'BoardDiscoveryError';
    Object.setPrototypeOf(this, BoardDiscoveryError.prototype);
  }
}

/**
 * Error thrown when card creation fails.
 *
 * Occurs when:
 * - API call returns error or invalid response
 * - Card creation parameters are invalid
 * - Required fields are missing from response
 *
 * @example
 * ```typescript
 * throw new CardCreationError(
 *   'Failed to create card on board 123',
 *   'CARD_CREATION_FAILED',
 *   { boardId: 123, columnId: 456, statusCode: 400 }
 * );
 * ```
 */
export class CardCreationError extends TestSetupError {
  /**
   * Create a new CardCreationError.
   *
   * @param message - Description of creation failure
   * @param code - Error code such as 'INVALID_RESPONSE', 'INVALID_PARAMETERS', 'API_ERROR'
   * @param context - Details like boardId, columnId, statusCode, apiError, etc.
   */
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'CardCreationError';
    Object.setPrototypeOf(this, CardCreationError.prototype);
  }
}

/**
 * Error thrown when card cleanup fails.
 *
 * Occurs when:
 * - Card cannot be found or deleted
 * - Archive operation fails before deletion
 * - Orphaned card cleanup encounters unexpected structure
 *
 * @example
 * ```typescript
 * throw new CleanupError(
 *   'Failed to delete card 789',
 *   'CARD_DELETE_FAILED',
 *   { cardId: 789, statusCode: 404, suppressError: true }
 * );
 * ```
 */
export class CleanupError extends TestSetupError {
  /**
   * Create a new CleanupError.
   *
   * @param message - Description of cleanup failure
   * @param code - Error code such as 'CARD_NOT_FOUND', 'DELETE_FAILED', 'TRACKING_FILE_ERROR'
   * @param context - Details like cardId, boardId, statusCode, suppressError, etc.
   */
  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message, code, context);
    this.name = 'CleanupError';
    Object.setPrototypeOf(this, CleanupError.prototype);
  }
}

/**
 * Type guard to check if an error is a TestSetupError.
 *
 * @param error - Error to check
 * @returns true if error is a TestSetupError or subclass
 *
 * @example
 * ```typescript
 * if (isTestSetupError(error)) {
 *   console.error(`Setup error ${error.code}: ${error.message}`);
 * }
 * ```
 */
export function isTestSetupError(error: unknown): error is TestSetupError {
  return error instanceof TestSetupError;
}

/**
 * Type guard to check if an error is a BoardDiscoveryError.
 *
 * @param error - Error to check
 * @returns true if error is a BoardDiscoveryError
 */
export function isBoardDiscoveryError(error: unknown): error is BoardDiscoveryError {
  return error instanceof BoardDiscoveryError;
}

/**
 * Type guard to check if an error is a CardCreationError.
 *
 * @param error - Error to check
 * @returns true if error is a CardCreationError
 */
export function isCardCreationError(error: unknown): error is CardCreationError {
  return error instanceof CardCreationError;
}

/**
 * Type guard to check if an error is a CleanupError.
 *
 * @param error - Error to check
 * @returns true if error is a CleanupError
 */
export function isCleanupError(error: unknown): error is CleanupError {
  return error instanceof CleanupError;
}
