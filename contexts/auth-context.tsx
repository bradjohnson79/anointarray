'use client'

// Authentication context following CODE_STANDARDS.md - clean React patterns
// Deterministic init with proper router.isReady checks and debug logging

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthenticatedUser, AuthenticationState, AuthenticationError, LoginCredentials, SignupCredentials } from '../lib/types/auth'
import { createClient } from '@supabase/supabase-js'
import ErrorBoundary from '@/components/ErrorBoundary'

const DEBUG = process.env.NEXT_PUBLIC_DEBUG_AUTH === '1'

// Initialize Supabase client directly
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Admin email check
const ADMIN_EMAILS = ['info@anoint.me', 'breanne@aetherx.co']
const isAdminEmail = (email: string) => ADMIN_EMAILS.includes(email.toLowerCase().trim())

// Transform Supabase user to our user type
const transformUser = (supabaseUser: any, profile: any): AuthenticatedUser => {
  const isAdmin = profile?.is_admin === true || isAdminEmail(supabaseUser.email || '')
  
  return {
    id: supabaseUser.id,
    email: supabaseUser.email,
    role: isAdmin ? 'admin' : 'member',
    displayName: profile?.full_name || supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
    emailVerified: supabaseUser.email_confirmed_at ? true : false,
    createdAt: supabaseUser.created_at,
    updatedAt: supabaseUser.updated_at || supabaseUser.created_at
  }
}

interface AuthContextType extends AuthenticationState {
  signIn: (email: string, password: string) => Promise<boolean>
  signUp: (email: string, password: string, displayName: string) => Promise<boolean>  
  signOut: () => Promise<void>
  requestPasswordReset: (email: string) => Promise<boolean>
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<AuthenticationError | null>(null)
  const [session, setSession] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Deterministic authentication initialization
  useEffect(() => {
    let mounted = true
    let unsub: (() => void) | undefined
    const controller = new AbortController()
    const timeoutMs = 10000 // 10s
    const start = Date.now()

    async function init() {
      if (DEBUG) console.log('[AuthProvider] init start, waiting for router...')
      
      // Wait until router is ready (Next.js)
      if (!router.isReady) {
        await new Promise(r => {
          const i = setInterval(() => {
            if (router.isReady) { 
              clearInterval(i)
              r(null)
            }
          }, 50)
        })
      }

      // First, get current session explicitly
      const { data: s, error: e } = await supabase.auth.getSession()
      if (DEBUG) console.log('[AuthProvider] getSession:', { hasSession: !!s?.session, error: e?.message })

      if (!mounted) return

      setSession(s?.session ?? null)
      const sessionUser = s?.session?.user ?? null

      // Subscribe to auth changes (single source of truth)
      const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
        if (!mounted) return
        if (DEBUG) console.log('[AuthProvider] onAuthStateChange:', event, !!sess)
        setSession(sess ?? null)
        setUser(sess?.user ? transformUser(sess.user, profile) : null)
      })
      unsub = () => sub.subscription.unsubscribe?.()

      // Profile load (guard 404 gracefully)
      if (sessionUser?.id) {
        try {
          const { data: profileData, error: pErr } = await supabase
            .from('user_profiles')
            .select('is_admin, full_name, phone')
            .eq('id', sessionUser.id)
            .single()

          if (DEBUG) console.log('[AuthProvider] profile:', { has: !!profileData, error: pErr?.message })
          if (mounted) {
            setProfile(profileData ?? null)
            setUser(transformUser(sessionUser, profileData))
          }
        } catch (err) {
          if (DEBUG) console.error('[AuthProvider] profile fetch threw:', err)
          if (mounted) {
            setProfile(null)
            setUser(transformUser(sessionUser, null))
          }
        }
      } else {
        if (DEBUG) console.log('[AuthProvider] no user; profile = null')
        if (mounted) {
          setProfile(null)
          setUser(null)
        }
      }

      if (mounted) setIsLoading(false)
    }

    // Timeout safety with soft-fallback (does NOT freeze UI)
    const t = setTimeout(() => {
      if (!mounted) return
      console.warn('EMERGENCY: Auth initialization timeout - soft fallback (UI stays usable)')
      setIsLoading(false)
    }, timeoutMs)

    init().finally(() => {
      clearTimeout(t)
    })

    return () => {
      mounted = false
      controller.abort()
      unsub?.()
    }
  }, [router.isReady])

  // Redirect logic - only AuthProvider performs redirects
  useEffect(() => {
    if (isLoading) return
    // Avoid redirect loops while hydration not ready
    if (!router.isReady) return

    const path = router.asPath || pathname
    const onAuthPage = path.startsWith('/auth') || ['/login', '/signup', '/forgot-password'].includes(path)

    if (DEBUG) console.log('[AuthProvider] redirect check:', { path, onAuthPage, hasSession: !!session, hasProfile: !!profile })

    if (session && profile) {
      if (profile.is_admin && onAuthPage) {
        if (DEBUG) console.log('[AuthProvider] redirecting admin to /admin/dashboard')
        router.replace('/admin/dashboard')
      } else if (onAuthPage) {
        if (DEBUG) console.log('[AuthProvider] redirecting member to /member/dashboard')  
        router.replace('/member/dashboard')
      }
    }
  }, [isLoading, session, profile, router.isReady, router.asPath, pathname])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim()
      })

      if (authError) {
        setError({
          code: authError.message.includes('Invalid') ? 'INVALID_CREDENTIALS' : 'SIGNIN_ERROR',
          message: authError.message,
          remediation: 'Please check your email and password and try again.'
        })
        setIsLoading(false)
        return false
      }

      if (data.user) {
        // Auth state change will be handled by the listener
        if (DEBUG) console.log('[AuthProvider] signIn success, waiting for auth state change')
        return true
      }

      setIsLoading(false)
      return false
    } catch (error) {
      setError({
        code: 'SIGNIN_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        remediation: 'Please try again. If the problem persists, contact support.'
      })
      setIsLoading(false)
      return false
    }
  }, [])

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            display_name: displayName.trim()
          }
        }
      })

      if (authError) {
        setError({
          code: authError.message.includes('already') ? 'EMAIL_EXISTS' : 'SIGNUP_ERROR',
          message: authError.message,
          remediation: authError.message.includes('already') 
            ? 'This email is already registered. Try signing in instead.'
            : 'Please check your information and try again.'
        })
        setIsLoading(false)
        return false
      }

      if (DEBUG) console.log('[AuthProvider] signUp success, check email for verification')
      setIsLoading(false)
      return true
    } catch (error) {
      setError({
        code: 'SIGNUP_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        remediation: 'Please try again. If the problem persists, contact support.'
      })
      setIsLoading(false)
      return false
    }
  }, [])

  // Sign out function  
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    try {
      await supabase.auth.signOut()
      setSession(null)
      setUser(null)
      setProfile(null)
      setError(null)
      if (DEBUG) console.log('[AuthProvider] signOut success')
    } catch (error) {
      if (DEBUG) console.error('[AuthProvider] signOut error:', error)
    }
    setIsLoading(false)
  }, [])

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setError(null)
    
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (authError) {
        setError({
          code: 'PASSWORD_RESET_ERROR',
          message: authError.message,
          remediation: 'Please check your email address and try again.'
        })
        return false
      }

      if (DEBUG) console.log('[AuthProvider] password reset email sent')
      return true
    } catch (error) {
      setError({
        code: 'PASSWORD_RESET_EXCEPTION',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        remediation: 'Please try again. If the problem persists, contact support.'
      })
      return false
    }
  }, [])

  // Clear error function
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const contextValue: AuthContextType = useMemo(() => ({
    user,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    requestPasswordReset,
    clearError
  }), [user, isLoading, error, signIn, signUp, signOut, requestPasswordReset, clearError])

  return (
    <ErrorBoundary fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-red-500/20 text-center">
          <h2 className="text-xl font-bold text-white mb-4">Authentication Error</h2>
          <p className="text-gray-300 mb-4">Something went wrong with authentication. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
          >
            Refresh Page
          </button>
        </div>
      </div>
    }>
      <AuthContext.Provider value={contextValue}>
        {children}
      </AuthContext.Provider>
    </ErrorBoundary>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Hook for checking authentication status  
export function useAuthStatus() {
  const { user, isLoading } = useAuth()
  
  return useMemo(() => ({
    isAuthenticated: !!user && user.emailVerified,
    isAdmin: user?.role === 'admin' && user.emailVerified,
    isMember: (user?.role === 'member' || user?.role === 'admin') && user?.emailVerified,
    isLoading,
    user
  }), [user, isLoading])
}

// Helper exports
export const isAdmin = (user: AuthenticatedUser | null) => user?.role === 'admin' && user.emailVerified
export const isAuthed = (user: AuthenticatedUser | null) => !!user && user.emailVerified