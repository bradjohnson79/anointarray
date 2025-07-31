import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xmnghciitiefbwxzhgrw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
)

console.log('🔑 Creating admin account: info@anoint.me / Admin123')

// Step 1: Sign up
const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
  email: 'info@anoint.me',
  password: 'Admin123'
})

if (signUpError) {
  console.error('❌ Signup error:', signUpError.message)
  
  // If user exists, try to sign in
  if (signUpError.message.includes('already registered')) {
    console.log('👤 User already exists, trying to sign in...')
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'info@anoint.me',
      password: 'Admin123'
    })
    
    if (signInData?.user) {
      console.log('✅ Login successful!')
      await createAdminProfile(signInData.user.id)
    } else {
      console.error('❌ Login failed:', signInError?.message)
    }
  }
} else if (signUpData?.user) {
  console.log('✅ Admin account created successfully!')
  console.log('   User ID:', signUpData.user.id)
  console.log('   Email:', signUpData.user.email)
  
  // Step 2: Sign in to get session
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'info@anoint.me',
    password: 'Admin123'
  })
  
  if (signInData?.user) {
    await createAdminProfile(signInData.user.id)
  }
}

async function createAdminProfile(userId) {
  console.log('📝 Creating admin profile...')
  
  // Check if profile exists
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  if (existingProfile) {
    console.log('✅ Profile already exists:', existingProfile)
    return
  }
  
  // Create profile
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      user_id: userId,
      email: 'info@anoint.me',
      display_name: 'Administrator',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_verified: true,
      is_active: true
    })
  
  if (profileError) {
    console.error('❌ Profile creation failed:', profileError.message)
  } else {
    console.log('✅ Admin profile created successfully!')
    console.log('🎉 ADMIN SETUP COMPLETE!')
    console.log('   Email: info@anoint.me')
    console.log('   Password: Admin123')
    console.log('   Role: admin')
  }
}