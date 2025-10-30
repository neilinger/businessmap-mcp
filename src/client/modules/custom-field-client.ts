import { ApiResponse, CustomField } from '../../types/index.js';
import { BaseClientModuleImpl } from './base-client.js';

export class CustomFieldClient extends BaseClientModuleImpl {
  /**
   * List all custom field definitions
   */
  async listCustomFields(params?: {
    page?: number;
    page_size?: number;
    field_type?: string;
  }): Promise<ApiResponse<CustomField[]>> {
    const response = await this.http.get<ApiResponse<CustomField[]>>('/custom_fields', {
      params,
    });
    return response.data;
  }

  /**
   * List custom fields for a specific board
   */
  async listBoardCustomFields(boardId: number): Promise<CustomField[]> {
    const ttl = this.config.cacheTtl || 300000; // 5 minutes default
    return this.cache.get<CustomField[]>(
      `customFields:board:${boardId}`,
      async () => {
        const response = await this.http.get<ApiResponse<CustomField[]>>(
          `/boards/${boardId}/custom_fields`
        );
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Get a specific custom field by ID
   */
  async getCustomField(customFieldId: number): Promise<CustomField> {
    const ttl = this.config.cacheTtl || 300000; // 5 minutes default
    return this.cache.get<CustomField>(
      `customField:${customFieldId}`,
      async () => {
        const response = await this.http.get<ApiResponse<CustomField>>(
          `/custom_fields/${customFieldId}`
        );
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Create a new custom field
   */
  async createCustomField(params: {
    board_id: number;
    name: string;
    field_type: string;
    description?: string;
    is_required?: boolean;
    position?: number;
    options?: Array<{ value: string; color: string }>;
    validation?: {
      min?: number;
      max?: number;
    };
  }): Promise<CustomField> {
    this.checkReadOnlyMode('create custom field');

    const response = await this.http.post<ApiResponse<CustomField>>(
      `/boards/${params.board_id}/custom_fields`,
      params
    );

    // Invalidate custom fields cache for this board
    this.cache.invalidate(`customFields:board:${params.board_id}`);

    return response.data.data;
  }

  /**
   * Update an existing custom field
   */
  async updateCustomField(
    customFieldId: number,
    params: {
      name?: string;
      description?: string;
      is_required?: boolean;
      position?: number;
      options?: Array<{ id?: number; value: string; color: string }>;
      validation?: {
        min?: number;
        max?: number;
      };
    }
  ): Promise<CustomField> {
    this.checkReadOnlyMode('update custom field');

    const response = await this.http.patch<ApiResponse<CustomField>>(
      `/custom_fields/${customFieldId}`,
      params
    );
    
    // Invalidate cache for this custom field and all board custom field lists
    this.cache.invalidate(`customField:${customFieldId}`);
    this.cache.invalidate(/^customFields:board:/);
    
    return response.data.data;
  }

  /**
   * Delete a custom field
   */
  async deleteCustomField(customFieldId: number): Promise<void> {
    this.checkReadOnlyMode('delete custom field');

    await this.http.delete(`/custom_fields/${customFieldId}`);
    
    // Invalidate cache for this custom field and all board custom field lists
    this.cache.invalidate(`customField:${customFieldId}`);
    this.cache.invalidate(/^customFields:board:/);
  }
}
