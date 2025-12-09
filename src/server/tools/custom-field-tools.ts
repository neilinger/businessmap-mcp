import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from './base-tool.js';
import {
  createCustomFieldSchema,
  deleteCustomFieldSchema,
  getCustomFieldSchema,
  listBoardCustomFieldsSchema,
  listCustomFieldsSchema,
  updateCustomFieldSchema,
} from '@schemas/custom-field-schemas.js';

export class CustomFieldToolHandler implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
  ): void {
    if (shouldRegisterTool('list_custom_fields', enabledTools)) {
      this.registerListCustomFields(server, clientOrFactory);
    }
    if (shouldRegisterTool('list_board_custom_fields', enabledTools)) {
      this.registerListBoardCustomFields(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_custom_field', enabledTools)) {
      this.registerGetCustomField(server, clientOrFactory);
    }

    if (!readOnlyMode) {
      if (shouldRegisterTool('create_custom_field', enabledTools)) {
        this.registerCreateCustomField(server, clientOrFactory);
      }
      if (shouldRegisterTool('update_custom_field', enabledTools)) {
        this.registerUpdateCustomField(server, clientOrFactory);
      }
      if (shouldRegisterTool('delete_custom_field', enabledTools)) {
        this.registerDeleteCustomField(server, clientOrFactory);
      }
    }
  }

  private registerListCustomFields(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'list_custom_fields',
      {
        title: 'List Custom Fields',
        description: 'List custom fields',
        inputSchema: listCustomFieldsSchema.shape,
      },
      async ({ page, page_size, field_type, instance }: z.infer<typeof listCustomFieldsSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customFields = await client.listCustomFields({ page, page_size, field_type });
          return createSuccessResponse(customFields);
        } catch (error: unknown) {
          return createErrorResponse(error, 'listing custom fields');
        }
      }
    );
  }

  private registerListBoardCustomFields(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'list_board_custom_fields',
      {
        title: 'List Board Custom Fields',
        description: 'List board custom fields',
        inputSchema: listBoardCustomFieldsSchema.shape,
      },
      async ({ board_id, instance }: z.infer<typeof listBoardCustomFieldsSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customFields = await client.listBoardCustomFields(board_id);
          return createSuccessResponse(customFields);
        } catch (error: unknown) {
          return createErrorResponse(error, 'listing board custom fields');
        }
      }
    );
  }

  private registerGetCustomField(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_custom_field',
      {
        title: 'Get Custom Field',
        description: 'Get custom field details',
        inputSchema: getCustomFieldSchema.shape,
      },
      async ({ custom_field_id, instance }: z.infer<typeof getCustomFieldSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customField = await client.getCustomField(custom_field_id);
          return createSuccessResponse(customField);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching custom field');
        }
      }
    );
  }

  private registerCreateCustomField(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'create_custom_field',
      {
        title: 'Create Custom Field',
        description: 'Create custom field',
        inputSchema: createCustomFieldSchema.shape,
      },
      async (params: z.infer<typeof createCustomFieldSchema>) => {
        try {
          const { instance, ...fieldParams } = params;
          const client = await getClientForInstance(clientOrFactory, instance);
          const customField = await client.createCustomField(fieldParams);
          return createSuccessResponse(customField, 'Custom field created successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'creating custom field');
        }
      }
    );
  }

  private registerUpdateCustomField(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'update_custom_field',
      {
        title: 'Update Custom Field',
        description: 'Update custom field',
        inputSchema: updateCustomFieldSchema.shape,
      },
      async ({ custom_field_id, instance, ...params }: z.infer<typeof updateCustomFieldSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const customField = await client.updateCustomField(custom_field_id, params);
          return createSuccessResponse(customField, 'Custom field updated successfully:');
        } catch (error: unknown) {
          return createErrorResponse(error, 'updating custom field');
        }
      }
    );
  }

  private registerDeleteCustomField(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'delete_custom_field',
      {
        title: 'Delete Custom Field',
        description: 'Delete custom field',
        inputSchema: deleteCustomFieldSchema.shape,
      },
      async ({ custom_field_id, instance }: z.infer<typeof deleteCustomFieldSchema>) => {
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
            if (
              boardFields.some((f) => (f as { field_id?: number }).field_id === custom_field_id)
            ) {
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
${affectedBoards.map((b) => `  - ${b.name} (ID: ${b.board_id})`).join('\n')}

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
                } catch (deleteError: unknown) {
                  if (
                    deleteError &&
                    typeof deleteError === 'object' &&
                    'response' in deleteError &&
                    deleteError.response &&
                    typeof deleteError.response === 'object' &&
                    'status' in deleteError.response &&
                    deleteError.response.status === 403
                  ) {
                    return createErrorResponse(
                      new Error(
                        'Insufficient permissions. Custom field definition management requires workspace admin role.'
                      ),
                      'deleting custom field'
                    );
                  }
                  return createErrorResponse(deleteError, 'deleting custom field');
                }
              },
            },
          };
        } catch (error: unknown) {
          if (
            error &&
            typeof error === 'object' &&
            'response' in error &&
            error.response &&
            typeof error.response === 'object' &&
            'status' in error.response &&
            error.response.status === 403
          ) {
            return createErrorResponse(
              new Error(
                'Insufficient permissions. Custom field definition management requires workspace admin role.'
              ),
              'analyzing custom field for deletion'
            );
          }
          return createErrorResponse(error, 'analyzing custom field for deletion');
        }
      }
    );
  }
}
