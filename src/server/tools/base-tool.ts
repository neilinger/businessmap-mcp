import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';

/**
 * Base interface for tool handlers
 */
export interface BaseToolHandler {
  /**
   * Register all tools provided by this handler
   * @param server The MCP server instance
   * @param clientOrFactory The BusinessMap client instance or client factory
   * @param readOnlyMode Whether the server is in read-only mode
   */
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean
  ): void;
}

/**
 * Standard error handler for tool responses
 */
export function createErrorResponse(error: unknown, operation: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: `Error ${operation}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    ],
    isError: true,
  };
}

/**
 * Standard success handler for tool responses
 */
export function createSuccessResponse(data: any, message?: string) {
  return {
    content: [
      {
        type: 'text' as const,
        text: message
          ? `${message}\n${JSON.stringify(data, null, 2)}`
          : JSON.stringify(data, null, 2),
      },
    ],
  };
}

/**
 * Helper function to get client for a specific instance
 * Supports both legacy single-client mode and new multi-instance factory mode
 *
 * @param clientOrFactory - Either a BusinessMapClient (legacy) or BusinessMapClientFactory (new)
 * @param instance - Optional instance name
 * @returns BusinessMapClient for the specified instance
 */
export async function getClientForInstance(
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
  instance?: string
): Promise<BusinessMapClient> {
  // Check if this is a factory instance
  if (clientOrFactory instanceof BusinessMapClientFactory) {
    return await clientOrFactory.getClient(instance);
  }

  // Legacy mode - single client
  // If instance parameter is provided in legacy mode, log a warning
  if (instance) {
    console.warn(
      `Instance parameter '${instance}' provided but server is running in legacy single-instance mode. Using default client.`
    );
  }

  return clientOrFactory;
}

/**
 * Check if the server is running in multi-instance mode
 */
export function isMultiInstanceMode(
  clientOrFactory: BusinessMapClient | BusinessMapClientFactory
): boolean {
  return clientOrFactory instanceof BusinessMapClientFactory;
}
