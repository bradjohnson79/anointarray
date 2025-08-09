// Authentication service following CLAUDE_GLOBAL_RULES.md - clean, modular, scalable
// Pure functions where possible, explicit error handling

import { createClient } from '@supabase/supabase-js'
import type { 
  AuthenticatedUser, 
  AuthenticationResult, 
  LoginCredentials, 
  SignupCredentials,
  AuthenticationError,
  UserProfile 
} from '../types/auth'
import { supabaseConfig, supabaseClientOptions } from '../config/supabase-config'
import { handleSupabaseAuthError, logError, createError, ERROR_CODES } from '../utils/error-handler'
import { AuthCache } from '../cache/auth-cache'

// Admin emails as constants (following CLAUDE_GLOBAL_RULES - explicit configuration)
const ADMIN_EMAILS = [
  'info@anoint.me',
  'breanne@aetherx.co'
] as const

// Initialize Supabase client with optimized configuration
const supabase = createClient(
  supabaseConfig.url,
  supabaseConfig.anonKey,
  supabaseClientOptions
)

// Helper function to transform Supabase user to our user type (no profile table dependency)
function transformSupabaseUser(supabaseUser: any): AuthenticatedUser {
  // Use email-based admin detection as fallback when profiles table unavailable
  const isAdmin = ADMIN_EMAILS.includes(supabaseUser.email?.toLowerCase() || '')
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: isAdmin ? 'admin' : 'member',
    displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
    emailVerified: supabaseUser.email_confirmed_at ? true : false,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at
  }
}

// Helper function to transform database profile to our user type (when profiles table exists)
function transformUserProfile(supabaseUser: any, profile: UserProfile): AuthenticatedUser {
  // Use consistent admin detection logic
  const isAdmin = profile.is_admin === true || ADMIN_EMAILS.includes(supabaseUser.email?.toLowerCase() || '')
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: isAdmin ? 'admin' : 'member',
    displayName: profile.display_name,
    emailVerified: supabaseUser.email_confirmed_at ? true : false,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at
  }
}

// Helper function to convert AppError to AuthenticationError
function toAuthError(appError: any): AuthenticationError {
  return {
    code: appError.code || ERROR_CODES.SYSTEM_ERROR,
    message: appError.message || 'An unexpected error occurred',
    remediation: appError.remediation
  }
}

export class AuthenticationService {
  
  // Sign in user with email and password
  static async signIn(credentials: LoginCredentials): Promise<AuthenticationResult> {
    try {
      const { email, password } = credentials
      const cleanEmail = email.trim().toLowerCase()
      
      // Check rate limiting for authentication attempts
      const { allowed, attemptsLeft } = await AuthCache.checkAuthAttempts(cleanEmail)
      if (!allowed) {
        const appError = createError(
          ERROR_CODES.AUTH_ACCOUNT_LOCKED,
          `Too many failed login attempts. ${attemptsLeft} attempts remaining.`,
          undefined,
          'Please wait before trying again or use the password reset option.'
        )
        return {
          success: false,
          error: toAuthError(appError)
        }
      }
      
      // Supabase authentication
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: password.trim()
      })

      if (error) {
        const appError = handleSupabaseAuthError(error)
        logError(appError, 'AuthenticationService.signIn')
        return {
          success: false,
          error: toAuthError(appError)
        }
      }

      if (!data.user) {
        const appError = createError(
          ERROR_CODES.SYSTEM_ERROR,
          'Authentication succeeded but no user data received'
        )
        logError(appError, 'AuthenticationService.signIn - no user data')
        return {
          success: false,
          error: toAuthError(appError)
        }
      }

      // Try to fetch user profile, but continue without it if table doesn't exist
      let user: AuthenticatedUser
      
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        if (profileError) {
          // If profiles table doesn't exist or profile not found, use fallback
          console.warn('Profile fetch failed, using email-based authentication:', profileError.message)
          user = transformSupabaseUser(data.user)
        } else {
          user = transformUserProfile(data.user, profile)
        }
      } catch (profileFetchError) {
        // Profiles table doesn't exist - use email-based authentication
        console.warn('Profiles table not available, using email-based authentication')
        user = transformSupabaseUser(data.user)
      }
      
      // Reset auth attempts on successful login
      await AuthCache.resetAuthAttempts(cleanEmail)
      
      // Cache user session and profile
      await Promise.all([
        AuthCache.cacheUserSession(user.id, user),
        AuthCache.cacheUserProfile(user.id, user)
      ])
      
      return {
        success: true,
        user
      }

    } catch (error) {
      const appError = createError(
        ERROR_CODES.SYSTEM_ERROR,
        'Unexpected error during sign in',
        undefined,
        'Please check your internet connection and try again. If the problem persists, contact support.'
      )
      logError(appError, 'AuthenticationService.signIn - catch block')
      return {
        success: false,
        error: toAuthError(appError)
      }
    }
  }

  // Sign up new user
  static async signUp(credentials: SignupCredentials): Promise<AuthenticationResult> {
    try {
      const { email, password, displayName } = credentials

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: password.trim(),
        options: {
          emailRedirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://anointarray.com'}/auth/callback`,
          data: {
            display_name: displayName.trim()
          }
        }
      })

      if (error) {
        const appError = handleSupabaseAuthError(error)
        logError(appError, 'AuthenticationService.signUp')
        return {
          success: false,
          error: toAuthError(appError)
        }
      }

      if (!data.user) {
        const appError = createError(
          ERROR_CODES.SYSTEM_ERROR,
          'Sign up processed but no user data received',
          undefined,
          'Please check your email for verification instructions.'
        )
        logError(appError, 'AuthenticationService.signUp - no user data')
        return {
          success: false,
          error: toAuthError(appError)
        }
      }

      // For signup, we return success but user will be null until email verification
      return {
        success: true,
        user: null // User must verify email before we return user data
      }

    } catch (error) {
      const appError = createError(
        ERROR_CODES.SYSTEM_ERROR,
        'Unexpected error during sign up',
        undefined,
        'Please check your internet connection and try again.'
      )
      logError(appError, 'AuthenticationService.signUp - catch block')
      return {
        success: false,
        error: toAuthError(appError)
      }
    }
  }

  // Sign out current user
  static async signOut(): Promise<void> {
    try {
      // Get current user to clear cache
      const currentUser = await this.getCurrentUser()
      
      const { error } = await supabase.auth.signOut()
      
      // Clear cache regardless of Supabase response
      if (currentUser?.id) {
        await AuthCache.clearUserCache(currentUser.id)
      }
      
      if (error) {
        // Log error but don't throw - sign out should always succeed from user perspective
        const appError = handleSupabaseAuthError(error)
        logError(appError, 'AuthenticationService.signOut')
      }
    } catch (error) {
      // Log error but don't throw - sign out should always succeed from user perspective
      const appError = createError(ERROR_CODES.SYSTEM_ERROR, 'Sign out system error')
      logError(appError, 'AuthenticationService.signOut - catch block')
    }
  }

  // Request password reset
  static async requestPasswordReset(email: string): Promise<AuthenticationResult> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        {
          redirectTo: `${typeof window !== 'undefined' ? window.location.origin : 'https://anointarray.com'}/auth/reset-password`
        }
      )

      if (error) {
        const appError = handleSupabaseAuthError(error)
        logError(appError, 'AuthenticationService.requestPasswordReset')
        return {
          success: false,
          error: toAuthError(appError)
        }
      }

      return { success: true }

    } catch (error) {
      const appError = createError(
        ERROR_CODES.SYSTEM_ERROR,
        'Unexpected error during password reset request',
        undefined,
        'Please check your internet connection and try again.'
      )
      logError(appError, 'AuthenticationService.requestPasswordReset - catch block')
      return {
        success: false,
        error: toAuthError(appError)
      }
    }
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<AuthenticatedUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      
      if (error || !user) {
        return null
      }

      // Try to get from cache first
      const cachedUser = await AuthCache.getUserProfile(user.id)
      if (cachedUser) {
        return cachedUser
      }

      let authenticatedUser: AuthenticatedUser

      // Try to fetch user profile from database, but continue without it if table doesn't exist
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (profileError) {
          // If profiles table doesn't exist or profile not found, use fallback
          console.warn('Profile fetch failed in getCurrentUser, using email-based authentication:', profileError.message)
          authenticatedUser = transformSupabaseUser(user)
        } else {
          authenticatedUser = transformUserProfile(user, profile)
        }
      } catch (profileFetchError) {
        // Profiles table doesn't exist - use email-based authentication
        console.warn('Profiles table not available in getCurrentUser, using email-based authentication')
        authenticatedUser = transformSupabaseUser(user)
      }
      
      // Cache the profile for future requests
      await AuthCache.cacheUserProfile(user.id, authenticatedUser)

      return authenticatedUser

    } catch (error) {
      return null
    }
  }

  // Get current session
  static async getCurrentSession() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      return error ? null : session
    } catch (error) {
      return null
    }
  }

  // Listen for authentication state changes
  static onAuthStateChange(callback: (user: AuthenticatedUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const user = await this.getCurrentUser()
        callback(user)
      } else {
        callback(null)
      }
    })
  }

  // Utility function to check if email is admin
  static isAdminEmail(email: string): boolean {
    return ADMIN_EMAILS.includes(email as any)
  }

  // Utility function to get redirect path based on user role
  static getRedirectPath(user: AuthenticatedUser | null): string {
    if (!user) return '/login'
    if (user.role === 'admin') return '/admin/dashboard'
    return '/member/dashboard'
  }
}

// Export Supabase client for direct use when needed
export { supabase }