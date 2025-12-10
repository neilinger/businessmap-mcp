import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  getCardHistorySchema,
  getCardOutcomesSchema,
  getCardSchema,
  getCardTypesSchema,
} from '@schemas/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from '../base-tool.js';

export function registerGetCardSize(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_size',
    {
      title: 'Get Card Size',
      description: 'Get card size',
      inputSchema: getCardSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const card = await client.getCard(card_id);
        const size = card.size || 0;
        return {
          content: [
            {
              type: 'text',
              text: `Card "${card.title}" (ID: ${card_id}) has size: ${size} points`,
            },
          ],
        };
      } catch (error: unknown) {
        return createErrorResponse(error, 'fetching card size');
      }
    }
  );
}

export function registerGetCardCustomFields(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_custom_fields',
    {
      title: 'Get Card Custom Fields',
      description: 'Get card custom fields',
      inputSchema: getCardSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const customFields = await client.getCardCustomFields(card_id);
        return createSuccessResponse({
          customFields,
          count: customFields.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card custom fields');
      }
    }
  );
}

export function registerGetCardTypes(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_types',
    {
      title: 'Get Card Types',
      description: 'Get card types',
      inputSchema: getCardTypesSchema.shape,
    },
    async ({ instance }: z.infer<typeof getCardTypesSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const cardTypes = await client.getCardTypes();
        return createSuccessResponse({
          cardTypes,
          count: cardTypes.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card types');
      }
    }
  );
}

export function registerGetCardHistory(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_history',
    {
      title: 'Get Card History',
      description: 'Get card history',
      inputSchema: getCardHistorySchema.shape,
    },
    async ({ card_id, outcome_id, instance }: z.infer<typeof getCardHistorySchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const history = await client.getCardHistory(card_id, outcome_id);
        return createSuccessResponse({
          history,
          count: history.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card history');
      }
    }
  );
}

export function registerGetCardOutcomes(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card_outcomes',
    {
      title: 'Get Card Outcomes',
      description: 'Get card outcomes',
      inputSchema: getCardOutcomesSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const outcomes = await client.getCardOutcomes(card_id);
        return createSuccessResponse({
          outcomes,
          count: outcomes.length,
        });
      } catch (error: unknown) {
        return createErrorResponse(error, 'getting card outcomes');
      }
    }
  );
}

/** Conditionally register all card metadata query tools */
export function registerCardMetadataTools(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
  enabledTools?: string[]
): void {
  // All metadata tools are read-only
  if (shouldRegisterTool('get_card_size', enabledTools)) {
    registerGetCardSize(server, clientOrFactory);
  }
  if (shouldRegisterTool('get_card_custom_fields', enabledTools)) {
    registerGetCardCustomFields(server, clientOrFactory);
  }
  if (shouldRegisterTool('get_card_types', enabledTools)) {
    registerGetCardTypes(server, clientOrFactory);
  }
  if (shouldRegisterTool('get_card_history', enabledTools)) {
    registerGetCardHistory(server, clientOrFactory);
  }
  if (shouldRegisterTool('get_card_outcomes', enabledTools)) {
    registerGetCardOutcomes(server, clientOrFactory);
  }
}
