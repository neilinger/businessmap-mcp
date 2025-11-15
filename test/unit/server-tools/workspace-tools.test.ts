/**
 * Comprehensive unit tests for WorkspaceToolHandler
 * Tests workspace CRUD operations and bulk operations
 * Target: 50%+ coverage of src/server/tools/workspace-tools.ts
 */

import { jest } from '@jest/globals';
import { WorkspaceToolHandler } from '../../../src/server/tools/workspace-tools.js';

describe('WorkspaceToolHandler', () => {
  let workspaceHandler: WorkspaceToolHandler;
  let mockServer: any;
  let mockClient: any;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    workspaceHandler = new WorkspaceToolHandler();
    registeredTools = new Map();

    mockServer = {
      registerTool: jest.fn(function (name: any, schema: any, handler: any) {
        registeredTools.set(name, handler);
      }),
    } as any;

    mockClient = {
      getWorkspaces: jest.fn(),
      getWorkspace: jest.fn(),
      createWorkspace: jest.fn(),
      updateWorkspace: jest.fn(),
      archiveWorkspace: jest.fn(),
      bulkArchiveWorkspaces: jest.fn(),
      bulkUpdateWorkspaces: jest.fn(),
    };
  });

  describe('registerTools', () => {
    it('should register all read-only workspace tools', () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('list_workspaces')).toBe(true);
      expect(registeredTools.has('get_workspace')).toBe(true);
    });

    it('should register write operation tools when readOnlyMode is false', () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.has('create_workspace')).toBe(true);
      expect(registeredTools.has('update_workspace')).toBe(true);
      expect(registeredTools.has('archive_workspace')).toBe(true);
      expect(registeredTools.has('bulk_archive_workspaces')).toBe(true);
      expect(registeredTools.has('bulk_update_workspaces')).toBe(true);
    });

    it('should not register write operation tools when readOnlyMode is true', () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);

      expect(registeredTools.has('create_workspace')).toBe(false);
      expect(registeredTools.has('update_workspace')).toBe(false);
      expect(registeredTools.has('archive_workspace')).toBe(false);
    });
  });

  describe('list_workspaces tool', () => {
    it('should successfully list all workspaces', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      const mockWorkspaces = [
        { workspace_id: 1, name: 'Workspace 1', description: 'First workspace' },
        { workspace_id: 2, name: 'Workspace 2', description: 'Second workspace' },
        { workspace_id: 3, name: 'Workspace 3', description: 'Third workspace' },
      ];
      mockClient.getWorkspaces.mockResolvedValue(mockWorkspaces);

      const result = await handler({});

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);
      expect(result.content[0].type).toBe('text');

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(3);
      expect(parsedContent[0].workspace_id).toBe(1);
      expect(mockClient.getWorkspaces).toHaveBeenCalled();
    });

    it('should handle empty workspaces list', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      mockClient.getWorkspaces.mockResolvedValue([]);

      const result = await handler({});

      expect(result.isError).toBeUndefined();

      const parsedContent = JSON.parse(result.content[0].text);
      expect(Array.isArray(parsedContent)).toBe(true);
      expect(parsedContent).toHaveLength(0);
    });

    it('should handle getWorkspaces error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      const error = new Error('API Error');
      mockClient.getWorkspaces.mockRejectedValue(error);

      const result = await handler({});

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching workspaces');
      expect(result.content[0].text).toContain('API Error');
    });

    it('should handle instance parameter for list_workspaces', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      mockClient.getWorkspaces.mockResolvedValue([]);

      await handler({ instance: 'custom-instance' });

      expect(mockClient.getWorkspaces).toHaveBeenCalled();
    });
  });

  describe('get_workspace tool', () => {
    it('should successfully get a single workspace', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_workspace');

      const mockWorkspace = {
        workspace_id: 1,
        name: 'Test Workspace',
        description: 'A test workspace',
        is_archived: 0,
      };
      mockClient.getWorkspace.mockResolvedValue(mockWorkspace);

      const result = await handler({ workspace_id: 1 });

      expect(result.isError).toBeUndefined();
      expect(result.content).toHaveLength(1);

      const parsedContent = JSON.parse(result.content[0].text);
      expect(parsedContent.workspace_id).toBe(1);
      expect(parsedContent.name).toBe('Test Workspace');
      expect(mockClient.getWorkspace).toHaveBeenCalledWith(1);
    });

    it('should handle getWorkspace error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_workspace');

      const error = new Error('Workspace not found');
      mockClient.getWorkspace.mockRejectedValue(error);

      const result = await handler({ workspace_id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching workspace');
      expect(result.content[0].text).toContain('Workspace not found');
    });

    it('should work with different workspace IDs', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_workspace');

      const mockWorkspace = { workspace_id: 42, name: 'Test' };
      mockClient.getWorkspace.mockResolvedValue(mockWorkspace);

      await handler({ workspace_id: 42 });

      expect(mockClient.getWorkspace).toHaveBeenCalledWith(42);
    });
  });

  describe('create_workspace tool', () => {
    it('should successfully create a workspace with name and description', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_workspace');

      const newWorkspaceData = {
        name: 'New Workspace',
        description: 'A new workspace',
      };

      const createdWorkspace = {
        workspace_id: 100,
        ...newWorkspaceData,
        is_archived: 0,
      };
      mockClient.createWorkspace.mockResolvedValue(createdWorkspace);

      const result = await handler(newWorkspaceData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Workspace created successfully');

      const parsedContent = JSON.parse(result.content[0].text.split('\n')[1]);
      expect(parsedContent.workspace_id).toBe(100);
      expect(parsedContent.name).toBe('New Workspace');
      expect(mockClient.createWorkspace).toHaveBeenCalledWith(newWorkspaceData);
    });

    it('should successfully create a workspace with name only', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_workspace');

      const newWorkspaceData = {
        name: 'New Workspace',
      };

      const createdWorkspace = {
        workspace_id: 100,
        ...newWorkspaceData,
      };
      mockClient.createWorkspace.mockResolvedValue(createdWorkspace);

      const result = await handler(newWorkspaceData);

      expect(result.isError).toBeUndefined();

      expect(mockClient.createWorkspace).toHaveBeenCalledWith({
        name: 'New Workspace',
        description: undefined,
      });
    });

    it('should handle createWorkspace error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_workspace');

      const error = new Error('Invalid workspace name');
      mockClient.createWorkspace.mockRejectedValue(error);

      const result = await handler({
        name: 'New Workspace',
        description: 'Test',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error creating workspace');
      expect(result.content[0].text).toContain('Invalid workspace name');
    });

    it('should exclude instance parameter from workspace data', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_workspace');

      mockClient.createWorkspace.mockResolvedValue({ workspace_id: 1 });

      await handler({
        name: 'Workspace',
        description: 'Desc',
        instance: 'test',
      });

      expect(mockClient.createWorkspace).toHaveBeenCalledWith({
        name: 'Workspace',
        description: 'Desc',
      });
      expect(mockClient.createWorkspace).not.toHaveBeenCalledWith(
        expect.objectContaining({ instance: 'test' })
      );
    });
  });

  describe('update_workspace tool', () => {
    it('should successfully update a workspace', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_workspace');

      const updateData = {
        workspace_id: 1,
        name: 'Updated Workspace',
        description: 'Updated description',
      };

      const updatedWorkspace = { ...updateData };
      mockClient.updateWorkspace.mockResolvedValue(updatedWorkspace);

      const result = await handler(updateData);

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Workspace updated successfully');

      expect(mockClient.updateWorkspace).toHaveBeenCalledWith(1, {
        name: 'Updated Workspace',
        description: 'Updated description',
      });
    });

    it('should handle partial updates (name only)', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_workspace');

      mockClient.updateWorkspace.mockResolvedValue({
        workspace_id: 1,
        name: 'Updated',
      });

      await handler({
        workspace_id: 1,
        name: 'Updated',
      });

      expect(mockClient.updateWorkspace).toHaveBeenCalledWith(1, {
        name: 'Updated',
        description: undefined,
      });
    });

    it('should handle updateWorkspace error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_workspace');

      const error = new Error('Workspace not found');
      mockClient.updateWorkspace.mockRejectedValue(error);

      const result = await handler({
        workspace_id: 999,
        name: 'Updated',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error updating workspace');
    });

    it('should pass workspace_id separately from other parameters', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('update_workspace');

      mockClient.updateWorkspace.mockResolvedValue({
        workspace_id: 5,
        name: 'Updated',
      });

      await handler({
        workspace_id: 5,
        name: 'Updated',
        description: 'New Desc',
      });

      expect(mockClient.updateWorkspace).toHaveBeenCalledWith(5, {
        name: 'Updated',
        description: 'New Desc',
      });
    });
  });

  describe('archive_workspace tool', () => {
    it('should successfully archive a workspace', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('archive_workspace');

      const archivedWorkspace = {
        workspace_id: 1,
        name: 'Archived Workspace',
        is_archived: 1,
      };
      mockClient.archiveWorkspace.mockResolvedValue(archivedWorkspace);

      const result = await handler({ workspace_id: 1 });

      expect(result.isError).toBeUndefined();
      expect(result.content[0].text).toContain('Workspace archived successfully');

      expect(mockClient.archiveWorkspace).toHaveBeenCalledWith(1);
    });

    it('should handle archiveWorkspace error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('archive_workspace');

      const error = new Error('Cannot archive workspace');
      mockClient.archiveWorkspace.mockRejectedValue(error);

      const result = await handler({ workspace_id: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error archiving workspace');
    });
  });

  describe('bulk_archive_workspaces tool', () => {
    it('should successfully bulk archive workspaces', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_archive_workspaces');

      mockClient.bulkArchiveWorkspaces.mockResolvedValue([
        { id: 1, success: true },
        { id: 2, success: true },
        { id: 3, success: true },
      ]);

      const result = await handler({
        resource_ids: [1, 2, 3],
      });

      expect(result.isError).toBeUndefined();

      expect(mockClient.bulkArchiveWorkspaces).toHaveBeenCalled();
    });

    it('should handle bulk archive with analyze_dependencies', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_archive_workspaces');

      mockClient.bulkArchiveWorkspaces.mockResolvedValue([{ id: 1, success: true }]);

      await handler({
        resource_ids: [1],
        analyze_dependencies: true,
      });

      expect(mockClient.bulkArchiveWorkspaces).toHaveBeenCalled();
    });

    it('should handle bulkArchiveWorkspaces error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_archive_workspaces');

      const error = new Error('Bulk archive failed');
      mockClient.bulkArchiveWorkspaces.mockRejectedValue(error);

      const result = await handler({ resource_ids: [1, 2] });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error bulk archiving workspaces');
    });

    it('should handle empty resource_ids array', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_archive_workspaces');

      mockClient.bulkArchiveWorkspaces.mockResolvedValue([]);

      const result = await handler({ resource_ids: [] });

      expect(result.isError).toBeUndefined();
      expect(mockClient.bulkArchiveWorkspaces).toHaveBeenCalled();
    });
  });

  describe('bulk_update_workspaces tool', () => {
    it('should successfully bulk update workspaces', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_workspaces');

      mockClient.bulkUpdateWorkspaces.mockResolvedValue([
        { id: 1, success: true },
        { id: 2, success: true },
      ]);

      const result = await handler({
        resource_ids: [1, 2],
        name: 'Updated',
      });

      expect(result.isError).toBeUndefined();

      expect(mockClient.bulkUpdateWorkspaces).toHaveBeenCalled();
    });

    it('should handle bulk update with single workspace', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_workspaces');

      mockClient.bulkUpdateWorkspaces.mockResolvedValue([{ id: 1, success: true }]);

      await handler({
        resource_ids: [1],
        name: 'Updated',
      });

      expect(mockClient.bulkUpdateWorkspaces).toHaveBeenCalled();
    });

    it('should handle bulkUpdateWorkspaces error', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('bulk_update_workspaces');

      const error = new Error('Bulk update failed');
      mockClient.bulkUpdateWorkspaces.mockRejectedValue(error);

      const result = await handler({
        resource_ids: [1],
        name: 'Updated',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error bulk updating workspaces');
    });
  });

  describe('response structure validation', () => {
    it('should return consistent response structure for successful operations', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      mockClient.getWorkspaces.mockResolvedValue([]);

      const result = await handler({});

      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('type');
      expect(result.content[0]).toHaveProperty('text');
      expect(result.content[0].type).toBe('text');
      expect(typeof result.content[0].text).toBe('string');
    });

    it('should return error structure with isError flag', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      const error = new Error('API failed');
      mockClient.getWorkspaces.mockRejectedValue(error);

      const result = await handler({});

      expect(result).toHaveProperty('isError');
      expect(result.isError).toBe(true);
      expect(result).toHaveProperty('content');
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toHaveProperty('text');
    });

    it('should never include isError property in successful responses', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      mockClient.getWorkspaces.mockResolvedValue([]);

      const result = await handler({});

      expect(result.isError).toBeUndefined();
    });
  });

  describe('error message format', () => {
    it('should include error context in error messages', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_workspace');

      const error = new Error('Network timeout');
      mockClient.getWorkspace.mockRejectedValue(error);

      const result = await handler({ workspace_id: 1 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Error fetching workspace');
      expect(result.content[0].text).toContain('Network timeout');
    });

    it('should handle error objects with various message types', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('get_workspace');

      const error = new Error('Workspace not found: ID 999');
      mockClient.getWorkspace.mockRejectedValue(error);

      const result = await handler({ workspace_id: 999 });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Workspace not found');
    });
  });

  describe('instance parameter handling', () => {
    it('should handle instance parameter for all read operations', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);
      const handler = registeredTools.get('list_workspaces');

      mockClient.getWorkspaces.mockResolvedValue([]);

      await handler({ instance: 'custom-instance' });

      expect(mockClient.getWorkspaces).toHaveBeenCalled();
    });

    it('should handle instance parameter for write operations', async () => {
      workspaceHandler.registerTools(mockServer, mockClient, false);
      const handler = registeredTools.get('create_workspace');

      mockClient.createWorkspace.mockResolvedValue({ workspace_id: 1 });

      await handler({
        name: 'Workspace',
        instance: 'custom-instance',
      });

      expect(mockClient.createWorkspace).toHaveBeenCalled();
    });
  });

  describe('tool registration consistency', () => {
    it('should call registerTool for each tool with correct parameters', () => {
      workspaceHandler.registerTools(mockServer, mockClient, true);

      const calls = mockServer.registerTool.mock.calls;

      // Each call should have 3 parameters: name, schema, handler
      calls.forEach((call: any[]) => {
        expect(call).toHaveLength(3);
        expect(typeof call[0]).toBe('string'); // tool name
        expect(typeof call[1]).toBe('object'); // schema
        expect(typeof call[2]).toBe('function'); // handler
      });
    });
  });
});
