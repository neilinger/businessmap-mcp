import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  createCardSubtaskSchema,
  getCardSchema,
  getCardSubtaskSchema,
  getCardSubtasksSchema,
} from '@schemas/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from '../base-tool.js';

export function registerGetCardSubtasks(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_subtasks',
    {
      title: 'Get Card Subtasks',
      description: 'Get card subtasks',
      inputSchema: getCardSubtasksSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const subtasks = await client.getCardSubtasks(card_id);
        return createSuccessResponse({
          subtasks,
          count: subtasks.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card subtasks');
      }
    }
  );
}

export function registerGetCardSubtask(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_subtask',
    {
      title: 'Get Card Subtask',
      description: 'Get subtask details',
      inputSchema: getCardSubtaskSchema.shape,
    },
    async ({ card_id, subtask_id, instance }: z.infer<typeof getCardSubtaskSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const subtask = await client.getCardSubtask(card_id, subtask_id);
        return createSuccessResponse(subtask);
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card subtask');
      }
    }
  );
}

export function registerCreateCardSubtask(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'create_card_subtask',
    {
      title: 'Create Card Subtask',
      description: 'Create subtask',
      inputSchema: createCardSubtaskSchema.shape,
    },
    async (params: z.infer<typeof createCardSubtaskSchema>) => {
      try {
        const { instance, card_id, ...subtaskData } = params;
        const client = await getClientForInstance(clientOrFactory, instance);
        const subtask = await client.createCardSubtask(card_id, subtaskData);
        return createSuccessResponse(subtask, 'Subtask created successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'creating card subtask');
      }
    }
  );
}

/** Conditionally register all card subtask tools */
export function registerCardSubtaskTools(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
  readOnlyMode: boolean,
  enabledTools?: string[]
): void {
  // Read-only tools
  if (shouldRegisterTool('get_card_subtasks', enabledTools)) {
    registerGetCardSubtasks(server, clientOrFactory);
  }
  if (shouldRegisterTool('get_card_subtask', enabledTools)) {
    registerGetCardSubtask(server, clientOrFactory);
  }

  // Write tools (only in non-read-only mode)
  if (!readOnlyMode) {
    if (shouldRegisterTool('create_card_subtask', enabledTools)) {
      registerCreateCardSubtask(server, clientOrFactory);
    }
  }
}
