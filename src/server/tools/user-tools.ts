import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import {
  getCurrentUserSchema,
  getUserSchema,
  listUsersSchema,
} from '../../schemas/user-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse } from './base-tool.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void {
    this.registerListUsers(server, client);
    this.registerGetUser(server, client);
    this.registerGetCurrentUser(server, client);
  }

  private registerListUsers(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'list_users',
      {
        title: 'List Users',
        description: 'List users',
        inputSchema: listUsersSchema.shape,
      },
      async () => {
        try {
          const users = await client.getUsers();
          return createSuccessResponse(users);
        } catch (error) {
          return createErrorResponse(error, 'fetching users');
        }
      }
    );
  }

  private registerGetUser(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_user',
      {
        title: 'Get User',
        description: 'Get user details',
        inputSchema: getUserSchema.shape,
      },
      async ({ user_id }) => {
        try {
          const user = await client.getUser(user_id);
          return createSuccessResponse(user);
        } catch (error) {
          return createErrorResponse(error, 'fetching user');
        }
      }
    );
  }

  private registerGetCurrentUser(server: McpServer, client: BusinessMapClient): void {
    server.registerTool(
      'get_current_user',
      {
        title: 'Get Current User',
        description: 'Get current user',
        inputSchema: getCurrentUserSchema.shape,
      },
      async () => {
        try {
          const currentUser = await client.getCurrentUser();
          return createSuccessResponse(currentUser);
        } catch (error) {
          return createErrorResponse(error, 'fetching current user');
        }
      }
    );
  }
}
