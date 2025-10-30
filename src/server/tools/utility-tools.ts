import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import { getApiInfoSchema, healthCheckSchema } from '../../schemas/utility-schemas.js';
import { BaseToolHandler, createErrorResponse, createSuccessResponse, getClientForInstance } from './base-tool.js';

export class UtilityToolHandler implements BaseToolHandler {
  registerTools(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory, readOnlyMode: boolean): void {
    this.registerHealthCheck(server, clientOrFactory);
    this.registerGetApiInfo(server, clientOrFactory);
  }

  private registerHealthCheck(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'health_check',
      {
        title: 'Health Check',
        description: 'Check the connection to BusinessMap API',
        inputSchema: healthCheckSchema.shape,
      },
      async ({ instance }: any) => {
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
        } catch (error) {
          return createErrorResponse(error, 'health check failed');
        }
      }
    );
  }

  private registerGetApiInfo(server: McpServer, clientOrFactory: BusinessMapClient | BusinessMapClientFactory): void {
    server.registerTool(
      'get_api_info',
      {
        title: 'Get API Info',
        description:
          'Get information about the BusinessMap API (nota: endpoint /info não existe na API oficial)',
        inputSchema: getApiInfoSchema.shape,
      },
      async ({ instance }: any) => {
        try {
          const client = await getClientForInstance(clientOrFactory, instance);
          const apiInfo = await client.getApiInfo();
          return createSuccessResponse(apiInfo);
        } catch (error) {
          return createErrorResponse(error, 'fetching API info');
        }
      }
    );
  }
}
