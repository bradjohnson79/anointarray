import { Redis } from '@upstash/redis'

// Initialize Upstash Redis client
let redis: Redis | null = null

try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
    console.log('✅ Redis client initialized successfully')
  } else {
    console.warn('⚠️ Redis environment variables not found, caching disabled')
  }
} catch (error) {
  console.error('❌ Failed to initialize Redis:', error)
}

// Redis caching utilities for authentication
export class AuthCache {
  private static readonly CACHE_TTL = 900 // 15 minutes
  private static readonly USER_PROFILE_PREFIX = 'user_profile:'
  private static readonly SESSION_PREFIX = 'session:'
  private static readonly ADMIN_LIST_KEY = 'admin_users'

  // Cache user profile data
  static async cacheUserProfile(userId: string, profile: any): Promise<void> {
    if (!redis) return
    
    try {
      const key = `${this.USER_PROFILE_PREFIX}${userId}`
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(profile))
      console.log(`✅ Cached user profile: ${userId}`)
      
      // If user is admin, add to admin list
      if (profile.role === 'admin' || profile.is_admin) {
        await redis.sadd(this.ADMIN_LIST_KEY, userId)
      }
    } catch (error) {
      console.error('❌ Failed to cache user profile:', error)
    }
  }

  // Get cached user profile
  static async getUserProfile(userId: string): Promise<any | null> {
    if (!redis) return null
    
    try {
      const key = `${this.USER_PROFILE_PREFIX}${userId}`
      const cached = await redis.get(key)
      
      if (cached) {
        console.log(`✅ Cache hit for user profile: ${userId}`)
        return typeof cached === 'string' ? JSON.parse(cached) : cached
      }
      
      console.log(`⚠️ Cache miss for user profile: ${userId}`)
      return null
    } catch (error) {
      console.error('❌ Failed to get cached user profile:', error)
      return null
    }
  }

  // Cache session data
  static async cacheSession(sessionId: string, sessionData: any): Promise<void> {
    if (!redis) return
    
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`
      await redis.setex(key, this.CACHE_TTL, JSON.stringify(sessionData))
      console.log(`✅ Cached session: ${sessionId}`)
    } catch (error) {
      console.error('❌ Failed to cache session:', error)
    }
  }

  // Get cached session
  static async getSession(sessionId: string): Promise<any | null> {
    if (!redis) return null
    
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`
      const cached = await redis.get(key)
      
      if (cached) {
        console.log(`✅ Cache hit for session: ${sessionId}`)
        return typeof cached === 'string' ? JSON.parse(cached) : cached
      }
      
      return null
    } catch (error) {
      console.error('❌ Failed to get cached session:', error)
      return null
    }
  }

  // Check if user is admin (cached)
  static async isUserAdmin(userId: string): Promise<boolean | null> {
    if (!redis) return null
    
    try {
      const isAdmin = await redis.sismember(this.ADMIN_LIST_KEY, userId)
      if (isAdmin) {
        console.log(`✅ Cache hit: ${userId} is admin`)
        return true
      }
      
      // Also check cached profile
      const profile = await this.getUserProfile(userId)
      if (profile) {
        return profile.role === 'admin' || profile.is_admin === true
      }
      
      return null // No cache data available
    } catch (error) {
      console.error('❌ Failed to check admin status:', error)
      return null
    }
  }

  // Invalidate user cache
  static async invalidateUserCache(userId: string): Promise<void> {
    if (!redis) return
    
    try {
      const profileKey = `${this.USER_PROFILE_PREFIX}${userId}`
      await redis.del(profileKey)
      await redis.srem(this.ADMIN_LIST_KEY, userId)
      console.log(`✅ Invalidated cache for user: ${userId}`)
    } catch (error) {
      console.error('❌ Failed to invalidate user cache:', error)
    }
  }

  // Cache authentication failures for rate limiting
  static async recordAuthFailure(identifier: string): Promise<number> {
    if (!redis) return 0
    
    try {
      const key = `auth_failures:${identifier}`
      const failures = await redis.incr(key)
      
      // Set expiry for first failure
      if (failures === 1) {
        await redis.expire(key, 3600) // 1 hour
      }
      
      console.log(`⚠️ Auth failure recorded for ${identifier}: ${failures}`)
      return failures
    } catch (error) {
      console.error('❌ Failed to record auth failure:', error)
      return 0
    }
  }

  // Check if identifier is rate limited
  static async isRateLimited(identifier: string, maxFailures: number = 5): Promise<boolean> {
    if (!redis) return false
    
    try {
      const key = `auth_failures:${identifier}`
      const failures = await redis.get(key) as number
      
      if (failures && failures >= maxFailures) {
        console.log(`🚫 Rate limited: ${identifier} (${failures} failures)`)
        return true
      }
      
      return false
    } catch (error) {
      console.error('❌ Failed to check rate limit:', error)
      return false
    }
  }

  // Clear auth failures on successful login
  static async clearAuthFailures(identifier: string): Promise<void> {
    if (!redis) return
    
    try {
      const key = `auth_failures:${identifier}`
      await redis.del(key)
      console.log(`✅ Cleared auth failures for: ${identifier}`)
    } catch (error) {
      console.error('❌ Failed to clear auth failures:', error)
    }
  }

  // Performance monitoring
  static async recordPerformanceMetric(metric: string, value: number, tags?: Record<string, string>): Promise<void> {
    if (!redis) return
    
    try {
      const timestamp = Date.now()
      const key = `perf:${metric}:${timestamp}`
      const data = { value, timestamp, tags }
      
      await redis.setex(key, 86400, JSON.stringify(data)) // 24 hours
      console.log(`📊 Performance metric recorded: ${metric} = ${value}`)
    } catch (error) {
      console.error('❌ Failed to record performance metric:', error)
    }
  }
}

// Export Redis instance for direct use if needed
export { redis }
export default redis