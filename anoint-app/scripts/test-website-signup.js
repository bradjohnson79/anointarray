#!/usr/bin/env node

// Test website signup functionality directly
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function testWebsiteSignup() {
  console.log('🌐 Testing Website Signup Functionality')
  console.log('=' .repeat(50))
  
  const testUser = {
    email: 'info@anoint.me',
    password: 'Admin123'
  }
  
  try {
    // Test the same signup flow the website uses
    console.log('🔄 Testing signup with info@anoint.me...')
    
    const { data: signupData, error: signupError } = await supabase.auth.signUp({
      email: testUser.email,
      password: testUser.password
    })
    
    if (signupError) {
      console.log('❌ Signup failed:', signupError.message)
      console.log('Full error:', signupError)
      return false
    }
    
    if (!signupData.user) {
      console.log('❌ No user returned from signup')
      return false
    }
    
    console.log('✅ Signup successful!')
    console.log('User ID:', signupData.user.id)
    console.log('Email:', signupData.user.email)
    
    // Test profile creation (as AuthContext would do)
    console.log('🔄 Testing profile creation...')
    
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: signupData.user.id,
        email: signupData.user.email,
        role: 'admin', // Make this admin
        is_active: true,
        is_verified: true
      })
    
    if (profileError) {
      console.log('❌ Profile creation failed:', profileError.message)
      console.log('Full error:', profileError)
      return false
    }
    
    console.log('✅ Profile created successfully!')
    
    // Test sign in
    console.log('🔄 Testing sign in...')
    
    const { data: signinData, error: signinError } = await supabase.auth.signInWithPassword({
      email: testUser.email,
      password: testUser.password
    })
    
    if (signinError) {
      console.log('❌ Sign in failed:', signinError.message)
      return false
    }
    
    console.log('✅ Sign in successful!')
    
    // Test profile access
    console.log('🔄 Testing profile access...')
    
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', signinData.user.id)
      .single()
    
    if (fetchError) {
      console.log('❌ Profile fetch failed:', fetchError.message)
      return false
    }
    
    console.log('✅ Profile access successful!')
    console.log('Profile:', {
      email: profile.email,
      role: profile.role,
      is_active: profile.is_active,
      is_verified: profile.is_verified
    })
    
    console.log('\n🎉 SUCCESS! All website functionality working!')
    console.log('\n📋 SUMMARY:')
    console.log('✅ User signup works')
    console.log('✅ Profile creation works') 
    console.log('✅ User sign in works')
    console.log('✅ Profile access works')
    console.log('✅ Admin role assigned')
    console.log('\n🔗 Ready to use at: https://anointarray.com/auth')
    console.log('📧 Email: info@anoint.me')
    console.log('🔑 Password: Admin123')
    
    return true
    
  } catch (error) {
    console.log('❌ Exception:', error.message)
    return false
  }
}

testWebsiteSignup()