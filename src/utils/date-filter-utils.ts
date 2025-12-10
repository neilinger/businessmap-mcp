/**
 * Date Filter Utilities
 *
 * Provides functions to flatten nested date filter structures into flat parameter objects.
 * Extracted from card-tools.ts to reduce code duplication and improve testability.
 *
 * @module date-filter-utils
 */

/**
 * Date filter type names - defined first for use in derived types
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
 * Type-level utilities for generating flattened date filter keys
 */
type DateFilterType = (typeof DATE_FILTER_TYPES)[number];
type DateFieldSuffix = 'from' | 'from_date' | 'to' | 'to_date';
type FlatDateFilterKey = `${DateFilterType}_${DateFieldSuffix}`;

/**
 * Strongly-typed flattened date filters for API compatibility.
 * Uses TypeScript template literal types to generate all 40 valid keys.
 * Each date filter type has four optional fields: _from, _from_date, _to, _to_date
 *
 * @example
 * ```typescript
 * // Valid keys: 'archived_from', 'archived_to', 'created_from_date', etc.
 * const filters: FlattenedDateFilters = {
 *   archived_from: '2024-01-01',
 *   created_to_date: '2024-12-31'
 * };
 * ```
 */
export type FlattenedDateFilters = Partial<Record<FlatDateFilterKey, string>>;

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
