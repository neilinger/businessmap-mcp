import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';
import {
  createCustomFieldSchema,
  deleteCustomFieldSchema,
  getCustomFieldSchema,
  listBoardCustomFieldsSchema,
  listCustomFieldsSchema,
  updateCustomFieldSchema,
} from '../../schemas/custom-field-schemas.js';

export class CustomFieldToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListCustomFields(server, client);
    this.registerListBoardCustomFields(server, client);
    this.registerGetCustomField(server, client);

    if (!readOnlyMode) {
      this.registerCreateCustomField(server, client);
      this.registerUpdateCustomField(server, client);
      this.registerDeleteCustomField(server, client);
    }
  }

  private registerListCustomFields(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_custom_fields',
      {
        title: 'List Custom Fields',
        description: 'List custom fields',
        inputSchema: listCustomFieldsSchema.shape,
      },
      async ({ page, page_size, field_type }) => {
        try {
          const customFields = await client.listCustomFields({ page, page_size, field_type });
          return createSuccessResponse(customFields);
        } catch (error) {
          return createErrorResponse(error, 'listing custom fields');
        }
      }
    );
  }

  private registerListBoardCustomFields(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_board_custom_fields',
      {
        title: 'List Board Custom Fields',
        description: 'List board custom fields',
        inputSchema: listBoardCustomFieldsSchema.shape,
      },
      async ({ board_id }) => {
        try {
          const customFields = await client.listBoardCustomFields(board_id);
          return createSuccessResponse(customFields);
        } catch (error) {
          return createErrorResponse(error, 'listing board custom fields');
        }
      }
    );
  }

  private registerGetCustomField(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_custom_field',
      {
        title: 'Get Custom Field',
        description: 'Get custom field details',
        inputSchema: getCustomFieldSchema.shape,
      },
      async ({ custom_field_id }) => {
        try {
          const customField = await client.getCustomField(custom_field_id);
          return createSuccessResponse(customField);
        } catch (error) {
          return createErrorResponse(error, 'fetching custom field');
        }
      }
    );
  }

  private registerCreateCustomField(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'create_custom_field',
      {
        title: 'Create Custom Field',
        description: 'Create custom field',
        inputSchema: createCustomFieldSchema.shape,
      },
      async (params) => {
        try {
          const customField = await client.createCustomField(params as any);
          return createSuccessResponse(customField, 'Custom field created successfully:');
        } catch (error) {
          return createErrorResponse(error, 'creating custom field');
        }
      }
    );
  }

  private registerUpdateCustomField(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'update_custom_field',
      {
        title: 'Update Custom Field',
        description: 'Update custom field',
        inputSchema: updateCustomFieldSchema.shape,
      },
      async ({ custom_field_id, ...params }) => {
        try {
          const customField = await client.updateCustomField(custom_field_id, params);
          return createSuccessResponse(customField, 'Custom field updated successfully:');
        } catch (error) {
          return createErrorResponse(error, 'updating custom field');
        }
      }
    );
  }

  private registerDeleteCustomField(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'delete_custom_field',
      {
        title: 'Delete Custom Field',
        description: 'Delete custom field',
        inputSchema: deleteCustomFieldSchema.shape,
      },
      async ({ custom_field_id }) => {
        try {
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
