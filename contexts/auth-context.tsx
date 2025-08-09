'use client'

// Authentication context following CODE_STANDARDS.md - clean React patterns
// No console.log statements in production code

import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import type { AuthenticatedUser, AuthenticationState, AuthenticationError } from '../lib/types/auth'
import { AuthenticationService } from '../lib/services/authentication'
import ErrorBoundary from '@/components/ErrorBoundary'

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
  const router = useRouter()
  const pathname = usePathname()

  // Initialize authentication state with aggressive timeout failsafe
  useEffect(() => {
    let mounted = true
    
    // CRITICAL HOTFIX: Immediately set loading to false after 1 second to prevent infinite loading
    const emergencyTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('EMERGENCY: Auth initialization timeout - forcing loading to false')
        setIsLoading(false)
      }
    }, 1000) // 1 second emergency timeout
    
    // Also keep the original 5 second timeout as backup
    const loadingTimeout = setTimeout(() => {
      if (mounted) {
        console.warn('Auth initialization timeout - forcing loading to false')
        setIsLoading(false)
      }
    }, 5000) // 5 second timeout

    const initializeAuth = async () => {
      try {
        const currentUser = await AuthenticationService.getCurrentUser()
        if (mounted) {
          setUser(currentUser)
          clearTimeout(emergencyTimeout)
          clearTimeout(loadingTimeout)
        }
      } catch (initError) {
        if (mounted) {
          console.error('Auth initialization error:', initError)
          setError({
            code: 'INIT_ERROR',
            message: 'Failed to initialize authentication',
            remediation: 'Please refresh the page. If the problem persists, clear your browser cache.'
          })
          clearTimeout(emergencyTimeout)
          clearTimeout(loadingTimeout)
        }
      } finally {
        if (mounted) {
          setIsLoading(false)
          clearTimeout(emergencyTimeout)
          clearTimeout(loadingTimeout)
        }
      }
    }

    initializeAuth()

    // Set up auth state listener
    try {
      const { data: { subscription } } = AuthenticationService.onAuthStateChange((updatedUser) => {
        if (mounted) {
          setUser(updatedUser)
          setError(null) // Clear errors on successful auth state change
          setIsLoading(false)
          clearTimeout(emergencyTimeout)
          clearTimeout(loadingTimeout)
        }
      })

      return () => {
        mounted = false
        clearTimeout(emergencyTimeout)
        clearTimeout(loadingTimeout)
        subscription?.unsubscribe()
      }
    } catch (listenerError) {
      console.error('Auth state listener error:', listenerError)
      if (mounted) {
        setIsLoading(false)
        clearTimeout(emergencyTimeout)
        clearTimeout(loadingTimeout)
      }
      return () => {
        mounted = false
        clearTimeout(emergencyTimeout)
        clearTimeout(loadingTimeout)
      }
    }
  }, [])

  // Centralized redirect logic - handles all navigation based on auth state
  useEffect(() => {
    if (isLoading) return // Don't redirect while loading

    const publicRoutes = ['/login', '/signup', '/forgot-password', '/auth', '/', '/about', '/contact', '/privacy', '/terms']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    // If user is authenticated and on auth pages, redirect to appropriate dashboard
    if (user && user.emailVerified && ['/login', '/signup', '/forgot-password'].includes(pathname)) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'
      router.replace(redirectPath)
      return
    }

    // If user is not authenticated and on protected routes, redirect to login
    if (!user && (pathname.startsWith('/admin') || pathname.startsWith('/member'))) {
      router.replace('/login')
      return
    }

    // If user is authenticated but email not verified, redirect to verification
    if (user && !user.emailVerified && !pathname.startsWith('/auth/verify-email')) {
      router.replace('/auth/verify-email')
      return
    }

    // If member tries to access admin routes, redirect to member dashboard
    if (user && user.role === 'member' && pathname.startsWith('/admin')) {
      router.replace('/member/dashboard')
      return
    }

    // If admin is on member routes, redirect to admin dashboard (optional)
    if (user && user.role === 'admin' && pathname.startsWith('/member/dashboard')) {
      router.replace('/admin/dashboard')
      return
    }

  }, [user, isLoading, pathname, router])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    const result = await AuthenticationService.signIn({ email, password })
    
    if (result.success && result.user) {
      setUser(result.user)
      setIsLoading(false)
      return true
    } else {
      setError(result.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        remediation: 'Please try again'
      })
      setIsLoading(false)
      return false
    }
  }, [])

  // Sign up function
  const signUp = useCallback(async (email: string, password: string, displayName: string): Promise<boolean> => {
    setIsLoading(true)
    setError(null)

    const result = await AuthenticationService.signUp({ email, password, displayName })
    
    if (result.success) {
      // For signup, user will be null until email verification
      setUser(null)
      setIsLoading(false)
      return true
    } else {
      setError(result.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        remediation: 'Please try again'
      })
      setIsLoading(false)
      return false
    }
  }, [])

  // Sign out function
  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true)
    await AuthenticationService.signOut()
    setUser(null)
    setError(null)
    setIsLoading(false)
  }, [])

  // Request password reset
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setError(null)
    
    const result = await AuthenticationService.requestPasswordReset(email)
    
    if (!result.success) {
      setError(result.error || {
        code: 'UNKNOWN_ERROR',
        message: 'An unknown error occurred',
        remediation: 'Please try again'
      })
      return false
    }
    
    return true
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