import { z } from 'zod/v4';
import {
  optionalIsoDate,
  optionalPageNumber,
  optionalPageSize,
  entityIdSchema,
  entityNameSchema,
  urlSchema,
  positionSchema,
  SECURITY_LIMITS,
  secureArray,
} from './security-validation.js';

// Common schemas that are reused across different modules

// Date and time filters with validation
export const dateTimeFilterSchema = {
  from: optionalIsoDate.describe('Start date/time filter (ISO 8601 format)'),
  from_date: optionalIsoDate.describe('Start date filter (ISO 8601 format)'),
  to: optionalIsoDate.describe('End date/time filter (ISO 8601 format)'),
  to_date: optionalIsoDate.describe('End date filter (ISO 8601 format)'),
};

// Pagination with security limits
export const paginationSchema = {
  page: optionalPageNumber.describe(
    'Results are always paginated and returned in pages. This parameter controls which page is returned'
  ),
  per_page: optionalPageSize.describe(
    `Controls how many results are returned per page. The default value is ${SECURITY_LIMITS.DEFAULT_PAGE_SIZE} and the maximum is ${SECURITY_LIMITS.MAX_PAGE_SIZE}`
  ),
};

// ID array filters with size limits
export const idArrayFilters = {
  board_ids: secureArray(entityIdSchema, {
    minItems: 0,
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('A list of the board ids for which you want to get the results'),
  column_ids: secureArray(entityIdSchema, {
    minItems: 0,
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe(
      'A list of the column ids for which you want to get the results. Applied only if state parameter is active'
    ),
  lane_ids: secureArray(entityIdSchema, {
    minItems: 0,
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe(
      'A list of the lane IDs for which you want to filter results. Applied only if state parameter is active. ' +
        'Note: lane_id values may be required by specific board configurations. Use get_lanes tool or BusinessMapClient.getLanes() to fetch available lanes.'
    ),
  workflow_ids: secureArray(entityIdSchema, {
    minItems: 0,
    maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  })
    .optional()
    .describe('A list of the workflows ids for which you want to get the results'),
};

// File attachment schema with validation
export const fileAttachmentSchema = z.object({
  file_name: entityNameSchema.describe('The name of the file'),
  link: urlSchema.describe('The URL to the file'),
  position: positionSchema.describe('The position of the attachment'),
});

// File attachment with ID schema
export const fileAttachmentWithIdSchema = z.object({
  id: entityIdSchema.describe('The ID of the file attachment'),
  file_name: entityNameSchema.describe('The name of the file'),
  link: urlSchema.describe('The URL to the file'),
  position: positionSchema.describe('The position of the attachment'),
});
