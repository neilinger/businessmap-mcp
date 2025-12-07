/**
 * Test Card Factory for board discovery and card creation.
 *
 * Provides intelligent board discovery with column/lane validation,
 * automatic test card creation, and integrated cleanup support.
 *
 * @module test-card-factory/factory
 */

/* eslint-disable no-console */

import { BusinessMapClient } from '../../../../src/client/businessmap-client.js';
import { CreateCardParams } from '../../../../src/types/index.js';
import {
  BoardIdentifier,
  CleanupOptions,
  TestBoardContext,
  TestCardOptions,
  TestCardResult,
} from './types.js';
import { BoardDiscoveryError, CardCreationError } from './errors.js';
import { TestCardTracker } from './tracker.js';

/**
 * TestCardFactory handles test card setup, discovery, and cleanup.
 *
 * Features:
 * - Hybrid board discovery (by ID or name/regex)
 * - Column and lane validation
 * - Automatic test card creation with retries
 * - Optional pre-configured card ID support
 * - Support for beforeEach/afterEach AND beforeAll/afterAll patterns
 * - Concurrent test isolation via prefix
 * - Built-in resource tracking and cleanup
 * - Verbose logging for debugging
 *
 * @example
 * ```typescript
 * // Setup in beforeEach for isolation
 * const factory = new TestCardFactory(client, `test-${Date.now()}`);
 * const { cardId, boardId, columnId } = await factory.createTestCard({
 *   includeLane: true,
 * });
 *
 * // Cleanup in afterEach
 * await factory.cleanupAllTrackedCards();
 * ```
 *
 * @example
 * ```typescript
 * // Setup in beforeAll for shared resources
 * const factory = new TestCardFactory(client);
 * const board = await factory.discoverBoard({ boardName: 'fimancia' });
 * const cardId = await factory.createCard({
 *   ...board,
 *   title: 'Shared test card',
 * });
 * ```
 */
export class TestCardFactory {
  private client: BusinessMapClient;
  private isolationPrefix?: string;
  private verbose: boolean = false;
  private tracker: TestCardTracker;

  /**
   * Create a new TestCardFactory instance.
   *
   * @param client - Initialized BusinessMapClient for API operations
   * @param isolationPrefix - Optional prefix for concurrent test isolation (e.g., test run ID)
   * @param verbose - Enable verbose logging for debugging
   *
   * @example
   * ```typescript
   * const factory = new TestCardFactory(client, `test-${Date.now()}`);
   * ```
   */
  constructor(client: BusinessMapClient, isolationPrefix?: string, verbose: boolean = false) {
    this.client = client;
    this.isolationPrefix = isolationPrefix;
    this.verbose = verbose;
    this.tracker = new TestCardTracker(client, isolationPrefix, verbose);
  }

  /**
   * Discover board structure with validation.
   *
   * Supports hybrid discovery by board ID, exact name, or regex pattern.
   * Validates board has required structure (columns and optionally lanes).
   *
   * @param identifier - Board ID, name, or regex pattern for discovery
   * @param options - Discovery options (includeLane, verbose)
   * @returns Board context with column and lane information
   *
   * @throws BoardDiscoveryError if no suitable board found
   *
   * @example
   * ```typescript
   * // By board ID
   * const board = await factory.discoverBoard({ boardId: 123 });
   *
   * // By exact name
   * const board = await factory.discoverBoard({ boardName: 'fimancia' });
   *
   * // By regex pattern
   * const board = await factory.discoverBoard({
   *   boardName: /^test-board-\d+$/,
   * });
   * ```
   */
  async discoverBoard(
    identifier: BoardIdentifier = {},
    options: { includeLane?: boolean; verbose?: boolean } = {}
  ): Promise<TestBoardContext> {
    const startTime = performance.now();
    const includeLane = options.includeLane !== false;
    this.verbose = options.verbose || false;

    this.log('Discovering board structure...');

    const boards = await this.client.getBoards({ if_assigned: 1 });

    if (!boards || boards.length === 0) {
      throw new BoardDiscoveryError(
        'No accessible boards found. Ensure you have board access.',
        'NO_ACCESSIBLE_BOARDS',
        { boardsSearched: 0 }
      );
    }

    this.log(`Found ${boards.length} accessible boards`);

    // Filter boards by identifier if specified
    let candidateBoards = boards;
    if (identifier.boardId) {
      candidateBoards = boards.filter((b) => b.board_id === identifier.boardId);
      this.log(`Filtered to board ${identifier.boardId}`);
    } else if (identifier.boardName) {
      if (typeof identifier.boardName === 'string') {
        candidateBoards = boards.filter((b) => b.name === identifier.boardName);
        this.log(`Filtered by exact name: ${identifier.boardName}`);
      } else {
        // RegExp - use type assertion
        const pattern = identifier.boardName as RegExp;
        candidateBoards = boards.filter((b) => pattern.test(b.name || ''));
        this.log(`Filtered by pattern: ${pattern}`);
      }
    }

    if (candidateBoards.length === 0) {
      throw new BoardDiscoveryError(
        `No board found matching identifier: ${JSON.stringify(identifier)}`,
        'BOARD_NOT_FOUND',
        { identifier, boardsSearched: boards.length }
      );
    }

    let boardsSearched = 0;
    for (const board of candidateBoards) {
      boardsSearched++;

      try {
        this.log(`Trying board ${board.board_id} (${board.name})...`);

        const columns = await this.client.getColumns(board.board_id || 0);
        const lanes = includeLane ? await this.client.getLanes(board.board_id || 0) : [];

        if (columns && columns.length > 0 && (!includeLane || (lanes && lanes.length > 0))) {
          const column = columns[0];
          const lane = lanes?.[0];

          if (!column) {
            continue;
          }

          this.log(
            `Found suitable board: column ${column.column_id}, ${
              includeLane ? `lane ${lane?.lane_id}` : 'no lane required'
            }`
          );

          const duration = performance.now() - startTime;
          this.log(`Board discovery completed in ${duration.toFixed(0)}ms`);

          return {
            boardId: board.board_id || 0,
            boardName: board.name || 'unnamed',
            columnId: column.column_id || 0,
            columnName: column.name || 'untitled',
            ...(includeLane && lane?.lane_id && { laneId: lane.lane_id }),
            ...(includeLane && lane?.name && { laneName: lane.name }),
          };
        } else {
          this.log(
            `Board ${board.board_id} lacks ${!columns || columns.length === 0 ? 'columns' : 'lanes'}`
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown error';
        this.log(`Board ${board.board_id} discovery error: ${message}`);
      }
    }

    throw new BoardDiscoveryError(
      `No board with required structure found (searched ${boardsSearched} boards). ` +
        `${includeLane ? 'Need columns AND lanes.' : 'Need columns.'}`,
      'BOARD_STRUCTURE_MISSING',
      {
        boardsSearched,
        identifier,
        requiresLanes: includeLane,
      }
    );
  }

  /**
   * Create a test card in specified board structure.
   *
   * Creates a card with optional lane inclusion and auto-tracks it for cleanup.
   *
   * @param context - Board context from discoverBoard()
   * @param options - Card creation options (title, description, includeLane)
   * @returns Created card ID
   *
   * @throws CardCreationError if card creation fails
   *
   * @example
   * ```typescript
   * const board = await factory.discoverBoard();
   * const cardId = await factory.createCard(board, {
   *   title: 'My test card',
   *   includeLane: true,
   * });
   * ```
   */
  async createCard(
    context: TestBoardContext,
    options: { title?: string; description?: string; includeLane?: boolean } = {}
  ): Promise<number> {
    const startTime = performance.now();

    const title = options.title || `[Test] Card ${Date.now()}`;
    const description = options.description || 'Automated test card';

    this.log(`Creating test card: "${title}"`);

    const createParams: Partial<CreateCardParams> = {
      title,
      description,
      column_id: context.columnId,
    };

    if (options.includeLane !== false && context.laneId) {
      createParams.lane_id = context.laneId;
    }

    const response = await this.client.createCard(createParams as CreateCardParams);

    // Handle both array and single object responses
    const card = Array.isArray(response) ? response[0] : response;

    if (!card || !card.card_id) {
      throw new CardCreationError('Card creation returned invalid response', 'INVALID_RESPONSE', {
        boardId: context.boardId,
        columnId: context.columnId,
      });
    }

    const duration = performance.now() - startTime;
    this.log(`Created card ${card.card_id} in ${duration.toFixed(0)}ms`);

    // Track for cleanup
    this.tracker.track(card.card_id, context.boardId);

    return card.card_id;
  }

  /**
   * Discover board and create test card in one operation.
   *
   * Primary workflow for most tests: discover board structure,
   * verify card is accessible, and return complete setup.
   *
   * Supports pre-configured card ID via environment variable.
   *
   * @param options - Configuration options
   * @returns Complete test card setup with metadata
   *
   * @throws BoardDiscoveryError if board discovery fails
   * @throws CardCreationError if card creation fails
   *
   * @example
   * ```typescript
   * const { cardId, boardId, columnId, laneId } = await factory.discoverAndCreateCard({
   *   includeLane: true,
   *   preferredBoardName: 'fimancia',
   * });
   * ```
   */
  async discoverAndCreateCard(options: TestCardOptions = {}): Promise<TestCardResult> {
    const startTime = performance.now();
    const envVar = options.testCardIdEnvVar || 'BUSINESSMAP_TEST_CARD_ID';
    const includeLane = options.includeLane !== false;
    this.verbose = options.verbose || false;

    // Try pre-configured card ID first
    const envCardId = process.env[envVar];
    if (envCardId) {
      const cardId = parseInt(envCardId, 10);
      if (!isNaN(cardId)) {
        this.log(`Checking provided test card ID: ${cardId}`);

        try {
          // Verify card is accessible
          await this.client.getCard(cardId);
          this.log(`Verified test card ${cardId} is accessible`);

          // Discover board structure for context
          const board = await this.discoverBoard(
            { boardName: options.preferredBoardName },
            { includeLane }
          );

          const duration = performance.now() - startTime;
          return {
            cardId,
            boardId: board.boardId,
            columnId: board.columnId,
            laneId: board.laneId,
            isNewCard: false,
            metadata: {
              boardName: board.boardName,
              boardsSearched: 1,
              discoveryTimeMs: duration,
            },
          };
        } catch {
          this.log(`Provided card ${cardId} not accessible, proceeding with creation...`);
        }
      }
    }

    // Discover and create card
    const board = await this.discoverBoard(
      { boardName: options.preferredBoardName },
      { includeLane }
    );
    const cardId = await this.createCard(board, {
      title: options.title,
      description: options.description,
      includeLane,
    });

    const duration = performance.now() - startTime;

    return {
      cardId,
      boardId: board.boardId,
      columnId: board.columnId,
      laneId: board.laneId,
      isNewCard: true,
      metadata: {
        boardName: board.boardName,
        boardsSearched: 1,
        discoveryTimeMs: duration,
      },
    };
  }

  /**
   * Create multiple test cards efficiently.
   *
   * Reuses board discovery for better performance than creating cards individually.
   *
   * @param count - Number of cards to create
   * @param options - Creation options
   * @returns Array of created card IDs
   *
   * @throws BoardDiscoveryError if board discovery fails
   * @throws CardCreationError if any card creation fails
   *
   * @example
   * ```typescript
   * const cardIds = await factory.createMultipleCards(5, {
   *   includeLane: true,
   * });
   * ```
   */
  async createMultipleCards(count: number, options: TestCardOptions = {}): Promise<number[]> {
    const includeLane = options.includeLane !== false;

    this.log(`Creating ${count} test cards...`);
    const board = await this.discoverBoard(
      { boardName: options.preferredBoardName },
      { includeLane }
    );

    const cardIds: number[] = [];
    for (let i = 0; i < count; i++) {
      const cardId = await this.createCard(board, {
        title: options.title || `[Test] Card ${i + 1} ${Date.now()}`,
        description: options.description,
        includeLane,
      });
      cardIds.push(cardId);

      // Small delay to avoid rate limiting
      if (i < count - 1) {
        await this.sleep(100);
      }
    }

    return cardIds;
  }

  /**
   * Clean up all tracked cards created by this factory.
   *
   * Useful in afterEach/afterAll hooks for resource cleanup.
   * Failures are suppressed by default to ensure cleanup continues.
   *
   * @param options - Cleanup options
   * @returns Cleanup result with success status and counts
   *
   * @example
   * ```typescript
   * afterEach(async () => {
   *   await factory.cleanupAllTrackedCards({
   *     archiveFirst: true,
   *     suppressErrors: true,
   *   });
   * });
   * ```
   */
  async cleanupAllTrackedCards(options: CleanupOptions = {}): Promise<number> {
    const result = await this.tracker.cleanupAll(options);
    return result.cleaned;
  }

  /**
   * Get list of currently tracked cards.
   *
   * Useful for debugging or external coordination.
   *
   * @returns Array of tracked card information
   */
  getTrackedCards() {
    return this.tracker.getTracked();
  }

  /**
   * Clear tracking without cleanup.
   *
   * Use cautiously - only if you've manually cleaned up resources.
   */
  clearTracking(): void {
    this.log('Clearing tracking');
    this.tracker.getTracked().forEach((r) => {
      this.tracker.untrack(r.cardId);
    });
  }

  /**
   * Helper: Log messages when verbose mode enabled.
   *
   * @param message - Message to log
   */
  private log(message: string): void {
    if (this.verbose) {
      const prefix = this.isolationPrefix ? `[${this.isolationPrefix}] ` : '';
      console.log(`[TestCardFactory] ${prefix}${message}`);
    }
  }

  /**
   * Helper: Sleep for specified milliseconds.
   *
   * @param ms - Milliseconds to sleep
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
