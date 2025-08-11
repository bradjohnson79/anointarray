import { create } from 'zustand'
import { supabase } from './supabaseClient'
import type { User, Session } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  role?: string
  is_admin?: boolean
  created_at?: string
}

interface AuthState {
  user: User | null
  session: Session | null
  profile: Profile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<boolean>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  profile: null,
  loading: true,
  error: null,

  initialize: async () => {
    try {
      set({ loading: true, error: null })
      
      // Get initial session
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Get profile data using user_id (not id)
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile fetch error:', profileError)
        }

        set({
          user: session.user,
          session,
          profile: profile || null,
          loading: false
        })
      } else {
        set({
          user: null,
          session: null,
          profile: null,
          loading: false
        })
      }

      // Listen for auth changes
      supabase.auth.onAuthStateChange(async (event, session) => {
        if (session) {
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', session.user.id)
            .single()

          set({
            user: session.user,
            session,
            profile: profile || null,
            loading: false,
            error: null
          })
        } else {
          set({
            user: null,
            session: null,
            profile: null,
            loading: false,
            error: null
          })
        }
      })
    } catch (error) {
      console.error('Auth initialization error:', error)
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      })
    }
  },

  signIn: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null })
      
      console.log('Attempting login for:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error('Supabase auth error:', error.message, error.status)
        throw error
      }
      
      console.log('Authentication successful for:', email)

      // Get the user profile after successful sign in using user_id
      if (data.user) {
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single()
        
        if (profileError && profileError.code !== 'PGRST116') {
          console.warn('Profile fetch error during login:', profileError)
        }

        set({
          user: data.user,
          session: data.session,
          profile: profile || null,
          loading: false,
          error: null
        })
      } else {
        set({ loading: false })
      }

      return true
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : 'Sign in failed'
      })
      return false
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null })
      
      // Try to sign out from Supabase (but don't let it block)
      try {
        await supabase.auth.signOut()
      } catch (apiError) {
        console.warn('Supabase signOut API error (continuing anyway):', apiError)
      }
      
      // Always clear local state regardless of API response
      set({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null
      })
      
      // Force reload to clear any cached state
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Sign out error:', error)
      // Even on error, clear local state and redirect
      set({
        user: null,
        session: null,
        profile: null,
        loading: false,
        error: null
      })
      if (typeof window !== 'undefined') {
        window.location.href = '/login'
      }
    }
  },
}))