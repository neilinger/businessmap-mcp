/**
 * Tool Profile Definitions for Token Optimization
 *
 * Defines three tiers of tool registration to optimize token usage:
 * - minimal: Core tools for basic operations (12 tools)
 * - standard: Most common operations (~30 tools)
 * - full: All available tools (65 tools)
 *
 * @see specs/003-schema-compression-lazy-loading/plan.md - US1: Profile-Based Registration
 */

/**
 * Available tool profile types
 */
export type ToolProfile = 'minimal' | 'standard' | 'full';

/**
 * Tool name type for type-safe profile definitions
 */
export type ToolName = string;

/**
 * Minimal profile: 12 core tools for basic operations
 *
 * Use case: Simple queries and essential CRUD operations
 * Target tokens: ~600 tokens (50 tokens per tool × 12 tools)
 *
 * Includes:
 * - Basic listing (boards, cards, workspaces)
 * - Core retrieval (get_card, get_workspace)
 * - Essential mutations (create_card, update_card, move_card)
 * - Search and health utilities
 */
export const MINIMAL_PROFILE: ToolName[] = [
  // Core listing operations
  'list_boards',
  'list_cards',
  'list_workspaces',

  // Core retrieval operations
  'get_card',
  'get_workspace',

  // Essential card mutations
  'create_card',
  'update_card',
  'move_card',

  // Search and utilities
  'search_board',
  'health_check',
];

/**
 * Standard profile: ~30 tools for typical workflows
 *
 * Use case: Common business operations and structured workflows
 * Target tokens: ~1,500 tokens (50 tokens per tool × 30 tools)
 *
 * Extends minimal profile with:
 * - Board operations (create, update, structure, lanes)
 * - Workspace operations (create, update)
 * - Custom field queries (list, get)
 * - Card relationships (parents, children)
 * - Card details and comments
 * - User management basics
 */
export const STANDARD_PROFILE: ToolName[] = [
  // All minimal tools
  ...MINIMAL_PROFILE,

  // Board operations
  'create_board',
  'update_board',
  'get_current_board_structure',
  'get_columns',
  'get_lanes',

  // Workspace operations
  'create_workspace',
  'update_workspace',

  // Custom field operations
  'list_custom_fields',
  'get_custom_field',

  // Card relationship operations
  'get_card_parents',
  'get_card_children',
  'add_card_parent',
  'remove_card_parent',

  // Card details
  'get_card_comments',
  'get_card_custom_fields',
  'delete_card',

  // User operations
  'list_users',
  'get_current_user',

  // Utility operations
  'get_api_info',
];

/**
 * Full profile: All 65 registered tools
 *
 * Use case: Complex automations, bulk operations, advanced workflows
 * Target tokens: ~3,250 tokens (50 tokens per tool × 65 tools)
 *
 * Extends standard profile with:
 * - Bulk operations (delete, update for boards, cards, workspaces)
 * - Custom field mutations (create, update, delete)
 * - Advanced board operations (delete, lanes, archive)
 * - Workspace archive operations
 * - Card subtask management
 * - Card parent graph and detailed relationships
 * - Card size management
 * - Card history and audit
 * - Card outcomes and linked cards
 * - Card types and advanced comments
 * - User details
 * - Workflow cycle time analysis
 */
export const FULL_PROFILE: ToolName[] = [
  // All standard tools
  ...STANDARD_PROFILE,

  // Board operations (extended)
  'delete_board',
  'get_lane',
  'create_lane',

  // Workspace operations (extended)
  'archive_workspace',

  // Custom field operations (extended)
  'list_board_custom_fields',
  'create_custom_field',
  'update_custom_field',
  'delete_custom_field',

  // Card relationship operations (extended)
  'get_card_parent',
  'get_card_parent_graph',
  'get_card_subtasks',
  'get_card_subtask',
  'create_card_subtask',

  // Card details (extended)
  'get_card_types',
  'get_card_comment',

  // Card size operations
  'get_card_size',
  'set_card_size',

  // Card history and audit
  'get_card_history',
  'get_card_outcomes',

  // Card relationships (advanced)
  'get_card_linked_cards',

  // User operations (extended)
  'get_user',

  // Bulk board operations
  'bulk_delete_boards',
  'bulk_update_boards',

  // Bulk card operations
  'bulk_delete_cards',
  'bulk_update_cards',

  // Bulk workspace operations
  'bulk_archive_workspaces',
  'bulk_update_workspaces',

  // Workflow operations
  'get_workflow_cycle_time_columns',
  'get_workflow_effective_cycle_time_columns',
];

/**
 * Tool profile configuration map
 */
export const TOOL_PROFILES: Record<ToolProfile, ToolName[]> = {
  minimal: MINIMAL_PROFILE,
  standard: STANDARD_PROFILE,
  full: FULL_PROFILE,
};

/**
 * Get tool names for a specific profile
 *
 * @param profile - The profile type to retrieve
 * @returns Array of tool names for the profile
 *
 * @example
 * ```typescript
 * const minimalTools = getToolsForProfile('minimal');
 * console.log(`Minimal profile has ${minimalTools.length} tools`);
 * ```
 */
export function getToolsForProfile(profile: ToolProfile): ToolName[] {
  const tools = TOOL_PROFILES[profile];

  if (!tools) {
    throw new Error(`Invalid tool profile: '${profile}'. Must be one of: minimal, standard, full`);
  }

  return tools;
}

/**
 * Get the active tool profile from environment variable
 *
 * @returns The configured tool profile (defaults to 'standard')
 * @throws Error if BUSINESSMAP_TOOL_PROFILE is set to an invalid value
 *
 * @example
 * ```typescript
 * // With BUSINESSMAP_TOOL_PROFILE=minimal
 * const profile = getToolProfile(); // returns 'minimal'
 *
 * // Without environment variable
 * const profile = getToolProfile(); // returns 'standard' (default)
 *
 * // With invalid value
 * // BUSINESSMAP_TOOL_PROFILE=invalid
 * const profile = getToolProfile(); // throws Error
 * ```
 */
export function getToolProfile(): ToolProfile {
  const envProfile = process.env.BUSINESSMAP_TOOL_PROFILE;

  // Default to 'standard' if not set
  if (!envProfile) {
    return 'standard';
  }

  // Validate the profile value
  const validProfiles: ToolProfile[] = ['minimal', 'standard', 'full'];
  if (!validProfiles.includes(envProfile as ToolProfile)) {
    throw new Error(
      `Invalid BUSINESSMAP_TOOL_PROFILE: '${envProfile}'. Must be one of: ${validProfiles.join(', ')}`
    );
  }

  return envProfile as ToolProfile;
}

/**
 * Check if a tool is included in a specific profile
 *
 * @param toolName - The tool name to check
 * @param profile - The profile to check against
 * @returns True if the tool is in the profile
 *
 * @example
 * ```typescript
 * if (isToolInProfile('bulk_delete_cards', 'minimal')) {
 *   // Tool available in minimal profile
 * }
 * ```
 */
export function isToolInProfile(toolName: ToolName, profile: ToolProfile): boolean {
  return TOOL_PROFILES[profile].includes(toolName);
}

/**
 * Get the minimum profile that includes a specific tool
 *
 * @param toolName - The tool name to find
 * @returns The minimum profile containing the tool, or null if not found
 *
 * @example
 * ```typescript
 * const profile = getMinimumProfileForTool('bulk_delete_cards');
 * console.log(`Tool requires at least: ${profile}`); // 'full'
 * ```
 */
export function getMinimumProfileForTool(toolName: ToolName): ToolProfile | null {
  if (isToolInProfile(toolName, 'minimal')) {
    return 'minimal';
  }
  if (isToolInProfile(toolName, 'standard')) {
    return 'standard';
  }
  if (isToolInProfile(toolName, 'full')) {
    return 'full';
  }
  return null;
}

/**
 * Profile metadata for documentation and logging
 */
export const PROFILE_METADATA: Record<
  ToolProfile,
  {
    name: string;
    description: string;
    toolCount: number;
    estimatedTokens: number;
    useCase: string;
  }
> = {
  minimal: {
    name: 'Minimal',
    description: 'Core tools for basic operations',
    toolCount: MINIMAL_PROFILE.length,
    estimatedTokens: MINIMAL_PROFILE.length * 50,
    useCase: 'Simple queries and essential CRUD operations',
  },
  standard: {
    name: 'Standard',
    description: 'Most common operations',
    toolCount: STANDARD_PROFILE.length,
    estimatedTokens: STANDARD_PROFILE.length * 50,
    useCase: 'Common business operations and structured workflows',
  },
  full: {
    name: 'Full',
    description: 'All available tools',
    toolCount: FULL_PROFILE.length,
    estimatedTokens: FULL_PROFILE.length * 50,
    useCase: 'Complex automations, bulk operations, advanced workflows',
  },
};
