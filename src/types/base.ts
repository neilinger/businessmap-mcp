// Base Types for BusinessMap API

export interface BusinessMapConfig {
  apiUrl: string;
  apiToken: string;
  defaultWorkspaceId?: number;
  readOnlyMode?: boolean;
  
  // Cache configuration
  cacheEnabled?: boolean; // Default: true
  cacheTtl?: number; // Default TTL in milliseconds (default: 300000 = 5 minutes)
  cacheUsersTtl?: number; // TTL for user lists (default: 300000 = 5 minutes)
  cacheCardTypesTtl?: number; // TTL for card types (default: 300000 = 5 minutes)
  cacheWorkspacesTtl?: number; // TTL for workspaces (default: 900000 = 15 minutes)
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total_count?: number;
    page?: number;
    per_page?: number;
  };
}

export interface ApiError {
  error: {
    code: number;
    message: string;
    details?: unknown;
  };
}
