import { z } from 'zod/v4';
import { SharedParams } from './shared-params.js';
import {
  bulkResourceIdsSchema,
  entityNameSchema,
  optionalEntityId,
  optionalDescription,
  optionalTitle,
  optionalPriority,
} from './security-validation.js';

/**
 * Bulk operation schemas for workspace, board, and card operations
 * Per T055: max 50 resources per bulk operation (performance constraint SC-008)
 */

// Base bulk archive schema (for resources that don't support permanent deletion)
export const bulkArchiveBaseSchema = z.object({
  resource_ids: bulkResourceIdsSchema.describe('Array of resource IDs to archive'),
  analyze_dependencies: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to analyze dependencies before archiving'),
  instance: SharedParams.shape.instance,
});

// Base bulk delete schema (for resources that support permanent deletion)
export const bulkDeleteBaseSchema = z.object({
  resource_ids: bulkResourceIdsSchema.describe('Array of resource IDs to delete'),
  analyze_dependencies: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to analyze dependencies before deletion'),
  instance: SharedParams.shape.instance,
});

// Base bulk update schema
export const bulkUpdateBaseSchema = z.object({
  resource_ids: bulkResourceIdsSchema.describe('Array of resource IDs to update'),
  instance: SharedParams.shape.instance,
});

// Bulk archive workspaces (workspaces don't support permanent deletion)
export const bulkArchiveWorkspacesSchema = bulkArchiveBaseSchema;

// Bulk update workspaces
export const bulkUpdateWorkspacesSchema = bulkUpdateBaseSchema
  .extend({
    name: entityNameSchema.optional().describe('New name for all workspaces'),
    description: optionalDescription.describe('New description for all workspaces'),
  })
  .refine(
    (data) => data.name !== undefined || data.description !== undefined,
    'At least one field (name or description) must be provided for update'
  );

// Bulk delete boards
export const bulkDeleteBoardsSchema = bulkDeleteBaseSchema;

// Bulk update boards
const bulkUpdateBoardsBaseSchema = bulkUpdateBaseSchema.extend({
  name: entityNameSchema.optional().describe('New name for all boards'),
  description: optionalDescription.describe('New description for all boards'),
  is_archived: z.boolean().optional().describe('Archive status for all boards'),
});

export const bulkUpdateBoardsSchema = bulkUpdateBoardsBaseSchema.refine(
  (data) =>
    data.name !== undefined || data.description !== undefined || data.is_archived !== undefined,
  'At least one field (name, description, or is_archived) must be provided for update'
);

// Export the shape for MCP registration (needed because .refine() creates ZodEffects which lacks .shape)
export const bulkUpdateBoardsSchemaShape = bulkUpdateBoardsBaseSchema.shape;

// Bulk delete cards
export const bulkDeleteCardsSchema = bulkDeleteBaseSchema;

/**
 * Bulk update cards schema
 *
 * Note: lane_id is optional but may be required by specific board configurations.
 * Always fetch board structure before performing bulk moves to ensure compliance.
 *
 * @see get_lanes MCP tool to fetch available lanes for a board
 * @see BusinessMapClient.getLanes() for programmatic access
 */
export const bulkUpdateCardsSchema = bulkUpdateBaseSchema
  .extend({
    title: optionalTitle.describe('New title for all cards'),
    description: optionalDescription.describe('New description for all cards'),
    column_id: optionalEntityId.describe('Move all cards to this column'),
    lane_id: optionalEntityId.describe(
      'Move all cards to this lane. Optional in schema but may be required by board configuration. ' +
        'Use get_lanes tool or BusinessMapClient.getLanes() to fetch available lanes.'
    ),
    priority: optionalPriority.describe('Priority level (0-10)'),
    owner_user_id: optionalEntityId.describe('Assign all cards to this user'),
  })
  .refine((data) => {
    const fields = [
      data.title,
      data.description,
      data.column_id,
      data.lane_id,
      data.priority,
      data.owner_user_id,
    ];
    return fields.some((field) => field !== undefined);
  }, 'At least one update field must be provided');
