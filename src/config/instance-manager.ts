/**
 * Instance Configuration Manager
 *
 * Manages loading, validation, and resolution of BusinessMap instance configurations.
 * Supports multiple configuration sources:
 * - JSON configuration files
 * - Environment variables (BUSINESSMAP_INSTANCES as JSON array)
 * - Legacy single-instance mode (BUSINESSMAP_API_URL + BUSINESSMAP_API_TOKEN)
 *
 * @module instance-manager
 */

import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { z } from 'zod';
import {
  InstanceConfig,
  InstanceConfigError,
  InstanceNotFoundError,
  InstanceResolutionResult,
  InstanceResolutionStrategy,
  isMultiInstanceConfig,
  LoadConfigOptions,
  MultiInstanceConfig,
  TokenLoadError,
} from '../types/instance-config.js';

/**
 * Zod schema for runtime validation of InstanceConfig.
 */
const InstanceConfigSchema = z.object({
  name: z.string().min(1, 'Instance name cannot be empty'),
  apiUrl: z.string().url('API URL must be a valid URL'),
  apiTokenEnv: z.string().min(1, 'API token environment variable name cannot be empty'),
  readOnlyMode: z.boolean().optional(),
  defaultWorkspaceId: z.number().int().positive().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Zod schema for runtime validation of MultiInstanceConfig.
 */
const MultiInstanceConfigSchema = z
  .object({
    version: z.string().regex(/^\d+\.\d+$/, 'Version must be in major.minor format (e.g., 1.0)'),
    defaultInstance: z.string().min(1, 'Default instance name cannot be empty'),
    instances: z.array(InstanceConfigSchema).min(1, 'At least one instance must be configured'),
  })
  .refine((config) => config.instances.some((inst) => inst.name === config.defaultInstance), {
    message: 'Default instance must exist in instances array',
    path: ['defaultInstance'],
  })
  .refine(
    (config) => {
      const names = config.instances.map((inst) => inst.name);
      const uniqueNames = new Set(names);
      return names.length === uniqueNames.size;
    },
    {
      message: 'Instance names must be unique',
      path: ['instances'],
    }
  );

/**
 * Default configuration file paths (searched in order).
 */
const DEFAULT_CONFIG_PATHS = [
  join(process.cwd(), '.businessmap-instances.json'),
  join(homedir(), '.businessmap-mcp', 'instances.json'),
  join(homedir(), '.config', 'businessmap-mcp', 'instances.json'),
];

/**
 * Instance Configuration Manager
 *
 * Singleton class that manages BusinessMap instance configurations.
 * Provides methods for loading, validating, and resolving instances.
 *
 * @example
 * ```typescript
 * const manager = InstanceConfigManager.getInstance();
 * await manager.loadConfig();
 * const instance = manager.getActiveInstance('production');
 * ```
 */
export class InstanceConfigManager {
  private static instance: InstanceConfigManager | null = null;
  private config: MultiInstanceConfig | null = null;
  private legacyMode: boolean = false;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor() {}

  /**
   * Get the singleton instance of InstanceConfigManager.
   */
  public static getInstance(): InstanceConfigManager {
    if (!InstanceConfigManager.instance) {
      InstanceConfigManager.instance = new InstanceConfigManager();
    }
    return InstanceConfigManager.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing).
   */
  public static resetInstance(): void {
    InstanceConfigManager.instance = null;
  }

  /**
   * Load configuration from file or environment variables.
   *
   * Configuration sources (in order of precedence):
   * 1. Explicitly specified config file path
   * 2. BUSINESSMAP_INSTANCES env var (JSON)
   * 3. Default config file locations
   * 4. Legacy single-instance mode (BUSINESSMAP_API_URL + BUSINESSMAP_API_TOKEN)
   *
   * @param options - Configuration loading options
   * @throws {InstanceConfigError} If configuration is invalid or cannot be loaded
   */
  public async loadConfig(options: LoadConfigOptions = {}): Promise<void> {
    const { configPath, validate = true, allowLegacyFallback = true, strict = true } = options;

    try {
      // Try loading from explicit path first
      if (configPath) {
        this.loadFromFile(configPath, validate);
        return;
      }

      // Try loading from environment variable
      const envConfig = process.env.BUSINESSMAP_INSTANCES;
      if (envConfig) {
        this.loadFromEnvVar(envConfig, validate);
        return;
      }

      // Try loading from default paths
      for (const path of DEFAULT_CONFIG_PATHS) {
        if (existsSync(path)) {
          this.loadFromFile(path, validate);
          return;
        }
      }

      // Fallback to legacy mode if allowed
      if (allowLegacyFallback && this.canUseLegacyMode()) {
        this.loadLegacyConfig();
        return;
      }

      if (strict) {
        throw new InstanceConfigError(
          'No configuration found. Please provide a configuration file or set BUSINESSMAP_INSTANCES environment variable.',
          'CONFIG_NOT_FOUND',
          {
            searchedPaths: DEFAULT_CONFIG_PATHS,
            hasLegacyEnvVars: this.canUseLegacyMode(),
          }
        );
      }

      this.config = null;
    } catch (error) {
      if (error instanceof InstanceConfigError) {
        throw error;
      }
      throw new InstanceConfigError(
        `Failed to load configuration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'CONFIG_LOAD_ERROR',
        { originalError: error }
      );
    }
  }

  /**
   * Load configuration from a JSON file.
   */
  private loadFromFile(path: string, validate: boolean): void {
    try {
      if (!existsSync(path)) {
        throw new InstanceConfigError(`Configuration file not found: ${path}`, 'FILE_NOT_FOUND', {
          path,
        });
      }

      const content = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(content);

      if (validate) {
        this.validateConfig(parsed);
      } else if (!isMultiInstanceConfig(parsed)) {
        throw new InstanceConfigError('Invalid configuration structure', 'INVALID_CONFIG', {
          path,
        });
      }

      this.config = parsed;
      this.legacyMode = false;
    } catch (error) {
      if (error instanceof InstanceConfigError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new InstanceConfigError(
          `Invalid JSON in configuration file: ${path}`,
          'INVALID_JSON',
          { path, error: error.message }
        );
      }
      throw new InstanceConfigError(
        `Failed to load configuration from file: ${path}`,
        'FILE_LOAD_ERROR',
        { path, error }
      );
    }
  }

  /**
   * Load configuration from environment variable.
   */
  private loadFromEnvVar(envValue: string, validate: boolean): void {
    try {
      const parsed = JSON.parse(envValue);

      if (validate) {
        this.validateConfig(parsed);
      } else if (!isMultiInstanceConfig(parsed)) {
        throw new InstanceConfigError(
          'Invalid configuration structure in BUSINESSMAP_INSTANCES',
          'INVALID_CONFIG'
        );
      }

      this.config = parsed;
      this.legacyMode = false;
    } catch (error) {
      if (error instanceof InstanceConfigError) {
        throw error;
      }
      if (error instanceof SyntaxError) {
        throw new InstanceConfigError(
          'Invalid JSON in BUSINESSMAP_INSTANCES environment variable',
          'INVALID_JSON',
          { error: error.message }
        );
      }
      throw new InstanceConfigError(
        'Failed to load configuration from environment variable',
        'ENV_LOAD_ERROR',
        { error }
      );
    }
  }

  /**
   * Check if legacy mode can be used (required env vars are present).
   */
  private canUseLegacyMode(): boolean {
    return !!(process.env.BUSINESSMAP_API_URL && process.env.BUSINESSMAP_API_TOKEN);
  }

  /**
   * Load configuration in legacy single-instance mode.
   */
  private loadLegacyConfig(): void {
    const apiUrl = process.env.BUSINESSMAP_API_URL;
    const apiToken = process.env.BUSINESSMAP_API_TOKEN;

    if (!apiUrl || !apiToken) {
      throw new InstanceConfigError(
        'Legacy mode requires both BUSINESSMAP_API_URL and BUSINESSMAP_API_TOKEN environment variables',
        'LEGACY_CONFIG_INCOMPLETE'
      );
    }

    // Create a synthetic instance config for legacy mode
    const legacyInstance: InstanceConfig = {
      name: 'default',
      apiUrl,
      apiTokenEnv: 'BUSINESSMAP_API_TOKEN',
      readOnlyMode: process.env.BUSINESSMAP_READ_ONLY_MODE === 'true',
      defaultWorkspaceId: process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID
        ? parseInt(process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID, 10)
        : undefined,
      description: 'Legacy single-instance configuration',
      tags: ['legacy'],
    };

    this.config = {
      version: '1.0.0',
      defaultInstance: 'default',
      instances: [legacyInstance],
    };

    this.legacyMode = true;
  }

  /**
   * Validate configuration using Zod schema.
   */
  private validateConfig(config: unknown): asserts config is MultiInstanceConfig {
    try {
      MultiInstanceConfigSchema.parse(config);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));

        throw new InstanceConfigError('Configuration validation failed', 'VALIDATION_ERROR', {
          errors: formattedErrors,
        });
      }
      throw error;
    }
  }

  /**
   * Get the active instance configuration.
   *
   * @param instanceId - Optional instance name. If not provided, uses default instance.
   * @returns Instance resolution result containing the instance config and resolution strategy
   * @throws {InstanceNotFoundError} If instance is not found
   * @throws {InstanceConfigError} If configuration is not loaded
   */
  public getActiveInstance(instanceId?: string): InstanceResolutionResult {
    if (!this.config) {
      throw new InstanceConfigError(
        'Configuration not loaded. Call loadConfig() first.',
        'CONFIG_NOT_LOADED'
      );
    }

    let instance: InstanceConfig;
    let strategy: InstanceResolutionStrategy;

    if (instanceId) {
      // Explicit instance requested
      const foundInstance = this.config.instances.find((inst) => inst.name === instanceId);
      if (!foundInstance) {
        throw new InstanceNotFoundError(instanceId);
      }
      instance = foundInstance;
      strategy = InstanceResolutionStrategy.EXPLICIT;
    } else if (this.legacyMode) {
      // Legacy mode - use the single instance
      const legacyInstance = this.config.instances[0];
      if (!legacyInstance) {
        throw new InstanceConfigError(
          'Legacy mode configuration is invalid (no instances found)',
          'LEGACY_CONFIG_INVALID'
        );
      }
      instance = legacyInstance;
      strategy = InstanceResolutionStrategy.LEGACY;
    } else {
      // Use default instance
      const defaultInstance = this.config.instances.find(
        (inst) => inst.name === this.config!.defaultInstance
      );
      if (!defaultInstance) {
        throw new InstanceConfigError(
          `Default instance '${this.config.defaultInstance}' not found`,
          'DEFAULT_INSTANCE_NOT_FOUND',
          { defaultInstance: this.config.defaultInstance }
        );
      }
      instance = defaultInstance;
      strategy = InstanceResolutionStrategy.DEFAULT;
    }

    // Load API token from environment
    const apiToken = this.loadToken(instance);

    return {
      instance,
      strategy,
      apiToken,
    };
  }

  /**
   * Load API token from environment variable specified in instance config.
   *
   * @param instance - Instance configuration
   * @returns API token
   * @throws {TokenLoadError} If token cannot be loaded
   */
  private loadToken(instance: InstanceConfig): string {
    const token = process.env[instance.apiTokenEnv];

    if (!token || token.trim() === '') {
      throw new TokenLoadError(instance.apiTokenEnv, instance.name);
    }

    return token;
  }

  /**
   * Get all configured instances.
   *
   * @returns Array of instance configurations
   * @throws {InstanceConfigError} If configuration is not loaded
   */
  public getAllInstances(): InstanceConfig[] {
    if (!this.config) {
      throw new InstanceConfigError(
        'Configuration not loaded. Call loadConfig() first.',
        'CONFIG_NOT_LOADED'
      );
    }

    return [...this.config.instances];
  }

  /**
   * Get the default instance name.
   *
   * @returns Default instance name
   * @throws {InstanceConfigError} If configuration is not loaded
   */
  public getDefaultInstanceName(): string {
    if (!this.config) {
      throw new InstanceConfigError(
        'Configuration not loaded. Call loadConfig() first.',
        'CONFIG_NOT_LOADED'
      );
    }

    return this.config.defaultInstance;
  }

  /**
   * Check if an instance exists.
   *
   * @param instanceName - Instance name to check
   * @returns True if instance exists
   */
  public hasInstance(instanceName: string): boolean {
    if (!this.config) {
      return false;
    }

    return this.config.instances.some((inst) => inst.name === instanceName);
  }

  /**
   * Check if configuration is loaded.
   *
   * @returns True if configuration is loaded
   */
  public isConfigured(): boolean {
    return this.config !== null;
  }

  /**
   * Check if running in legacy mode.
   *
   * @returns True if running in legacy single-instance mode
   */
  public isLegacyMode(): boolean {
    return this.legacyMode;
  }

  /**
   * Get the current configuration (for debugging/inspection).
   *
   * @returns Current configuration or null if not loaded
   */
  public getConfig(): MultiInstanceConfig | null {
    return this.config ? { ...this.config } : null;
  }
}
