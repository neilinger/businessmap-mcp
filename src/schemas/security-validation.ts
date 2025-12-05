import { z } from 'zod';

/**
 * Security-focused validation utilities for MCP server input validation
 *
 * These validators implement defense-in-depth security practices:
 * - String length limits to prevent DoS attacks
 * - Number range validation to prevent integer overflow and invalid IDs
 * - Array size limits to prevent resource exhaustion
 * - Pattern validation to prevent injection attacks
 * - Sanitization of user inputs
 */

// ============================================================================
// Security Constants
// ============================================================================

export const SECURITY_LIMITS = {
  // String lengths (based on reasonable business limits)
  MIN_NAME_LENGTH: 1,
  MAX_NAME_LENGTH: 255,
  MAX_TITLE_LENGTH: 500,
  MAX_DESCRIPTION_LENGTH: 10000,
  MAX_COMMENT_LENGTH: 5000,
  MAX_CUSTOM_ID_LENGTH: 100,
  MAX_EMAIL_LENGTH: 254, // RFC 5321
  MAX_URL_LENGTH: 2048,
  MAX_COLOR_LENGTH: 20, // Hex colors, named colors

  // Number ranges
  MIN_ID: 1,
  MAX_ID: 2147483647, // PostgreSQL integer max
  MIN_PRIORITY: 0,
  MAX_PRIORITY: 10,
  MIN_SIZE: 0,
  MAX_SIZE: 10000,
  MIN_POSITION: 0,
  MAX_POSITION: 999999,

  // Array limits (prevent resource exhaustion)
  MAX_BULK_OPERATIONS: 50,
  MAX_ARRAY_ITEMS: 100,
  MAX_TAG_IDS: 50,
  MAX_USER_IDS: 100,

  // Pagination limits
  MAX_PAGE_SIZE: 1000,
  DEFAULT_PAGE_SIZE: 200,
} as const;

// ============================================================================
// Sanitization Utilities
// ============================================================================

/**
 * Remove null bytes from strings to prevent injection attacks
 */
export const sanitizeString = (str: string): string => {
  return str.replace(/\0/g, '');
};

/**
 * Trim and normalize whitespace
 */
export const normalizeString = (str: string): string => {
  return str.trim().replace(/\s+/g, ' ');
};

// ============================================================================
// Secure Zod Transforms
// ============================================================================

/**
 * Secure string validator with sanitization and length limits
 * Returns ZodEffects due to transforms, which is compatible with Zod schemas
 */
export const secureString = (options: {
  minLength?: number;
  maxLength?: number;
  trim?: boolean;
  normalize?: boolean;
  pattern?: RegExp;
  errorMessage?: string;
}) => {
  const {
    minLength = 0,
    maxLength = SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH,
    trim = true,
    normalize = false,
    pattern,
    errorMessage,
  } = options;

  let schema = z.string();

  if (minLength > 0) {
    schema = schema.min(minLength, {
      message: errorMessage || `Must be at least ${minLength} characters`,
    });
  }

  schema = schema.max(maxLength, {
    message: errorMessage || `Must not exceed ${maxLength} characters`,
  });

  if (pattern) {
    schema = schema.regex(pattern, {
      message: errorMessage || 'Invalid format',
    });
  }

  // Apply sanitization transforms
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let transformedSchema: any = schema.transform(sanitizeString);

  if (trim) {
    transformedSchema = transformedSchema.transform((s: string) => s.trim());
  }

  if (normalize) {
    transformedSchema = transformedSchema.transform(normalizeString);
  }

  return transformedSchema;
};

/**
 * Secure positive integer validator with range limits
 */
export const securePositiveInt = (options?: {
  min?: number;
  max?: number;
  errorMessage?: string;
}) => {
  const {
    min = SECURITY_LIMITS.MIN_ID,
    max = SECURITY_LIMITS.MAX_ID,
    errorMessage,
  } = options || {};

  // Use z.coerce.number() to handle string inputs from MCP clients
  // Common pattern: MCP/JSON may send "4" instead of 4
  return z.coerce
    .number()
    .int({ message: errorMessage || 'Must be an integer' })
    .min(min, { message: errorMessage || `Must be at least ${min}` })
    .max(max, { message: errorMessage || `Must not exceed ${max}` });
};

/**
 * Secure array validator with size limits
 */
export const secureArray = <T extends z.ZodTypeAny>(
  itemSchema: T,
  options?: {
    minItems?: number;
    maxItems?: number;
    errorMessage?: string;
  }
) => {
  const { minItems = 0, maxItems = SECURITY_LIMITS.MAX_ARRAY_ITEMS, errorMessage } = options || {};

  let schema = z.array(itemSchema);

  if (minItems > 0) {
    schema = schema.min(minItems, {
      message: errorMessage || `Must have at least ${minItems} items`,
    });
  }

  schema = schema.max(maxItems, {
    message: errorMessage || `Must not exceed ${maxItems} items`,
  });

  return schema;
};

// ============================================================================
// Common Secure Field Validators
// ============================================================================

/**
 * Validates entity IDs (board_id, card_id, workspace_id, etc.)
 */
export const entityIdSchema = securePositiveInt({
  min: SECURITY_LIMITS.MIN_ID,
  max: SECURITY_LIMITS.MAX_ID,
  errorMessage: 'Invalid ID',
});

/**
 * Validates entity names (board name, workspace name, etc.)
 */
export const entityNameSchema = secureString({
  minLength: SECURITY_LIMITS.MIN_NAME_LENGTH,
  maxLength: SECURITY_LIMITS.MAX_NAME_LENGTH,
  trim: true,
  normalize: true,
});

/**
 * Validates card/task titles
 */
export const titleSchema = secureString({
  minLength: SECURITY_LIMITS.MIN_NAME_LENGTH,
  maxLength: SECURITY_LIMITS.MAX_TITLE_LENGTH,
  trim: true,
});

/**
 * Validates descriptions
 */
export const descriptionSchema = secureString({
  minLength: 0,
  maxLength: SECURITY_LIMITS.MAX_DESCRIPTION_LENGTH,
  trim: true,
});

/**
 * Validates comments
 */
export const commentSchema = secureString({
  minLength: 1,
  maxLength: SECURITY_LIMITS.MAX_COMMENT_LENGTH,
  trim: true,
});

/**
 * Validates custom IDs
 */
export const customIdSchema = secureString({
  minLength: 1,
  maxLength: SECURITY_LIMITS.MAX_CUSTOM_ID_LENGTH,
  trim: true,
});

/**
 * Validates email addresses
 */
export const emailSchema = secureString({
  minLength: 3,
  maxLength: SECURITY_LIMITS.MAX_EMAIL_LENGTH,
  trim: true,
  pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  errorMessage: 'Invalid email format',
});

/**
 * Validates URLs
 */
export const urlSchema = secureString({
  minLength: 1,
  maxLength: SECURITY_LIMITS.MAX_URL_LENGTH,
  trim: true,
  pattern: /^https?:\/\/.+/,
  errorMessage: 'Must be a valid HTTP(S) URL',
});

/**
 * Validates hex color codes or named colors
 */
export const colorSchema = secureString({
  minLength: 3,
  maxLength: SECURITY_LIMITS.MAX_COLOR_LENGTH,
  trim: true,
  pattern: /^(#[0-9A-Fa-f]{6}|#[0-9A-Fa-f]{3}|[a-z]+)$/,
  errorMessage: 'Must be a valid color (hex or name)',
});

/**
 * Validates ISO date strings
 */
export const isoDateSchema = secureString({
  minLength: 10,
  maxLength: 30,
  trim: true,
  pattern: /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/,
  errorMessage: 'Must be a valid ISO date string',
});

/**
 * Validates priority levels
 */
export const prioritySchema = securePositiveInt({
  min: SECURITY_LIMITS.MIN_PRIORITY,
  max: SECURITY_LIMITS.MAX_PRIORITY,
  errorMessage: 'Priority must be between 0 and 10',
});

/**
 * Validates card size/points
 */
export const sizeSchema = securePositiveInt({
  min: SECURITY_LIMITS.MIN_SIZE,
  max: SECURITY_LIMITS.MAX_SIZE,
  errorMessage: 'Size must be between 0 and 10000',
});

/**
 * Validates position values
 */
export const positionSchema = securePositiveInt({
  min: SECURITY_LIMITS.MIN_POSITION,
  max: SECURITY_LIMITS.MAX_POSITION,
  errorMessage: 'Position must be between 0 and 999999',
});

/**
 * Validates pagination page numbers
 */
export const pageNumberSchema = securePositiveInt({
  min: 1,
  max: 10000,
  errorMessage: 'Page number must be between 1 and 10000',
});

/**
 * Validates pagination page sizes
 */
export const pageSizeSchema = securePositiveInt({
  min: 1,
  max: SECURITY_LIMITS.MAX_PAGE_SIZE,
  errorMessage: `Page size must be between 1 and ${SECURITY_LIMITS.MAX_PAGE_SIZE}`,
});

/**
 * Validates arrays of entity IDs
 */
export const entityIdArraySchema = secureArray(entityIdSchema, {
  minItems: 1,
  maxItems: SECURITY_LIMITS.MAX_ARRAY_ITEMS,
  errorMessage: `Array must contain 1-${SECURITY_LIMITS.MAX_ARRAY_ITEMS} valid IDs`,
});

/**
 * Validates boolean flags (0 or 1)
 */
export const booleanFlagSchema = z
  .number()
  .int()
  .min(0)
  .max(1)
  .transform((val) => val as 0 | 1);

// ============================================================================
// Bulk Operation Validators
// ============================================================================

/**
 * Validates resource IDs for bulk operations (stricter limits)
 */
export const bulkResourceIdsSchema = secureArray(entityIdSchema, {
  minItems: 1,
  maxItems: SECURITY_LIMITS.MAX_BULK_OPERATIONS,
  errorMessage: `Bulk operations limited to ${SECURITY_LIMITS.MAX_BULK_OPERATIONS} items`,
});

// ============================================================================
// Optional Validators (with .optional())
// ============================================================================

// Optional field validators
export const optionalEntityId = entityIdSchema.optional();
export const optionalEntityName = entityNameSchema.optional();
export const optionalTitle = titleSchema.optional();
export const optionalDescription = descriptionSchema.optional();
export const optionalComment = commentSchema.optional();
export const optionalCustomId = customIdSchema.optional();
export const optionalEmail = emailSchema.optional();
export const optionalUrl = urlSchema.optional();
export const optionalColor = colorSchema.optional();
export const optionalIsoDate = isoDateSchema.optional();
export const optionalPriority = prioritySchema.optional();
export const optionalSize = sizeSchema.optional();
export const optionalPosition = positionSchema.optional();
export const optionalPageNumber = pageNumberSchema.optional();
export const optionalPageSize = pageSizeSchema.optional();
export const optionalBooleanFlag = booleanFlagSchema.optional();
