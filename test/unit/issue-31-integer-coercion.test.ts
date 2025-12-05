/**
 * Unit tests for Issue #31: Integer parameter coercion and subtasks_to_add handling
 *
 * Issue 1: Integer parameters like owner_user_id are rejected when passed as strings
 * Fix: Use z.coerce.number() in securePositiveInt to handle string inputs
 *
 * Issue 2: subtasks_to_add parameter is silently ignored by BusinessMap API
 * Fix: Extract subtasks_to_add and create via createCardSubtask endpoint
 */

import { describe, it, expect } from '@jest/globals';

// Import the schemas to test coercion
import { entityIdSchema, securePositiveInt } from '../../src/schemas/security-validation.js';
import { subtaskSchema, updateCardSchema } from '../../src/schemas/card-schemas.js';

describe('Issue #31: Integer Parameter Coercion', () => {
  describe('securePositiveInt coercion', () => {
    it('should accept integer values', () => {
      const schema = securePositiveInt({ min: 1, max: 1000 });
      const result = schema.safeParse(42);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should coerce string values to integers', () => {
      const schema = securePositiveInt({ min: 1, max: 1000 });
      const result = schema.safeParse('42');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(42);
      }
    });

    it('should reject non-numeric strings', () => {
      const schema = securePositiveInt({ min: 1, max: 1000 });
      const result = schema.safeParse('not-a-number');
      expect(result.success).toBe(false);
    });

    it('should reject values below minimum', () => {
      const schema = securePositiveInt({ min: 1, max: 1000 });
      const result = schema.safeParse(0);
      expect(result.success).toBe(false);
    });

    it('should reject values above maximum', () => {
      const schema = securePositiveInt({ min: 1, max: 1000 });
      const result = schema.safeParse(1001);
      expect(result.success).toBe(false);
    });

    it('should reject floating point numbers', () => {
      const schema = securePositiveInt({ min: 1, max: 1000 });
      const result = schema.safeParse(42.5);
      expect(result.success).toBe(false);
    });
  });

  describe('entityIdSchema coercion', () => {
    it('should accept numeric ID', () => {
      const result = entityIdSchema.safeParse(123);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(123);
      }
    });

    it('should coerce string ID to number', () => {
      const result = entityIdSchema.safeParse('123');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(123);
      }
    });

    it('should handle large valid IDs', () => {
      const result = entityIdSchema.safeParse('2147483647');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(2147483647);
      }
    });
  });

  describe('updateCardSchema coercion', () => {
    it('should coerce owner_user_id from string to number', () => {
      const input = {
        card_id: 123,
        owner_user_id: '4', // String input from MCP client
      };
      const result = updateCardSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.owner_user_id).toBe(4);
        expect(typeof result.data.owner_user_id).toBe('number');
      }
    });

    it('should coerce assignee_user_id from string to number', () => {
      const input = {
        card_id: 123,
        assignee_user_id: '5',
      };
      const result = updateCardSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.assignee_user_id).toBe(5);
        expect(typeof result.data.assignee_user_id).toBe('number');
      }
    });

    it('should coerce card_id from string to number', () => {
      const input = {
        card_id: '456',
      };
      const result = updateCardSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.card_id).toBe(456);
        expect(typeof result.data.card_id).toBe('number');
      }
    });
  });

  describe('subtaskSchema coercion', () => {
    it('should coerce all numeric fields from strings', () => {
      const input = {
        description: 'Test subtask',
        owner_user_id: '4',
        is_finished: '0',
        deadline: '2025-01-01',
        position: '1',
        attachments_to_add: [],
      };
      const result = subtaskSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.owner_user_id).toBe(4);
        expect(result.data.is_finished).toBe(0);
        expect(result.data.position).toBe(1);
        expect(typeof result.data.owner_user_id).toBe('number');
        expect(typeof result.data.is_finished).toBe('number');
        expect(typeof result.data.position).toBe('number');
      }
    });

    it('should accept native numbers', () => {
      const input = {
        description: 'Test subtask',
        owner_user_id: 4,
        is_finished: 0,
        deadline: '2025-01-01',
        position: 1,
        attachments_to_add: [],
      };
      const result = subtaskSchema.safeParse(input);
      expect(result.success).toBe(true);
    });
  });
});

describe('Issue #31: subtasks_to_add handling', () => {
  describe('updateCardSchema includes subtasks_to_add', () => {
    it('should accept subtasks_to_add parameter', () => {
      const input = {
        card_id: 123,
        subtasks_to_add: [
          {
            description: 'Subtask 1',
            owner_user_id: 4,
            is_finished: 0,
            deadline: '2025-01-15',
            position: 0,
            attachments_to_add: [],
          },
        ],
      };
      const result = updateCardSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.subtasks_to_add).toBeDefined();
        expect(result.data.subtasks_to_add?.length).toBe(1);
      }
    });

    it('should coerce string values in subtasks_to_add items', () => {
      const input = {
        card_id: '123',
        subtasks_to_add: [
          {
            description: 'Subtask with string numbers',
            owner_user_id: '4',
            is_finished: '0',
            deadline: '2025-01-15',
            position: '0',
            attachments_to_add: [],
          },
        ],
      };
      const result = updateCardSchema.safeParse(input);
      expect(result.success).toBe(true);
      if (result.success && result.data.subtasks_to_add) {
        const subtask = result.data.subtasks_to_add[0];
        expect(typeof subtask?.owner_user_id).toBe('number');
        expect(typeof subtask?.is_finished).toBe('number');
        expect(typeof subtask?.position).toBe('number');
      }
    });
  });
});
