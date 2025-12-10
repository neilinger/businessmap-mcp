import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { flattenDateFilters } from '@utils/date-filter-utils.js';
import {
  createCardSchema,
  deleteCardSchema,
  getCardHistorySchema,
  getCardOutcomesSchema,
  getCardSchema,
  getCardTypesSchema,
  listCardsSchema,
  updateCardSchema,
} from '@schemas/index.js';
import {
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from '../base-tool.js';

export function registerListCards(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'list_cards',
    {
      title: 'List Cards',
      description: 'List cards',
      inputSchema: listCardsSchema.shape,
    },
    async (params: z.infer<typeof listCardsSchema>) => {
      try {
        const { instance, board_id, date_filters, ...otherFilters } = params;
        const client = await getClientForInstance(clientOrFactory, instance);

        // Flatten nested date_filters to flat API format
        const flattenedFilters = {
          ...otherFilters,
          ...flattenDateFilters(date_filters),
        };

        const cards = await client.getCards(board_id, flattenedFilters);
        return createSuccessResponse(cards);
      } catch (error: unknown) {
        return createErrorResponse(error, 'fetching cards');
      }
    }
  );
}

export function registerGetCard(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'get_card',
    {
      title: 'Get Card',
      description: 'Get card details',
      inputSchema: getCardSchema.shape,
    },
    async ({ card_id, instance }: z.infer<typeof getCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        const card = await client.getCard(card_id);
        return createSuccessResponse(card);
      } catch (error: unknown) {
        return createErrorResponse(error, 'fetching card');
      }
    }
  );
}

export function registerCreateCard(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'create_card',
    {
      title: 'Create Card',
      description: 'Create card',
      inputSchema: createCardSchema.shape,
    },
    async (params: z.infer<typeof createCardSchema>) => {
      try {
        const {
          instance,
          placement,
          metadata,
          owners,
          dates,
          status,
          collections,
          custom_fields,
          attachments,
          card_links,
          ...cardData
        } = params;

        // Flatten nested structures for BusinessMap API
        const flattenedData = {
          ...cardData,
          // Flatten placement
          ...(placement && {
            lane_id: placement.lane_id,
            position: placement.position,
            track: placement.track,
          }),
          // Flatten metadata
          ...(metadata && {
            custom_id: metadata.custom_id,
            description: metadata.description,
            deadline: metadata.deadline,
            size: metadata.size,
            priority: metadata.priority,
            color: metadata.color,
            type_id: metadata.type_id,
            reference: metadata.reference,
            template_id: metadata.template_id,
            version_id: metadata.version_id,
          }),
          // Flatten owners
          ...(owners && {
            user_id: owners.user_id,
            co_owners: owners.co_owners,
            reporter_user_id: owners.reporter_user_id,
            reporter_email: owners.reporter_email,
          }),
          // Flatten dates
          ...(dates && {
            planned_start: dates.planned_start,
            planned_start_sync: dates.planned_start_sync,
            planned_end: dates.planned_end,
            planned_end_sync: dates.planned_end_sync,
            actual_start: dates.actual_start,
            actual_end: dates.actual_end,
            created_at: dates.created_at,
            archived_at: dates.archived_at,
            discarded_at: dates.discarded_at,
          }),
          // Flatten status
          ...(status && {
            is_archived: status.is_archived,
            is_discarded: status.is_discarded,
            watch: status.watch,
            block_reason: status.block_reason,
            discard_reason_id: status.discard_reason_id,
            discard_comment: status.discard_comment,
            exceeding_reason: status.exceeding_reason,
          }),
          // Flatten collections
          ...(collections && {
            co_owner_ids_to_add: collections.co_owner_ids_to_add,
            co_owner_ids_to_remove: collections.co_owner_ids_to_remove,
            watcher_ids_to_add: collections.watcher_ids_to_add,
            watcher_ids_to_remove: collections.watcher_ids_to_remove,
            tag_ids_to_add: collections.tag_ids_to_add,
            tag_ids_to_remove: collections.tag_ids_to_remove,
            milestone_ids_to_add: collections.milestone_ids_to_add,
            milestone_ids_to_remove: collections.milestone_ids_to_remove,
            stickers_to_add: collections.stickers_to_add,
          }),
          // Flatten custom_fields
          ...(custom_fields && {
            custom_fields_to_add_or_update: custom_fields.to_add_or_update,
            custom_field_ids_to_remove: custom_fields.ids_to_remove,
            custom_fields_to_copy: custom_fields.to_copy,
          }),
          // Flatten attachments
          ...(attachments && {
            attachments_to_add: attachments.to_add,
            cover_image_link: attachments.cover_image_link,
          }),
          // Flatten card_links
          ...(card_links && {
            links_to_existing_cards_to_add_or_update: card_links.existing_cards,
            links_to_new_cards_to_add: card_links.new_cards,
          }),
        };

        const client = await getClientForInstance(clientOrFactory, instance);
        const card = await client.createCard(flattenedData);
        return createSuccessResponse(card, 'Card created successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'creating card');
      }
    }
  );
}

export function registerUpdateCard(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'update_card',
    {
      title: 'Update Card',
      description: 'Update card',
      inputSchema: updateCardSchema.shape,
    },
    async (params: z.infer<typeof updateCardSchema>) => {
      try {
        const { instance, ...cardData } = params;
        const client = await getClientForInstance(clientOrFactory, instance);
        const card = await client.updateCard(cardData as Parameters<typeof client.updateCard>[0]);
        return createSuccessResponse(card, 'Card updated successfully:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'updating card');
      }
    }
  );
}

export function registerDeleteCard(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): void {
  server.registerTool(
    'delete_card',
    {
      title: 'Delete Card',
      description: 'Delete card',
      inputSchema: deleteCardSchema.shape,
    },
    async ({ card_id, archive_first, instance }: z.infer<typeof deleteCardSchema>) => {
      try {
        const client = await getClientForInstance(clientOrFactory, instance);
        await client.deleteCard(card_id, { archive_first });
        return createSuccessResponse({ card_id }, 'Card deleted successfully. ID:');
      } catch (error: unknown) {
        return createErrorResponse(error, 'deleting card');
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

/** Conditionally register all card CRUD tools */
export function registerCardCrudTools(
  server: McpServer,
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
  readOnlyMode: boolean,
  enabledTools?: string[]
): void {
  // Read-only tools
  if (shouldRegisterTool('list_cards', enabledTools)) {
    registerListCards(server, clientOrFactory);
  }
  if (shouldRegisterTool('get_card', enabledTools)) {
    registerGetCard(server, clientOrFactory);
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

  // Write tools (only in non-read-only mode)
  if (!readOnlyMode) {
    if (shouldRegisterTool('create_card', enabledTools)) {
      registerCreateCard(server, clientOrFactory);
    }
    if (shouldRegisterTool('update_card', enabledTools)) {
      registerUpdateCard(server, clientOrFactory);
    }
    if (shouldRegisterTool('delete_card', enabledTools)) {
      registerDeleteCard(server, clientOrFactory);
    }
  }
}
