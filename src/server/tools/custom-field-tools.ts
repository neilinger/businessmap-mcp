import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse, getClientForInstance } from './base-tool.js';
import {
  createCustomFieldSchema,
  deleteCustomFieldSchema,
  getCustomFieldSchema,
  listBoardCustomFieldsSchema,
  listCustomFieldsSchema,
  updateCustomFieldSchema,
} from '../../schemas/custom-field-schemas.js';

export class CustomFieldToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory, readOnlyMode: boolean): void {
    this.registerListCustomFields(server, clientOrFactory);
    this.registerListBoardCustomFields(server, clientOrFactory);
    this.registerGetCustomField(server, clientOrFactory);

    if (!readOnlyMode) {
      this.registerCreateCustomField(server, clientOrFactory);
      this.registerUpdateCustomField(server, clientOrFactory);
      this.registerDeleteCustomField(server, clientOrFactory);
    }
  }

  private registerListCustomFields(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'list_custom_fields',
      {
        title: 'List Custom Fields',
        description: 'Retrieve a list of all custom field definitions with optional pagination and filtering',
        inputSchema: listCustomFieldsSchema.shape,
      },
      async ({ page, page_size, field_type, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customFields = await client.listCustomFields({ page, page_size, field_type });
          return createSuccessResponse(customFields);
        } catch (error) {
          return createErrorResponse(error, 'listing custom fields');
        }
      }
    );
  }

  private registerListBoardCustomFields(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'list_board_custom_fields',
      {
        title: 'List Board Custom Fields',
        description: 'Retrieve all custom fields configured for a specific board',
        inputSchema: listBoardCustomFieldsSchema.shape,
      },
      async ({ board_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customFields = await client.listBoardCustomFields(board_id);
          return createSuccessResponse(customFields);
        } catch (error) {
          return createErrorResponse(error, 'listing board custom fields');
        }
      }
    );
  }

  private registerGetCustomField(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_custom_field',
      {
        title: 'Get Custom Field',
        description: 'Get details of a specific custom field by ID',
        inputSchema: getCustomFieldSchema.shape,
      },
      async ({ custom_field_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customField = await client.getCustomField(custom_field_id);
          return createSuccessResponse(customField);
        } catch (error) {
          return createErrorResponse(error, 'fetching custom field');
        }
      }
    );
  }

  private registerCreateCustomField(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'create_custom_field',
      {
        title: 'Create Custom Field',
        description: 'Create a new custom field definition for a board',
        inputSchema: createCustomFieldSchema.shape,
      },
      async (params: any) => {
        try {
          const { instance, ...fieldParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const customField = await client.createCustomField(fieldParams);
          return createSuccessResponse(customField, 'Custom field created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating custom field');
        }
      }
    );
  }

  private registerUpdateCustomField(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'update_custom_field',
      {
        title: 'Update Custom Field',
        description: 'Update an existing custom field definition',
        inputSchema: updateCustomFieldSchema.shape,
      },
      async ({ custom_field_id, instance, ...params }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customField = await client.updateCustomField(custom_field_id, params);
          return createSuccessResponse(customField, 'Custom field updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating custom field');
        }
      }
    );
  }

  private registerDeleteCustomField(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'delete_custom_field',
      {
        title: 'Delete Custom Field',
        description: `Delete a custom field definition. This operation will:
1. Analyze dependency impact (affected boards and cards)
2. Prompt for explicit confirmation showing field name, board count, card count, and data loss warning
3. Cascade delete to all card values only after user confirmation
4. Return 403 error for insufficient permissions (requires workspace admin role)`,
        inputSchema: deleteCustomFieldSchema.shape,
      },
      async ({ custom_field_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          // Step 1: Pre-delete dependency analysis
          const customField = await client.getCustomField(custom_field_id);

          // Get boards using this custom field
          const boards = await client.getBoards();
          const affectedBoards = [];

          for (const board of boards) {
            if (!board.board_id) continue;
            const boardFields = await client.listBoardCustomFields(board.board_id);
            if (boardFields.some((f: any) => f.field_id === custom_field_id)) {
              affectedBoards.push(board);
            }
          }

          // Estimate affected cards (this is an approximation)
          let affectedCardCount = 0;
          for (const board of affectedBoards) {
            if (!board.board_id) continue;
            const cards = await client.getCards(board.board_id);
            affectedCardCount += cards.length;
          }

          // Step 2: Build confirmation prompt
          const confirmationMessage = `
⚠️  DELETE CUSTOM FIELD CONFIRMATION ⚠️

Field Name: "${customField.name}"
Field Type: ${customField.type}
Affected Boards: ${affectedBoards.length}
Estimated Affected Cards: ${affectedCardCount}

⚠️  DATA LOSS WARNING ⚠️
Deleting this custom field will permanently remove:
- The field definition from ${affectedBoards.length} board(s)
- All custom field values from approximately ${affectedCardCount} card(s)
- This action CANNOT be undone

Affected Boards:
${affectedBoards.map((b: any) => `  - ${b.name} (ID: ${b.board_id})`).join('\n')}

To proceed with deletion, you must explicitly confirm this action.
Type 'DELETE' to confirm or any other response to cancel.
`;

          return {
            content: [
              {
                type: 'text',
                text: confirmationMessage,
              },
            ],
            isError: false,
            _meta: {
              requiresConfirmation: true,
              confirmationKeyword: 'DELETE',
              onConfirm: async () => {
                try {
                  await client.deleteCustomField(custom_field_id);
                  return createSuccessResponse(
                    {
                      custom_field_id,
                      deleted_boards: affectedBoards.length,
                      deleted_cards: affectedCardCount,
                    },
                    'Custom field deleted successfully:'
                  );
                } catch (deleteError: any) {
                  if (deleteError.response?.status === 403) {
                    return createErrorResponse(
                      new Error('Insufficient permissions. Custom field definition management requires workspace admin role.'),
                      'deleting custom field'
                    );
                  }
                  return createErrorResponse(deleteError, 'deleting custom field');
                }
              },
            },
          };
        } catch (error: any) {
          if (error.response?.status === 403) {
            return createErrorResponse(
              new Error('Insufficient permissions. Custom field definition management requires workspace admin role.'),
              'analyzing custom field for deletion'
            );
          }
          return createErrorResponse(error, 'analyzing custom field for deletion');
        }
      }
    );
  }
}
