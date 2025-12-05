/**
 * Prototype: Testing Both .shape Pattern and Direct Pattern with zod/v3
 *
 * This file tests:
 * 1. The current .shape pattern with zod/v3 import
 * 2. The new direct Zod schema pattern with zod/v3 import
 *
 * KEY FINDING: Both patterns work when using `zod/v3` import.
 * The issue is NOT about .shape vs direct objects - it's about
 * which Zod package you import from.
 *
 * Investigation for Issue #41
 */
import { z } from 'zod/v3';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import {
  BaseToolHandler,
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  shouldRegisterTool,
} from './base-tool.js';
import { healthCheckSchemaV3, getApiInfoSchemaV3 } from '../../schemas/utility-schemas-v3.js';

// Direct schema definition (new pattern - inline Zod schemas)
const instanceParam = z
  .string()
  .min(1)
  .max(100)
  .trim()
  .optional()
  .describe(
    'Optional instance name to target a specific BusinessMap instance. If not provided, uses the default instance.'
  );

export class UtilityToolHandlerPrototype implements BaseToolHandler {
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
  ): void {
    // Test .shape pattern with zod/v3 import
    if (shouldRegisterTool('health_check_v2_shape', enabledTools)) {
      this.registerHealthCheckWithShape(server, clientOrFactory);
    }
    // Test direct pattern with zod/v3 import
    if (shouldRegisterTool('health_check_v2_direct', enabledTools)) {
      this.registerHealthCheckDirect(server, clientOrFactory);
    }
    // Test .shape pattern with zod/v3 import
    if (shouldRegisterTool('get_api_info_v2_shape', enabledTools)) {
      this.registerGetApiInfoWithShape(server, clientOrFactory);
    }
    // Test direct pattern with zod/v3 import
    if (shouldRegisterTool('get_api_info_v2_direct', enabledTools)) {
      this.registerGetApiInfoDirect(server, clientOrFactory);
    }
  }

  /**
   * Test: .shape pattern with zod/v3 import
   * This tests whether the current pattern works if we just change the import.
   */
  private registerHealthCheckWithShape(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'health_check_v2_shape',
      {
        title: 'Health Check (v2 - shape pattern)',
        description: 'Check API connection - using .shape pattern with zod/v3',
        inputSchema: healthCheckSchemaV3.shape, // <-- .shape pattern
      },
      async ({ instance }) => {
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

  /**
   * Test: Direct pattern with zod/v3 import
   * This tests the new SDK-recommended pattern.
   */
  private registerHealthCheckDirect(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'health_check_v2_direct',
      {
        title: 'Health Check (v2 - direct pattern)',
        description: 'Check API connection - using direct schema with zod/v3',
        inputSchema: {
          // <-- Direct Zod schema object
          instance: instanceParam,
        },
      },
      async ({ instance }) => {
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

  /**
   * Test: .shape pattern with zod/v3 import for getApiInfo
   */
  private registerGetApiInfoWithShape(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_api_info_v2_shape',
      {
        title: 'Get API Info (v2 - shape pattern)',
        description: 'Get API info - using .shape pattern with zod/v3',
        inputSchema: getApiInfoSchemaV3.shape, // <-- .shape pattern
      },
      async ({ instance }) => {
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

  /**
   * Test: Direct pattern with zod/v3 import for getApiInfo
   */
  private registerGetApiInfoDirect(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory
  ): void {
    server.registerTool(
      'get_api_info_v2_direct',
      {
        title: 'Get API Info (v2 - direct pattern)',
        description: 'Get API info - using direct schema with zod/v3',
        inputSchema: {
          // <-- Direct Zod schema object
          instance: instanceParam,
        },
      },
      async ({ instance }) => {
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
