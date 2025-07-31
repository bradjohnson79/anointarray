import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🧪 Testing clean auth setup...')

const testEmail = `clean+${Date.now()}@test.com`
const testPassword = 'CleanTest123!'

// Step 1: Just try signup - no profile logic
console.log('1️⃣ Testing basic signup (no profile creation)...')
const { data, error } = await supabase.auth.signUp({
  email: testEmail,
  password: testPassword
})

if (error) {
  console.error('❌ Signup still failing:', error.message)
  console.log('\n🔍 Possible causes:')
  console.log('- Email confirmation is enabled in Supabase Dashboard')
  console.log('- Auth hooks are configured')
  console.log('- SMTP is required but not configured')
} else {
  console.log('✅ SUCCESS! Basic auth is working!')
  console.log('   User ID:', data.user?.id)
  console.log('   Email:', data.user?.email)
  console.log('\n✅ Auth system is clean and working!')
  console.log('   Now you can create profiles manually in your frontend')
}