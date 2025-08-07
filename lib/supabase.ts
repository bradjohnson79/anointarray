// Supabase client - ONLY for OpenAI API integration
// Authentication remains mock-based in auth.ts

import { createClient } from '@supabase/supabase-js'

// Environment variables should be set in deployment environment
// Never store API keys in the code
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// OpenAI configuration - API key should be stored in Supabase Edge Functions
// or as environment variables, never client-side
export const OPENAI_CONFIG = {
  model: 'gpt-4o',
  temperature: 0.7,
  max_tokens: 2000,
}