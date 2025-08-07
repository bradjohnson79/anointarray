// Supabase client - ONLY for OpenAI API integration
// Authentication remains mock-based in auth.ts

import { createClient } from '@supabase/supabase-js'

// Environment variables should be set in deployment environment
// Never store API keys in the code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Debug logging for production
console.log('🔧 Supabase initialization:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length
})

// Create client only if we have valid credentials
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('❌ Supabase credentials missing:', {
      url: supabaseUrl || 'MISSING',
      key: supabaseAnonKey ? 'SET' : 'MISSING'
    })
    // Return a mock client that throws helpful errors
    return {
      auth: {
        signUp: () => Promise.reject(new Error('Supabase not configured: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')),
        signInWithPassword: () => Promise.reject(new Error('Supabase not configured: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')),
        signOut: () => Promise.reject(new Error('Supabase not configured: Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY')),
        getUser: () => Promise.resolve({ data: { user: null }, error: new Error('Supabase not configured') }),
        getSession: () => Promise.resolve({ data: { session: null }, error: new Error('Supabase not configured') }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
      },
      from: () => ({
        select: () => ({ eq: () => ({ single: () => Promise.reject(new Error('Supabase not configured')) }) }),
        insert: () => Promise.reject(new Error('Supabase not configured')),
        update: () => ({ eq: () => Promise.reject(new Error('Supabase not configured')) })
      })
    } as any
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client created successfully')
    return client
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    throw error
  }
})()

// OpenAI configuration - API key should be stored in Supabase Edge Functions
// or as environment variables, never client-side
export const OPENAI_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 2000,
}