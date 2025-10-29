import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { config } from '../../config/environment.js';
import { createLoggerSync } from '@toolprint/mcp-logger';

const logger = createLoggerSync({ level: 'debug' });

/**
 * Base interface for tool handlers
 */
export interface BaseToolHandler {
  /**
   * Register all tools provided by this handler
   * @param server The MCP server instance
   * @param client The BusinessMap client instance
   * @param readOnlyMode Whether the server is in read-only mode
   */
  registerTools(server: McpServer, client: BusinessMapClient, readOnlyMode: boolean): void;
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
  const prettyJson = config.formatting.prettyJson;
  const jsonString = prettyJson ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  // Monitor response size
  const byteSize = Buffer.byteLength(jsonString, 'utf8');
  const tokenEstimate = Math.ceil(byteSize / 4); // rough estimate: 1 token ≈ 4 bytes

  if (tokenEstimate > 10000) {
    logger.warn(`Large response: ${tokenEstimate} tokens (~${(byteSize / 1024).toFixed(1)}KB) - consider pagination`);
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: message ? `${message}\n${jsonString}` : jsonString,
      },
    ],
  };
}
