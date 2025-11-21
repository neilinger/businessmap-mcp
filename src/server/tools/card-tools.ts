import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import {
  addCardParentSchema,
  cardSizeSchema,
  createCardCommentSchema,
  createCardSchema,
  createCardSubtaskSchema,
  deleteCardCommentSchema,
  deleteCardSchema,
  getCardChildrenSchema,
  getCardCommentSchema,
  getCardHistorySchema,
  getCardLinkedCardsSchema,
  getCardOutcomesSchema,
  getCardParentGraphSchema,
  getCardParentSchema,
  getCardParentsSchema,
  getCardSchema,
  getCardSubtaskSchema,
  getCardSubtasksSchema,
  getCardTypesSchema,
  listCardsSchema,
  moveCardSchema,
  removeCardParentSchema,
  updateCardCommentSchema,
  updateCardSchema,
} from '../../schemas/index.js';
import { bulkDeleteCardsSchema, bulkUpdateCardsSchema } from '../../schemas/bulk-schemas.js';
import { DependencyAnalyzer } from '../../services/dependency-analyzer.js';
import { ConfirmationBuilder } from '../../services/confirmation-builder.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from './base-tool.js';

export class CardToolHandler implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
  ): void {
    if (shouldRegisterTool('list_cards', enabledTools)) {
      this.registerListCards(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card', enabledTools)) {
      this.registerGetCard(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_size', enabledTools)) {
      this.registerGetCardSize(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_comments', enabledTools)) {
      this.registerGetCardComments(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_comment', enabledTools)) {
      this.registerGetCardComment(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_custom_fields', enabledTools)) {
      this.registerGetCardCustomFields(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_types', enabledTools)) {
      this.registerGetCardTypes(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_history', enabledTools)) {
      this.registerGetCardHistory(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_outcomes', enabledTools)) {
      this.registerGetCardOutcomes(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_linked_cards', enabledTools)) {
      this.registerGetCardLinkedCards(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_subtasks', enabledTools)) {
      this.registerGetCardSubtasks(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_subtask', enabledTools)) {
      this.registerGetCardSubtask(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_parents', enabledTools)) {
      this.registerGetCardParents(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_parent', enabledTools)) {
      this.registerGetCardParent(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_parent_graph', enabledTools)) {
      this.registerGetCardParentGraph(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_card_children', enabledTools)) {
      this.registerGetCardChildren(server, clientOrFactory);
    }

    if (!readOnlyMode) {
      if (shouldRegisterTool('create_card', enabledTools)) {
        this.registerCreateCard(server, clientOrFactory);
      }
      if (shouldRegisterTool('move_card', enabledTools)) {
        this.registerMoveCard(server, clientOrFactory);
      }
      if (shouldRegisterTool('update_card', enabledTools)) {
        this.registerUpdateCard(server, clientOrFactory);
      }
      if (shouldRegisterTool('delete_card', enabledTools)) {
        this.registerDeleteCard(server, clientOrFactory);
      }
      if (shouldRegisterTool('set_card_size', enabledTools)) {
        this.registerSetCardSize(server, clientOrFactory);
      }
      if (shouldRegisterTool('create_card_subtask', enabledTools)) {
        this.registerCreateCardSubtask(server, clientOrFactory);
      }
      if (shouldRegisterTool('add_card_parent', enabledTools)) {
        this.registerAddCardParent(server, clientOrFactory);
      }
      if (shouldRegisterTool('remove_card_parent', enabledTools)) {
        this.registerRemoveCardParent(server, clientOrFactory);
      }
      if (shouldRegisterTool('bulk_delete_cards', enabledTools)) {
        this.registerBulkDeleteCards(server, clientOrFactory);
      }
      if (shouldRegisterTool('bulk_update_cards', enabledTools)) {
        this.registerBulkUpdateCards(server, clientOrFactory);
      }
      if (shouldRegisterTool('create_card_comment', enabledTools)) {
        this.registerCreateCardComment(server, clientOrFactory);
      }
      if (shouldRegisterTool('update_card_comment', enabledTools)) {
        this.registerUpdateCardComment(server, clientOrFactory);
      }
      if (shouldRegisterTool('delete_card_comment', enabledTools)) {
        this.registerDeleteCardComment(server, clientOrFactory);
      }
    }
  }

  private registerListCards(
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
      async (params: any) => {
        try {
          const { instance, board_id, date_filters, ...otherFilters } = params;
          const client = await getClientForInstance(clientOrFactory, instance);

          // Flatten date_filters if present
          const flattenedFilters = {
            ...otherFilters,
            ...(date_filters?.archived && {
              archived_from: date_filters.archived.from,
              archived_from_date: date_filters.archived.from_date,
              archived_to: date_filters.archived.to,
              archived_to_date: date_filters.archived.to_date,
            }),
            ...(date_filters?.created && {
              created_from: date_filters.created.from,
              created_from_date: date_filters.created.from_date,
              created_to: date_filters.created.to,
              created_to_date: date_filters.created.to_date,
            }),
            ...(date_filters?.deadline && {
              deadline_from: date_filters.deadline.from,
              deadline_from_date: date_filters.deadline.from_date,
              deadline_to: date_filters.deadline.to,
              deadline_to_date: date_filters.deadline.to_date,
            }),
            ...(date_filters?.discarded && {
              discarded_from: date_filters.discarded.from,
              discarded_from_date: date_filters.discarded.from_date,
              discarded_to: date_filters.discarded.to,
              discarded_to_date: date_filters.discarded.to_date,
            }),
            ...(date_filters?.first_end && {
              first_end_from: date_filters.first_end.from,
              first_end_from_date: date_filters.first_end.from_date,
              first_end_to: date_filters.first_end.to,
              first_end_to_date: date_filters.first_end.to_date,
            }),
            ...(date_filters?.first_start && {
              first_start_from: date_filters.first_start.from,
              first_start_from_date: date_filters.first_start.from_date,
              first_start_to: date_filters.first_start.to,
              first_start_to_date: date_filters.first_start.to_date,
            }),
            ...(date_filters?.in_current_position_since && {
              in_current_position_since_from: date_filters.in_current_position_since.from,
              in_current_position_since_from_date: date_filters.in_current_position_since.from_date,
              in_current_position_since_to: date_filters.in_current_position_since.to,
              in_current_position_since_to_date: date_filters.in_current_position_since.to_date,
            }),
            ...(date_filters?.last_end && {
              last_end_from: date_filters.last_end.from,
              last_end_from_date: date_filters.last_end.from_date,
              last_end_to: date_filters.last_end.to,
              last_end_to_date: date_filters.last_end.to_date,
            }),
            ...(date_filters?.last_modified && {
              last_modified_from: date_filters.last_modified.from,
              last_modified_from_date: date_filters.last_modified.from_date,
              last_modified_to: date_filters.last_modified.to,
              last_modified_to_date: date_filters.last_modified.to_date,
            }),
            ...(date_filters?.last_start && {
              last_start_from: date_filters.last_start.from,
              last_start_from_date: date_filters.last_start.from_date,
              last_start_to: date_filters.last_start.to,
              last_start_to_date: date_filters.last_start.to_date,
            }),
          };

          const cards = await client.getCards(board_id, flattenedFilters);
          return createSuccessResponse(cards);
        } catch (error) {
          return createErrorResponse(error, 'fetching cards');
        }
      }
    );
  }

  private registerGetCard(
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
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const card = await client.getCard(card_id);
          return createSuccessResponse(card);
        } catch (error) {
          return createErrorResponse(error, 'fetching card');
        }
      }
    );
  }

  private registerGetCardSize(
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
      async ({ card_id, instance }: any) => {
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
        } catch (error) {
          return createErrorResponse(error, 'fetching card size');
        }
      }
    );
  }

  private registerCreateCard(
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
      async (params: any) => {
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
        } catch (error) {
          return createErrorResponse(error, 'creating card');
        }
      }
    );
  }

  private registerMoveCard(
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
      async ({ card_id, column_id, lane_id, position, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const card = await client.moveCard(card_id, column_id, lane_id, position);
          return createSuccessResponse(card, 'Card moved successfully:');
        } catch (error) {
          return createErrorResponse(error, 'moving card');
        }
      }
    );
  }

  private registerUpdateCard(
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
      async (params: any) => {
        try {
          const { instance, ...cardData } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const card = await client.updateCard(cardData);
          return createSuccessResponse(card, 'Card updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating card');
        }
      }
    );
  }

  private registerDeleteCard(
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
      async ({ card_id, archive_first, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          await client.deleteCard(card_id, { archive_first });
          return createSuccessResponse({ card_id }, 'Card deleted successfully. ID:');
        } catch (error) {
          return createErrorResponse(error, 'deleting card');
        }
      }
    );
  }

  private registerSetCardSize(
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
      async ({ card_id, size, instance }: any) => {
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
        } catch (error) {
          return createErrorResponse(error, 'setting card size');
        }
      }
    );
  }

  private registerGetCardComments(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_comments',
      {
        title: 'Get Card Comments',
        description: 'Get card comments',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const comments = await client.getCardComments(card_id);
          return createSuccessResponse({
            comments,
            count: comments.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card comments');
        }
      }
    );
  }

  private registerGetCardComment(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_comment',
      {
        title: 'Get Card Comment',
        description: 'Get comment details',
        inputSchema: getCardCommentSchema.shape,
      },
      async ({ card_id, comment_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const comment = await client.getCardComment(card_id, comment_id);
          return createSuccessResponse(comment);
        } catch (error) {
          return createErrorResponse(error, 'getting card comment');
        }
      }
    );
  }

  private registerGetCardCustomFields(
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
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customFields = await client.getCardCustomFields(card_id);
          return createSuccessResponse({
            customFields,
            count: customFields.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card custom fields');
        }
      }
    );
  }

  private registerGetCardTypes(
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
      async ({ instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const cardTypes = await client.getCardTypes();
          return createSuccessResponse({
            cardTypes,
            count: cardTypes.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card types');
        }
      }
    );
  }

  private registerGetCardHistory(
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
      async ({ card_id, outcome_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const history = await client.getCardHistory(card_id, outcome_id);
          return createSuccessResponse({
            history,
            count: history.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card history');
        }
      }
    );
  }

  private registerGetCardOutcomes(
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
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const outcomes = await client.getCardOutcomes(card_id);
          return createSuccessResponse({
            outcomes,
            count: outcomes.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card outcomes');
        }
      }
    );
  }

  private registerGetCardLinkedCards(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_linked_cards',
      {
        title: 'Get Card Linked Cards',
        description: 'Get card linked cards',
        inputSchema: getCardLinkedCardsSchema.shape,
      },
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const linkedCards = await client.getCardLinkedCards(card_id);
          return createSuccessResponse({
            linkedCards,
            count: linkedCards.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card linked cards');
        }
      }
    );
  }

  private registerGetCardSubtasks(
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
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const subtasks = await client.getCardSubtasks(card_id);
          return createSuccessResponse({
            subtasks,
            count: subtasks.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card subtasks');
        }
      }
    );
  }

  private registerGetCardSubtask(
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
      async ({ card_id, subtask_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const subtask = await client.getCardSubtask(card_id, subtask_id);
          return createSuccessResponse(subtask);
        } catch (error) {
          return createErrorResponse(error, 'getting card subtask');
        }
      }
    );
  }

  private registerCreateCardSubtask(
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
      async (params: any) => {
        try {
          const { instance } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const { card_id, ...subtaskData } = params;
          const subtask = await client.createCardSubtask(card_id, subtaskData);
          return createSuccessResponse(subtask, 'Subtask created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating card subtask');
        }
      }
    );
  }

  private registerGetCardParents(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_parents',
      {
        title: 'Get Card Parents',
        description: 'Get card parents',
        inputSchema: getCardParentsSchema.shape,
      },
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const parents = await client.getCardParents(card_id);
          return createSuccessResponse({
            parents,
            count: parents.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card parents');
        }
      }
    );
  }

  private registerGetCardParent(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_parent',
      {
        title: 'Get Card Parent',
        description: 'Get card parent',
        inputSchema: getCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const parent = await client.getCardParent(card_id, parent_card_id);
          return createSuccessResponse(parent);
        } catch (error) {
          return createErrorResponse(error, 'getting card parent');
        }
      }
    );
  }

  private registerAddCardParent(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'add_card_parent',
      {
        title: 'Add Card Parent',
        description: 'Add card parent',
        inputSchema: addCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const result = await client.addCardParent(card_id, parent_card_id);
          return createSuccessResponse(result, 'Card parent added successfully:');
        } catch (error) {
          return createErrorResponse(error, 'adding card parent');
        }
      }
    );
  }

  private registerRemoveCardParent(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'remove_card_parent',
      {
        title: 'Remove Card Parent',
        description: 'Remove card parent',
        inputSchema: removeCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          await client.removeCardParent(card_id, parent_card_id);
          return createSuccessResponse(
            { card_id, parent_card_id },
            'Card parent removed successfully:'
          );
        } catch (error) {
          return createErrorResponse(error, 'removing card parent');
        }
      }
    );
  }

  private registerGetCardParentGraph(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_parent_graph',
      {
        title: 'Get Card Parent Graph',
        description: 'Get card parent graph',
        inputSchema: getCardParentGraphSchema.shape,
      },
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const parentGraph = await client.getCardParentGraph(card_id);
          return createSuccessResponse({
            parentGraph,
            count: parentGraph.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card parent graph');
        }
      }
    );
  }

  private registerGetCardChildren(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_card_children',
      {
        title: 'Get Card Children',
        description: 'Get card children',
        inputSchema: getCardChildrenSchema.shape,
      },
      async ({ card_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const children = await client.getCardChildren(card_id);
          return createSuccessResponse({
            children,
            count: children.length,
          });
        } catch (error) {
          return createErrorResponse(error, 'getting card children');
        }
      }
    );
  }

  private registerBulkDeleteCards(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'bulk_delete_cards',
      {
        title: 'Bulk Delete Cards',
        description: 'Delete multiple cards',
        inputSchema: bulkDeleteCardsSchema.shape,
      },
      async ({ resource_ids, analyze_dependencies = true, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const analyzer = new DependencyAnalyzer(client);
          const confirmationBuilder = new ConfirmationBuilder();

          // Analyze dependencies if requested
          if (analyze_dependencies) {
            const analysis = await analyzer.analyzeCards(resource_ids);
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
          const results = await client.bulkDeleteCards(resource_ids);

          const successes = results.filter((r) => r.success);
          const failures = results.filter((r) => !r.success);

          if (failures.length === 0) {
            // All successful
            const cards = await Promise.all(
              successes.map(async (r) => {
                try {
                  const card = await client.getCard(r.id);
                  return { id: r.id, name: card.title };
                } catch {
                  return { id: r.id, name: `Card ${r.id}` };
                }
              })
            );

            const message = confirmationBuilder.formatSimpleSuccess(
              'card',
              successes.length,
              cards
            );
            return createSuccessResponse({ deleted: successes.length, results }, message);
          } else if (successes.length > 0) {
            // Partial success
            const message = confirmationBuilder.formatPartialSuccess(
              'card',
              successes.map((s) => ({ id: s.id, name: `Card ${s.id}` })),
              failures.map((f) => ({
                id: f.id,
                name: `Card ${f.id}`,
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
              'bulk deleting cards'
            );
          }
        } catch (error) {
          return createErrorResponse(error, 'bulk deleting cards');
        }
      }
    );
  }

  private registerBulkUpdateCards(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'bulk_update_cards',
      {
        title: 'Bulk Update Cards',
        description: 'Update multiple cards',
        inputSchema: bulkUpdateCardsSchema as any,
      },
      async (params: any) => {
        const {
          resource_ids,
          title,
          description,
          column_id,
          lane_id,
          priority,
          owner_user_id,
          instance,
        } = params;
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const updates: any = {};
          if (title !== undefined) updates.title = title;
          if (description !== undefined) updates.description = description;
          if (column_id !== undefined) updates.column_id = column_id;
          if (lane_id !== undefined) updates.lane_id = lane_id;
          if (priority !== undefined) updates.priority = priority;
          if (owner_user_id !== undefined) updates.owner_user_id = owner_user_id;

          const results = await client.bulkUpdateCards(resource_ids, updates);

          const successes = results.filter((r: any) => r.success);
          const failures = results.filter((r: any) => !r.success);

          if (failures.length === 0) {
            return createSuccessResponse(
              { updated: successes.length, cards: successes.map((s) => s.card) },
              `✓ Successfully updated ${successes.length} card${successes.length > 1 ? 's' : ''}`
            );
          } else if (successes.length > 0) {
            const confirmationBuilder = new ConfirmationBuilder();
            const message = confirmationBuilder.formatPartialSuccess(
              'card',
              successes.map((s: any) => ({ id: s.id, name: s.card?.title || `Card ${s.id}` })),
              failures.map((f: any) => ({
                id: f.id,
                name: `Card ${f.id}`,
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
              'bulk updating cards'
            );
          }
        } catch (error) {
          return createErrorResponse(error, 'bulk updating cards');
        }
      }
    );
  }

  private registerCreateCardComment(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'create_card_comment',
      {
        title: 'Create Card Comment',
        description:
          'Create a new comment on a card. Requires non-empty text. Optionally attach files by providing file_name and link.',
        inputSchema: createCardCommentSchema.shape,
      },
      async ({ card_id, text, attachments_to_add, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const comment = await client.createCardComment(card_id, {
            text,
            attachments_to_add,
          });
          return createSuccessResponse(comment, 'Comment created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating card comment');
        }
      }
    );
  }

  private registerUpdateCardComment(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'update_card_comment',
      {
        title: 'Update Card Comment',
        description:
          'Update an existing comment on a card. Provide new text and/or additional attachments. Text cannot be empty.',
        inputSchema: updateCardCommentSchema as any,
      },
      async ({ card_id, comment_id, text, attachments_to_add, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const params: { text?: string; attachments_to_add?: any[] } = {};
          if (text !== undefined) params.text = text;
          if (attachments_to_add !== undefined) params.attachments_to_add = attachments_to_add;
          const comment = await client.updateCardComment(card_id, comment_id, params);
          return createSuccessResponse(comment, 'Comment updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating card comment');
        }
      }
    );
  }

  private registerDeleteCardComment(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'delete_card_comment',
      {
        title: 'Delete Card Comment',
        description: 'Delete a comment from a card. This action cannot be undone.',
        inputSchema: deleteCardCommentSchema.shape,
      },
      async ({ card_id, comment_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          await client.deleteCardComment(card_id, comment_id);
          return createSuccessResponse(
            { card_id, comment_id },
            'Comment deleted successfully:'
          );
        } catch (error) {
          return createErrorResponse(error, 'deleting card comment');
        }
      }
    );
  }
}
