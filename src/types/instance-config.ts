/**
 * Multi-Instance Configuration Types
 *
 * This module defines TypeScript types for multi-instance BusinessMap MCP configuration.
 * It supports managing multiple BusinessMap instances with different API endpoints,
 * authentication tokens, and operational modes.
 *
 * @module instance-config
 */

/**
 * Configuration for a single BusinessMap instance.
 *
 * Each instance represents a connection to a specific BusinessMap (Kanbanize) account
 * with its own API endpoint, authentication, and operational settings.
 */
export interface InstanceConfig {
  /**
   * Unique identifier for this instance.
   * Used for instance resolution and client caching.
   *
   * @example "production", "staging", "customer-acme"
   */
  name: string;

  /**
   * Base URL for the BusinessMap API endpoint.
   * Must be a valid URL with protocol (https://).
   *
   * @example "https://acme.kanbanize.com/api/v2"
   */
  apiUrl: string;

  /**
   * Environment variable name containing the API token.
   * The actual token is loaded from process.env at runtime.
   *
   * @example "BUSINESSMAP_API_TOKEN_PROD"
   */
  apiTokenEnv: string;

  /**
   * Whether this instance operates in read-only mode.
   * When enabled, all write operations (create, update, delete) are blocked.
   *
   * @default false
   */
  readOnlyMode?: boolean;

  /**
   * Default workspace ID for operations on this instance.
   * Optional, can be overridden by specific API calls.
   */
  defaultWorkspaceId?: number;

  /**
   * Optional description of this instance.
   * Useful for documentation and debugging.
   *
   * @example "Production environment for Acme Corp"
   */
  description?: string;

  /**
   * Optional tags for categorizing instances.
   * Can be used for filtering and routing.
   *
   * @example ["production", "customer-facing"]
   */
  tags?: string[];
}

/**
 * Complete multi-instance configuration structure.
 *
 * This is the top-level configuration object that can be loaded from:
 * - JSON file (e.g., ~/.businessmap-mcp/instances.json)
 * - Environment variable (BUSINESSMAP_INSTANCES as JSON)
 * - Programmatic configuration
 */
export interface MultiInstanceConfig {
  /**
   * Configuration schema version.
   * Used for backward compatibility and migration.
   *
   * @example "1.0.0"
   */
  version: string;

  /**
   * Name of the default instance to use when none is specified.
   * Must match the name of one of the instances in the instances array.
   *
   * @example "production"
   */
  defaultInstance: string;

  /**
   * Array of instance configurations.
   * At least one instance must be defined.
   */
  instances: InstanceConfig[];
}

/**
 * Strategy for resolving which instance to use for an operation.
 */
export enum InstanceResolutionStrategy {
  /**
   * Use the explicitly specified instance name.
   * Fails if instance is not found.
   */
  EXPLICIT = 'explicit',

  /**
   * Use the default instance from configuration.
   * Fails if default instance is not configured.
   */
  DEFAULT = 'default',

  /**
   * Fallback to legacy single-instance configuration.
   * Uses BUSINESSMAP_API_URL and BUSINESSMAP_API_TOKEN env vars.
   */
  LEGACY = 'legacy',

  /**
   * Use the first available instance.
   * Useful for single-instance deployments.
   */
  FIRST_AVAILABLE = 'first_available',
}

/**
 * Result of instance resolution.
 * Contains the resolved instance configuration and the strategy used.
 */
export interface InstanceResolutionResult {
  /**
   * The resolved instance configuration.
   */
  instance: InstanceConfig;

  /**
   * The strategy that was used to resolve this instance.
   */
  strategy: InstanceResolutionStrategy;

  /**
   * The actual API token loaded from environment.
   * Only populated when token is successfully loaded.
   */
  apiToken?: string;
}

/**
 * Options for loading instance configuration.
 */
export interface LoadConfigOptions {
  /**
   * Path to configuration file.
   * If not specified, uses default locations:
   * - ~/.businessmap-mcp/instances.json
   * - ./.businessmap-instances.json
   */
  configPath?: string;

  /**
   * Whether to validate the configuration against JSON schema.
   * @default true
   */
  validate?: boolean;

  /**
   * Whether to allow fallback to legacy single-instance mode.
   * @default true
   */
  allowLegacyFallback?: boolean;

  /**
   * Whether to throw error if no configuration is found.
   * If false, returns null instead of throwing.
   * @default true
   */
  strict?: boolean;
}

/**
 * Error thrown when instance configuration is invalid.
 */
export class InstanceConfigError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'InstanceConfigError';
    Object.setPrototypeOf(this, InstanceConfigError.prototype);
  }
}

/**
 * Error thrown when an instance cannot be found.
 */
export class InstanceNotFoundError extends InstanceConfigError {
  constructor(instanceName: string) {
    super(`Instance '${instanceName}' not found in configuration`, 'INSTANCE_NOT_FOUND', {
      instanceName,
    });
    this.name = 'InstanceNotFoundError';
    Object.setPrototypeOf(this, InstanceNotFoundError.prototype);
  }
}

/**
 * Error thrown when API token cannot be loaded from environment.
 */
export class TokenLoadError extends InstanceConfigError {
  constructor(envVarName: string, instanceName: string) {
    super(
      `API token not found in environment variable '${envVarName}' for instance '${instanceName}'`,
      'TOKEN_LOAD_ERROR',
      { envVarName, instanceName }
    );
    this.name = 'TokenLoadError';
    Object.setPrototypeOf(this, TokenLoadError.prototype);
  }
}

/**
 * Type guard to check if an object is a valid InstanceConfig.
 */
export function isInstanceConfig(obj: unknown): obj is InstanceConfig {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const config = obj as Record<string, unknown>;

  return (
    typeof config.name === 'string' &&
    typeof config.apiUrl === 'string' &&
    typeof config.apiTokenEnv === 'string' &&
    (config.readOnlyMode === undefined || typeof config.readOnlyMode === 'boolean') &&
    (config.defaultWorkspaceId === undefined || typeof config.defaultWorkspaceId === 'number') &&
    (config.description === undefined || typeof config.description === 'string') &&
    (config.tags === undefined ||
      (Array.isArray(config.tags) && config.tags.every((t) => typeof t === 'string')))
  );
}

/**
 * Type guard to check if an object is a valid MultiInstanceConfig.
 */
export function isMultiInstanceConfig(obj: unknown): obj is MultiInstanceConfig {
  if (typeof obj !== 'object' || obj === null) {
    return false;
  }

  const config = obj as Record<string, unknown>;

  return (
    typeof config.version === 'string' &&
    typeof config.defaultInstance === 'string' &&
    Array.isArray(config.instances) &&
    config.instances.length > 0 &&
    config.instances.every(isInstanceConfig)
  );
}
