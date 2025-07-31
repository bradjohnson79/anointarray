// Debug utility to check environment variables
export const debugEnv = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('🔍 Environment Debug:')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('URL length:', supabaseUrl?.length)
  console.log('URL includes correct ID:', supabaseUrl?.includes('xmnghciitiefbwxzhgrw'))
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET')
  
  // Check for typo
  if (supabaseUrl?.includes('xmnghciitifbwxzhgorw')) {
    console.error('❌ URL contains typo! Should be xmnghciitiefbwxzhgrw')
  }
  
  return {
    url: supabaseUrl,
    key: supabaseKey,
    isValid: supabaseUrl?.includes('xmnghciitiefbwxzhgrw') && !!supabaseKey
  }
}