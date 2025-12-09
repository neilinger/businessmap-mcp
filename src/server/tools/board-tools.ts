import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { logger } from '@utils/logger.js';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  createBoardSchema,
  createLaneSchema,
  deleteBoardSchema,
  getBoardSchema,
  getCurrentBoardStructureSchema,
  getLaneSchema,
  listBoardsSchema,
  searchBoardSchema,
  updateBoardSchema,
} from '@schemas/index.js';
import { bulkDeleteBoardsSchema, bulkUpdateBoardsSchema } from '@schemas/bulk-schemas.js';
import { DependencyAnalyzer } from '@services/dependency-analyzer.js';
import { ConfirmationBuilder } from '@services/confirmation-builder.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from './base-tool.js';

export class BoardToolHandler implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
  ): void {
    if (shouldRegisterTool('list_boards', enabledTools)) {
      this.registerListBoards(server, clientOrFactory);
    }
    if (shouldRegisterTool('search_board', enabledTools)) {
      this.registerSearchBoard(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_columns', enabledTools)) {
      this.registerGetColumns(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_lanes', enabledTools)) {
      this.registerGetLanes(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_lane', enabledTools)) {
      this.registerGetLane(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_current_board_structure', enabledTools)) {
      this.registerGetCurrentBoardStructure(server, clientOrFactory);
    }

    if (!readOnlyMode) {
      if (shouldRegisterTool('create_board', enabledTools)) {
        this.registerCreateBoard(server, clientOrFactory);
      }
      if (shouldRegisterTool('create_lane', enabledTools)) {
        this.registerCreateLane(server, clientOrFactory);
      }
      if (shouldRegisterTool('update_board', enabledTools)) {
        this.registerUpdateBoard(server, clientOrFactory);
      }
      if (shouldRegisterTool('delete_board', enabledTools)) {
        this.registerDeleteBoard(server, clientOrFactory);
      }
      if (shouldRegisterTool('bulk_delete_boards', enabledTools)) {
        this.registerBulkDeleteBoards(server, clientOrFactory);
      }
      if (shouldRegisterTool('bulk_update_boards', enabledTools)) {
        this.registerBulkUpdateBoards(server, clientOrFactory);
      }
    }
  }

  private registerListBoards(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'list_boards',
      {
        title: 'List Boards',
        description: 'List boards',
        inputSchema: listBoardsSchema.shape,
      },
      async (params: z.infer<typeof listBoardsSchema>) => {
        try {
          const { instance, ...restParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const boards = await client.getBoards(restParams);
          return createSuccessResponse(boards);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching boards');
        }
      }
    );
  }

  private registerSearchBoard(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'search_board',
      {
        title: 'Search Board',
        description: 'Search board by ID/name',
        inputSchema: searchBoardSchema.shape,
      },
      async ({
        board_id,
        board_name,
        workspace_id,
        instance,
      }: z.infer<typeof searchBoardSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          if (board_id) {
            return await this.searchBoardById(client, board_id, workspace_id);
          }

          if (board_name) {
            return await this.searchBoardByName(client, board_name, workspace_id);
          }

          // If neither ID nor name provided, list all boards
          return await this.getAllBoards(client, workspace_id);
        } catch (error: unknown) {
          return createErrorResponse(error, 'searching for board');
        }
      }
    );
  }

  private async searchBoardById(client: BusinessMapClient, boardId: number, workspaceId?: number) {
    try {
      const [board, structure] = await Promise.all([
        client.getBoard(boardId),
        client.getBoardStructure(boardId),
      ]);
      return createSuccessResponse({ ...board, structure }, 'Board found directly:');
    } catch (directError: unknown) {
      logger.warn('Direct board lookup failed', {
        boardId,
        error: directError instanceof Error ? directError.message : 'Unknown error',
      });
      return await this.searchBoardByIdFallback(client, boardId, workspaceId);
    }
  }

  private async searchBoardByIdFallback(
    client: BusinessMapClient,
    boardId: number,
    workspaceId?: number
  ) {
    const boards = await client.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    const foundBoard = boards.find((b) => b.board_id === boardId);

    if (!foundBoard) {
      return createErrorResponse(
        new Error(
          `Board with ID ${boardId} not found. Available boards:\n${JSON.stringify(this.formatBoardsList(boards), null, 2)}`
        ),
        'searching for board'
      );
    }

    return await this.getBoardWithStructure(client, foundBoard, 'Board found via list search:');
  }

  private async searchBoardByName(
    client: BusinessMapClient,
    boardName: string,
    workspaceId?: number
  ) {
    const boards = await client.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    const foundBoards = boards.filter((b) =>
      b.name.toLowerCase().includes(boardName.toLowerCase())
    );

    if (foundBoards.length === 0) {
      return createErrorResponse(
        new Error(
          `No boards found matching name "${boardName}". Available boards:\n${JSON.stringify(this.formatBoardsList(boards), null, 2)}`
        ),
        'searching for board by name'
      );
    }

    if (foundBoards.length === 1) {
      const foundBoard = foundBoards[0]!;
      if (!foundBoard.board_id) {
        return createErrorResponse(new Error('Board missing board_id'), 'board validation');
      }
      return await this.getBoardWithStructure(client, foundBoard, 'Board found by name:');
    }

    return createSuccessResponse(
      this.formatBoardsList(foundBoards),
      `Multiple boards found matching "${boardName}":`
    );
  }

  private async getAllBoards(client: BusinessMapClient, workspaceId?: number) {
    const boards = await client.getBoards(workspaceId ? { workspace_id: workspaceId } : undefined);
    return createSuccessResponse(this.formatBoardsList(boards), 'All available boards:');
  }

  private async getBoardWithStructure(
    client: BusinessMapClient,
    board: { board_id?: number; name?: string; workspace_id?: number },
    successMessage: string
  ) {
    try {
      if (!board.board_id) {
        return createErrorResponse(new Error('Board missing board_id'), 'board validation');
      }
      const structure = await client.getBoardStructure(board.board_id);
      return createSuccessResponse({ ...board, structure }, successMessage);
    } catch (structureError: unknown) {
      logger.warn('Structure lookup failed', {
        boardId: board.board_id,
        error: structureError instanceof Error ? structureError.message : 'Unknown error',
      });
      return createSuccessResponse(
        board,
        `Board found but structure unavailable. Structure error: ${structureError instanceof Error ? structureError.message : 'Unknown error'}`
      );
    }
  }

  private formatBoardsList(
    boards: Array<{ board_id?: number; name?: string; workspace_id?: number }>
  ) {
    return boards.map((b) => ({
      board_id: b.board_id,
      name: b.name,
      workspace_id: b.workspace_id,
    }));
  }

  private registerGetColumns(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_columns',
      {
        title: 'Get Board Columns',
        description: 'Get board columns',
        inputSchema: getBoardSchema.shape,
      },
      async ({ board_id, instance }: z.infer<typeof getBoardSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const columns = await client.getColumns(board_id);
          return createSuccessResponse(columns);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching board columns');
        }
      }
    );
  }

  private registerGetLanes(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_lanes',
      {
        title: 'Get Board Lanes',
        description: 'Get board lanes',
        inputSchema: getBoardSchema.shape,
      },
      async ({ board_id, instance }: z.infer<typeof getBoardSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const lanes = await client.getLanes(board_id);
          return createSuccessResponse(lanes);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching board lanes');
        }
      }
    );
  }

  private registerGetLane(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_lane',
      {
        title: 'Get Lane Details',
        description: 'Get lane details',
        inputSchema: getLaneSchema.shape,
      },
      async ({ lane_id, instance }: z.infer<typeof getLaneSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const lane = await client.getLane(lane_id);
          return createSuccessResponse(lane);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching lane details');
        }
      }
    );
  }

  private registerCreateBoard(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'create_board',
      {
        title: 'Create Board',
        description: 'Create board',
        inputSchema: createBoardSchema.shape,
      },
      async ({ name, workspace_id, description, instance }: z.infer<typeof createBoardSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const board = await client.createBoard({
            name,
            workspace_id,
            description,
          });
          return createSuccessResponse(board, 'Board created successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'creating board');
        }
      }
    );
  }

  private registerCreateLane(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'create_lane',
      {
        title: 'Create Lane',
        description: 'Create lane',
        inputSchema: createLaneSchema.shape,
      },
      async ({
        workflow_id,
        name,
        description,
        color,
        position,
        instance,
      }: z.infer<typeof createLaneSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const lane = await client.createLane({
            workflow_id,
            name,
            description: description || null,
            color,
            position,
          });
          return createSuccessResponse(lane, 'Lane created successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'creating lane');
        }
      }
    );
  }

  private registerUpdateBoard(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'update_board',
      {
        title: 'Update Board',
        description: 'Update board',
        inputSchema: updateBoardSchema.shape,
      },
      async ({ board_id, name, description, instance }: z.infer<typeof updateBoardSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const board = await client.updateBoard(board_id, { name, description });
          return createSuccessResponse(board, 'Board updated successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'updating board');
        }
      }
    );
  }

  private registerDeleteBoard(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'delete_board',
      {
        title: 'Delete Board',
        description: 'Delete board',
        inputSchema: deleteBoardSchema.shape,
      },
      async ({ board_id, archive_first, instance }: z.infer<typeof deleteBoardSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          await client.deleteBoard(board_id, { archive_first });
          return createSuccessResponse({ board_id }, 'Board deleted successfully. ID:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'deleting board');
        }
      }
    );
  }

  private registerGetCurrentBoardStructure(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_current_board_structure',
      {
        title: 'Get Current Board Structure',
        description: 'Get board structure',
        inputSchema: getCurrentBoardStructureSchema.shape,
      },
      async ({ board_id, instance }: z.infer<typeof getCurrentBoardStructureSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const structure = await client.getCurrentBoardStructure(board_id);
          return createSuccessResponse(structure, 'Board structure retrieved successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'getting current board structure');
        }
      }
    );
  }

  private registerBulkDeleteBoards(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'bulk_delete_boards',
      {
        title: 'Bulk Delete Boards',
        description: 'Delete multiple boards',
        inputSchema: bulkDeleteBoardsSchema.shape,
      },
      async ({
        resource_ids,
        analyze_dependencies = true,
        instance,
      }: z.infer<typeof bulkDeleteBoardsSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const analyzer = new DependencyAnalyzer(client);
          const confirmationBuilder = new ConfirmationBuilder();

          // Analyze dependencies if requested
          if (analyze_dependencies) {
            const analysis = await analyzer.analyzeBoards(resource_ids);
            const confirmation = confirmationBuilder.buildConfirmation(analysis);

            if (confirmation && confirmation.hasConfirmation) {
              // Return confirmation message for user approval
              return createSuccessResponse(
                {
                  requires_confirmation: true,
                  confirmation_message: confirmation.message,
                  resources_with_dependencies: confirmation.resourcesWithDeps.length,
                  resources_without_dependencies: confirmation.resourcesWithoutDeps.length,
                  total_impact: confirmation.totalImpact,
                },
                'Confirmation required before deletion:'
              );
            }
          }

          // Execute bulk delete
          const results = await client.bulkDeleteBoards(resource_ids);

          const successes = results.filter((r) => r.success);
          const failures = results.filter((r) => !r.success);

          if (failures.length === 0) {
            // All successful
            const boards = await Promise.all(
              successes.map(async (r) => {
                try {
                  const board = await client.getBoard(r.id);
                  return { id: r.id, name: board.name };
                } catch {
                  return { id: r.id, name: `Board ${r.id}` };
                }
              })
            );

            const message = confirmationBuilder.formatSimpleSuccess(
              'board',
              successes.length,
              boards
            );
            return createSuccessResponse({ deleted: successes.length, results }, message);
          } else if (successes.length > 0) {
            // Partial success
            const message = confirmationBuilder.formatPartialSuccess(
              'board',
              successes.map((s) => ({ id: s.id, name: `Board ${s.id}` })),
              failures.map((f) => ({
                id: f.id,
                name: `Board ${f.id}`,
                error: f.error || 'Unknown error',
              }))
            );
            return createSuccessResponse(
              { successful: successes.length, failed: failures.length, results },
              message
            );
          } else {
            // All failed
            return createErrorResponse(
              new Error(`All ${failures.length} deletions failed`),
              'bulk deleting boards'
            );
          }
        } catch (error: unknown) {
          return createErrorResponse(error, 'bulk deleting boards');
        }
      }
    );
  }

  private registerBulkUpdateBoards(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'bulk_update_boards',
      {
        title: 'Bulk Update Boards',
        description: 'Update multiple boards',
        inputSchema: bulkUpdateBoardsSchema.shape,
      },
      async (params: z.infer<typeof bulkUpdateBoardsSchema>) => {
        const { resource_ids, name, description, is_archived, instance } = params;
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const updates: Partial<{ name: string; description: string; is_archived: boolean }> = {};
          if (name !== undefined) updates.name = name;
          if (description !== undefined) updates.description = description;
          if (is_archived !== undefined) updates.is_archived = is_archived;

          const results = await client.bulkUpdateBoards(resource_ids, updates);

          const successes = results.filter((r) => r.success);
          const failures = results.filter((r) => !r.success);

          if (failures.length === 0) {
            return createSuccessResponse(
              { updated: successes.length, boards: successes.map((s) => s.board) },
              `✓ Successfully updated ${successes.length} board${successes.length > 1 ? 's' : ''}`
            );
          } else if (successes.length > 0) {
            const confirmationBuilder = new ConfirmationBuilder();
            const message = confirmationBuilder.formatPartialSuccess(
              'board',
              successes.map((s) => ({ id: s.id, name: s.board?.name || `Board ${s.id}` })),
              failures.map((f) => ({
                id: f.id,
                name: `Board ${f.id}`,
                error: f.error || 'Unknown error',
              }))
            );
            return createSuccessResponse(
              { successful: successes.length, failed: failures.length, results },
              message
            );
          } else {
            return createErrorResponse(
              new Error(`All ${failures.length} updates failed`),
              'bulk updating boards'
            );
          }
        } catch (error: unknown) {
          return createErrorResponse(error, 'bulk updating boards');
        }
      }
    );
  }
}
