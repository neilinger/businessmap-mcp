#!/usr/bin/env node
/**
 * Profile Token Measurement Script
 *
 * Measures token counts for specific tool profiles (minimal, standard, full)
 * and validates against token optimization targets.
 *
 * Usage:
 *   npm run measure:profile                              # Measure all profiles
 *   BUSINESSMAP_TOOL_PROFILE=minimal npm run measure:profile
 *   BUSINESSMAP_TOOL_PROFILE=standard npm run measure:profile
 *   BUSINESSMAP_TOOL_PROFILE=full npm run measure:profile
 *
 * Output:
 *   - Console: Per-profile token counts with PASS/FAIL status
 *   - File: specs/003-schema-compression-lazy-loading/research/profile-measurements.json
 *
 * Phase: Token Optimization Phase 2 (Tasks T047-T049)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  getToolsForProfile,
  getToolProfile,
  PROFILE_METADATA,
  type ToolProfile,
} from '../dist/config/tool-profiles.js';
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
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'profile-measurements.json');

// Token targets for each profile
const TOKEN_TARGETS: Record<ToolProfile, { target: number; description: string }> = {
  minimal: { target: 9000, description: '77% reduction from baseline' },
  standard: { target: 20000, description: '49% reduction from baseline' },
  full: { target: 36722, description: 'Baseline reference' },
};

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
 */
class MockClientFactory {
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
  async initialize(): Promise<void> {
    // No-op
  }
}

/**
 * Collect all tool definitions by registering them with mock server
 */
async function collectAllToolDefinitions(): Promise<ToolDefinition[]> {
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
 * Filter tools by profile
 */
function filterToolsByProfile(allTools: ToolDefinition[], profile: ToolProfile): ToolDefinition[] {
  const profileToolNames = getToolsForProfile(profile);
  return allTools.filter((tool) => profileToolNames.includes(tool.name));
}

/**
 * Measure a single profile
 */
async function measureProfile(
  profile: ToolProfile,
  allTools: ToolDefinition[]
): Promise<{
  profile: ToolProfile;
  metadata: typeof PROFILE_METADATA[ToolProfile];
  tokens: number;
  target: number;
  targetDescription: string;
  status: 'PASS' | 'FAIL' | 'INFO';
  tools: ToolDefinition[];
}> {
  const metadata = PROFILE_METADATA[profile];
  const targetInfo = TOKEN_TARGETS[profile];
  const profileTools = filterToolsByProfile(allTools, profile);
  const report = reportAllMetrics(profileTools);

  // Determine status
  let status: 'PASS' | 'FAIL' | 'INFO' = 'INFO';
  if (profile === 'minimal') {
    status = report.total <= targetInfo.target ? 'PASS' : 'FAIL';
  } else if (profile === 'standard') {
    status = report.total <= targetInfo.target ? 'PASS' : 'FAIL';
  }

  return {
    profile,
    metadata,
    tokens: report.total,
    target: targetInfo.target,
    targetDescription: targetInfo.description,
    status,
    tools: profileTools,
  };
}

/**
 * Format and display results
 */
function displayResults(results: Awaited<ReturnType<typeof measureProfile>>[]): void {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('                    Profile Token Measurements');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : 'ℹ️';

    console.log(`Profile:      ${result.metadata.name}`);
    console.log(`Description:  ${result.metadata.description}`);
    console.log(`Tool Count:   ${result.tools.length}`);
    console.log(`Total Tokens: ${result.tokens.toLocaleString()}`);
    console.log(`Target:       ${result.target.toLocaleString()} tokens (${result.targetDescription})`);
    console.log(`Status:       ${result.status} ${statusIcon}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                           Summary');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : 'ℹ️';
    const percentage = ((result.tokens / result.target) * 100).toFixed(1);
    console.log(
      `${result.metadata.name.padEnd(10)} ${result.tokens.toLocaleString().padStart(7)} / ${result.target.toLocaleString().padStart(7)} (${percentage.padStart(5)}%) ${result.status} ${statusIcon}`
    );
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log('\n🔍 Collecting tool definitions...\n');

    // Collect all tool definitions
    const allTools = await collectAllToolDefinitions();
    console.log(`📊 Found ${allTools.length} total tools\n`);

    // Determine which profiles to measure
    const envProfile = process.env.BUSINESSMAP_TOOL_PROFILE;
    const profilesToMeasure: ToolProfile[] = envProfile
      ? [envProfile as ToolProfile]
      : ['minimal', 'standard', 'full'];

    console.log(`📏 Measuring profiles: ${profilesToMeasure.join(', ')}\n`);

    // Measure each profile
    const results: Awaited<ReturnType<typeof measureProfile>>[] = [];
    for (const profile of profilesToMeasure) {
      const result = await measureProfile(profile, allTools);
      results.push(result);
    }

    // Display results
    displayResults(results);

    // Ensure output directory exists
    if (!fs.existsSync(OUTPUT_DIR)) {
      fs.mkdirSync(OUTPUT_DIR, { recursive: true });
      console.log(`📁 Created output directory: ${OUTPUT_DIR}\n`);
    }

    // Save detailed results to JSON file
    const reportData = {
      timestamp: new Date().toISOString(),
      profiles: results.map((r) => ({
        profile: r.profile,
        metadata: r.metadata,
        tokens: r.tokens,
        target: r.target,
        targetDescription: r.targetDescription,
        status: r.status,
        toolCount: r.tools.length,
        tools: r.tools.map((t) => t.name).sort(),
      })),
    };

    const reportJson = JSON.stringify(reportData, null, 2);
    fs.writeFileSync(OUTPUT_FILE, reportJson, 'utf-8');

    console.log(`💾 Saved detailed report to: ${OUTPUT_FILE}\n`);

    // Exit with error if any profile failed
    const hasFailures = results.some((r) => r.status === 'FAIL');
    if (hasFailures) {
      console.error('❌ Some profiles did not meet token targets\n');
      process.exit(1);
    } else {
      console.log('✅ All measured profiles meet token targets\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error measuring profiles:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Execute
main();
