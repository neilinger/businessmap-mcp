/**
 * Card Helper Schemas
 *
 * Contains helper/nested schemas used in card create/update operations.
 * Extracted from card-mutation-schemas.ts to reduce file size.
 *
 * @module card-helper-schemas
 */

import { z } from 'zod/v4';
import { fileAttachmentSchema, fileAttachmentWithIdSchema } from './common-schemas.js';
import { SharedParams } from './shared-params.js';

/**
 * Block reason schema for card blocking
 */
export const blockReasonSchema = z.object({
  reason_id: z.number(),
  comment: z.string(),
  users: z.array(z.number()),
  date: z.string(),
  cards: z.array(z.number()),
  instance: SharedParams.shape.instance,
});

/**
 * Sticker schema for card stickers
 */
export const stickerSchema = z.object({
  sticker_id: z.number(),
  if_not_present: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * Custom field value schema
 */
export const customFieldValueSchema = z.object({
  value_id: z.number(),
  position: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * Custom field card schema
 */
export const customFieldCardSchema = z.object({
  selected_card_id: z.number(),
  position: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * Custom field schema for card custom fields
 */
export const customFieldSchema = z.object({
  field_id: z.number(),
  value: z.string(),
  selected_values_to_add_or_update: z.array(customFieldValueSchema).optional(),
  selected_value_ids_to_remove: z.array(z.number()).optional(),
  other_value: z.string().optional(),
  contributor_ids_to_add: z.array(z.number()).optional(),
  contributor_ids_to_remove: z.array(z.number()).optional(),
  files_to_add: z.array(fileAttachmentSchema).optional(),
  files_to_update: z.array(fileAttachmentWithIdSchema).optional(),
  file_ids_to_remove: z.array(z.number()).optional(),
  vote: z.number().optional(),
  comment: z.string().optional(),
  selected_cards_to_add_or_update: z.array(customFieldCardSchema).optional(),
  selected_card_ids_to_remove: z.array(z.number()).optional(),
  instance: SharedParams.shape.instance,
});

/**
 * Subtask schema for card subtasks
 */
export const subtaskSchema = z.object({
  description: z.string(),
  owner_user_id: z.coerce.number(),
  is_finished: z.coerce.number(),
  deadline: z.string(),
  position: z.coerce.number(),
  attachments_to_add: z.array(fileAttachmentSchema),
  instance: SharedParams.shape.instance,
});

/**
 * Annotation schema for card annotations
 */
export const annotationSchema = z.object({
  comment_id: z.string(),
  thread_id: z.string(),
  content: z.string(),
  instance: SharedParams.shape.instance,
});

/**
 * Card link schema for linking existing cards
 */
export const cardLinkSchema = z.object({
  linked_card_id: z.number(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * New card link schema for linking to new cards
 */
export const newCardLinkSchema = z.object({
  linked_new_card_reference: z.string(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * Card property to copy schema
 */
export const cardPropertyToCopySchema = z.object({
  properties: z.array(z.string()),
  card_id: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * Custom field to copy schema
 */
export const customFieldToCopySchema = z.object({
  field_ids: z.array(z.number()),
  card_id: z.number(),
  instance: SharedParams.shape.instance,
});

/**
 * Column checklist item schema
 */
export const columnChecklistItemSchema = z.object({
  item_id: z.number(),
  comment: z.string(),
  instance: SharedParams.shape.instance,
});

// Type exports
//
// Naming Convention:
// - Types in this file use the `*Type` suffix (e.g., SubtaskType, CardLinkType)
// - Types in card-*-schemas.ts use the `*Input` suffix (e.g., CreateCardInput)
//
// The `*Type` suffix is used here to avoid naming conflicts with
// shared-card-schemas.ts which exports different schemas with similar names
// (e.g., SubtaskSchema vs subtaskSchema have different field structures).
// - shared-card-schemas.ts: Simplified schemas for common operations (T011-T015)
// - card-helper-schemas.ts: Full API schemas matching BusinessMap API structure
export type BlockReasonType = z.infer<typeof blockReasonSchema>;
export type StickerType = z.infer<typeof stickerSchema>;
export type CustomFieldValueType = z.infer<typeof customFieldValueSchema>;
export type CustomFieldCardType = z.infer<typeof customFieldCardSchema>;
export type CustomFieldType = z.infer<typeof customFieldSchema>;
export type SubtaskType = z.infer<typeof subtaskSchema>;
export type AnnotationType = z.infer<typeof annotationSchema>;
export type CardLinkType = z.infer<typeof cardLinkSchema>;
export type NewCardLinkType = z.infer<typeof newCardLinkSchema>;
export type CardPropertyToCopyType = z.infer<typeof cardPropertyToCopySchema>;
export type CustomFieldToCopyType = z.infer<typeof customFieldToCopySchema>;
export type ColumnChecklistItemType = z.infer<typeof columnChecklistItemSchema>;
