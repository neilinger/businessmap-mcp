/**
 * Unit tests for tool-profiles.ts
 *
 * Tests profile-based tool registration system including:
 * - Profile selection from environment variables
 * - Tool listing for each profile
 * - Profile membership checks
 * - Minimum profile detection
 * - Error handling for invalid profiles
 *
 * Target: ≥95% coverage for tool-profiles.ts
 */

import {
  getToolProfile,
  getToolsForProfile,
  isToolInProfile,
  getMinimumProfileForTool,
  MINIMAL_PROFILE,
  STANDARD_PROFILE,
  FULL_PROFILE,
  TOOL_PROFILES,
  PROFILE_METADATA,
  type ToolProfile,
} from '../../src/config/tool-profiles';

describe('tool-profiles', () => {
  // Store original env var to restore after tests
  const originalEnv = process.env.BUSINESSMAP_TOOL_PROFILE;

  afterEach(() => {
    // Restore original env var after each test
    if (originalEnv !== undefined) {
      process.env.BUSINESSMAP_TOOL_PROFILE = originalEnv;
    } else {
      delete process.env.BUSINESSMAP_TOOL_PROFILE;
    }
  });

  describe('PROFILE CONSTANTS', () => {
    test('MINIMAL_PROFILE has expected tool count', () => {
      expect(MINIMAL_PROFILE).toHaveLength(10);
    });

    test('MINIMAL_PROFILE includes core tools', () => {
      const expectedTools = [
        'list_boards',
        'list_cards',
        'list_workspaces',
        'get_card',
        'get_workspace',
        'create_card',
        'update_card',
        'move_card',
        'search_board',
        'health_check',
      ];

      expectedTools.forEach((tool) => {
        expect(MINIMAL_PROFILE).toContain(tool);
      });
    });

    test('STANDARD_PROFILE extends MINIMAL_PROFILE', () => {
      MINIMAL_PROFILE.forEach((tool) => {
        expect(STANDARD_PROFILE).toContain(tool);
      });
    });

    test('STANDARD_PROFILE has expected minimum count', () => {
      // Should have minimal tools (10) plus additional standard tools
      expect(STANDARD_PROFILE.length).toBeGreaterThanOrEqual(20);
    });

    test('FULL_PROFILE extends STANDARD_PROFILE', () => {
      STANDARD_PROFILE.forEach((tool) => {
        expect(FULL_PROFILE).toContain(tool);
      });
    });

    test('FULL_PROFILE has expected minimum count', () => {
      // Should have all tools (based on current implementation: 58+ tools)
      expect(FULL_PROFILE.length).toBeGreaterThanOrEqual(50);
    });

    test('TOOL_PROFILES map includes all three profiles', () => {
      expect(TOOL_PROFILES).toHaveProperty('minimal');
      expect(TOOL_PROFILES).toHaveProperty('standard');
      expect(TOOL_PROFILES).toHaveProperty('full');
    });

    test('TOOL_PROFILES map references correct arrays', () => {
      expect(TOOL_PROFILES.minimal).toBe(MINIMAL_PROFILE);
      expect(TOOL_PROFILES.standard).toBe(STANDARD_PROFILE);
      expect(TOOL_PROFILES.full).toBe(FULL_PROFILE);
    });
  });

  describe('getToolProfile', () => {
    test('returns "minimal" when BUSINESSMAP_TOOL_PROFILE=minimal', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'minimal';
      expect(getToolProfile()).toBe('minimal');
    });

    test('returns "standard" when BUSINESSMAP_TOOL_PROFILE=standard', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'standard';
      expect(getToolProfile()).toBe('standard');
    });

    test('returns "full" when BUSINESSMAP_TOOL_PROFILE=full', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'full';
      expect(getToolProfile()).toBe('full');
    });

    test('returns "standard" as default when env var not set', () => {
      delete process.env.BUSINESSMAP_TOOL_PROFILE;
      expect(getToolProfile()).toBe('standard');
    });

    test('returns "standard" when env var is empty string', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = '';
      expect(getToolProfile()).toBe('standard');
    });

    test('throws error for invalid profile value "invalid"', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'invalid';

      expect(() => getToolProfile()).toThrow(/Invalid BUSINESSMAP_TOOL_PROFILE: 'invalid'/);
      expect(() => getToolProfile()).toThrow(/Must be one of: minimal, standard, full/);
    });

    test('throws error for invalid profile value "custom"', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'custom';

      expect(() => getToolProfile()).toThrow('Invalid BUSINESSMAP_TOOL_PROFILE');
    });

    test('throws error for invalid profile value "MINIMAL" (case sensitive)', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'MINIMAL';

      expect(() => getToolProfile()).toThrow('Invalid BUSINESSMAP_TOOL_PROFILE');
    });

    test('error message includes valid profile options', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'wrong';

      try {
        getToolProfile();
        fail('Should have thrown error');
      } catch (error) {
        expect((error as Error).message).toContain('minimal');
        expect((error as Error).message).toContain('standard');
        expect((error as Error).message).toContain('full');
      }
    });
  });

  describe('getToolsForProfile', () => {
    test('returns minimal tools array for "minimal" profile', () => {
      const tools = getToolsForProfile('minimal');
      expect(tools).toEqual(MINIMAL_PROFILE);
      expect(tools).toHaveLength(10);
    });

    test('returns standard tools array for "standard" profile', () => {
      const tools = getToolsForProfile('standard');
      expect(tools).toEqual(STANDARD_PROFILE);
      expect(tools.length).toBeGreaterThanOrEqual(20);
    });

    test('returns full tools array for "full" profile', () => {
      const tools = getToolsForProfile('full');
      expect(tools).toEqual(FULL_PROFILE);
      expect(tools.length).toBeGreaterThanOrEqual(50);
    });

    test('minimal tools are subset of standard tools', () => {
      const minimal = getToolsForProfile('minimal');
      const standard = getToolsForProfile('standard');

      minimal.forEach((tool) => {
        expect(standard).toContain(tool);
      });
    });

    test('standard tools are subset of full tools', () => {
      const standard = getToolsForProfile('standard');
      const full = getToolsForProfile('full');

      standard.forEach((tool) => {
        expect(full).toContain(tool);
      });
    });

    test('returns reference to actual profile array (not copy)', () => {
      const tools = getToolsForProfile('minimal');
      expect(tools).toBe(MINIMAL_PROFILE);
    });
  });

  describe('isToolInProfile', () => {
    test('returns true for "list_boards" in minimal profile', () => {
      expect(isToolInProfile('list_boards', 'minimal')).toBe(true);
    });

    test('returns true for "create_card" in minimal profile', () => {
      expect(isToolInProfile('create_card', 'minimal')).toBe(true);
    });

    test('returns true for "health_check" in minimal profile', () => {
      expect(isToolInProfile('health_check', 'minimal')).toBe(true);
    });

    test('returns false for "bulk_delete_cards" in minimal profile', () => {
      expect(isToolInProfile('bulk_delete_cards', 'minimal')).toBe(false);
    });

    test('returns false for "create_custom_field" in minimal profile', () => {
      expect(isToolInProfile('create_custom_field', 'minimal')).toBe(false);
    });

    test('returns true for minimal tools in standard profile', () => {
      MINIMAL_PROFILE.forEach((tool) => {
        expect(isToolInProfile(tool, 'standard')).toBe(true);
      });
    });

    test('returns true for "create_board" in standard profile', () => {
      expect(isToolInProfile('create_board', 'standard')).toBe(true);
    });

    test('returns false for "bulk_delete_cards" in standard profile', () => {
      expect(isToolInProfile('bulk_delete_cards', 'standard')).toBe(false);
    });

    test('returns true for all standard tools in full profile', () => {
      STANDARD_PROFILE.forEach((tool) => {
        expect(isToolInProfile(tool, 'full')).toBe(true);
      });
    });

    test('returns true for "bulk_delete_cards" in full profile', () => {
      expect(isToolInProfile('bulk_delete_cards', 'full')).toBe(true);
    });

    test('returns true for "bulk_update_workspaces" in full profile', () => {
      expect(isToolInProfile('bulk_update_workspaces', 'full')).toBe(true);
    });

    test('returns false for non-existent tool in any profile', () => {
      expect(isToolInProfile('non_existent_tool', 'minimal')).toBe(false);
      expect(isToolInProfile('non_existent_tool', 'standard')).toBe(false);
      expect(isToolInProfile('non_existent_tool', 'full')).toBe(false);
    });

    test('returns false for empty string tool name', () => {
      expect(isToolInProfile('', 'minimal')).toBe(false);
    });
  });

  describe('getMinimumProfileForTool', () => {
    test('returns "minimal" for tools in minimal profile', () => {
      expect(getMinimumProfileForTool('list_boards')).toBe('minimal');
      expect(getMinimumProfileForTool('create_card')).toBe('minimal');
      expect(getMinimumProfileForTool('health_check')).toBe('minimal');
    });

    test('returns "standard" for tools only in standard profile', () => {
      expect(getMinimumProfileForTool('create_board')).toBe('standard');
      expect(getMinimumProfileForTool('list_custom_fields')).toBe('standard');
    });

    test('returns "full" for tools only in full profile', () => {
      expect(getMinimumProfileForTool('bulk_delete_cards')).toBe('full');
      expect(getMinimumProfileForTool('bulk_update_workspaces')).toBe('full');
      expect(getMinimumProfileForTool('create_custom_field')).toBe('full');
    });

    test('returns null for non-existent tool', () => {
      expect(getMinimumProfileForTool('non_existent_tool')).toBeNull();
    });

    test('returns null for empty string', () => {
      expect(getMinimumProfileForTool('')).toBeNull();
    });

    test('returns "minimal" for all minimal profile tools', () => {
      MINIMAL_PROFILE.forEach((tool) => {
        expect(getMinimumProfileForTool(tool)).toBe('minimal');
      });
    });

    test('checks profiles in order: minimal → standard → full', () => {
      // Tools in minimal should be detected as minimal even though they're in standard/full
      const minimalTool = MINIMAL_PROFILE[0];
      if (minimalTool) {
        expect(getMinimumProfileForTool(minimalTool)).toBe('minimal');
      }

      // Tools only in standard should be detected as standard even though they're in full
      const standardOnlyTools = STANDARD_PROFILE.filter((tool) => !MINIMAL_PROFILE.includes(tool));
      if (standardOnlyTools.length > 0 && standardOnlyTools[0]) {
        expect(getMinimumProfileForTool(standardOnlyTools[0])).toBe('standard');
      }
    });
  });

  describe('PROFILE_METADATA', () => {
    test('includes metadata for all three profiles', () => {
      expect(PROFILE_METADATA).toHaveProperty('minimal');
      expect(PROFILE_METADATA).toHaveProperty('standard');
      expect(PROFILE_METADATA).toHaveProperty('full');
    });

    test('minimal metadata has correct structure', () => {
      const metadata = PROFILE_METADATA.minimal;

      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('toolCount');
      expect(metadata).toHaveProperty('estimatedTokens');
      expect(metadata).toHaveProperty('useCase');

      expect(typeof metadata.name).toBe('string');
      expect(typeof metadata.description).toBe('string');
      expect(typeof metadata.toolCount).toBe('number');
      expect(typeof metadata.estimatedTokens).toBe('number');
      expect(typeof metadata.useCase).toBe('string');
    });

    test('standard metadata has correct structure', () => {
      const metadata = PROFILE_METADATA.standard;

      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('toolCount');
      expect(metadata).toHaveProperty('estimatedTokens');
      expect(metadata).toHaveProperty('useCase');
    });

    test('full metadata has correct structure', () => {
      const metadata = PROFILE_METADATA.full;

      expect(metadata).toHaveProperty('name');
      expect(metadata).toHaveProperty('description');
      expect(metadata).toHaveProperty('toolCount');
      expect(metadata).toHaveProperty('estimatedTokens');
      expect(metadata).toHaveProperty('useCase');
    });

    test('toolCount matches actual profile lengths', () => {
      expect(PROFILE_METADATA.minimal.toolCount).toBe(MINIMAL_PROFILE.length);
      expect(PROFILE_METADATA.standard.toolCount).toBe(STANDARD_PROFILE.length);
      expect(PROFILE_METADATA.full.toolCount).toBe(FULL_PROFILE.length);
    });

    test('estimatedTokens increases with profile size', () => {
      expect(PROFILE_METADATA.minimal.estimatedTokens).toBeLessThan(
        PROFILE_METADATA.standard.estimatedTokens
      );
      expect(PROFILE_METADATA.standard.estimatedTokens).toBeLessThan(
        PROFILE_METADATA.full.estimatedTokens
      );
    });

    test('metadata names are properly capitalized', () => {
      expect(PROFILE_METADATA.minimal.name).toBe('Minimal');
      expect(PROFILE_METADATA.standard.name).toBe('Standard');
      expect(PROFILE_METADATA.full.name).toBe('Full');
    });
  });

  describe('Edge Cases and Integration', () => {
    test('profile arrays do not contain duplicates', () => {
      const checkDuplicates = (arr: string[]) => {
        const seen = new Set<string>();
        for (const item of arr) {
          if (seen.has(item)) {
            return true; // Has duplicate
          }
          seen.add(item);
        }
        return false;
      };

      expect(checkDuplicates(MINIMAL_PROFILE)).toBe(false);
      expect(checkDuplicates(STANDARD_PROFILE)).toBe(false);
      expect(checkDuplicates(FULL_PROFILE)).toBe(false);
    });

    test('all profile tools are strings', () => {
      [...MINIMAL_PROFILE, ...STANDARD_PROFILE, ...FULL_PROFILE].forEach((tool) => {
        expect(typeof tool).toBe('string');
      });
    });

    test('all profile tools are non-empty strings', () => {
      [...MINIMAL_PROFILE, ...STANDARD_PROFILE, ...FULL_PROFILE].forEach((tool) => {
        expect(tool.length).toBeGreaterThan(0);
      });
    });

    test('profile hierarchy maintained: minimal ⊆ standard ⊆ full', () => {
      // Every minimal tool should be in standard
      MINIMAL_PROFILE.forEach((tool) => {
        expect(STANDARD_PROFILE.includes(tool)).toBe(true);
      });

      // Every standard tool should be in full
      STANDARD_PROFILE.forEach((tool) => {
        expect(FULL_PROFILE.includes(tool)).toBe(true);
      });
    });

    test('getToolProfile and getToolsForProfile work together', () => {
      process.env.BUSINESSMAP_TOOL_PROFILE = 'minimal';
      const profile = getToolProfile();
      const tools = getToolsForProfile(profile);

      expect(tools).toEqual(MINIMAL_PROFILE);
    });

    test('isToolInProfile consistent with getToolsForProfile', () => {
      const profiles: ToolProfile[] = ['minimal', 'standard', 'full'];

      profiles.forEach((profile) => {
        const tools = getToolsForProfile(profile);

        tools.forEach((tool) => {
          expect(isToolInProfile(tool, profile)).toBe(true);
        });
      });
    });

    test('getMinimumProfileForTool consistent with profile membership', () => {
      FULL_PROFILE.forEach((tool) => {
        const minProfile = getMinimumProfileForTool(tool);

        // Tool should be in its minimum profile
        if (minProfile) {
          expect(isToolInProfile(tool, minProfile)).toBe(true);
        }
      });
    });
  });
});
