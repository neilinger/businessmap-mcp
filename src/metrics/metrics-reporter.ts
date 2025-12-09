/**
 * Metrics reporting utilities for per-tool token usage analysis
 *
 * Provides structured reporting of token counts across MCP tools
 * to support schema optimization and performance tracking.
 */

import { countToolTokens } from './token-counter.js';

/**
 * Metrics for a single tool's token usage
 */
export interface ToolMetrics {
  /** Tool name/identifier */
  tool: string;
  /** Number of tokens in tool schema */
  tokens: number;
  /** ISO 8601 timestamp when metrics were collected */
  timestamp: string;
}

/**
 * Aggregate metrics report for multiple tools
 */
export interface MetricsReport {
  /** Total tokens across all tools */
  total: number;
  /** Individual tool metrics */
  tools: ToolMetrics[];
  /** ISO 8601 timestamp of report generation */
  timestamp: string;
  /** Average tokens per tool */
  averagePerTool: number;
}

/**
 * Tool definition for metrics collection
 */
export interface ToolDefinition {
  /** Tool name */
  name: string;
  /** Tool schema (will be serialized for token counting) */
  schema: any;
}

/**
 * Format token metrics for a single tool
 *
 * @param toolName - The name of the tool
 * @param tokenCount - The number of tokens in the tool schema
 * @returns Formatted metrics object
 *
 * @example
 * ```typescript
 * const metrics = formatToolMetrics("create_card", 3600);
 * // Returns:
 * // {
 * //   tool: "create_card",
 * //   tokens: 3600,
 * //   timestamp: "2024-11-19T12:00:00.000Z"
 * // }
 * ```
 */
export function formatToolMetrics(toolName: string, tokenCount: number): ToolMetrics {
  if (typeof toolName !== 'string' || toolName.length === 0) {
    throw new Error('Tool name must be a non-empty string');
  }

  if (typeof tokenCount !== 'number' || tokenCount < 0 || !Number.isFinite(tokenCount)) {
    throw new Error(`Invalid token count for ${toolName}: ${tokenCount}`);
  }

  return {
    tool: toolName,
    tokens: tokenCount,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate a comprehensive metrics report for multiple tools
 *
 * Counts tokens for each tool and aggregates statistics including
 * total, average, and per-tool breakdown.
 *
 * @param tools - Array of tool definitions to analyze
 * @returns Comprehensive metrics report
 * @throws {Error} If token counting fails for any tool
 *
 * @example
 * ```typescript
 * const report = reportAllMetrics([
 *   { name: "create_card", schema: {...} },
 *   { name: "update_card", schema: {...} }
 * ]);
 * // Returns:
 * // {
 * //   total: 6300,
 * //   tools: [
 * //     { tool: "create_card", tokens: 3600, timestamp: "..." },
 * //     { tool: "update_card", tokens: 2700, timestamp: "..." }
 * //   ],
 * //   timestamp: "2024-11-19T12:00:00.000Z",
 * //   averagePerTool: 3150
 * // }
 * ```
 */
export function reportAllMetrics(tools: ToolDefinition[]): MetricsReport {
  if (!Array.isArray(tools)) {
    throw new Error('Tools must be an array');
  }

  const timestamp = new Date().toISOString();
  const toolMetrics: ToolMetrics[] = [];
  let total = 0;

  // Handle empty array case
  if (tools.length === 0) {
    return {
      total: 0,
      tools: [],
      timestamp,
      averagePerTool: 0,
    };
  }

  // Collect metrics for each tool
  for (const tool of tools) {
    if (!tool || typeof tool.name !== 'string') {
      throw new Error(`Invalid tool definition: ${JSON.stringify(tool)}`);
    }

    try {
      const tokenCount = countToolTokens(tool.name, tool.schema);
      const metrics = formatToolMetrics(tool.name, tokenCount);

      toolMetrics.push(metrics);
      total += tokenCount;
    } catch (error: unknown) {
      throw new Error(
        `Failed to generate metrics for tool ${tool.name}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  const averagePerTool = tools.length > 0 ? Math.round(total / tools.length) : 0;

  return {
    total,
    tools: toolMetrics,
    timestamp,
    averagePerTool,
  };
}

/**
 * Format metrics report as JSON string
 *
 * @param report - The metrics report to format
 * @param pretty - Whether to use pretty printing (default: false)
 * @returns JSON string representation
 *
 * @example
 * ```typescript
 * const json = formatAsJson(report, true);
 * // Returns formatted JSON string with indentation
 * ```
 */
export function formatAsJson(report: MetricsReport, pretty: boolean = false): string {
  try {
    return JSON.stringify(report, null, pretty ? 2 : undefined);
  } catch (error: unknown) {
    throw new Error(
      `Failed to serialize metrics report: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Compare two metrics reports and calculate reduction
 *
 * Useful for tracking optimization progress across phases.
 *
 * @param baseline - The baseline metrics report
 * @param optimized - The optimized metrics report
 * @returns Comparison statistics
 *
 * @example
 * ```typescript
 * const comparison = compareMetrics(baselineReport, optimizedReport);
 * // Returns:
 * // {
 * //   baselineTotal: 38900,
 * //   optimizedTotal: 12500,
 * //   reduction: 26400,
 * //   reductionPercent: 68
 * // }
 * ```
 */
export function compareMetrics(
  baseline: MetricsReport,
  optimized: MetricsReport
): {
  baselineTotal: number;
  optimizedTotal: number;
  reduction: number;
  reductionPercent: number;
} {
  if (!baseline || !optimized) {
    throw new Error('Both baseline and optimized reports are required');
  }

  const reduction = baseline.total - optimized.total;
  const reductionPercent = baseline.total > 0 ? Math.round((reduction / baseline.total) * 100) : 0;

  return {
    baselineTotal: baseline.total,
    optimizedTotal: optimized.total,
    reduction,
    reductionPercent,
  };
}
