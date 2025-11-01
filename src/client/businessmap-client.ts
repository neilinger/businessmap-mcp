import axios, { AxiosError, AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { ApiError, BusinessMapConfig } from '../types/index.js';
import { BoardFilters } from './modules/board-client.js';
import {
  BoardClient,
  CardClient,
  CardFilters,
  CustomFieldClient,
  UserClient,
  UtilityClient,
  WorkflowClient,
  WorkspaceClient,
} from './modules/index.js';

export class BusinessMapClient {
  private http: AxiosInstance;
  private readonly config: BusinessMapConfig;
  private isInitialized: boolean = false;

  // Client modules
  private workspaceClient: WorkspaceClient;
  private boardClient: BoardClient;
  private cardClient: CardClient;
  private userClient: UserClient;
  private customFieldClient: CustomFieldClient;
  private utilityClient: UtilityClient;
  private workflowClient: WorkflowClient;

  constructor(config: BusinessMapConfig) {
    this.config = config;
    this.http = axios.create({
      baseURL: config.apiUrl,
      headers: {
        apikey: config.apiToken,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 30000,
    });

    // Configure axios-retry for rate limit handling
    axiosRetry(this.http, {
      retries: 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // Retry on rate limit (429) or network errors
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) ||
          error.response?.status === 429
        );
      },
      onRetry: (retryCount, error) => {
        const retryAfter = error.response?.headers?.['retry-after'];
        console.warn(
          `Rate limit hit (retry ${retryCount}/3)${retryAfter ? `, retry after ${retryAfter}s` : ''}`
        );
      },
    });

    // Add response interceptor for error handling and rate limit monitoring
    this.http.interceptors.response.use(
      (response) => {
        // Monitor rate limit headers
        const remaining = response.headers?.['x-ratelimitperhour-remaining'];
        const limit = response.headers?.['x-ratelimitperhour-limit'];
        if (remaining && limit) {
          const usage = 1 - parseInt(remaining) / parseInt(limit);
          if (usage >= 0.8) {
            console.warn(
              `Rate limit warning: ${Math.round(usage * 100)}% of hourly quota used (${remaining}/${limit} remaining)`
            );
          }
        }
        return response;
      },
      (error: AxiosError) => {
        throw this.transformError(error);
      }
    );

    // Initialize client modules
    this.workspaceClient = new WorkspaceClient();
    this.boardClient = new BoardClient();
    this.cardClient = new CardClient();
    this.userClient = new UserClient();
    this.customFieldClient = new CustomFieldClient();
    this.utilityClient = new UtilityClient();
    this.workflowClient = new WorkflowClient();

    // Initialize all modules with http client and config
    [
      this.workspaceClient,
      this.boardClient,
      this.cardClient,
      this.userClient,
      this.customFieldClient,
      this.utilityClient,
      this.workflowClient,
    ].forEach((module) => {
      module.initialize(this.http, this.config);
    });
  }

  /**
   * Initialize the client by verifying the connection to the BusinessMap API
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Verify configuration first
      if (!this.config.apiUrl) {
        throw new Error(
          'API URL is not configured. Please set BUSINESSMAP_API_URL environment variable.'
        );
      }

      if (!this.config.apiToken) {
        throw new Error(
          'API Token is not configured. Please set BUSINESSMAP_API_TOKEN environment variable.'
        );
      }

      // Try to perform a health check first
      const isHealthy = await this.utilityClient.healthCheck();
      if (!isHealthy) {
        throw new Error('API connection failed - please check your API URL and token');
      }

      // Try to fetch API info to verify authentication
      try {
        await this.utilityClient.getApiInfo();
      } catch (error) {
        if (error instanceof Error && error.message.includes('401')) {
          throw new Error(
            'Authentication failed - please verify your API token has the correct permissions'
          );
        }
        throw new Error(
          `API verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }

      this.isInitialized = true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to initialize BusinessMap client: ${message}`);
    }
  }

  /**
   * Check if the client has been initialized
   */
  get initialized(): boolean {
    return this.isInitialized;
  }

  private transformError(error: AxiosError): Error {
    if (error.response) {
      const apiError = error.response.data as ApiError;
      return new Error(`BusinessMap API Error: ${apiError.error?.message || error.message}`);
    }
    return new Error(`Network Error: ${error.message}`);
  }

  // Workspace Management - Delegated to WorkspaceClient
  async getWorkspaces() {
    return this.workspaceClient.getWorkspaces();
  }

  async getWorkspace(workspaceId: number) {
    return this.workspaceClient.getWorkspace(workspaceId);
  }

  async createWorkspace(params: Parameters<WorkspaceClient['createWorkspace']>[0]) {
    return this.workspaceClient.createWorkspace(params);
  }

  async updateWorkspace(
    workspaceId: number,
    params: Parameters<WorkspaceClient['updateWorkspace']>[1]
  ) {
    return this.workspaceClient.updateWorkspace(workspaceId, params);
  }

  async archiveWorkspace(workspaceId: number) {
    return this.workspaceClient.archiveWorkspace(workspaceId);
  }

  async bulkArchiveWorkspaces(
    workspaceIds: number[],
    options?: { maxConcurrent?: number }
  ) {
    return this.workspaceClient.bulkArchiveWorkspaces(workspaceIds, options);
  }

  async bulkUpdateWorkspaces(
    workspaceIds: number[],
    updates: Parameters<WorkspaceClient['bulkUpdateWorkspaces']>[1],
    options?: { maxConcurrent?: number }
  ) {
    return this.workspaceClient.bulkUpdateWorkspaces(workspaceIds, updates, options);
  }

  // Board Management - Delegated to BoardClient
  async listBoards(filters?: BoardFilters) {
    return this.boardClient.getBoards(filters);
  }
  async getBoards(filters?: BoardFilters) {
    return this.boardClient.getBoards(filters);
  }

  async getBoard(boardId: number) {
    return this.boardClient.getBoard(boardId);
  }

  async createBoard(params: Parameters<BoardClient['createBoard']>[0]) {
    return this.boardClient.createBoard(params);
  }

  async updateBoard(boardId: number, params: Parameters<BoardClient['updateBoard']>[1]) {
    return this.boardClient.updateBoard(boardId, params);
  }

  async deleteBoard(boardId: number, options?: { archive_first?: boolean }) {
    return this.boardClient.deleteBoard(boardId, options);
  }

  async getBoardStructure(boardId: number) {
    return this.boardClient.getBoardStructure(boardId);
  }

  async getColumns(boardId: number) {
    return this.boardClient.getColumns(boardId);
  }

  async getLanes(boardId: number) {
    return this.boardClient.getLanes(boardId);
  }

  async getLane(laneId: number) {
    return this.boardClient.getLane(laneId);
  }

  async createLane(params: Parameters<BoardClient['createLane']>[0]) {
    return this.boardClient.createLane(params);
  }

  async getCurrentBoardStructure(boardId: number) {
    return this.boardClient.getCurrentBoardStructure(boardId);
  }

  async bulkDeleteBoards(boardIds: number[], options?: { maxConcurrent?: number }) {
    return this.boardClient.bulkDeleteBoards(boardIds, options);
  }

  async bulkUpdateBoards(
    boardIds: number[],
    updates: Parameters<BoardClient['bulkUpdateBoards']>[1],
    options?: { maxConcurrent?: number }
  ) {
    return this.boardClient.bulkUpdateBoards(boardIds, updates, options);
  }

  // Card Management - Delegated to CardClient
  async listCards(filters: CardFilters & { board_id: number }) {
    return this.cardClient.getCards(filters.board_id, filters);
  }
  async getCards(boardId: number, filters?: CardFilters) {
    return this.cardClient.getCards(boardId, filters);
  }

  async getCard(cardId: number) {
    return this.cardClient.getCard(cardId);
  }

  async createCard(params: Parameters<CardClient['createCard']>[0]) {
    return this.cardClient.createCard(params);
  }

  async updateCard(params: Parameters<CardClient['updateCard']>[0]) {
    return this.cardClient.updateCard(params);
  }

  async moveCard(cardId: number, columnId: number, laneId?: number, position?: number) {
    return this.cardClient.moveCard(cardId, columnId, laneId, position);
  }

  async deleteCard(cardId: number, options?: { archive_first?: boolean }) {
    return this.cardClient.deleteCard(cardId, options);
  }

  async getCardComments(cardId: number) {
    return this.cardClient.getCardComments(cardId);
  }

  async getCardComment(cardId: number, commentId: number) {
    return this.cardClient.getCardComment(cardId, commentId);
  }

  async updateCardComment(cardId: number, commentId: number, params: Parameters<CardClient['updateCardComment']>[2]) {
    return this.cardClient.updateCardComment(cardId, commentId, params);
  }

  async deleteCardComment(cardId: number, commentId: number) {
    return this.cardClient.deleteCardComment(cardId, commentId);
  }

  async getCardCustomFields(cardId: number) {
    return this.cardClient.getCardCustomFields(cardId);
  }

  async getCardTypes() {
    return this.cardClient.getCardTypes();
  }

  async getCardHistory(cardId: number, outcomeId: number) {
    return this.cardClient.getCardHistory(cardId, outcomeId);
  }

  async getCardOutcomes(cardId: number) {
    return this.cardClient.getCardOutcomes(cardId);
  }

  async getCardLinkedCards(cardId: number) {
    return this.cardClient.getCardLinkedCards(cardId);
  }

  async getCardSubtasks(cardId: number) {
    return this.cardClient.getCardSubtasks(cardId);
  }

  async getCardSubtask(cardId: number, subtaskId: number) {
    return this.cardClient.getCardSubtask(cardId, subtaskId);
  }

  async createCardSubtask(cardId: number, params: Parameters<CardClient['createCardSubtask']>[1]) {
    return this.cardClient.createCardSubtask(cardId, params);
  }

  async updateCardSubtask(cardId: number, subtaskId: number, params: Parameters<CardClient['updateCardSubtask']>[2]) {
    return this.cardClient.updateCardSubtask(cardId, subtaskId, params);
  }

  async deleteCardSubtask(cardId: number, subtaskId: number) {
    return this.cardClient.deleteCardSubtask(cardId, subtaskId);
  }

  async getCardParents(cardId: number) {
    return this.cardClient.getCardParents(cardId);
  }

  async getCardParent(cardId: number, parentCardId: number) {
    return this.cardClient.getCardParent(cardId, parentCardId);
  }

  async addCardParent(cardId: number, parentCardId: number) {
    return this.cardClient.addCardParent(cardId, parentCardId);
  }

  async removeCardParent(cardId: number, parentCardId: number) {
    return this.cardClient.removeCardParent(cardId, parentCardId);
  }

  async getCardParentGraph(cardId: number) {
    return this.cardClient.getCardParentGraph(cardId);
  }

  async getCardChildren(cardId: number) {
    return this.cardClient.getCardChildren(cardId);
  }

  async bulkDeleteCards(cardIds: number[], options?: { maxConcurrent?: number }) {
    return this.cardClient.bulkDeleteCards(cardIds, options);
  }

  async bulkUpdateCards(
    cardIds: number[],
    updates: Parameters<CardClient['bulkUpdateCards']>[1],
    options?: { maxConcurrent?: number }
  ) {
    return this.cardClient.bulkUpdateCards(cardIds, updates, options);
  }

  // User Management - Delegated to UserClient
  async getUsers() {
    return this.userClient.getUsers();
  }

  async getUser(userId: number) {
    return this.userClient.getUser(userId);
  }

  async getCurrentUser() {
    return this.userClient.getCurrentUser();
  }

  // Custom Fields - Delegated to CustomFieldClient
  // Custom Fields - Delegated to CustomFieldClient
  async listCustomFields(params?: { page?: number; page_size?: number; field_type?: string }) {
    return this.customFieldClient.listCustomFields(params);
  }

  async listBoardCustomFields(boardId: number) {
    return this.customFieldClient.listBoardCustomFields(boardId);
  }

  async createCustomField(params: {
    board_id: number;
    name: string;
    field_type: string;
    description?: string;
    is_required?: boolean;
    position?: number;
    options?: Array<{ value: string; color: string }>;
    validation?: { min?: number; max?: number };
  }) {
    return this.customFieldClient.createCustomField(params);
  }

  async updateCustomField(
    customFieldId: number,
    params: {
      name?: string;
      description?: string;
      is_required?: boolean;
      position?: number;
      options?: Array<{ id?: number; value: string; color: string }>;
      validation?: { min?: number; max?: number };
    }
  ) {
    return this.customFieldClient.updateCustomField(customFieldId, params);
  }

  async deleteCustomField(customFieldId: number) {
    return this.customFieldClient.deleteCustomField(customFieldId);
  }

  async getCustomField(customFieldId: number) {
    return this.customFieldClient.getCustomField(customFieldId);
  }

  // Workflow Management - Delegated to WorkflowClient
  async getWorkflowCycleTimeColumns(boardId: number, workflowId: number) {
    return this.workflowClient.getWorkflowCycleTimeColumns(boardId, workflowId);
  }

  async getWorkflowEffectiveCycleTimeColumns(boardId: number, workflowId: number) {
    return this.workflowClient.getWorkflowEffectiveCycleTimeColumns(boardId, workflowId);
  }

  // Utility Methods - Delegated to UtilityClient
  async healthCheck() {
    return this.utilityClient.healthCheck();
  }

  async getApiInfo() {
    return this.utilityClient.getApiInfo();
  }
}
