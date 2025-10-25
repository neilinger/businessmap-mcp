import { z } from 'zod';

/**
 * Bulk operation schemas for workspace, board, and card operations
 * Per T055: max 50 resources per bulk operation (performance constraint SC-008)
 */

// Base bulk archive schema (for resources that don't support permanent deletion)
export const bulkArchiveBaseSchema = z.object({
  resource_ids: z
    .array(z.number().positive())
    .min(1, 'At least one resource ID is required')
    .max(50, 'Maximum 50 resources per bulk operation')
    .describe('Array of resource IDs to archive'),
  analyze_dependencies: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to analyze dependencies before archiving'),
});

// Base bulk delete schema (for resources that support permanent deletion)
export const bulkDeleteBaseSchema = z.object({
  resource_ids: z
    .array(z.number().positive())
    .min(1, 'At least one resource ID is required')
    .max(50, 'Maximum 50 resources per bulk operation')
    .describe('Array of resource IDs to delete'),
  analyze_dependencies: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether to analyze dependencies before deletion'),
});

// Base bulk update schema
export const bulkUpdateBaseSchema = z.object({
  resource_ids: z
    .array(z.number().positive())
    .min(1, 'At least one resource ID is required')
    .max(50, 'Maximum 50 resources per bulk operation')
    .describe('Array of resource IDs to update'),
});

// Bulk archive workspaces (workspaces don't support permanent deletion)
export const bulkArchiveWorkspacesSchema = bulkArchiveBaseSchema;

// Bulk update workspaces
export const bulkUpdateWorkspacesSchema = bulkUpdateBaseSchema.extend({
  name: z.string().optional().describe('New name for all workspaces'),
  description: z.string().optional().describe('New description for all workspaces'),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined,
  'At least one field (name or description) must be provided for update'
);

// Bulk delete boards
export const bulkDeleteBoardsSchema = bulkDeleteBaseSchema;

// Bulk update boards
export const bulkUpdateBoardsSchema = bulkUpdateBaseSchema.extend({
  name: z.string().optional().describe('New name for all boards'),
  description: z.string().optional().describe('New description for all boards'),
  is_archived: z.boolean().optional().describe('Archive status for all boards'),
}).refine(
  (data) => data.name !== undefined || data.description !== undefined || data.is_archived !== undefined,
  'At least one field (name, description, or is_archived) must be provided for update'
);

// Bulk delete cards
export const bulkDeleteCardsSchema = bulkDeleteBaseSchema;

// Bulk update cards
export const bulkUpdateCardsSchema = bulkUpdateBaseSchema.extend({
  title: z.string().optional().describe('New title for all cards'),
  description: z.string().optional().describe('New description for all cards'),
  column_id: z.number().positive().optional().describe('Move all cards to this column'),
  lane_id: z.number().positive().optional().describe('Move all cards to this lane'),
  priority: z.number().min(0).max(4).optional().describe('Priority level (0=none, 1=low, 2=normal, 3=high, 4=critical)'),
  owner_user_id: z.number().positive().optional().describe('Assign all cards to this user'),
}).refine(
  (data) => {
    const fields = [data.title, data.description, data.column_id, data.lane_id, data.priority, data.owner_user_id];
    return fields.some((field) => field !== undefined);
  },
  'At least one update field must be provided'
);
