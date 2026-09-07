/**
 * ToolRegistrar — thin wrapper around McpServer.registerTool() that enforces:
 *   1. Profile gate: only tools in enabledTools[] are registered
 *   2. Read-only gate: tools in WRITE_TOOLS are suppressed when readOnly=true
 *
 * Empty enabledTools array means no tools are registered (natural semantics —
 * replaces the old "[] = all tools" invariant).
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { WRITE_TOOLS, type ToolName } from '../config/tool-profiles.js';

/**
 * The config object accepted by McpServer.registerTool().
 * Matches the second parameter of the registerTool overload in the SDK.
 */
type RegisterToolConfig = {
  title?: string;
  description?: string;
  inputSchema?: ZodRawShapeCompat | AnySchema;
  outputSchema?: ZodRawShapeCompat | AnySchema;
  annotations?: ToolAnnotations;
  _meta?: Record<string, unknown>;
};

export class ToolRegistrar {
  private readonly server: McpServer;
  private readonly enabledTools: string[];
  private readonly readOnly: boolean;

  constructor(server: McpServer, enabledTools: string[], readOnly: boolean) {
    this.server = server;
    this.enabledTools = enabledTools;
    this.readOnly = readOnly;
  }

  /**
   * Register a tool on the underlying McpServer, subject to profile and read-only gates.
   *
   * No-op if:
   *   - `name` is not in `enabledTools` (profile gate), or
   *   - `name` is in `WRITE_TOOLS` and `readOnly` is true (read-only gate)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerTool(
    name: ToolName,
    config: RegisterToolConfig,
    handler: (args: any, extra?: any) => any
  ): void {
    if (!this.enabledTools.includes(name)) {
      return;
    }

    if (WRITE_TOOLS.has(name) && this.readOnly) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.server.registerTool(name, config as any, handler as any);
  }
}
