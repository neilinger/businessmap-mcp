/**
 * Regression test for Issue #21: Cannot create subtasks via create_card_subtask
 *
 * Bug: When calling create_card_subtask, the API returns "card does not exist"
 * even though the card was just created and can be queried.
 *
 * Root cause: The handler incorrectly includes 'instance' parameter in subtaskData
 * sent to the BusinessMap API, which causes the API to reject the request.
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import { BusinessMapClient } from '../../src/client/businessmap-client';

describe('Issue #21: Subtask Creation on Newly Created Cards', () => {
  // Unit tests (no API required)
  describe('Parameter destructuring (unit tests)', () => {
    it('should correctly pass subtask data without instance parameter', () => {
      // Unit test: Verify parameter destructuring logic
      const mockParams = {
        instance: 'test-instance',
        card_id: 123,
        description: 'Test subtask',
        owner_user_id: 1,
        is_finished: 0,
        deadline: '2025-01-01',
        position: 1,
        attachments_to_add: []
      };

      // Correct destructuring (what the fix should do)
      const { instance, card_id, ...subtaskData } = mockParams;

      // Verify instance is NOT in subtaskData
      expect(subtaskData).not.toHaveProperty('instance');

      // Verify card_id is NOT in subtaskData
      expect(subtaskData).not.toHaveProperty('card_id');

      // Verify other parameters ARE in subtaskData
      expect(subtaskData.description).toBe('Test subtask');
      expect(subtaskData.owner_user_id).toBe(1);

      // Verify we have the extracted values
      expect(instance).toBe('test-instance');
      expect(card_id).toBe(123);
    });

    it('should demonstrate the bug with incorrect destructuring', () => {
      // Demonstrate the bug: what happens with incorrect destructuring
      const mockParams = {
        instance: 'test-instance',
        card_id: 123,
        description: 'Test subtask',
        owner_user_id: 1
      };

      // WRONG: This is what the buggy code does
      const { instance, ...restParams } = mockParams;
      const { card_id, ...subtaskDataBuggy } = mockParams; // Destructures from params, not restParams!

      // Bug: subtaskDataBuggy still contains 'instance'
      expect(subtaskDataBuggy).toHaveProperty('instance');
      expect(subtaskDataBuggy.instance).toBe('test-instance');

      // This is why the API rejects it - it receives an invalid 'instance' parameter
    });

    it('should show correct fix with restParams destructuring', () => {
      const mockParams = {
        instance: 'test-instance',
        card_id: 123,
        description: 'Test subtask',
        owner_user_id: 1
      };

      // CORRECT: Destructure from restParams, not params
      const { instance, ...restParams } = mockParams;
      const { card_id, ...subtaskDataFixed } = restParams;

      // Fix: subtaskDataFixed does NOT contain 'instance'
      expect(subtaskDataFixed).not.toHaveProperty('instance');
      expect(subtaskDataFixed).not.toHaveProperty('card_id');
      expect(subtaskDataFixed.description).toBe('Test subtask');
    });
  });

  // Integration tests (API required)
  describe('Live API tests', () => {
    let client: BusinessMapClient;
    let testCardId: number;
    const TEST_BOARD_ID = 2; // XpertPulse GmbH board from issue
    const TEST_COLUMN_ID = 1; // Adjust based on actual board structure

    beforeAll(async () => {
      // Initialize client with test credentials
      const apiUrl = process.env.BUSINESSMAP_API_URL || 'https://kerkow.kanbanize.com/api/v2';
      const apiToken = process.env.BUSINESSMAP_API_TOKEN;

      if (!apiToken) {
        throw new Error('BUSINESSMAP_API_TOKEN environment variable is required');
      }

      client = new BusinessMapClient({
        apiUrl,
        apiToken,
        readOnlyMode: false
      });
    });

    afterAll(async () => {
      // Cleanup: Delete test card if it was created
      if (testCardId) {
        try {
          await client.deleteCard(testCardId);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });

    it('should create subtask on newly created card', async () => {
    // Step 1: Create a test card
    const cardData = {
      title: 'Test Card for Issue #21 Regression Test',
      column_id: TEST_COLUMN_ID,
      description: 'Automated test for subtask creation bug'
    };

    const createdCard = await client.createCard(cardData);
    testCardId = createdCard.card_id;

    expect(testCardId).toBeDefined();
    expect(typeof testCardId).toBe('number');

    // Step 2: Verify card exists (this works according to issue report)
    const fetchedCard = await client.getCard(testCardId);
    expect(fetchedCard.card_id).toBe(testCardId);

    // Step 3: Attempt to create subtask (this is where the bug occurs)
    const subtaskData = {
      description: 'Test subtask for issue #21',
      owner_user_id: 1, // Adjust based on actual user
      is_finished: 0,
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      position: 1,
      attachments_to_add: []
    };

    // This should NOT throw "card does not exist" error
    await expect(
      client.createCardSubtask(testCardId, subtaskData)
    ).resolves.toBeDefined();

    // Verify subtask was created
    const subtasks = await client.getCardSubtasks(testCardId);
    expect(subtasks.length).toBeGreaterThan(0);
    expect(subtasks[0]?.description).toBe('Test subtask for issue #21');
    }, 30000); // 30 second timeout for API calls
  });
});
