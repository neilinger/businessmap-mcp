/**
 * Test Card Tracker for resource cleanup.
 *
 * Provides in-memory tracking of created test cards for coordinated cleanup
 * in beforeEach/afterEach scenarios.
 *
 * @module test-card-factory/tracker
 */

/* eslint-disable no-console */

import { BusinessMapClient } from '../../../../src/client/businessmap-client.js';
import { CleanupOptions, CleanupResult, TrackedResource } from './types.js';
import { CleanupError } from './errors.js';

/**
 * TestCardTracker manages in-memory tracking and cleanup of test cards.
 *
 * Features:
 * - Tracks created cards in memory
 * - Integration with before/afterEach and before/afterAll hooks
 * - Isolation prefix support for concurrent test safety
 *
 * @example
 * ```typescript
 * // In beforeEach/afterEach for isolation
 * const tracker = new TestCardTracker(client, `test-${Date.now()}`);
 *
 * // Track a created card
 * tracker.track(cardId, boardId);
 *
 * // Clean up in afterEach
 * await tracker.cleanupAll();
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
   * @param cardId - Card ID to track
   * @param boardId - Board ID containing the card
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
