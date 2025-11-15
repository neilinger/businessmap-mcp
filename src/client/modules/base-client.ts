import { AxiosInstance } from 'axios';
// @ts-expect-error - lru-cache v11 is CommonJS, use default import
import LRUCache from 'lru-cache';
import { BusinessMapConfig } from '../../types/index.js';

/**
 * Base interface for client modules
 */
/**
 * Cache entry with expiry timestamp
 */
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

/**
 * Cache manager for client-side caching with TTL and request deduplication
 */
export class CacheManager {
  private cache: LRUCache<string, CacheEntry<any>>;
  private pendingRequests: Map<string, Promise<any>>;
  private keysByPrefix: Map<string, Set<string>> = new Map();
  private invalidationGeneration: Map<string, number> = new Map();
  private hitCount: number = 0;
  private missCount: number = 0;
  private readonly enabled: boolean;
  private readonly defaultTtl: number;

  constructor(enabled: boolean = true, defaultTtl: number = 300000, maxSize: number = 1000) {
    // 5 minutes default, 1000 entries max
    this.enabled = enabled;
    this.defaultTtl = defaultTtl;
    this.cache = new LRUCache<string, CacheEntry<any>>({
      max: maxSize,
      // LRU will automatically evict least recently used entries when max is reached
      disposeAfter: (value: CacheEntry<any>, key: string) => {
        // Clean up prefix index when entries are evicted
        // Use setImmediate to avoid blocking event loop on eviction
        setImmediate(() => {
          try {
            const parts = key.split(':');
            const prefix = parts[0] ?? key; // split always returns at least ['']
            this.keysByPrefix.get(prefix)?.delete(key);
            // Clean up invalidation generation to prevent memory leak
            this.invalidationGeneration.delete(key);
          } catch (err) {
            // Log but don't crash - cache eviction should be resilient
            console.error('Cache cleanup error:', err);
          }
        });
      },
    });
    // Use unbounded Map for pending requests - they self-clean via finally block
    // Average lifetime: 100-500ms, naturally bounded by request completion
    this.pendingRequests = new Map();
  }

  /**
   * Get cached value or execute fetcher function with lazy expiration
   */
  async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.defaultTtl): Promise<T> {
    if (!this.enabled) {
      return fetcher();
    }

    // Check cache first (lazy expiration check)
    const cached = this.cache.get(key);
    if (cached) {
      if (cached.expiresAt > Date.now()) {
        this.hitCount++;
        return cached.data as T;
      } else {
        // Expired entry found, remove it (lazy cleanup)
        this.cache.delete(key);
      }
    }

    // Check if request is already in flight (deduplication)
    const pending = this.pendingRequests.get(key);
    if (pending) {
      this.hitCount++; // Count deduplicated requests as cache hits
      return pending as Promise<T>;
    }

    // Execute fetcher and store promise
    this.missCount++;
    const startGeneration = this.invalidationGeneration.get(key) || 0;
    const promise = fetcher();
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;

      // Check if key was invalidated while request was in flight
      const currentGeneration = this.invalidationGeneration.get(key) || 0;
      if (currentGeneration > startGeneration) {
        // Key was invalidated, don't cache the result
        return data;
      }

      // Cache the result (only cache successful responses)
      this.cache.set(key, {
        data,
        expiresAt: Date.now() + ttl,
      });

      // Track key by prefix for optimized invalidation
      const parts = key.split(':');
      const prefix = parts[0] ?? key; // split always returns at least ['']
      if (!this.keysByPrefix.has(prefix)) {
        this.keysByPrefix.set(prefix, new Set());
      }
      // Defensive programming - use optional chaining instead of non-null assertion
      const prefixSet = this.keysByPrefix.get(prefix);
      if (prefixSet) {
        prefixSet.add(key);
      } else {
        // Fallback: should never happen due to check above, but be defensive
        this.keysByPrefix.set(prefix, new Set([key]));
      }

      return data;
    } finally {
      // Clean up pending request (single cleanup point)
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Invalidate cache entries by key pattern
   * Also clears pending requests to prevent race condition
   * Optimized with prefix-based index for O(k) instead of O(n) performance
   */
  invalidate(pattern: string | RegExp): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;

    // Optimize prefix patterns: /^users:/ or /^customFields:board:/
    if (pattern instanceof RegExp && pattern.source.startsWith('^')) {
      const prefixMatch = pattern.source.match(/^\^([^:]+):/);
      if (prefixMatch && prefixMatch[1]) {
        const prefix = prefixMatch[1];
        const keysToCheck = this.keysByPrefix.get(prefix);
        if (keysToCheck) {
          // O(k) where k = keys with matching prefix (typically 1-10)
          // Also check pendingRequests for keys not yet in cache
          const allKeys = new Set(Array.from(keysToCheck));
          for (const key of this.pendingRequests.keys()) {
            if (regex.test(key)) {
              allKeys.add(key);
            }
          }

          for (const key of allKeys) {
            if (regex.test(key)) {
              this.cache.delete(key);
              this.pendingRequests.delete(key);
              keysToCheck.delete(key);
              // Increment generation to prevent in-flight requests from caching
              this.invalidationGeneration.set(key, (this.invalidationGeneration.get(key) || 0) + 1);
            }
          }
          return;
        }
      }
    }

    // Fallback to O(n) for complex patterns
    // Check both cache and pending requests to handle in-flight requests
    const keysToInvalidate = new Set<string>();

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        keysToInvalidate.add(key);
      }
    }

    for (const key of this.pendingRequests.keys()) {
      if (regex.test(key)) {
        keysToInvalidate.add(key);
      }
    }

    for (const key of keysToInvalidate) {
      this.cache.delete(key);
      this.pendingRequests.delete(key);
      const parts = key.split(':');
      const prefix = parts[0] ?? key; // split always returns at least ['']
      this.keysByPrefix.get(prefix)?.delete(key);
      // Increment generation to prevent in-flight requests from caching
      this.invalidationGeneration.set(key, (this.invalidationGeneration.get(key) || 0) + 1);
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    // Use reset() for LRUCache v5.1.1 or clear() for Map-like objects
    if (typeof this.cache.reset === 'function') {
      this.cache.reset();
    } else if (typeof this.cache.clear === 'function') {
      this.cache.clear();
    }
    this.pendingRequests.clear();
    this.keysByPrefix.clear();
    this.invalidationGeneration.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { hits: number; misses: number; hitRate: number; size: number } {
    const total = this.hitCount + this.missCount;
    return {
      hits: this.hitCount,
      misses: this.missCount,
      hitRate: total > 0 ? this.hitCount / total : 0,
      size: this.cache.size,
    };
  }
}

export interface BaseClientModule {
  /**
   * Initialize the module with the HTTP client and configuration
   * @param http The axios instance
   * @param config The BusinessMap configuration
   */
  initialize(http: AxiosInstance, config: BusinessMapConfig): void;
}

/**
 * Base class for client modules with common functionality
 */
export abstract class BaseClientModuleImpl implements BaseClientModule {
  protected http!: AxiosInstance;
  protected config!: BusinessMapConfig;
  protected cache!: CacheManager;

  initialize(http: AxiosInstance, config: BusinessMapConfig): void {
    this.http = http;
    this.config = config;

    // Initialize cache manager with config
    const cacheEnabled = config.cacheEnabled !== false; // Default to true
    const defaultTtl = config.cacheTtl || 300000; // Default 5 minutes
    this.cache = new CacheManager(cacheEnabled, defaultTtl);
  }

  /**
   * Check if the module is in read-only mode
   */
  protected checkReadOnlyMode(operation: string): void {
    if (this.config.readOnlyMode) {
      throw new Error(`Cannot ${operation} in read-only mode`);
    }
  }

  /**
   * Perform a cached GET request
   * @param key - Cache key
   * @param path - API path
   * @param ttl - Time to live in milliseconds (optional, uses default if not provided)
   */
  protected async cachedGet<T>(key: string, path: string, ttl?: number): Promise<T> {
    return this.cache.get<T>(
      key,
      async () => {
        const response = await this.http.get<T>(path);
        return response.data;
      },
      ttl
    );
  }
}

/**
 * Common HTTP client configuration
 */
export interface HttpClientConfig {
  baseURL: string;
  headers: Record<string, string>;
  timeout: number;
}
