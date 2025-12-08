/**
 * Integration Test: Profile-Based Tool Registration
 *
 * Tests for Token Optimization Phase 2 - Profile-based tool registration
 * Spec: 003-schema-compression-lazy-loading
 *
 * Test Cases:
 * - T043: Test minimal profile registration (10 tools)
 * - T044: Test standard profile registration (29 tools, default)
 * - T045: Test full profile registration (61 tools)
 * - T046: Test invalid profile error handling
 */

import { TEST_MODE } from './infrastructure/setup.js';
import { BusinessMapMcpServer } from '../../src/server/mcp-server.js';
import { getToolProfile, PROFILE_METADATA } from '../../src/config/tool-profiles.js';

describe('Profile-Based Tool Registration', () => {
  let originalProfile: string | undefined;

  beforeEach(() => {
    // Save original profile setting
    originalProfile = process.env.BUSINESSMAP_TOOL_PROFILE;
  });

  afterEach(() => {
    // Restore original profile setting
    if (originalProfile === undefined) {
      delete process.env.BUSINESSMAP_TOOL_PROFILE;
    } else {
      process.env.BUSINESSMAP_TOOL_PROFILE = originalProfile;
    }
  });

  /**
   * Helper: Get registered tool names from server
   * Accesses internal _registeredTools object since MCP SDK doesn't expose listTools() in test context
   */
  function getRegisteredTools(server: BusinessMapMcpServer): string[] {
    const mcpServer = server.server as any;
    if (!mcpServer._registeredTools) {
      return [];
    }
    return Object.keys(mcpServer._registeredTools);
  }

  if (TEST_MODE === 'real') {
    describe('REAL mode - Full profile testing with API', () => {
      /**
       * T043: Test minimal profile registration
       */
      it('should register minimal profile tools correctly', async () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'minimal';

        const server = new BusinessMapMcpServer();
        await server.initialize();

        const tools = getRegisteredTools(server);

        expect(tools.length).toBe(PROFILE_METADATA.minimal.toolCount);

        // Verify core minimal tools are present
        expect(tools).toContain('list_boards');
        expect(tools).toContain('list_cards');
        expect(tools).toContain('list_workspaces');
        expect(tools).toContain('get_workspace');
        expect(tools).toContain('get_card');
        expect(tools).toContain('create_card');
        expect(tools).toContain('update_card');
        expect(tools).toContain('move_card');
        expect(tools).toContain('search_board');
        expect(tools).toContain('health_check');
        expect(tools).toContain('list_instances');

        // Verify standard-only tools are absent
        expect(tools).not.toContain('create_board');
        expect(tools).not.toContain('list_custom_fields');
        expect(tools).not.toContain('get_card_parents');

        // Verify full-only tools are absent
        expect(tools).not.toContain('bulk_delete_cards');
        expect(tools).not.toContain('get_card_history');
        expect(tools).not.toContain('bulk_delete_boards');
      }, 30000);

      /**
       * T044: Test standard profile registration
       */
      it('should register standard profile tools correctly', async () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'standard';

        const server = new BusinessMapMcpServer();
        await server.initialize();

        const tools = getRegisteredTools(server);

        expect(tools.length).toBe(PROFILE_METADATA.standard.toolCount);

        // Verify all minimal tools are present
        expect(tools).toContain('list_boards');
        expect(tools).toContain('get_card');
        expect(tools).toContain('create_card');
        expect(tools).toContain('health_check');

        // Verify standard-specific tools are present
        expect(tools).toContain('create_board');
        expect(tools).toContain('update_board');
        expect(tools).toContain('list_custom_fields');
        expect(tools).toContain('get_custom_field');
        expect(tools).toContain('get_card_parents');
        expect(tools).toContain('get_card_children');
        expect(tools).toContain('add_card_parent');
        expect(tools).toContain('list_users');

        // Verify full-only tools are absent
        expect(tools).not.toContain('bulk_delete_cards');
        expect(tools).not.toContain('bulk_delete_boards');
        expect(tools).not.toContain('get_card_history');
        expect(tools).not.toContain('create_custom_field');
      }, 30000);

      /**
       * T044b: Test standard profile is the default
       */
      it('should use standard profile as default when BUSINESSMAP_TOOL_PROFILE is not set', async () => {
        delete process.env.BUSINESSMAP_TOOL_PROFILE;

        const server = new BusinessMapMcpServer();
        await server.initialize();

        const tools = getRegisteredTools(server);

        expect(tools.length).toBe(PROFILE_METADATA.standard.toolCount);

        // Verify it behaves like standard profile
        expect(tools).toContain('create_board');
        expect(tools).toContain('list_custom_fields');
        expect(tools).not.toContain('bulk_delete_cards');
      }, 30000);

      /**
       * T045: Test full profile registration
       */
      it('should register full profile tools correctly', async () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'full';

        const server = new BusinessMapMcpServer();
        await server.initialize();

        const tools = getRegisteredTools(server);

        expect(tools.length).toBe(PROFILE_METADATA.full.toolCount);

        // Verify all minimal tools are present
        expect(tools).toContain('list_boards');
        expect(tools).toContain('create_card');

        // Verify all standard tools are present
        expect(tools).toContain('create_board');
        expect(tools).toContain('list_custom_fields');

        // Verify full-specific tools are present
        expect(tools).toContain('bulk_delete_cards');
        expect(tools).toContain('bulk_delete_boards');
        expect(tools).toContain('bulk_update_cards');
        expect(tools).toContain('bulk_update_boards');
        expect(tools).toContain('get_card_history');
        expect(tools).toContain('get_card_outcomes');
        expect(tools).toContain('create_custom_field');
        expect(tools).toContain('update_custom_field');
        expect(tools).toContain('delete_custom_field');
        expect(tools).toContain('get_workflow_cycle_time_columns');
      }, 30000);

      /**
       * T046: Test invalid profile error handling
       *
       * NOTE: Server currently catches invalid profile errors and falls back to 'full' profile
       * This is error-tolerant behavior. getToolProfile() itself throws, but server catches it.
       */
      it('should fallback to full profile for invalid profile value', async () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'invalid';

        const server = new BusinessMapMcpServer();

        // Server should not throw - it falls back to full profile
        await expect(server.initialize()).resolves.not.toThrow();

        const tools = getRegisteredTools(server);

        expect(tools.length).toBe(PROFILE_METADATA.full.toolCount);

        // Verify it has full profile tools
        expect(tools).toContain('bulk_delete_cards');
        expect(tools).toContain('get_card_history');
      }, 30000);

      /**
       * T046b: Test error message includes valid profiles
       */
      it('should include valid profile options in error message', () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'wrong';

        expect(() => getToolProfile()).toThrow(/minimal.*standard.*full/);
      });
    });
  } else {
    describe('MOCK mode - Profile validation without API', () => {
      /**
       * T043 (Mock): Verify minimal profile configuration
       */
      it('should validate minimal profile has 12 tools configured', () => {
        const metadata = PROFILE_METADATA.minimal;
        expect(metadata.toolCount).toBe(12);
        expect(metadata.name).toBe('Minimal');
      });

      /**
       * T044 (Mock): Verify standard profile configuration
       */
      it('should validate standard profile has 31 tools configured', () => {
        const metadata = PROFILE_METADATA.standard;
        expect(metadata.toolCount).toBe(31);
        expect(metadata.name).toBe('Standard');
      });

      /**
       * T044b (Mock): Verify standard is default profile
       */
      it('should return standard profile when BUSINESSMAP_TOOL_PROFILE is not set', () => {
        delete process.env.BUSINESSMAP_TOOL_PROFILE;
        const profile = getToolProfile();
        expect(profile).toBe('standard');
      });

      /**
       * T045 (Mock): Verify full profile configuration
       */
      it('should validate full profile has 63 tools configured', () => {
        const metadata = PROFILE_METADATA.full;
        expect(metadata.toolCount).toBe(63);
        expect(metadata.name).toBe('Full');
      });

      /**
       * T046 (Mock): Verify invalid profile throws error
       */
      it('should throw error for invalid profile value', () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'invalid';
        expect(() => getToolProfile()).toThrow(/Invalid BUSINESSMAP_TOOL_PROFILE.*invalid/);
      });

      /**
       * T046b (Mock): Verify error lists valid profiles
       */
      it('should list valid profiles in error message', () => {
        process.env.BUSINESSMAP_TOOL_PROFILE = 'bad_profile';
        expect(() => getToolProfile()).toThrow(/minimal.*standard.*full/);
      });
    });
  }

  // Common tests that run in both REAL and MOCK modes
  describe('Common profile validation', () => {
    it('should accept minimal as valid profile', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'minimal';
      expect(() => getToolProfile()).not.toThrow();
      expect(getToolProfile()).toBe('minimal');
    });

    it('should accept standard as valid profile', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'standard';
      expect(() => getToolProfile()).not.toThrow();
      expect(getToolProfile()).toBe('standard');
    });

    it('should accept full as valid profile', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'full';
      expect(() => getToolProfile()).not.toThrow();
      expect(getToolProfile()).toBe('full');
    });

    it('should have correct tool count metadata', () => {
      expect(PROFILE_METADATA.minimal.toolCount).toBe(12);
      expect(PROFILE_METADATA.standard.toolCount).toBe(31);
      expect(PROFILE_METADATA.full.toolCount).toBe(63);
    });

    it('should have estimated token counts for each profile', () => {
      expect(PROFILE_METADATA.minimal.estimatedTokens).toBe(12 * 50);
      expect(PROFILE_METADATA.standard.estimatedTokens).toBe(31 * 50);
      expect(PROFILE_METADATA.full.estimatedTokens).toBe(63 * 50);
    });
  });
});
