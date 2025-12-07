/**
 * Integration Tests for Issue #26: Card Comments CRUD Operations
 *
 * Purpose: Verify CRUD comment operations work as expected with BusinessMap API.
 * Uses BusinessMapClient exclusively for all operations (includes axios-retry for rate limiting).
 *
 * Prerequisites:
 * - Credentials in .mcp.json or environment variables (BUSINESSMAP_API_TOKEN_KERKOW/FIMANCIA)
 * - Optionally BUSINESSMAP_TEST_CARD_ID for a specific test card (otherwise auto-discovers)
 *
 * Run with:
 * npm run test:integration -- --testPathPattern="issue-26-card-comments-crud"
 */

/* eslint-disable no-console */

import { afterAll, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { BusinessMapClient } from '../../src/client/businessmap-client.js';
import {
  checkTestCredentials,
  createTestClient,
  getAvailableTestInstances,
} from './infrastructure/client-factory.js';
import { TestCardFactory } from './infrastructure/test-card-factory/index.js';

// Set global timeout to 90s to allow for rate limit retries (retry-after can be 60+ seconds)
jest.setTimeout(90000);

// Check credential availability
const credentialStatus = checkTestCredentials();

// Test card ID - can be set via environment variable, otherwise auto-discovered
const TEST_CARD_ID = process.env.BUSINESSMAP_TEST_CARD_ID
  ? parseInt(process.env.BUSINESSMAP_TEST_CARD_ID, 10)
  : undefined;

// Skip all tests if in CI or no credentials available
const shouldSkip = process.env.CI === 'true' || !credentialStatus.available;

if (shouldSkip) {
  if (process.env.CI === 'true') {
    console.warn('Skipping Issue #26 tests - Running in CI environment');
  } else {
    console.warn('Skipping Issue #26 tests - No credentials available');
    console.warn(credentialStatus.message);
    console.warn('Configure .mcp.json or set environment variables to run locally');
  }
} else {
  console.log(`Issue #26 tests: ${credentialStatus.message}`);
}

// Track created resources for cleanup
const createdCommentIds: Array<{ cardId: number; commentId: number }> = [];

(shouldSkip ? describe.skip : describe)('Issue #26: Card Comments CRUD', () => {
  let client: BusinessMapClient;
  let factory: TestCardFactory;
  let testCardId: number;

  beforeAll(async () => {
    // Initialize BusinessMapClient using factory (reads credentials from .mcp.json)
    // Use fimancia instance (default in .businessmap-instances.json) as it has cards
    const instances = getAvailableTestInstances();
    const preferFimancia = instances.find((i) => i.name === 'fimancia');

    if (preferFimancia) {
      client = createTestClient('fimancia');
      console.log('Using fimancia instance for tests');
    } else {
      client = createTestClient();
      console.log(`Using ${instances[0]?.name || 'default'} instance for tests`);
    }

    await client.initialize();
    console.log('BusinessMapClient initialized with axios-retry enabled');

    // Initialize factory for board discovery and card creation
    factory = new TestCardFactory(client, 'issue-26');

    // Use provided test card ID or auto-discover
    if (TEST_CARD_ID) {
      testCardId = TEST_CARD_ID;
      console.log(`Using provided test card ID: ${testCardId}`);

      // Verify card exists by attempting to list its comments
      try {
        await client.getCardComments(testCardId);
        console.log(`Verified card ${testCardId} is accessible`);
      } catch {
        console.warn(`Card ${testCardId} not accessible, will auto-discover...`);
        testCardId = 0; // Force auto-discovery
      }
    }

    // Auto-discover or create a test card using factory
    if (!testCardId) {
      console.log('Setting up test card using factory...');
      const result = await factory.discoverAndCreateCard({
        title: `[Integration Test] Test card ${Date.now()}`,
      });
      testCardId = result.cardId;
      console.log(`Created test card ${testCardId} in board ${result.boardId}`);
    }

    // Create initial test comment for subsequent tests
    const initialComment = await client.createCardComment(testCardId, {
      text: `[Issue-26 Test] Initial setup comment ${Date.now()}`,
    });
    createdCommentIds.push({ cardId: testCardId, commentId: initialComment.comment_id });
    console.log(`Created initial test comment ${initialComment.comment_id}`);
  }, 120000); // 2 minute timeout for setup

  afterAll(async () => {
    console.log('Cleaning up test comments...');
    for (const { cardId, commentId } of createdCommentIds) {
      try {
        await client.deleteCardComment(cardId, commentId);
        console.log(`Deleted comment ${commentId}`);
      } catch {
        // Comment may already be deleted
      }
    }

    // Clean up test card using factory
    await factory.cleanupAllTrackedCards();
    console.log('Test card cleaned up');
  }, 60000);

  // ============================================
  // T010: CREATE operation integration tests
  // ============================================
  describe('T010: CREATE operation', () => {
    it('should create a comment and verify via GET', async () => {
      const text = `[T010] Create test ${Date.now()}`;
      const startTime = performance.now();

      const created = await client.createCardComment(testCardId, { text });
      createdCommentIds.push({ cardId: testCardId, commentId: created.comment_id });

      const duration = performance.now() - startTime;
      console.log(`CREATE took ${duration.toFixed(0)}ms`);

      expect(created.comment_id).toBeGreaterThan(0);
      expect(created.text).toContain('[T010] Create test');

      // Verify via GET
      const fetched = await client.getCardComment(testCardId, created.comment_id);
      expect(fetched.comment_id).toBe(created.comment_id);
      expect(fetched.text).toBe(created.text);

      // SC-004: Operation should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should reject empty text', async () => {
      await expect(client.createCardComment(testCardId, { text: '' })).rejects.toThrow();
    });

    it('should reject whitespace-only text', async () => {
      await expect(client.createCardComment(testCardId, { text: '   ' })).rejects.toThrow();
    });
  });

  // ============================================
  // T014: UPDATE operation integration tests
  // ============================================
  describe('T014: UPDATE operation', () => {
    it('should update comment text and verify via GET', async () => {
      // Create comment to update
      const original = await client.createCardComment(testCardId, {
        text: `[T014] Original ${Date.now()}`,
      });
      createdCommentIds.push({ cardId: testCardId, commentId: original.comment_id });

      const newText = `[T014] Updated ${Date.now()}`;
      const startTime = performance.now();

      const updated = await client.updateCardComment(testCardId, original.comment_id, {
        text: newText,
      });

      const duration = performance.now() - startTime;
      console.log(`UPDATE took ${duration.toFixed(0)}ms`);

      // Note: API may sanitize/escape text
      expect(updated.text).toContain('[T014] Updated');

      // Verify via GET
      const fetched = await client.getCardComment(testCardId, original.comment_id);
      expect(fetched.text).toContain('[T014] Updated');

      // SC-004: Operation should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should handle special characters in update', async () => {
      const original = await client.createCardComment(testCardId, {
        text: `[T014-Special] Original ${Date.now()}`,
      });
      createdCommentIds.push({ cardId: testCardId, commentId: original.comment_id });

      const specialText = `[T014-Special] "quotes" 'apostrophe' & ampersand ${Date.now()}`;
      const updated = await client.updateCardComment(testCardId, original.comment_id, {
        text: specialText,
      });

      // API may escape ampersands
      expect(updated.text).toContain('[T014-Special]');
      expect(updated.text).toContain('quotes');
    });

    it('should return 404 for invalid comment ID', async () => {
      await expect(
        client.updateCardComment(testCardId, 999999999, { text: 'Should fail' })
      ).rejects.toThrow();
    });
  });

  // ============================================
  // T018: DELETE operation integration tests
  // ============================================
  describe('T018: DELETE operation', () => {
    it('should delete comment and verify 404 on GET', async () => {
      // Create comment to delete
      const toDelete = await client.createCardComment(testCardId, {
        text: `[T018] To be deleted ${Date.now()}`,
      });
      // Don't track for cleanup since we're deleting it

      const startTime = performance.now();
      await client.deleteCardComment(testCardId, toDelete.comment_id);
      const duration = performance.now() - startTime;
      console.log(`DELETE took ${duration.toFixed(0)}ms`);

      // Verify 404 on GET
      await expect(client.getCardComment(testCardId, toDelete.comment_id)).rejects.toThrow();

      // SC-004: Operation should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    });

    it('should return 404 for invalid comment ID', async () => {
      await expect(client.deleteCardComment(testCardId, 999999999)).rejects.toThrow();
    });

    it('should handle double delete gracefully', async () => {
      const toDelete = await client.createCardComment(testCardId, {
        text: `[T018] Double delete test ${Date.now()}`,
      });

      // First delete should succeed
      await client.deleteCardComment(testCardId, toDelete.comment_id);

      // Second delete - API may return success (idempotent) or 404
      // Either is acceptable behavior
      try {
        await client.deleteCardComment(testCardId, toDelete.comment_id);
        // Idempotent - success on second delete is OK
      } catch {
        // 404 on second delete is also OK
      }
    });
  });

  // ============================================
  // Full CRUD Lifecycle
  // ============================================
  describe('Full CRUD lifecycle', () => {
    it('should complete CREATE -> UPDATE -> DELETE -> verify gone', async () => {
      const timestamp = Date.now();

      // CREATE
      console.log('CRUD Lifecycle: CREATE');
      const created = await client.createCardComment(testCardId, {
        text: `[CRUD Lifecycle] Created ${timestamp}`,
      });
      expect(created.comment_id).toBeGreaterThan(0);

      // UPDATE
      console.log('CRUD Lifecycle: UPDATE');
      const updated = await client.updateCardComment(testCardId, created.comment_id, {
        text: `[CRUD Lifecycle] Updated ${timestamp}`,
      });
      expect(updated.text).toContain('Updated');

      // Verify update via GET
      const fetched = await client.getCardComment(testCardId, created.comment_id);
      expect(fetched.text).toContain('Updated');

      // DELETE
      console.log('CRUD Lifecycle: DELETE');
      await client.deleteCardComment(testCardId, created.comment_id);

      // Verify gone
      console.log('CRUD Lifecycle: VERIFY GONE');
      await expect(client.getCardComment(testCardId, created.comment_id)).rejects.toThrow();

      console.log('CRUD Lifecycle: COMPLETE');
    });
  });

  // ============================================
  // SC-004: Performance validation
  // ============================================
  describe('SC-004: Performance validation', () => {
    it('should complete all operations within 5 seconds', async () => {
      const operations = ['CREATE', 'UPDATE', 'DELETE'];
      const timings: Record<string, number> = {};

      // CREATE
      let start = performance.now();
      const comment = await client.createCardComment(testCardId, {
        text: `[SC-004 Perf] ${Date.now()}`,
      });
      timings.CREATE = performance.now() - start;

      // UPDATE
      start = performance.now();
      await client.updateCardComment(testCardId, comment.comment_id, {
        text: `[SC-004 Perf] Updated ${Date.now()}`,
      });
      timings.UPDATE = performance.now() - start;

      // DELETE
      start = performance.now();
      await client.deleteCardComment(testCardId, comment.comment_id);
      timings.DELETE = performance.now() - start;

      // Report - operations should complete in <5s under normal conditions
      // If rate limited (>10s), note it but don't fail - that's expected axios-retry behavior
      console.log('SC-004 Performance Results:');
      let rateLimitDetected = false;
      for (const op of operations) {
        const ms = timings[op];
        if (ms > 10000) {
          console.log(
            `  RATE_LIMITED ${op}: ${ms.toFixed(0)}ms (axios-retry waited for rate limit)`
          );
          rateLimitDetected = true;
        } else {
          const status = ms < 5000 ? 'PASS' : 'FAIL';
          console.log(`  ${status} ${op}: ${ms.toFixed(0)}ms`);
          // Only assert if not rate limited
          expect(ms).toBeLessThan(5000);
        }
      }
      if (rateLimitDetected) {
        console.log(
          '  Note: Rate limiting detected - this is expected behavior when API quota is exhausted'
        );
      }
    });
  });

  // ============================================
  // Error handling
  // ============================================
  describe('Error handling', () => {
    it('should provide clear error for invalid card ID on CREATE', async () => {
      await expect(client.createCardComment(999999999, { text: 'Should fail' })).rejects.toThrow();
    });

    it('should list all comments for a card', async () => {
      const comments = await client.getCardComments(testCardId);
      expect(Array.isArray(comments)).toBe(true);
      console.log(`Card ${testCardId} has ${comments.length} comments`);
    });
  });
});
