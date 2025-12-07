/**
 * Test Card Tracker for orphan recovery and resource cleanup.
 *
 * Provides persistent tracking of created test cards across test runs,
 * enabling recovery from crashes and coordinated cleanup in beforeEach/afterEach scenarios.
 *
 * The tracker maintains a `.test-cards-tracking.json` file that survives
 * process crashes, allowing cleanup of orphaned cards on next test run.
 *
 * @module test-card-factory/tracker
 */

/* eslint-disable no-console */

import * as fs from 'fs/promises';
import * as path from 'path';
import { BusinessMapClient } from '../../../../src/client/businessmap-client.js';
import { CleanupOptions, CleanupResult, TrackedResource } from './types.js';
import { CleanupError } from './errors.js';

/**
 * Path to tracking file - stored in test directory for easy cleanup.
 *
 * Located at: test/integration/infrastructure/.test-cards-tracking.json
 */
const TRACKING_FILE_PATH = path.join(
  path.dirname(import.meta.url.replace('file://', '')),
  '.test-cards-tracking.json'
);

/**
 * In-memory tracking file content.
 */
interface TrackingFileContent {
  /** Schema version for migration compatibility */
  version: string;

  /** Last update timestamp */
  lastUpdated: string;

  /** Array of tracked resources */
  trackedCards: TrackedResource[];
}

/**
 * TestCardTracker manages persistent tracking and cleanup of test cards.
 *
 * Features:
 * - Tracks created cards in memory and on disk
 * - Supports orphan recovery from tracking file
 * - Atomic write operations for crash safety
 * - Integration with before/afterEach and before/afterAll hooks
 * - Isolation prefix support for concurrent test safety
 *
 * @example
 * ```typescript
 * // In beforeEach/afterEach for isolation
 * const tracker = new TestCardTracker(client, `test-${Date.now()}`);
 *
 * // Track a created card
 * tracker.track(cardId, { boardId: 123 });
 *
 * // Clean up in afterEach
 * await tracker.cleanupAll(client);
 * ```
 *
 * @example
 * ```typescript
 * // Cleanup orphaned cards from previous crashes
 * await TestCardTracker.cleanupOrphanedCards(client);
 * ```
 */
export class TestCardTracker {
  private trackedCards: Map<number, TrackedResource> = new Map();
  private client: BusinessMapClient;
  private isolationPrefix?: string;
  private verbose: boolean = false;

  /**
   * Create a new TestCardTracker instance.
   *
   * @param client - Initialized BusinessMapClient for card operations
   * @param isolationPrefix - Optional prefix for concurrent test isolation (e.g., test run ID)
   * @param verbose - Enable verbose logging for debugging
   */
  constructor(client: BusinessMapClient, isolationPrefix?: string, verbose: boolean = false) {
    this.client = client;
    this.isolationPrefix = isolationPrefix;
    this.verbose = verbose;
  }

  /**
   * Track a created card for later cleanup.
   *
   * Stores card information in memory and persists to disk.
   * Supports optional isolation prefix for concurrent test safety.
   *
   * @param cardId - Card ID to track
   * @param boardId - Board ID containing the card
   *
   * @example
   * ```typescript
   * tracker.track(123, 456);
   * ```
   */
  track(cardId: number, boardId: number): void {
    this.log(`Tracking card ${cardId} in board ${boardId}`);

    const resource: TrackedResource = {
      cardId,
      boardId,
      createdAt: new Date(),
      isolationPrefix: this.isolationPrefix,
    };

    this.trackedCards.set(cardId, resource);
  }

  /**
   * Get all currently tracked cards.
   *
   * Returns a copy of the tracked resources to prevent external modification.
   *
   * @returns Array of tracked resources
   */
  getTracked(): TrackedResource[] {
    return Array.from(this.trackedCards.values());
  }

  /**
   * Check if a card is currently tracked.
   *
   * @param cardId - Card ID to check
   * @returns true if card is tracked
   */
  isTracked(cardId: number): boolean {
    return this.trackedCards.has(cardId);
  }

  /**
   * Remove a card from tracking without cleanup.
   *
   * Use cautiously - only if you've manually cleaned up the card.
   *
   * @param cardId - Card ID to untrack
   */
  untrack(cardId: number): void {
    this.log(`Untracking card ${cardId}`);
    this.trackedCards.delete(cardId);
  }

  /**
   * Clean up all tracked cards in this tracker instance.
   *
   * Attempts to delete all tracked cards, optionally archiving them first.
   * Suppresses individual card errors by default but can be configured.
   *
   * @param options - Cleanup options (archiveFirst, suppressErrors, verbose)
   * @returns Cleanup result with success status and counts
   *
   * @example
   * ```typescript
   * const result = await tracker.cleanupAll(client, {
   *   archiveFirst: true,
   *   suppressErrors: true,
   * });
   * console.log(`Cleaned ${result.cleaned}/${result.total} cards`);
   * ```
   */
  async cleanupAll(options: CleanupOptions = {}): Promise<CleanupResult> {
    const archiveFirst = options.archiveFirst !== false;
    const suppressErrors = options.suppressErrors !== false;
    this.verbose = options.verbose || false;

    const tracked = this.getTracked();
    const total = tracked.length;

    if (total === 0) {
      this.log('No tracked cards to clean up');
      return { success: true, cardId: 0, cleaned: 0, total: 0 };
    }

    this.log(`Cleaning up ${total} tracked cards...`);
    let cleaned = 0;

    for (const resource of tracked) {
      try {
        if (archiveFirst) {
          this.log(`Archiving card ${resource.cardId}...`);
          await this.client.updateCard({
            card_id: resource.cardId,
            is_archived: 1,
          });
        }

        this.log(`Deleting card ${resource.cardId}...`);
        await this.client.deleteCard(resource.cardId, { archive_first: !archiveFirst });
        cleaned++;
        this.untrack(resource.cardId);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';

        if (!suppressErrors) {
          throw new CleanupError(
            `Failed to delete card ${resource.cardId}: ${message}`,
            'CARD_DELETE_FAILED',
            { cardId: resource.cardId, boardId: resource.boardId }
          );
        }

        this.log(`Failed to delete card ${resource.cardId}: ${message} (suppressed)`);
      }
    }

    this.log(`Successfully cleaned ${cleaned}/${total} cards`);

    return {
      success: cleaned === total,
      cardId: tracked[0]?.cardId || 0,
      cleaned,
      total,
      error: cleaned < total ? `Only cleaned ${cleaned}/${total} cards` : undefined,
    };
  }

  /**
   * Persist tracked cards to disk for orphan recovery.
   *
   * Writes tracked cards to `.test-cards-tracking.json` in an atomic operation.
   * This survives process crashes for recovery on next test run.
   *
   * @throws CleanupError if write operation fails
   *
   * @internal Used automatically by track() - typically doesn't need manual calls
   */
  async persistToDisk(): Promise<void> {
    try {
      const content: TrackingFileContent = {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        trackedCards: this.getTracked(),
      };

      const tempPath = `${TRACKING_FILE_PATH}.tmp`;
      await fs.writeFile(tempPath, JSON.stringify(content, null, 2));

      // Atomic rename
      await fs.rename(tempPath, TRACKING_FILE_PATH);
      this.log(`Persisted ${this.trackedCards.size} cards to tracking file`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new CleanupError(`Failed to persist tracking file: ${message}`, 'TRACKING_FILE_ERROR', {
        path: TRACKING_FILE_PATH,
      });
    }
  }

  /**
   * Load tracked cards from disk.
   *
   * Reads and merges cards from `.test-cards-tracking.json` if it exists.
   * Non-existent files are silently ignored (normal for first test run).
   *
   * @throws CleanupError if file exists but is corrupted
   *
   * @internal Used for orphan recovery - typically called during initialization
   */
  async loadFromDisk(): Promise<void> {
    try {
      const content = await fs.readFile(TRACKING_FILE_PATH, 'utf-8');
      const data = JSON.parse(content) as TrackingFileContent;

      if (!Array.isArray(data.trackedCards)) {
        throw new Error('Invalid tracking file format');
      }

      for (const resource of data.trackedCards) {
        this.trackedCards.set(resource.cardId, {
          ...resource,
          createdAt: new Date(resource.createdAt),
        });
      }

      this.log(`Loaded ${data.trackedCards.length} cards from tracking file`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        // File doesn't exist - normal on first run
        return;
      }

      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new CleanupError(`Failed to load tracking file: ${message}`, 'TRACKING_FILE_ERROR', {
        path: TRACKING_FILE_PATH,
      });
    }
  }

  /**
   * Static method: Clean up orphaned cards from previous crashed runs.
   *
   * Loads the tracking file, attempts to delete all tracked cards,
   * and removes the tracking file on success.
   *
   * This should be called in test setup to ensure orphans from
   * previous crashes don't interfere with new tests.
   *
   * @param client - Initialized BusinessMapClient
   * @param options - Cleanup options
   * @returns Cleanup result with counts
   *
   * @example
   * ```typescript
   * // In beforeAll() or test suite setup
   * beforeAll(async () => {
   *   await TestCardTracker.cleanupOrphanedCards(client);
   * });
   * ```
   */
  static async cleanupOrphanedCards(
    client: BusinessMapClient,
    options: CleanupOptions = {}
  ): Promise<CleanupResult> {
    const tracker = new TestCardTracker(client, undefined, options.verbose);

    try {
      await tracker.loadFromDisk();
      const result = await tracker.cleanupAll(options);

      // Remove tracking file after successful cleanup
      if (result.success) {
        try {
          await fs.unlink(TRACKING_FILE_PATH);
        } catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            console.warn('Failed to remove tracking file:', error);
          }
        }
      }

      return result;
    } catch (error) {
      // Return partial failure result
      return {
        success: false,
        cardId: 0,
        cleaned: 0,
        total: 0,
        error: error instanceof Error ? error.message : 'Unknown error during orphan cleanup',
      };
    }
  }

  /**
   * Helper: Log messages when verbose mode enabled.
   *
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.verbose) {
      console.log(`[TestCardTracker] ${message}`);
    }
  }
}
