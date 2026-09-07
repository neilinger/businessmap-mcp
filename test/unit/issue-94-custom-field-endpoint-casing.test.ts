/**
 * Regression tests for Issue #94: custom-field endpoints used snake_case.
 *
 * The BusinessMap v2 API serves `/customFields`; the client requested
 * `/custom_fields`. The API answers a clean 404, so every custom-field
 * operation failed in a way that read as "this account has no custom fields"
 * rather than "wrong path".
 *
 * These tests assert the requested PATH rather than the response, because the
 * casing is the whole defect and a mocked response cannot express it.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import type { AxiosInstance } from 'axios';

import { CustomFieldClient } from '../../src/client/modules/custom-field-client.js';
import type { BusinessMapConfig } from '../../src/types/index.js';

describe('Issue #94: custom-field endpoint casing', () => {
  let client: CustomFieldClient;
  let http: { get: jest.Mock; post: jest.Mock; patch: jest.Mock; delete: jest.Mock };

  beforeEach(() => {
    const ok = async () => ({ data: { data: [] } });
    http = {
      get: jest.fn(ok as never),
      post: jest.fn(ok as never),
      patch: jest.fn(ok as never),
      delete: jest.fn(ok as never),
    };
    client = new CustomFieldClient();
    // Cache disabled: a cached read would skip the HTTP call the test asserts.
    client.initialize(
      http as unknown as AxiosInstance,
      {
        cacheEnabled: false,
        readOnlyMode: false,
      } as BusinessMapConfig
    );
  });

  const pathOf = (mock: jest.Mock): string => String(mock.mock.calls[0]?.[0]);

  it('lists custom fields at /customFields', async () => {
    await client.listCustomFields();
    expect(pathOf(http.get)).toBe('/customFields');
  });

  it('lists board custom fields at /boards/{id}/customFields', async () => {
    await client.listBoardCustomFields(42);
    expect(pathOf(http.get)).toBe('/boards/42/customFields');
  });

  it('gets one custom field at /customFields/{id}', async () => {
    await client.getCustomField(14);
    expect(pathOf(http.get)).toBe('/customFields/14');
  });

  it('deletes a custom field at /customFields/{id}', async () => {
    await client.deleteCustomField(14);
    expect(pathOf(http.delete)).toBe('/customFields/14');
  });

  it('never requests a snake_case custom-field path', async () => {
    await client.listCustomFields();
    await client.listBoardCustomFields(42);
    await client.getCustomField(14);
    await client.deleteCustomField(14);

    const requested = [...http.get.mock.calls, ...http.delete.mock.calls].map((call) =>
      String(call[0])
    );
    for (const path of requested) {
      expect(path).not.toContain('custom_fields');
    }
  });
});
