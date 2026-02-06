/**
 * Integration tests for Issue #87: Add update_card_subtask MCP tool
 *
 * Tests the update_card_subtask tool to mark subtasks as finished,
 * update descriptions, and modify other subtask properties.
 */

/* eslint-disable no-console */
import { describe, it, expect, beforeAll, afterAll, jest } from '@jest/globals';
import { BusinessMapClient } from '../../src/client/businessmap-client.js';
import { checkTestCredentials, createTestClient } from './infrastructure/client-factory.js';
import { TestCardFactory } from './infrastructure/test-card-factory/index.js';
import type { Card } from '@defs/index.js';

// Set global timeout to 90s for rate limit retries
jest.setTimeout(90000);

// Check credential availability
const credentialStatus = checkTestCredentials();

// Skip live API tests if in CI or no credentials available
const shouldSkipLiveTests = process.env.CI === 'true' || !credentialStatus.available;

if (shouldSkipLiveTests && !process.env.CI) {
  console.warn('Skipping Issue #87 live API tests - No credentials available');
  console.warn(credentialStatus.message);
}

(shouldSkipLiveTests ? describe.skip : describe)('Issue #87: update_card_subtask MCP tool', () => {
  let client: BusinessMapClient;
  let testCard: Card;
  let subtaskId: number;
  let cardFactory: TestCardFactory;

  beforeAll(async () => {
    client = createTestClient();
    cardFactory = new TestCardFactory(client);

    // Create a test card with a subtask
    testCard = await cardFactory.createCard({
      title: 'Test Card for Issue #87',
      description: 'Testing update_card_subtask tool',
    });

    // Create a subtask to update
    const subtask = await client.createCardSubtask(testCard.cardid, {
      description: 'Original subtask description',
      is_finished: 0,
    });
    subtaskId = subtask.subtaskid;
  });

  afterAll(async () => {
    // Cleanup: Delete test card
    await cardFactory?.cleanup();
  });

  it('should mark subtask as finished', async () => {
    // Update subtask to mark as finished
    const updatedSubtask = await client.updateCardSubtask(testCard.cardid, subtaskId, {
      is_finished: 1,
    });

    expect(updatedSubtask.subtaskid).toBe(subtaskId);
    expect(updatedSubtask.is_finished).toBe(1);
  });

  it('should update subtask description', async () => {
    const newDescription = 'Updated subtask description';

    const updatedSubtask = await client.updateCardSubtask(testCard.cardid, subtaskId, {
      description: newDescription,
    });

    expect(updatedSubtask.subtaskid).toBe(subtaskId);
    expect(updatedSubtask.description).toBe(newDescription);
  });

  it('should update multiple fields at once', async () => {
    const newDescription = 'Multi-field update test';
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    const deadline = futureDate.toISOString().split('T')[0]; // YYYY-MM-DD

    const updatedSubtask = await client.updateCardSubtask(testCard.cardid, subtaskId, {
      description: newDescription,
      is_finished: 0,
      deadline,
    });

    expect(updatedSubtask.subtaskid).toBe(subtaskId);
    expect(updatedSubtask.description).toBe(newDescription);
    expect(updatedSubtask.is_finished).toBe(0);
    expect(updatedSubtask.deadline).toContain(deadline);
  });

  it('should throw error for invalid card ID', async () => {
    const invalidCardId = 999999999;

    await expect(
      client.updateCardSubtask(invalidCardId, subtaskId, {
        description: 'Should fail',
      })
    ).rejects.toThrow();
  });

  it('should throw error for invalid subtask ID', async () => {
    const invalidSubtaskId = 999999999;

    await expect(
      client.updateCardSubtask(testCard.cardid, invalidSubtaskId, {
        description: 'Should fail',
      })
    ).rejects.toThrow();
  });

  it('should throw error in read-only mode', async () => {
    const readOnlyClient = createTestClient({ readOnly: true });

    await expect(
      readOnlyClient.updateCardSubtask(testCard.cardid, subtaskId, {
        description: 'Should fail',
      })
    ).rejects.toThrow(/read-only mode/i);
  });
});
