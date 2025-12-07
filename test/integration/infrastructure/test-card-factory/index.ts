/**
 * Test Card Factory Infrastructure Module
 *
 * Complete test setup infrastructure for creating, tracking, and cleaning up
 * test cards in integration tests.
 *
 * This modular design separates concerns:
 * - `types.ts` - Type definitions for board discovery and card management
 * - `errors.ts` - Custom error classes following project patterns
 * - `tracker.ts` - Persistent resource tracking with orphan recovery
 * - `factory.ts` - Main factory for board discovery and card creation
 *
 * @module test-card-factory
 *
 * @example
 * ```typescript
 * import {
 *   TestCardFactory,
 *   TestCardTracker,
 *   BoardDiscoveryError,
 * } from './test-card-factory';
 *
 * // Create factory with isolation prefix for concurrent safety
 * const factory = new TestCardFactory(client, `test-${Date.now()}`);
 *
 * // Discover board and create card
 * const { cardId, boardId } = await factory.discoverAndCreateCard({
 *   includeLane: true,
 * });
 *
 * // Clean up after test
 * await factory.cleanupAllTrackedCards({ archiveFirst: true });
 * ```
 *
 * @example
 * ```typescript
 * import { TestCardTracker } from './test-card-factory';
 *
 * // Cleanup orphaned cards from previous crashes
 * beforeAll(async () => {
 *   await TestCardTracker.cleanupOrphanedCards(client);
 * });
 * ```
 */

// Export types
export type {
  BoardIdentifier,
  TestCardOptions,
  TestBoardContext,
  TestCardResult,
  CleanupResult,
  CleanupOptions,
  TrackedResource,
} from './types.js';

// Export custom errors
export {
  TestSetupError,
  BoardDiscoveryError,
  CardCreationError,
  CleanupError,
  isTestSetupError,
  isBoardDiscoveryError,
  isCardCreationError,
  isCleanupError,
} from './errors.js';

// Export tracker
export { TestCardTracker } from './tracker.js';

// Export factory
export { TestCardFactory } from './factory.js';

// Quick-start helpers
import { BusinessMapClient } from '../../../../src/client/businessmap-client.js';
import { TestCardFactory } from './factory.js';
import { TestCardOptions, TestCardResult } from './types.js';
import { TestCardTracker } from './tracker.js';
import { CleanupOptions } from './types.js';

/**
 * Quick start: Create factory and get test card in one call.
 *
 * Convenience function for tests that need a simple setup pattern.
 *
 * @param client - Initialized BusinessMapClient
 * @param options - Configuration options
 * @returns Test card result with all needed IDs
 *
 * @example
 * ```typescript
 * const { cardId, boardId, columnId, laneId } = await setupTestCard(client, {
 *   includeLane: true,
 * });
 * ```
 */
export async function setupTestCard(
  client: BusinessMapClient,
  options: TestCardOptions = {}
): Promise<TestCardResult> {
  const factory = new TestCardFactory(client, undefined, options.verbose);
  return factory.discoverAndCreateCard(options);
}

/**
 * Quick cleanup helper for single card.
 *
 * Convenience function for simple card cleanup scenarios.
 *
 * @param client - Initialized BusinessMapClient
 * @param cardId - Card ID to delete
 * @param boardId - Board ID containing card
 * @param options - Cleanup options
 *
 * @example
 * ```typescript
 * await cleanupTestCard(client, cardId, boardId, { archiveFirst: true });
 * ```
 */
export async function cleanupTestCard(
  client: BusinessMapClient,
  cardId: number,
  boardId: number,
  options: CleanupOptions = {}
): Promise<void> {
  const tracker = new TestCardTracker(client, undefined, options.verbose);
  tracker.track(cardId, boardId);
  await tracker.cleanupAll(options);
}

/**
 * Cleanup orphaned cards from previous test runs.
 *
 * Should be called in beforeAll() to ensure previous crash-orphans
 * don't interfere with new tests.
 *
 * @param client - Initialized BusinessMapClient
 * @param options - Cleanup options
 *
 * @example
 * ```typescript
 * beforeAll(async () => {
 *   await cleanupOrphanedCards(client);
 * });
 * ```
 */
export async function cleanupOrphanedCards(
  client: BusinessMapClient,
  options: CleanupOptions = {}
) {
  return TestCardTracker.cleanupOrphanedCards(client, options);
}
