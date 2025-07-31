#!/usr/bin/env node

// Simple admin account creation using signup flow
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

// Create both clients
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminAccount() {
  const email = 'info@anoint.me'
  const password = 'Admin123'
  
  console.log('🚀 Creating admin account via signup...')
  console.log(`📧 Email: ${email}`)
  
  try {
    // First, try to sign up the user
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
      email: email,
      password: password
    })
    
    if (signupError && !signupError.message.includes('already registered')) {
      throw signupError
    }
    
    let userId
    if (signupData?.user) {
      userId = signupData.user.id
      console.log('✅ User created via signup')
    } else {
      // User might already exist, get their ID
      console.log('⚠️ User might already exist, looking up...')
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers()
      if (listError) throw listError
      
      const existingUser = users.find(u => u.email === email)
      if (!existingUser) {
        throw new Error('Could not create or find user')
      }
      userId = existingUser.id
      console.log('✅ Found existing user')
    }
    
    console.log(`👤 User ID: ${userId}`)
    
    // Create or update the profile with admin role using service role
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: userId,
        email: email,
        role: 'admin',
        is_active: true,
        is_verified: true,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (profileError) {
      console.error('❌ Profile error:', profileError)
      throw profileError
    }
    
    console.log('✅ Admin profile created/updated!')
    console.log('')
    console.log('🎉 Admin account setup complete!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👑 Role: admin`)
    console.log('')
    console.log('You can now login at: https://anointarray.com/auth')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAdminAccount()