import { ApiResponse, CreateWorkspaceParams, Workspace } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class WorkspaceClient extends BaseClientModuleImpl {
  /**
   * Get all workspaces
   */
  async getWorkspaces(): Promise<Workspace[]> {
    const response = await this.http.get<ApiResponse<Workspace[]>>('/workspaces');
    return response.data.data;
  }

  /**
   * Get a specific workspace by ID
   */
  async getWorkspace(workspaceId: number): Promise<Workspace> {
    const response = await this.http.get<ApiResponse<Workspace>>(`/workspaces/${workspaceId}`);
    return response.data.data;
  }

  /**
   * Create a new workspace
   */
  async createWorkspace(params: CreateWorkspaceParams): Promise<Workspace> {
    this.checkReadOnlyMode('create workspace');
    const response = await this.http.post<ApiResponse<Workspace>>('/workspaces', params);
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
    return response.data.data;
  }

  /**
   * Bulk archive workspaces (T057)
   * Archives multiple workspaces sequentially
   */
  async bulkArchiveWorkspaces(workspaceIds: number[]): Promise<Array<{ id: number; success: boolean; workspace?: Workspace; error?: string }>> {
    this.checkReadOnlyMode('bulk archive workspaces');

    const results = [];
    for (const id of workspaceIds) {
      try {
        const workspace = await this.archiveWorkspace(id);
        results.push({ id, success: true, workspace });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }

  /**
   * Bulk update workspaces (T061)
   * Updates multiple workspaces sequentially with the same changes
   */
  async bulkUpdateWorkspaces(
    workspaceIds: number[],
    updates: Partial<CreateWorkspaceParams>
  ): Promise<Array<{ id: number; success: boolean; workspace?: Workspace; error?: string }>> {
    this.checkReadOnlyMode('bulk update workspaces');

    const results = [];
    for (const id of workspaceIds) {
      try {
        const workspace = await this.updateWorkspace(id, updates);
        results.push({ id, success: true, workspace });
      } catch (error) {
        results.push({
          id,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return results;
  }
}
