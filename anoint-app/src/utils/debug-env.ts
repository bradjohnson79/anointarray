// Debug utility to check environment variables
export const debugEnv = () => {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  
  console.log('🔍 Environment Debug:')
  console.log('VITE_SUPABASE_URL:', supabaseUrl)
  console.log('URL length:', supabaseUrl?.length)
  console.log('URL includes correct ID:', supabaseUrl?.includes('xmnghciitiefbwxzhgrw'))
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT SET')
  console.log('Key length:', supabaseKey?.length)
  console.log('Key starts with correct prefix:', supabaseKey?.startsWith('eyJhbGciOiJIUzI1NiIs'))
  
  // Check for typo
  if (supabaseUrl?.includes('xmnghciitifbwxzhgorw')) {
    console.error('❌ URL contains typo! Should be xmnghciitiefbwxzhgrw')
  }
  
  // Check if key is complete
  const expectedKeyLength = 208 // Actual Supabase anon key length for this project
  if (supabaseKey && supabaseKey.length < expectedKeyLength) {
    console.error(`❌ API key appears truncated! Length: ${supabaseKey.length}, expected: ~${expectedKeyLength}`)
  }
  
  return {
    url: supabaseUrl,
    key: supabaseKey,
    isValid: supabaseUrl?.includes('xmnghciitiefbwxzhgrw') && !!supabaseKey && supabaseKey.length > 200
  }
}