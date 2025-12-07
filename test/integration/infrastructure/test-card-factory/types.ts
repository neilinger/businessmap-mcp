/**
 * Type definitions for Test Card Factory infrastructure.
 *
 * Provides interfaces for board discovery, card creation, and cleanup operations.
 *
 * @module test-card-factory/types
 */

/**
 * Identifier for board discovery supporting both numeric and string/regex matching.
 *
 * This hybrid approach allows tests to:
 * - Use board_id directly for precise identification
 * - Use board name as string for human-readable discovery
 * - Use regex patterns for flexible board matching across environments
 *
 * @example
 * ```typescript
 * // By board ID
 * { boardId: 123 }
 *
 * // By exact name
 * { boardName: 'fimancia' }
 *
 * // By regex pattern
 * { boardName: /^test-board-\d+$/ }
 * ```
 */
export interface BoardIdentifier {
  /** Numeric board ID for direct lookup */
  boardId?: number;

  /** Board name (string for exact match) or RegExp for pattern matching */
  boardName?: string | RegExp;
}

/**
 * Options for test card creation.
 *
 * Controls behavior of card creation including lane requirements,
 * card metadata, and cleanup preferences.
 */
export interface TestCardOptions {
  /** Whether to require and include lane_id in card creation. @default true */
  includeLane?: boolean;

  /** Custom title for the test card. @default "[Integration Test] Card {timestamp}" */
  title?: string;

  /** Custom description for the test card. @default "Automated test card" */
  description?: string;

  /** Environment variable name to read pre-configured test card ID. @default 'BUSINESSMAP_TEST_CARD_ID' */
  testCardIdEnvVar?: string;

  /** Optional preferred board name to prioritize during discovery. @default undefined */
  preferredBoardName?: string;

  /** Enable verbose logging for debugging. @default false */
  verbose?: boolean;
}

/**
 * Context information about discovered board structure.
 *
 * Contains all necessary information to create cards in a validated board
 * with proper column and lane placement.
 */
export interface TestBoardContext {
  /** Numeric board ID */
  boardId: number;

  /** Human-readable board name */
  boardName: string;

  /** Column ID for card placement */
  columnId: number;

  /** Human-readable column name */
  columnName: string;

  /** Lane ID for card placement (if includeLane was required) */
  laneId?: number;

  /** Human-readable lane name (if includeLane was required) */
  laneName?: string;
}

/**
 * Result of test card discovery or creation.
 *
 * Provides complete information needed for subsequent test operations
 * including card ID, board context, and metadata about the discovery process.
 */
export interface TestCardResult {
  /** The created or discovered test card ID */
  cardId: number;

  /** Board containing the card */
  boardId: number;

  /** Column for card placement */
  columnId: number;

  /** Lane for card placement (if includeLane was true) */
  laneId?: number;

  /** Whether card was newly created (vs pre-existing) */
  isNewCard: boolean;

  /** Metadata about the discovery process */
  metadata: {
    /** Name of the discovered board */
    boardName: string;

    /** Number of boards searched during discovery */
    boardsSearched: number;

    /** Discovery duration in milliseconds */
    discoveryTimeMs: number;
  };
}

/**
 * Result of cleanup operation.
 *
 * Reports success/failure of card deletion with error details if applicable.
 */
export interface CleanupResult {
  /** Whether the cleanup was successful */
  success: boolean;

  /** Card ID that was cleaned up */
  cardId: number;

  /** Number of cards successfully cleaned */
  cleaned: number;

  /** Total cards attempted to clean */
  total: number;

  /** Error message if cleanup failed (only present on failure) */
  error?: string;
}

/**
 * Options controlling cleanup behavior.
 *
 * Allows fine-grained control over how cards are deleted, including
 * archival strategy and error handling.
 */
export interface CleanupOptions {
  /** Whether to archive card before deletion (recommended). @default false */
  archiveFirst?: boolean;

  /** Suppress errors if card already deleted or inaccessible. @default true */
  suppressErrors?: boolean;

  /** Enable verbose logging. @default false */
  verbose?: boolean;
}

/**
 * Tracked resource information for cleanup coordination.
 *
 * Used internally to track created resources for batch cleanup
 * and orphan recovery operations.
 */
export interface TrackedResource {
  /** Card ID that was created */
  cardId: number;

  /** Board ID containing the card */
  boardId: number;

  /** Timestamp when the card was created */
  createdAt: Date;

  /** Isolation prefix used during creation (for concurrent test safety) */
  isolationPrefix?: string;
}
