import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { cardSizeSchema, moveCardSchema } from '@schemas/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from '../base-tool.js';

export function registerMoveCard(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'move_card',
    {
      title: 'Move Card',
      description: 'Move card',
      inputSchema: moveCardSchema.shape,
    },
    async ({ card_id, column_id, lane_id, position, instance }: z.infer<typeof moveCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const card = await client.moveCard(card_id, column_id, lane_id, position);
        return createSuccessResponse(card, 'Card moved successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'moving card');
      }
    }
  );
}

export function registerSetCardSize(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'set_card_size',
    {
      title: 'Set Card Size',
      description: 'Set card size',
      inputSchema: cardSizeSchema.shape,
    },
    async ({ card_id, size, instance }: z.infer<typeof cardSizeSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const card = await client.updateCard({ card_id, size });
        return {
          content: [
            {
              type: 'text',
              text: `Card "${card.title}" (ID: ${card_id}) size updated to: ${size} points`,
            },
          ],
        };
      } catch (error: unknown) {
        return createErrorResponse(error, 'setting card size');
      }
    }
  );
}

/** Conditionally register all card move/position tools */
export function registerCardMoveTools(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
  readOnlyMode: boolean,
  enabledTools?: string[]
): void {
  // All move tools are write operations (only in non-read-only mode)
  if (!readOnlyMode) {
    if (shouldRegisterTool('move_card', enabledTools)) {
      registerMoveCard(server, clientOrFactory);
    }
    if (shouldRegisterTool('set_card_size', enabledTools)) {
      registerSetCardSize(server, clientOrFactory);
    }
  }
}
