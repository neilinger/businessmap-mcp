import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import {
  addCardParentSchema,
  cardSizeSchema,
  createCardSchema,
  createCardSubtaskSchema,
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
  updateCardSchema,
} from '../../schemas/index.js';
import {
  bulkDeleteCardsSchema,
  bulkUpdateCardsSchema,
} from '../../schemas/bulk-schemas.js';
import { DependencyAnalyzer } from '../../services/dependency-analyzer.js';
import { ConfirmationBuilder } from '../../services/confirmation-builder.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse, getClientForInstance } from './base-tool.js';

export class CardToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory, readOnlyMode: boolean): void {
    this.registerListCards(server, clientOrFactory);
    this.registerGetCard(server, clientOrFactory);
    this.registerGetCardSize(server, clientOrFactory);
    this.registerGetCardComments(server, clientOrFactory);
    this.registerGetCardComment(server, clientOrFactory);
    this.registerGetCardCustomFields(server, clientOrFactory);
    this.registerGetCardTypes(server, clientOrFactory);
    this.registerGetCardHistory(server, clientOrFactory);
    this.registerGetCardOutcomes(server, clientOrFactory);
    this.registerGetCardLinkedCards(server, clientOrFactory);
    this.registerGetCardSubtasks(server, clientOrFactory);
    this.registerGetCardSubtask(server, clientOrFactory);
    this.registerGetCardParents(server, clientOrFactory);
    this.registerGetCardParent(server, clientOrFactory);
    this.registerGetCardParentGraph(server, clientOrFactory);
    this.registerGetCardChildren(server, clientOrFactory);

    if (!readOnlyMode) {
      this.registerCreateCard(server, clientOrFactory);
      this.registerMoveCard(server, clientOrFactory);
      this.registerUpdateCard(server, clientOrFactory);
      this.registerDeleteCard(server, clientOrFactory);
      this.registerSetCardSize(server, clientOrFactory);
      this.registerCreateCardSubtask(server, clientOrFactory);
      this.registerAddCardParent(server, clientOrFactory);
      this.registerRemoveCardParent(server, clientOrFactory);
      this.registerBulkDeleteCards(server, clientOrFactory);
      this.registerBulkUpdateCards(server, clientOrFactory);
    }
  }

  private registerListCards(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'list_cards',
      {
        title: 'List Cards',
        description: 'List cards',
        inputSchema: listCardsSchema.shape,
      },
      async (params: any) => {
        try {
          const { instance, ...restParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const { board_id, ...filters } = params;
          const cards = await client.getCards(board_id, filters);
          return createSuccessResponse(cards);
        } catch (error) {
          return createErrorResponse(error, 'fetching cards');
        }
      }
    );
  }

  private registerGetCard(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card',
      {
        title: 'Get Card',
        description: 'Get card details',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardSize(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_size',
      {
        title: 'Get Card Size',
        description: 'Get card size',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerCreateCard(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'create_card',
      {
        title: 'Create Card',
        description: 'Create card',
        inputSchema: createCardSchema.shape,
      },
      async (params: any) => {
        try {
          const { instance, ...restParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const card = await client.createCard(restParams);
          return createSuccessResponse(card, 'Card created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating card');
        }
      }
    );
  }

  private registerMoveCard(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'move_card',
      {
        title: 'Move Card',
        description: 'Move card',
        inputSchema: moveCardSchema.shape,
      },
      async ({ card_id, column_id, lane_id, position , instance }: any) => {
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

  private registerUpdateCard(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'update_card',
      {
        title: 'Update Card',
        description: 'Update card',
        inputSchema: updateCardSchema.shape,
      },
      async (params: any) => {
        try {
          const { instance, ...restParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const card = await client.updateCard(restParams);
          return createSuccessResponse(card, 'Card updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating card');
        }
      }
    );
  }


  private registerDeleteCard(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'delete_card',
      {
        title: 'Delete Card',
        description: 'Delete card',
        inputSchema: deleteCardSchema.shape,
      },
      async ({ card_id, archive_first , instance }: any) => {
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

  private registerSetCardSize(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'set_card_size',
      {
        title: 'Set Card Size',
        description: 'Set card size',
        inputSchema: cardSizeSchema.shape,
      },
      async ({ card_id, size , instance }: any) => {
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

  private registerGetCardComments(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_comments',
      {
        title: 'Get Card Comments',
        description: 'Get card comments',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardComment(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_comment',
      {
        title: 'Get Card Comment',
        description: 'Get comment details',
        inputSchema: getCardCommentSchema.shape,
      },
      async ({ card_id, comment_id , instance }: any) => {
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

  private registerGetCardCustomFields(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_custom_fields',
      {
        title: 'Get Card Custom Fields',
        description: 'Get card custom fields',
        inputSchema: getCardSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardTypes(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
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

  private registerGetCardHistory(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_history',
      {
        title: 'Get Card History',
        description: 'Get card history',
        inputSchema: getCardHistorySchema.shape,
      },
      async ({ card_id, outcome_id , instance }: any) => {
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

  private registerGetCardOutcomes(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_outcomes',
      {
        title: 'Get Card Outcomes',
        description: 'Get card outcomes',
        inputSchema: getCardOutcomesSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardLinkedCards(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_linked_cards',
      {
        title: 'Get Card Linked Cards',
        description: 'Get card linked cards',
        inputSchema: getCardLinkedCardsSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardSubtasks(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_subtasks',
      {
        title: 'Get Card Subtasks',
        description: 'Get card subtasks',
        inputSchema: getCardSubtasksSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardSubtask(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_subtask',
      {
        title: 'Get Card Subtask',
        description: 'Get subtask details',
        inputSchema: getCardSubtaskSchema.shape,
      },
      async ({ card_id, subtask_id , instance }: any) => {
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

  private registerCreateCardSubtask(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'create_card_subtask',
      {
        title: 'Create Card Subtask',
        description: 'Create subtask',
        inputSchema: createCardSubtaskSchema.shape,
      },
      async (params: any) => {
        try {
          const { instance, ...restParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const { card_id, ...subtaskData } = restParams;
          const subtask = await client.createCardSubtask(card_id, subtaskData);
          return createSuccessResponse(subtask, 'Subtask created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating card subtask');
        }
      }
    );
  }

  private registerGetCardParents(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_parents',
      {
        title: 'Get Card Parents',
        description: 'Get card parents',
        inputSchema: getCardParentsSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardParent(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_parent',
      {
        title: 'Get Card Parent',
        description: 'Get card parent',
        inputSchema: getCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id , instance }: any) => {
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

  private registerAddCardParent(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'add_card_parent',
      {
        title: 'Add Card Parent',
        description: 'Add card parent',
        inputSchema: addCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id , instance }: any) => {
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

  private registerRemoveCardParent(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'remove_card_parent',
      {
        title: 'Remove Card Parent',
        description: 'Remove card parent',
        inputSchema: removeCardParentSchema.shape,
      },
      async ({ card_id, parent_card_id , instance }: any) => {
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

  private registerGetCardParentGraph(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_parent_graph',
      {
        title: 'Get Card Parent Graph',
        description: 'Get card parent graph',
        inputSchema: getCardParentGraphSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerGetCardChildren(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_card_children',
      {
        title: 'Get Card Children',
        description: 'Get card children',
        inputSchema: getCardChildrenSchema.shape,
      },
      async ({ card_id , instance }: any) => {
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

  private registerBulkDeleteCards(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'bulk_delete_cards',
      {
        title: 'Bulk Delete Cards',
        description: 'Delete multiple cards',
        inputSchema: bulkDeleteCardsSchema.shape,
      },
      async ({ resource_ids, analyze_dependencies = true , instance }: any) => {
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

            const message = confirmationBuilder.formatSimpleSuccess('card', successes.length, cards);
            return createSuccessResponse({ deleted: successes.length, results }, message);
          } else if (successes.length > 0) {
            // Partial success
            const message = confirmationBuilder.formatPartialSuccess(
              'card',
              successes.map((s) => ({ id: s.id, name: `Card ${s.id}` })),
              failures.map((f) => ({ id: f.id, name: `Card ${f.id}`, error: f.error || 'Unknown error' }))
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

  private registerBulkUpdateCards(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'bulk_update_cards',
      {
        title: 'Bulk Update Cards',
        description: 'Update multiple cards',
        inputSchema: bulkUpdateCardsSchema as any,
      },
      async (params: any) => {
        const { resource_ids, title, description, column_id, lane_id, priority, owner_user_id, instance } = params;
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
              failures.map((f: any) => ({ id: f.id, name: `Card ${f.id}`, error: f.error || 'Unknown error' }))
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
}
