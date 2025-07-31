import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🧪 Testing admin account: info@anoint.me / Admin123')

// First, try to sign in (in case account already exists)
const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
  email: 'info@anoint.me',
  password: 'Admin123'
})

if (signInData?.user) {
  console.log('✅ Admin account exists and login successful!')
  console.log('   User ID:', signInData.user.id)
  console.log('   Email:', signInData.user.email)
  
  // Check if profile exists
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', signInData.user.id)
    .single()
  
  if (profile) {
    console.log('✅ Admin profile exists:', profile)
  } else {
    console.log('⚠️  No profile found - creating one...')
    
    // Create profile while authenticated
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: signInData.user.id,
        email: 'info@anoint.me',
        display_name: 'Administrator',
        role: 'admin',
        is_verified: true
      })
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)
    } else {
      console.log('✅ Admin profile created successfully!')
    }
  }
} else {
  console.log('❌ Login failed:', signInError?.message)
  console.log('💡 Try creating the account through the website')
}