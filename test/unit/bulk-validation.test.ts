import { describe, it, expect, beforeEach } from '@jest/globals';
import MockAdapter from 'axios-mock-adapter';
import { BusinessMapClient } from '../src/client/businessmap-client.js';

describe('Bulk Operation Validation', () => {
  let client: BusinessMapClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new BusinessMapClient({
      apiUrl: 'https://test.kanbanize.com/api/v2',
      apiToken: 'test-token',
    });
    mock = new MockAdapter(client['http']);
  });

  describe('Input Validation', () => {
    it('should reject non-array input', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkDeleteCards('not-an-array')
      ).rejects.toThrow(TypeError);
    });

    it('should handle empty array', async () => {
      const result = await client.bulkDeleteCards([]);
      expect(result).toEqual([]);
    });

    it('should reject batch size > 500', async () => {
      const ids = Array.from({ length: 501 }, (_, i) => i + 1);
      await expect(client.bulkDeleteCards(ids)).rejects.toThrow(RangeError);
      await expect(client.bulkDeleteCards(ids)).rejects.toThrow('Maximum batch size is 500');
    });

    it('should reject negative IDs', async () => {
      await expect(client.bulkDeleteCards([1, -2, 3])).rejects.toThrow(RangeError);
      await expect(client.bulkDeleteCards([1, -2, 3])).rejects.toThrow(
        'All card IDs must be positive integers'
      );
    });

    it('should reject zero IDs', async () => {
      await expect(client.bulkDeleteCards([1, 0, 3])).rejects.toThrow(RangeError);
    });

    it('should reject non-integer IDs', async () => {
      await expect(client.bulkDeleteCards([1, 2.5, 3])).rejects.toThrow(RangeError);
    });

    it('should accept valid batch size', async () => {
      const ids = [1, 2, 3];
      mock.onPatch(/\/cards\/\d+/).reply(200, { data: {} });
      mock.onDelete(/\/cards\/\d+/).reply(200);

      const result = await client.bulkDeleteCards(ids);
      expect(result).toHaveLength(3);
      expect(result.every((r: { success: boolean }) => r.success)).toBe(true);
    });
  });

  describe('Rate Limiting', () => {
    it('should use default concurrency limit (10)', async () => {
      const ids = Array.from({ length: 20 }, (_, i) => i + 1);
      mock.onPatch(/\/cards\/\d+/).reply(200, { data: {} });
      mock.onDelete(/\/cards\/\d+/).reply(200);

      const result = await client.bulkDeleteCards(ids);
      expect(result).toHaveLength(20);
    });

    it('should respect custom concurrency limit', async () => {
      const ids = [1, 2, 3, 4, 5];
      mock.onPatch(/\/cards\/\d+/).reply(200, { data: {} });
      mock.onDelete(/\/cards\/\d+/).reply(200);

      const result = await client.bulkDeleteCards(ids, { maxConcurrent: 2 });
      expect(result).toHaveLength(5);
    });
  });

  describe('All Bulk Methods Validation', () => {
    beforeEach(() => {
      mock.onPatch().reply(200, { data: {} });
      mock.onDelete().reply(200);
    });

    it('should validate bulkDeleteCards', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkDeleteCards('invalid')
      ).rejects.toThrow(TypeError);
    });

    it('should validate bulkUpdateCards', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkUpdateCards('invalid', {})
      ).rejects.toThrow(TypeError);
    });

    it('should validate bulkDeleteBoards', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkDeleteBoards('invalid')
      ).rejects.toThrow(TypeError);
    });

    it('should validate bulkUpdateBoards', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkUpdateBoards('invalid', {})
      ).rejects.toThrow(TypeError);
    });

    it('should validate bulkArchiveWorkspaces', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkArchiveWorkspaces('invalid')
      ).rejects.toThrow(TypeError);
    });

    it('should validate bulkUpdateWorkspaces', async () => {
      await expect(
        // @ts-expect-error Testing invalid input
        client.bulkUpdateWorkspaces('invalid', {})
      ).rejects.toThrow(TypeError);
    });
  });

  describe('Backward Compatibility', () => {
    it('should work without options parameter', async () => {
      mock.onPatch(/\/cards\/\d+/).reply(200, { data: {} });
      mock.onDelete(/\/cards\/\d+/).reply(200);

      const result = await client.bulkDeleteCards([1, 2, 3]);
      expect(result).toHaveLength(3);
    });

    it('should work with empty options', async () => {
      mock.onPatch(/\/cards\/\d+/).reply(200, { data: {} });
      mock.onDelete(/\/cards\/\d+/).reply(200);

      const result = await client.bulkDeleteCards([1, 2, 3], {});
      expect(result).toHaveLength(3);
    });
  });
});
