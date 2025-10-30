import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import {
  getCurrentUserSchema,
  getUserSchema,
  listUsersSchema,
} from '../../schemas/user-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse, getClientForInstance } from './base-tool.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory, readOnlyMode: boolean): void {
    this.registerListUsers(server, clientOrFactory);
    this.registerGetUser(server, clientOrFactory);
    this.registerGetCurrentUser(server, clientOrFactory);
  }

  private registerListUsers(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'list_users',
      {
        title: 'List Users',
        description: 'Get a list of all users',
        inputSchema: listUsersSchema.shape,
      },
      async ({ instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const users = await client.getUsers();
          return createSuccessResponse(users);
        } catch (error) {
          return createErrorResponse(error, 'fetching users');
        }
      }
    );
  }

  private registerGetUser(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_user',
      {
        title: 'Get User',
        description: 'Get details of a specific user',
        inputSchema: getUserSchema.shape,
      },
      async ({ user_id, instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const user = await client.getUser(user_id);
          return createSuccessResponse(user);
        } catch (error) {
          return createErrorResponse(error, 'fetching user');
        }
      }
    );
  }

  private registerGetCurrentUser(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_current_user',
      {
        title: 'Get Current User',
        description: 'Get details of the current logged user',
        inputSchema: getCurrentUserSchema.shape,
      },
      async ({ instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const currentUser = await client.getCurrentUser();
          return createSuccessResponse(currentUser);
        } catch (error) {
          return createErrorResponse(error, 'fetching current user');
        }
      }
    );
  }
}
