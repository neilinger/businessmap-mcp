import dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createLoggerSync } from '@toolprint/mcp-logger';
import { BusinessMapConfig } from '../types/index.js';

// Load environment variables
dotenv.config();

// Get package version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(join(__dirname, '../../package.json'), 'utf-8'));
const PACKAGE_VERSION = packageJson.version;

const logger = createLoggerSync({ level: 'info' });

export interface EnvironmentConfig {
  businessMap: BusinessMapConfig;
  server: {
    name: string;
    version: string;
    port?: number;
  };
  transport: {
    sse: boolean;
    streamableHttp: boolean;
  };
  formatting: {
    prettyJson: boolean;
  };
}

export function getRequiredEnvVar(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export function getBooleanEnvVar(name: string, defaultValue: boolean = false): boolean {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true';
}

export function getNumberEnvVar(name: string, defaultValue?: number): number | undefined {
  const value = process.env[name];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${name} must be a valid number`);
  }
  return parsed;
}

// Check if multi-instance mode is enabled
// Multi-instance mode is active if:
// 1. BUSINESSMAP_INSTANCES env var is set (JSON config)
// 2. .businessmap-instances.json file exists in cwd
// 3. Config file exists in default locations
const hasMultiInstanceEnv = !!process.env.BUSINESSMAP_INSTANCES;
const hasDefaultConfigFile = existsSync(join(process.cwd(), '.businessmap-instances.json'));
const isMultiInstanceMode = hasMultiInstanceEnv || hasDefaultConfigFile;

export const config: EnvironmentConfig = {
  businessMap: {
    // In multi-instance mode, these are optional (will use instance-specific config)
    // In legacy mode, these are required
    apiUrl: isMultiInstanceMode
      ? process.env.BUSINESSMAP_API_URL || ''
      : getRequiredEnvVar('BUSINESSMAP_API_URL'),
    apiToken: isMultiInstanceMode
      ? process.env.BUSINESSMAP_API_TOKEN || ''
      : getRequiredEnvVar('BUSINESSMAP_API_TOKEN'),
    defaultWorkspaceId: getNumberEnvVar('BUSINESSMAP_DEFAULT_WORKSPACE_ID'),
    readOnlyMode: getBooleanEnvVar('BUSINESSMAP_READ_ONLY_MODE', false),
  },
  server: {
    name: process.env.MCP_SERVER_NAME || 'businessmap-mcp',
    version: process.env.MCP_SERVER_VERSION || PACKAGE_VERSION,
    port: getNumberEnvVar('PORT'),
  },
  transport: {
    sse: getBooleanEnvVar('SSE', false),
    streamableHttp: getBooleanEnvVar('STREAMABLE_HTTP', true),
  },
  formatting: {
    prettyJson: getBooleanEnvVar('BUSINESSMAP_PRETTY_JSON', false),
  },
};

export function validateConfig(): void {
  // Skip legacy validation in multi-instance mode
  if (isMultiInstanceMode) {
    logger.info('Configuration validated (multi-instance mode)', {
      serverName: config.server.name,
      serverVersion: config.server.version,
      instancesConfig: process.env.BUSINESSMAP_INSTANCES_CONFIG,
    });
    return;
  }

  // Validate API URL format (legacy mode only)
  try {
    new URL(config.businessMap.apiUrl);
  } catch {
    throw new Error('BUSINESSMAP_API_URL must be a valid URL');
  }

  // Validate API token is not empty (legacy mode only)
  if (!config.businessMap.apiToken.trim()) {
    throw new Error('BUSINESSMAP_API_TOKEN cannot be empty');
  }

  logger.info('Configuration validated (legacy mode)', {
    serverName: config.server.name,
    serverVersion: config.server.version,
    apiUrl: config.businessMap.apiUrl,
    readOnlyMode: config.businessMap.readOnlyMode,
  });
}
