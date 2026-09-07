import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { getCurrentUserSchema, getUserSchema, listUsersSchema } from '@schemas/user-schemas.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
} from './base-tool.js';
import { ToolRegistrar } from '../tool-registrar.js';

export class UserToolHandler implements BaseToolHandler {
  registerTools(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    this.registerListUsers(registrar, clientOrFactory);
    this.registerGetUser(registrar, clientOrFactory);
    this.registerGetCurrentUser(registrar, clientOrFactory);
  }

  private registerListUsers(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
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
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching users');
        }
      }
    );
  }

  private registerGetUser(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
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
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching user');
        }
      }
    );
  }

  private registerGetCurrentUser(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
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
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching current user');
        }
      }
    );
  }
}
