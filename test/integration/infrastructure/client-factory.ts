/**
 * Test Client Factory
 *
 * Creates BusinessMapClient instances for integration tests using the same
 * credential loading mechanism as the MCP server.
 *
 * Credential sources (in order of precedence):
 * 1. Environment variables (BUSINESSMAP_API_TOKEN_KERKOW, BUSINESSMAP_API_TOKEN_FIMANCIA)
 * 2. .mcp.json file (reads env values from mcpServers.businessmap.env)
 * 3. Falls back to instance config from .businessmap-instances.json
 *
 * This ensures tests connect to the same BusinessMap instance as the MCP server.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { BusinessMapClient } from '../../../src/client/businessmap-client.js';

/**
 * Instance configuration for tests.
 */
export interface TestInstanceConfig {
  name: string;
  apiUrl: string;
  apiToken: string;
}

/**
 * MCP configuration file structure.
 */
interface McpConfig {
  mcpServers?: {
    businessmap?: {
      env?: Record<string, string>;
    };
  };
}

/**
 * BusinessMap instances configuration file structure.
 */
interface InstancesConfig {
  version: string;
  defaultInstance: string;
  instances: Array<{
    name: string;
    apiUrl: string;
    apiTokenEnv: string;
    description?: string;
    defaultWorkspaceId?: number;
  }>;
}

/**
 * Load credentials from .mcp.json file.
 * This is the same source Claude Code uses to launch the MCP server.
 */
function loadMcpCredentials(): Record<string, string> {
  const mcpJsonPath = join(process.cwd(), '.mcp.json');

  if (!existsSync(mcpJsonPath)) {
    return {};
  }

  try {
    const content = readFileSync(mcpJsonPath, 'utf-8');
    const config: McpConfig = JSON.parse(content);
    return config.mcpServers?.businessmap?.env || {};
  } catch {
    console.warn('Failed to parse .mcp.json, skipping MCP credentials');
    return {};
  }
}

/**
 * Load instance definitions from .businessmap-instances.json.
 */
function loadInstancesConfig(): InstancesConfig | null {
  const configPath = join(process.cwd(), '.businessmap-instances.json');

  if (!existsSync(configPath)) {
    return null;
  }

  try {
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    console.warn('Failed to parse .businessmap-instances.json');
    return null;
  }
}

/**
 * Resolve API token for an instance.
 *
 * Order of precedence:
 * 1. Environment variable directly (e.g., BUSINESSMAP_API_TOKEN_KERKOW)
 * 2. MCP config env values from .mcp.json
 */
function resolveToken(envVarName: string, mcpCredentials: Record<string, string>): string | null {
  // Check environment first
  if (process.env[envVarName]) {
    return process.env[envVarName]!;
  }

  // Check MCP credentials
  if (mcpCredentials[envVarName]) {
    return mcpCredentials[envVarName];
  }

  return null;
}

/**
 * Get all available test instances with resolved credentials.
 *
 * @returns Array of test instance configurations with resolved tokens
 */
export function getAvailableTestInstances(): TestInstanceConfig[] {
  const mcpCredentials = loadMcpCredentials();
  const instancesConfig = loadInstancesConfig();
  const instances: TestInstanceConfig[] = [];

  if (!instancesConfig) {
    // Fallback: try legacy single-instance mode
    const legacyToken =
      process.env.BUSINESSMAP_API_TOKEN ||
      mcpCredentials['BUSINESSMAP_API_TOKEN'];
    const legacyUrl = process.env.BUSINESSMAP_API_URL;

    if (legacyToken && legacyUrl) {
      instances.push({
        name: 'default',
        apiUrl: legacyUrl,
        apiToken: legacyToken,
      });
    }

    return instances;
  }

  // Resolve tokens for each configured instance
  for (const instance of instancesConfig.instances) {
    const token = resolveToken(instance.apiTokenEnv, mcpCredentials);

    if (token) {
      instances.push({
        name: instance.name,
        apiUrl: instance.apiUrl,
        apiToken: token,
      });
    }
  }

  return instances;
}

/**
 * Get the default test instance name from configuration.
 */
export function getDefaultTestInstanceName(): string {
  const instancesConfig = loadInstancesConfig();
  return instancesConfig?.defaultInstance || 'kerkow';
}

/**
 * Create a BusinessMapClient for tests.
 *
 * @param instanceName - Optional instance name (kerkow, fimancia). Uses default if not specified.
 * @returns Configured BusinessMapClient ready for use (not yet initialized)
 * @throws Error if no credentials available for the requested instance
 */
export function createTestClient(instanceName?: string): BusinessMapClient {
  const instances = getAvailableTestInstances();

  if (instances.length === 0) {
    throw new Error(
      'No BusinessMap credentials available for tests.\n' +
      'Ensure .mcp.json has credentials or set environment variables:\n' +
      '  - BUSINESSMAP_API_TOKEN_KERKOW\n' +
      '  - BUSINESSMAP_API_TOKEN_FIMANCIA'
    );
  }

  // Resolve target instance
  const targetName = instanceName || getDefaultTestInstanceName();
  let instance = instances.find((i) => i.name === targetName);

  // Fall back to first available instance
  if (!instance) {
    instance = instances[0];
    console.warn(
      `Instance '${targetName}' not available, using '${instance.name}' instead`
    );
  }

  return new BusinessMapClient({
    apiUrl: instance.apiUrl,
    apiToken: instance.apiToken,
  });
}

/**
 * Create and initialize a BusinessMapClient for tests.
 *
 * @param instanceName - Optional instance name (kerkow, fimancia). Uses default if not specified.
 * @returns Initialized BusinessMapClient ready for API calls
 */
export async function createAndInitializeTestClient(
  instanceName?: string
): Promise<BusinessMapClient> {
  const client = createTestClient(instanceName);
  await client.initialize();
  return client;
}

/**
 * Check if integration tests can run (credentials available).
 *
 * @returns Object with availability status and available instances
 */
export function checkTestCredentials(): {
  available: boolean;
  instances: string[];
  message: string;
} {
  const instances = getAvailableTestInstances();

  if (instances.length === 0) {
    return {
      available: false,
      instances: [],
      message:
        'No credentials available. Set env vars or configure .mcp.json',
    };
  }

  return {
    available: true,
    instances: instances.map((i) => i.name),
    message: `Credentials available for: ${instances.map((i) => i.name).join(', ')}`,
  };
}
