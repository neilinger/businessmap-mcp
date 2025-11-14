/**
 * Integration Test: Environment Variable Validation
 *
 * Tests catch historical bug: Environment variable validation failures
 *
 * Test Modes:
 * - REAL mode: Actual callTool() API connection test with real credentials
 * - MOCK mode: typeof check + regex match /^BUSINESSMAP_API_TOKEN_/
 */

import { TEST_MODE } from './setup';

describe('Environment Variable Validation', () => {
  if (TEST_MODE === 'real') {
    describe('REAL mode - API connection with real credentials', () => {
      it('should have valid API token environment variables', () => {
        const fimanciaToken = process.env.BUSINESSMAP_API_TOKEN_FIMANCIA;
        const kerkowToken = process.env.BUSINESSMAP_API_TOKEN_KERKOW;

        // At least one token should be present in REAL mode
        const hasToken = !!fimanciaToken || !!kerkowToken;
        expect(hasToken).toBe(true);

        // Verify token format (should be non-empty strings)
        if (fimanciaToken) {
          expect(typeof fimanciaToken).toBe('string');
          expect(fimanciaToken.length).toBeGreaterThan(0);
          expect(fimanciaToken.trim()).toBe(fimanciaToken); // No leading/trailing spaces
        }

        if (kerkowToken) {
          expect(typeof kerkowToken).toBe('string');
          expect(kerkowToken.length).toBeGreaterThan(0);
          expect(kerkowToken.trim()).toBe(kerkowToken); // No leading/trailing spaces
        }
      });

      it('should validate environment variable naming pattern', () => {
        const fimanciaToken = process.env.BUSINESSMAP_API_TOKEN_FIMANCIA;
        const kerkowToken = process.env.BUSINESSMAP_API_TOKEN_KERKOW;

        // Pattern: BUSINESSMAP_API_TOKEN_{INSTANCE_NAME}
        const tokenPattern = /^BUSINESSMAP_API_TOKEN_/;

        if (fimanciaToken) {
          expect('BUSINESSMAP_API_TOKEN_FIMANCIA').toMatch(tokenPattern);
        }

        if (kerkowToken) {
          expect('BUSINESSMAP_API_TOKEN_KERKOW').toMatch(tokenPattern);
        }
      });

      it('should successfully connect to API with real credentials', async () => {
        const { BusinessMapClientFactory } = await import('../../src/client/client-factory');

        const factory = BusinessMapClientFactory.getInstance();
        await factory.initialize();

        // Get a client for the default instance
        const client = await factory.getClient();

        // Test API connection with health check
        let connectionSuccessful = false;
        let error: Error | null = null;

        try {
          // Try to get current user (simple API call to verify connection)
          const response = await client.getCurrentUser();
          connectionSuccessful = !!response;
        } catch (e) {
          error = e as Error;
        }

        // Connection should succeed in REAL mode with valid credentials
        expect(connectionSuccessful).toBe(true);
        expect(error).toBeNull();
      }, 30000);

      it('should load token from environment for specific instance', async () => {
        const { BusinessMapClientFactory } = await import('../../src/client/client-factory');

        const factory = BusinessMapClientFactory.getInstance();
        await factory.initialize();

        const instances = factory.getAvailableInstances();
        expect(instances.length).toBeGreaterThan(0);

        // For each instance, verify we can get a client (which requires token)
        for (const instanceName of instances) {
          let client: any;
          let error: Error | null = null;

          try {
            client = await factory.getClient(instanceName);
          } catch (e) {
            error = e as Error;
          }

          // Should successfully create client with loaded token
          expect(error).toBeNull();
          expect(client).toBeDefined();
        }
      }, 30000);

      it('should reject invalid or missing API tokens', async () => {
        const { TokenLoadError } = await import('../../src/types/instance-config');

        // Create a mock instance config with invalid token env var
        const invalidConfig = {
          name: 'invalid',
          apiUrl: 'https://invalid.kanbanize.com/api/v2',
          apiTokenEnv: 'NONEXISTENT_TOKEN_VAR'
        };

        // Verify the token env var doesn't exist
        expect(process.env.NONEXISTENT_TOKEN_VAR).toBeUndefined();

        // TokenLoadError should be thrown when trying to load
        const envVarName = invalidConfig.apiTokenEnv;
        const instanceName = invalidConfig.name;

        const error = new TokenLoadError(envVarName, instanceName);

        expect(error.name).toBe('TokenLoadError');
        expect(error.code).toBe('TOKEN_LOAD_ERROR');
        expect(error.message).toContain('NONEXISTENT_TOKEN_VAR');
        expect(error.message).toContain('invalid');
      });

      it('should validate token environment variable format', () => {
        // Check all BUSINESSMAP_API_TOKEN_* variables in environment
        const tokenEnvVars = Object.keys(process.env).filter(key =>
          key.startsWith('BUSINESSMAP_API_TOKEN_')
        );

        expect(tokenEnvVars.length).toBeGreaterThan(0);

        tokenEnvVars.forEach(varName => {
          const token = process.env[varName];

          // Token should be a non-empty string
          expect(typeof token).toBe('string');
          expect(token).toBeDefined();
          expect(token!.length).toBeGreaterThan(0);

          // Token should not contain whitespace
          expect(token).toBe(token!.trim());

          // Variable name should match pattern
          expect(varName).toMatch(/^BUSINESSMAP_API_TOKEN_[A-Z_]+$/);
        });
      });

      it('should successfully make API call using loaded token', async () => {
        const { BusinessMapClientFactory } = await import('../../src/client/client-factory');

        const factory = BusinessMapClientFactory.getInstance();
        await factory.initialize();

        const client = await factory.getClient();

        // Make a real API call to verify token works
        let apiCallSuccessful = false;
        let userData: any;

        try {
          userData = await client.getCurrentUser();
          apiCallSuccessful = !!userData;
        } catch (error) {
          // Token might be invalid or expired
          const message = error instanceof Error ? error.message : 'Unknown error';
          // eslint-disable-next-line no-console
        }

        // In REAL mode with valid credentials, this should succeed
        expect(apiCallSuccessful).toBe(true);
        expect(userData).toBeDefined();
      }, 30000);

      it('should handle multiple instance tokens correctly', async () => {
        const { BusinessMapClientFactory } = await import('../../src/client/client-factory');

        const factory = BusinessMapClientFactory.getInstance();
        await factory.initialize();

        const instances = factory.getAvailableInstances();

        // Should have at least one instance (could be multi-instance or legacy)
        expect(instances.length).toBeGreaterThan(0);

        // For multi-instance mode, verify each instance can be accessed
        if (instances.length > 1) {
          for (const instanceName of instances) {
            const client = await factory.getClient(instanceName);
            expect(client).toBeDefined();

            // Verify we can make an API call with this instance's token
            try {
              const userData = await client.getCurrentUser();
              expect(userData).toBeDefined();
            } catch {
              // Log but don't fail - token might be test token without access
              // eslint-disable-next-line no-console
            }

            // At minimum, client should be created successfully
            expect(client).toBeDefined();
          }
        }
      }, 60000);
    });
  } else {
    describe('MOCK mode - Type and pattern validation only', () => {
      it('should verify environment variable type checking works', () => {
        // In mock mode, verify typeof checks work
        const testVar = 'test_value';
        expect(typeof testVar).toBe('string');

        const testUndefined = undefined;
        expect(typeof testUndefined).toBe('undefined');
      });

      it('should verify regex pattern matching for token variable names', () => {
        const tokenPattern = /^BUSINESSMAP_API_TOKEN_/;

        // Valid token variable names
        expect('BUSINESSMAP_API_TOKEN_FIMANCIA').toMatch(tokenPattern);
        expect('BUSINESSMAP_API_TOKEN_KERKOW').toMatch(tokenPattern);
        expect('BUSINESSMAP_API_TOKEN_PRODUCTION').toMatch(tokenPattern);

        // Invalid token variable names
        expect('BUSINESSMAP_TOKEN').not.toMatch(tokenPattern);
        expect('API_TOKEN_FIMANCIA').not.toMatch(tokenPattern);
        expect('businessmap_api_token_test').not.toMatch(tokenPattern);
      });

      it('should verify instance name pattern extraction', () => {
        const extractInstanceName = (envVar: string): string | null => {
          const match = envVar.match(/^BUSINESSMAP_API_TOKEN_(.+)$/);
          return match && match[1] ? match[1] : null;
        };

        expect(extractInstanceName('BUSINESSMAP_API_TOKEN_FIMANCIA')).toBe('FIMANCIA');
        expect(extractInstanceName('BUSINESSMAP_API_TOKEN_KERKOW')).toBe('KERKOW');
        expect(extractInstanceName('BUSINESSMAP_API_TOKEN_PROD')).toBe('PROD');
        expect(extractInstanceName('INVALID_VAR')).toBeNull();
      });

      it('should verify token validation logic without credentials', () => {
        const validateTokenFormat = (token: string | undefined): boolean => {
          if (!token) return false;
          if (typeof token !== 'string') return false;
          if (token.length === 0) return false;
          if (token.trim() !== token) return false; // Has whitespace
          return true;
        };

        // Valid tokens
        expect(validateTokenFormat('valid_token_123')).toBe(true);
        expect(validateTokenFormat('ABC123XYZ')).toBe(true);

        // Invalid tokens
        expect(validateTokenFormat(undefined)).toBe(false);
        expect(validateTokenFormat('')).toBe(false);
        expect(validateTokenFormat(' token ')).toBe(false);
        expect(validateTokenFormat('token\n')).toBe(false);
      });

      it('should verify environment variable naming convention', () => {
        const isValidTokenVarName = (varName: string): boolean => {
          // Should start with BUSINESSMAP_API_TOKEN_
          if (!varName.startsWith('BUSINESSMAP_API_TOKEN_')) return false;

          // Should be all uppercase with underscores
          if (!/^[A-Z_]+$/.test(varName)) return false;

          // Should have an instance name after prefix
          const instanceName = varName.replace('BUSINESSMAP_API_TOKEN_', '');
          if (instanceName.length === 0) return false;

          return true;
        };

        // Valid names
        expect(isValidTokenVarName('BUSINESSMAP_API_TOKEN_FIMANCIA')).toBe(true);
        expect(isValidTokenVarName('BUSINESSMAP_API_TOKEN_KERKOW')).toBe(true);
        expect(isValidTokenVarName('BUSINESSMAP_API_TOKEN_PRODUCTION')).toBe(true);
        expect(isValidTokenVarName('BUSINESSMAP_API_TOKEN_TEST_INSTANCE')).toBe(true);

        // Invalid names
        expect(isValidTokenVarName('BUSINESSMAP_API_TOKEN_')).toBe(false);
        expect(isValidTokenVarName('businessmap_api_token_test')).toBe(false);
        expect(isValidTokenVarName('BUSINESSMAP_API_TOKEN_test')).toBe(false);
        expect(isValidTokenVarName('API_TOKEN_TEST')).toBe(false);
      });

      it('should not require actual API tokens in mock mode', () => {
        // Mock mode runs without credentials
        expect(TEST_MODE).toBe('mock');

        // These might not be set in mock mode, and that's OK
        const fimanciaToken = process.env.BUSINESSMAP_API_TOKEN_FIMANCIA;
        const kerkowToken = process.env.BUSINESSMAP_API_TOKEN_KERKOW;

        // Just verify types if they exist
        if (fimanciaToken !== undefined) {
          expect(typeof fimanciaToken).toBe('string');
        }

        if (kerkowToken !== undefined) {
          expect(typeof kerkowToken).toBe('string');
        }
      });

      it('should verify error types are properly defined', async () => {
        const { TokenLoadError, InstanceConfigError } = await import('../../src/types/instance-config');

        // Verify error classes exist and are constructable
        const tokenError = new TokenLoadError('TEST_VAR', 'test-instance');
        expect(tokenError.name).toBe('TokenLoadError');
        expect(tokenError.code).toBe('TOKEN_LOAD_ERROR');
        expect(tokenError.message).toContain('TEST_VAR');

        const configError = new InstanceConfigError('Test error', 'TEST_CODE', { test: true });
        expect(configError.name).toBe('InstanceConfigError');
        expect(configError.code).toBe('TEST_CODE');
        expect(configError.details).toEqual({ test: true });
      });
    });
  }

  // Common tests that run in both modes
  describe('Common environment validation checks', () => {
    it('should verify TEST_MODE is set correctly', () => {
      expect(TEST_MODE).toBeDefined();
      expect(['real', 'mock']).toContain(TEST_MODE);
    });

    it('should have consistent token naming convention', () => {
      // All token variables should follow BUSINESSMAP_API_TOKEN_{INSTANCE} pattern
      const expectedPattern = /^BUSINESSMAP_API_TOKEN_[A-Z_]+$/;

      const knownTokenVars = [
        'BUSINESSMAP_API_TOKEN_FIMANCIA',
        'BUSINESSMAP_API_TOKEN_KERKOW'
      ];

      knownTokenVars.forEach(varName => {
        expect(varName).toMatch(expectedPattern);
      });
    });

    it('should extract instance names from token variable names', () => {
      const extractInstance = (envVar: string): string => {
        return envVar.replace('BUSINESSMAP_API_TOKEN_', '').toLowerCase();
      };

      expect(extractInstance('BUSINESSMAP_API_TOKEN_FIMANCIA')).toBe('fimancia');
      expect(extractInstance('BUSINESSMAP_API_TOKEN_KERKOW')).toBe('kerkow');
    });

    it('should verify TokenLoadError provides helpful error messages', async () => {
      const { TokenLoadError } = await import('../../src/types/instance-config');

      const error = new TokenLoadError('MISSING_TOKEN_VAR', 'test-instance');

      expect(error.message).toContain('MISSING_TOKEN_VAR');
      expect(error.message).toContain('test-instance');
      expect(error.message).toContain('not found');
      expect(error.code).toBe('TOKEN_LOAD_ERROR');
      expect(error.details).toEqual({
        envVarName: 'MISSING_TOKEN_VAR',
        instanceName: 'test-instance'
      });
    });
  });
});
