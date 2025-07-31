import { createClient } from '@supabase/supabase-js'

// Test with hardcoded values to eliminate any env var issues
const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🔬 Minimal auth test - no profile creation...')

const { data, error } = await supabase.auth.signUp({
  email: `minimal+${Date.now()}@test.com`,
  password: 'TestPassword123!'
})

if (error) {
  console.error('❌ Still getting error:', error.message)
  console.error('❌ Full error:', error)
} else {
  console.log('✅ SUCCESS! Basic auth is working')
  console.log('User created:', data.user?.email)
}