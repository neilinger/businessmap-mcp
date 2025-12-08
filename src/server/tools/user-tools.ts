import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { getCurrentUserSchema, getUserSchema, listUsersSchema } from '@schemas/user-schemas.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from './base-tool.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
  ): void {
    if (shouldRegisterTool('list_users', enabledTools)) {
      this.registerListUsers(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_user', enabledTools)) {
      this.registerGetUser(server, clientOrFactory);
    }
    if (shouldRegisterTool('get_current_user', enabledTools)) {
      this.registerGetCurrentUser(server, clientOrFactory);
    }
  }

  private registerListUsers(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'list_users',
      {
        title: 'List Users',
        description: 'List users',
        inputSchema: listUsersSchema.shape,
      },
      async ({ instance }: z.infer<typeof listUsersSchema>) => {
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

  private registerGetUser(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_user',
      {
        title: 'Get User',
        description: 'Get user details',
        inputSchema: getUserSchema.shape,
      },
      async ({ user_id, instance }: z.infer<typeof getUserSchema>) => {
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

  private registerGetCurrentUser(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_current_user',
      {
        title: 'Get Current User',
        description: 'Get current user',
        inputSchema: getCurrentUserSchema.shape,
      },
      async ({ instance }: z.infer<typeof getCurrentUserSchema>) => {
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
