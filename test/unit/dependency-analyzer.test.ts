/**
 * Unit tests for DependencyAnalyzer nameMap extraction
 * Tests Issue #7 fix: Eliminate read-after-delete API calls
 */

import { DependencyAnalyzer } from '../../src/services/dependency-analyzer';
import { BusinessMapClient } from '../../src/client/businessmap-client';

// Mock BusinessMapClient
jest.mock('../../src/client/businessmap-client');

describe('DependencyAnalyzer - nameMap extraction', () => {
  let analyzer: DependencyAnalyzer;
  let mockClient: jest.Mocked<BusinessMapClient>;

  beforeEach(() => {
    mockClient = new BusinessMapClient({
      apiUrl: 'https://test.com',
      apiToken: 'test-token',
    }) as jest.Mocked<BusinessMapClient>;
    analyzer = new DependencyAnalyzer(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeWorkspaces', () => {
    it('should extract workspace names into nameMap', async () => {
      // Arrange
      const workspaceIds = [1, 2, 3];
      mockClient.getWorkspace = jest.fn()
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Workspace Alpha' })
        .mockResolvedValueOnce({ workspace_id: 2, name: 'Workspace Beta' })
        .mockResolvedValueOnce({ workspace_id: 3, name: 'Workspace Gamma' });

      mockClient.getBoards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      expect(result.nameMap).toBeInstanceOf(Map);
      expect(result.nameMap.size).toBe(3);
      expect(result.nameMap.get(1)).toBe('Workspace Alpha');
      expect(result.nameMap.get(2)).toBe('Workspace Beta');
      expect(result.nameMap.get(3)).toBe('Workspace Gamma');
    });

    it('should handle missing workspaces with fallback names', async () => {
      // Arrange
      const workspaceIds = [1, 999];
      mockClient.getWorkspace = jest.fn()
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Valid Workspace' })
        .mockRejectedValueOnce(new Error('Workspace not found'));

      mockClient.getBoards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      expect(result.nameMap.get(1)).toBe('Valid Workspace');
      expect(result.nameMap.get(999)).toBe('Workspace 999'); // Fallback pattern
    });

    it('should extract names from empty workspace list', async () => {
      // Arrange
      const workspaceIds: number[] = [];

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      expect(result.nameMap.size).toBe(0);
      expect(result.resourcesWithDeps).toEqual([]);
      expect(result.resourcesWithoutDeps).toEqual([]);
    });
  });

  describe('analyzeBoards', () => {
    it('should extract board names into nameMap', async () => {
      // Arrange
      const boardIds = [10, 20, 30];
      mockClient.getBoard = jest.fn()
        .mockResolvedValueOnce({ board_id: 10, name: 'Board One' })
        .mockResolvedValueOnce({ board_id: 20, name: 'Board Two' })
        .mockResolvedValueOnce({ board_id: 30, name: 'Board Three' });

      mockClient.getCards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap).toBeInstanceOf(Map);
      expect(result.nameMap.size).toBe(3);
      expect(result.nameMap.get(10)).toBe('Board One');
      expect(result.nameMap.get(20)).toBe('Board Two');
      expect(result.nameMap.get(30)).toBe('Board Three');
    });

    it('should handle 404 errors with fallback names', async () => {
      // Arrange
      const boardIds = [10, 404];
      mockClient.getBoard = jest.fn()
        .mockResolvedValueOnce({ board_id: 10, name: 'Valid Board' })
        .mockRejectedValueOnce(new Error('404 Not Found'));

      mockClient.getCards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.get(10)).toBe('Valid Board');
      expect(result.nameMap.get(404)).toBe('Board 404'); // Fallback pattern
    });

    it('should extract names for boards with cards', async () => {
      // Arrange
      const boardIds = [10];
      mockClient.getBoard = jest.fn()
        .mockResolvedValueOnce({ board_id: 10, name: 'Active Board' });

      mockClient.getCards = jest.fn().mockResolvedValue([
        { card_id: 1, title: 'Card 1' },
        { card_id: 2, title: 'Card 2' },
      ]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.get(10)).toBe('Active Board');
      expect(result.resourcesWithDeps.length).toBe(1);
      expect(result.resourcesWithDeps[0]?.hasDependencies).toBe(true);
    });
  });

  describe('analyzeCards', () => {
    it('should extract card names (titles) into nameMap', async () => {
      // Arrange
      const cardIds = [100, 200, 300];
      mockClient.getCard = jest.fn()
        .mockResolvedValueOnce({ card_id: 100, title: 'Card Alpha' })
        .mockResolvedValueOnce({ card_id: 200, title: 'Card Beta' })
        .mockResolvedValueOnce({ card_id: 300, title: 'Card Gamma' });

      mockClient.getCardChildren = jest.fn().mockResolvedValue([]);
      mockClient.getCardComments = jest.fn().mockResolvedValue([]);
      mockClient.getCardSubtasks = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap).toBeInstanceOf(Map);
      expect(result.nameMap.size).toBe(3);
      expect(result.nameMap.get(100)).toBe('Card Alpha');
      expect(result.nameMap.get(200)).toBe('Card Beta');
      expect(result.nameMap.get(300)).toBe('Card Gamma');
    });

    it('should handle deleted cards with fallback names', async () => {
      // Arrange
      const cardIds = [100, 404];
      mockClient.getCard = jest.fn()
        .mockResolvedValueOnce({ card_id: 100, title: 'Valid Card' })
        .mockRejectedValueOnce(new Error('Card not found'));

      mockClient.getCardChildren = jest.fn().mockResolvedValue([]);
      mockClient.getCardComments = jest.fn().mockResolvedValue([]);
      mockClient.getCardSubtasks = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap.get(100)).toBe('Valid Card');
      expect(result.nameMap.get(404)).toBe('Card 404'); // Fallback pattern
    });

    it('should extract names for cards with children', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard = jest.fn()
        .mockResolvedValueOnce({ card_id: 100, title: 'Parent Card' });

      mockClient.getCardChildren = jest.fn().mockResolvedValue([
        { card_id: 101, title: 'Child Card 1' },
        { card_id: 102, title: 'Child Card 2' },
      ]);
      mockClient.getCardComments = jest.fn().mockResolvedValue([]);
      mockClient.getCardSubtasks = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap.get(100)).toBe('Parent Card');
      expect(result.resourcesWithDeps.length).toBe(1);
      expect(result.resourcesWithDeps[0]?.hasDependencies).toBe(true);
    });
  });

  describe('nameMap consistency', () => {
    it('should maintain nameMap consistency across mixed success/failure', async () => {
      // Arrange
      const boardIds = [1, 2, 3, 4, 5];
      mockClient.getBoard = jest.fn()
        .mockResolvedValueOnce({ board_id: 1, name: 'Board 1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ board_id: 3, name: 'Board 3' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ board_id: 5, name: 'Board 5' });

      mockClient.getCards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.size).toBe(5);
      expect(result.nameMap.get(1)).toBe('Board 1');
      expect(result.nameMap.get(2)).toBe('Board 2'); // Fallback
      expect(result.nameMap.get(3)).toBe('Board 3');
      expect(result.nameMap.get(4)).toBe('Board 4'); // Fallback
      expect(result.nameMap.get(5)).toBe('Board 5');
    });

    it('should include all requested IDs in nameMap even with partial failures', async () => {
      // Arrange
      const cardIds = [10, 20, 30];
      mockClient.getCard = jest.fn()
        .mockResolvedValueOnce({ card_id: 10, title: 'Success' })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('404'));

      mockClient.getCardChildren = jest.fn().mockResolvedValue([]);
      mockClient.getCardComments = jest.fn().mockResolvedValue([]);
      mockClient.getCardSubtasks = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap.size).toBe(3);
      expect(result.nameMap.has(10)).toBe(true);
      expect(result.nameMap.has(20)).toBe(true);
      expect(result.nameMap.has(30)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle undefined names gracefully', async () => {
      // Arrange
      const boardIds = [1];
      mockClient.getBoard = jest.fn()
        .mockResolvedValueOnce({ board_id: 1, name: undefined as any });

      mockClient.getCards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.has(1)).toBe(true);
      // Name should exist (even if undefined) to prevent re-fetch
    });

    it('should handle maximum bulk size (50 items)', async () => {
      // Arrange
      const cardIds = Array.from({ length: 50 }, (_, i) => i + 1);
      mockClient.getCard = jest.fn()
        .mockImplementation((id: number) =>
          Promise.resolve({ card_id: id, title: `Card ${id}` })
        );

      mockClient.getCardChildren = jest.fn().mockResolvedValue([]);
      mockClient.getCardComments = jest.fn().mockResolvedValue([]);
      mockClient.getCardSubtasks = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap.size).toBe(50);
      expect(result.nameMap.get(1)).toBe('Card 1');
      expect(result.nameMap.get(50)).toBe('Card 50');
    });

    it('should handle special characters in names', async () => {
      // Arrange
      const boardIds = [1];
      const specialName = 'Board: "Test" & <Special> \\Chars\\';
      mockClient.getBoard = jest.fn()
        .mockResolvedValueOnce({ board_id: 1, name: specialName });

      mockClient.getCards = jest.fn().mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.get(1)).toBe(specialName);
    });
  });
});
