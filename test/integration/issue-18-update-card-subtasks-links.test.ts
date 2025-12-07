/**
 * Regression test for Issue #18: update_card silently fails with subtasks_to_add and links
 *
 * Root Cause: updateCardSchema missing parameters that exist in createCardSchema:
 * - subtasks_to_add
 * - links_to_existing_cards_to_add_or_update
 * - tag_ids_to_add
 *
 * These params were stripped by schema validation before reaching BusinessMap API.
 *
 * Fix: Added updateCardFullSchema with all create_card parameters
 */

import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { BusinessMapClient } from '../../src/client/businessmap-client.js';
import { checkTestCredentials, createTestClient } from './infrastructure/client-factory.js';
import { testError } from './infrastructure/error-messages.js';
import { TestCardFactory } from './infrastructure/test-card-factory/index.js';

// Set global timeout to 90s for rate limit retries
jest.setTimeout(90000);

// Check credential availability
const credentialStatus = checkTestCredentials();

// Skip all tests if in CI or no credentials available
const shouldSkip = process.env.CI === 'true' || !credentialStatus.available;

if (shouldSkip) {
  if (process.env.CI === 'true') {
    console.warn('Skipping Issue #18 tests - Running in CI environment');
  } else {
    console.warn('Skipping Issue #18 tests - No credentials available');
    console.warn(credentialStatus.message);
  }
}

(shouldSkip ? describe.skip : describe)(
  'Issue #18: update_card with subtasks_to_add and links',
  () => {
    let client: BusinessMapClient;
    let factory: TestCardFactory;
    let testCardId: number;
    let parentCardId: number;

    beforeEach(async () => {
      // Initialize client and factory
      client = createTestClient();
      await client.initialize();

      // Use factory for board discovery and card creation
      factory = new TestCardFactory(client, 'issue-18');

      // Create parent card for link tests
      const parentResult = await factory.discoverAndCreateCard({
        title: `[Issue-18] Parent Card ${Date.now()}`,
      });
      parentCardId = parentResult.cardId;

      // Create test card
      const testResult = await factory.discoverAndCreateCard({
        title: `[Issue-18] Test Card ${Date.now()}`,
      });
      testCardId = testResult.cardId;
    });

    afterEach(async () => {
      // Cleanup using factory
      await factory.cleanupAllTrackedCards({ archiveFirst: true });
    });

    it('[REGRESSION-001] updateCard applies subtasks_to_add', async () => {
      const subtask = {
        description: 'Test subtask via update_card',
        owner_user_id: 2,
        is_finished: 0,
        deadline: null,
        position: 0,
        attachments_to_add: [],
      };

      await client.updateCard({
        card_id: testCardId,
        subtasks_to_add: [subtask],
      });

      const updated = await client.getCard(testCardId);
      expect(updated.subtasks).toHaveLength(1);
      expect(updated.subtasks![0]?.description).toBe(subtask.description);
    });

    it('[REGRESSION-002] updateCard applies links_to_existing_cards_to_add_or_update', async () => {
      await client.updateCard({
        card_id: testCardId,
        links_to_existing_cards_to_add_or_update: [
          {
            linked_card_id: parentCardId,
            link_type: 'parent',
            linked_card_position: 0,
            card_position: 0,
          },
        ],
      });

      const updated = await client.getCard(testCardId);
      expect(updated.linked_cards).toHaveLength(1);
      expect(updated.linked_cards![0]?.card_id).toBe(parentCardId);
    });

    it('[REGRESSION-003] updateCard applies tag_ids_to_add', async () => {
      const boards = await client.getBoards({ if_assigned: 1 });
      const board = boards[0];
      if (!board) throw testError('NO_BOARDS');

      // Try to get available tags (may not exist)
      const tags = (board as Record<string, unknown>).available_tags as
        | Array<{ tag_id: number }>
        | undefined;
      const tagId = tags?.[0]?.tag_id;

      if (!tagId) {
        console.warn('No tags available, skipping tag test');
        return;
      }

      await client.updateCard({
        card_id: testCardId,
        tag_ids_to_add: [tagId],
      });

      const updated = await client.getCard(testCardId);
      expect(updated.tag_ids).toContain(tagId);
    });

    it('[REGRESSION-004] updateCard applies all params simultaneously', async () => {
      const boards = await client.getBoards({ if_assigned: 1 });
      const board = boards[0];
      if (!board) throw testError('NO_BOARDS');

      const tags = (board as Record<string, unknown>).available_tags as
        | Array<{ tag_id: number }>
        | undefined;
      const tagId = tags?.[0]?.tag_id;

      const updateParams = {
        card_id: testCardId,
        subtasks_to_add: [
          {
            description: 'Batch test subtask',
            owner_user_id: 2,
            is_finished: 0,
            deadline: null,
            position: 0,
            attachments_to_add: [],
          },
        ],
        links_to_existing_cards_to_add_or_update: [
          {
            linked_card_id: parentCardId,
            link_type: 'parent',
            linked_card_position: 0,
            card_position: 0,
          },
        ],
        ...(tagId ? { tag_ids_to_add: [tagId] } : {}),
      };

      await client.updateCard(updateParams);

      const updated = await client.getCard(testCardId);
      expect(updated.subtasks).toHaveLength(1);
      expect(updated.linked_cards).toHaveLength(1);
      if (tagId) {
        expect(updated.tag_ids).toContain(tagId);
      }
    });
  }
);
