/**
 * Date Filter Utilities
 *
 * Provides functions to flatten nested date filter structures into flat parameter objects.
 * Extracted from card-tools.ts to reduce code duplication and improve testability.
 *
 * @module date-filter-utils
 */

/**
 * Date range with from/to fields
 */
export interface DateRange {
  from?: string;
  from_date?: string;
  to?: string;
  to_date?: string;
}

/**
 * Nested date filters structure (token-optimized format)
 */
export interface DateFilters {
  archived?: DateRange;
  created?: DateRange;
  deadline?: DateRange;
  discarded?: DateRange;
  first_end?: DateRange;
  first_start?: DateRange;
  in_current_position_since?: DateRange;
  last_end?: DateRange;
  last_modified?: DateRange;
  last_start?: DateRange;
}

/**
 * Flattened date filters for API compatibility
 */
export type FlattenedDateFilters = Record<string, string | undefined>;

/**
 * Date filter type names
 */
const DATE_FILTER_TYPES = [
  'archived',
  'created',
  'deadline',
  'discarded',
  'first_end',
  'first_start',
  'in_current_position_since',
  'last_end',
  'last_modified',
  'last_start',
] as const;

/**
 * Flattens nested date filters into flat key-value pairs.
 *
 * Transforms `{ archived: { from: '2024-01-01' } }` into `{ archived_from: '2024-01-01' }`.
 *
 * @param dateFilters - Nested date filter object
 * @returns Flattened object with `{type}_{field}` keys
 *
 * @example
 * ```typescript
 * const nested = {
 *   archived: { from: '2024-01-01', to: '2024-12-31' },
 *   created: { from_date: '2024-06-01' }
 * };
 * const flat = flattenDateFilters(nested);
 * // { archived_from: '2024-01-01', archived_to: '2024-12-31', created_from_date: '2024-06-01' }
 * ```
 */
export function flattenDateFilters(dateFilters: DateFilters | undefined): FlattenedDateFilters {
  if (!dateFilters) {
    return {};
  }

  const result: FlattenedDateFilters = {};

  for (const type of DATE_FILTER_TYPES) {
    const filter = dateFilters[type];
    if (filter) {
      if (filter.from !== undefined) result[`${type}_from`] = filter.from;
      if (filter.from_date !== undefined) result[`${type}_from_date`] = filter.from_date;
      if (filter.to !== undefined) result[`${type}_to`] = filter.to;
      if (filter.to_date !== undefined) result[`${type}_to_date`] = filter.to_date;
    }
  }

  return result;
}
