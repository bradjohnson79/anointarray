// Supabase client - ONLY for OpenAI API integration
// Authentication remains mock-based in auth.ts

import { createClient } from '@supabase/supabase-js'

// Environment variables should be set in deployment environment
// Never store API keys in the code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Production ready - no debug logging

// Create client only if we have valid credentials
export const supabase = (() => {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Credentials missing - return mock client
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
    } as ReturnType<typeof createClient>
  }
  
  try {
    const client = createClient(supabaseUrl, supabaseAnonKey)
    // Client created successfully
    return client
  } catch (error) {
    // Failed to create client
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