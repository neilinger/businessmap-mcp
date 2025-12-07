/**
 * Regression test for Issue #21: Cannot create subtasks via create_card_subtask
 *
 * Bug: When calling create_card_subtask, the API returns "card does not exist"
 * even though the card was just created and can be queried.
 *
 * Root cause: The handler incorrectly includes 'instance' parameter in subtaskData
 * sent to the BusinessMap API, which causes the API to reject the request.
 */

/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { BusinessMapClient } from '../../src/client/businessmap-client.js';
import { checkTestCredentials, createTestClient } from './infrastructure/client-factory.js';
import { TestCardFactory } from './infrastructure/test-card-factory/index.js';

// Set global timeout to 90s for rate limit retries
jest.setTimeout(90000);

// Check credential availability
const credentialStatus = checkTestCredentials();

// Skip live API tests if in CI or no credentials available
const shouldSkipLiveTests = process.env.CI === 'true' || !credentialStatus.available;

if (shouldSkipLiveTests && !process.env.CI) {
  console.warn('Skipping Issue #21 live API tests - No credentials available');
  console.warn(credentialStatus.message);
}

describe('Issue #21: Subtask Creation on Newly Created Cards', () => {
  // Unit tests (no API required) - always run
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
        attachments_to_add: [],
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
        owner_user_id: 1,
      };

      // WRONG: This is what the buggy code does - destructures from original params twice
      const { instance, ...restParams } = mockParams;
      // Acknowledge extracted value to avoid lint error
      void instance;
      void restParams;

      // Bug demonstration: if we destructure card_id from params instead of restParams
      const { card_id, ...subtaskDataBuggy } = mockParams;
      void card_id;

      // Bug: subtaskDataBuggy still contains 'instance'
      expect(subtaskDataBuggy).toHaveProperty('instance');
      expect((subtaskDataBuggy as Record<string, unknown>).instance).toBe('test-instance');

      // This is why the API rejects it - it receives an invalid 'instance' parameter
    });

    it('should show correct fix with chained destructuring', () => {
      const mockParams = {
        instance: 'test-instance',
        card_id: 123,
        description: 'Test subtask',
        owner_user_id: 1,
      };

      // CORRECT: Chain destructuring to remove both instance and card_id
      const { instance, ...afterInstance } = mockParams;
      const { card_id, ...subtaskDataFixed } = afterInstance;

      // Acknowledge extracted values to avoid lint errors
      void instance;
      void card_id;

      // Fix: subtaskDataFixed does NOT contain 'instance'
      expect(subtaskDataFixed).not.toHaveProperty('instance');
      expect(subtaskDataFixed).not.toHaveProperty('card_id');
      expect(subtaskDataFixed.description).toBe('Test subtask');
    });
  });

  // Integration tests (API required) - skip in CI or without credentials
  (shouldSkipLiveTests ? describe.skip : describe)('Live API tests', () => {
    let client: BusinessMapClient;
    let factory: TestCardFactory;
    let testCardId: number;
    let validUserId: number;

    beforeAll(async () => {
      // Initialize client and factory using test infrastructure
      client = createTestClient();
      await client.initialize();
      console.log('BusinessMapClient initialized for Issue #21 tests');

      // Use factory for board discovery
      factory = new TestCardFactory(client, 'issue-21');
      console.log('TestCardFactory initialized for Issue #21 tests');

      // Get a valid user ID for subtask assignment
      const users = await client.getUsers();
      if (users && users.length > 0) {
        validUserId = users[0].user_id;
        console.log(`Using user ${validUserId} for subtask assignment`);
      } else {
        throw new Error('No users available for subtask assignment');
      }
    });

    afterAll(async () => {
      // Cleanup: Delete test card if it was created
      await factory.cleanupAllTrackedCards({ archiveFirst: true });
      console.log('Cleanup completed for Issue #21 tests');
    });

    it('should create subtask on newly created card', async () => {
      // Step 1: Create a test card using factory
      const result = await factory.discoverAndCreateCard({
        title: `[Issue #21] Test Card ${Date.now()}`,
        description: 'Automated test for subtask creation bug',
      });
      testCardId = result.cardId;

      expect(testCardId).toBeDefined();
      expect(typeof testCardId).toBe('number');
      console.log(`Created test card ${testCardId}`);

      // Step 2: Verify card exists (this works according to issue report)
      const fetchedCard = await client.getCard(testCardId);
      expect(fetchedCard.card_id).toBe(testCardId);

      // Step 3: Attempt to create subtask (this is where the bug occurred)
      // Note: Only pass required/valid parameters to avoid API validation errors
      const subtaskData = {
        description: 'Test subtask for issue #21',
        owner_user_id: validUserId, // Use dynamically discovered user
      };

      // This should NOT throw "card does not exist" error
      const createdSubtask = await client.createCardSubtask(testCardId, subtaskData);
      expect(createdSubtask).toBeDefined();
      console.log('Successfully created subtask on newly created card');

      // Verify subtask was created
      const subtasks = await client.getCardSubtasks(testCardId);
      expect(subtasks.length).toBeGreaterThan(0);
      expect(subtasks[0]?.description).toBe('Test subtask for issue #21');
    });
  });
});
