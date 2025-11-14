/**
 * Unit tests for InstanceConfigManager
 *
 * Tests configuration loading, validation, instance resolution,
 * and error handling for multi-instance configuration.
 */

// Import jest globals explicitly for ESM compatibility
import { jest } from '@jest/globals';

// Mock fs module BEFORE importing modules that use it
// Create mock functions that will be shared across tests
const mockReadFileSync = jest.fn();
const mockExistsSync = jest.fn();
const mockWriteFileSync = jest.fn();
const mockMkdirSync = jest.fn();

jest.unstable_mockModule('fs', () => {
  return {
    readFileSync: mockReadFileSync,
    existsSync: mockExistsSync,
    writeFileSync: mockWriteFileSync,
    mkdirSync: mockMkdirSync,
    default: {
      readFileSync: mockReadFileSync,
      existsSync: mockExistsSync,
      writeFileSync: mockWriteFileSync,
      mkdirSync: mockMkdirSync,
    },
  };
});

// Import non-mocked modules statically (path, os)
import { join } from 'path';
import { homedir } from 'os';

describe('InstanceConfigManager', () => {
  // Dynamic imports will be loaded in beforeAll
  let InstanceConfigManager: any;
  let InstanceConfigError: any;
  let InstanceNotFoundError: any;
  let InstanceResolutionStrategy: any;
  let TokenLoadError: any;

  let manager: any;
  let originalEnv: NodeJS.ProcessEnv;

  // Load modules dynamically after mock setup
  beforeAll(async () => {
    const managerModule = await import('../../src/config/instance-manager.js');
    const typesModule = await import('../../src/types/instance-config.js');

    InstanceConfigManager = managerModule.InstanceConfigManager;
    InstanceConfigError = typesModule.InstanceConfigError;
    InstanceNotFoundError = typesModule.InstanceNotFoundError;
    InstanceResolutionStrategy = typesModule.InstanceResolutionStrategy;
    TokenLoadError = typesModule.TokenLoadError;
  });

  // Sample valid configuration
  const validConfig: any = {
    version: '1.0',
    defaultInstance: 'production',
    instances: [
      {
        name: 'production',
        apiUrl: 'https://prod.kanbanize.com/api/v2',
        apiTokenEnv: 'BUSINESSMAP_API_TOKEN_PROD',
        readOnlyMode: false,
        defaultWorkspaceId: 1,
        description: 'Production environment',
        tags: ['prod', 'primary'],
      },
      {
        name: 'staging',
        apiUrl: 'https://staging.kanbanize.com/api/v2',
        apiTokenEnv: 'BUSINESSMAP_API_TOKEN_STAGING',
        readOnlyMode: true,
        description: 'Staging environment',
      },
      {
        name: 'development',
        apiUrl: 'https://dev.kanbanize.com/api/v2',
        apiTokenEnv: 'BUSINESSMAP_API_TOKEN_DEV',
      },
    ],
  };

  beforeEach(() => {
    // Reset singleton
    InstanceConfigManager.resetInstance();
    manager = InstanceConfigManager.getInstance();

    // Backup and clear environment
    originalEnv = { ...process.env };
    delete process.env.BUSINESSMAP_INSTANCES;
    delete process.env.BUSINESSMAP_API_URL;
    delete process.env.BUSINESSMAP_API_TOKEN;
    delete process.env.BUSINESSMAP_READ_ONLY_MODE;
    delete process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID;

    // Reset mock call history but NOT implementations
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance', () => {
      const instance1 = InstanceConfigManager.getInstance();
      const instance2 = InstanceConfigManager.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should reset instance', () => {
      const instance1 = InstanceConfigManager.getInstance();
      InstanceConfigManager.resetInstance();
      const instance2 = InstanceConfigManager.getInstance();

      expect(instance1).not.toBe(instance2);
    });
  });

  describe('Configuration Loading', () => {
    describe('loadFromFile', () => {
      it('should load configuration from explicit file path', async () => {
        const configPath = '/path/to/config.json';
        // Use mockReturnValue instead of mockReturnValueOnce for ESM mocking
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

        await manager.loadConfig({ configPath });

        expect(mockReadFileSync).toHaveBeenCalledWith(configPath, 'utf-8');
        expect(manager.isConfigured()).toBe(true);
      });

      it('should throw error if file does not exist', async () => {
        const configPath = '/nonexistent/config.json';
        mockExistsSync.mockReturnValue(false);

        await expect(manager.loadConfig({ configPath })).rejects.toThrow(InstanceConfigError);
        await expect(manager.loadConfig({ configPath })).rejects.toThrow('not found');
      });

      it('should throw error on invalid JSON', async () => {
        const configPath = '/path/to/invalid.json';
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue('{ invalid json }');

        await expect(manager.loadConfig({ configPath })).rejects.toThrow(InstanceConfigError);
      });

      it('should load without validation when validate=false', async () => {
        const configPath = '/path/to/config.json';
        mockExistsSync.mockReturnValue(true);
        mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

        await manager.loadConfig({ configPath, validate: false });

        expect(manager.isConfigured()).toBe(true);
      });
    });

    describe('loadFromEnvVar', () => {
      it('should load configuration from BUSINESSMAP_INSTANCES', async () => {
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(validConfig);

        await manager.loadConfig();

        expect(manager.isConfigured()).toBe(true);
        expect(manager.getDefaultInstanceName()).toBe('production');
      });

      it('should throw error on invalid JSON in env var', async () => {
        process.env.BUSINESSMAP_INSTANCES = '{ invalid json }';

        await expect(manager.loadConfig()).rejects.toThrow(InstanceConfigError);
        await expect(manager.loadConfig()).rejects.toThrow('Invalid JSON');
      });
    });

    describe('loadFromDefaultPaths', () => {
      it('should try default paths in order', async () => {
        const expectedPath = join(process.cwd(), '.businessmap-instances.json');
        mockExistsSync.mockImplementation((path) => {
          return path === expectedPath;
        });
        mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

        await manager.loadConfig();

        expect(mockExistsSync).toHaveBeenCalled();
        expect(manager.isConfigured()).toBe(true);
      });

      it('should use first existing default path', async () => {
        const homePath = join(homedir(), '.businessmap-mcp', 'instances.json');
        mockExistsSync.mockImplementation((path) => path === homePath);
        mockReadFileSync.mockReturnValue(JSON.stringify(validConfig));

        await manager.loadConfig();

        expect(manager.isConfigured()).toBe(true);
      });
    });

    describe('legacyMode', () => {
      it('should load legacy configuration when env vars present', async () => {
        process.env.BUSINESSMAP_API_URL = 'https://legacy.kanbanize.com/api/v2';
        process.env.BUSINESSMAP_API_TOKEN = 'legacy_token_123';
        // Mock all default paths as not existing to force legacy mode
        mockExistsSync.mockReturnValue(false);

        await manager.loadConfig({ allowLegacyFallback: true });

        expect(manager.isConfigured()).toBe(true);
        expect(manager.isLegacyMode()).toBe(true);
      });

      it('should use BUSINESSMAP_READ_ONLY_MODE in legacy mode', async () => {
        process.env.BUSINESSMAP_API_URL = 'https://legacy.kanbanize.com/api/v2';
        process.env.BUSINESSMAP_API_TOKEN = 'legacy_token_123';
        process.env.BUSINESSMAP_READ_ONLY_MODE = 'true';
        mockExistsSync.mockReturnValue(false);

        await manager.loadConfig({ allowLegacyFallback: true });

        const instance = manager.getAllInstances()[0];
        expect(instance?.readOnlyMode).toBe(true);
      });

      it('should use BUSINESSMAP_DEFAULT_WORKSPACE_ID in legacy mode', async () => {
        process.env.BUSINESSMAP_API_URL = 'https://legacy.kanbanize.com/api/v2';
        process.env.BUSINESSMAP_API_TOKEN = 'legacy_token_123';
        process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID = '42';
        mockExistsSync.mockReturnValue(false);

        await manager.loadConfig({ allowLegacyFallback: true });

        const instance = manager.getAllInstances()[0];
        expect(instance?.defaultWorkspaceId).toBe(42);
      });

      it('should not use legacy mode when allowLegacyFallback=false', async () => {
        process.env.BUSINESSMAP_API_URL = 'https://legacy.kanbanize.com/api/v2';
        process.env.BUSINESSMAP_API_TOKEN = 'legacy_token_123';
        mockExistsSync.mockReturnValue(false);

        await expect(
          manager.loadConfig({ allowLegacyFallback: false, strict: true })
        ).rejects.toThrow(InstanceConfigError);
      });
    });

    describe('strict mode', () => {
      it('should throw error when strict=true and no config found', async () => {
        mockExistsSync.mockReturnValue(false);

        await expect(manager.loadConfig({ strict: true })).rejects.toThrow(InstanceConfigError);
      });

      it('should not throw when strict=false and no config found', async () => {
        mockExistsSync.mockReturnValue(false);

        await manager.loadConfig({ strict: false, allowLegacyFallback: false });

        expect(manager.isConfigured()).toBe(false);
      });
    });
  });

  describe('Configuration Validation', () => {
    it('should validate correct configuration', async () => {
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(validConfig);

      await manager.loadConfig({ validate: true });

      expect(manager.isConfigured()).toBe(true);
    });

    it('should reject configuration without version', async () => {
      const invalid = { ...validConfig };
      delete (invalid as any).version;
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject configuration with invalid version format', async () => {
      const invalid = { ...validConfig, version: 'invalid' };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject configuration without instances', async () => {
      const invalid = { ...validConfig, instances: [] };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject configuration with duplicate instance names', async () => {
      const invalid = {
        ...validConfig,
        instances: [
          validConfig.instances[0]!,
          { ...validConfig.instances[0]!, description: 'Duplicate' },
        ],
      };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject configuration with non-existent default instance', async () => {
      const invalid = { ...validConfig, defaultInstance: 'nonexistent' };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject instance with empty name', async () => {
      const invalid = {
        ...validConfig,
        instances: [{ ...validConfig.instances[0]!, name: '' }],
      };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject instance with invalid URL', async () => {
      const invalid = {
        ...validConfig,
        instances: [{ ...validConfig.instances[0]!, apiUrl: 'not-a-url' }],
      };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });

    it('should reject instance with empty apiTokenEnv', async () => {
      const invalid = {
        ...validConfig,
        instances: [{ ...validConfig.instances[0]!, apiTokenEnv: '' }],
      };
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(invalid);

      await expect(manager.loadConfig({ validate: true })).rejects.toThrow(InstanceConfigError);
    });
  });

  describe('Instance Resolution', () => {
    beforeEach(async () => {
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(validConfig);
      process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token_123';
      process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token_456';
      process.env.BUSINESSMAP_API_TOKEN_DEV = 'dev_token_789';
      await manager.loadConfig();
    });

    describe('getActiveInstance', () => {
      it('should resolve explicit instance by name', () => {
        const result = manager.getActiveInstance('staging');

        expect(result.instance.name).toBe('staging');
        expect(result.strategy).toBe(InstanceResolutionStrategy.EXPLICIT);
        expect(result.apiToken).toBe('staging_token_456');
      });

      it('should resolve default instance when no name provided', () => {
        const result = manager.getActiveInstance();

        expect(result.instance.name).toBe('production');
        expect(result.strategy).toBe(InstanceResolutionStrategy.DEFAULT);
        expect(result.apiToken).toBe('prod_token_123');
      });

      it('should throw InstanceNotFoundError for non-existent instance', () => {
        expect(() => manager.getActiveInstance('nonexistent')).toThrow(InstanceNotFoundError);
      });

      it('should throw TokenLoadError when token env var not set', () => {
        delete process.env.BUSINESSMAP_API_TOKEN_PROD;

        expect(() => manager.getActiveInstance('production')).toThrow(TokenLoadError);
      });

      it('should throw TokenLoadError when token is empty string', () => {
        process.env.BUSINESSMAP_API_TOKEN_PROD = '';

        expect(() => manager.getActiveInstance('production')).toThrow(TokenLoadError);
      });

      it('should throw TokenLoadError when token is whitespace', () => {
        process.env.BUSINESSMAP_API_TOKEN_PROD = '   ';

        expect(() => manager.getActiveInstance('production')).toThrow(TokenLoadError);
      });

      it('should throw error when config not loaded', () => {
        InstanceConfigManager.resetInstance();
        const newManager = InstanceConfigManager.getInstance();

        expect(() => newManager.getActiveInstance()).toThrow(InstanceConfigError);
        expect(() => newManager.getActiveInstance()).toThrow('not loaded');
      });
    });

    describe('legacy mode resolution', () => {
      beforeEach(async () => {
        InstanceConfigManager.resetInstance();
        manager = InstanceConfigManager.getInstance();

        process.env.BUSINESSMAP_API_URL = 'https://legacy.kanbanize.com/api/v2';
        process.env.BUSINESSMAP_API_TOKEN = 'legacy_token';
        delete process.env.BUSINESSMAP_INSTANCES;
        mockExistsSync.mockReturnValue(false);

        await manager.loadConfig();
      });

      it('should use legacy strategy in legacy mode', () => {
        const result = manager.getActiveInstance();

        expect(result.strategy).toBe(InstanceResolutionStrategy.LEGACY);
        expect(result.instance.name).toBe('default');
        expect(result.apiToken).toBe('legacy_token');
      });
    });
  });

  describe('Query Methods', () => {
    beforeEach(async () => {
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(validConfig);
      await manager.loadConfig();
    });

    describe('getAllInstances', () => {
      it('should return all configured instances', () => {
        const instances = manager.getAllInstances();

        expect(instances).toHaveLength(3);
        expect(instances.map((i: any) => i.name)).toEqual(['production', 'staging', 'development']);
      });

      it('should return a copy of instances array', () => {
        const instances1 = manager.getAllInstances();
        const instances2 = manager.getAllInstances();

        expect(instances1).not.toBe(instances2);
        expect(instances1).toEqual(instances2);
      });

      it('should throw error when config not loaded', () => {
        InstanceConfigManager.resetInstance();
        const newManager = InstanceConfigManager.getInstance();

        expect(() => newManager.getAllInstances()).toThrow(InstanceConfigError);
      });
    });

    describe('getDefaultInstanceName', () => {
      it('should return default instance name', () => {
        expect(manager.getDefaultInstanceName()).toBe('production');
      });

      it('should throw error when config not loaded', () => {
        InstanceConfigManager.resetInstance();
        const newManager = InstanceConfigManager.getInstance();

        expect(() => newManager.getDefaultInstanceName()).toThrow(InstanceConfigError);
      });
    });

    describe('hasInstance', () => {
      it('should return true for existing instance', () => {
        expect(manager.hasInstance('production')).toBe(true);
        expect(manager.hasInstance('staging')).toBe(true);
      });

      it('should return false for non-existent instance', () => {
        expect(manager.hasInstance('nonexistent')).toBe(false);
      });

      it('should return false when config not loaded', () => {
        InstanceConfigManager.resetInstance();
        const newManager = InstanceConfigManager.getInstance();

        expect(newManager.hasInstance('production')).toBe(false);
      });
    });

    describe('isConfigured', () => {
      it('should return true when configured', () => {
        expect(manager.isConfigured()).toBe(true);
      });

      it('should return false when not configured', () => {
        InstanceConfigManager.resetInstance();
        const newManager = InstanceConfigManager.getInstance();

        expect(newManager.isConfigured()).toBe(false);
      });
    });

    describe('isLegacyMode', () => {
      it('should return false in multi-instance mode', () => {
        expect(manager.isLegacyMode()).toBe(false);
      });

      it('should return true in legacy mode', async () => {
        InstanceConfigManager.resetInstance();
        manager = InstanceConfigManager.getInstance();

        process.env.BUSINESSMAP_API_URL = 'https://legacy.kanbanize.com/api/v2';
        process.env.BUSINESSMAP_API_TOKEN = 'legacy_token';
        delete process.env.BUSINESSMAP_INSTANCES;
        mockExistsSync.mockReturnValue(false);

        await manager.loadConfig();

        expect(manager.isLegacyMode()).toBe(true);
      });
    });

    describe('getConfig', () => {
      it('should return current configuration', () => {
        const config = manager.getConfig();

        expect(config).not.toBeNull();
        expect(config?.version).toBe('1.0');
        expect(config?.instances).toHaveLength(3);
      });

      it('should return a copy of configuration', () => {
        const config1 = manager.getConfig();
        const config2 = manager.getConfig();

        expect(config1).not.toBe(config2);
        expect(config1).toEqual(config2);
      });

      it('should return null when not configured', () => {
        InstanceConfigManager.resetInstance();
        const newManager = InstanceConfigManager.getInstance();

        expect(newManager.getConfig()).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should include error code in InstanceConfigError', async () => {
      mockExistsSync.mockReturnValue(false);

      try {
        await manager.loadConfig({ strict: true, allowLegacyFallback: false });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(InstanceConfigError);
        expect((error as any).code).toBe('CONFIG_NOT_FOUND');
      }
    });

    it('should include details in InstanceConfigError', async () => {
      mockExistsSync.mockReturnValue(false);

      try {
        await manager.loadConfig({ strict: true, allowLegacyFallback: false });
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(InstanceConfigError);
        expect((error as any).details).toBeDefined();
      }
    });

    it('should include instance name in InstanceNotFoundError', () => {
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(validConfig);

      expect(async () => {
        await manager.loadConfig();
        manager.getActiveInstance('nonexistent');
      }).rejects.toThrow(InstanceNotFoundError);
    });

    it('should include env var name in TokenLoadError', async () => {
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(validConfig);
      await manager.loadConfig();
      delete process.env.BUSINESSMAP_API_TOKEN_PROD;

      try {
        manager.getActiveInstance('production');
        fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(TokenLoadError);
        expect((error as any).details?.envVarName).toBe('BUSINESSMAP_API_TOKEN_PROD');
      }
    });
  });
});
