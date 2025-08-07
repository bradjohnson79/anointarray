'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { SupabaseAuth, User, AuthState } from '@/lib/auth'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  useEffect(() => {
    // Check for existing session on mount and set up auth state listener
    const initializeAuth = async () => {
      try {
        const user = await SupabaseAuth.getCurrentUser()
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false
        })
      } catch (error) {
        console.error('Error initializing auth:', error)
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        })
      }
    }

    initializeAuth()

    // Set up auth state change listener
    const { data: { subscription } } = SupabaseAuth.onAuthStateChange((user) => {
      console.log('🔄 AuthContext: Auth state change detected:', {
        user: user ? `${user.email} (${user.role})` : null,
        isAuthenticated: !!user
      })
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        isLoading: false
      }))
    })

    // Cleanup subscription on unmount
    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    console.log('🔐 AuthContext.login called with:', { email })
    setAuthState(prev => ({ ...prev, isLoading: true }))
    console.log('🔄 AuthContext: Loading state set to true')
    
    try {
      console.log('📞 AuthContext: Calling SupabaseAuth.signIn...')
      const { user, error } = await SupabaseAuth.signIn(email, password)
      console.log('📨 AuthContext: SupabaseAuth.signIn returned:', { user: !!user, error })
      
      if (user && !error) {
        console.log('✅ AuthContext: Authentication successful')
        // Auth state will be updated by the onAuthStateChange listener
        return { success: true }
      } else {
        console.log('❌ AuthContext: Authentication failed:', error)
        setAuthState(prev => ({
          ...prev,
          isLoading: false
        }))
        return { success: false, error: error || 'Login failed' }
      }
    } catch (authError) {
      console.error('🚨 AuthContext: Error during login:', authError)
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
      return { success: false, error: 'Authentication system error' }
    }
  }

  const logout = async () => {
    try {
      await SupabaseAuth.signOut()
      // Auth state will be updated by the onAuthStateChange listener
    } catch (error) {
      console.error('Logout error:', error)
      // Force local state update if remote logout fails
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }

  return (
    <AuthContext.Provider value={{
      ...authState,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}