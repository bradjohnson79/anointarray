import { supabase } from './supabase'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  email: string
  role: 'admin' | 'member'
  displayName: string
  isActive: boolean
  createdAt: string
  // Extended customer data
  phone?: string
  loyaltyTier?: 'bronze' | 'silver' | 'gold'
  totalOrders?: number
  totalSpent?: number
  businessAccount?: boolean
  wholesaleAccount?: boolean
  company?: string
  prefersCrypto?: boolean
  ruralDelivery?: boolean
  isFirstTime?: boolean
  // Supabase specific
  emailVerified?: boolean
  lastSignIn?: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}

// Admin email addresses for role assignment
const ADMIN_EMAILS = [
  'info@anoint.me'
]

// Transform Supabase user to our User interface
function transformSupabaseUser(supabaseUser: SupabaseUser, profile?: any): User {
  const email = supabaseUser.email || ''
  const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
  
  // DEBUG: Log role assignment process
  console.log('🔍 Role Assignment Debug:', {
    email: email,
    emailLower: email.toLowerCase(),
    adminEmails: ADMIN_EMAILS,
    isAdmin: isAdmin
  })
  
  return {
    id: supabaseUser.id,
    email: email,
    role: isAdmin ? 'admin' : 'member',
    displayName: profile?.display_name || profile?.full_name || email.split('@')[0],
    isActive: true,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
    emailVerified: supabaseUser.email_confirmed_at ? true : false,
    lastSignIn: supabaseUser.last_sign_in_at || undefined,
    phone: profile?.phone || undefined,
    loyaltyTier: profile?.loyalty_tier || 'bronze',
    totalOrders: profile?.total_orders || 0,
    totalSpent: profile?.total_spent || 0,
    businessAccount: profile?.business_account || false,
    wholesaleAccount: profile?.wholesale_account || false,
    company: profile?.company || undefined,
    prefersCrypto: profile?.prefers_crypto || false,
    ruralDelivery: profile?.rural_delivery || false,
    isFirstTime: profile?.is_first_time ?? true
  }
}

export class SupabaseAuth {
  // Sign up new user
  static async signUp(email: string, password: string, displayName?: string): Promise<{ user: User | null; error: string | null }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            display_name: displayName || email.split('@')[0],
            full_name: displayName || email.split('@')[0]
          }
        }
      })

      if (error) {
        console.error('Supabase signup error:', error)
        return { user: null, error: error.message }
      }

      if (data.user) {
        // Create user profile
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            display_name: displayName || email.split('@')[0],
            full_name: displayName || email.split('@')[0],
            created_at: new Date().toISOString()
          })

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }

        const user = transformSupabaseUser(data.user)
        return { user, error: null }
      }

      return { user: null, error: 'Signup failed - no user returned' }
    } catch (error) {
      console.error('Signup error:', error)
      return { user: null, error: 'Authentication system error' }
    }
  }

  // Sign in existing user
  static async signIn(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    try {
      console.log('🔐 SupabaseAuth.signIn called with email:', email)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password
      })

      if (error) {
        console.error('Supabase signin error:', error)
        return { user: null, error: error.message }
      }

      if (data.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single()

        const user = transformSupabaseUser(data.user, profile)
        console.log('✅ SupabaseAuth: Authentication successful for:', user.displayName)
        return { user, error: null }
      }

      return { user: null, error: 'Sign in failed - no user returned' }
    } catch (error) {
      console.error('Sign in error:', error)
      return { user: null, error: 'Authentication system error' }
    }
  }

  // Sign out current user
  static async signOut(): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Supabase signout error:', error)
        return { error: error.message }
      }
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: 'Sign out failed' }
    }
  }

  // Get current authenticated user
  static async getCurrentUser(): Promise<User | null> {
    try {
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      
      if (!supabaseUser) {
        return null
      }

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', supabaseUser.id)
        .single()

      return transformSupabaseUser(supabaseUser, profile)
    } catch (error) {
      console.error('Get current user error:', error)
      return null
    }
  }

  // Get current session
  static async getSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      return session
    } catch (error) {
      console.error('Get session error:', error)
      return null
    }
  }

  // Check if user is authenticated
  static async isAuthenticated(): Promise<boolean> {
    const user = await this.getCurrentUser()
    return user !== null
  }

  // Check user role
  static async hasRole(requiredRole: 'admin' | 'member'): Promise<boolean> {
    const user = await this.getCurrentUser()
    if (!user) return false
    
    if (requiredRole === 'member') {
      return user.role === 'admin' || user.role === 'member'
    }
    
    return user.role === requiredRole
  }

  // Update user profile
  static async updateProfile(updates: Partial<User>): Promise<{ error: string | null }> {
    try {
      const user = await this.getCurrentUser()
      if (!user) {
        return { error: 'No authenticated user' }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: updates.displayName,
          full_name: updates.displayName,
          phone: updates.phone,
          loyalty_tier: updates.loyaltyTier,
          business_account: updates.businessAccount,
          wholesale_account: updates.wholesaleAccount,
          company: updates.company,
          prefers_crypto: updates.prefersCrypto,
          rural_delivery: updates.ruralDelivery,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (error) {
        console.error('Profile update error:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: 'Profile update failed' }
    }
  }

  // Reset password
  static async resetPassword(email: string): Promise<{ error: string | null }> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        console.error('Password reset error:', error)
        return { error: error.message }
      }

      return { error: null }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: 'Password reset failed' }
    }
  }

  // Listen for auth state changes
  static onAuthStateChange(callback: (user: User | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, !!session)
      
      if (session?.user) {
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        const user = transformSupabaseUser(session.user, profile)
        callback(user)
      } else {
        callback(null)
      }
    })
  }
}

// Legacy MockAuth class for backwards compatibility during migration
export class MockAuth {
  static async login(email: string, password: string): Promise<{ user: User | null; error: string | null }> {
    console.warn('⚠️ MockAuth.login is deprecated. Use SupabaseAuth.signIn instead.')
    return SupabaseAuth.signIn(email, password)
  }

  static logout(): void {
    console.warn('⚠️ MockAuth.logout is deprecated. Use SupabaseAuth.signOut instead.')
    SupabaseAuth.signOut()
  }

  static getCurrentUser(): User | null {
    console.warn('⚠️ MockAuth.getCurrentUser is deprecated. Use SupabaseAuth.getCurrentUser instead.')
    // This is a temporary sync wrapper - in practice, you should use the async version
    return null
  }

  static isAuthenticated(): boolean {
    console.warn('⚠️ MockAuth.isAuthenticated is deprecated. Use SupabaseAuth.isAuthenticated instead.')
    return false
  }

  static hasRole(requiredRole: 'admin' | 'member'): boolean {
    console.warn('⚠️ MockAuth.hasRole is deprecated. Use SupabaseAuth.hasRole instead.')
    return false
  }

  static getUserById(id: string): User | null {
    console.warn('⚠️ MockAuth.getUserById is deprecated.')
    return null
  }

  static getUserByEmail(email: string): User | null {
    console.warn('⚠️ MockAuth.getUserByEmail is deprecated.')
    return null
  }

  static getAllCustomers(): User[] {
    console.warn('⚠️ MockAuth.getAllCustomers is deprecated.')
    return []
  }
}

// Export the new auth system as default
export const Auth = SupabaseAuth