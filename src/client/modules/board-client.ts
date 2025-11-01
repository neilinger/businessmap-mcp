import pLimit from 'p-limit';
import {
  ApiResponse,
  Board,
  Column,
  CreateBoardParams,
  CreateLaneParams,
  CurrentBoardStructure,
  CurrentBoardStructureResponse,
  Lane,
} from '../../types/index.js';
import { BULK_OPERATION_DEFAULTS } from '../constants.js';
import { BaseClientModuleImpl } from './base-client.js';

export interface BoardFilters {
  // ID filters (arrays)
  board_ids?: number[];
  workspace_ids?: number[];

  // Expansion options
  expand?: ('workflows' | 'settings' | 'structure')[];

  // Field selection
  fields?: ('board_id' | 'workspace_id' | 'is_archived' | 'name' | 'description' | 'revision')[];

  // Assignment filter
  if_assigned?: number; // 0 or 1

  // Archive status
  is_archived?: number; // 0 or 1

  // Legacy compatibility
  workspace_id?: number;
}

export class BoardClient extends BaseClientModuleImpl {
  /**
   * Get all boards with optional filters
   */
  async getBoards(filters?: BoardFilters): Promise<Board[]> {
    const params = filters || {};
    const response = await this.http.get<ApiResponse<Board[]>>('/boards', { params });
    return response.data.data;
  }

  /**
   * Get a specific board by ID
   */
  async getBoard(boardId: number): Promise<Board> {
    const response = await this.http.get<ApiResponse<Board>>(`/boards/${boardId}`);
    return response.data.data;
  }

  /**
   * Create a new board
   */
  async createBoard(params: CreateBoardParams): Promise<Board> {
    this.checkReadOnlyMode('create board');
    const response = await this.http.post<ApiResponse<Board>>('/boards', params);
    return response.data.data;
  }

  /**
   * Update an existing board
   */
  async updateBoard(boardId: number, params: Partial<CreateBoardParams>): Promise<Board> {
    this.checkReadOnlyMode('update board');
    const response = await this.http.patch<ApiResponse<Board>>(`/boards/${boardId}`, params);
    return response.data.data;
  }

  /**
   * Delete a board
   * @param boardId - The ID of the board to delete
   * @param options - Optional configuration
   * @param options.archive_first - Archive board before deletion to avoid BS05 error. Default: true
   */
  async deleteBoard(boardId: number, options?: { archive_first?: boolean }): Promise<void> {
    this.checkReadOnlyMode('delete board');

    if (options?.archive_first !== false) {
      // Default: true - Archive first
      await this.http.patch(`/boards/${boardId}`, { is_archived: 1 });
    }

    // Then delete
    await this.http.delete(`/boards/${boardId}`);
  }

  /**
   * Get board structure
   */
  async getBoardStructure(boardId: number) {
    const response = await this.http.get(`/boards/${boardId}/structure`);
    return response.data.data;
  }

  /**
   * Get all columns for a board
   */
  async getColumns(boardId: number): Promise<Column[]> {
    const response = await this.http.get<ApiResponse<Column[]>>(`/boards/${boardId}/columns`);
    return response.data.data;
  }

  /**
   * Get all lanes/swimlanes for a board
   */
  async getLanes(boardId: number): Promise<Lane[]> {
    const response = await this.http.get<ApiResponse<Lane[]>>(`/boards/${boardId}/lanes`);
    return response.data.data;
  }

  /**
   * Get a specific lane by ID
   */
  async getLane(laneId: number): Promise<Lane> {
    const response = await this.http.get<ApiResponse<Lane>>(`/lanes/${laneId}`);
    return response.data.data;
  }

  /**
   * Create a new lane/swimlane
   */
  async createLane(params: CreateLaneParams): Promise<Lane> {
    this.checkReadOnlyMode('create lane');
    const response = await this.http.post<ApiResponse<Lane>>('/lanes', params);
    return response.data.data;
  }

  /**
   * Get current board structure with detailed configuration
   */
  async getCurrentBoardStructure(boardId: number): Promise<CurrentBoardStructure> {
    const response = await this.http.get<CurrentBoardStructureResponse>(
      `/boards/${boardId}/currentStructure`
    );
    return response.data.data;
  }

  /**
   * Bulk delete boards (T058)
   * Deletes multiple boards concurrently using Promise.all() with rate limiting
   *
   * @param boardIds - Array of board IDs to delete (max 500)
   * @param options - Optional configuration
   * @param options.maxConcurrent - Maximum concurrent requests (default: 10)
   *
   * @returns Array of results with success/failure status for each board
   *
   * @throws TypeError if boardIds is not an array
   * @throws RangeError if batch size exceeds 500 or IDs are invalid
   * @throws Error if in read-only mode
   *
   * @remarks
   * - Each delete makes 2 API calls (PATCH to archive + DELETE)
   * - Maximum 10 concurrent requests by default (configurable)
   * - Recommended batch size: 50-100 items for optimal performance
   * - Monitor rate limits for large batches
   *
   * @example
   * const results = await client.boards.bulkDeleteBoards([1, 2, 3]);
   * const failed = results.filter(r => !r.success);
   */
  async bulkDeleteBoards(
    boardIds: number[],
    options?: { maxConcurrent?: number }
  ): Promise<Array<{ id: number; success: boolean; error?: string }>> {
    // 1. Input validation
    if (!Array.isArray(boardIds)) {
      throw new TypeError('boardIds must be an array');
    }
    if (boardIds.length === 0) {
      return [];
    }
    if (boardIds.length > BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE) {
      throw new RangeError(`Maximum batch size is ${BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE}`);
    }
    const invalidIds = boardIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new RangeError(
        `All board IDs must be positive integers (found invalid: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''})`
      );
    }

    this.checkReadOnlyMode('bulk delete boards');

    // 2. Rate limiting with p-limit
    const limit = pLimit(options?.maxConcurrent || BULK_OPERATION_DEFAULTS.MAX_CONCURRENT);

    const promises = boardIds.map((id) =>
      limit(async () => {
        try {
          await this.deleteBoard(id);
          return { id, success: true };
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
   * Bulk update boards (T062)
   * Updates multiple boards concurrently using Promise.all() with rate limiting
   *
   * @param boardIds - Array of board IDs to update (max 500)
   * @param updates - Board properties to update (applied to all boards)
   * @param options - Optional configuration
   * @param options.maxConcurrent - Maximum concurrent requests (default: 10)
   *
   * @returns Array of results with success/failure status and updated board for each ID
   *
   * @throws TypeError if boardIds is not an array
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
   * const results = await client.boards.bulkUpdateBoards(
   *   [1, 2, 3],
   *   { name: 'Updated Board', description: 'New description' }
   * );
   * const successful = results.filter(r => r.success);
   */
  async bulkUpdateBoards(
    boardIds: number[],
    updates: Partial<CreateBoardParams>,
    options?: { maxConcurrent?: number }
  ): Promise<Array<{ id: number; success: boolean; board?: Board; error?: string }>> {
    // 1. Input validation
    if (!Array.isArray(boardIds)) {
      throw new TypeError('boardIds must be an array');
    }
    if (boardIds.length === 0) {
      return [];
    }
    if (boardIds.length > BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE) {
      throw new RangeError(`Maximum batch size is ${BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE}`);
    }
    const invalidIds = boardIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new RangeError(
        `All board IDs must be positive integers (found invalid: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''})`
      );
    }

    this.checkReadOnlyMode('bulk update boards');

    // 2. Rate limiting with p-limit
    const limit = pLimit(options?.maxConcurrent || BULK_OPERATION_DEFAULTS.MAX_CONCURRENT);

    const promises = boardIds.map((id) =>
      limit(async () => {
        try {
          const board = await this.updateBoard(id, updates);
          return { id, success: true, board };
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
