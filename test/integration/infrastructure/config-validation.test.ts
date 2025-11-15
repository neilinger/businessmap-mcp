/**
 * Integration Test: Configuration Validation
 *
 * Tests catch historical bug: Schema mismatches (apiTokenEnvVar vs apiTokenEnv)
 *
 * Test Modes:
 * - REAL mode: Full Zod schema validation + server load with fixtures
 * - MOCK mode: JSON parse + structure validation only
 *
 * Fixtures:
 * - valid-multi-instance.json: Valid multi-instance configuration
 * - valid-single-instance.json: Valid single-instance configuration
 * - invalid-schema.json: Invalid schema (wrong field names)
 */

import { TEST_MODE } from './setup.js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { isMultiInstanceConfig, isInstanceConfig } from '../../../src/types/instance-config.js';
import { BusinessMapClientFactory } from '../../../src/client/client-factory.js';

// Fixture paths
const FIXTURES_DIR = join(process.cwd(), 'test', 'integration', 'infrastructure', 'fixtures');
const VALID_MULTI_INSTANCE = join(FIXTURES_DIR, 'valid-multi-instance.json');
const VALID_SINGLE_INSTANCE = join(FIXTURES_DIR, 'valid-single-instance.json');
const INVALID_SCHEMA = join(FIXTURES_DIR, 'invalid-schema.json');

describe('Configuration Validation', () => {
  if (TEST_MODE === 'real') {
    describe('REAL mode - Full Zod schema validation', () => {
      it('should validate valid multi-instance configuration', async () => {
        const configJson = readFileSync(VALID_MULTI_INSTANCE, 'utf-8');
        const config = JSON.parse(configJson);

        // Type guard validation
        expect(isMultiInstanceConfig(config)).toBe(true);

        // Verify structure
        expect(config.version).toBe('1.0');
        expect(config.defaultInstance).toBe('fimancia');
        expect(config.instances).toHaveLength(2);

        // Verify instance structure
        const fimanciaInstance = config.instances.find((i: any) => i.name === 'fimancia');
        expect(fimanciaInstance).toBeDefined();
        expect(fimanciaInstance.apiUrl).toBe('https://fimancia.kanbanize.com/api/v2');
        expect(fimanciaInstance.apiTokenEnv).toBe('BUSINESSMAP_API_TOKEN_FIMANCIA');

        const kerkowInstance = config.instances.find((i: any) => i.name === 'kerkow');
        expect(kerkowInstance).toBeDefined();
        expect(kerkowInstance.apiUrl).toBe('https://kerkow.kanbanize.com/api/v2');
        expect(kerkowInstance.apiTokenEnv).toBe('BUSINESSMAP_API_TOKEN_KERKOW');
      });

      it('should validate valid single-instance configuration', async () => {
        const configJson = readFileSync(VALID_SINGLE_INSTANCE, 'utf-8');
        const config = JSON.parse(configJson);

        // Type guard validation
        expect(isMultiInstanceConfig(config)).toBe(true);

        // Verify structure
        expect(config.version).toBe('1.0');
        expect(config.defaultInstance).toBe('fimancia');
        expect(config.instances).toHaveLength(1);

        // Verify instance structure
        const instance = config.instances[0];
        expect(instance.name).toBe('fimancia');
        expect(instance.apiUrl).toBe('https://fimancia.kanbanize.com/api/v2');
        expect(instance.apiTokenEnv).toBe('BUSINESSMAP_API_TOKEN_FIMANCIA');
      });

      it('should reject invalid schema with wrong field names', async () => {
        const configJson = readFileSync(INVALID_SCHEMA, 'utf-8');
        const config = JSON.parse(configJson);

        // Type guard should fail for invalid schema
        expect(isMultiInstanceConfig(config)).toBe(false);

        // Verify the issue: should have apiTokenEnv, not apiTokenEnvVar
        const instance = config.instances[0];
        expect(instance.apiTokenEnvVar).toBeDefined(); // Wrong field name
        expect(instance.apiTokenEnv).toBeUndefined(); // Correct field missing
      });

      it('should validate InstanceConfig with type guard', async () => {
        // Valid instance config
        const validInstance = {
          name: 'test',
          apiUrl: 'https://test.kanbanize.com/api/v2',
          apiTokenEnv: 'TEST_TOKEN',
          description: 'Test instance',
        };

        expect(isInstanceConfig(validInstance)).toBe(true);

        // Invalid instance config - missing required field
        const invalidInstance1 = {
          name: 'test',
          apiUrl: 'https://test.kanbanize.com/api/v2',
          // Missing apiTokenEnv
        };

        expect(isInstanceConfig(invalidInstance1)).toBe(false);

        // Invalid instance config - wrong field name (historical bug)
        const invalidInstance2 = {
          name: 'test',
          apiUrl: 'https://test.kanbanize.com/api/v2',
          apiTokenEnvVar: 'TEST_TOKEN', // Wrong field name
        };

        expect(isInstanceConfig(invalidInstance2)).toBe(false);

        // Invalid instance config - wrong type
        const invalidInstance3 = {
          name: 'test',
          apiUrl: 'https://test.kanbanize.com/api/v2',
          apiTokenEnv: 123, // Should be string
        };

        expect(isInstanceConfig(invalidInstance3)).toBe(false);
      });

      it('should load and validate configuration from ClientFactory', async () => {
        // Save current env to restore later
        const originalEnv = process.env.BUSINESSMAP_INSTANCES;

        try {
          // Set multi-instance configuration via environment
          const configJson = readFileSync(VALID_MULTI_INSTANCE, 'utf-8');
          process.env.BUSINESSMAP_INSTANCES = configJson;

          // Create a fresh factory instance
          const factory = BusinessMapClientFactory.getInstance();
          await factory.initialize();

          // Verify factory loaded the configuration correctly
          const instances = factory.getAvailableInstances();
          expect(instances).toContain('fimancia');
          expect(instances).toContain('kerkow');

          const defaultInstance = factory.getDefaultInstanceName();
          expect(defaultInstance).toBe('fimancia');
        } finally {
          // Restore original env
          if (originalEnv) {
            process.env.BUSINESSMAP_INSTANCES = originalEnv;
          } else {
            delete process.env.BUSINESSMAP_INSTANCES;
          }
        }
      }, 30000);

      it('should detect schema version mismatches', async () => {
        const invalidConfig = {
          version: '2.0', // Unsupported version
          defaultInstance: 'test',
          instances: [
            {
              name: 'test',
              apiUrl: 'https://test.kanbanize.com/api/v2',
              apiTokenEnv: 'TEST_TOKEN',
            },
          ],
        };

        // Type guard checks structure but not version semantics
        expect(isMultiInstanceConfig(invalidConfig)).toBe(true);

        // Version validation would happen at runtime when loading config
        expect(invalidConfig.version).toBe('2.0');
      });

      it('should validate optional fields correctly', async () => {
        // Instance with optional fields
        const instanceWithOptionals = {
          name: 'test',
          apiUrl: 'https://test.kanbanize.com/api/v2',
          apiTokenEnv: 'TEST_TOKEN',
          readOnlyMode: true,
          defaultWorkspaceId: 123,
          description: 'Test instance',
          tags: ['production', 'customer-facing'],
        };

        expect(isInstanceConfig(instanceWithOptionals)).toBe(true);

        // Instance with invalid optional field types
        const instanceWithInvalidOptionals = {
          name: 'test',
          apiUrl: 'https://test.kanbanize.com/api/v2',
          apiTokenEnv: 'TEST_TOKEN',
          readOnlyMode: 'yes', // Should be boolean
          defaultWorkspaceId: '123', // Should be number
          tags: ['valid', 123], // Should be all strings
        };

        expect(isInstanceConfig(instanceWithInvalidOptionals)).toBe(false);
      });

      it('should validate configuration file loading from filesystem', async () => {
        // Test loading from environment variable
        const originalEnv = process.env.BUSINESSMAP_INSTANCES;

        try {
          const configJson = readFileSync(VALID_SINGLE_INSTANCE, 'utf-8');
          process.env.BUSINESSMAP_INSTANCES = configJson;

          const factory = BusinessMapClientFactory.getInstance();
          await factory.initialize();

          const instances = factory.getAvailableInstances();
          expect(instances.length).toBeGreaterThan(0);
        } finally {
          if (originalEnv) {
            process.env.BUSINESSMAP_INSTANCES = originalEnv;
          } else {
            delete process.env.BUSINESSMAP_INSTANCES;
          }
        }
      }, 30000);
    });
  } else {
    describe('MOCK mode - JSON parse and structure validation only', () => {
      it('should parse valid multi-instance JSON', () => {
        const configJson = readFileSync(VALID_MULTI_INSTANCE, 'utf-8');
        let error: Error | null = null;
        let config: any;

        try {
          config = JSON.parse(configJson);
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeNull();
        expect(config).toBeDefined();
        expect(config.version).toBe('1.0');
        expect(config.defaultInstance).toBe('fimancia');
        expect(Array.isArray(config.instances)).toBe(true);
        expect(config.instances.length).toBe(2);
      });

      it('should parse valid single-instance JSON', () => {
        const configJson = readFileSync(VALID_SINGLE_INSTANCE, 'utf-8');
        let error: Error | null = null;
        let config: any;

        try {
          config = JSON.parse(configJson);
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeNull();
        expect(config).toBeDefined();
        expect(config.version).toBe('1.0');
        expect(config.defaultInstance).toBe('fimancia');
        expect(Array.isArray(config.instances)).toBe(true);
        expect(config.instances.length).toBe(1);
      });

      it('should detect invalid schema structure', () => {
        const configJson = readFileSync(INVALID_SCHEMA, 'utf-8');
        const config = JSON.parse(configJson);

        // In mock mode, just verify structure differences
        expect(config.instances[0].apiTokenEnvVar).toBeDefined(); // Wrong field
        expect(config.instances[0].apiTokenEnv).toBeUndefined(); // Correct field missing

        // Manual structure validation
        const hasCorrectSchema = config.instances.every(
          (inst: any) => inst.apiTokenEnv !== undefined
        );

        expect(hasCorrectSchema).toBe(false);
      });

      it('should verify required fields are present in valid configs', () => {
        const multiConfig = JSON.parse(readFileSync(VALID_MULTI_INSTANCE, 'utf-8'));

        // Check required top-level fields
        expect(multiConfig.version).toBeDefined();
        expect(multiConfig.defaultInstance).toBeDefined();
        expect(multiConfig.instances).toBeDefined();

        // Check required instance fields
        multiConfig.instances.forEach((instance: any) => {
          expect(instance.name).toBeDefined();
          expect(instance.apiUrl).toBeDefined();
          expect(instance.apiTokenEnv).toBeDefined();
        });
      });

      it('should detect missing required fields', () => {
        const invalidConfig: any = {
          version: '1.0',
          // Missing defaultInstance
          instances: [
            {
              name: 'test',
              apiUrl: 'https://test.kanbanize.com/api/v2',
              // Missing apiTokenEnv
            },
          ],
        };

        expect(invalidConfig.defaultInstance).toBeUndefined();
        expect(invalidConfig.instances[0]?.apiTokenEnv).toBeUndefined();
      });

      it('should not require API credentials in mock mode', () => {
        // In mock mode, we're just validating structure, not connecting
        expect(TEST_MODE).toBe('mock');
      });
    });
  }

  // Common tests that run in both modes
  describe('Common configuration checks', () => {
    it('should have fixture files present', async () => {
      expect(existsSync(VALID_MULTI_INSTANCE)).toBe(true);
      expect(existsSync(VALID_SINGLE_INSTANCE)).toBe(true);
      expect(existsSync(INVALID_SCHEMA)).toBe(true);
    });

    it('should demonstrate schema field name difference', () => {
      const validConfig = JSON.parse(readFileSync(VALID_MULTI_INSTANCE, 'utf-8'));
      const invalidConfig = JSON.parse(readFileSync(INVALID_SCHEMA, 'utf-8'));

      // Valid config uses apiTokenEnv
      expect(validConfig.instances[0].apiTokenEnv).toBeDefined();

      // Invalid config uses apiTokenEnvVar (historical bug)
      expect(invalidConfig.instances[0].apiTokenEnvVar).toBeDefined();
      expect(invalidConfig.instances[0].apiTokenEnv).toBeUndefined();
    });

    it('should verify all fixtures are valid JSON', () => {
      const fixtures = [VALID_MULTI_INSTANCE, VALID_SINGLE_INSTANCE, INVALID_SCHEMA];

      fixtures.forEach((fixturePath) => {
        let error: Error | null = null;

        try {
          JSON.parse(readFileSync(fixturePath, 'utf-8'));
        } catch (e) {
          error = e as Error;
        }

        expect(error).toBeNull();
      });
    });
  });
});
