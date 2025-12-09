/**
 * Token counting utilities using tiktoken (cl100k_base encoding for GPT-4)
 *
 * Provides functions to count tokens in text and JSON schemas for
 * measuring MCP tool initialization costs.
 */

import { getEncoding as getTiktokenEncoding, Tiktoken } from 'js-tiktoken';

// Cache the encoding instance for reuse
let encodingInstance: Tiktoken | null = null;

/**
 * Get or create the cl100k_base encoding instance
 *
 * @throws {Error} If tiktoken encoding initialization fails
 */
function getEncoding(): Tiktoken {
  if (!encodingInstance) {
    try {
      // cl100k_base is used by GPT-4, GPT-3.5-turbo, and text-embedding-ada-002
      encodingInstance = getTiktokenEncoding('cl100k_base');
    } catch (error: unknown) {
      throw new Error(
        `Failed to initialize tiktoken encoding: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }
  return encodingInstance;
}

/**
 * Count tokens in text using cl100k_base encoding (GPT-4)
 *
 * @param text - The text to count tokens for
 * @returns The number of tokens
 * @throws {Error} If text is not a string or encoding fails
 *
 * @example
 * ```typescript
 * const tokens = countTokens("Hello world");
 * // Returns: 2
 * ```
 */
export function countTokens(text: string): number {
  if (typeof text !== 'string') {
    throw new Error(`Expected string, got ${typeof text}`);
  }

  if (text.length === 0) {
    return 0;
  }

  try {
    const encoding = getEncoding();
    const tokens = encoding.encode(text);
    return tokens.length;
  } catch (error: unknown) {
    throw new Error(
      `Failed to count tokens: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Count tokens in a tool's JSON schema
 *
 * Serializes the schema to JSON and counts tokens. This measures
 * the token cost of registering a tool with the MCP protocol.
 *
 * @param toolName - The name of the tool (for error messages)
 * @param toolSchema - The tool's schema object
 * @returns The number of tokens in the serialized schema
 * @throws {Error} If schema serialization or token counting fails
 *
 * @example
 * ```typescript
 * const tokens = countToolTokens("create_card", {
 *   name: "create_card",
 *   description: "Create a new card",
 *   inputSchema: { type: "object", properties: {...} }
 * });
 * // Returns: token count for the entire schema
 * ```
 */
export function countToolTokens(toolName: string, toolSchema: any): number {
  if (!toolSchema) {
    throw new Error(`Tool schema is required for ${toolName}`);
  }

  try {
    // Serialize schema to JSON (compact format, no whitespace)
    const schemaJson = JSON.stringify(toolSchema);
    return countTokens(schemaJson);
  } catch (error: unknown) {
    throw new Error(
      `Failed to count tokens for tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Clear the cached encoding instance
 *
 * Call this when done with all token counting operations.
 * Primarily useful in test scenarios to ensure clean state.
 */
export function cleanup(): void {
  encodingInstance = null;
}
