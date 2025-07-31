#!/usr/bin/env node

// Test simple signup without database triggers - manual profile creation
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testDirectUserCreation() {
  console.log('🧪 Testing Direct User Creation (Admin Method)...\n')
  
  const testEmail = 'info@anoint.me'
  const testPassword = 'Admin123'
  
  try {
    // Step 1: Create user using admin API
    console.log('Step 1: Creating user with admin API...')
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Skip email verification
    })
    
    if (userError) {
      console.error('❌ User creation failed:', userError.message)
      return
    }
    
    console.log('✅ User created:', userData.user.id)
    
    // Step 2: Create profile using service role
    console.log('Step 2: Creating profile with service role...')
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userData.user.id,
        email: testEmail,
        role: 'admin',
        is_active: true,
        is_verified: true
      })
      .select()
    
    if (profileError) {
      console.error('❌ Profile creation failed:', profileError.message)
      console.error('Full error:', profileError)
      return
    }
    
    console.log('✅ Profile created successfully!')
    
    // Step 3: Test login
    console.log('Step 3: Testing login...')
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    const { data: loginData, error: loginError } = await supabaseClient.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    })
    
    if (loginError) {
      console.error('❌ Login failed:', loginError.message)
      return
    }
    
    console.log('✅ Login successful!')
    
    // Step 4: Test profile access when authenticated
    console.log('Step 4: Testing authenticated profile access...')
    const { data: authProfile, error: authError } = await supabaseClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', loginData.user.id)
      .single()
    
    if (authError) {
      console.error('❌ Profile access failed:', authError.message)
    } else {
      console.log('✅ Profile access successful!')
      console.log('Profile data:', {
        email: authProfile.email,
        role: authProfile.role,
        is_active: authProfile.is_active,
        is_verified: authProfile.is_verified
      })
    }
    
    console.log('\n🎉 SUCCESS: Direct user creation method works!')
    console.log('Admin account ready for use on the website.')
    
  } catch (error) {
    console.error('❌ Test failed with exception:', error.message)
  }
}

testDirectUserCreation()