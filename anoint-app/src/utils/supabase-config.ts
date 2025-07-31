// Supabase configuration
const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'

export const getSupabaseConfig = () => {
  // Use environment variables if available, otherwise use defaults
  let supabaseUrl = import.meta.env.VITE_SUPABASE_URL || SUPABASE_URL
  let supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY

  // Log configuration for debugging
  console.log('🔍 Supabase Configuration:')
  console.log('  URL:', supabaseUrl)
  console.log('  Key length:', supabaseKey?.length)
  console.log('  Key source:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'environment' : 'fallback')
  
  // Validate key format
  const isValidKey = supabaseKey?.startsWith('eyJ') && supabaseKey?.includes('.')
  if (!isValidKey) {
    console.error('❌ Invalid API key format!')
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