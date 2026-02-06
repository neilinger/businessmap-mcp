/**
 * Card Subtask Schemas
 *
 * Contains schemas for subtask operations within cards.
 * Extracted from card-schemas.ts to reduce TypeScript compilation memory usage.
 *
 * @module card-subtask-schemas
 */

import { z } from 'zod/v4';
import {
  entityIdSchema,
  descriptionSchema,
  optionalEntityId,
  optionalBooleanFlag,
  optionalIsoDate,
  optionalPosition,
} from './security-validation.js';
import { SharedParams } from './shared-params.js';

/**
 * Schema for getting all subtasks of a card
 */
export const getCardSubtasksSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting a specific subtask
 */
export const getCardSubtaskSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  subtask_id: entityIdSchema.describe('The ID of the subtask'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for creating a new subtask
 */
export const createCardSubtaskSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  description: descriptionSchema.describe('The description of the subtask'),
  owner_user_id: optionalEntityId.describe('The owner user ID for the subtask'),
  is_finished: optionalBooleanFlag.describe('Whether the subtask is finished (0 or 1)'),
  deadline: optionalIsoDate.describe('The deadline for the subtask (ISO date string)'),
  position: optionalPosition.describe('The position of the subtask'),
  attachments_to_add: z
    .array(
      z.object({
        file_name: z.string().describe('The name of the file'),
        link: z.string().describe('The link to the file'),
        position: z.number().describe('The position of the attachment'),
      })
    )
    .optional()
    .describe('Attachments to add to the subtask'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for updating an existing subtask
 */
export const updateCardSubtaskSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  subtask_id: entityIdSchema.describe('The ID of the subtask'),
  description: descriptionSchema.optional().describe('The description of the subtask'),
  owner_user_id: optionalEntityId.describe('The owner user ID for the subtask'),
  is_finished: optionalBooleanFlag.describe('Whether the subtask is finished (0 or 1)'),
  deadline: optionalIsoDate.describe('The deadline for the subtask (ISO date string)'),
  position: optionalPosition.describe('The position of the subtask'),
  attachments_to_add: z
    .array(
      z.object({
        file_name: z.string().describe('The name of the file'),
        link: z.string().describe('The link to the file'),
        position: z.number().describe('The position of the attachment'),
      })
    )
    .optional()
    .describe('Attachments to add to the subtask'),
  instance: SharedParams.shape.instance,
});

// Type exports
export type GetCardSubtasksInput = z.infer<typeof getCardSubtasksSchema>;
export type GetCardSubtaskInput = z.infer<typeof getCardSubtaskSchema>;
export type CreateCardSubtaskInput = z.infer<typeof createCardSubtaskSchema>;
export type UpdateCardSubtaskInput = z.infer<typeof updateCardSubtaskSchema>;
