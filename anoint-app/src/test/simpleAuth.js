import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

console.log('🔍 Testing basic Supabase auth without profile creation...')

// Test 1: Basic signup without profile creation
const { data, error } = await supabase.auth.signUp({
  email: `simple+${Date.now()}@test.com`,
  password: 'Test123456!'
})

if (error) {
  console.error('❌ Basic auth error:', error.message)
  console.error('Full error:', error)
} else {
  console.log('✅ Basic auth success!')
  console.log('User ID:', data.user?.id)
  console.log('Email:', data.user?.email)
  
  // Test 2: Check if we can query the user_profiles table
  console.log('\n🔍 Testing user_profiles table access...')
  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1)
  
  if (profileError) {
    console.error('❌ Table access error:', profileError.message)
  } else {
    console.log('✅ Table accessible')
    console.log('Existing profiles:', profiles?.length || 0)
  }
}