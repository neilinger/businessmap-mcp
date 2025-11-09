import { z } from 'zod';
import { instanceParameterSchema } from './common-schemas.js';
import {
  fileAttachmentSchema,
  fileAttachmentWithIdSchema,
  idArrayFilters,
  paginationSchema,
} from './common-schemas.js';
import {
  entityIdSchema,
  titleSchema,
  descriptionSchema,
  optionalEntityId,
  optionalTitle,
  optionalDescription,
  optionalComment,
  optionalCustomId,
  optionalEmail,
  optionalUrl,
  optionalColor,
  optionalIsoDate,
  optionalPriority,
  optionalSize,
  optionalPosition,
  optionalBooleanFlag,
  secureArray,
  SECURITY_LIMITS,
} from './security-validation.js';

// List cards schema - extraído do card-tools.ts
export const listCardsSchema = z.object({
  board_id: entityIdSchema.describe('The ID of the board'),

  // Date and time filters usando o schema comum e estendendo para casos específicos
  archived_from: optionalIsoDate.describe(
    'The first date and time of archived cards for which you want results'
  ),
  archived_from_date: z
    .string()
    .optional()
    .describe('The first date of archived cards for which you want results'),
  archived_to: z
    .string()
    .optional()
    .describe('The last date and time of archived cards for which you want results'),
  archived_to_date: z
    .string()
    .optional()
    .describe('The last date of archived cards for which you want results'),

  created_from: z
    .string()
    .optional()
    .describe('The first date and time of created cards for which you want results'),
  created_from_date: z
    .string()
    .optional()
    .describe('The first date of created cards for which you want results'),
  created_to: z
    .string()
    .optional()
    .describe('The last date and time of created cards for which you want results'),
  created_to_date: z
    .string()
    .optional()
    .describe('The last date of created cards for which you want results'),

  deadline_from: z
    .string()
    .optional()
    .describe('The first date and time of deadline cards for which you want results'),
  deadline_from_date: z
    .string()
    .optional()
    .describe('The first date of deadline cards for which you want results'),
  deadline_to: z
    .string()
    .optional()
    .describe('The last date and time of deadline cards for which you want results'),
  deadline_to_date: z
    .string()
    .optional()
    .describe('The last date of deadline cards for which you want results'),

  discarded_from: z
    .string()
    .optional()
    .describe('The first date and time of discarded cards for which you want results'),
  discarded_from_date: z
    .string()
    .optional()
    .describe('The first date of discarded cards for which you want results'),
  discarded_to: z
    .string()
    .optional()
    .describe('The last date and time of discarded cards for which you want results'),
  discarded_to_date: z
    .string()
    .optional()
    .describe('The last date of discarded cards for which you want results'),

  first_end_from: z
    .string()
    .optional()
    .describe('The first date and time of first end cards for which you want results'),
  first_end_from_date: z
    .string()
    .optional()
    .describe('The first date of first end cards for which you want results'),
  first_end_to: z
    .string()
    .optional()
    .describe('The last date and time of first end cards for which you want results'),
  first_end_to_date: z
    .string()
    .optional()
    .describe('The last date of first end cards for which you want results'),

  first_start_from: z
    .string()
    .optional()
    .describe('The first date and time of first start cards for which you want results'),
  first_start_from_date: z
    .string()
    .optional()
    .describe('The first date of first start cards for which you want results'),
  first_start_to: z
    .string()
    .optional()
    .describe('The last date and time of first start cards for which you want results'),
  first_start_to_date: z
    .string()
    .optional()
    .describe('The last date of first start cards for which you want results'),

  in_current_position_since_from: z
    .string()
    .optional()
    .describe(
      'The first date and time of in current position since cards for which you want results'
    ),
  in_current_position_since_from_date: z
    .string()
    .optional()
    .describe('The first date of in current position since cards for which you want results'),
  in_current_position_since_to: z
    .string()
    .optional()
    .describe(
      'The last date and time of in current position since cards for which you want results'
    ),
  in_current_position_since_to_date: z
    .string()
    .optional()
    .describe('The last date of in current position since cards for which you want results'),

  last_end_from: z
    .string()
    .optional()
    .describe('The first date and time of last end cards for which you want results'),
  last_end_from_date: z
    .string()
    .optional()
    .describe('The first date of last end cards for which you want results'),
  last_end_to: z
    .string()
    .optional()
    .describe('The last date and time of last end cards for which you want results'),
  last_end_to_date: z
    .string()
    .optional()
    .describe('The last date of last end cards for which you want results'),

  last_modified_from: z
    .string()
    .optional()
    .describe('The first date and time of last modified cards for which you want results'),
  last_modified_from_date: z
    .string()
    .optional()
    .describe('The first date of last modified cards for which you want results'),
  last_modified_to: z
    .string()
    .optional()
    .describe('The last date and time of last modified cards for which you want results'),
  last_modified_to_date: z
    .string()
    .optional()
    .describe('The last date of last modified cards for which you want results'),

  last_start_from: z
    .string()
    .optional()
    .describe('The first date and time of last start cards for which you want results'),
  last_start_from_date: z
    .string()
    .optional()
    .describe('The first date of last start cards for which you want results'),
  last_start_to: z
    .string()
    .optional()
    .describe('The last date and time of last start cards for which you want results'),
  last_start_to_date: z
    .string()
    .optional()
    .describe('The last date of last start cards for which you want results'),

  // ID filters (arrays) - usando schemas comuns e estendendo
  ...idArrayFilters,
  card_ids: z.array(z.number()).optional().describe('A list of the card ids that you want to get'),
  last_column_ids: z
    .array(z.number())
    .optional()
    .describe(
      'A list of the last column ids for which you want to get the results. Applied only if state parameter is archived or discarded'
    ),
  last_lane_ids: z
    .array(z.number())
    .optional()
    .describe(
      'A list of the last lane ids for which you want to get the results. Applied only if state parameter is archived or discarded'
    ),
  owner_user_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the user ids of assignees for which you want to get the results'),
  priorities: z
    .array(z.number())
    .optional()
    .describe('A list of the priorities for which you want to get the results'),
  reason_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the reasons ids for which you want to get the results'),
  sections: z
    .array(z.number())
    .optional()
    .describe('A list of the sections for which you want to get the results'),
  sizes: z
    .array(z.number())
    .optional()
    .describe('A list of the sizes for which you want to get the results'),
  type_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the type ids for which you want to get the results'),
  version_ids: z
    .array(z.number())
    .optional()
    .describe('A list of the version ids for which you want to get the results'),

  // String array filters
  colors: z
    .array(z.string())
    .optional()
    .describe('A list of the colors for which you want to get the results'),
  custom_ids: z
    .array(z.string())
    .optional()
    .describe('A list of the custom ids for which you want to get the results'),

  // Configuration options
  include_logged_time_for_child_cards: z
    .number()
    .optional()
    .describe('Controls whether this include logged times for child cards (0 or 1)'),
  include_logged_time_for_subtasks: z
    .number()
    .optional()
    .describe('Controls whether this include logged times for subtasks (0 or 1)'),

  // Pagination usando schema comum
  ...paginationSchema,

  // Legacy compatibility
  assignee_user_id: z
    .number()
    .optional()
    .describe('Optional assignee user ID to filter cards (legacy parameter)'),
  tag_ids: z
    .array(z.number())
    .optional()
    .describe('Optional array of tag IDs to filter cards (legacy parameter)'),
  ...instanceParameterSchema,
});

// Schema básico para get card
export const getCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

// Schema para tamanho do card
export const cardSizeSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  size: optionalSize.describe('The new size/points for the card'),
  ...instanceParameterSchema,
});

// Schema para comentários do card
export const cardCommentsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

// Schema para obter um comentário específico
export const getCardCommentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  comment_id: entityIdSchema.describe('The ID of the comment'),
  ...instanceParameterSchema,
});

// Schema para get card types (sem parâmetros)
export const getCardTypesSchema = z.object({
  ...instanceParameterSchema,
});

// Schema para buscar histórico do card
export const getCardHistorySchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  outcome_id: entityIdSchema.describe('The ID of the outcome'),
  ...instanceParameterSchema,
});

// Schema para buscar outcomes do card
export const getCardOutcomesSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

// Schema para buscar linked cards do card
export const getCardLinkedCardsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

// Schemas para subtasks
export const getCardSubtasksSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

export const getCardSubtaskSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  subtask_id: entityIdSchema.describe('The ID of the subtask'),
  ...instanceParameterSchema,
});

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
});

// Schemas complexos para criação de cards
export const blockReasonSchema = z.object({
  reason_id: z.number(),
  comment: z.string(),
  users: z.array(z.number()),
  date: z.string(),
  cards: z.array(z.number()),
  ...instanceParameterSchema,
});

export const stickerSchema = z.object({
  sticker_id: z.number(),
  if_not_present: z.number(),
  ...instanceParameterSchema,
});

export const customFieldValueSchema = z.object({
  value_id: z.number(),
  position: z.number(),
  ...instanceParameterSchema,
});

export const customFieldCardSchema = z.object({
  selected_card_id: z.number(),
  position: z.number(),
  ...instanceParameterSchema,
});

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
  ...instanceParameterSchema,
});

export const subtaskSchema = z.object({
  description: z.string(),
  owner_user_id: z.number(),
  is_finished: z.number(),
  deadline: z.string(),
  position: z.number(),
  attachments_to_add: z.array(fileAttachmentSchema),
  ...instanceParameterSchema,
});

export const annotationSchema = z.object({
  comment_id: z.string(),
  thread_id: z.string(),
  content: z.string(),
  ...instanceParameterSchema,
});

export const cardLinkSchema = z.object({
  linked_card_id: z.number(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
  ...instanceParameterSchema,
});

export const newCardLinkSchema = z.object({
  linked_new_card_reference: z.string(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
  ...instanceParameterSchema,
});

export const cardPropertyToCopySchema = z.object({
  properties: z.array(z.string()),
  card_id: z.number(),
  ...instanceParameterSchema,
});

export const customFieldToCopySchema = z.object({
  field_ids: z.array(z.number()),
  card_id: z.number(),
  ...instanceParameterSchema,
});

export const columnChecklistItemSchema = z.object({
  item_id: z.number(),
  comment: z.string(),
  ...instanceParameterSchema,
});

// Schema principal para criação de cards
export const createCardSchema = z.object({
  title: titleSchema.describe('The title of the card'),
  column_id: entityIdSchema.describe('The ID of the column'),

  // Campos opcionais básicos
  template_id: optionalEntityId.describe('Optional template ID'),
  lane_id: optionalEntityId.describe('Optional lane ID'),
  position: optionalPosition.describe('Optional position'),
  track: optionalEntityId.describe('Optional track'),
  description: optionalDescription.describe('Optional description for the card'),
  custom_id: optionalCustomId.describe('Optional custom ID'),
  owner_user_id: optionalEntityId.describe('Optional owner user ID'),
  type_id: optionalEntityId.describe('Optional card type ID'),
  size: optionalSize.describe('Optional card size/points'),
  priority: optionalPriority.describe('Optional priority level'),
  color: optionalColor.describe('Optional color'),
  deadline: optionalIsoDate.describe('Optional deadline (ISO date string)'),
  reference: optionalCustomId.describe('Optional reference'),

  // Datas
  planned_start_date_sync_type: optionalBooleanFlag.describe(
    'Optional planned start date sync type'
  ),
  planned_start_date: optionalIsoDate.describe('Optional planned start date'),
  planned_end_date_sync_type: optionalBooleanFlag.describe('Optional planned end date sync type'),
  planned_end_date: optionalIsoDate.describe('Optional planned end date'),
  actual_start_time: optionalIsoDate.describe('Optional actual start time'),
  actual_end_time: optionalIsoDate.describe('Optional actual end time'),
  created_at: optionalIsoDate.describe('Optional creation date'),
  archived_at: optionalIsoDate.describe('Optional archived date'),
  discarded_at: optionalIsoDate.describe('Optional discarded date'),

  // Status e flags
  is_archived: optionalBooleanFlag.describe('Optional archived flag'),
  is_discarded: optionalBooleanFlag.describe('Optional discarded flag'),
  watch: optionalBooleanFlag.describe('Optional watch flag'),
  version_id: optionalEntityId.describe('Optional version ID'),

  // Razões e comentários
  block_reason: blockReasonSchema.optional().describe('Optional block reason'),
  discard_reason_id: optionalEntityId.describe('Optional discard reason ID'),
  discard_comment: optionalComment.describe('Optional discard comment'),
  exceeding_reason: optionalComment.describe('Optional exceeding reason'),

  // Reporter
  reporter_user_id: optionalEntityId.describe('Optional reporter user ID'),
  reporter_email: optionalEmail.describe('Optional reporter email'),

  // Arrays de relacionamentos (with size limits)
  card_properties_to_copy: secureArray(cardPropertyToCopySchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional card properties to copy'),
  custom_fields_to_copy: secureArray(customFieldToCopySchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional custom fields to copy'),
  co_owner_ids_to_add: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_USER_IDS,
  })
    .optional()
    .describe('Optional co-owner IDs to add'),
  co_owner_ids_to_remove: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_USER_IDS,
  })
    .optional()
    .describe('Optional co-owner IDs to remove'),
  watcher_ids_to_add: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_USER_IDS,
  })
    .optional()
    .describe('Optional watcher IDs to add'),
  watcher_ids_to_remove: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_USER_IDS,
  })
    .optional()
    .describe('Optional watcher IDs to remove'),
  stickers_to_add: secureArray(stickerSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional stickers to add'),
  tag_ids_to_add: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_TAG_IDS,
  })
    .optional()
    .describe('Optional tag IDs to add'),
  tag_ids_to_remove: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_TAG_IDS,
  })
    .optional()
    .describe('Optional tag IDs to remove'),
  milestone_ids_to_add: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional milestone IDs to add'),
  milestone_ids_to_remove: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional milestone IDs to remove'),

  // Campos customizados e anexos (with size limits)
  custom_fields_to_add_or_update: secureArray(customFieldSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional custom fields to add or update'),
  custom_field_ids_to_remove: secureArray(entityIdSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional custom field IDs to remove'),
  attachments_to_add: secureArray(fileAttachmentSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional attachments to add'),
  cover_image_link: optionalUrl.describe('Optional cover image link'),

  // Subtasks e checklists (with size limits)
  subtasks_to_add: secureArray(subtaskSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional subtasks to add'),
  column_checklist_items_to_check_or_update: secureArray(columnChecklistItemSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional column checklist items to check or update'),

  // Anotações e links (with size limits)
  annotations_to_add: secureArray(annotationSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional annotations to add'),
  links_to_existing_cards_to_add_or_update: secureArray(cardLinkSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional links to existing cards to add or update'),
  links_to_new_cards_to_add: secureArray(newCardLinkSchema, {
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('Optional links to new cards to add'),
  ...instanceParameterSchema,
});

// Schema para movimentação de cards
export const moveCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card to move'),
  column_id: entityIdSchema.describe('The target column ID'),
  lane_id: optionalEntityId.describe('Optional target lane ID'),
  position: optionalPosition.describe('Optional position in the column'),
  ...instanceParameterSchema,
});

// Schema para atualização de cards
export const updateCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card to update'),
  id: optionalEntityId.describe('Alternative ID field'),
  title: optionalTitle.describe('New title for the card'),
  description: optionalDescription.describe('New description for the card'),
  column_id: optionalEntityId.describe('New column ID'),
  lane_id: optionalEntityId.describe('New lane ID'),
  position: optionalPosition.describe('New position'),
  owner_user_id: optionalEntityId.describe('New owner user ID'),
  assignee_user_id: optionalEntityId.describe('New assignee user ID'),
  size: optionalSize.describe('New card size/points'),
  priority: optionalPriority.describe('New priority level'),
  deadline: optionalIsoDate.describe('New deadline (ISO date string)'),
  ...instanceParameterSchema,
});

// Schemas para parent cards
export const getCardParentsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

export const getCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  ...instanceParameterSchema,
});

export const addCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  ...instanceParameterSchema,
});

export const removeCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  ...instanceParameterSchema,
});

export const getCardParentGraphSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  ...instanceParameterSchema,
});

export const getCardChildrenSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the parent card'),
  ...instanceParameterSchema,
});

// Schema para deleção de cards
export const deleteCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card to delete'),
  archive_first: z
    .boolean()
    .optional()
    .default(true)
    .describe(
      'Archive the card before deletion to avoid API errors. Default: true. Set to false only if card is already archived.'
    ),
  ...instanceParameterSchema,
});
