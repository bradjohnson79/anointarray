// Redis configuration for caching and session management
// Following CLAUDE_GLOBAL_RULES.md - clean, explicit configuration

import { Redis } from '@upstash/redis'

export interface CacheConfig {
  enabled: boolean
  redis?: Redis
  defaultTTL: number
  sessionTTL: number
}

// Cache key prefixes for organization
export const CACHE_KEYS = {
  USER_SESSION: 'session:user:',
  USER_PROFILE: 'profile:user:',
  AUTH_ATTEMPTS: 'auth:attempts:',
  RATE_LIMIT: 'rate:limit:',
} as const

// Initialize Redis client with proper error handling
function createRedisClient(): Redis | null {
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL
    const token = process.env.UPSTASH_REDIS_REST_TOKEN

    if (!url || !token) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Redis environment variables not found, caching disabled')
      }
      return null
    }

    return new Redis({
      url,
      token,
      retry: {
        retries: 3,
        delay: (attempt) => Math.min(attempt * 100, 1000)
      }
    })
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Failed to initialize Redis client:', error)
    }
    return null
  }
}

// Export cache configuration
export const cacheConfig: CacheConfig = {
  enabled: !!process.env.UPSTASH_REDIS_REST_URL && !!process.env.UPSTASH_REDIS_REST_TOKEN,
  redis: createRedisClient(),
  defaultTTL: 3600, // 1 hour in seconds
  sessionTTL: 86400, // 24 hours in seconds
}

// Cache utility functions
export class CacheService {
  private static redis = cacheConfig.redis

  // Generic get function with error handling
  static async get<T>(key: string): Promise<T | null> {
    if (!cacheConfig.enabled || !this.redis) {
      return null
    }

    try {
      const value = await this.redis.get(key)
      return value as T
    } catch (error) {
      // Log error but don't fail the operation
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache get error:', error)
      }
      return null
    }
  }

  // Generic set function with TTL support
  static async set(key: string, value: any, ttl?: number): Promise<boolean> {
    if (!cacheConfig.enabled || !this.redis) {
      return false
    }

    try {
      const expirationTime = ttl || cacheConfig.defaultTTL
      await this.redis.setex(key, expirationTime, JSON.stringify(value))
      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache set error:', error)
      }
      return false
    }
  }

  // Delete function
  static async delete(key: string): Promise<boolean> {
    if (!cacheConfig.enabled || !this.redis) {
      return false
    }

    try {
      await this.redis.del(key)
      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache delete error:', error)
      }
      return false
    }
  }

  // Increment function for rate limiting
  static async increment(key: string, ttl?: number): Promise<number | null> {
    if (!cacheConfig.enabled || !this.redis) {
      return null
    }

    try {
      const count = await this.redis.incr(key)
      
      // Set expiration on first increment
      if (count === 1 && ttl) {
        await this.redis.expire(key, ttl)
      }
      
      return count
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache increment error:', error)
      }
      return null
    }
  }

  // Check if key exists
  static async exists(key: string): Promise<boolean> {
    if (!cacheConfig.enabled || !this.redis) {
      return false
    }

    try {
      const result = await this.redis.exists(key)
      return result > 0
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache exists error:', error)
      }
      return false
    }
  }

  // Get multiple keys with pattern
  static async getPattern(pattern: string): Promise<string[]> {
    if (!cacheConfig.enabled || !this.redis) {
      return []
    }

    try {
      const keys = await this.redis.keys(pattern)
      return keys
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache pattern error:', error)
      }
      return []
    }
  }

  // Clear all cache with pattern
  static async clearPattern(pattern: string): Promise<boolean> {
    if (!cacheConfig.enabled || !this.redis) {
      return false
    }

    try {
      const keys = await this.getPattern(pattern)
      if (keys.length > 0) {
        await this.redis.del(...keys)
      }
      return true
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Cache clear pattern error:', error)
      }
      return false
    }
  }
}