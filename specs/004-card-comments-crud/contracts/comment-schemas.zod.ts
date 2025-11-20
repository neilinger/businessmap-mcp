/**
 * Zod Schemas for Card Comment CRUD Operations
 *
 * These schemas define the validation rules for MCP tool parameters
 * when performing create, update, and delete operations on card comments.
 *
 * @see src/schemas/card-schemas.ts - For implementation location
 */

import { z } from 'zod';

/**
 * Base schema for operations requiring card_id and instance
 */
const baseCardSchema = z.object({
  card_id: z.number().int().positive().describe('Card ID'),
  instance: z.string().optional().describe('BusinessMap instance (fimancia or kerkow)'),
});

/**
 * Base schema for operations requiring card_id, comment_id, and instance
 */
const baseCommentSchema = z.object({
  card_id: z.number().int().positive().describe('Card ID'),
  comment_id: z.number().int().positive().describe('Comment ID'),
  instance: z.string().optional().describe('BusinessMap instance (fimancia or kerkow)'),
});

/**
 * Schema for attachment objects
 */
const attachmentSchema = z.object({
  file_name: z.string().min(1).describe('Attachment filename'),
  link: z.string().url().describe('URL to attachment'),
});

/**
 * Schema for creating a new card comment
 *
 * Endpoint: POST /cards/{card_id}/comments
 *
 * Validation:
 * - text: Required, non-empty after trimming
 * - attachments_to_add: Optional array of {file_name, link}
 *
 * Example:
 * ```json
 * {
 *   "card_id": 12345,
 *   "text": "Updated requirements based on feedback",
 *   "attachments_to_add": [{
 *     "file_name": "requirements.pdf",
 *     "link": "https://example.com/requirements.pdf"
 *   }]
 * }
 * ```
 */
export const createCardCommentSchema = baseCardSchema.extend({
  text: z
    .string()
    .min(1, 'Comment text is required')
    .refine((val) => val.trim().length > 0, {
      message: 'Comment text cannot be empty or whitespace-only',
    })
    .describe('Comment text content'),
  attachments_to_add: z
    .array(attachmentSchema)
    .optional()
    .describe('Optional file attachments to add'),
});

/**
 * Schema for updating an existing card comment
 *
 * Endpoint: PATCH /cards/{card_id}/comments/{comment_id}
 *
 * Validation:
 * - text: Optional, but if provided must be non-empty after trimming
 * - attachments_to_add: Optional array of {file_name, link}
 * - At least one field must be provided
 *
 * Example:
 * ```json
 * {
 *   "card_id": 12345,
 *   "comment_id": 67890,
 *   "text": "Revised: Updated requirements based on final feedback"
 * }
 * ```
 */
export const updateCardCommentSchema = baseCommentSchema.extend({
  text: z
    .string()
    .optional()
    .refine(
      (val) => {
        // If text is provided, it must not be empty or whitespace-only
        if (val === undefined) return true;
        return val.trim().length > 0;
      },
      {
        message: 'Comment text cannot be empty or whitespace-only',
      }
    )
    .describe('Updated comment text content'),
  attachments_to_add: z
    .array(attachmentSchema)
    .optional()
    .describe('Optional file attachments to add'),
}).refine(
  (data) => {
    // At least one field must be provided for update
    return data.text !== undefined || data.attachments_to_add !== undefined;
  },
  {
    message: 'At least one field (text or attachments_to_add) must be provided for update',
  }
);

/**
 * Schema for deleting a card comment
 *
 * Endpoint: DELETE /cards/{card_id}/comments/{comment_id}
 *
 * No additional parameters beyond card_id and comment_id.
 *
 * Example:
 * ```json
 * {
 *   "card_id": 12345,
 *   "comment_id": 67890
 * }
 * ```
 */
export const deleteCardCommentSchema = baseCommentSchema;

/**
 * Type exports for use in tool handlers
 */
export type CreateCardCommentParams = z.infer<typeof createCardCommentSchema>;
export type UpdateCardCommentParams = z.infer<typeof updateCardCommentSchema>;
export type DeleteCardCommentParams = z.infer<typeof deleteCardCommentSchema>;

/**
 * Tool descriptions for MCP registration
 */
export const commentToolDescriptions = {
  create_card_comment: {
    title: 'Create Card Comment',
    description: 'Create a new comment on a card. Comment text cannot be empty or whitespace-only.',
    inputSchema: createCardCommentSchema.shape,
  },
  update_card_comment: {
    title: 'Update Card Comment',
    description:
      'Update an existing card comment. At least one field (text or attachments) must be provided. Comment text cannot be empty or whitespace-only.',
    inputSchema: updateCardCommentSchema.shape,
  },
  delete_card_comment: {
    title: 'Delete Card Comment',
    description: 'Delete a card comment. This operation cannot be undone.',
    inputSchema: deleteCardCommentSchema.shape,
  },
};
