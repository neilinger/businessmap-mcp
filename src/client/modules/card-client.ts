import pLimit from 'p-limit';
import {
  ApiResponse,
  Card,
  CardCustomField,
  CardCustomFieldsResponse,
  CardHistoryItem,
  CardHistoryResponse,
  CardOutcomesResponse,
  CardType,
  CardTypesResponse,
  ChildCardItem,
  ChildCardsResponse,
  Comment,
  CommentListResponse,
  CommentResponse,
  CreateCardParams,
  CreateCommentParams,
  CreateSubtaskParams,
  LinkedCard,
  LinkedCardItem,
  LinkedCardsResponse,
  Outcome,
  ParentCardItem,
  ParentCardPositionResponse,
  ParentCardsResponse,
  ParentGraphItem,
  ParentGraphResponse,
  Subtask,
  SubtaskResponse,
  SubtasksResponse,
  UpdateCardParams,
  UpdateCommentParams,
  UpdateSubtaskParams,
} from '@defs/index.js';
import { BULK_OPERATION_DEFAULTS } from '../constants.js';
import { BaseClientModuleImpl } from './base-client.js';
import { logger } from '@utils/logger.js';

/**
 * Filters for querying cards.
 *
 * Comprehensive filtering options for cards including date ranges,
 * board/column/lane locations, ownership, priorities, custom fields,
 * and pagination.
 *
 * @example
 * ```typescript
 * // Get cards by owner and priority
 * const filters: CardFilters = {
 *   owner_user_ids: [userId],
 *   priorities: [1, 2], // High and Medium
 *   board_ids: [boardId],
 * };
 *
 * // Get cards with deadline in next 7 days
 * const upcomingFilters: CardFilters = {
 *   deadline_from_date: new Date().toISOString(),
 *   deadline_to_date: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
 * };
 * ```
 */

export interface CardFilters {
  // Date and time filters
  archived_from?: string;
  archived_from_date?: string;
  archived_to?: string;
  archived_to_date?: string;
  created_from?: string;
  created_from_date?: string;
  created_to?: string;
  created_to_date?: string;
  deadline_from?: string;
  deadline_from_date?: string;
  deadline_to?: string;
  deadline_to_date?: string;
  discarded_from?: string;
  discarded_from_date?: string;
  discarded_to?: string;
  discarded_to_date?: string;
  first_end_from?: string;
  first_end_from_date?: string;
  first_end_to?: string;
  first_end_to_date?: string;
  first_start_from?: string;
  first_start_from_date?: string;
  first_start_to?: string;
  first_start_to_date?: string;
  in_current_position_since_from?: string;
  in_current_position_since_from_date?: string;
  in_current_position_since_to?: string;
  in_current_position_since_to_date?: string;
  last_end_from?: string;
  last_end_from_date?: string;
  last_end_to?: string;
  last_end_to_date?: string;
  last_modified_from?: string;
  last_modified_from_date?: string;
  last_modified_to?: string;
  last_modified_to_date?: string;
  last_start_from?: string;
  last_start_from_date?: string;
  last_start_to?: string;
  last_start_to_date?: string;

  // ID filters (arrays)
  board_ids?: number[];
  card_ids?: number[];
  column_ids?: number[];
  lane_ids?: number[];
  last_column_ids?: number[];
  last_lane_ids?: number[];
  owner_user_ids?: number[];
  priorities?: number[];
  reason_ids?: number[];
  sections?: number[];
  sizes?: number[];
  type_ids?: number[];
  version_ids?: number[];
  workflow_ids?: number[];

  // String array filters
  colors?: string[];
  custom_ids?: string[];

  // Configuration options
  include_logged_time_for_child_cards?: number;
  include_logged_time_for_subtasks?: number;

  // Pagination
  page?: number;
  per_page?: number;

  // Legacy compatibility (keeping for backward compatibility)
  assignee_user_id?: number;
  tag_ids?: number[];
}

/**
 * Card Management Client
 *
 * Handles all card-related operations including CRUD, comments, subtasks,
 * parent-child relationships, custom fields, and bulk operations.
 *
 * Features:
 * - Card lifecycle management (create, read, update, move, delete)
 * - Comment management with CRUD operations
 * - Subtask management
 * - Parent-child card relationships and hierarchy graphs
 * - Card history and outcomes tracking
 * - Custom field values
 * - Bulk operations with configurable concurrency
 * - Automatic preservation of linked_cards during updates
 * - Safe deletion with automatic archiving
 *
 * @example
 * ```typescript
 * // Create a new card
 * const card = await cardClient.createCard({
 *   title: 'New Task',
 *   column_id: columnId,
 *   owner_user_id: userId,
 * });
 *
 * // Move card to different column/lane
 * await cardClient.moveCard(cardId, newColumnId, laneId);
 *
 * // Get card with all relationships
 * const parents = await cardClient.getCardParents(cardId);
 * const children = await cardClient.getCardChildren(cardId);
 * const graph = await cardClient.getCardParentGraph(cardId);
 * ```
 *
 * @see {@link CardFilters} for available query filters
 */

export class CardClient extends BaseClientModuleImpl {
  /**
   * Get cards from a board with optional filters
   */
  async getCards(boardId: number, filters?: CardFilters): Promise<Card[]> {
    const params = { board_id: boardId, ...filters };
    const response = await this.http.get<ApiResponse<Card[]>>('/cards', { params });
    return response.data.data;
  }

  /**
   * Get a specific card by ID
   */
  async getCard(cardId: number): Promise<Card> {
    const response = await this.http.get<ApiResponse<Card>>(`/cards/${cardId}`);
    return response.data.data;
  }

  /**
   * Create a new card
   *
   * NOTE: The BusinessMap API wraps the response in an array even for single card creation.
   * This method extracts the first card from the array to return a single Card object.
   */
  async createCard(params: CreateCardParams): Promise<Card> {
    this.checkReadOnlyMode('create card');
    const response = await this.http.post<ApiResponse<Card | Card[]>>('/cards', params);
    // Handle both single object and array responses from the API
    const data = response.data.data;
    if (Array.isArray(data) && data.length > 0) {
      // Non-null assertion safe: length check guarantees element exists
      return data[0]!;
    }
    return data as Card;
  }

  /**
   * Update an existing card
   *
   * IMPORTANT: This method automatically preserves linked_cards to prevent data loss.
   * BusinessMap API resets omitted fields to empty in PATCH requests, causing
   * parent-child relationships to be lost. This wrapper fetches current state
   * and merges it with updates before sending the PATCH request.
   *
   * @param params - Update parameters including card_id
   * @returns Updated card with all fields preserved
   */
  async updateCard(params: UpdateCardParams): Promise<Card> {
    this.checkReadOnlyMode('update card');
    const { card_id, subtasks_to_add, ...updateData } = params;

    // Ensure card_id is defined
    const cardId = card_id ?? params.id;
    if (!cardId) {
      throw new Error('card_id is required for updateCard');
    }

    // Preserve linked_cards unless explicitly provided in updateData
    // This prevents BusinessMap API from resetting the field to empty
    if (!updateData.linked_cards) {
      try {
        // Fetch current card state to get existing linked_cards
        const currentCard = await this.getCard(cardId);

        // Merge current linked_cards with update data
        updateData.linked_cards = currentCard.linked_cards;

        // Preserve linked_cards during updates
      } catch (error) {
        // If getCard fails, log warning but proceed with update
        // This allows update to succeed even if fetch fails (transient error)
        logger.warn('[card-client] Failed to fetch card for linked_cards preservation', {
          cardId,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${cardId}`, updateData);
    const updatedCard = response.data.data;

    // Handle subtasks_to_add by creating each subtask via dedicated endpoint
    // The BusinessMap API ignores subtasks_to_add in PATCH /cards/{id} requests
    // See: https://github.com/user/repo/issues/31
    if (subtasks_to_add && subtasks_to_add.length > 0) {
      for (const subtask of subtasks_to_add) {
        try {
          await this.createCardSubtask(cardId, {
            description: subtask.description,
            owner_user_id: subtask.owner_user_id,
            is_finished: subtask.is_finished,
            deadline: subtask.deadline ?? undefined,
            position: subtask.position,
            attachments_to_add: subtask.attachments_to_add,
          });
        } catch (error) {
          logger.error('[card-client] Failed to create subtask for card', {
            cardId,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Continue creating other subtasks even if one fails
        }
      }
    }

    return updatedCard;
  }

  /**
   * Move a card to a different column or lane
   *
   * IMPORTANT: This method automatically preserves linked_cards during moves.
   * Card moves across workflows are particularly prone to data loss as the API
   * resets omitted fields. This wrapper ensures parent-child relationships
   * survive cross-workflow moves.
   *
   * @param cardId - ID of card to move
   * @param columnId - Target column ID
   * @param laneId - Optional target lane ID
   * @param position - Optional position in target column
   * @returns Moved card with all relationships preserved
   */
  async moveCard(
    cardId: number,
    columnId: number,
    laneId?: number,
    position?: number
  ): Promise<Card> {
    this.checkReadOnlyMode('move card');

    // Preserve linked_cards during move operation
    // Cross-workflow moves are especially prone to data loss
    let linkedCards: LinkedCard[] | undefined;
    try {
      const currentCard = await this.getCard(cardId);
      linkedCards = currentCard.linked_cards;
    } catch (error) {
      // Failed to fetch card for preservation - proceed with move anyway
    }

    const response = await this.http.patch<ApiResponse<Card>>(`/cards/${cardId}`, {
      column_id: columnId,
      lane_id: laneId,
      position: position,
      linked_cards: linkedCards,
    });
    return response.data.data;
  }

  /**
   * Delete a card
   * @param cardId - The ID of the card to delete
   * @param options - Optional configuration
   * @param options.archive_first - Archive card before deletion to avoid BS05 error. Default: true
   */
  async deleteCard(cardId: number, options?: { archive_first?: boolean }): Promise<void> {
    this.checkReadOnlyMode('delete card');

    if (options?.archive_first !== false) {
      // Default: true - Archive first
      await this.http.patch(`/cards/${cardId}`, { is_archived: 1 });
    }

    // Then delete
    await this.http.delete(`/cards/${cardId}`);
  }

  /**
   * Get comments for a specific card
   */
  async getCardComments(cardId: number): Promise<Comment[]> {
    const response = await this.http.get<CommentListResponse>(`/cards/${cardId}/comments`);
    return response.data.comments ?? [];
  }

  /**
   * Get details of a specific comment
   */
  async getCardComment(cardId: number, commentId: number): Promise<Comment> {
    const response = await this.http.get<any>(`/cards/${cardId}/comments/${commentId}`);
    // API returns { data: Comment } but without comment_id - add it from path param
    const comment = response.data.data || response.data;
    return {
      ...comment,
      comment_id: commentId, // API doesn't return this for single comment, only for list
    };
  }

  /**
   * Update a card comment
   */
  async updateCardComment(
    cardId: number,
    commentId: number,
    params: UpdateCommentParams
  ): Promise<Comment> {
    this.checkReadOnlyMode('update card comment');
    const response = await this.http.patch<CommentResponse>(
      `/cards/${cardId}/comments/${commentId}`,
      params
    );
    return response.data.data;
  }

  /**
   * Delete a card comment
   */
  async deleteCardComment(cardId: number, commentId: number): Promise<void> {
    this.checkReadOnlyMode('delete card comment');
    await this.http.delete(`/cards/${cardId}/comments/${commentId}`);
  }

  /**
   * Create a new comment on a card
   * @param cardId - The card ID to add comment to
   * @param params - Comment parameters (text required, attachments optional)
   * @returns Created comment response
   */
  async createCardComment(cardId: number, params: CreateCommentParams): Promise<Comment> {
    this.checkReadOnlyMode('create card comment');
    const trimmedText = params.text.trim();
    if (!trimmedText) {
      throw new Error('Comment text cannot be empty or whitespace-only');
    }
    const response = await this.http.post<CommentResponse>(`/cards/${cardId}/comments`, {
      ...params,
      text: trimmedText,
    });
    return response.data.data;
  }

  /**
   * Get custom fields for a specific card
   */
  async getCardCustomFields(cardId: number): Promise<CardCustomField[]> {
    const response = await this.http.get<CardCustomFieldsResponse>(`/cards/${cardId}/customFields`);
    return response.data.data;
  }

  /**
   * Get all card types
   */
  async getCardTypes(): Promise<CardType[]> {
    const ttl = this.config.cacheCardTypesTtl || 300000; // 5 minutes default
    return this.cache.get<CardType[]>(
      'cardTypes:all',
      async () => {
        const response = await this.http.get<CardTypesResponse>('/cardTypes');
        return response.data.data;
      },
      ttl
    );
  }

  /**
   * Get card outcome history
   */
  async getCardHistory(cardId: number, outcomeId: number): Promise<CardHistoryItem[]> {
    const response = await this.http.get<CardHistoryResponse>(
      `/cards/${cardId}/outcomes/${outcomeId}/history`
    );
    return response.data.data;
  }

  /**
   * Get card outcomes
   */
  async getCardOutcomes(cardId: number): Promise<Outcome[]> {
    const response = await this.http.get<CardOutcomesResponse>(`/cards/${cardId}/outcomes`);
    return response.data.data;
  }

  /**
   * Get linked cards for a specific card
   */
  async getCardLinkedCards(cardId: number): Promise<LinkedCardItem[]> {
    const response = await this.http.get<LinkedCardsResponse>(`/cards/${cardId}/linkedCards`);
    return response.data.data;
  }

  /**
   * Get subtasks for a specific card
   */
  async getCardSubtasks(cardId: number): Promise<Subtask[]> {
    const response = await this.http.get<SubtasksResponse>(`/cards/${cardId}/subtasks`);
    return response.data.data;
  }

  /**
   * Get details of a specific subtask
   */
  async getCardSubtask(cardId: number, subtaskId: number): Promise<Subtask> {
    const response = await this.http.get<SubtaskResponse>(`/cards/${cardId}/subtasks/${subtaskId}`);
    return response.data.data;
  }

  /**
   * Create a new subtask for a card
   */
  async createCardSubtask(cardId: number, params: CreateSubtaskParams): Promise<Subtask> {
    this.checkReadOnlyMode('create subtask');
    const response = await this.http.post<SubtaskResponse>(`/cards/${cardId}/subtasks`, params);
    return response.data.data;
  }

  /**
   * Update a card subtask
   */
  async updateCardSubtask(
    cardId: number,
    subtaskId: number,
    params: UpdateSubtaskParams
  ): Promise<Subtask> {
    this.checkReadOnlyMode('update card subtask');
    const response = await this.http.patch<SubtaskResponse>(
      `/cards/${cardId}/subtasks/${subtaskId}`,
      params
    );
    return response.data.data;
  }

  /**
   * Delete a card subtask
   */
  async deleteCardSubtask(cardId: number, subtaskId: number): Promise<void> {
    this.checkReadOnlyMode('delete card subtask');
    await this.http.delete(`/cards/${cardId}/subtasks/${subtaskId}`);
  }

  /**
   * Get parent cards for a specific card
   */
  async getCardParents(cardId: number): Promise<ParentCardItem[]> {
    const response = await this.http.get<ParentCardsResponse>(`/cards/${cardId}/parents`);
    return response.data.data;
  }

  /**
   * Check if a card is a parent of a given card
   */
  async getCardParent(cardId: number, parentCardId: number): Promise<{ position: number }> {
    const response = await this.http.get<ParentCardPositionResponse>(
      `/cards/${cardId}/parents/${parentCardId}`
    );
    return response.data.data;
  }

  /**
   * Make a card a parent of a given card
   */
  async addCardParent(cardId: number, parentCardId: number): Promise<{ position: number }> {
    this.checkReadOnlyMode('add card parent');
    const response = await this.http.put<ParentCardPositionResponse>(
      `/cards/${cardId}/parents/${parentCardId}`
    );
    return response.data.data;
  }

  /**
   * Remove the link between a child card and a parent card
   */
  async removeCardParent(cardId: number, parentCardId: number): Promise<void> {
    this.checkReadOnlyMode('remove card parent');
    await this.http.delete(`/cards/${cardId}/parents/${parentCardId}`);
  }

  /**
   * Get parent graph for a specific card (including parent's parents)
   */
  async getCardParentGraph(cardId: number): Promise<ParentGraphItem[]> {
    const response = await this.http.get<ParentGraphResponse>(`/cards/${cardId}/parentGraph`);
    return response.data.data;
  }

  /**
   * Get child cards for a specific card
   */
  async getCardChildren(cardId: number): Promise<ChildCardItem[]> {
    const response = await this.http.get<ChildCardsResponse>(`/cards/${cardId}/children`);
    return response.data.data;
  }

  /**
   * Bulk delete cards (T059)
   * Deletes multiple cards concurrently using Promise.all() with rate limiting
   *
   * @param cardIds - Array of card IDs to delete (max 500)
   * @param options - Optional configuration
   * @param options.maxConcurrent - Maximum concurrent requests (default: 10)
   *
   * @returns Array of results with success/failure status for each card
   *
   * @throws TypeError if cardIds is not an array
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
   * const results = await client.cards.bulkDeleteCards([1, 2, 3]);
   * const failed = results.filter(r => !r.success);
   */
  async bulkDeleteCards(
    cardIds: number[],
    options?: { maxConcurrent?: number }
  ): Promise<Array<{ id: number; success: boolean; error?: string }>> {
    // 1. Input validation
    if (!Array.isArray(cardIds)) {
      throw new TypeError('cardIds must be an array');
    }
    if (cardIds.length === 0) {
      return [];
    }
    if (cardIds.length > BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE) {
      throw new RangeError(`Maximum batch size is ${BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE}`);
    }
    const invalidIds = cardIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new RangeError(
        `All card IDs must be positive integers (found invalid: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''})`
      );
    }

    this.checkReadOnlyMode('bulk delete cards');

    // 2. Rate limiting with p-limit
    const limit = pLimit(options?.maxConcurrent || BULK_OPERATION_DEFAULTS.MAX_CONCURRENT);

    const promises = cardIds.map((id) =>
      limit(async () => {
        try {
          await this.deleteCard(id);
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
   * Bulk update cards (T063)
   * Updates multiple cards concurrently using Promise.all() with rate limiting
   *
   * @param cardIds - Array of card IDs to update (max 500)
   * @param updates - Card properties to update (applied to all cards)
   * @param options - Optional configuration
   * @param options.maxConcurrent - Maximum concurrent requests (default: 10)
   *
   * @returns Array of results with success/failure status and updated card for each ID
   *
   * @throws TypeError if cardIds is not an array
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
   * const results = await client.cards.bulkUpdateCards(
   *   [1, 2, 3],
   *   { priority: 2, title: 'Updated' }
   * );
   * const successful = results.filter(r => r.success);
   */
  async bulkUpdateCards(
    cardIds: number[],
    updates: Omit<Partial<UpdateCardParams>, 'card_id'>,
    options?: { maxConcurrent?: number }
  ): Promise<Array<{ id: number; success: boolean; card?: Card; error?: string }>> {
    // 1. Input validation
    if (!Array.isArray(cardIds)) {
      throw new TypeError('cardIds must be an array');
    }
    if (cardIds.length === 0) {
      return [];
    }
    if (cardIds.length > BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE) {
      throw new RangeError(`Maximum batch size is ${BULK_OPERATION_DEFAULTS.MAX_BATCH_SIZE}`);
    }
    const invalidIds = cardIds.filter((id) => !Number.isInteger(id) || id <= 0);
    if (invalidIds.length > 0) {
      throw new RangeError(
        `All card IDs must be positive integers (found invalid: ${invalidIds.slice(0, 5).join(', ')}${invalidIds.length > 5 ? '...' : ''})`
      );
    }

    this.checkReadOnlyMode('bulk update cards');

    // 2. Rate limiting with p-limit
    const limit = pLimit(options?.maxConcurrent || BULK_OPERATION_DEFAULTS.MAX_CONCURRENT);

    const promises = cardIds.map((id) =>
      limit(async () => {
        try {
          const card = await this.updateCard({ card_id: id, ...updates });
          return { id, success: true, card };
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
