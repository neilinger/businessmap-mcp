#!/usr/bin/env node
/**
 * Profile Registration Performance Benchmark
 *
 * Measures registration time for tool profiles and validates against <2 second target.
 *
 * Usage:
 *   npm run benchmark:profile                  # Benchmark all profiles
 *   BUSINESSMAP_TOOL_PROFILE=minimal npm run benchmark:profile
 *
 * Output:
 *   - Console: Performance metrics with PASS/FAIL status
 *   - File: specs/003-schema-compression-lazy-loading/research/benchmark-profile-registration.json
 *
 * Task: T073 - Performance benchmark profile registration time
 * Target: <2 seconds for any profile (minimal, standard, full)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';
import {
  getToolsForProfile,
  PROFILE_METADATA,
  type ToolProfile,
} from '../dist/config/tool-profiles.js';
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

// Configuration
const OUTPUT_DIR = path.join(__dirname, '../specs/003-schema-compression-lazy-loading/research');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'benchmark-profile-registration.json');
const ITERATIONS = 10; // Number of iterations per profile
const TARGET_MS = 2000; // Target: <2 seconds

/**
 * Mock MCP server for registration benchmarking
 */
class MockMcpServer {
  private tools: Map<string, any> = new Map();

  registerTool(name: string, definition: any, _handler: any): void {
    this.tools.set(name, definition);
  }

  getToolCount(): number {
    return this.tools.size;
  }

  clearTools(): void {
    this.tools.clear();
  }
}

/**
 * Mock client factory
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
 * Mock client
 */
class MockClient {
  async initialize(): Promise<void> {
    // No-op
  }
}

/**
 * Benchmark result for a single iteration
 */
interface BenchmarkIteration {
  iteration: number;
  durationMs: number;
  toolCount: number;
}

/**
 * Benchmark result for a profile
 */
interface ProfileBenchmark {
  profile: ToolProfile;
  metadata: typeof PROFILE_METADATA[ToolProfile];
  iterations: BenchmarkIteration[];
  statistics: {
    minMs: number;
    maxMs: number;
    avgMs: number;
    medianMs: number;
    p95Ms: number;
    stdDevMs: number;
  };
  targetMs: number;
  status: 'PASS' | 'FAIL';
}

/**
 * Calculate statistics from benchmark iterations
 */
function calculateStatistics(iterations: BenchmarkIteration[]): ProfileBenchmark['statistics'] {
  const durations = iterations.map((i) => i.durationMs).sort((a, b) => a - b);
  const sum = durations.reduce((acc, val) => acc + val, 0);
  const avg = sum / durations.length;

  // Calculate standard deviation
  const squaredDiffs = durations.map((val) => Math.pow(val - avg, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / durations.length;
  const stdDev = Math.sqrt(variance);

  // Calculate percentiles
  const median = durations[Math.floor(durations.length / 2)];
  const p95Index = Math.ceil(durations.length * 0.95) - 1;
  const p95 = durations[p95Index];

  return {
    minMs: Math.min(...durations),
    maxMs: Math.max(...durations),
    avgMs: avg,
    medianMs: median,
    p95Ms: p95,
    stdDevMs: stdDev,
  };
}

/**
 * Register tools for a specific profile
 */
function registerProfileTools(
  mockServer: MockMcpServer,
  profile: ToolProfile,
  readOnlyMode: boolean = false
): number {
  const mockClient = new MockClient();
  const profileToolNames = getToolsForProfile(profile);

  // Create tool handlers
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

  // Register tools from handlers
  handlers.forEach((handler) => {
    handler.registerTools(mockServer as any, mockClient as any, readOnlyMode);
  });

  return mockServer.getToolCount();
}

/**
 * Run a single benchmark iteration
 */
function runIteration(
  mockServer: MockMcpServer,
  profile: ToolProfile,
  iteration: number
): BenchmarkIteration {
  // Clear previous tools
  mockServer.clearTools();

  // Measure registration time
  const startTime = performance.now();
  const toolCount = registerProfileTools(mockServer, profile);
  const endTime = performance.now();

  const durationMs = endTime - startTime;

  return {
    iteration,
    durationMs,
    toolCount,
  };
}

/**
 * Benchmark a single profile
 */
async function benchmarkProfile(profile: ToolProfile): Promise<ProfileBenchmark> {
  console.log(`\n📊 Benchmarking profile: ${profile}`);
  console.log(`   Running ${ITERATIONS} iterations...`);

  const mockServer = new MockMcpServer();
  const iterations: BenchmarkIteration[] = [];

  // Run iterations
  for (let i = 1; i <= ITERATIONS; i++) {
    const result = runIteration(mockServer, profile, i);
    iterations.push(result);

    // Progress indicator
    if (i % 2 === 0 || i === ITERATIONS) {
      process.stdout.write(`   Progress: ${i}/${ITERATIONS}\r`);
    }
  }

  console.log(`   ✅ Completed ${ITERATIONS} iterations\n`);

  // Calculate statistics
  const statistics = calculateStatistics(iterations);
  const metadata = PROFILE_METADATA[profile];

  // Determine pass/fail status (p95 must be under target)
  const status = statistics.p95Ms < TARGET_MS ? 'PASS' : 'FAIL';

  return {
    profile,
    metadata,
    iterations,
    statistics,
    targetMs: TARGET_MS,
    status,
  };
}

/**
 * Display benchmark results
 */
function displayResults(results: ProfileBenchmark[]): void {
  console.log('\n═══════════════════════════════════════════════════════════════════');
  console.log('           Profile Registration Performance Benchmark');
  console.log('═══════════════════════════════════════════════════════════════════\n');
  console.log(`Target: <${TARGET_MS}ms for any profile`);
  console.log(`Iterations per profile: ${ITERATIONS}\n`);

  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    const stats = result.statistics;

    console.log(`Profile:      ${result.metadata.name} (${result.metadata.toolCount} tools)`);
    console.log(`Description:  ${result.metadata.description}`);
    console.log(`\nPerformance Statistics:`);
    console.log(`  Min:        ${stats.minMs.toFixed(2)}ms`);
    console.log(`  Max:        ${stats.maxMs.toFixed(2)}ms`);
    console.log(`  Average:    ${stats.avgMs.toFixed(2)}ms`);
    console.log(`  Median:     ${stats.medianMs.toFixed(2)}ms`);
    console.log(`  P95:        ${stats.p95Ms.toFixed(2)}ms`);
    console.log(`  Std Dev:    ${stats.stdDevMs.toFixed(2)}ms`);
    console.log(`\nTarget:       <${result.targetMs}ms`);
    console.log(`Status:       ${result.status} ${statusIcon}\n`);
  }

  console.log('═══════════════════════════════════════════════════════════════════');
  console.log('                           Summary');
  console.log('═══════════════════════════════════════════════════════════════════\n');

  console.log('Profile      Tools    P95 Time    Target    Status');
  console.log('───────────  ───────  ──────────  ────────  ──────');
  for (const result of results) {
    const statusIcon = result.status === 'PASS' ? '✅' : '❌';
    const p95Str = `${result.statistics.p95Ms.toFixed(2)}ms`;
    const targetStr = `<${result.targetMs}ms`;

    console.log(
      `${result.profile.padEnd(12)} ${String(result.metadata.toolCount).padStart(7)} ${p95Str.padStart(11)} ${targetStr.padStart(9)} ${result.status} ${statusIcon}`
    );
  }

  console.log('\n═══════════════════════════════════════════════════════════════════\n');
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    console.log('\n🚀 Starting Profile Registration Performance Benchmark\n');

    // Determine which profiles to benchmark
    const envProfile = process.env.BUSINESSMAP_TOOL_PROFILE;
    const profilesToBenchmark: ToolProfile[] = envProfile
      ? [envProfile as ToolProfile]
      : ['minimal', 'standard', 'full'];

    console.log(`📏 Benchmarking profiles: ${profilesToBenchmark.join(', ')}`);
    console.log(`🎯 Target: <${TARGET_MS}ms per profile (P95)`);
    console.log(`🔄 Iterations: ${ITERATIONS} per profile\n`);

    // Benchmark each profile
    const results: ProfileBenchmark[] = [];
    for (const profile of profilesToBenchmark) {
      const result = await benchmarkProfile(profile);
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
      configuration: {
        targetMs: TARGET_MS,
        iterations: ITERATIONS,
      },
      profiles: results.map((r) => ({
        profile: r.profile,
        metadata: r.metadata,
        statistics: r.statistics,
        targetMs: r.targetMs,
        status: r.status,
        iterations: r.iterations,
      })),
      summary: {
        totalProfiles: results.length,
        passedProfiles: results.filter((r) => r.status === 'PASS').length,
        failedProfiles: results.filter((r) => r.status === 'FAIL').length,
      },
    };

    const reportJson = JSON.stringify(reportData, null, 2);
    fs.writeFileSync(OUTPUT_FILE, reportJson, 'utf-8');

    console.log(`💾 Saved detailed report to: ${OUTPUT_FILE}\n`);

    // Exit with error if any profile failed
    const hasFailures = results.some((r) => r.status === 'FAIL');
    if (hasFailures) {
      console.error('❌ Some profiles did not meet performance target (<2 seconds)\n');
      process.exit(1);
    } else {
      console.log('✅ All profiles meet performance target (<2 seconds)\n');
      process.exit(0);
    }
  } catch (error) {
    console.error('❌ Error running benchmark:', error);
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack);
    }
    process.exit(1);
  }
}

// Execute
main();
