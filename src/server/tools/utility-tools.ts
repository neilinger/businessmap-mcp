import { z } from 'zod/v4';
import { BusinessMapClient } from '@client/businessmap-client.js';
import { BusinessMapClientFactory } from '@client/client-factory.js';
import { getApiInfoSchema, healthCheckSchema } from '@schemas/utility-schemas.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
} from './base-tool.js';
import { ToolRegistrar } from '../tool-registrar.js';

export class UtilityToolHandler implements BaseToolHandler {
  registerTools(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    this.registerHealthCheck(registrar, clientOrFactory);
    this.registerGetApiInfo(registrar, clientOrFactory);
  }

  private registerHealthCheck(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'health_check',
      {
        title: 'Health Check',
        description: 'Check API connection',
        inputSchema: healthCheckSchema.shape,
      },
      async ({ instance }: z.infer<typeof healthCheckSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const isHealthy = await client.healthCheck();
          return {
            content: [
              {
                type: 'text',
                text: `BusinessMap API Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`,
              },
            ],
          };
        } catch (error: unknown) {
          return createErrorResponse(error, 'health check failed');
        }
      }
    );
  }

  private registerGetApiInfo(
    registrar: ToolRegistrar,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    registrar.registerTool(
      'get_api_info',
      {
        title: 'Get API Info',
        description: 'Get API info',
        inputSchema: getApiInfoSchema.shape,
      },
      async ({ instance }: z.infer<typeof getApiInfoSchema>) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const apiInfo = await client.getApiInfo();
          return createSuccessResponse(apiInfo);
        } catch (error: unknown) {
          return createErrorResponse(error, 'fetching API info');
        }
      }
    );
  }
}
