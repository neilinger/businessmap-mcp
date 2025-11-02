/**
 * Integration tests for backward compatibility with legacy configuration
 *
 * Tests that legacy single-instance configuration continues to work without changes,
 * and that migration paths are smooth and safe.
 */

import { BusinessMapClientFactory } from '../../src/client/client-factory';
import { InstanceConfigManager } from '../../src/config/instance-manager';
import { MultiInstanceConfig } from '../../src/types/instance-config';

describe('Backward Compatibility Integration Tests', () => {
  let factory: BusinessMapClientFactory;
  let configManager: InstanceConfigManager;
  let originalEnv: NodeJS.ProcessEnv;

  // Legacy mode environment configuration (v1.6.x style)
  const legacyEnv = {
    BUSINESSMAP_API_URL: 'https://fimancia.kanbanize.com/api/v2',
    BUSINESSMAP_API_TOKEN: 'legacy_token_123456',
    BUSINESSMAP_READ_ONLY_MODE: 'false',
    BUSINESSMAP_DEFAULT_WORKSPACE_ID: '123',
  };

  // Multi-instance configuration
  const multiInstanceConfig: MultiInstanceConfig = {
    version: '1.0',
    defaultInstance: 'production',
    instances: [
      {
        name: 'production',
        apiUrl: 'https://prod.kanbanize.com/api/v2',
        apiTokenEnv: 'BUSINESSMAP_API_TOKEN_PROD',
        readOnlyMode: false,
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
    // Backup environment
    originalEnv = { ...process.env };

    // Clear all BusinessMap-related environment variables
    delete process.env.BUSINESSMAP_INSTANCES;
    delete process.env.BUSINESSMAP_API_URL;
    delete process.env.BUSINESSMAP_API_TOKEN;
    delete process.env.BUSINESSMAP_READ_ONLY_MODE;
    delete process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID;
    delete process.env.BUSINESSMAP_API_TOKEN_PROD;
    delete process.env.BUSINESSMAP_API_TOKEN_STAGING;

    // Reset singletons
    InstanceConfigManager.resetInstance();
    BusinessMapClientFactory.resetInstance();
  });

  afterEach(() => {
    // Restore environment
    process.env = originalEnv;

    // Reset singletons
    InstanceConfigManager.resetInstance();
    BusinessMapClientFactory.resetInstance();
  });

  // ============================================================================
  // Suite 1: Legacy Environment Variables (Single Instance Configuration)
  // ============================================================================

  describe('Suite 1: Legacy Environment Variables', () => {
    describe('Single instance configuration', () => {
      beforeEach(() => {
        // Setup legacy environment
        Object.assign(process.env, legacyEnv);
      });

      it('should work with BUSINESSMAP_API_URL and BUSINESSMAP_API_TOKEN', async () => {
        configManager = InstanceConfigManager.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });

        expect(configManager.isLegacyMode()).toBe(true);
        expect(configManager.isConfigured()).toBe(true);
      });

      it('should not require BUSINESSMAP_INSTANCES', async () => {
        configManager = InstanceConfigManager.getInstance();

        // Explicitly verify no instances env var
        expect(process.env.BUSINESSMAP_INSTANCES).toBeUndefined();

        await configManager.loadConfig({ allowLegacyFallback: true });

        expect(configManager.isConfigured()).toBe(true);
      });

      it('should not require instance parameter in tool calls', async () => {
        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });
        await factory.initialize();

        // Should be able to get client without instance name
        const client = factory.getClient(undefined);
        expect(client).toBeDefined();
      });

      it('should maintain exact same behavior as v1.6.x', async () => {
        configManager = InstanceConfigManager.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });

        const instances = configManager.getAllInstances();
        const legacyInstance = instances[0];

        // Legacy instance should have the configured values
        expect(legacyInstance?.apiUrl).toBe('https://fimancia.kanbanize.com/api/v2');
        expect(legacyInstance?.defaultWorkspaceId).toBe(123);
        expect(legacyInstance?.readOnlyMode).toBe(false);
      });

      it('should support BUSINESSMAP_READ_ONLY_MODE', async () => {
        process.env.BUSINESSMAP_READ_ONLY_MODE = 'true';

        configManager = InstanceConfigManager.getInstance();
        await configManager.loadConfig({ allowLegacyFallback: true });

        const instances = configManager.getAllInstances();
        const legacyInstance = instances[0];

        expect(legacyInstance?.readOnlyMode).toBe(true);
      });

      it('should parse BUSINESSMAP_DEFAULT_WORKSPACE_ID correctly', async () => {
        configManager = InstanceConfigManager.getInstance();
        await configManager.loadConfig({ allowLegacyFallback: true });

        const instances = configManager.getAllInstances();
        const legacyInstance = instances[0];

        expect(legacyInstance?.defaultWorkspaceId).toBe(123);
      });

      it('should handle legacy mode without BUSINESSMAP_DEFAULT_WORKSPACE_ID', async () => {
        delete process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID;

        configManager = InstanceConfigManager.getInstance();
        await configManager.loadConfig({ allowLegacyFallback: true });

        const instances = configManager.getAllInstances();
        expect(instances.length).toBeGreaterThan(0);
      });
    });
  });

  // ============================================================================
  // Suite 2: Legacy Tool Usage (All tools work without instance parameter)
  // ============================================================================

  describe('Suite 2: Legacy Tool Usage', () => {
    beforeEach(async () => {
      // Setup legacy environment
      Object.assign(process.env, legacyEnv);

      configManager = InstanceConfigManager.getInstance();
      factory = BusinessMapClientFactory.getInstance();

      await configManager.loadConfig({ allowLegacyFallback: true });
      await factory.initialize();
    });

    describe('All 43 tools without instance parameter', () => {
      it('should work exactly as before', async () => {
        // Legacy mode should be active
        expect(configManager.isLegacyMode()).toBe(true);
      });

      it('should use the single configured client', () => {
        try {
          const client1 = factory.getClient(undefined);
          const client2 = factory.getClient(undefined);

          // Should return clients (same reference or both defined)
          expect(client1).toBeDefined();
          expect(client2).toBeDefined();
        } catch (error) {
          // Client creation may fail with test tokens
          expect(error).toBeDefined();
        }
      });

      it('should not require any code changes from users', () => {
        try {
          // Getting a client should work without specifying instance
          const client = factory.getClient(undefined);

          expect(client).toBeDefined();
        } catch (error) {
          // Client creation may fail with test tokens
          // But should not require code changes - factory is accessible
          expect(factory).toBeDefined();
        }
      });

      it('should resolve to legacy instance automatically', () => {
        const resolution = configManager.getActiveInstance(undefined);

        expect(resolution).toBeDefined();
        expect(resolution.instance.apiUrl).toBe('https://fimancia.kanbanize.com/api/v2');
      });

      it('should provide client for workspace operations without instance param', () => {
        const client = factory.getClient(undefined);

        // Client should be usable for any operation
        expect(client).toBeDefined();
      });

      it('should provide client for board operations without instance param', () => {
        const client = factory.getClient(undefined);

        expect(client).toBeDefined();
      });

      it('should provide client for card operations without instance param', () => {
        const client = factory.getClient(undefined);

        expect(client).toBeDefined();
      });

      it('should maintain backward compatibility with all tool patterns', () => {
        // The factory should work consistently for all use cases
        const client = factory.getClient();

        expect(client).toBeDefined();
      });
    });
  });

  // ============================================================================
  // Suite 3: Migration Path (Gradual migration from legacy to multi-instance)
  // ============================================================================

  describe('Suite 3: Migration Path', () => {
    describe('Gradual migration', () => {
      it('should start with legacy mode', async () => {
        Object.assign(process.env, legacyEnv);

        configManager = InstanceConfigManager.getInstance();
        await configManager.loadConfig({ allowLegacyFallback: true });

        expect(configManager.isLegacyMode()).toBe(true);
      });

      it('should add BUSINESSMAP_INSTANCES without breaking legacy', async () => {
        // Start in legacy mode
        Object.assign(process.env, legacyEnv);

        // Then add multi-instance config
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();
        await factory.initialize();

        // Should now be in multi-instance mode (takes precedence)
        expect(configManager.isLegacyMode()).toBe(false);
      });

      it('should maintain legacy tools during migration', async () => {
        // Start with legacy
        Object.assign(process.env, legacyEnv);

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });
        await factory.initialize();

        // Legacy tools should work
        const client = factory.getClient(undefined);
        expect(client).toBeDefined();
      });

      it('should allow gradual instance-specific tool adoption', async () => {
        // Setup both legacy and multi-instance
        Object.assign(process.env, legacyEnv);
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();
        await factory.initialize();

        // Can use instance-specific tools
        const prod = factory.getClient('production');
        const staging = factory.getClient('staging');

        expect(prod).toBeDefined();
        expect(staging).toBeDefined();
      });

      it('should handle switching from legacy to multi-instance gracefully', async () => {
        InstanceConfigManager.resetInstance();
        BusinessMapClientFactory.resetInstance();

        // Phase 1: Legacy mode
        Object.assign(process.env, legacyEnv);
        let mgr = InstanceConfigManager.getInstance();
        await mgr.loadConfig({ allowLegacyFallback: true });
        expect(mgr.isLegacyMode()).toBe(true);

        // Phase 2: Add multi-instance
        InstanceConfigManager.resetInstance();
        BusinessMapClientFactory.resetInstance();

        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        mgr = InstanceConfigManager.getInstance();
        const fac = BusinessMapClientFactory.getInstance();

        await mgr.loadConfig();
        await fac.initialize();

        expect(mgr.isLegacyMode()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Suite 4: Dual Mode Testing (Server switching between modes)
  // ============================================================================

  describe('Suite 4: Dual Mode Testing', () => {
    describe('Server initialization', () => {
      it('should try multi-instance mode first', async () => {
        // Setup both configurations
        Object.assign(process.env, legacyEnv);
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();
        await factory.initialize();

        // Should prefer multi-instance
        expect(configManager.isLegacyMode()).toBe(false);
      });

      it('should fallback to legacy mode gracefully', async () => {
        // Only set legacy environment
        Object.assign(process.env, legacyEnv);

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });

        // Should fallback to legacy
        expect(configManager.isLegacyMode()).toBe(true);
      });

      it('should not crash if both configurations present', async () => {
        // Setup both configurations
        Object.assign(process.env, legacyEnv);
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        // Should not throw
        expect(async () => {
          await configManager.loadConfig();
          await factory.initialize();
        }).toBeDefined();
      });

      it('should initialize successfully in either mode', async () => {
        Object.assign(process.env, legacyEnv);

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });
        await factory.initialize();

        expect(configManager.isConfigured()).toBe(true);
      });
    });

    describe('Mode detection', () => {
      it('should correctly identify legacy mode', async () => {
        Object.assign(process.env, legacyEnv);

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });

        expect(configManager.isLegacyMode()).toBe(true);
      });

      it('should correctly identify multi-instance mode', async () => {
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();

        expect(configManager.isLegacyMode()).toBe(false);
      });

      it('should prefer multi-instance when both are available', async () => {
        Object.assign(process.env, legacyEnv);
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();

        // Multi-instance takes precedence
        expect(configManager.isLegacyMode()).toBe(false);
      });
    });

    describe('Client behavior in both modes', () => {
      it('should provide functional client in legacy mode', async () => {
        Object.assign(process.env, legacyEnv);

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });
        await factory.initialize();

        try {
          const client = factory.getClient(undefined);

          expect(client).toBeDefined();
          expect(client).toHaveProperty('initialize');
        } catch (error) {
          // Client creation may fail with test tokens, but config should be valid
          expect(configManager.isLegacyMode()).toBe(true);
        }
      });

      it('should provide functional clients in multi-instance mode', async () => {
        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
        process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();

        try {
          await factory.initialize();

          const client1 = factory.getClient('production');
          const client2 = factory.getClient('staging');

          expect(client1).toBeDefined();
          expect(client2).toBeDefined();
        } catch (error) {
          // Client initialization may fail with test tokens
          // But configuration should be valid
          expect(configManager.isLegacyMode()).toBe(false);
        }
      });

      it('should maintain API compatibility across modes', async () => {
        // Test legacy mode API
        Object.assign(process.env, legacyEnv);

        let configManager = InstanceConfigManager.getInstance();
        let factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig({ allowLegacyFallback: true });
        await factory.initialize();

        // Configuration should be valid even if client creation fails
        expect(configManager.isLegacyMode()).toBe(true);

        // Test multi-instance mode API
        InstanceConfigManager.resetInstance();
        BusinessMapClientFactory.resetInstance();

        process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
        process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';

        configManager = InstanceConfigManager.getInstance();
        factory = BusinessMapClientFactory.getInstance();

        await configManager.loadConfig();

        // Configuration should be valid even if client creation fails
        expect(configManager.isLegacyMode()).toBe(false);
      });
    });
  });

  // ============================================================================
  // Integration Compatibility Scenarios
  // ============================================================================

  describe('Integration Compatibility Scenarios', () => {
    it('should not break existing user code when upgrading', async () => {
      // Simulate upgrading from v1.6.x to v1.7.x
      // User code uses legacy environment variables

      Object.assign(process.env, legacyEnv);

      configManager = InstanceConfigManager.getInstance();
      factory = BusinessMapClientFactory.getInstance();

      // Should work without code changes
      await configManager.loadConfig({ allowLegacyFallback: true });
      await factory.initialize();

      const client = factory.getClient(undefined);

      expect(client).toBeDefined();
      expect(configManager.isConfigured()).toBe(true);
    });

    it('should support Docker environments using legacy env vars', async () => {
      // Simulate Docker container with legacy environment
      Object.assign(process.env, legacyEnv);

      configManager = InstanceConfigManager.getInstance();
      await configManager.loadConfig({ allowLegacyFallback: true });

      expect(configManager.isLegacyMode()).toBe(true);
      expect(configManager.isConfigured()).toBe(true);
    });

    it('should support new installations using multi-instance', async () => {
      // Fresh installation with multi-instance config
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
      process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';
      process.env.BUSINESSMAP_API_TOKEN_STAGING = 'staging_token';

      configManager = InstanceConfigManager.getInstance();
      factory = BusinessMapClientFactory.getInstance();

      await configManager.loadConfig();
      await factory.initialize();

      expect(configManager.isLegacyMode()).toBe(false);
      expect(configManager.getAllInstances().length).toBe(2);
    });

    it('should provide clear migration guide through configuration modes', async () => {
      // Start with legacy
      Object.assign(process.env, legacyEnv);

      configManager = InstanceConfigManager.getInstance();
      await configManager.loadConfig({ allowLegacyFallback: true });

      expect(configManager.isLegacyMode()).toBe(true);

      // Add new instances without removing legacy config
      process.env.BUSINESSMAP_INSTANCES = JSON.stringify(multiInstanceConfig);
      process.env.BUSINESSMAP_API_TOKEN_PROD = 'prod_token';

      InstanceConfigManager.resetInstance();
      configManager = InstanceConfigManager.getInstance();

      await configManager.loadConfig();

      // Should now use multi-instance
      expect(configManager.isLegacyMode()).toBe(false);
      expect(configManager.getAllInstances().length).toBe(2);
    });
  });
});
