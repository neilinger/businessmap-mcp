#!/usr/bin/env node
/**
 * Baseline Token Measurement Script
 *
 * Measures token counts for all MCP tool definitions and generates
 * a comprehensive baseline report for optimization tracking.
 *
 * Usage:
 *   npm run measure:baseline
 *
 * Output:
 *   - Console: Tool count and total token summary
 *   - File: specs/003-schema-compression-lazy-loading/research/baseline-measurements.json
 *
 * Phase: Token Optimization Phase 2 (Task T004)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { countToolTokens } from '../dist/metrics/token-counter.js';
import { reportAllMetrics, type ToolDefinition } from '../dist/metrics/metrics-reporter.js';
import {
  BoardToolHandler,
  CardToolHandler,
  CustomFieldToolHandler,
  InstanceToolHandler,
  UserToolHandler,
  UtilityToolHandler,
  WorkflowToolHandler,
  WorkspaceToolHandler,
} from '../dist/server/tools/index.js';

// Convert import.meta.url to __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path for output file
const OUTPUT_DIR = path.join(__dirname, '../specs/003-schema-compression-lazy-loading/research');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'baseline-measurements.json');

/**
 * Mock MCP server that captures tool registrations
 */
class MockMcpServer {
  private tools: ToolDefinition[] = [];

  registerTool(name: string, definition: any, _handler: any): void {
    // Store the full tool definition for token counting
    this.tools.push({
      name,
      schema: {
        name,
        description: definition.description,
        inputSchema: definition.inputSchema,
      },
    });
  }

  getTools(): ToolDefinition[] {
    return this.tools;
  }

  getToolCount(): number {
    return this.tools.length;
  }
}

/**
 * Mock client factory that satisfies tool handler requirements
 *
 * Note: We use a mock factory instead of a real client to avoid
 * initialization dependencies and focus purely on tool registration.
 */
class MockClientFactory {
  // Minimal implementation to allow tool registration
  async initialize(): Promise<void> {
    // No-op
  }

  async getClient(_instance?: string): Promise<any> {
    return new MockClient();
  }

  getDefaultInstanceName(): string {
    return 'default';
  }

  getAvailableInstances(): string[] {
    return ['default'];
  }

  getCachedInstances(): string[] {
    return [];
  }

  isLegacyMode(): boolean {
    return true;
  }
}

/**
 * Mock client that satisfies tool handler requirements
 */
class MockClient {
  // Minimal implementation to allow tool registration
  async initialize(): Promise<void> {
    // No-op
  }
}

/**
 * Collect all tool definitions by registering them with mock server
 */
async function collectToolDefinitions(): Promise<ToolDefinition[]> {
  const mockServer = new MockMcpServer();
  const mockClient = new MockClient();
  const readOnlyMode = false; // Register all tools including write operations

  // Tool handlers (must match BusinessMapMcpServer.setupTools())
  const handlers = [
    new WorkspaceToolHandler(),
    new BoardToolHandler(),
    new CardToolHandler(),
    new CustomFieldToolHandler(),
    new UserToolHandler(),
    new UtilityToolHandler(),
    new WorkflowToolHandler(),
    new InstanceToolHandler(),
  ];

  // Register all tools from handlers
  handlers.forEach((handler) => {
    handler.registerTools(mockServer as any, mockClient as any, readOnlyMode);
  });

  return mockServer.getTools();
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log('🔍 Collecting tool definitions...\n');

    // Collect all tool definitions
    const tools = await collectToolDefinitions();

    console.log(`📊 Found ${tools.length} tools\n`);

    // Generate metrics report
    console.log('📏 Measuring token counts...\n');
    const report = reportAllMetrics(tools);

    // Display summary
    console.log('✅ Baseline Measurements Complete\n');
    console.log('═══════════════════════════════════════');
    console.log(`Total Tools:       ${tools.length}`);
    console.log(`Total Tokens:      ${report.total.toLocaleString()}`);
    console.log(`Average per Tool:  ${report.averagePerTool.toLocaleString()}`);
    console.log('═══════════════════════════════════════\n');

    // Sort tools by token count (descending) for analysis
    const sortedTools = [...report.tools].sort((a, b) => b.tokens - a.tokens);

    // Display top 10 tools by token count
    console.log('📈 Top 10 Tools by Token Count:\n');
    sortedTools.slice(0, 10).forEach((tool, index) => {
      console.log(`${(index + 1).toString().padStart(2)}. ${tool.tool.padEnd(30)} ${tool.tokens.toLocaleString().padStart(6)} tokens`);
    });
    console.log();

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
    }

    // Save full report to JSON file
    const reportJson = JSON.stringify(report, null, 2);
    fs.writeFileSync(OUTPUT_FILE, reportJson, 'utf-8');

    console.log(`💾 Saved detailed report to: ${OUTPUT_FILE}\n`);
    console.log('Next steps:');
    console.log('  1. Run: npm run measure:baseline');
    console.log('  2. Verify token count matches expected ~38,900 tokens (Task T006)');
    console.log('  3. Proceed with schema compression (Phase 2)\n');

  } catch (error) {
    console.error('❌ Error measuring baseline:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Execute
main();
