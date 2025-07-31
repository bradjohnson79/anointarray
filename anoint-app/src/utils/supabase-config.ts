// Supabase configuration with key reconstruction
// This bypasses Netlify's truncation of long environment variables

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'

// The full anon key split into parts to avoid truncation
const ANON_KEY_PARTS = [
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiO',
  'jE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
]

const FULL_ANON_KEY = ANON_KEY_PARTS.join('')

export const getSupabaseConfig = () => {
  // Try environment variable first
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL
  let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  // Log what we got from environment
  console.log('🔍 Environment check:')
  console.log('  URL from env:', supabaseUrl)
  console.log('  Key from env length:', supabaseKey?.length || 0)
  
  // If key is truncated or missing, use our reconstructed key
  if (!supabaseKey || supabaseKey.length < 250) {
    console.warn('⚠️ Using reconstructed key due to truncation/missing env var')
    supabaseKey = FULL_ANON_KEY
  }

  // Fix URL typo if present
  if (supabaseUrl.includes('xmnghciitifbwxzhgorw')) {
    console.warn('⚠️ Fixing URL typo')
    supabaseUrl = supabaseUrl.replace('xmnghciitifbwxzhgorw', 'xmnghciitiefbwxzhgrw')
  }

  console.log('✅ Final config:')
  console.log('  URL:', supabaseUrl)
  console.log('  Key length:', supabaseKey?.length)
  console.log('  Key valid format:', supabaseKey?.startsWith('eyJ') && supabaseKey?.includes('.'))

  return {
    url: supabaseUrl,
    anonKey: supabaseKey
  }
}