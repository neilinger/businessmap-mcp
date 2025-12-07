import { z } from 'zod/v4';
import {
  entityIdSchema,
  optionalEntityId,
  positionSchema,
  prioritySchema,
  sizeSchema,
  colorSchema,
  customIdSchema,
  descriptionSchema,
  optionalIsoDate,
  secureString,
  secureArray,
  SECURITY_LIMITS,
} from './security-validation.js';

/**
 * Shared parameter schemas for BusinessMap MCP server
 *
 * These schemas define common parameter structures that are reused across
 * multiple tool definitions, enabling:
 * - Consistent validation across endpoints
 * - Reduced code duplication
 * - Token optimization through schema reuse
 * - Easier maintenance and updates
 */

// ============================================================================
// SharedParams - Common instance and entity identifiers
// ============================================================================

/**
 * Common parameters used across most tool calls
 *
 * @property instance - Optional instance name for multi-instance support
 * @property board_id - Optional board identifier
 * @property card_id - Optional card identifier
 * @property workspace_id - Optional workspace identifier
 */
export const SharedParams = z.object({
  instance: secureString({
    minLength: 1,
    maxLength: 100,
    trim: true,
  })
    .optional()
    .describe(
      'Optional instance name to target a specific BusinessMap instance. If not provided, uses the default instance.'
    ),
  board_id: optionalEntityId.describe('The ID of the board'),
  card_id: optionalEntityId.describe('The ID of the card'),
  workspace_id: optionalEntityId.describe('The ID of the workspace'),
});

/**
 * Type inference for SharedParams
 */
export type SharedParamsType = z.infer<typeof SharedParams>;

// ============================================================================
// PlacementSchema - Card positioning parameters
// ============================================================================

/**
 * Schema for card placement within lanes and positions
 *
 * @property lane_id - Optional in schema but may be required by specific board configurations.
 *   Always fetch board structure before creating cards to ensure compliance.
 *   @see get_lanes MCP tool to fetch available lanes for a board
 *   @see BusinessMapClient.getLanes() for programmatic access
 *   @throws {ApiError} 400 - If board configuration requires lane_id but it's not provided
 * @property position - Optional position within the lane
 */
export const PlacementSchema = z.object({
  lane_id: entityIdSchema
    .optional()
    .describe(
      'The ID of the lane where the card should be placed. Optional in schema but may be required by board configuration. Use get_lanes tool or BusinessMapClient.getLanes() to fetch available lanes.'
    ),
  position: positionSchema
    .optional()
    .describe('The position of the card within the lane (0-based index)'),
});

/**
 * Type inference for PlacementSchema
 */
export type PlacementType = z.infer<typeof PlacementSchema>;

// ============================================================================
// MetadataSchema - Card metadata and attributes
// ============================================================================

/**
 * Schema for card metadata fields
 * All fields are optional using .partial() to support flexible updates
 *
 * @property custom_id - Custom identifier for external system integration
 * @property description - Card description/notes
 * @property deadline - Card deadline (ISO 8601 date string)
 * @property size - Card size/story points
 * @property priority - Card priority level
 * @property color - Card color code
 * @property type_id - Card type identifier
 */
export const MetadataSchema = z
  .object({
    custom_id: customIdSchema.describe(
      'Custom identifier for the card (useful for external system integration)'
    ),
    description: descriptionSchema.describe(
      'Detailed description or notes for the card (supports Markdown formatting)'
    ),
    deadline: optionalIsoDate.describe(
      'Deadline for the card in ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss)'
    ),
    size: sizeSchema.describe('Size or story points for the card (0 to 10000)'),
    priority: prioritySchema.describe('Priority level for the card (0 = lowest, 10 = highest)'),
    color: colorSchema.describe('Color code for the card (hex color or named color)'),
    type_id: entityIdSchema.describe(
      'The ID of the card type (defines card template and behavior)'
    ),
  })
  .partial();

/**
 * Type inference for MetadataSchema
 */
export type MetadataType = z.infer<typeof MetadataSchema>;

// ============================================================================
// OwnersSchema - Card ownership and collaboration
// ============================================================================

/**
 * Schema for card ownership and collaboration
 *
 * @property user_id - Primary owner/assignee user ID
 * @property co_owners - Array of co-owner user IDs
 */
export const OwnersSchema = z.object({
  user_id: entityIdSchema
    .optional()
    .describe('The ID of the user who owns or is assigned to the card'),
  co_owners: secureArray(entityIdSchema, {
    minItems: 0,
    maxItems: SECURITY_LIMITS.MAX_USER_IDS,
  })
    .optional()
    .describe('Array of user IDs for co-owners/collaborators on the card (max 100 users)'),
});

/**
 * Type inference for OwnersSchema
 */
export type OwnersType = z.infer<typeof OwnersSchema>;
