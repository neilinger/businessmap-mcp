// Import jest globals explicitly for ESM compatibility
import { jest } from '@jest/globals';

// Mock lru-cache before importing CacheManager
jest.unstable_mockModule('lru-cache', () => {
  return {
    default: class MockLRUCache extends Map {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(options?: any) {
        super();
      }
    },
  };
});

describe('CacheManager', () => {
  let CacheManager: any;
  let cache: any;

  beforeAll(async () => {
    const baseClientModule = await import('../../src/client/modules/base-client.js');
    CacheManager = baseClientModule.CacheManager;
  });

  beforeEach(() => {
    cache = new CacheManager(true, 1000); // 1 second TTL for faster tests
  });

  afterEach(() => {
    cache.clear();
  });

  describe('get()', () => {
    it('should execute fetcher on cache miss', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('test-data');
      const result = await cache.get('test-key', fetcher);

      expect(result).toBe('test-data');
      expect(fetcher).toHaveBeenCalledTimes(1);
    });

    it('should return cached value on cache hit', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('test-data');

      // First call - cache miss
      await cache.get('test-key', fetcher);

      // Second call - cache hit
      const result = await cache.get('test-key', fetcher);

      expect(result).toBe('test-data');
      expect(fetcher).toHaveBeenCalledTimes(1); // Only called once
    });

    it('should respect TTL and refetch after expiry', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('test-data');

      // First call
      await cache.get('test-key', fetcher, 100); // 100ms TTL

      // Wait for expiry
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Second call after expiry
      await cache.get('test-key', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2); // Called twice due to expiry
    });

    it('should deduplicate concurrent requests', async () => {
      const fetcher = jest
        .fn<() => Promise<string>>()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(() => resolve('test-data'), 50))
        );

      // Make 3 concurrent requests for the same key
      const [result1, result2, result3] = await Promise.all([
        cache.get('test-key', fetcher),
        cache.get('test-key', fetcher),
        cache.get('test-key', fetcher),
      ]);

      expect(result1).toBe('test-data');
      expect(result2).toBe('test-data');
      expect(result3).toBe('test-data');
      expect(fetcher).toHaveBeenCalledTimes(1); // Only one actual fetch
    });

    it('should bypass cache when disabled', async () => {
      const disabledCache = new CacheManager(false);
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('test-data');

      await disabledCache.get('test-key', fetcher);
      await disabledCache.get('test-key', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2); // Called every time
    });
  });

  describe('invalidate()', () => {
    it('should invalidate cache entry by exact key', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('test-data');

      await cache.get('test-key', fetcher);
      cache.invalidate('test-key');

      // Should refetch after invalidation
      await cache.get('test-key', fetcher);

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should invalidate cache entries by regex pattern', async () => {
      const fetcher1 = jest.fn<() => Promise<string>>().mockResolvedValue('data1');
      const fetcher2 = jest.fn<() => Promise<string>>().mockResolvedValue('data2');
      const fetcher3 = jest.fn<() => Promise<string>>().mockResolvedValue('data3');

      await cache.get('users:all', fetcher1);
      await cache.get('users:123', fetcher2);
      await cache.get('workspaces:all', fetcher3);

      // Invalidate all user-related entries
      cache.invalidate(/^users:/);

      await cache.get('users:all', fetcher1);
      await cache.get('users:123', fetcher2);
      await cache.get('workspaces:all', fetcher3);

      // users entries should be refetched
      expect(fetcher1).toHaveBeenCalledTimes(2);
      expect(fetcher2).toHaveBeenCalledTimes(2);

      // workspaces entry should still be cached
      expect(fetcher3).toHaveBeenCalledTimes(1);
    });
  });

  describe('clear()', () => {
    it('should clear all cache entries', async () => {
      const fetcher1 = jest.fn<() => Promise<string>>().mockResolvedValue('data1');
      const fetcher2 = jest.fn<() => Promise<string>>().mockResolvedValue('data2');

      await cache.get('key1', fetcher1);
      await cache.get('key2', fetcher2);

      cache.clear();

      await cache.get('key1', fetcher1);
      await cache.get('key2', fetcher2);

      expect(fetcher1).toHaveBeenCalledTimes(2);
      expect(fetcher2).toHaveBeenCalledTimes(2);
    });
  });

  describe('getStats()', () => {
    it('should track hits and misses correctly', async () => {
      const fetcher = jest.fn<() => Promise<string>>().mockResolvedValue('test-data');

      // Miss
      await cache.get('key1', fetcher);

      // Hit
      await cache.get('key1', fetcher);

      // Miss (different key)
      await cache.get('key2', fetcher);

      const stats = cache.getStats();

      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(1 / 3);
      expect(stats.size).toBe(2);
    });

    it('should return zero hitRate when no requests', () => {
      const stats = cache.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
      expect(stats.size).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should not cache failed requests', async () => {
      const error = new Error('API error');
      const fetcher = jest.fn<() => Promise<string>>().mockRejectedValue(error);

      // First call should fail
      await expect(cache.get('test-key', fetcher)).rejects.toThrow('API error');

      // Second call should also attempt fetch (not return cached error)
      await expect(cache.get('test-key', fetcher)).rejects.toThrow('API error');

      expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it('should handle concurrent request failures correctly', async () => {
      const error = new Error('API error');
      const fetcher = jest
        .fn<() => Promise<never>>()
        .mockImplementation(() => new Promise((_, reject) => setTimeout(() => reject(error), 50)));

      // Make 3 concurrent requests that will fail
      const results = await Promise.allSettled([
        cache.get('test-key', fetcher),
        cache.get('test-key', fetcher),
        cache.get('test-key', fetcher),
      ]);

      // All should have failed
      expect(results.every((r) => r.status === 'rejected')).toBe(true);
      expect(fetcher).toHaveBeenCalledTimes(1); // Only one actual fetch due to deduplication

      // Next call should retry (not return cached error)
      await expect(cache.get('test-key', fetcher)).rejects.toThrow('API error');
      expect(fetcher).toHaveBeenCalledTimes(2);
    });
  });

  describe('lazy expiration', () => {
    it('should remove expired entries on next access', async () => {
      const fetcher1 = jest.fn<() => Promise<string>>().mockResolvedValue('data1');
      const fetcher2 = jest.fn<() => Promise<string>>().mockResolvedValue('data2');

      await cache.get('key1', fetcher1, 100); // Expires in 100ms
      await cache.get('key2', fetcher2, 10000); // Expires in 10s

      let stats = cache.getStats();
      expect(stats.size).toBe(2);

      // Wait for key1 to expire
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Access key1 after expiry - should trigger lazy cleanup and refetch
      await cache.get('key1', fetcher1);

      expect(fetcher1).toHaveBeenCalledTimes(2); // Called twice: initial + after expiry
      expect(fetcher2).toHaveBeenCalledTimes(1); // Only called once

      stats = cache.getStats();
      expect(stats.size).toBe(2); // Both entries present after refetch
    });
  });

  describe('invalidate() race conditions', () => {
    it('should prevent stale caching via generation counter', async () => {
      const cache = new CacheManager(true, 5000);

      const slowFetcher = jest
        .fn<() => Promise<string>>()
        .mockImplementation(
          () => new Promise<string>((resolve) => setTimeout(() => resolve('stale-data'), 200))
        );

      // Start slow request
      const promise = cache.get('test-key', slowFetcher);

      // Invalidate while in-flight
      await new Promise((resolve) => setTimeout(resolve, 50));
      cache.invalidate('test-key');

      // Let request complete
      await promise;

      // KEY ASSERTION: Cache should be EMPTY (generation counter prevented caching)
      const statsAfterCompletion = cache.getStats();
      expect(statsAfterCompletion.size).toBe(0); // Generation counter worked!

      // Next request refetches (because cache is empty, not just pendingRequests cleanup)
      const freshFetcher = jest.fn<() => Promise<string>>().mockResolvedValue('fresh-data');
      const result = await cache.get('test-key', freshFetcher);

      expect(result).toBe('fresh-data');
      expect(freshFetcher).toHaveBeenCalledTimes(1);
      expect(slowFetcher).toHaveBeenCalledTimes(1);
    });

    it('should handle concurrent invalidations correctly', async () => {
      // Pre-populate cache
      await cache.get('key1', async () => 'data1');
      await cache.get('key2', async () => 'data2');

      // Concurrent invalidations
      await Promise.all([
        Promise.resolve(cache.invalidate('key1')),
        Promise.resolve(cache.invalidate('key2')),
        Promise.resolve(cache.invalidate(/^key/)),
      ]);

      const stats = cache.getStats();
      expect(stats.size).toBe(0);
    });
  });
});
