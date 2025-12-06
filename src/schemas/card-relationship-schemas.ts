/**
 * Card Relationship Schemas
 *
 * Contains schemas for parent/child relationships and card hierarchy operations.
 * Extracted from card-schemas.ts to reduce TypeScript compilation memory usage.
 *
 * @module card-relationship-schemas
 */

import { z } from 'zod/v4';
import { entityIdSchema } from './security-validation.js';
import { SharedParams } from './shared-params.js';

/**
 * Schema for getting all parent cards
 */
export const getCardParentsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting a specific parent card relationship
 */
export const getCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for adding a parent card relationship
 */
export const addCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for removing a parent card relationship
 */
export const removeCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting the parent graph of a card
 */
export const getCardParentGraphSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

/**
 * Schema for getting all children of a card
 */
export const getCardChildrenSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

// Type exports
export type GetCardParentsInput = z.infer<typeof getCardParentsSchema>;
export type GetCardParentInput = z.infer<typeof getCardParentSchema>;
export type AddCardParentInput = z.infer<typeof addCardParentSchema>;
export type RemoveCardParentInput = z.infer<typeof removeCardParentSchema>;
export type GetCardParentGraphInput = z.infer<typeof getCardParentGraphSchema>;
export type GetCardChildrenInput = z.infer<typeof getCardChildrenSchema>;
