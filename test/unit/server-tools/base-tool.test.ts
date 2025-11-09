/**
 * Comprehensive unit tests for base-tool utilities
 * Tests helper functions for error/success responses and client handling
 * Target: 100% code coverage of utility functions
 */

import { jest } from '@jest/globals';
import {
  createErrorResponse,
  createSuccessResponse,
  getClientForInstance,
  isMultiInstanceMode,
} from '../../../src/server/tools/base-tool.js';
import { BusinessMapClient } from '../../../src/client/businessmap-client.js';
import { BusinessMapClientFactory } from '../../../src/client/client-factory.js';

describe('base-tool - Utility Functions', () => {
  describe('createErrorResponse', () => {
    it('should create error response with Error object', () => {
      const error = new Error('Test error message');
      const result = createErrorResponse(error, 'test operation');

      expect(result.isError).toBe(true);
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');
      expect(result.content[0]?.text).toContain('Error test operation');
      expect(result.content[0]?.text).toContain('Test error message');
    });

    it('should handle non-Error objects', () => {
      const result = createErrorResponse('String error', 'operation');

      expect(result.isError).toBe(true);
      // String errors are treated as unknown in createErrorResponse
      expect(result.content[0]?.text).toContain('Error operation');
    });

    it('should handle unknown error gracefully', () => {
      const result = createErrorResponse(null, 'unknown operation');

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain('Unknown error');
    });

    it('should include operation name in error message', () => {
      const error = new Error('Database failed');
      const result = createErrorResponse(error, 'fetching board');

      expect(result.content[0]?.text).toContain('Error fetching board');
      expect(result.content[0]?.text).toContain('Database failed');
    });
  });

  describe('createSuccessResponse', () => {
    it('should create success response with compact JSON by default', () => {
      const data = { id: 1, name: 'Test' };
      const result = createSuccessResponse(data);

      expect(result).not.toHaveProperty('isError');
      expect(result.content).toHaveLength(1);
      expect(result.content[0]?.type).toBe('text');

      const parsedJson = JSON.parse(result.content[0]?.text || '{}');
      expect(parsedJson).toEqual(data);
    });

    it('should include message prefix when provided', () => {
      const data = { id: 1 };
      const message = 'Board retrieved successfully';
      const result = createSuccessResponse(data, message);

      expect(result.content[0]?.text).toContain(message);
      expect(result.content[0]?.text).toContain('"id":1');
    });

    it('should handle array data', () => {
      const data = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = createSuccessResponse(data);

      const parsedJson = JSON.parse(result.content[0]?.text || '[]');
      expect(Array.isArray(parsedJson)).toBe(true);
      expect(parsedJson).toHaveLength(3);
    });

    it('should handle null values', () => {
      const result = createSuccessResponse(null);

      const parsedJson = JSON.parse(result.content[0]?.text || 'null');
      expect(parsedJson).toBeNull();
    });

    it('should handle empty objects', () => {
      const result = createSuccessResponse({});

      const parsedJson = JSON.parse(result.content[0]?.text || '{}');
      expect(Object.keys(parsedJson)).toHaveLength(0);
    });
  });

  describe('getClientForInstance', () => {
    let mockClient: jest.Mocked<Partial<BusinessMapClient>>;

    beforeEach(() => {
      mockClient = {
        getCards: jest.fn(),
      } as any;
    });

    it('should return client when passed BusinessMapClient directly', async () => {
      const result = await getClientForInstance(mockClient as any);

      expect(result).toBeDefined();
    });

    it('should work without instance parameter', async () => {
      const result = await getClientForInstance(mockClient as any);

      expect(result).toBeDefined();
    });
  });

  describe('isMultiInstanceMode', () => {
    let mockClient: jest.Mocked<Partial<BusinessMapClient>>;

    beforeEach(() => {
      mockClient = {} as any;
    });

    it('should return false for BusinessMapClient', () => {
      const result = isMultiInstanceMode(mockClient as any);

      expect(result).toBe(false);
    });

    it('should return true for BusinessMapClientFactory', () => {
      const fakeFactory = Object.create(BusinessMapClientFactory.prototype);
      const result = isMultiInstanceMode(fakeFactory);

      expect(result).toBe(true);
    });
  });

  describe('response content structure', () => {
    it('should always include content array in responses', () => {
      const errorResponse = createErrorResponse('error', 'op');
      const successResponse = createSuccessResponse({ data: true });

      expect(Array.isArray(errorResponse.content)).toBe(true);
      expect(Array.isArray(successResponse.content)).toBe(true);
    });

    it('should always include type property in content items', () => {
      const errorResponse = createErrorResponse('error', 'op');
      const successResponse = createSuccessResponse({});

      expect(errorResponse.content[0]?.type).toBe('text');
      expect(successResponse.content[0]?.type).toBe('text');
    });

    it('should always include text property in content items', () => {
      const errorResponse = createErrorResponse('error', 'op');
      const successResponse = createSuccessResponse({});

      expect(typeof errorResponse.content[0]?.text).toBe('string');
      expect(typeof successResponse.content[0]?.text).toBe('string');
    });
  });
});
