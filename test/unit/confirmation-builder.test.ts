/**
 * Unit tests for ConfirmationBuilder fallback mechanisms
 * Tests Issue #7 fix: Defensive name handling with fallbacks
 */

import { ConfirmationBuilder } from '../../src/services/confirmation-builder';

describe('ConfirmationBuilder - nameMap fallback handling', () => {
  let builder: ConfirmationBuilder;

  beforeEach(() => {
    builder = new ConfirmationBuilder();
  });

  describe('formatSimpleSuccess', () => {
    it('should display resource names when available', () => {
      // Arrange
      const resources = [
        { id: 1, name: 'Alpha Board' },
        { id: 2, name: 'Beta Board' },
        { id: 3, name: 'Gamma Board' },
      ];

      // Act
      const message = builder.formatSimpleSuccess('board', 3, resources);

      // Assert
      expect(message).toContain('Successfully deleted 3 boards');
      expect(message).toContain('"Alpha Board" (ID: 1)');
      expect(message).toContain('"Beta Board" (ID: 2)');
      expect(message).toContain('"Gamma Board" (ID: 3)');
    });

    it('should use fallback pattern when names are undefined', () => {
      // Arrange - simulates nameMap missing entries
      const resources = [
        { id: 1, name: undefined },
        { id: 2, name: undefined },
      ];

      // Act
      const message = builder.formatSimpleSuccess('board', 2, resources);

      // Assert
      expect(message).toContain('Successfully deleted 2 boards');
      expect(message).toContain('"Resource ID: 1" (ID: 1)');
      expect(message).toContain('"Resource ID: 2" (ID: 2)');
    });

    it('should handle mixed defined and undefined names', () => {
      // Arrange
      const resources = [
        { id: 1, name: 'Known Board' },
        { id: 2, name: undefined }, // nameMap lookup failed
        { id: 3, name: 'Another Known Board' },
      ];

      // Act
      const message = builder.formatSimpleSuccess('board', 3, resources);

      // Assert
      expect(message).toContain('"Known Board" (ID: 1)');
      expect(message).toContain('"Resource ID: 2" (ID: 2)');
      expect(message).toContain('"Another Known Board" (ID: 3)');
    });

    it('should handle single deletion with name', () => {
      // Arrange
      const resources = [{ id: 42, name: 'Single Board' }];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toBe('✓ Board "Single Board" (ID: 42) deleted successfully');
    });

    it('should handle single deletion without name', () => {
      // Arrange
      const resources = [{ id: 42, name: undefined }];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toBe('✓ Board "Resource ID: 42" (ID: 42) deleted successfully');
    });

    it('should handle empty name string (not undefined)', () => {
      // Arrange - empty string is falsy but not undefined
      const resources = [{ id: 1, name: '' }];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toContain('"Resource ID: 1"'); // Empty string is falsy
    });

    it('should preserve special characters in names', () => {
      // Arrange
      const resources = [
        { id: 1, name: 'Board: "Test" & <Special>' },
      ];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toContain('"Board: "Test" & <Special>" (ID: 1)');
    });
  });

  describe('formatPartialSuccess', () => {
    it('should handle partial success with all names available', () => {
      // Arrange
      const successes = [
        { id: 1, name: 'Success Board 1' },
        { id: 2, name: 'Success Board 2' },
      ];
      const failures = [
        { id: 3, name: 'Failed Board', error: 'Already archived' },
      ];

      // Act
      const message = builder.formatPartialSuccess('board', successes, failures);

      // Assert
      expect(message).toContain('Bulk Delete Partial Success');
      expect(message).toContain('"Success Board 1" (ID: 1)');
      expect(message).toContain('"Success Board 2" (ID: 2)');
      expect(message).toContain('"Failed Board" (ID: 3)');
      expect(message).toContain('Already archived');
    });

    it('should handle partial success with missing names (backward compatibility)', () => {
      // Arrange - old code may not have names in partial success
      const successes = [
        { id: 1, name: 'Board 1' },
        { id: 2, name: 'Board 2' },
      ];
      const failures = [
        { id: 3, name: 'Board 3', error: 'Network timeout' },
      ];

      // Act
      const message = builder.formatPartialSuccess('board', successes, failures);

      // Assert
      expect(message).toContain('(2/3 boards)');
      expect(message).toContain('(1/3 boards)');
    });
  });

  describe('edge cases and defensive programming', () => {
    it('should handle extremely long names', () => {
      // Arrange
      const longName = 'A'.repeat(1000);
      const resources = [{ id: 1, name: longName }];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toContain(`"${longName}"`);
    });

    it('should handle numeric names', () => {
      // Arrange - edge case: name is a number
      const resources = [{ id: 1, name: '12345' }];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toContain('"12345" (ID: 1)');
    });

    it('should handle whitespace-only names', () => {
      // Arrange
      const resources = [{ id: 1, name: '   ' }];

      // Act
      const message = builder.formatSimpleSuccess('board', 1, resources);

      // Assert
      expect(message).toContain('"   " (ID: 1)'); // Preserves whitespace
    });

    it('should handle maximum bulk size (50 items)', () => {
      // Arrange
      const resources = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        name: `Board ${i + 1}`,
      }));

      // Act
      const message = builder.formatSimpleSuccess('board', 50, resources);

      // Assert
      expect(message).toContain('Successfully deleted 50 boards');
      expect(message).toContain('"Board 1" (ID: 1)');
      expect(message).toContain('"Board 50" (ID: 50)');
    });

    it('should handle all undefined names (worst-case scenario)', () => {
      // Arrange - complete nameMap failure
      const resources = [
        { id: 1, name: undefined },
        { id: 2, name: undefined },
        { id: 3, name: undefined },
      ];

      // Act
      const message = builder.formatSimpleSuccess('board', 3, resources);

      // Assert
      expect(message).toContain('"Resource ID: 1"');
      expect(message).toContain('"Resource ID: 2"');
      expect(message).toContain('"Resource ID: 3"');
      expect(message).not.toContain('undefined'); // No raw undefined in output
    });

    it('should handle zero count (should not occur but defensive)', () => {
      // Arrange
      const resources: Array<{ id: number; name?: string }> = [];

      // Act
      const message = builder.formatSimpleSuccess('board', 0, resources);

      // Assert
      expect(message).toContain('0 board'); // Singular form for 0
    });
  });

  describe('resource type variations', () => {
    it('should work for cards', () => {
      // Arrange
      const resources = [
        { id: 1, name: 'Card Alpha' },
        { id: 2, name: undefined },
      ];

      // Act
      const message = builder.formatSimpleSuccess('card', 2, resources);

      // Assert
      expect(message).toContain('Successfully deleted 2 cards');
      expect(message).toContain('"Card Alpha" (ID: 1)');
      expect(message).toContain('"Resource ID: 2" (ID: 2)');
    });

    it('should work for workspaces', () => {
      // Arrange
      const resources = [{ id: 99, name: undefined }];

      // Act
      const message = builder.formatSimpleSuccess('workspace', 1, resources);

      // Assert
      expect(message).toBe('✓ Workspace "Resource ID: 99" (ID: 99) deleted successfully');
    });
  });
});
