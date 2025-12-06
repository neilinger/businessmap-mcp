/**
 * Card Schemas - Backward Compatibility Module
 *
 * This file re-exports all card-related schemas from their dedicated modules.
 * The schemas have been split into smaller files to reduce TypeScript compilation
 * memory usage and improve maintainability.
 *
 * For new code, prefer importing from the specific modules:
 * - card-query-schemas.ts - List/filter operations
 * - card-mutation-schemas.ts - Create/update/delete operations
 * - card-subtask-schemas.ts - Subtask operations
 * - card-comment-schemas.ts - Comment operations
 * - card-relationship-schemas.ts - Parent/child relationships
 *
 * @module card-schemas
 * @see https://github.com/neilinger/businessmap-mcp/issues/39
 */

// Re-export query schemas
export {
  listCardsSchema,
  getCardSchema,
  getCardTypesSchema,
  getCardHistorySchema,
  getCardOutcomesSchema,
  getCardLinkedCardsSchema,
} from './card-query-schemas.js';

// Re-export mutation schemas
export {
  createCardSchema,
  updateCardSchema,
  moveCardSchema,
  deleteCardSchema,
  cardSizeSchema,
  // Helper schemas used in mutations
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
} from './card-mutation-schemas.js';

// Re-export subtask schemas
export {
  getCardSubtasksSchema,
  getCardSubtaskSchema,
  createCardSubtaskSchema,
} from './card-subtask-schemas.js';

// Re-export comment schemas
export {
  cardCommentsSchema,
  getCardCommentSchema,
  createCardCommentSchema,
  updateCardCommentSchema,
  deleteCardCommentSchema,
} from './card-comment-schemas.js';

// Re-export relationship schemas
export {
  getCardParentsSchema,
  getCardParentSchema,
  addCardParentSchema,
  removeCardParentSchema,
  getCardParentGraphSchema,
  getCardChildrenSchema,
} from './card-relationship-schemas.js';

// Re-export types for TypeScript consumers
export type {
  ListCardsInput,
  GetCardInput,
  GetCardTypesInput,
  GetCardHistoryInput,
  GetCardOutcomesInput,
  GetCardLinkedCardsInput,
} from './card-query-schemas.js';

export type {
  CreateCardInput,
  UpdateCardInput,
  MoveCardInput,
  DeleteCardInput,
  CardSizeInput,
} from './card-mutation-schemas.js';

export type {
  GetCardSubtasksInput,
  GetCardSubtaskInput,
  CreateCardSubtaskInput,
} from './card-subtask-schemas.js';

export type {
  CardCommentsInput,
  GetCardCommentInput,
  CreateCardCommentInput,
  UpdateCardCommentInput,
  DeleteCardCommentInput,
} from './card-comment-schemas.js';

export type {
  GetCardParentsInput,
  GetCardParentInput,
  AddCardParentInput,
  RemoveCardParentInput,
  GetCardParentGraphInput,
  GetCardChildrenInput,
} from './card-relationship-schemas.js';
