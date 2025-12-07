import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { logger } from '../../utils/logger.js';
import { BusinessMapClient } from '../../client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../client/client-factory.js';
import { config } from '../../config/environment.js';

/**
 * Base interface for tool handlers
 */
export interface BaseToolHandler {
  /**
   * Register all tools provided by this handler
   * @param server The MCP server instance
   * @param clientOrFactory The BusinessMap client or client factory instance
   * @param readOnlyMode Whether the server is in read-only mode
   */
  registerTools(
    server: McpServer,
    clientOrFactory: BusinessMapClient | BusinessMapClientFactory,
    readOnlyMode: boolean,
    enabledTools?: string[]
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
    logger.warn(
      `Large response: ${tokenEstimate} tokens (~${(byteSize / 1024).toFixed(1)}KB) - consider pagination`
    );
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
    logger.warn(
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

/**
 * Check if a tool should be registered based on the enabled tools list
 *
 * @param toolName - The name of the tool to check
 * @param enabledTools - Optional array of enabled tool names (empty/undefined means all tools enabled)
 * @returns True if the tool should be registered
 *
 * @example
 * ```typescript
 * // With profile filtering
 * if (shouldRegisterTool('list_boards', ['list_boards', 'get_board'])) {
 *   // Register the tool
 * }
 *
 * // Without filtering (backward compatibility)
 * if (shouldRegisterTool('list_boards', undefined)) {
 *   // Always returns true - register all tools
 * }
 * ```
 */
export function shouldRegisterTool(toolName: string, enabledTools?: string[]): boolean {
  // If no enabled tools list provided, register all tools (backward compatibility)
  if (!enabledTools || enabledTools.length === 0) {
    return true;
  }

  return enabledTools.includes(toolName);
}
