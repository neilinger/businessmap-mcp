/**
 * Card Mutation Schemas
 *
 * Contains schemas for creating, updating, moving, and deleting cards.
 * Extracted from card-schemas.ts to reduce TypeScript compilation memory usage.
 *
 * @module card-mutation-schemas
 */

import { z } from 'zod/v4';
import { fileAttachmentSchema } from './common-schemas.js';
import {
  entityIdSchema,
  titleSchema,
  optionalEntityId,
  optionalTitle,
  optionalDescription,
  optionalCustomId,
  optionalEmail,
  optionalUrl,
  optionalIsoDate,
  optionalPriority,
  optionalSize,
  optionalPosition,
  optionalBooleanFlag,
  secureArray,
  SECURITY_LIMITS,
} from './security-validation.js';
import { SharedParams, PlacementSchema, MetadataSchema, OwnersSchema } from './shared-params.js';
import {
  blockReasonSchema,
  stickerSchema,
  customFieldSchema,
  subtaskSchema,
  annotationSchema,
  cardLinkSchema,
  newCardLinkSchema,
  cardPropertyToCopySchema,
  customFieldToCopySchema,
  columnChecklistItemSchema,
} from './card-helper-schemas.js';

// Re-export helper schemas for backward compatibility
export {
  blockReasonSchema,
  stickerSchema,
  customFieldValueSchema,
  customFieldCardSchema,
  customFieldSchema,
  subtaskSchema,
  annotationSchema,
  cardLinkSchema,
  newCardLinkSchema,
  cardPropertyToCopySchema,
  customFieldToCopySchema,
  columnChecklistItemSchema,
} from './card-helper-schemas.js';

// ============================================================================
// Main Card Mutation Schemas
// ============================================================================

/**
 * Compressed schema for card creation - using nested structures to reduce tokens
 *
 * This schema organizes card creation parameters into logical groups:
 * - placement: Lane and position settings
 * - metadata: Card attributes (description, priority, etc.)
 * - owners: Ownership and collaboration settings
 * - dates: All date-related fields
 * - status: Card state flags
 * - collections: Arrays of related entities (tags, stickers, etc.)
 */
export const createCardSchema = z.object({
  // Required fields
  title: titleSchema.describe('Card title'),
  column_id: entityIdSchema.describe('Column ID'),

  // Placement (nested)
  placement: PlacementSchema.extend({
    track: optionalEntityId.describe('Track ID'),
  })
    .partial()
    .optional()
    .describe('Card placement'),

  // Metadata (nested) - extended with additional fields
  metadata: MetadataSchema.extend({
    reference: optionalCustomId.describe('Reference ID'),
    template_id: optionalEntityId.describe('Template ID'),
    version_id: optionalEntityId.describe('Version ID'),
  })
    .optional()
    .describe('Card metadata'),

  // Owners (nested)
  owners: OwnersSchema.extend({
    reporter_user_id: optionalEntityId.describe('Reporter user ID'),
    reporter_email: optionalEmail.describe('Reporter email'),
  })
    .optional()
    .describe('Card ownership'),

  // Dates (grouped)
  dates: z
    .object({
      planned_start: optionalIsoDate.describe('Planned start'),
      planned_start_sync: optionalBooleanFlag.describe('Start sync type'),
      planned_end: optionalIsoDate.describe('Planned end'),
      planned_end_sync: optionalBooleanFlag.describe('End sync type'),
      actual_start: optionalIsoDate.describe('Actual start'),
      actual_end: optionalIsoDate.describe('Actual end'),
      created_at: optionalIsoDate.describe('Created at'),
      archived_at: optionalIsoDate.describe('Archived at'),
      discarded_at: optionalIsoDate.describe('Discarded at'),
    })
    .partial()
    .optional()
    .describe('Card dates'),

  // Status (grouped)
  status: z
    .object({
      is_archived: optionalBooleanFlag.describe('Archived flag'),
      is_discarded: optionalBooleanFlag.describe('Discarded flag'),
      watch: optionalBooleanFlag.describe('Watch flag'),
      block_reason: blockReasonSchema.optional().describe('Block reason'),
      discard_reason_id: optionalEntityId.describe('Discard reason ID'),
      discard_comment: z.string().optional().describe('Discard comment'),
      exceeding_reason: z.string().optional().describe('Exceeding reason'),
    })
    .partial()
    .optional()
    .describe('Card status'),

  // Collections (grouped arrays)
  collections: z
    .object({
      co_owner_ids_to_add: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_USER_IDS,
      })
        .optional()
        .describe('Co-owner IDs to add'),
      co_owner_ids_to_remove: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_USER_IDS,
      })
        .optional()
        .describe('Co-owner IDs to remove'),
      watcher_ids_to_add: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_USER_IDS,
      })
        .optional()
        .describe('Watcher IDs to add'),
      watcher_ids_to_remove: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_USER_IDS,
      })
        .optional()
        .describe('Watcher IDs to remove'),
      tag_ids_to_add: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_TAG_IDS,
      })
        .optional()
        .describe('Tag IDs to add'),
      tag_ids_to_remove: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_TAG_IDS,
      })
        .optional()
        .describe('Tag IDs to remove'),
      milestone_ids_to_add: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Milestone IDs to add'),
      milestone_ids_to_remove: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Milestone IDs to remove'),
      stickers_to_add: secureArray(stickerSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Stickers to add'),
    })
    .partial()
    .optional()
    .describe('Card collections'),

  // Subtasks
  subtasks: secureArray(subtaskSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Subtasks'),

  // Custom fields
  custom_fields: z
    .object({
      to_add_or_update: secureArray(customFieldSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Fields to add/update'),
      ids_to_remove: secureArray(entityIdSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Field IDs to remove'),
      to_copy: secureArray(customFieldToCopySchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Fields to copy'),
    })
    .partial()
    .optional()
    .describe('Custom fields'),

  // Attachments
  attachments: z
    .object({
      to_add: secureArray(fileAttachmentSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Attachments to add'),
      cover_image_link: optionalUrl.describe('Cover image link'),
    })
    .partial()
    .optional()
    .describe('Attachments'),

  // Card links
  card_links: z
    .object({
      existing_cards: secureArray(cardLinkSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Links to existing cards'),
      new_cards: secureArray(newCardLinkSchema, {
        maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
      })
        .optional()
        .describe('Links to new cards'),
    })
    .partial()
    .optional()
    .describe('Card links'),

  // Other
  annotations: secureArray(annotationSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Annotations'),
  checklist_items: secureArray(columnChecklistItemSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Checklist items'),
  card_properties_to_copy: secureArray(cardPropertyToCopySchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Card properties to copy'),

  instance: SharedParams.shape.instance,
});

// Helper for array fields with security limits
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const arr = (s: any, m: number) => secureArray(s, { maxItems: m }).optional();

/**
 * Schema for updating an existing card
 */
export const updateCardSchema = z.object({
  card_id: entityIdSchema,
  id: optionalEntityId,
  title: optionalTitle,
  description: optionalDescription,
  column_id: optionalEntityId,
  lane_id: optionalEntityId,
  position: optionalPosition,
  owner_user_id: optionalEntityId,
  assignee_user_id: optionalEntityId,
  size: optionalSize,
  priority: optionalPriority,
  deadline: optionalIsoDate,
  co_owner_ids_to_add: arr(entityIdSchema, SECURITY_LIMITS.MAX_USER_IDS),
  co_owner_ids_to_remove: arr(entityIdSchema, SECURITY_LIMITS.MAX_USER_IDS),
  watcher_ids_to_add: arr(entityIdSchema, SECURITY_LIMITS.MAX_USER_IDS),
  watcher_ids_to_remove: arr(entityIdSchema, SECURITY_LIMITS.MAX_USER_IDS),
  tag_ids_to_add: arr(entityIdSchema, SECURITY_LIMITS.MAX_TAG_IDS),
  tag_ids_to_remove: arr(entityIdSchema, SECURITY_LIMITS.MAX_TAG_IDS),
  milestone_ids_to_add: arr(entityIdSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  milestone_ids_to_remove: arr(entityIdSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  subtasks_to_add: arr(subtaskSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  links_to_existing_cards_to_add_or_update: arr(cardLinkSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  links_to_new_cards_to_add: arr(newCardLinkSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  custom_fields_to_add_or_update: arr(customFieldSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  custom_field_ids_to_remove: arr(entityIdSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  attachments_to_add: arr(fileAttachmentSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  stickers_to_add: arr(stickerSchema, SECURITY_LIMITS.MAX_ARRAY_ITEMS),
  column_checklist_items_to_check_or_update: arr(
    columnChecklistItemSchema,
    SECURITY_LIMITS.MAX_ARRAY_ITEMS
  ),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for moving a card to a different column/lane
 */
export const moveCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card to move'),
  column_id: entityIdSchema.describe('The target column ID'),
  lane_id: optionalEntityId.describe('Optional target lane ID'),
  position: optionalPosition.describe('Optional position in the column'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for deleting a card
 */
export const deleteCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card to delete'),
  archive_first: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Archive the card before deletion to avoid API errors. Default: true. Set to false only if card is already archived.'
    ),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for setting card size/points
 */
export const cardSizeSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  size: optionalSize.describe('The new size/points for the card'),
  instance: SharedParams.shape.instance,
});

// Type exports
export type CreateCardInput = z.infer<typeof createCardSchema>;
export type UpdateCardInput = z.infer<typeof updateCardSchema>;
export type MoveCardInput = z.infer<typeof moveCardSchema>;
export type DeleteCardInput = z.infer<typeof deleteCardSchema>;
export type CardSizeInput = z.infer<typeof cardSizeSchema>;
