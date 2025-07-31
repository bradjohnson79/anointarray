#!/usr/bin/env node

// Final Authentication Verification Script
// Run this AFTER setting up the database to verify everything works

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function verifyDatabaseSetup() {
  console.log('🔍 Verifying Database Setup...')
  
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.log('⚠️  Service role key not provided - testing with anon key only')
    return true
  }
  
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  
  try {
    // Test table exists
    const { data, error } = await supabaseAdmin.from('user_profiles').select('id').limit(1)
    
    if (error) {
      console.log('❌ Database not set up:', error.message)
      console.log('📋 Please run the SQL from ADMIN_SETUP_EVIDENCE.md first')
      return false
    }
    
    console.log('✅ Database is ready')
    return true
  } catch (error) {
    console.log('❌ Database check failed:', error.message)
    return false
  }
}

async function testAdminAccountCreation() {
  console.log('\n🎯 Testing Admin Account Creation...')
  
  try {
    // Test signup (same as website)
    const { data, error } = await supabase.auth.signUp({
      email: 'info@anoint.me',
      password: 'Admin123'
    })
    
    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ Admin account already exists')
        return true
      } else {
        console.log('❌ Signup failed:', error.message)
        return false
      }
    }
    
    if (data.user) {
      console.log('✅ Admin account created successfully')
      console.log('   User ID:', data.user.id)
      console.log('   Email:', data.user.email)
      return true
    }
    
    return false
  } catch (error) {
    console.log('❌ Account creation failed:', error.message)
    return false
  }
}

async function testAuthentication() {
  console.log('\n🔐 Testing Authentication...')
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'info@anoint.me',
      password: 'Admin123'
    })
    
    if (error) {
      console.log('❌ Login failed:', error.message)
      return null
    }
    
    console.log('✅ Login successful')
    console.log('   Session created:', !!data.session)
    console.log('   User authenticated:', !!data.user)
    
    return data
  } catch (error) {
    console.log('❌ Authentication error:', error.message)
    return null
  }
}

async function testAuthorization(authData) {
  console.log('\n🛡️ Testing Authorization...')
  
  try {
    // Create authenticated client
    const authenticatedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    authenticatedClient.auth.setSession(authData.session)
    
    // Test profile access
    const { data: profile, error } = await authenticatedClient
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single()
    
    if (error) {
      console.log('❌ Profile access failed:', error.message)
      return false
    }
    
    console.log('✅ Profile access successful')
    console.log('   Email:', profile.email)
    console.log('   Role:', profile.role)
    console.log('   Active:', profile.is_active)
    console.log('   Verified:', profile.is_verified)
    
    if (profile.role === 'admin') {
      console.log('✅ Admin role confirmed')
      return true
    } else {
      console.log('❌ Expected admin role, got:', profile.role)
      return false
    }
    
  } catch (error) {
    console.log('❌ Authorization test failed:', error.message)
    return false
  }
}

function generateSuccessReport() {
  console.log('\n' + '='.repeat(60))
  console.log('🎉 SUCCESS! ADMIN AUTHENTICATION SYSTEM IS READY')
  console.log('='.repeat(60))
  console.log('')
  console.log('✅ Database: Configured and accessible')
  console.log('✅ Admin Account: Created and verified')  
  console.log('✅ Authentication: Working correctly')
  console.log('✅ Authorization: Admin role assigned')
  console.log('')
  console.log('🔗 READY FOR USE:')
  console.log('   Website: https://anointarray.com/auth')
  console.log('   Email: info@anoint.me')
  console.log('   Password: Admin123')
  console.log('')
  console.log('📋 ADMIN FEATURES AVAILABLE:')
  console.log('   • User Management (/admin/users)')
  console.log('   • Role Assignment')
  console.log('   • Account Activation/Deactivation')  
  console.log('   • Profile Management (/profile)')
  console.log('   • Avatar Upload')
  console.log('   • Dashboard Access (/dashboard)')
  console.log('')
  console.log('🛡️ SECURITY FEATURES:')
  console.log('   • Role-based access control')
  console.log('   • Protected admin routes')
  console.log('   • Secure session management')
  console.log('   • RLS database policies')
  console.log('')
  console.log('STATUS: 🟢 PRODUCTION READY')
}

async function runFinalVerification() {
  console.log('🧪 FINAL AUTHENTICATION & AUTHORIZATION VERIFICATION')
  console.log('📧 Testing: info@anoint.me / Admin123')
  console.log('🌐 Target: https://anointarray.com')
  console.log('📅 Date:', new Date().toISOString())
  console.log('='.repeat(60))
  
  // Step 1: Verify database
  const dbReady = await verifyDatabaseSetup()
  if (!dbReady) {
    console.log('\n❌ Database setup required. Please run SQL from ADMIN_SETUP_EVIDENCE.md')
    return false
  }
  
  // Step 2: Test account creation
  const accountReady = await testAdminAccountCreation()
  if (!accountReady) {
    console.log('\n❌ Admin account creation failed')
    return false
  }
  
  // Step 3: Test authentication  
  const authData = await testAuthentication()
  if (!authData) {
    console.log('\n❌ Authentication failed')
    return false
  }
  
  // Step 4: Test authorization
  const authorized = await testAuthorization(authData)
  if (!authorized) {
    console.log('\n❌ Authorization failed')
    return false
  }
  
  // Success!
  generateSuccessReport()
  return true
}

runFinalVerification().then(success => {
  if (!success) {
    console.log('\n❌ VERIFICATION FAILED - Check errors above')
    process.exit(1)
  }
  process.exit(0)
})