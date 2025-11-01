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
 *
 * @param data - Response data to serialize
 * @param message - Optional message prefix
 * @returns MCP-formatted response with JSON content
 *
 * @remarks
 * Token overhead optimization:
 * - Defaults to compact JSON (BUSINESSMAP_PRETTY_JSON=false)
 * - Pretty-printing available for debugging (BUSINESSMAP_PRETTY_JSON=true)
 * - Monitors large responses (>10K tokens) with pagination suggestions
 *
 * TODO: Add unit tests for BUSINESSMAP_PRETTY_JSON flag behavior
 */
export function createSuccessResponse(data: any, message?: string) {
  const prettyJson = config.formatting.prettyJson;
  const jsonString = prettyJson ? JSON.stringify(data, null, 2) : JSON.stringify(data);

  // Monitor response size and estimate token usage
  const byteSize = Buffer.byteLength(jsonString, 'utf8');
  // Token estimation heuristic: 1 token ≈ 4 bytes for English text
  // Note: Accuracy varies for non-ASCII characters (may be 2-3x off for Unicode-heavy content)
  const tokenEstimate = Math.ceil(byteSize / 4);

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
