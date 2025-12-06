/**
 * Card Comment Schemas
 *
 * Contains schemas for comment operations on cards.
 * Extracted from card-schemas.ts to reduce TypeScript compilation memory usage.
 *
 * @module card-comment-schemas
 */

import { z } from 'zod/v4';
import { entityIdSchema } from './security-validation.js';
import { SharedParams } from './shared-params.js';

/**
 * Schema for getting all comments on a card
 */
export const cardCommentsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting a specific comment
 */
export const getCardCommentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  comment_id: entityIdSchema.describe('The ID of the comment'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for creating a new card comment
 * @example { card_id: 12345, text: "Important update on this task" }
 */
export const createCardCommentSchema = z.object({
  card_id: entityIdSchema,
  text: z.string().min(1, 'Comment text cannot be empty'),
  attachments_to_add: z
    .array(
      z.object({
        file_name: z.string(),
        link: z.string().url(),
      })
    )
    .optional(),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for updating an existing card comment
 * @example { card_id: 12345, comment_id: 67890, text: "Updated comment text" }
 */
export const updateCardCommentSchema = z
  .object({
    card_id: entityIdSchema,
    comment_id: entityIdSchema,
    text: z.string().min(1, 'Comment text cannot be empty').optional(),
    attachments_to_add: z
      .array(
        z.object({
          file_name: z.string(),
          link: z.string().url(),
        })
      )
      .optional(),
    instance: SharedParams.shape.instance,
  })
  .refine((data) => data.text !== undefined || data.attachments_to_add !== undefined, {
    message: 'At least one of text or attachments_to_add must be provided',
  });

/**
 * Schema for deleting a card comment
 * @example { card_id: 12345, comment_id: 67890 }
 */
export const deleteCardCommentSchema = z.object({
  card_id: entityIdSchema,
  comment_id: entityIdSchema,
  instance: SharedParams.shape.instance,
});

// Type exports
export type CardCommentsInput = z.infer<typeof cardCommentsSchema>;
export type GetCardCommentInput = z.infer<typeof getCardCommentSchema>;
export type CreateCardCommentInput = z.infer<typeof createCardCommentSchema>;
export type UpdateCardCommentInput = z.infer<typeof updateCardCommentSchema>;
export type DeleteCardCommentInput = z.infer<typeof deleteCardCommentSchema>;
