import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🧪 Testing with simple email format...')

// Test with different email formats
const emailTests = [
  `test${Date.now()}@example.com`,  // Simple format
  `info@anoint.me`,                  // Your admin email
  `user.test${Date.now()}@gmail.com` // Dot format
]

for (const email of emailTests) {
  console.log(`\n📧 Testing: ${email}`)
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: 'TestPassword123!'
  })

  if (error) {
    console.error(`❌ Error: ${error.message}`)
  } else {
    console.log(`✅ SUCCESS! User created: ${data.user?.email}`)
    console.log(`   User ID: ${data.user?.id}`)
    
    // Now test profile creation
    if (data.user) {
      console.log('   Testing profile creation...')
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: data.user.id,
          email: email,
          display_name: 'Test User',
          role: email === 'info@anoint.me' ? 'admin' : 'user',
          is_verified: email === 'info@anoint.me'
        })
      
      if (profileError) {
        console.error(`   ❌ Profile error: ${profileError.message}`)
      } else {
        console.log('   ✅ Profile created successfully!')
      }
    }
    break // Stop on first success
  }
}