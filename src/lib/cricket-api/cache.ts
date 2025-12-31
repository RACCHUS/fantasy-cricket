/**
 * API Response Cache
 * In-memory cache with TTL for API responses
 */

import type { CacheEntry } from './types';

// Cache TTL values in seconds
export const CACHE_TTL = {
  TOURNAMENTS: 24 * 60 * 60,      // 24 hours
  TOURNAMENT_DETAILS: 6 * 60 * 60, // 6 hours
  MATCHES_LIST: 60 * 60,          // 1 hour
  MATCH_DETAILS: 30 * 60,         // 30 minutes
  LIVE_SCORE: 30,                 // 30 seconds
  PLAYERS_LIST: 24 * 60 * 60,     // 24 hours
  PLAYER_DETAILS: 6 * 60 * 60,    // 6 hours
  PLAYER_STATS: 5 * 60,           // 5 minutes
  TEAMS: 24 * 60 * 60,            // 24 hours
} as const;

class APICache {
  private cache: Map<string, CacheEntry<unknown>> = new Map();
  private maxSize: number;
  
  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }
  
  /**
   * Get a cached value if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }
  
  /**
   * Set a cached value with TTL
   */
  set<T>(key: string, data: T, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }
    
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      cachedAt: now,
      expiresAt: now + ttlSeconds * 1000,
      key,
    };
    
    this.cache.set(key, entry);
  }
  
  /**
   * Check if a key exists and is valid
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  /**
   * Delete a specific cache entry
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }
  
  /**
   * Delete all entries matching a prefix
   */
  deleteByPrefix(prefix: string): number {
    let deleted = 0;
    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
  
  /**
   * Clear the entire cache
   */
  clear(): void {
    this.cache.clear();
  }
  
  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    let validEntries = 0;
    let expiredEntries = 0;
    const now = Date.now();
    
    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }
    
    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize,
    };
  }
  
  /**
   * Remove expired entries
   */
  cleanup(): number {
    const now = Date.now();
    let removed = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }
    
    return removed;
  }
  
  /**
   * Evict the oldest entries to make room
   */
  private evictOldest(count: number = 10): void {
    const entries = Array.from(this.cache.entries())
      .sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    
    for (let i = 0; i < Math.min(count, entries.length); i++) {
      this.cache.delete(entries[i][0]);
    }
  }
}

interface CacheStats {
  totalEntries: number;
  validEntries: number;
  expiredEntries: number;
  maxSize: number;
}

// Helper to generate cache keys
export function cacheKey(...parts: (string | number | undefined)[]): string {
  return parts.filter(Boolean).join(':');
}

// Singleton cache instance
export const apiCache = new APICache();

/**
 * Decorator for caching async function results
 */
export function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = apiCache.get<T>(key);
  
  if (cached !== null) {
    return Promise.resolve(cached);
  }
  
  return fetcher().then((data) => {
    apiCache.set(key, data, ttlSeconds);
    return data;
  });
}

/**
 * Start periodic cache cleanup
 */
let cleanupInterval: NodeJS.Timeout | null = null;

export function startCacheCleanup(intervalMs: number = 60000): void {
  if (cleanupInterval) {
    return;
  }
  
  cleanupInterval = setInterval(() => {
    apiCache.cleanup();
  }, intervalMs);
}

export function stopCacheCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}
