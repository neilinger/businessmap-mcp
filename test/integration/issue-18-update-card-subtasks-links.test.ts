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

import { beforeEach, describe, expect, it } from '@jest/globals';
import { BusinessMapClient } from '../../src/client/businessmap-client';

describe('Issue #18: update_card with subtasks_to_add and links', () => {
  let client: BusinessMapClient;
  let testCardId: number;
  let parentCardId: number;
  const WORKSPACE_ID = parseInt(process.env.BUSINESSMAP_DEFAULT_WORKSPACE_ID || '8', 10);

  beforeEach(async () => {
    client = new BusinessMapClient({
      apiUrl: process.env.BUSINESSMAP_API_URL || '',
      apiToken: process.env.BUSINESSMAP_API_TOKEN || '',
      defaultWorkspaceId: WORKSPACE_ID,
    });

    // Create test cards
    const boards = await client.listBoards({ workspace_id: WORKSPACE_ID });
    const board = boards[0];
    if (!board) throw new Error('No boards found');

    const structure = await client.getCurrentBoardStructure(board.board_id!);
    const workflows = Object.values(structure.workflows || {});
    const firstWorkflow = workflows[0] as any;
    const columns = Array.isArray(firstWorkflow?.columns)
      ? firstWorkflow.columns
      : Object.values(firstWorkflow?.columns || {});
    const columnId = columns[0]?.column_id;
    if (!columnId) {
      throw new Error(`No columns found in board structure (workflows: ${Object.keys(structure.workflows || {}).length})`);
    }

    const parentCard = await client.createCard({
      title: `[Issue-18] Parent Card ${Date.now()}`,
      column_id: columnId,
    });
    parentCardId = parentCard.card_id;

    const testCard = await client.createCard({
      title: `[Issue-18] Test Card ${Date.now()}`,
      column_id: columnId,
    });
    testCardId = testCard.card_id;
  });

  afterEach(async () => {
    // Cleanup
    if (testCardId) await client.deleteCard(testCardId, { archive_first: true });
    if (parentCardId) await client.deleteCard(parentCardId, { archive_first: true });
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
    const boards = await client.listBoards({ workspace_id: WORKSPACE_ID });
    const board = boards[0];
    if (!board) throw new Error('No boards found');

    // Try to get available tags (may not exist)
    const tags = (board as any).available_tags as Array<{ tag_id: number }> | undefined;
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
    const boards = await client.listBoards({ workspace_id: WORKSPACE_ID });
    const board = boards[0];
    if (!board) throw new Error('No boards found');

    const tags = (board as any).available_tags as Array<{ tag_id: number }> | undefined;
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
});
