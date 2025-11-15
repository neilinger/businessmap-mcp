import { BusinessMapClient } from '../../../src/client/businessmap-client.js';
import { BusinessMapConfig } from '../../../src/types/base.js';

describe('Cache Integration Tests', () => {
  let client: BusinessMapClient;
  let config: BusinessMapConfig;

  beforeAll(() => {
    config = {
      apiUrl: process.env.BUSINESSMAP_API_URL || 'https://demo.kanbanize.com/api/v2',
      apiToken: process.env.BUSINESSMAP_API_TOKEN || 'test-token',
      cacheEnabled: true,
      cacheTtl: 5000, // 5 seconds for testing
    };

    client = new BusinessMapClient(config);
  });

  afterEach(() => {
    // Clear caches after each test
    client.clearAllCaches();
  });

  describe('UserClient caching', () => {
    it('should cache getUsers() results', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // First call - should hit API
      const users1 = await client.getUsers();

      // Second call - should use cache
      const users2 = await client.getUsers();

      // Results should be identical
      expect(users1).toEqual(users2);

      // Check cache stats
      const stats = client.getCacheStats();
      expect(stats.user!.hits).toBeGreaterThan(0);
    });

    it('should cache getCurrentUser() results', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // First call
      const user1 = await client.getCurrentUser();

      // Second call - should use cache
      const user2 = await client.getCurrentUser();

      expect(user1).toEqual(user2);

      const stats = client.getCacheStats();
      expect(stats.user!.hits).toBeGreaterThan(0);
    });
  });

  describe('CardClient caching', () => {
    it('should cache getCardTypes() results', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // First call
      const types1 = await client.getCardTypes();

      // Second call - should use cache
      const types2 = await client.getCardTypes();

      expect(types1).toEqual(types2);

      const stats = client.getCacheStats();
      expect(stats.card!.hits).toBeGreaterThan(0);
    });
  });

  describe('WorkspaceClient caching', () => {
    it('should cache getWorkspaces() results', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // First call
      const workspaces1 = await client.getWorkspaces();

      // Second call - should use cache
      const workspaces2 = await client.getWorkspaces();

      expect(workspaces1).toEqual(workspaces2);

      const stats = client.getCacheStats();
      expect(stats.workspace!.hits).toBeGreaterThan(0);
    });

    it('should invalidate cache after workspace update', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN || !process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID) {
        return;
      }

      await client.initialize();

      const workspaceId = parseInt(process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID);

      // Skip if workspace is archived
      try {
        const workspace = await client.getWorkspace(workspaceId);
        if (workspace.is_archived) {
          return;
        }
      } catch (error) {
        return;
      }

      // Get workspace again to cache it
      await client.getWorkspace(workspaceId);

      // Update workspace (should invalidate cache)
      await client.updateWorkspace(workspaceId, { description: `Test ${Date.now()}` });

      // Get workspace again (should fetch from API, not cache)
      await client.getWorkspace(workspaceId);

      const stats = client.getCacheStats();
      // After update, the cache should have been invalidated
      expect(stats.workspace!.misses).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Cache statistics and monitoring', () => {
    it('should provide cache statistics across all modules', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // Make some cached requests
      await client.getUsers();
      await client.getUsers(); // Cache hit
      await client.getCardTypes();
      await client.getCardTypes(); // Cache hit

      const stats = client.getCacheStats();

      // Check that stats are being tracked
      expect(stats.user!.hits).toBeGreaterThan(0);
      expect(stats.card!.hits).toBeGreaterThan(0);
      expect(stats.user!.misses).toBeGreaterThan(0);
      expect(stats.card!.misses).toBeGreaterThan(0);
    });

    it('should clear all caches', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // Populate caches
      await client.getUsers();
      await client.getCardTypes();

      // Clear all caches
      client.clearAllCaches();

      const stats = client.getCacheStats();

      // All caches should be empty
      Object.values(stats).forEach((stat: any) => {
        expect(stat.size).toBe(0);
      });
    });
  });

  describe('Request deduplication', () => {
    it('should deduplicate concurrent identical requests', async () => {
      if (!process.env.BUSINESSMAP_API_TOKEN) {
        return;
      }

      await client.initialize();

      // Get baseline stats
      const statsBefore = client.getCacheStats();
      const hitsBefore = statsBefore.user!.hits;
      const missesBefore = statsBefore.user!.misses;

      // Make 5 concurrent requests for the same data
      const results = await Promise.all([
        client.getUsers(),
        client.getUsers(),
        client.getUsers(),
        client.getUsers(),
        client.getUsers(),
      ]);

      // All results should be identical
      results.forEach((result: any) => {
        expect(result).toEqual(results[0]);
      });

      // Check delta: should have 1 new miss and 4 new hits
      const statsAfter = client.getCacheStats();
      expect(statsAfter.user!.misses - missesBefore).toBe(1);
      expect(statsAfter.user!.hits - hitsBefore).toBe(4);
    });
  });
});
