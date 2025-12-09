/**
 * BusinessMap Client Factory
 *
 * Factory for creating and managing BusinessMapClient instances for multiple
 * BusinessMap accounts/instances. Implements singleton pattern with client caching
 * and lazy initialization.
 *
 * Features:
 * - Client caching: Reuses existing clients for the same instance
 * - Lazy initialization: Clients are only created when first requested
 * - Instance isolation: Each instance has its own HTTP client and configuration
 * - Automatic token refresh: Clients are recreated if tokens change
 *
 * @module client-factory
 */

import { BusinessMapClient } from './businessmap-client.js';
import { BusinessMapConfig } from '../types/index.js';
import { InstanceConfigManager } from '../config/instance-manager.js';
import {
  InstanceConfigError,
  InstanceResolutionResult,
  InstanceResolutionStrategy,
} from '../types/instance-config.js';
import { logger } from '../utils/logger.js';

/**
 * Cache entry for a BusinessMapClient instance.
 */
interface ClientCacheEntry {
  /**
   * The cached client instance.
   */
  client: BusinessMapClient;

  /**
   * The configuration used to create this client.
   */
  config: BusinessMapConfig;

  /**
   * Hash of the API token used (for detecting token changes).
   */
  tokenHash: string;

  /**
   * Timestamp when this client was created.
   */
  createdAt: Date;

  /**
   * Whether this client has been initialized.
   */
  initialized: boolean;

  /**
   * Resolution strategy used to get this instance.
   */
  strategy: InstanceResolutionStrategy;
}

/**
 * Client factory initialization options.
 */
export interface ClientFactoryOptions {
  /**
   * Whether to automatically initialize clients when created.
   * If false, clients must be manually initialized before use.
   * @default true
   */
  autoInitialize?: boolean;

  /**
   * Whether to cache clients for reuse.
   * If false, a new client is created for each request.
   * @default true
   */
  enableCaching?: boolean;

  /**
   * Whether to throw errors on initialization failures.
   * If false, initialization errors are logged but not thrown.
   * @default true
   */
  throwOnInitError?: boolean;
}

/**
 * BusinessMap Client Factory
 *
 * Singleton factory for creating and managing BusinessMapClient instances.
 * Provides client caching, lazy initialization, and instance isolation.
 *
 * @example
 * ```typescript
 * // Get the factory instance
 * const factory = BusinessMapClientFactory.getInstance();
 *
 * // Initialize with configuration
 * await factory.initialize();
 *
 * // Get client for specific instance
 * const prodClient = await factory.getClient('production');
 *
 * // Get client for default instance
 * const defaultClient = await factory.getClient();
 * ```
 */
export class BusinessMapClientFactory {
  private static instance: BusinessMapClientFactory | null = null;
  private readonly configManager: InstanceConfigManager;
  private readonly clientCache: Map<string, ClientCacheEntry>;
  private options: ClientFactoryOptions;
  private initialized: boolean = false;

  /**
   * Private constructor to enforce singleton pattern.
   */
  private constructor(options: ClientFactoryOptions = {}) {
    this.configManager = InstanceConfigManager.getInstance();
    this.clientCache = new Map();
    this.options = {
      autoInitialize: true,
      enableCaching: true,
      throwOnInitError: true,
      ...options,
    };
  }

  /**
   * Get the singleton instance of BusinessMapClientFactory.
   *
   * @param options - Factory initialization options (only used on first call)
   */
  public static getInstance(options?: ClientFactoryOptions): BusinessMapClientFactory {
    if (!BusinessMapClientFactory.instance) {
      BusinessMapClientFactory.instance = new BusinessMapClientFactory(options);
    }
    return BusinessMapClientFactory.instance;
  }

  /**
   * Reset the singleton instance (primarily for testing).
   * Clears all cached clients and resets the factory state.
   */
  public static resetInstance(): void {
    if (BusinessMapClientFactory.instance) {
      BusinessMapClientFactory.instance.clearCache();
    }
    BusinessMapClientFactory.instance = null;
    InstanceConfigManager.resetInstance();
  }

  /**
   * Initialize the factory by loading configuration.
   *
   * @throws {InstanceConfigError} If configuration cannot be loaded
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.configManager.loadConfig();
    this.initialized = true;
  }

  /**
   * Check if the factory has been initialized.
   */
  public isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Get or create a BusinessMapClient for the specified instance.
   *
   * If caching is enabled (default), returns a cached client if available.
   * Otherwise, creates a new client and optionally caches it.
   *
   * @param instanceId - Optional instance name. If not provided, uses default instance.
   * @returns Initialized BusinessMapClient
   * @throws {InstanceConfigError} If factory is not initialized or instance not found
   * @throws {Error} If client initialization fails and throwOnInitError is true
   */
  public async getClient(instanceId?: string): Promise<BusinessMapClient> {
    // Ensure factory is initialized
    if (!this.initialized) {
      throw new InstanceConfigError(
        'Factory not initialized. Call initialize() first.',
        'FACTORY_NOT_INITIALIZED'
      );
    }

    // Resolve instance configuration
    const resolution = this.resolveInstance(instanceId);
    const cacheKey = resolution.instance.name;

    // Check cache if enabled
    if (this.options.enableCaching && this.clientCache.has(cacheKey)) {
      const cached = this.clientCache.get(cacheKey)!;

      // Verify token hasn't changed
      const currentTokenHash = this.hashToken(resolution.apiToken!);
      if (cached.tokenHash === currentTokenHash) {
        return cached.client;
      }

      // Token changed - invalidate cache entry
      this.clientCache.delete(cacheKey);
    }

    // Create new client
    const client = await this.createClient(resolution);

    // Cache if enabled
    if (this.options.enableCaching) {
      this.clientCache.set(cacheKey, {
        client,
        config: this.buildClientConfig(resolution),
        tokenHash: this.hashToken(resolution.apiToken!),
        createdAt: new Date(),
        initialized: true,
        strategy: resolution.strategy,
      });
    }

    return client;
  }

  /**
   * Resolve instance configuration using the config manager.
   */
  private resolveInstance(instanceId?: string): InstanceResolutionResult {
    try {
      return this.configManager.getActiveInstance(instanceId);
    } catch (error: unknown) {
      if (error instanceof InstanceConfigError) {
        throw error;
      }
      throw new InstanceConfigError(
        `Failed to resolve instance: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'INSTANCE_RESOLUTION_ERROR',
        { instanceId, originalError: error }
      );
    }
  }

  /**
   * Create a new BusinessMapClient instance.
   */
  private async createClient(resolution: InstanceResolutionResult): Promise<BusinessMapClient> {
    const config = this.buildClientConfig(resolution);
    const client = new BusinessMapClient(config);

    // Initialize client if auto-initialization is enabled
    if (this.options.autoInitialize) {
      try {
        await client.initialize();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const message = `Failed to initialize client for instance '${resolution.instance.name}': ${errorMessage}`;

        if (this.options.throwOnInitError) {
          throw new InstanceConfigError(message, 'CLIENT_INIT_ERROR', {
            instanceName: resolution.instance.name,
            apiUrl: resolution.instance.apiUrl,
            originalError: error,
          });
        }

        // Log error but don't throw
        logger.error('Failed to initialize client for instance', {
          instanceName: resolution.instance.name,
          apiUrl: resolution.instance.apiUrl,
          error: errorMessage,
        });
      }
    }

    return client;
  }

  /**
   * Build BusinessMapConfig from instance resolution result.
   */
  private buildClientConfig(resolution: InstanceResolutionResult): BusinessMapConfig {
    return {
      apiUrl: resolution.instance.apiUrl,
      apiToken: resolution.apiToken!,
      defaultWorkspaceId: resolution.instance.defaultWorkspaceId,
      readOnlyMode: resolution.instance.readOnlyMode,
    };
  }

  /**
   * Create a simple hash of an API token for comparison.
   * Uses a simple hash to avoid storing actual tokens in memory.
   */
  private hashToken(token: string): string {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      const char = token.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString(36);
  }

  /**
   * Get information about a cached client.
   *
   * @param instanceId - Instance name
   * @returns Cache entry information or null if not cached
   */
  public getCacheInfo(instanceId: string): Omit<ClientCacheEntry, 'client' | 'tokenHash'> | null {
    const cached = this.clientCache.get(instanceId);
    if (!cached) {
      return null;
    }

    return {
      config: cached.config,
      createdAt: cached.createdAt,
      initialized: cached.initialized,
      strategy: cached.strategy,
    };
  }

  /**
   * Get all cached instance names.
   *
   * @returns Array of cached instance names
   */
  public getCachedInstances(): string[] {
    return Array.from(this.clientCache.keys());
  }

  /**
   * Check if a client is cached for the specified instance.
   *
   * @param instanceId - Instance name
   * @returns True if client is cached
   */
  public isCached(instanceId: string): boolean {
    return this.clientCache.has(instanceId);
  }

  /**
   * Clear the cache for a specific instance.
   *
   * @param instanceId - Instance name
   * @returns True if cache entry was found and removed
   */
  public clearCacheEntry(instanceId: string): boolean {
    return this.clientCache.delete(instanceId);
  }

  /**
   * Clear all cached clients.
   */
  public clearCache(): void {
    this.clientCache.clear();
  }

  /**
   * Get the number of cached clients.
   */
  public getCacheSize(): number {
    return this.clientCache.size;
  }

  /**
   * Get all available instance names from configuration.
   *
   * @returns Array of instance names
   * @throws {InstanceConfigError} If factory is not initialized
   */
  public getAvailableInstances(): string[] {
    if (!this.initialized) {
      throw new InstanceConfigError(
        'Factory not initialized. Call initialize() first.',
        'FACTORY_NOT_INITIALIZED'
      );
    }

    return this.configManager.getAllInstances().map((inst) => inst.name);
  }

  /**
   * Get the default instance name.
   *
   * @returns Default instance name
   * @throws {InstanceConfigError} If factory is not initialized
   */
  public getDefaultInstanceName(): string {
    if (!this.initialized) {
      throw new InstanceConfigError(
        'Factory not initialized. Call initialize() first.',
        'FACTORY_NOT_INITIALIZED'
      );
    }

    return this.configManager.getDefaultInstanceName();
  }

  /**
   * Check if the factory is running in legacy mode.
   *
   * @returns True if running in legacy single-instance mode
   */
  public isLegacyMode(): boolean {
    return this.configManager.isLegacyMode();
  }

  /**
   * Update factory options.
   * Note: This does not affect already cached clients.
   *
   * @param options - New options (merged with existing)
   */
  public setOptions(options: Partial<ClientFactoryOptions>): void {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  /**
   * Get current factory options.
   */
  public getOptions(): Readonly<ClientFactoryOptions> {
    return { ...this.options };
  }
}
