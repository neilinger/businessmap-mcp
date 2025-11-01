/**
 * Shared constants for bulk operations
 *
 * @remarks
 * Future enhancement: Consider adding MAX_TIMEOUT for concurrent operations
 * to prevent indefinitely hung requests. Current implementation relies on
 * p-limit queue management and underlying axios timeout settings.
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
