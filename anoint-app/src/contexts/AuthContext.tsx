import { createContext, useContext, useEffect, useState } from 'react'
import { createClient, type User, type Session } from '@supabase/supabase-js'
import { debugEnv } from '../utils/debug-env'

// Debug environment on load
debugEnv()

// Force correct URL if typo is detected
let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'
let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key'

// Fix typo if present
if (supabaseUrl.includes('xmnghciitifbwxzhgorw')) {
  console.warn('⚠️ Fixing Supabase URL typo')
  supabaseUrl = supabaseUrl.replace('xmnghciitifbwxzhgorw', 'xmnghciitiefbwxzhgrw')
}

// If still using placeholder, use correct URL
if (supabaseUrl === 'https://placeholder.supabase.co') {
  console.warn('⚠️ Using hardcoded Supabase URL - environment variables not loaded')
  supabaseUrl = 'https://xmnghciitiefbwxzhgrw.supabase.co'
}

// If key looks truncated or invalid, use the known working key
if (!supabaseKey || supabaseKey === 'placeholder-key' || supabaseKey.length < 250) {
  console.warn('⚠️ Using hardcoded Supabase key - environment variable missing or truncated')
  console.warn(`   Original key length: ${supabaseKey?.length || 0}, using full key`)
  supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
}

const supabase = createClient(supabaseUrl, supabaseKey)

interface UserProfile {
  id: string
  user_id: string
  email: string
  first_name?: string
  last_name?: string
  display_name?: string
  role: 'user' | 'admin' | 'moderator' | 'vip'
  is_active: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: any }>
  signUp: (email: string, password: string) => Promise<{ error?: any }>
  signOut: () => Promise<{ error?: any }>
  isAuthenticated: boolean
  getUserEmail: () => string | null
  getUserRole: () => string | null
  isAdmin: () => boolean
  isModerator: () => boolean
  isVip: () => boolean
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return null
      }

      return data as UserProfile
    } catch (error) {
      console.error('Error fetching user profile:', error)
      return null
    }
  }

  const refreshProfile = async () => {
    if (user) {
      const userProfile = await fetchUserProfile(user.id)
      setProfile(userProfile)
    }
  }

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id)
        setProfile(userProfile)
      } else {
        setProfile(null)
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const getUserEmail = (): string | null => {
    return user?.email || null
  }

  const getUserRole = (): string | null => {
    return profile?.role || null
  }

  const isAdmin = (): boolean => {
    return profile?.role === 'admin' || false
  }

  const isModerator = (): boolean => {
    return profile?.role === 'moderator' || profile?.role === 'admin' || false
  }

  const isVip = (): boolean => {
    return profile?.role === 'vip' || profile?.role === 'moderator' || profile?.role === 'admin' || false
  }

  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: !!user,
    getUserEmail,
    getUserRole,
    isAdmin,
    isModerator,
    isVip,
    refreshProfile
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}