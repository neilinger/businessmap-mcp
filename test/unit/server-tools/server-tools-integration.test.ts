/**
 * Integration tests for all server tools
 * Tests tool registration and basic functionality across all handlers
 * Target: Comprehensive coverage of src/server/tools/*.ts
 */

import { jest } from '@jest/globals';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

describe('Server Tools Integration Tests', () => {
  let mockServer: McpServer;
  let registeredTools: Map<string, any>;

  beforeEach(() => {
    registeredTools = new Map();
    mockServer = {
      registerTool: jest.fn().mockImplementation(((name: string, schema: any, handler: any) => {
        registeredTools.set(name, handler);
      }) as any),
    } as any;
  });

  describe('Tool Handler Registration', () => {
    it('should be able to import CardToolHandler', async () => {
      const { CardToolHandler } = await import('../../../src/server/tools/card-tools.js');
      expect(CardToolHandler).toBeDefined();
    });

    it('should be able to import BoardToolHandler', async () => {
      const { BoardToolHandler } = await import('../../../src/server/tools/board-tools.js');
      expect(BoardToolHandler).toBeDefined();
    });

    it('should be able to import WorkspaceToolHandler', async () => {
      const { WorkspaceToolHandler } = await import('../../../src/server/tools/workspace-tools.js');
      expect(WorkspaceToolHandler).toBeDefined();
    });

    it('should be able to import UserToolHandler', async () => {
      const { UserToolHandler } = await import('../../../src/server/tools/user-tools.js');
      expect(UserToolHandler).toBeDefined();
    });

    it('should have base-tool module available', async () => {
      const baseTools = await import('../../../src/server/tools/base-tool.js');
      expect(baseTools).toBeDefined();
    });

    it('should be able to import utility functions from base-tool', async () => {
      const {
        createErrorResponse,
        createSuccessResponse,
        getClientForInstance,
        isMultiInstanceMode,
      } = await import('../../../src/server/tools/base-tool.js');

      expect(createErrorResponse).toBeDefined();
      expect(createSuccessResponse).toBeDefined();
      expect(getClientForInstance).toBeDefined();
      expect(isMultiInstanceMode).toBeDefined();
    });
  });

  describe('Tool Handler Interface Compliance', () => {
    it('CardToolHandler should implement BaseToolHandler interface', async () => {
      const { CardToolHandler } = await import('../../../src/server/tools/card-tools.js');
      const handler = new CardToolHandler();

      expect(handler.registerTools).toBeDefined();
      expect(typeof handler.registerTools).toBe('function');
    });

    it('BoardToolHandler should implement BaseToolHandler interface', async () => {
      const { BoardToolHandler } = await import('../../../src/server/tools/board-tools.js');
      const handler = new BoardToolHandler();

      expect(handler.registerTools).toBeDefined();
      expect(typeof handler.registerTools).toBe('function');
    });

    it('WorkspaceToolHandler should implement BaseToolHandler interface', async () => {
      const { WorkspaceToolHandler } = await import('../../../src/server/tools/workspace-tools.js');
      const handler = new WorkspaceToolHandler();

      expect(handler.registerTools).toBeDefined();
      expect(typeof handler.registerTools).toBe('function');
    });

    it('UserToolHandler should implement BaseToolHandler interface', async () => {
      const { UserToolHandler } = await import('../../../src/server/tools/user-tools.js');
      const handler = new UserToolHandler();

      expect(handler.registerTools).toBeDefined();
      expect(typeof handler.registerTools).toBe('function');
    });
  });

  describe('Error Response Utility', () => {
    it('should format error responses correctly', async () => {
      const { createErrorResponse } = await import('../../../src/server/tools/base-tool.js');

      const error = new Error('Test error');
      const response = createErrorResponse(error, 'test operation');

      expect(response.isError).toBe(true);
      expect(response.content).toBeDefined();
      expect(response.content[0]?.type).toBe('text');
      expect(response.content[0]?.text).toContain('Test error');
    });

    it('should handle null and undefined errors', async () => {
      const { createErrorResponse } = await import('../../../src/server/tools/base-tool.js');

      const response1 = createErrorResponse(null, 'operation');
      const response2 = createErrorResponse(undefined, 'operation');

      expect(response1.isError).toBe(true);
      expect(response2.isError).toBe(true);
    });
  });

  describe('Success Response Utility', () => {
    it('should format success responses correctly', async () => {
      const { createSuccessResponse } = await import('../../../src/server/tools/base-tool.js');

      const data = { id: 1, name: 'Test' };
      const response = createSuccessResponse(data);

      expect(response.content).toBeDefined();
      expect(response.content[0]?.type).toBe('text');

      const parsedData = JSON.parse(response.content[0]?.text || '{}');
      expect(parsedData).toEqual(data);
    });

    it('should include optional message in response', async () => {
      const { createSuccessResponse } = await import('../../../src/server/tools/base-tool.js');

      const data = { id: 1 };
      const message = 'Success message';
      const response = createSuccessResponse(data, message);

      expect(response.content[0]?.text).toContain(message);
    });

    it('should handle various data types', async () => {
      const { createSuccessResponse } = await import('../../../src/server/tools/base-tool.js');

      const arrayResponse = createSuccessResponse([1, 2, 3]);
      const nullResponse = createSuccessResponse(null);
      const stringResponse = createSuccessResponse('text');

      expect(arrayResponse.content[0]?.text).toBeDefined();
      expect(nullResponse.content[0]?.text).toBeDefined();
      expect(stringResponse.content[0]?.text).toBeDefined();
    });
  });

  describe('Client Instance Management', () => {
    it('should identify client vs factory instances correctly', async () => {
      const { isMultiInstanceMode } = await import('../../../src/server/tools/base-tool.js');
      const { BusinessMapClientFactory } = await import('../../../src/client/client-factory.js');

      // Create mock objects
      const mockClient = { registerTool: jest.fn() };
      const mockFactory = Object.create(BusinessMapClientFactory.prototype);

      expect(isMultiInstanceMode(mockClient as any)).toBe(false);
      expect(isMultiInstanceMode(mockFactory)).toBe(true);
    });
  });

  describe('Tool Module Structure', () => {
    it('should have consistent module exports', async () => {
      const cardTools = await import('../../../src/server/tools/card-tools.js');
      const boardTools = await import('../../../src/server/tools/board-tools.js');
      const workspaceTools = await import('../../../src/server/tools/workspace-tools.js');
      const userTools = await import('../../../src/server/tools/user-tools.js');

      expect(cardTools.CardToolHandler).toBeDefined();
      expect(boardTools.BoardToolHandler).toBeDefined();
      expect(workspaceTools.WorkspaceToolHandler).toBeDefined();
      expect(userTools.UserToolHandler).toBeDefined();
    });

    it('should have base-tool utility exports', async () => {
      const baseTools = await import('../../../src/server/tools/base-tool.js');

      expect(baseTools.createErrorResponse).toBeDefined();
      expect(baseTools.createSuccessResponse).toBeDefined();
      expect(baseTools.getClientForInstance).toBeDefined();
      expect(baseTools.isMultiInstanceMode).toBeDefined();
    });
  });

  describe('Response Content Consistency', () => {
    it('should maintain consistent response structure across utilities', async () => {
      const { createErrorResponse, createSuccessResponse } = await import(
        '../../../src/server/tools/base-tool.js'
      );

      const errorResp = createErrorResponse('error', 'op');
      const successResp = createSuccessResponse({ data: 'test' });

      // Both should have content array
      expect(Array.isArray(errorResp.content)).toBe(true);
      expect(Array.isArray(successResp.content)).toBe(true);

      // Content should have items with type and text
      expect(errorResp.content[0]?.type).toBeDefined();
      expect(errorResp.content[0]?.text).toBeDefined();
      expect(successResp.content[0]?.type).toBeDefined();
      expect(successResp.content[0]?.text).toBeDefined();

      // Only error response should have isError flag
      expect(errorResp.isError).toBe(true);
      expect(successResp).not.toHaveProperty('isError');
    });
  });

  describe('Read-Only Mode Support', () => {
    it('all tool handlers should support read-only mode', async () => {
      const { CardToolHandler } = await import('../../../src/server/tools/card-tools.js');
      const { BoardToolHandler } = await import('../../../src/server/tools/board-tools.js');
      const { WorkspaceToolHandler } = await import('../../../src/server/tools/workspace-tools.js');
      const { UserToolHandler } = await import('../../../src/server/tools/user-tools.js');

      const mockClient = {} as any;

      const cardHandler = new CardToolHandler();
      const boardHandler = new BoardToolHandler();
      const workspaceHandler = new WorkspaceToolHandler();
      const userHandler = new UserToolHandler();

      // Should not throw when registering with read-only mode
      expect(() => cardHandler.registerTools(mockServer, mockClient, true)).not.toThrow();
      expect(() => boardHandler.registerTools(mockServer, mockClient, true)).not.toThrow();
      expect(() => workspaceHandler.registerTools(mockServer, mockClient, true)).not.toThrow();
      expect(() => userHandler.registerTools(mockServer, mockClient, true)).not.toThrow();
    });

    it('all tool handlers should support normal mode', async () => {
      const { CardToolHandler } = await import('../../../src/server/tools/card-tools.js');
      const { BoardToolHandler } = await import('../../../src/server/tools/board-tools.js');
      const { WorkspaceToolHandler } = await import('../../../src/server/tools/workspace-tools.js');
      const { UserToolHandler } = await import('../../../src/server/tools/user-tools.js');

      const mockClient = {} as any;

      const cardHandler = new CardToolHandler();
      const boardHandler = new BoardToolHandler();
      const workspaceHandler = new WorkspaceToolHandler();
      const userHandler = new UserToolHandler();

      // Should not throw when registering in normal mode
      expect(() => cardHandler.registerTools(mockServer, mockClient, false)).not.toThrow();
      expect(() => boardHandler.registerTools(mockServer, mockClient, false)).not.toThrow();
      expect(() => workspaceHandler.registerTools(mockServer, mockClient, false)).not.toThrow();
      expect(() => userHandler.registerTools(mockServer, mockClient, false)).not.toThrow();
    });
  });

  describe('MCP Server Integration', () => {
    it('should register CardToolHandler tools with MCP server', async () => {
      const { CardToolHandler } = await import('../../../src/server/tools/card-tools.js');

      registeredTools.clear();
      const handler = new CardToolHandler();
      const mockClient = {} as any;

      handler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.size).toBeGreaterThan(0);
      expect(mockServer.registerTool).toHaveBeenCalled();
    });

    it('should register BoardToolHandler tools with MCP server', async () => {
      const { BoardToolHandler } = await import('../../../src/server/tools/board-tools.js');

      registeredTools.clear();
      const handler = new BoardToolHandler();
      const mockClient = {} as any;

      handler.registerTools(mockServer, mockClient, false);

      expect(registeredTools.size).toBeGreaterThan(0);
      expect(mockServer.registerTool).toHaveBeenCalled();
    });
  });
});
