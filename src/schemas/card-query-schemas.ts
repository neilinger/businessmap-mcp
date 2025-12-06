/**
 * Card Query Schemas
 *
 * Contains schemas for listing and filtering cards.
 * Extracted from card-schemas.ts to reduce TypeScript compilation memory usage.
 *
 * @module card-query-schemas
 */

import { z } from 'zod/v4';
import { idArrayFilters, paginationSchema } from './common-schemas.js';
import { entityIdSchema } from './security-validation.js';
import { SharedParams } from './shared-params.js';

/**
 * Date range filter schema for card queries.
 * Supports both 'from/to' and 'from_date/to_date' formats.
 */
const dateRangeSchema = z
  .object({
    from: z.string().optional(),
    from_date: z.string().optional(),
    to: z.string().optional(),
    to_date: z.string().optional(),
  })
  .optional();

/**
 * Compressed list_cards schema - token optimized (T025)
 *
 * This schema supports filtering cards by various criteria including:
 * - Date ranges (archived, created, deadline, etc.)
 * - ID filters (columns, lanes, owners, etc.)
 * - Pagination
 *
 * The date_filters object provides a nested structure for better token compression
 * while maintaining backward compatibility with flat date filters.
 */
export const listCardsSchema = z.object({
  board_id: entityIdSchema,

  // Date filters (nested for compression)
  date_filters: z
    .object({
      archived: dateRangeSchema,
      created: dateRangeSchema,
      deadline: dateRangeSchema,
      discarded: dateRangeSchema,
      first_end: dateRangeSchema,
      first_start: dateRangeSchema,
      in_current_position_since: dateRangeSchema,
      last_end: dateRangeSchema,
      last_modified: dateRangeSchema,
      last_start: dateRangeSchema,
    })
    .partial()
    .optional(),

  // Backward compatibility - flat date filters (to be deprecated)
  archived_from: z.string().optional(),
  archived_from_date: z.string().optional(),
  archived_to: z.string().optional(),
  archived_to_date: z.string().optional(),
  created_from: z.string().optional(),
  created_from_date: z.string().optional(),
  created_to: z.string().optional(),
  created_to_date: z.string().optional(),
  deadline_from: z.string().optional(),
  deadline_from_date: z.string().optional(),
  deadline_to: z.string().optional(),
  deadline_to_date: z.string().optional(),
  discarded_from: z.string().optional(),
  discarded_from_date: z.string().optional(),
  discarded_to: z.string().optional(),
  discarded_to_date: z.string().optional(),
  first_end_from: z.string().optional(),
  first_end_from_date: z.string().optional(),
  first_end_to: z.string().optional(),
  first_end_to_date: z.string().optional(),
  first_start_from: z.string().optional(),
  first_start_from_date: z.string().optional(),
  first_start_to: z.string().optional(),
  first_start_to_date: z.string().optional(),
  in_current_position_since_from: z.string().optional(),
  in_current_position_since_from_date: z.string().optional(),
  in_current_position_since_to: z.string().optional(),
  in_current_position_since_to_date: z.string().optional(),
  last_end_from: z.string().optional(),
  last_end_from_date: z.string().optional(),
  last_end_to: z.string().optional(),
  last_end_to_date: z.string().optional(),
  last_modified_from: z.string().optional(),
  last_modified_from_date: z.string().optional(),
  last_modified_to: z.string().optional(),
  last_modified_to_date: z.string().optional(),
  last_start_from: z.string().optional(),
  last_start_from_date: z.string().optional(),
  last_start_to: z.string().optional(),
  last_start_to_date: z.string().optional(),

  // ID filters
  ...idArrayFilters,
  card_ids: z.array(z.number()).optional(),
  last_column_ids: z.array(z.number()).optional(),
  last_lane_ids: z.array(z.number()).optional(),
  owner_user_ids: z.array(z.number()).optional(),
  priorities: z.array(z.number()).optional(),
  reason_ids: z.array(z.number()).optional(),
  sections: z.array(z.number()).optional(),
  sizes: z.array(z.number()).optional(),
  type_ids: z.array(z.number()).optional(),
  version_ids: z.array(z.number()).optional(),
  colors: z.array(z.string()).optional(),
  custom_ids: z.array(z.string()).optional(),

  // Config
  include_logged_time_for_child_cards: z.number().optional(),
  include_logged_time_for_subtasks: z.number().optional(),

  // Pagination
  ...paginationSchema,

  // Legacy
  assignee_user_id: z.number().optional(),
  tag_ids: z.array(z.number()).optional(),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting a single card by ID
 */
export const getCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting card types
 */
export const getCardTypesSchema = z.object({
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting card history
 */
export const getCardHistorySchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  outcome_id: entityIdSchema.describe('The ID of the outcome'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting card outcomes
 */
export const getCardOutcomesSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting linked cards
 */
export const getCardLinkedCardsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

// Type exports
export type ListCardsInput = z.infer<typeof listCardsSchema>;
export type GetCardInput = z.infer<typeof getCardSchema>;
export type GetCardTypesInput = z.infer<typeof getCardTypesSchema>;
export type GetCardHistoryInput = z.infer<typeof getCardHistorySchema>;
export type GetCardOutcomesInput = z.infer<typeof getCardOutcomesSchema>;
export type GetCardLinkedCardsInput = z.infer<typeof getCardLinkedCardsSchema>;
