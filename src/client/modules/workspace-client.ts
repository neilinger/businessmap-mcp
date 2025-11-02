import pLimit from 'p-limit';
import { ApiResponse, CreateWorkspaceParams, Workspace } from '../../types/index.js';
import { BULK_OPERATION_DEFAULTS } from '../constants.js';
import { BaseClientModuleImpl } from './base-client.js';

export class WorkspaceClient extends BaseClientModuleImpl {
  /**
   * Get all workspaces
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const ttl = this.config.cacheWorkspacesTtl || 900000; // 15 minutes default
    return this.cache.get<Workspace[]>(
      'workspaces:all',
      async () => {
        const response = await this.http.get<ApiResponse<Workspace[]>>('/workspaces');
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Get a specific workspace by ID
   */
  async getWorkspace(workspaceId: number): Promise<Workspace> {
    const ttl = this.config.cacheWorkspacesTtl || 900000; // 15 minutes default
    return this.cache.get<Workspace>(
      `workspace:${workspaceId}`,
      async () => {
        const response = await this.http.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`);
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    this.checkReadOnlyMode('create workspace');
    const response = await this.http.post<ApiResponse<Workspace>>('/workspaces', params);
    
    // Invalidate workspaces list cache
    this.cache.invalidate(/^workspaces:/);
    
    return response.data.data;
  }

  /**
   * Update an existing workspace
   */
  async updateWorkspace(
    workspaceId: number,
    params: Partial<CreateWorkspaceParams>
  ): Promise<Workspace> {
    this.checkReadOnlyMode('update workspace');
    const response = await this.http.patch<ApiResponse<Workspace>>(
      `/workspaces/${workspaceId}`,
      params
    );
    
    // Invalidate cache for this workspace and list
    this.cache.invalidate(/^workspaces:/);
    this.cache.invalidate(`workspace:${workspaceId}`);
    
    return response.data.data;
  }

  /**
   * Archive a workspace (soft delete)
   * @param workspaceId - The ID of the workspace to archive
   * @remarks API does not support permanent deletion (DELETE returns 405). Only archiving is available.
   */
  async archiveWorkspace(workspaceId: number): Promise<Workspace> {
    this.checkReadOnlyMode('archive workspace');

    const response = await this.http.patch<ApiResponse<Workspace>>(
      `/workspaces/${workspaceId}`,
      { is_archived: 1 }
    );
    
    // Invalidate cache for this workspace and list
    this.cache.invalidate(/^workspaces:/);
    this.cache.invalidate(`workspace:${workspaceId}`);
    
    return response.data.data;
  }

  /**
   * Bulk archive workspaces (T057)
   * Archives multiple workspaces concurrently using Promise.all() with rate limiting
   *
   * @param workspaceIds - Array of workspace IDs to archive (max 500)
   * @param options - Optional configuration
   * @param options.maxConcurrent - Maximum concurrent requests (default: 10)
   *
   * @returns Array of results with success/failure status and archived workspace for each ID
   *
   * @throws TypeError if workspaceIds is not an array
   * @throws RangeError if batch size exceeds 500 or IDs are invalid
   * @throws Error if in read-only mode
   *
   * @remarks
   * - Each archive makes 1 API call (PATCH to set is_archived)
   * - Maximum 10 concurrent requests by default (configurable)
   * - Recommended batch size: 100-200 items for optimal performance
   * - Monitor rate limits for large batches
   *
   * @example
   * const results = await client.workspaces.bulkArchiveWorkspaces([1, 2, 3]);
   * const successful = results.filter(r => r.success);
   */
  async bulkArchiveWorkspaces(
    workspaceIds: number[],
    options?: { maxConcurrent?: number }
  ): Promise<Array<{ id: number; success: boolean; workspace?: Workspace; error?: string }>> {
    // 1. Input validation
    if (!Array.isArray(workspaceIds)) {
      throw new TypeError('workspaceIds must be an array');
    }
    if (workspaceIds.length === 0) {
      return [];
    }
    if (workspaceIds.length > BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE) {
      throw new RangeError(`Maximum batch size is ${BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE}`);
    }
    const invalidIds = workspaceIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new RangeError(
        `All workspace IDs must be positive integers (found invalid: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''})`
      );
    }

    this.checkReadOnlyMode('bulk archive workspaces');

    // 2. Rate limiting with p-limit
    const limit = pLimit(options?.maxConcurrent || BULK_OPERATION_DEFAULTS.MAX_CONCURRENT);

    const promises = workspaceIds.map((id) =>
      limit(async () => {
        try {
          const workspace = await this.archiveWorkspace(id);
          return { id, success: true, workspace };
        } catch (error) {
          return {
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return await Promise.all(promises);
  }

  /**
   * Bulk update workspaces (T061)
   * Updates multiple workspaces concurrently using Promise.all() with rate limiting
   *
   * @param workspaceIds - Array of workspace IDs to update (max 500)
   * @param updates - Workspace properties to update (applied to all workspaces)
   * @param options - Optional configuration
   * @param options.maxConcurrent - Maximum concurrent requests (default: 10)
   *
   * @returns Array of results with success/failure status and updated workspace for each ID
   *
   * @throws TypeError if workspaceIds is not an array
   * @throws RangeError if batch size exceeds 500 or IDs are invalid
   * @throws Error if in read-only mode
   *
   * @remarks
   * - Each update makes 1 API call (PATCH)
   * - Maximum 10 concurrent requests by default (configurable)
   * - Recommended batch size: 100-200 items for optimal performance
   * - Monitor rate limits for large batches
   *
   * @example
   * const results = await client.workspaces.bulkUpdateWorkspaces(
   *   [1, 2, 3],
   *   { name: 'Updated Workspace', description: 'New description' }
   * );
   * const successful = results.filter(r => r.success);
   */
  async bulkUpdateWorkspaces(
    workspaceIds: number[],
    updates: Partial<CreateWorkspaceParams>,
    options?: { maxConcurrent?: number }
  ): Promise<Array<{ id: number; success: boolean; workspace?: Workspace; error?: string }>> {
    // 1. Input validation
    if (!Array.isArray(workspaceIds)) {
      throw new TypeError('workspaceIds must be an array');
    }
    if (workspaceIds.length === 0) {
      return [];
    }
    if (workspaceIds.length > BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE) {
      throw new RangeError(`Maximum batch size is ${BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE}`);
    }
    const invalidIds = workspaceIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new RangeError(
        `All workspace IDs must be positive integers (found invalid: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''})`
      );
    }

    this.checkReadOnlyMode('bulk update workspaces');

    // 2. Rate limiting with p-limit
    const limit = pLimit(options?.maxConcurrent || BULK_OPERATION_DEFAULTS.MAX_CONCURRENT);

    const promises = workspaceIds.map((id) =>
      limit(async () => {
        try {
          const workspace = await this.updateWorkspace(id, updates);
          return { id, success: true, workspace };
        } catch (error) {
          return {
            id,
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
          };
        }
      })
    );

    return await Promise.all(promises);
  }
}
