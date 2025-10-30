/**
 * Unit tests for BusinessMapClientFactory
 *
 * Tests client creation, caching, lazy initialization,
 * and instance isolation for multi-instance configuration.
 */

import { BusinessMapClientFactory } from '../../src/client/client-factory';
import { BusinessMapClient } from '../../src/client/businessmap-client';
import { InstanceConfigManager } from '../../src/config/instance-manager';
import {
  InstanceConfigError,
  InstanceResolutionStrategy,
  MultiInstanceConfig,
} from '../../src/types/instance-config';

// Mock dependencies
jest.mock('../../src/client/businessmap-client');

const MockedBusinessMapClient = BusinessMapClient as jest.MockedClass<typeof BusinessMapClient>;

describe('BusinessMapClientFactory', () => {
  let factory: BusinessMapClientFactory;
  let mockConfigManager: jest.Mocked<InstanceConfigManager>;
  let originalEnv: NodeJS.ProcessEnv;

  // Sample valid configuration
  const validConfig: MultiInstanceConfig = {
    version: '1.0.0',
    defaultInstance: 'production',
    instances: [
      {
        name: 'production',
        apiUrl: 'https://prod.kanbanize.com/api/v2',
        apiTokenEnv: 'BUSINESSMAP_API_TOKEN_PROD',
        readOnlyMode: false,
        defaultWorkspaceId: 1,
      },
      {
        name: 'staging',
        apiUrl: 'https://staging.kanbanize.com/api/v2',
        apiTokenEnv: 'BUSINESSMAP_API_TOKEN_STAGING',
        readOnlyMode: true,
      },
    ],
  };

  beforeEach(() => {
    // Reset singletons
    BusinessMapClientFactory.resetInstance();
    InstanceConfigManager.resetInstance();

    // Backup environment
    originalEnv = { ...process.env };
    process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token_123';
    process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token_456';

    // Create mock config manager by spying on getInstance
    mockConfigManager = {
      loadConfig: jest.fn().mockResolvedValue(undefined),
      getActiveInstance: jest.fn(),
      getAllInstances: jest.fn().mockReturnValue(validConfig.instances),
      getDefaultInstanceName: jest.fn().mockReturnValue('production'),
      hasInstance: jest.fn(),
      isConfigured: jest.fn().mockReturnValue(true),
      isLegacyMode: jest.fn().mockReturnValue(false),
      getConfig: jest.fn().mockReturnValue(validConfig),
    } as any;

    // Spy on InstanceConfigManager.getInstance to return mock
    jest.spyOn(InstanceConfigManager, 'getInstance').mockReturnValue(mockConfigManager);

    // Create factory
    factory = BusinessMapClientFactory.getInstance();

    // Reset all mocks
    jest.clearAllMocks();

    // Mock BusinessMapClient
    MockedBusinessMapClient.mockImplementation(() => {
      return {
        initialize: jest.fn().mockResolvedValue(undefined),
        initialized: true,
      } as any;
    });
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
    BusinessMapClientFactory.resetInstance();
    InstanceConfigManager.resetInstance();
    jest.restoreAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = BusinessMapClientFactory.getInstance();
      const instance2 = BusinessMapClientFactory.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance and clear cache', () => {
      const instance1 = BusinessMapClientFactory.getInstance();
      BusinessMapClientFactory.resetInstance();
      const instance2 = BusinessMapClientFactory.getInstance();

      expect(instance1).not.toBe(instance2);
    });

    it('should accept options on first call only', () => {
      BusinessMapClientFactory.resetInstance();
      const factory1 = BusinessMapClientFactory.getInstance({ autoInitialize: false });
      const factory2 = BusinessMapClientFactory.getInstance({ autoInitialize: true });

      expect(factory1).toBe(factory2);
      expect(factory2.getOptions().autoInitialize).toBe(false); // First options win
    });
  });

  describe('Initialization', () => {
    it('should initialize factory by loading config', async () => {
      await factory.initialize();

      expect(mockConfigManager.loadConfig).toHaveBeenCalledTimes(1);
      expect(factory.isInitialized()).toBe(true);
    });

    it('should not reload config on subsequent initialize calls', async () => {
      await factory.initialize();
      await factory.initialize();

      expect(mockConfigManager.loadConfig).toHaveBeenCalledTimes(1);
    });

    it('should throw error if config loading fails', async () => {
      mockConfigManager.loadConfig.mockRejectedValue(
        new InstanceConfigError('Config load error', 'CONFIG_ERROR')
      );

      await expect(factory.initialize()).rejects.toThrow(InstanceConfigError);
    });
  });

  describe('Client Creation', () => {
    beforeEach(async () => {
      await factory.initialize();
    });

    describe('getClient', () => {
      it('should create client for explicit instance', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[1]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'staging_token_456',
        });

        const client = await factory.getClient('staging');

        expect(mockConfigManager.getActiveInstance).toHaveBeenCalledWith('staging');
        expect(MockedBusinessMapClient).toHaveBeenCalledWith({
          apiUrl: 'https://staging.kanbanize.com/api/v2',
          apiToken: 'staging_token_456',
          readOnlyMode: true,
          defaultWorkspaceId: undefined,
        });
        expect(client).toBeDefined();
      });

      it('should create client for default instance when no ID provided', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        const client = await factory.getClient();

        expect(mockConfigManager.getActiveInstance).toHaveBeenCalledWith(undefined);
        expect(MockedBusinessMapClient).toHaveBeenCalledWith({
          apiUrl: 'https://prod.kanbanize.com/api/v2',
          apiToken: 'prod_token_123',
          readOnlyMode: false,
          defaultWorkspaceId: 1,
        });
        expect(client).toBeDefined();
      });

      it('should throw error if factory not initialized', async () => {
        BusinessMapClientFactory.resetInstance();
        const uninitializedFactory = BusinessMapClientFactory.getInstance();

        await expect(uninitializedFactory.getClient()).rejects.toThrow(InstanceConfigError);
        await expect(uninitializedFactory.getClient()).rejects.toThrow('not initialized');
      });

      it('should initialize client when autoInitialize is true', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        const client = await factory.getClient();

        expect(client.initialize).toHaveBeenCalled();
      });

      it('should not initialize client when autoInitialize is false', async () => {
        BusinessMapClientFactory.resetInstance();
        const noAutoInitFactory = BusinessMapClientFactory.getInstance({ autoInitialize: false });
        await noAutoInitFactory.initialize();

        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        const client = await noAutoInitFactory.getClient();

        expect(client.initialize).not.toHaveBeenCalled();
      });

      it('should throw error on client initialization failure when throwOnInitError=true', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        const initError = new Error('Initialization failed');
        MockedBusinessMapClient.mockImplementation(() => {
          return {
            initialize: jest.fn().mockRejectedValue(initError),
          } as any;
        });

        await expect(factory.getClient()).rejects.toThrow(InstanceConfigError);
        await expect(factory.getClient()).rejects.toThrow('Failed to initialize client');
      });

      it('should not throw error on client initialization failure when throwOnInitError=false', async () => {
        BusinessMapClientFactory.resetInstance();
        const noThrowFactory = BusinessMapClientFactory.getInstance({ throwOnInitError: false });
        await noThrowFactory.initialize();

        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        const initError = new Error('Initialization failed');
        MockedBusinessMapClient.mockImplementation(() => {
          return {
            initialize: jest.fn().mockRejectedValue(initError),
          } as any;
        });

        const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
        const client = await noThrowFactory.getClient();

        expect(client).toBeDefined();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });
  });

  describe('Client Caching', () => {
    beforeEach(async () => {
      await factory.initialize();
    });

    it('should cache clients by instance name', async () => {
      mockConfigManager.getActiveInstance.mockReturnValue({
        instance: validConfig.instances[0]!,
        strategy: InstanceResolutionStrategy.DEFAULT,
        apiToken: 'prod_token_123',
      });

      const client1 = await factory.getClient('production');
      const client2 = await factory.getClient('production');

      expect(client1).toBe(client2);
      expect(MockedBusinessMapClient).toHaveBeenCalledTimes(1);
    });

    it('should create separate clients for different instances', async () => {
      mockConfigManager.getActiveInstance
        .mockReturnValueOnce({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'prod_token_123',
        })
        .mockReturnValueOnce({
          instance: validConfig.instances[1]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'staging_token_456',
        });

      const prodClient = await factory.getClient('production');
      const stagingClient = await factory.getClient('staging');

      expect(prodClient).not.toBe(stagingClient);
      expect(MockedBusinessMapClient).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache when token changes', async () => {
      mockConfigManager.getActiveInstance
        .mockReturnValueOnce({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'prod_token_123',
        })
        .mockReturnValueOnce({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'prod_token_new',
        });

      const client1 = await factory.getClient('production');
      const client2 = await factory.getClient('production');

      expect(client1).not.toBe(client2);
      expect(MockedBusinessMapClient).toHaveBeenCalledTimes(2);
    });

    it('should not cache when caching is disabled', async () => {
      BusinessMapClientFactory.resetInstance();
      const noCacheFactory = BusinessMapClientFactory.getInstance({ enableCaching: false });
      await noCacheFactory.initialize();

      mockConfigManager.getActiveInstance.mockReturnValue({
        instance: validConfig.instances[0]!,
        strategy: InstanceResolutionStrategy.DEFAULT,
        apiToken: 'prod_token_123',
      });

      const client1 = await noCacheFactory.getClient('production');
      const client2 = await noCacheFactory.getClient('production');

      expect(client1).not.toBe(client2);
      expect(MockedBusinessMapClient).toHaveBeenCalledTimes(2);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await factory.initialize();
    });

    describe('getCacheInfo', () => {
      it('should return cache info for cached instance', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        await factory.getClient('production');
        const info = factory.getCacheInfo('production');

        expect(info).not.toBeNull();
        expect(info?.config.apiUrl).toBe('https://prod.kanbanize.com/api/v2');
        expect(info?.initialized).toBe(true);
        expect(info?.strategy).toBe(InstanceResolutionStrategy.DEFAULT);
        expect(info?.createdAt).toBeInstanceOf(Date);
      });

      it('should return null for non-cached instance', () => {
        const info = factory.getCacheInfo('nonexistent');

        expect(info).toBeNull();
      });

      it('should not include token in cache info', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        await factory.getClient('production');
        const info = factory.getCacheInfo('production');

        expect(info).not.toHaveProperty('apiToken');
        expect(info).not.toHaveProperty('tokenHash');
      });
    });

    describe('getCachedInstances', () => {
      it('should return array of cached instance names', async () => {
        mockConfigManager.getActiveInstance
          .mockReturnValueOnce({
            instance: validConfig.instances[0]!,
            strategy: InstanceResolutionStrategy.EXPLICIT,
            apiToken: 'prod_token_123',
          })
          .mockReturnValueOnce({
            instance: validConfig.instances[1]!,
            strategy: InstanceResolutionStrategy.EXPLICIT,
            apiToken: 'staging_token_456',
          });

        await factory.getClient('production');
        await factory.getClient('staging');

        const cached = factory.getCachedInstances();

        expect(cached).toHaveLength(2);
        expect(cached).toContain('production');
        expect(cached).toContain('staging');
      });

      it('should return empty array when no clients cached', () => {
        const cached = factory.getCachedInstances();

        expect(cached).toHaveLength(0);
      });
    });

    describe('isCached', () => {
      it('should return true for cached instance', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        await factory.getClient('production');

        expect(factory.isCached('production')).toBe(true);
      });

      it('should return false for non-cached instance', () => {
        expect(factory.isCached('production')).toBe(false);
      });
    });

    describe('clearCacheEntry', () => {
      it('should clear specific cache entry', async () => {
        mockConfigManager.getActiveInstance.mockReturnValue({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.DEFAULT,
          apiToken: 'prod_token_123',
        });

        await factory.getClient('production');
        expect(factory.isCached('production')).toBe(true);

        const removed = factory.clearCacheEntry('production');

        expect(removed).toBe(true);
        expect(factory.isCached('production')).toBe(false);
      });

      it('should return false when entry does not exist', () => {
        const removed = factory.clearCacheEntry('nonexistent');

        expect(removed).toBe(false);
      });
    });

    describe('clearCache', () => {
      it('should clear all cache entries', async () => {
        mockConfigManager.getActiveInstance
          .mockReturnValueOnce({
            instance: validConfig.instances[0]!,
            strategy: InstanceResolutionStrategy.EXPLICIT,
            apiToken: 'prod_token_123',
          })
          .mockReturnValueOnce({
            instance: validConfig.instances[1]!,
            strategy: InstanceResolutionStrategy.EXPLICIT,
            apiToken: 'staging_token_456',
          });

        await factory.getClient('production');
        await factory.getClient('staging');

        factory.clearCache();

        expect(factory.getCacheSize()).toBe(0);
        expect(factory.isCached('production')).toBe(false);
        expect(factory.isCached('staging')).toBe(false);
      });
    });

    describe('getCacheSize', () => {
      it('should return number of cached clients', async () => {
        mockConfigManager.getActiveInstance
          .mockReturnValueOnce({
            instance: validConfig.instances[0]!,
            strategy: InstanceResolutionStrategy.EXPLICIT,
            apiToken: 'prod_token_123',
          })
          .mockReturnValueOnce({
            instance: validConfig.instances[1]!,
            strategy: InstanceResolutionStrategy.EXPLICIT,
            apiToken: 'staging_token_456',
          });

        expect(factory.getCacheSize()).toBe(0);

        await factory.getClient('production');
        expect(factory.getCacheSize()).toBe(1);

        await factory.getClient('staging');
        expect(factory.getCacheSize()).toBe(2);
      });
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      await factory.initialize();
    });

    describe('getAvailableInstances', () => {
      it('should return all available instance names', () => {
        const instances = factory.getAvailableInstances();

        expect(instances).toEqual(['production', 'staging']);
      });

      it('should throw error when not initialized', () => {
        BusinessMapClientFactory.resetInstance();
        const uninitializedFactory = BusinessMapClientFactory.getInstance();

        expect(() => uninitializedFactory.getAvailableInstances()).toThrow(InstanceConfigError);
      });
    });

    describe('getDefaultInstanceName', () => {
      it('should return default instance name', () => {
        const defaultName = factory.getDefaultInstanceName();

        expect(defaultName).toBe('production');
      });

      it('should throw error when not initialized', () => {
        BusinessMapClientFactory.resetInstance();
        const uninitializedFactory = BusinessMapClientFactory.getInstance();

        expect(() => uninitializedFactory.getDefaultInstanceName()).toThrow(InstanceConfigError);
      });
    });

    describe('isLegacyMode', () => {
      it('should return false in multi-instance mode', () => {
        expect(factory.isLegacyMode()).toBe(false);
      });

      it('should return true in legacy mode', async () => {
        mockConfigManager.isLegacyMode.mockReturnValue(true);

        expect(factory.isLegacyMode()).toBe(true);
      });
    });
  });

  describe('Options Management', () => {
    it('should get current options', () => {
      const options = factory.getOptions();

      expect(options.autoInitialize).toBe(true);
      expect(options.enableCaching).toBe(true);
      expect(options.throwOnInitError).toBe(true);
    });

    it('should update options', () => {
      factory.setOptions({ autoInitialize: false });

      const options = factory.getOptions();
      expect(options.autoInitialize).toBe(false);
    });

    it('should merge options when updating', () => {
      factory.setOptions({ autoInitialize: false });
      factory.setOptions({ enableCaching: false });

      const options = factory.getOptions();
      expect(options.autoInitialize).toBe(false);
      expect(options.enableCaching).toBe(false);
      expect(options.throwOnInitError).toBe(true); // unchanged
    });

    it('should not affect already cached clients when updating options', async () => {
      await factory.initialize();

      mockConfigManager.getActiveInstance.mockReturnValue({
        instance: validConfig.instances[0]!,
        strategy: InstanceResolutionStrategy.DEFAULT,
        apiToken: 'prod_token_123',
      });

      await factory.getClient('production');
      expect(factory.isCached('production')).toBe(true);

      factory.setOptions({ enableCaching: false });

      expect(factory.isCached('production')).toBe(true); // Still cached
    });
  });

  describe('Instance Isolation', () => {
    beforeEach(async () => {
      await factory.initialize();
    });

    it('should create clients with isolated configurations', async () => {
      mockConfigManager.getActiveInstance
        .mockReturnValueOnce({
          instance: validConfig.instances[0]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'prod_token_123',
        })
        .mockReturnValueOnce({
          instance: validConfig.instances[1]!,
          strategy: InstanceResolutionStrategy.EXPLICIT,
          apiToken: 'staging_token_456',
        });

      await factory.getClient('production');
      await factory.getClient('staging');

      // Verify each client was created with correct config
      expect(MockedBusinessMapClient).toHaveBeenCalledWith({
        apiUrl: 'https://prod.kanbanize.com/api/v2',
        apiToken: 'prod_token_123',
        readOnlyMode: false,
        defaultWorkspaceId: 1,
      });

      expect(MockedBusinessMapClient).toHaveBeenCalledWith({
        apiUrl: 'https://staging.kanbanize.com/api/v2',
        apiToken: 'staging_token_456',
        readOnlyMode: true,
        defaultWorkspaceId: undefined,
      });
    });
  });
});
