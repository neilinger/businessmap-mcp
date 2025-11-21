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
    let testCardId: number;
    let parentCardId: number;
    let testColumnId: number;

    beforeEach(async () => {
      // Initialize client using test infrastructure
      client = createTestClient();
      await client.initialize();

      // Find a board with columns to create test cards
      const boards = await client.getBoards({ if_assigned: 1 });
      if (!boards || boards.length === 0) {
        throw new Error('No accessible boards found for testing');
      }

      // Find a board with usable columns
      let foundBoard = false;
      for (const board of boards) {
        try {
          const columns = await client.getColumns(board.board_id);
          const lanes = await client.getLanes(board.board_id);

          if (columns && columns.length > 0 && lanes && lanes.length > 0) {
            testColumnId = columns[0].column_id;
            foundBoard = true;
            break;
          }
        } catch {
          // Try next board
        }
      }

      if (!foundBoard) {
        throw new Error('No board with columns found for testing');
      }

      // Create parent card for link tests
      const parentCard = await client.createCard({
        title: `[Issue-18] Parent Card ${Date.now()}`,
        column_id: testColumnId,
      });
      parentCardId = parentCard.card_id;

      // Create test card
      const testCard = await client.createCard({
        title: `[Issue-18] Test Card ${Date.now()}`,
        column_id: testColumnId,
      });
      testCardId = testCard.card_id;
    });

    afterEach(async () => {
      // Cleanup
      if (testCardId) {
        try {
          await client.deleteCard(testCardId, { archive_first: true });
        } catch {
          // Ignore cleanup errors
        }
      }
      if (parentCardId) {
        try {
          await client.deleteCard(parentCardId, { archive_first: true });
        } catch {
          // Ignore cleanup errors
        }
      }
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
      if (!board) throw new Error('No boards found');

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
      if (!board) throw new Error('No boards found');

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
