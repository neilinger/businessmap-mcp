import { z } from 'zod';
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
  optionalIsoDate,
  optionalPriority,
  optionalSize,
  optionalPosition,
  optionalBooleanFlag,
  secureArray,
  SECURITY_LIMITS,
} from './security-validation.js';
import { SharedParams, PlacementSchema, MetadataSchema, OwnersSchema } from './shared-params.js';

// Date range filter schema (reusable)
const dateRangeSchema = z
  .object({
    from: z.string().optional(),
    from_date: z.string().optional(),
    to: z.string().optional(),
    to_date: z.string().optional(),
  })
  .optional();

// Compressed list_cards schema - token optimized (T025)
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

// Schema básico para get card
export const getCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

// Schema para tamanho do card
export const cardSizeSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  size: optionalSize.describe('The new size/points for the card'),
  instance: SharedParams.shape.instance,
});

// Schema para comentários do card
export const cardCommentsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

// Schema para obter um comentário específico
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

// Schema para get card types (sem parâmetros)
export const getCardTypesSchema = z.object({
  instance: SharedParams.shape.instance,
});

// Schema para buscar histórico do card
export const getCardHistorySchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  outcome_id: entityIdSchema.describe('The ID of the outcome'),
  instance: SharedParams.shape.instance,
});

// Schema para buscar outcomes do card
export const getCardOutcomesSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

// Schema para buscar linked cards do card
export const getCardLinkedCardsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

// Schemas para subtasks
export const getCardSubtasksSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

export const getCardSubtaskSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  subtask_id: entityIdSchema.describe('The ID of the subtask'),
  instance: SharedParams.shape.instance,
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
  instance: SharedParams.shape.instance,
});

export const stickerSchema = z.object({
  sticker_id: z.number(),
  if_not_present: z.number(),
  instance: SharedParams.shape.instance,
});

export const customFieldValueSchema = z.object({
  value_id: z.number(),
  position: z.number(),
  instance: SharedParams.shape.instance,
});

export const customFieldCardSchema = z.object({
  selected_card_id: z.number(),
  position: z.number(),
  instance: SharedParams.shape.instance,
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
  instance: SharedParams.shape.instance,
});

export const subtaskSchema = z.object({
  description: z.string(),
  owner_user_id: z.number(),
  is_finished: z.number(),
  deadline: z.string(),
  position: z.number(),
  attachments_to_add: z.array(fileAttachmentSchema),
  instance: SharedParams.shape.instance,
});

export const annotationSchema = z.object({
  comment_id: z.string(),
  thread_id: z.string(),
  content: z.string(),
  instance: SharedParams.shape.instance,
});

export const cardLinkSchema = z.object({
  linked_card_id: z.number(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
  instance: SharedParams.shape.instance,
});

export const newCardLinkSchema = z.object({
  linked_new_card_reference: z.string(),
  link_type: z.string(),
  linked_card_position: z.number(),
  card_position: z.number(),
  instance: SharedParams.shape.instance,
});

export const cardPropertyToCopySchema = z.object({
  properties: z.array(z.string()),
  card_id: z.number(),
  instance: SharedParams.shape.instance,
});

export const customFieldToCopySchema = z.object({
  field_ids: z.array(z.number()),
  card_id: z.number(),
  instance: SharedParams.shape.instance,
});

export const columnChecklistItemSchema = z.object({
  item_id: z.number(),
  comment: z.string(),
  instance: SharedParams.shape.instance,
});

// Compressed schema for card creation - using nested structures to reduce tokens
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
      discard_comment: optionalComment.describe('Discard comment'),
      exceeding_reason: optionalComment.describe('Exceeding reason'),
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

// Schema para movimentação de cards
export const moveCardSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card to move'),
  column_id: entityIdSchema.describe('The target column ID'),
  lane_id: optionalEntityId.describe('Optional target lane ID'),
  position: optionalPosition.describe('Optional position in the column'),
  instance: SharedParams.shape.instance,
});

const arr = (s: any, m: number) => secureArray(s, { maxItems: m }).optional();
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

// Schemas para parent cards
export const getCardParentsSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

export const getCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

export const addCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

export const removeCardParentSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  parent_card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
});

export const getCardParentGraphSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the card'),
  instance: SharedParams.shape.instance,
});

export const getCardChildrenSchema = z.object({
  card_id: entityIdSchema.describe('The ID of the parent card'),
  instance: SharedParams.shape.instance,
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
  instance: SharedParams.shape.instance,
});
