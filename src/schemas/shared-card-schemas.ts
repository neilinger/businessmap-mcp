import { z } from 'zod/v4';
import {
  entityIdSchema,
  optionalPosition,
  entityNameSchema,
  urlSchema,
  SECURITY_LIMITS,
} from './security-validation.js';

/**
 * Shared card-related schemas used across multiple card operations.
 * These schemas are extracted to reduce token usage and improve reusability.
 */

/**
 * T011: Subtask Schema
 * Represents a subtask within a card with optional completion status and position.
 */
export const SubtaskSchema = z.object({
  text: z
    .string()
    .min(1)
    .max(SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH)
    .describe('The text of the subtask'),
  completed: z.boolean().optional().describe('Whether the subtask is completed'),
  position: optionalPosition.describe('The position of the subtask in the list'),
});

/**
 * T012: Custom Field Update Schema
 * Represents a custom field update operation with field ID and value.
 */
export const CustomFieldUpdateSchema = z.object({
  field_id: entityIdSchema.describe('The ID of the custom field'),
  value: z
    .union([z.string(), z.number(), z.boolean(), z.null()])
    .describe('The value to set for the custom field. Can be string, number, boolean, or null'),
});

/**
 * T013: Card Link Schema
 * Represents a link between two cards with optional link type.
 */
export const CardLinkSchema = z.object({
  linked_card_id: entityIdSchema.describe('The ID of the card to link to'),
  link_type: z
    .string()
    .max(SECURITY_LIMITS.MAX_NAME_LENGTH)
    .optional()
    .describe('The type of link (e.g., "blocks", "related", "parent-child")'),
});

/**
 * T014: Sticker Schema
 * Represents a sticker on a card with optional position coordinates.
 */
export const StickerSchema = z.object({
  sticker_id: entityIdSchema.describe('The ID of the sticker'),
  position_x: z
    .number()
    .int()
    .min(0)
    .max(SECURITY_LIMITS.MAX_POSITION)
    .optional()
    .describe('The X coordinate position of the sticker on the card'),
  position_y: z
    .number()
    .int()
    .min(0)
    .max(SECURITY_LIMITS.MAX_POSITION)
    .optional()
    .describe('The Y coordinate position of the sticker on the card'),
});

/**
 * T015: Attachment Schema
 * Represents a file attachment with filename, URL, and optional size.
 */
export const AttachmentSchema = z.object({
  filename: entityNameSchema.describe('The name of the file attachment'),
  url: urlSchema.describe('The URL where the file can be accessed'),
  size: z.number().int().min(0).optional().describe('The size of the file in bytes'),
});

// Export all schemas for use in other modules
export const sharedCardSchemas = {
  SubtaskSchema,
  CustomFieldUpdateSchema,
  CardLinkSchema,
  StickerSchema,
  AttachmentSchema,
} as const;

// Type exports for TypeScript consumers
export type Subtask = z.infer<typeof SubtaskSchema>;
export type CustomFieldUpdate = z.infer<typeof CustomFieldUpdateSchema>;
export type CardLink = z.infer<typeof CardLinkSchema>;
export type Sticker = z.infer<typeof StickerSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
