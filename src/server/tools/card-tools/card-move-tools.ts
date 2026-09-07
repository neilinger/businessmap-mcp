import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { cardSizeSchema, moveCardSchema } from '@schemas/index.js';
import { createErrorResponse, createSuccessResponse, getClientForInstance } from '../base-tool.js';
import { ToolRegistrar } from '../../tool-registrar.js';

export function registerMoveCard(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
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
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
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

/** Register all card move/position tools */
export function registerCardMoveTools(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registerMoveCard(registrar, clientOrFactory);
  registerSetCardSize(registrar, clientOrFactory);
}
