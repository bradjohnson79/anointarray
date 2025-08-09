// Authentication caching service
// Following CLAUDE_GLOBAL_RULES.md - performance optimization with Redis

import type { AuthenticatedUser } from '../types/auth'
import { CacheService, CACHE_KEYS, cacheConfig } from './redis-config'

export class AuthCache {
  
  // Cache user session data
  static async cacheUserSession(userId: string, user: AuthenticatedUser): Promise<void> {
    const key = `${CACHE_KEYS.USER_SESSION}${userId}`
    await CacheService.set(key, user, cacheConfig.sessionTTL)
  }

  // Get cached user session
  static async getUserSession(userId: string): Promise<AuthenticatedUser | null> {
    const key = `${CACHE_KEYS.USER_SESSION}${userId}`
    return await CacheService.get<AuthenticatedUser>(key)
  }

  // Cache user profile data
  static async cacheUserProfile(userId: string, profile: AuthenticatedUser): Promise<void> {
    const key = `${CACHE_KEYS.USER_PROFILE}${userId}`
    await CacheService.set(key, profile, cacheConfig.defaultTTL)
  }

  // Get cached user profile
  static async getUserProfile(userId: string): Promise<AuthenticatedUser | null> {
    const key = `${CACHE_KEYS.USER_PROFILE}${userId}`
    return await CacheService.get<AuthenticatedUser>(key)
  }

  // Clear user cache on logout or profile update
  static async clearUserCache(userId: string): Promise<void> {
    const sessionKey = `${CACHE_KEYS.USER_SESSION}${userId}`
    const profileKey = `${CACHE_KEYS.USER_PROFILE}${userId}`
    
    await Promise.all([
      CacheService.delete(sessionKey),
      CacheService.delete(profileKey)
    ])
  }

  // Rate limiting for authentication attempts
  static async checkAuthAttempts(identifier: string, maxAttempts: number = 5, windowMinutes: number = 15): Promise<{ allowed: boolean; attemptsLeft: number }> {
    const key = `${CACHE_KEYS.AUTH_ATTEMPTS}${identifier}`
    const windowSeconds = windowMinutes * 60
    
    const attempts = await CacheService.increment(key, windowSeconds)
    
    if (attempts === null) {
      // Cache unavailable, allow request
      return { allowed: true, attemptsLeft: maxAttempts }
    }
    
    const allowed = attempts <= maxAttempts
    const attemptsLeft = Math.max(0, maxAttempts - attempts)
    
    return { allowed, attemptsLeft }
  }

  // Reset authentication attempts after successful login
  static async resetAuthAttempts(identifier: string): Promise<void> {
    const key = `${CACHE_KEYS.AUTH_ATTEMPTS}${identifier}`
    await CacheService.delete(key)
  }

  // General rate limiting
  static async checkRateLimit(
    identifier: string,
    maxRequests: number = 10,
    windowMinutes: number = 1
  ): Promise<{ allowed: boolean; requestsLeft: number; resetTime?: Date }> {
    const key = `${CACHE_KEYS.RATE_LIMIT}${identifier}`
    const windowSeconds = windowMinutes * 60
    
    const requests = await CacheService.increment(key, windowSeconds)
    
    if (requests === null) {
      // Cache unavailable, allow request
      return { allowed: true, requestsLeft: maxRequests }
    }
    
    const allowed = requests <= maxRequests
    const requestsLeft = Math.max(0, maxRequests - requests)
    const resetTime = new Date(Date.now() + (windowSeconds * 1000))
    
    return { allowed, requestsLeft, resetTime }
  }

  // Cache health check
  static async healthCheck(): Promise<{ available: boolean; latency?: number }> {
    if (!cacheConfig.enabled) {
      return { available: false }
    }
    
    const startTime = Date.now()
    const testKey = 'health:check'
    
    try {
      await CacheService.set(testKey, 'test', 10) // 10 second TTL
      const value = await CacheService.get(testKey)
      await CacheService.delete(testKey)
      
      const latency = Date.now() - startTime
      return { available: value === 'test', latency }
    } catch (error) {
      return { available: false }
    }
  }

  // Get cache statistics
  static async getStats(): Promise<{
    enabled: boolean
    sessionCount: number
    profileCount: number
  }> {
    if (!cacheConfig.enabled) {
      return { enabled: false, sessionCount: 0, profileCount: 0 }
    }

    const [sessionKeys, profileKeys] = await Promise.all([
      CacheService.getPattern(`${CACHE_KEYS.USER_SESSION}*`),
      CacheService.getPattern(`${CACHE_KEYS.USER_PROFILE}*`)
    ])

    return {
      enabled: true,
      sessionCount: sessionKeys.length,
      profileCount: profileKeys.length
    }
  }

  // Clear all authentication cache (admin function)
  static async clearAllAuthCache(): Promise<void> {
    await Promise.all([
      CacheService.clearPattern(`${CACHE_KEYS.USER_SESSION}*`),
      CacheService.clearPattern(`${CACHE_KEYS.USER_PROFILE}*`),
      CacheService.clearPattern(`${CACHE_KEYS.AUTH_ATTEMPTS}*`),
      CacheService.clearPattern(`${CACHE_KEYS.RATE_LIMIT}*`)
    ])
  }
}