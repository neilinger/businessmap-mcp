/**
 * Comprehensive unit tests for DependencyAnalyzer
 * Tests nameMap extraction, dependency analysis, and edge cases
 * Target: 80% code coverage
 */

// Import jest globals explicitly for ESM compatibility
import { jest } from '@jest/globals';

import { DependencyAnalyzer } from '../../src/services/dependency-analyzer';

describe('DependencyAnalyzer - Comprehensive Coverage', () => {
  let analyzer: DependencyAnalyzer;
  let mockClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockClient = {
      getWorkspace: jest.fn(),
      getBoards: jest.fn(),
      getBoard: jest.fn(),
      getCards: jest.fn(),
      getCard: jest.fn(),
      getCardChildren: jest.fn(),
      getCardComments: jest.fn(),
      getCardSubtasks: jest.fn(),
    };
    analyzer = new DependencyAnalyzer(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('analyzeWorkspaces', () => {
    it('should extract workspace names into nameMap', async () => {
      // Arrange
      const workspaceIds = [1, 2, 3];
      mockClient.getWorkspace
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Workspace Alpha' })
        .mockResolvedValueOnce({ workspace_id: 2, name: 'Workspace Beta' })
        .mockResolvedValueOnce({ workspace_id: 3, name: 'Workspace Gamma' });

      mockClient.getBoards.mockResolvedValue([]);

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
      mockClient.getWorkspace
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Valid Workspace' })
        .mockRejectedValueOnce(new Error('Workspace not found'));

      mockClient.getBoards.mockResolvedValue([]);

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

    it('should separate workspaces with and without dependencies', async () => {
      // Arrange
      const workspaceIds = [1, 2];
      mockClient.getWorkspace
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Workspace With Boards' })
        .mockResolvedValueOnce({ workspace_id: 2, name: 'Workspace Empty' });

      mockClient.getBoards
        .mockResolvedValueOnce([
          { board_id: 10, name: 'Board A' },
          { board_id: 11, name: 'Board B' },
        ])
        .mockResolvedValueOnce([]);

      mockClient.getCards.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      expect(result.resourcesWithDeps).toHaveLength(1);
      expect(result.resourcesWithDeps[0]).toMatchObject({
        id: 1,
        type: 'workspace',
        hasDependencies: true,
      });

      expect(result.resourcesWithoutDeps).toHaveLength(1);
      expect(result.resourcesWithoutDeps[0]).toMatchObject({
        id: 2,
        type: 'workspace',
        hasDependencies: false,
      });
    });

    it('should calculate correct total impact for workspaces with boards and cards', async () => {
      // Arrange
      const workspaceIds = [1];
      mockClient.getWorkspace.mockResolvedValueOnce({
        workspace_id: 1,
        name: 'Workspace Full',
      });

      mockClient.getBoards.mockResolvedValueOnce([
        { board_id: 10, name: 'Board A' },
        { board_id: 11, name: 'Board B' },
      ]);

      // getCards is called for each board to get card count (per_page: 1 means just get count)
      mockClient.getCards
        .mockResolvedValueOnce([
          { card_id: 100, title: 'Card 1' },
          { card_id: 101, title: 'Card 2' },
        ]) // Board 10 has 2 cards
        .mockResolvedValueOnce([{ card_id: 102, title: 'Card 3' }]); // Board 11 has 1 card

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      // Note: analyzeWorkspace reports board counts but NOT individual card counts in impact
      // Only analyzeBoard reports cards. This is by design - workspace analysis aggregates at board level
      expect(result.totalImpact.workspaces).toBe(1); // 1 workspace analyzed
      expect(result.totalImpact.boards).toBe(2); // 2 boards in that workspace
      expect(result.totalImpact.cards).toBe(0); // Cards not reported at workspace level
    });

    it('should include board details in dependents', async () => {
      // Arrange
      const workspaceIds = [1];
      mockClient.getWorkspace.mockResolvedValueOnce({
        workspace_id: 1,
        name: 'Workspace',
      });

      mockClient.getBoards.mockResolvedValueOnce([{ board_id: 10, name: 'Board A' }]);

      mockClient.getCards.mockResolvedValueOnce([
        { card_id: 100, title: 'Card 1' },
        { card_id: 101, title: 'Card 2' },
      ]);

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      const workspace = result.resourcesWithDeps[0];
      expect(workspace?.dependents).toHaveLength(1);
      expect(workspace?.dependents[0]).toMatchObject({
        type: 'board',
        count: 1,
      });
      expect(workspace?.dependents[0]?.items).toHaveLength(1);
      expect(workspace?.dependents[0]?.items?.[0]).toMatchObject({
        id: 10,
        name: 'Board A',
        additionalInfo: '2 cards',
      });
    });
  });

  describe('analyzeBoards', () => {
    it('should extract board names into nameMap', async () => {
      // Arrange
      const boardIds = [10, 20, 30];
      mockClient.getBoard
        .mockResolvedValueOnce({ board_id: 10, name: 'Board One' })
        .mockResolvedValueOnce({ board_id: 20, name: 'Board Two' })
        .mockResolvedValueOnce({ board_id: 30, name: 'Board Three' });

      mockClient.getCards.mockResolvedValue([]);

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
      mockClient.getBoard
        .mockResolvedValueOnce({ board_id: 10, name: 'Valid Board' })
        .mockRejectedValueOnce(new Error('404 Not Found'));

      mockClient.getCards.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.get(10)).toBe('Valid Board');
      expect(result.nameMap.get(404)).toBe('Board 404'); // Fallback pattern
    });

    it('should extract names for boards with cards', async () => {
      // Arrange
      const boardIds = [10];
      mockClient.getBoard.mockResolvedValueOnce({
        board_id: 10,
        name: 'Active Board',
      });

      mockClient.getCards.mockResolvedValue([
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

    it('should report correct card count in dependents', async () => {
      // Arrange
      const boardIds = [10];
      mockClient.getBoard.mockResolvedValueOnce({
        board_id: 10,
        name: 'Board with Cards',
      });

      mockClient.getCards.mockResolvedValue([
        { card_id: 1, title: 'Card 1' },
        { card_id: 2, title: 'Card 2' },
        { card_id: 3, title: 'Card 3' },
      ]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      const board = result.resourcesWithDeps[0];
      expect(board?.dependents).toHaveLength(1);
      expect(board?.dependents[0]).toMatchObject({
        type: 'card',
        count: 3,
      });
    });

    it('should separate boards with and without cards', async () => {
      // Arrange
      const boardIds = [10, 20];
      mockClient.getBoard
        .mockResolvedValueOnce({ board_id: 10, name: 'Board with Cards' })
        .mockResolvedValueOnce({ board_id: 20, name: 'Board without Cards' });

      mockClient.getCards
        .mockResolvedValueOnce([{ card_id: 1, title: 'Card 1' }])
        .mockResolvedValueOnce([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.resourcesWithDeps).toHaveLength(1);
      expect(result.resourcesWithoutDeps).toHaveLength(1);
    });

    it('should handle empty board list', async () => {
      // Act
      const result = await analyzer.analyzeBoards([]);

      // Assert
      expect(result.nameMap.size).toBe(0);
      expect(result.resourcesWithDeps).toHaveLength(0);
      expect(result.resourcesWithoutDeps).toHaveLength(0);
    });
  });

  describe('analyzeCards', () => {
    it('should extract card names (titles) into nameMap', async () => {
      // Arrange
      const cardIds = [100, 200, 300];
      mockClient.getCard
        .mockResolvedValueOnce({ card_id: 100, title: 'Card Alpha' })
        .mockResolvedValueOnce({ card_id: 200, title: 'Card Beta' })
        .mockResolvedValueOnce({ card_id: 300, title: 'Card Gamma' });

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

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
      mockClient.getCard
        .mockResolvedValueOnce({ card_id: 100, title: 'Valid Card' })
        .mockRejectedValueOnce(new Error('Card not found'));

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap.get(100)).toBe('Valid Card');
      expect(result.nameMap.get(404)).toBe('Card 404'); // Fallback pattern
    });

    it('should extract names for cards with children', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Parent Card',
      });

      mockClient.getCardChildren.mockResolvedValue([
        { card_id: 101, title: 'Child Card 1' },
        { card_id: 102, title: 'Child Card 2' },
      ]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.nameMap.get(100)).toBe('Parent Card');
      expect(result.resourcesWithDeps.length).toBe(1);
      expect(result.resourcesWithDeps[0]?.hasDependencies).toBe(true);
    });

    it('should include child card details in dependents', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Parent Card',
      });

      mockClient.getCardChildren.mockResolvedValue([
        { card_id: 101, title: 'Child Card 1' },
        { card_id: 102, title: 'Child Card 2' },
      ]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      const card = result.resourcesWithDeps[0];
      expect(card?.dependents).toHaveLength(1);
      expect(card?.dependents[0]).toMatchObject({
        type: 'child_card',
        count: 2,
      });
      expect(card?.dependents[0]?.items).toHaveLength(2);
      expect(card?.dependents[0]?.items?.[0]).toMatchObject({
        id: 101,
        additionalInfo: 'remains as independent card',
      });
    });

    it('should include comments in dependents', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Card with Comments',
      });

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([
        { comment_id: 1, content: 'Comment 1' },
        { comment_id: 2, content: 'Comment 2' },
      ]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      const card = result.resourcesWithDeps[0];
      expect(card?.dependents).toHaveLength(1);
      expect(card?.dependents[0]).toMatchObject({
        type: 'comment',
        count: 2,
      });
    });

    it('should include subtasks in dependents', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Card with Subtasks',
      });

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([
        { subtask_id: 1, description: 'Subtask 1' },
        { subtask_id: 2, description: 'Subtask 2' },
        { subtask_id: 3, description: 'Subtask 3' },
      ]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      const card = result.resourcesWithDeps[0];
      expect(card?.dependents).toHaveLength(1);
      expect(card?.dependents[0]).toMatchObject({
        type: 'subtask',
        count: 3,
      });
    });

    it('should include all dependent types when present', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Card with All Dependencies',
      });

      mockClient.getCardChildren.mockResolvedValue([{ card_id: 101, title: 'Child 1' }]);
      mockClient.getCardComments.mockResolvedValue([{ comment_id: 1, content: 'Comment 1' }]);
      mockClient.getCardSubtasks.mockResolvedValue([{ subtask_id: 1, description: 'Subtask 1' }]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      const card = result.resourcesWithDeps[0];
      expect(card?.dependents).toHaveLength(3);
      expect(card?.dependents.map((d) => d.type)).toEqual(['comment', 'subtask', 'child_card']);
    });

    it('should handle cards with no dependencies', async () => {
      // Arrange
      const cardIds = [100];
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Independent Card',
      });

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.resourcesWithDeps).toHaveLength(0);
      expect(result.resourcesWithoutDeps).toHaveLength(1);
      expect(result.resourcesWithoutDeps[0]).toMatchObject({
        id: 100,
        hasDependencies: false,
        dependents: [],
      });
    });

    it('should handle empty card list', async () => {
      // Act
      const result = await analyzer.analyzeCards([]);

      // Assert
      expect(result.nameMap.size).toBe(0);
      expect(result.resourcesWithDeps).toHaveLength(0);
      expect(result.resourcesWithoutDeps).toHaveLength(0);
    });
  });

  describe('nameMap consistency', () => {
    it('should maintain nameMap consistency across mixed success/failure', async () => {
      // Arrange
      const boardIds = [1, 2, 3, 4, 5];
      mockClient.getBoard
        .mockResolvedValueOnce({ board_id: 1, name: 'Board 1' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ board_id: 3, name: 'Board 3' })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({ board_id: 5, name: 'Board 5' });

      mockClient.getCards.mockResolvedValue([]);

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
      mockClient.getCard
        .mockResolvedValueOnce({ card_id: 10, title: 'Success' })
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('404'));

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

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
      mockClient.getBoard.mockResolvedValueOnce({
        board_id: 1,
        name: undefined as any,
      });

      mockClient.getCards.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.has(1)).toBe(true);
      // Name should exist (even if undefined) to prevent re-fetch
    });

    it('should handle maximum bulk size (50 items)', async () => {
      // Arrange
      const cardIds = Array.from({ length: 50 }, (_, i) => i + 1);
      mockClient.getCard.mockImplementation((id: number) =>
        Promise.resolve({ card_id: id, title: `Card ${id}` })
      );

      mockClient.getCardChildren.mockResolvedValue([]);
      mockClient.getCardComments.mockResolvedValue([]);
      mockClient.getCardSubtasks.mockResolvedValue([]);

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
      mockClient.getBoard.mockResolvedValueOnce({
        board_id: 1,
        name: specialName,
      });

      mockClient.getCards.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.nameMap.get(1)).toBe(specialName);
    });

    it('should handle very large card counts', async () => {
      // Arrange
      const boardIds = [1];
      const manyCards = Array.from({ length: 1000 }, (_, i) => ({
        card_id: i + 1,
        title: `Card ${i + 1}`,
      }));

      mockClient.getBoard.mockResolvedValueOnce({
        board_id: 1,
        name: 'Large Board',
      });

      mockClient.getCards.mockResolvedValue(manyCards);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      const board = result.resourcesWithDeps[0];
      expect(board?.dependents[0]?.count).toBe(1000);
    });

    it('should handle API errors gracefully and use fallback names', async () => {
      // Arrange
      const workspaceIds = [1, 2, 3];
      mockClient.getWorkspace
        .mockResolvedValueOnce({ workspace_id: 1, name: 'Success' })
        .mockRejectedValueOnce(new Error('API Error'))
        .mockRejectedValueOnce(new Error('Network timeout'));

      mockClient.getBoards.mockResolvedValue([]);

      // Act
      const result = await analyzer.analyzeWorkspaces(workspaceIds);

      // Assert
      expect(result.nameMap.get(1)).toBe('Success');
      expect(result.nameMap.get(2)).toBe('Workspace 2');
      expect(result.nameMap.get(3)).toBe('Workspace 3');
    });
  });

  describe('single resource analysis', () => {
    it('should analyze a single workspace', async () => {
      // Arrange
      const workspaceId = 1;
      mockClient.getWorkspace.mockResolvedValueOnce({
        workspace_id: 1,
        name: 'Workspace 1',
      });

      mockClient.getBoards.mockResolvedValueOnce([{ board_id: 10, name: 'Board 1' }]);

      mockClient.getCards.mockResolvedValueOnce([{ card_id: 100, title: 'Card 1' }]);

      // Act
      const result = await analyzer.analyzeWorkspace(workspaceId);

      // Assert
      expect(result.id).toBe(1);
      expect(result.type).toBe('workspace');
      expect(result.name).toBe('Workspace 1');
      expect(result.hasDependencies).toBe(true);
      expect(result.dependents).toHaveLength(1);
    });

    it('should analyze a single board', async () => {
      // Arrange
      const boardId = 10;
      mockClient.getBoard.mockResolvedValueOnce({
        board_id: 10,
        name: 'Board 1',
      });

      mockClient.getCards.mockResolvedValueOnce([
        { card_id: 100, title: 'Card 1' },
        { card_id: 101, title: 'Card 2' },
      ]);

      // Act
      const result = await analyzer.analyzeBoard(boardId);

      // Assert
      expect(result.id).toBe(10);
      expect(result.type).toBe('board');
      expect(result.name).toBe('Board 1');
      expect(result.hasDependencies).toBe(true);
      expect(result.dependents[0]?.count).toBe(2);
    });

    it('should analyze a single card', async () => {
      // Arrange
      const cardId = 100;
      mockClient.getCard.mockResolvedValueOnce({
        card_id: 100,
        title: 'Card 1',
      });

      mockClient.getCardChildren.mockResolvedValueOnce([{ card_id: 101, title: 'Child 1' }]);
      mockClient.getCardComments.mockResolvedValueOnce([{ comment_id: 1, content: 'Comment' }]);
      mockClient.getCardSubtasks.mockResolvedValueOnce([]);

      // Act
      const result = await analyzer.analyzeCard(cardId);

      // Assert
      expect(result.id).toBe(100);
      expect(result.type).toBe('card');
      expect(result.name).toBe('Card 1');
      expect(result.hasDependencies).toBe(true);
      expect(result.dependents).toHaveLength(2);
    });

    it('should fallback name for missing single card', async () => {
      // Arrange
      const cardId = 999;
      mockClient.getCard.mockRejectedValueOnce(new Error('Not found'));

      // Act
      const result = await analyzer.analyzeCard(cardId);

      // Assert
      expect(result.id).toBe(999);
      expect(result.name).toBe('Card 999');
      expect(result.hasDependencies).toBe(false);
    });
  });

  describe('impact summary calculations', () => {
    it('should correctly sum impact for mixed resource types', async () => {
      // Arrange
      const cardIds = [100, 101, 102];
      mockClient.getCard
        .mockResolvedValueOnce({
          card_id: 100,
          title: 'Card with Comments',
        })
        .mockResolvedValueOnce({
          card_id: 101,
          title: 'Card with Subtasks',
        })
        .mockResolvedValueOnce({
          card_id: 102,
          title: 'Card with Children',
        });

      mockClient.getCardChildren
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { card_id: 103, title: 'Child 1' },
          { card_id: 104, title: 'Child 2' },
        ]);

      mockClient.getCardComments
        .mockResolvedValueOnce([
          { comment_id: 1, content: 'Comment' },
          { comment_id: 2, content: 'Comment' },
        ])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      mockClient.getCardSubtasks
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { subtask_id: 1, description: 'Task' },
          { subtask_id: 2, description: 'Task' },
          { subtask_id: 3, description: 'Task' },
        ])
        .mockResolvedValueOnce([]);

      // Act
      const result = await analyzer.analyzeCards(cardIds);

      // Assert
      expect(result.totalImpact.cards).toBe(3); // 3 analyzed cards
      expect(result.totalImpact.comments).toBe(2);
      expect(result.totalImpact.subtasks).toBe(3);
      expect(result.totalImpact.childCards).toBe(2);
    });

    it('should handle zero values in impact summary', async () => {
      // Arrange
      const boardIds = [1, 2];
      mockClient.getBoard
        .mockResolvedValueOnce({ board_id: 1, name: 'Board 1' })
        .mockResolvedValueOnce({ board_id: 2, name: 'Board 2' });

      mockClient.getCards.mockResolvedValueOnce([]).mockResolvedValueOnce([]);

      // Act
      const result = await analyzer.analyzeBoards(boardIds);

      // Assert
      expect(result.totalImpact.boards).toBe(2);
      expect(result.totalImpact.cards).toBe(0);
    });
  });
});
