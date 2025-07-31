import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🔍 Checking Supabase connection and settings...')

// Test 1: Can we reach Supabase?
const { data: test, error: connError } = await supabase
  .from('user_profiles')
  .select('count(*)')
  .single()

if (connError && connError.code !== 'PGRST116') {
  console.error('❌ Connection error:', connError.message)
} else {
  console.log('✅ Connected to Supabase')
}

// Test 2: Try to sign in with a non-existent user (different error expected)
const { error: signInError } = await supabase.auth.signInWithPassword({
  email: 'definitely-not-exists@test.com',
  password: 'TestPassword123!'
})

console.log('🔍 Sign-in error for non-existent user:', signInError?.message || 'No error')

// Test 3: Check if there are any existing users
const { count } = await supabase.auth.admin?.listUsers() || { count: 0 }
console.log('📊 Existing auth users:', count || 'Unable to check (requires service role)')

console.log('\n💡 Next steps:')
console.log('1. Check Supabase Dashboard → Authentication → Settings')
console.log('2. Ensure "Confirm email" is DISABLED')
console.log('3. Check if there are any Auth Hooks enabled')
console.log('4. Verify SMTP is not required for signup')