import { describe, it, expect } from '@jest/globals';
import { flattenDateFilters, DateFilters } from '../../src/utils/date-filter-utils.js';

describe('flattenDateFilters', () => {
  it('should return empty object for undefined input', () => {
    expect(flattenDateFilters(undefined)).toEqual({});
  });

  it('should return empty object for empty input', () => {
    expect(flattenDateFilters({})).toEqual({});
  });

  it('should flatten a single date filter type', () => {
    const input: DateFilters = {
      archived: {
        from: '2024-01-01',
        to: '2024-12-31',
      },
    };

    expect(flattenDateFilters(input)).toEqual({
      archived_from: '2024-01-01',
      archived_to: '2024-12-31',
    });
  });

  it('should flatten multiple date filter types', () => {
    const input: DateFilters = {
      archived: { from: '2024-01-01' },
      created: { from_date: '2024-06-01', to_date: '2024-06-30' },
    };

    expect(flattenDateFilters(input)).toEqual({
      archived_from: '2024-01-01',
      created_from_date: '2024-06-01',
      created_to_date: '2024-06-30',
    });
  });

  it('should handle all four date range fields', () => {
    const input: DateFilters = {
      deadline: {
        from: '2024-01-01',
        from_date: '2024-01-02',
        to: '2024-12-31',
        to_date: '2024-12-30',
      },
    };

    expect(flattenDateFilters(input)).toEqual({
      deadline_from: '2024-01-01',
      deadline_from_date: '2024-01-02',
      deadline_to: '2024-12-31',
      deadline_to_date: '2024-12-30',
    });
  });

  it('should skip undefined values within date ranges', () => {
    const input: DateFilters = {
      last_modified: {
        from: '2024-01-01',
        // to is undefined
      },
    };

    const result = flattenDateFilters(input);
    expect(result).toEqual({
      last_modified_from: '2024-01-01',
    });
    expect(result).not.toHaveProperty('last_modified_to');
  });

  it('should handle all 10 date filter types', () => {
    const input: DateFilters = {
      archived: { from: 'a' },
      created: { from: 'b' },
      deadline: { from: 'c' },
      discarded: { from: 'd' },
      first_end: { from: 'e' },
      first_start: { from: 'f' },
      in_current_position_since: { from: 'g' },
      last_end: { from: 'h' },
      last_modified: { from: 'i' },
      last_start: { from: 'j' },
    };

    const result = flattenDateFilters(input);

    expect(result).toEqual({
      archived_from: 'a',
      created_from: 'b',
      deadline_from: 'c',
      discarded_from: 'd',
      first_end_from: 'e',
      first_start_from: 'f',
      in_current_position_since_from: 'g',
      last_end_from: 'h',
      last_modified_from: 'i',
      last_start_from: 'j',
    });
  });

  it('should not include empty date filter objects', () => {
    const input: DateFilters = {
      archived: {},
      created: { from: '2024-01-01' },
    };

    expect(flattenDateFilters(input)).toEqual({
      created_from: '2024-01-01',
    });
  });
});
