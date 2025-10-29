/**
 * Shared constants for bulk operations
 */
export const BULK_OPERATION_DEFAULTS = {
  /**
   * Maximum number of items allowed in a single bulk operation
   */
  MAX_BATCH_SIZE: 500,

  /**
   * Maximum number of concurrent API requests for bulk operations
   */
  MAX_CONCURRENT: 10,
} as const;
