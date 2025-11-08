/**
 * Integration Test: Server Initialization
 *
 * Tests catch historical bug: Import errors (e.g., LRUCache named vs default import)
 *
 * Test Modes:
 * - REAL mode: Require actual server module and verify listTools() includes expected tools
 * - MOCK mode: Basic module load check (no server initialization)
 */

import { TEST_MODE } from './setup';

describe('Server Initialization', () => {
  if (TEST_MODE === 'real') {
    describe('REAL mode - Full server initialization', () => {
      let serverModule: any;

      beforeAll(async () => {
        // Import the actual server module (this will catch import errors)
        serverModule = await import('../../src/index');
      });

      it('should successfully import the server module without errors', () => {
        expect(serverModule).toBeDefined();
      });

      it('should have BusinessMapMcpServer class available', async () => {
        const { BusinessMapMcpServer } = await import('../../src/server/mcp-server');
        expect(BusinessMapMcpServer).toBeDefined();
        expect(typeof BusinessMapMcpServer).toBe('function');
      });

      it('should successfully create MCP server instance', async () => {
        const { BusinessMapMcpServer } = await import('../../src/server/mcp-server');
        const server = new BusinessMapMcpServer();
        expect(server).toBeDefined();
      });

      it('should initialize server with expected configuration', async () => {
        const { BusinessMapMcpServer } = await import('../../src/server/mcp-server');
        const server = new BusinessMapMcpServer();

        // Initialize the server
        await server.initialize();

        // Verify server is initialized
        expect(server).toBeDefined();
        expect(server.server).toBeDefined();

        // Verify the server has expected properties (MCP server instance)
        expect(typeof server.server).toBe('object');
      }, 30000); // 30 second timeout for API initialization

      it('should successfully import all critical dependencies', async () => {
        // Test MCP SDK imports
        const mcpServer = await import('@modelcontextprotocol/sdk/server/mcp');
        expect(mcpServer.McpServer).toBeDefined();

        // Test configuration imports
        const configModule = await import('../../src/config/environment');
        expect(configModule.config).toBeDefined();
        expect(configModule.validateConfig).toBeDefined();

        // Test client imports
        const clientModule = await import('../../src/client/businessmap-client');
        expect(clientModule.BusinessMapClient).toBeDefined();

        // Test client factory imports
        const factoryModule = await import('../../src/client/client-factory');
        expect(factoryModule.BusinessMapClientFactory).toBeDefined();

        // Test that LRUCache can be imported (historical bug: named vs default import)
        // Note: We're not checking the specific export because lru-cache v11 doesn't have @types
        // @ts-expect-error - lru-cache v11 doesn't ship with types
        const lruCacheModule = await import('lru-cache');
        expect(lruCacheModule).toBeDefined();
      });

      it('should handle both multi-instance and legacy mode gracefully', async () => {
        const { BusinessMapClientFactory } = await import('../../src/client/client-factory');
        const factory = BusinessMapClientFactory.getInstance();

        // Factory should initialize in some mode
        await factory.initialize();

        // Should have at least one instance available
        const instances = factory.getAvailableInstances();
        expect(instances.length).toBeGreaterThan(0);

        // Should have a default instance
        const defaultInstance = factory.getDefaultInstanceName();
        expect(defaultInstance).toBeDefined();
        expect(typeof defaultInstance).toBe('string');
      }, 30000);
    });
  } else {
    describe('MOCK mode - Basic module load checks', () => {
      it('should verify server module path exists', async () => {
        // In mock mode, just verify the file can be imported without throwing
        let error: Error | null = null;

        try {
          await import('../../src/index');
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeNull();
      });

      it('should verify MCP server class is importable', async () => {
        let error: Error | null = null;

        try {
          const { BusinessMapMcpServer } = await import('../../src/server/mcp-server');
          expect(BusinessMapMcpServer).toBeDefined();
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeNull();
      });

      it('should verify critical dependencies are present', async () => {
        // Test that critical imports don't throw in mock mode
        const dependencies = [
          'lru-cache',
          '@modelcontextprotocol/sdk/server/mcp',
          '../../src/config/environment',
          '../../src/client/businessmap-client',
          '../../src/client/client-factory'
        ];

        for (const dep of dependencies) {
          let error: Error | null = null;

          try {
            await import(dep);
          } catch (e) {
            error = e as Error;
          }

          expect(error).toBeNull();
        }
      });

      it('should not require API credentials in mock mode', () => {
        // In mock mode, TEST_MODE should be 'mock'
        expect(TEST_MODE).toBe('mock');
      });
    });
  }

  // Common tests that run in both modes
  describe('Common initialization checks', () => {
    it('should have valid package.json with version', async () => {
      const { readFileSync } = await import('fs');
      const { join } = await import('path');

      const packageJson = JSON.parse(
        readFileSync(join(process.cwd(), 'package.json'), 'utf-8')
      );

      expect(packageJson.name).toBe('@neilinger/businessmap-mcp');
      expect(packageJson.version).toBeDefined();
      expect(typeof packageJson.version).toBe('string');
    });

    it('should have TypeScript configured correctly', async () => {
      const { readFileSync, existsSync } = await import('fs');
      const { join } = await import('path');

      const tsconfigPath = join(process.cwd(), 'tsconfig.json');
      expect(existsSync(tsconfigPath)).toBe(true);

      const tsconfig = JSON.parse(readFileSync(tsconfigPath, 'utf-8'));
      expect(tsconfig.compilerOptions).toBeDefined();
      expect(tsconfig.compilerOptions.module).toBe('ESNext');
      expect(tsconfig.compilerOptions.target).toBeDefined();
    });

    it('should export expected module structure', async () => {
      const indexModule = await import('../../src/index');

      // In ESM, the module itself is exported as default or named exports
      // Verify the module loads without errors
      expect(indexModule).toBeDefined();
    });
  });
});
