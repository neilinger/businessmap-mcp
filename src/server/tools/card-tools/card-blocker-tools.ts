import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { blockCardSchema, unblockCardSchema } from '@schemas/index.js';
import { createErrorResponse, createSuccessResponse, getClientForInstance } from '../base-tool.js';
import { ToolRegistrar } from '../../tool-registrar.js';

export function registerBlockCard(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'block_card',
    {
      title: 'Block Card',
      description:
        'Block a card with a reason. Sets is_blocked=1 and block_reason on the card. ' +
        'Use this to signal that a card cannot proceed until the blocker is resolved. ' +
        'Stöð heartbeat monitors is_blocked=1 and will prioritise blocked cards.',
      inputSchema: blockCardSchema.shape,
    },
    async ({ card_id, comment, instance }: z.infer<typeof blockCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        await client.blockCard(card_id, comment);
        return createSuccessResponse({
          card_id,
          is_blocked: 1,
          block_reason: { comment },
          message: `Card ${card_id} blocked: "${comment}"`,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'blocking card');
      }
    }
  );
}

export function registerUnblockCard(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registrar.registerTool(
    'unblock_card',
    {
      title: 'Unblock Card',
      description:
        'Remove the block reason from a card. Sets is_blocked=0. ' +
        'Call this after the blocker has been resolved.',
      inputSchema: unblockCardSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof unblockCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        await client.unblockCard(card_id);
        return createSuccessResponse({
          card_id,
          is_blocked: 0,
          message: `Card ${card_id} unblocked successfully`,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'unblocking card');
      }
    }
  );
}

export function registerCardBlockerTools(
  registrar: ToolRegistrar,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  registerBlockCard(registrar, clientOrFactory);
  registerUnblockCard(registrar, clientOrFactory);
}
