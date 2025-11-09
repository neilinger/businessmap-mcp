/**
 * Comprehensive unit tests for BoardToolHandler
 * Tests board CRUD operations, search, and bulk operations
 * Target: 50%+ coverage of src/server/tools/board-tools.ts
 */

import { jest } from '@jest/globals';
import { BoardToolHandler } from '../../../src/server/tools/board-tools.js';

describe('BoardToolHandler', () => {
  let boardHandler: BoardToolHandler;
  let mockServer: any;
  let mockClient: any;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    boardHandler = new BoardToolHandler();
    registeredTools = new Map();

    mockServer = {
      registerTool: jest.fn(function (name: any, schema: any, handler: any) {
        registeredTools.set(name, handler);
      }),
    } as any;

    mockClient = {
      getBoards: jest.fn(),
      getBoard: jest.fn(),
      getBoardStructure: jest.fn(),
      createBoard: jest.fn(),
      updateBoard: jest.fn(),
      deleteBoard: jest.fn(),
      searchBoard: jest.fn(),
      getColumns: jest.fn(),
      getLanes: jest.fn(),
      getLane: jest.fn(),
      createLane: jest.fn(),
      bulkDeleteBoards: jest.fn(),
      bulkUpdateBoards: jest.fn(),
    };
  });

  describe('registerTools', () => {
    it('should register all read-only board tools', () => {
      boardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('list_boards')).toBe(true);
      expect(registeredTools.has('search_board')).toBe(true);
      expect(registeredTools.has('get_columns')).toBe(true);
      expect(registeredTools.has('get_lanes')).toBe(true);
      expect(registeredTools.has('get_lane')).toBe(true);
      expect(registeredTools.has('get_current_board_structure')).toBe(true);
    });

    it('should register write operation tools when readOnlyMode is false', () => {
      boardHandler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.has('create_board')).toBe(true);
      expect(registeredTools.has('create_lane')).toBe(true);
      expect(registeredTools.has('update_board')).toBe(true);
      expect(registeredTools.has('delete_board')).toBe(true);
      expect(registeredTools.has('bulk_delete_boards')).toBe(true);
      expect(registeredTools.has('bulk_update_boards')).toBe(true);
    });

    it('should not register write operation tools when readOnlyMode is true', () => {
      boardHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('create_board')).toBe(false);
      expect(registeredTools.has('update_board')).toBe(false);
      expect(registeredTools.has('delete_board')).toBe(false);
    });
  });

  describe('list_boards tool', () => {
    it('should successfully list all boards', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_boards');

      const mockBoards = [
        { board_id: 1, name: 'Board 1', workspace_id: 10 },
        { board_id: 2, name: 'Board 2', workspace_id: 10 },
      ];
      mockClient.getBoards.mockResolvedValue(mockBoards);

      const result = await handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(2);
      expect(mockClient.getBoards).toHaveBeenCalled();
    });

    it('should pass filter parameters to client', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_boards');

      mockClient.getBoards.mockResolvedValue([]);

      await handler({
        workspace_ids: [10, 20],
        is_archived: 0,
      });

      expect(mockClient.getBoards).toHaveBeenCalledWith({
        workspace_ids: [10, 20],
        is_archived: 0,
      });
    });

    it('should handle getBoards error', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_boards');

      const error = new Error('API Error');
      mockClient.getBoards.mockRejectedValue(error);

      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching boards');
    });
  });

  describe('search_board tool', () => {
    it('should search board by ID', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('search_board');

      const mockBoard = { board_id: 1, name: 'Test Board' };
      const mockStructure = { columns: [], lanes: [] };
      mockClient.getBoard.mockResolvedValue(mockBoard);
      mockClient.getBoardStructure.mockResolvedValue(mockStructure);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Board found directly');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.board_id).toBe(1);
      expect(parsedContent.structure).toBeDefined();
    });

    it('should search board by name', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('search_board');

      const mockBoards = [{ board_id: 1, name: 'Test Board' }];
      mockClient.getBoards.mockResolvedValue(mockBoards);

      const result = await handler({ board_name: 'Test Board' });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Board found');
    });

    it('should list all boards when no search criteria provided', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('search_board');

      const mockBoards = [
        { board_id: 1, name: 'Board 1' },
        { board_id: 2, name: 'Board 2' },
      ];
      mockClient.getBoards.mockResolvedValue(mockBoards);

      const result = await handler({});

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
    });

    it('should handle search error gracefully', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('search_board');

      const error = new Error('Search failed');
      mockClient.getBoard.mockRejectedValue(error);
      mockClient.getBoards.mockRejectedValue(error);

      const result = await handler({ board_id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error searching for board');
    });
  });

  describe('get_columns tool', () => {
    it('should successfully get board columns', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_columns');

      const mockColumns = [
        { column_id: 1, name: 'To Do' },
        { column_id: 2, name: 'In Progress' },
        { column_id: 3, name: 'Done' },
      ];
      mockClient.getColumns.mockResolvedValue(mockColumns);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(3);
      expect(mockClient.getColumns).toHaveBeenCalledWith(1);
    });

    it('should handle getColumns error', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_columns');

      const error = new Error('Board not found');
      mockClient.getColumns.mockRejectedValue(error);

      const result = await handler({ board_id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching columns');
    });
  });

  describe('get_lanes tool', () => {
    it('should successfully get board lanes', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_lanes');

      const mockLanes = [
        { lane_id: 1, name: 'High Priority' },
        { lane_id: 2, name: 'Medium Priority' },
      ];
      mockClient.getLanes.mockResolvedValue(mockLanes);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(mockClient.getLanes).toHaveBeenCalledWith(1);
    });

    it('should handle getLanes error', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_lanes');

      const error = new Error('Failed to fetch lanes');
      mockClient.getLanes.mockRejectedValue(error);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_lane tool', () => {
    it('should successfully get a single lane', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_lane');

      const mockLane = { lane_id: 1, name: 'High Priority', color: '#FF0000' };
      mockClient.getLane.mockResolvedValue(mockLane);

      const result = await handler({ lane_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.lane_id).toBe(1);
      expect(mockClient.getLane).toHaveBeenCalledWith(1);
    });

    it('should handle getLane error', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_lane');

      const error = new Error('Lane not found');
      mockClient.getLane.mockRejectedValue(error);

      const result = await handler({ lane_id: 999 });

      expect(result.isError).toBe(true);
    });
  });

  describe('get_current_board_structure tool', () => {
    it('should successfully get board structure', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_current_board_structure');

      const mockStructure = {
        board_id: 1,
        columns: [
          { column_id: 1, name: 'To Do' },
          { column_id: 2, name: 'Done' },
        ],
        lanes: [{ lane_id: 1, name: 'High Priority' }],
      };
      mockClient.getBoardStructure.mockResolvedValue(mockStructure);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.board_id).toBe(1);
      expect(Array.isArray(parsedContent.columns)).toBe(true);
      expect(Array.isArray(parsedContent.lanes)).toBe(true);
      expect(mockClient.getBoardStructure).toHaveBeenCalledWith(1);
    });

    it('should handle getBoardStructure error', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_current_board_structure');

      const error = new Error('Failed to fetch structure');
      mockClient.getBoardStructure.mockRejectedValue(error);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBe(true);
    });
  });

  describe('create_board tool', () => {
    it('should successfully create a board', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_board');

      const newBoardData = {
        name: 'New Board',
        workspace_id: 10,
        description: 'A new board',
      };

      const createdBoard = { board_id: 100, ...newBoardData };
      mockClient.createBoard.mockResolvedValue(createdBoard);

      const result = await handler(newBoardData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Board created successfully');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.board_id).toBe(100);
      expect(parsedContent.name).toBe('New Board');
      expect(mockClient.createBoard).toHaveBeenCalledWith(newBoardData);
    });

    it('should handle createBoard error', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_board');

      const error = new Error('Invalid workspace');
      mockClient.createBoard.mockRejectedValue(error);

      const result = await handler({
        name: 'New Board',
        workspace_id: 999,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating board');
    });

    it('should exclude instance parameter from board data', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_board');

      mockClient.createBoard.mockResolvedValue({ board_id: 1 });

      await handler({
        name: 'Board',
        workspace_id: 10,
        instance: 'test',
      });

      expect(mockClient.createBoard).toHaveBeenCalledWith({
        name: 'Board',
        workspace_id: 10,
      });
    });
  });

  describe('create_lane tool', () => {
    it('should successfully create a lane', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_lane');

      const newLaneData = {
        name: 'New Lane',
        workflow_id: 1,
        position: 1,
        color: '#FF0000',
      };

      const createdLane = { lane_id: 100, ...newLaneData };
      mockClient.createLane.mockResolvedValue(createdLane);

      const result = await handler(newLaneData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Lane created successfully');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.lane_id).toBe(100);
      expect(mockClient.createLane).toHaveBeenCalledWith(newLaneData);
    });

    it('should handle createLane error', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_lane');

      const error = new Error('Invalid workflow');
      mockClient.createLane.mockRejectedValue(error);

      const result = await handler({
        name: 'New Lane',
        workflow_id: 999,
        position: 1,
        color: '#FF0000',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating lane');
    });
  });

  describe('update_board tool', () => {
    it('should successfully update a board', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_board');

      const updateData = {
        board_id: 1,
        name: 'Updated Board',
        description: 'Updated description',
      };

      const updatedBoard = { ...updateData };
      mockClient.updateBoard.mockResolvedValue(updatedBoard);

      const result = await handler(updateData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Board updated successfully');

      expect(mockClient.updateBoard).toHaveBeenCalledWith(updateData);
    });

    it('should handle updateBoard error', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_board');

      const error = new Error('Board not found');
      mockClient.updateBoard.mockRejectedValue(error);

      const result = await handler({
        board_id: 999,
        name: 'Updated',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating board');
    });
  });

  describe('delete_board tool', () => {
    it('should successfully delete a board', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_board');

      mockClient.deleteBoard.mockResolvedValue(undefined);

      const result = await handler({
        board_id: 1,
        archive_first: true,
      });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Board deleted successfully');

      expect(mockClient.deleteBoard).toHaveBeenCalledWith(1, {
        archive_first: true,
      });
    });

    it('should handle deleteBoard error', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('delete_board');

      const error = new Error('Cannot delete board');
      mockClient.deleteBoard.mockRejectedValue(error);

      const result = await handler({ board_id: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error deleting board');
    });
  });

  describe('bulk_delete_boards tool', () => {
    it('should successfully bulk delete boards', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_delete_boards');

      mockClient.bulkDeleteBoards.mockResolvedValue([
        { id: 1, success: true },
        { id: 2, success: true },
        { id: 3, success: true },
      ]);

      const result = await handler({
        resource_ids: [1, 2, 3],
      });

      expect(result.isError).toBeUndefined();

      expect(mockClient.bulkDeleteBoards).toHaveBeenCalled();
    });

    it('should handle bulk delete with analyze_dependencies', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_delete_boards');

      mockClient.bulkDeleteBoards.mockResolvedValue([{ id: 1, success: true }]);

      await handler({
        resource_ids: [1],
        analyze_dependencies: true,
      });

      expect(mockClient.bulkDeleteBoards).toHaveBeenCalled();
    });

    it('should handle bulkDeleteBoards error', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_delete_boards');

      const error = new Error('Bulk delete failed');
      mockClient.bulkDeleteBoards.mockRejectedValue(error);

      const result = await handler({ resource_ids: [1, 2, 3] });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error bulk deleting boards');
    });
  });

  describe('bulk_update_boards tool', () => {
    it('should successfully bulk update boards', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_boards');

      mockClient.bulkUpdateBoards.mockResolvedValue([
        { id: 1, success: true },
        { id: 2, success: true },
      ]);

      const result = await handler({
        resource_ids: [1, 2],
        name: 'Updated',
      });

      expect(result.isError).toBeUndefined();

      expect(mockClient.bulkUpdateBoards).toHaveBeenCalled();
    });

    it('should handle bulkUpdateBoards error', async () => {
      boardHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_boards');

      const error = new Error('Bulk update failed');
      mockClient.bulkUpdateBoards.mockRejectedValue(error);

      const result = await handler({
        resource_ids: [1],
        name: 'Updated',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error bulk updating boards');
    });
  });

  describe('response structure validation', () => {
    it('should return consistent response structure for successful operations', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_boards');

      mockClient.getBoards.mockResolvedValue([]);

      const result = await handler({});

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('text');
      expect(result.content[0].type).toBe('text');
    });

    it('should return error structure with isError flag', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_boards');

      const error = new Error('API failed');
      mockClient.getBoards.mockRejectedValue(error);

      const result = await handler({});

      expect(result).toHaveProperty('isError');
      expect(result.isError).toBe(true);
      expect(result).toHaveProperty('content');
      expect(result.content[0]).toHaveProperty('text');
    });
  });

  describe('instance parameter handling', () => {
    it('should handle instance parameter for all operations', async () => {
      boardHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_boards');

      mockClient.getBoards.mockResolvedValue([]);

      await handler({ instance: 'custom-instance' });

      expect(mockClient.getBoards).toHaveBeenCalled();
    });
  });
});
