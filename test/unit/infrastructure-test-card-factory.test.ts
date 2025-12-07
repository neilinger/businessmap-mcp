/**
 * Unit Tests for Test Card Factory Infrastructure
 *
 * Tests the factory, tracker, and error handling without requiring live API.
 * Uses mock objects to verify core functionality.
 *
 * Run with:
 * npm run test:unit -- --testPathPattern="infrastructure-test-card-factory"
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  TestCardFactory,
  TestCardTracker,
  BoardDiscoveryError,
  CardCreationError,
  CleanupError,
  isTestSetupError,
  isBoardDiscoveryError,
  isCardCreationError,
} from '../integration/infrastructure/test-card-factory/index.js';

describe('Test Card Factory Infrastructure', () => {
  // Mock client
  const createMockClient = () =>
    ({
      getBoards: jest.fn(),
      getColumns: jest.fn(),
      getLanes: jest.fn(),
      getCard: jest.fn(),
      createCard: jest.fn(),
      updateCard: jest.fn(),
      deleteCard: jest.fn(),
      initialize: jest.fn(),
    }) as any;

  describe('Error Classes', () => {
    it('should create TestSetupError with code and context', () => {
      const error = new BoardDiscoveryError('Board not found', 'BOARD_NOT_FOUND', {
        boardsSearched: 5,
      });

      expect(error.message).toBe('Board not found');
      expect(error.code).toBe('BOARD_NOT_FOUND');
      expect(error.context).toEqual({ boardsSearched: 5 });
      expect(error.name).toBe('BoardDiscoveryError');
    });

    it('should support type guards for error checking', () => {
      const boardError = new BoardDiscoveryError('Board failed', 'BOARD_NOT_FOUND');
      const cardError = new CardCreationError('Card failed', 'CARD_FAILED');
      const regularError = new Error('Regular error');

      expect(isBoardDiscoveryError(boardError)).toBe(true);
      expect(isCardCreationError(cardError)).toBe(true);
      expect(isTestSetupError(boardError)).toBe(true);
      expect(isTestSetupError(regularError)).toBe(false);
    });

    it('should preserve error prototype chain', () => {
      const error = new CleanupError('Cleanup failed', 'CLEANUP_FAILED');
      expect(error instanceof CleanupError).toBe(true);
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('TestCardFactory', () => {
    let mockClient: any;
    let factory: TestCardFactory;

    beforeEach(() => {
      mockClient = createMockClient();
      factory = new TestCardFactory(mockClient);
    });

    it('should create factory with optional isolation prefix', () => {
      const f1 = new TestCardFactory(mockClient);
      const f2 = new TestCardFactory(mockClient, 'test-prefix');

      expect(f1).toBeDefined();
      expect(f2).toBeDefined();
    });

    it('should discover board with valid structure', async () => {
      mockClient.getBoards.mockResolvedValue([{ board_id: 123, name: 'Test Board' }]);
      mockClient.getColumns.mockResolvedValue([{ column_id: 456, name: 'Column 1' }]);
      mockClient.getLanes.mockResolvedValue([{ lane_id: 789, name: 'Lane 1' }]);

      const board = await factory.discoverBoard({ boardId: 123 });

      expect(board.boardId).toBe(123);
      expect(board.columnId).toBe(456);
      expect(board.laneId).toBe(789);
    });

    it('should throw BoardDiscoveryError when no boards found', async () => {
      mockClient.getBoards.mockResolvedValue([]);

      await expect(factory.discoverBoard()).rejects.toThrow(BoardDiscoveryError);
      await expect(factory.discoverBoard()).rejects.toThrow('No accessible boards found');
    });

    it('should throw BoardDiscoveryError when board lacks columns', async () => {
      mockClient.getBoards.mockResolvedValue([{ board_id: 123, name: 'Bad Board' }]);
      mockClient.getColumns.mockResolvedValue([]);
      mockClient.getLanes.mockResolvedValue([]);

      let thrown = false;
      try {
        await factory.discoverBoard({}, { includeLane: false });
      } catch (error) {
        thrown = true;
        expect(error).toBeInstanceOf(BoardDiscoveryError);
        expect((error as BoardDiscoveryError).code).toBe('BOARD_STRUCTURE_MISSING');
      }
      expect(thrown).toBe(true);
    });

    it('should discover by board name (string)', async () => {
      mockClient.getBoards.mockResolvedValue([
        { board_id: 123, name: 'fimancia' },
        { board_id: 456, name: 'other' },
      ]);
      mockClient.getColumns.mockResolvedValue([{ column_id: 789, name: 'Col' }]);
      mockClient.getLanes.mockResolvedValue([]);

      const board = await factory.discoverBoard({ boardName: 'fimancia' }, { includeLane: false });

      expect(board.boardId).toBe(123);
      expect(board.boardName).toBe('fimancia');
    });

    it('should discover by board name (regex)', async () => {
      mockClient.getBoards.mockResolvedValue([
        { board_id: 123, name: 'test-board-1' },
        { board_id: 456, name: 'prod-board' },
      ]);
      mockClient.getColumns.mockResolvedValue([{ column_id: 789, name: 'Col' }]);
      mockClient.getLanes.mockResolvedValue([]);

      const board = await factory.discoverBoard(
        { boardName: /^test-board-/ },
        { includeLane: false }
      );

      expect(board.boardId).toBe(123);
    });

    it('should create card in discovered board', async () => {
      const boardContext = {
        boardId: 123,
        boardName: 'Test',
        columnId: 456,
        columnName: 'Col',
        laneId: 789,
        laneName: 'Lane',
      };

      mockClient.createCard.mockResolvedValue({ card_id: 999 });

      const cardId = await factory.createCard(boardContext, {
        title: 'Test Card',
        includeLane: true,
      });

      expect(cardId).toBe(999);
      expect(mockClient.createCard).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Card',
          column_id: 456,
          lane_id: 789,
        })
      );
    });

    it('should throw CardCreationError on invalid response', async () => {
      const boardContext = {
        boardId: 123,
        boardName: 'Test',
        columnId: 456,
        columnName: 'Col',
      };

      mockClient.createCard.mockResolvedValue({ invalid: 'response' });

      await expect(factory.createCard(boardContext)).rejects.toThrow(CardCreationError);
    });

    it('should track created cards for cleanup', async () => {
      mockClient.getBoards.mockResolvedValue([{ board_id: 123, name: 'Test' }]);
      mockClient.getColumns.mockResolvedValue([{ column_id: 456, name: 'Col' }]);
      mockClient.getLanes.mockResolvedValue([]);
      mockClient.createCard.mockResolvedValue({ card_id: 999 });

      const result = await factory.discoverAndCreateCard({ includeLane: false });

      expect(result.cardId).toBe(999);
      expect(result.isNewCard).toBe(true);
      expect(result.metadata.boardsSearched).toBeGreaterThan(0);
    });

    it('should support pre-configured card ID via environment variable', async () => {
      // Set env var
      const originalEnv = process.env.TEST_CARD;
      process.env.TEST_CARD = '555';

      try {
        mockClient.getCard.mockResolvedValue({ card_id: 555 });
        mockClient.getBoards.mockResolvedValue([{ board_id: 123, name: 'Test' }]);
        mockClient.getColumns.mockResolvedValue([{ column_id: 456, name: 'Col' }]);
        mockClient.getLanes.mockResolvedValue([]);

        const result = await factory.discoverAndCreateCard({
          testCardIdEnvVar: 'TEST_CARD',
          includeLane: false,
        });

        expect(result.cardId).toBe(555);
        expect(result.isNewCard).toBe(false);
      } finally {
        // Restore env
        if (originalEnv === undefined) {
          delete process.env.TEST_CARD;
        } else {
          process.env.TEST_CARD = originalEnv;
        }
      }
    });

    it('should get tracked cards', async () => {
      const boardContext = {
        boardId: 123,
        boardName: 'Test',
        columnId: 456,
        columnName: 'Col',
      };

      mockClient.createCard.mockResolvedValue({ card_id: 999 });

      await factory.createCard(boardContext);
      const tracked = factory.getTrackedCards();

      expect(tracked).toHaveLength(1);
      expect(tracked[0]?.cardId).toBe(999);
      expect(tracked[0]?.boardId).toBe(123);
    });
  });

  describe('TestCardTracker', () => {
    let mockClient: any;
    let tracker: TestCardTracker;

    beforeEach(() => {
      mockClient = createMockClient();
      tracker = new TestCardTracker(mockClient, 'test-prefix');
    });

    it('should track and untrack cards', () => {
      tracker.track(123, 456);
      expect(tracker.isTracked(123)).toBe(true);

      tracker.untrack(123);
      expect(tracker.isTracked(123)).toBe(false);
    });

    it('should get tracked cards', () => {
      tracker.track(123, 456);
      tracker.track(789, 456);

      const tracked = tracker.getTracked();
      expect(tracked).toHaveLength(2);
      expect(tracked.map((r) => r.cardId)).toEqual([123, 789]);
    });

    it('should cleanup tracked cards', async () => {
      tracker.track(123, 456);
      mockClient.deleteCard.mockResolvedValue({});

      const result = await tracker.cleanupAll({ suppressErrors: true });

      expect(result.cleaned).toBe(1);
      expect(result.total).toBe(1);
      expect(mockClient.deleteCard).toHaveBeenCalledWith(123, expect.any(Object));
    });

    it('should archive before deleting if specified', async () => {
      tracker.track(123, 456);
      mockClient.updateCard.mockResolvedValue({});
      mockClient.deleteCard.mockResolvedValue({});

      await tracker.cleanupAll({ archiveFirst: true, suppressErrors: true });

      expect(mockClient.updateCard).toHaveBeenCalledWith(
        expect.objectContaining({
          card_id: 123,
          is_archived: 1,
        })
      );
    });

    it('should include isolation prefix in tracked resources', () => {
      const prefixedTracker = new TestCardTracker(mockClient, 'test-123');
      prefixedTracker.track(456, 789);

      const tracked = prefixedTracker.getTracked();
      expect(tracked[0]?.isolationPrefix).toBe('test-123');
    });

    it('should suppress errors during cleanup if requested', async () => {
      tracker.track(123, 456);
      mockClient.deleteCard.mockRejectedValue(new Error('Delete failed'));

      const result = await tracker.cleanupAll({ suppressErrors: true });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      // Should not throw
    });

    it('should throw CleanupError if suppressErrors is false', async () => {
      tracker.track(123, 456);
      mockClient.deleteCard.mockRejectedValue(new Error('Delete failed'));

      await expect(tracker.cleanupAll({ suppressErrors: false })).rejects.toThrow(CleanupError);
    });
  });

  describe('Quick-start helpers', () => {
    it('should export setupTestCard function', async () => {
      const mockClient = createMockClient();
      mockClient.getBoards.mockResolvedValue([{ board_id: 123, name: 'Test' }]);
      mockClient.getColumns.mockResolvedValue([{ column_id: 456, name: 'Col' }]);
      mockClient.getLanes.mockResolvedValue([]);
      mockClient.createCard.mockResolvedValue({ card_id: 999 });

      const { setupTestCard } = await import(
        '../integration/infrastructure/test-card-factory/index.js'
      );
      const result = await setupTestCard(mockClient, { includeLane: false });

      expect(result.cardId).toBe(999);
    });

    it('should export cleanupTestCard function', async () => {
      const mockClient = createMockClient();
      mockClient.deleteCard.mockResolvedValue({});

      const { cleanupTestCard } = await import(
        '../integration/infrastructure/test-card-factory/index.js'
      );
      await cleanupTestCard(mockClient, 123, 456, { suppressErrors: true });

      expect(mockClient.deleteCard).toHaveBeenCalledWith(123, expect.any(Object));
    });

    it('should export cleanupOrphanedCards function', async () => {
      const mockClient = createMockClient();
      const { cleanupOrphanedCards } = await import(
        '../integration/infrastructure/test-card-factory/index.js'
      );

      // Should not throw even if no tracking file exists
      const result = await cleanupOrphanedCards(mockClient);
      expect(result).toBeDefined();
    });
  });
});
