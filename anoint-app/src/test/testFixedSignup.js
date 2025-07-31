import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🧪 Testing fixed signup flow...')

const testEmail = `user${Math.floor(Math.random() * 10000)}@test.com`
const testPassword = 'TestPassword123!'

console.log(`📧 Testing signup with: ${testEmail}`)

// Test the correct flow - signup only, no immediate login
const { data, error } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword
})

if (error) {
  console.error('❌ Signup error:', error.message)
  process.exit(1)
}

if (data.user && data.session) {
  console.log('✅ SUCCESS! User created with active session')
  console.log('   User ID:', data.user.id)
  console.log('   Email:', data.user.email)
  console.log('   Session exists:', !!data.session)
  console.log('   Access token length:', data.session.access_token.length)
  
  // Test profile creation with the existing session
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: data.user.id,
      email: testEmail,
      display_name: 'Fixed Test User',
      role: 'user',
      is_active: true
    })
  
  if (profileError) {
    console.error('❌ Profile creation failed:', profileError.message)
  } else {
    console.log('✅ Profile created successfully with existing session!')
  }
} else {
  console.log('⚠️ User created but no session (email confirmation may be enabled)')
}