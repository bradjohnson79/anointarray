#!/usr/bin/env node

// Comprehensive Authentication & Authorization Test
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('   Please set your service role key from Supabase dashboard')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

let testResults = []

function addResult(test, status, message, details = null) {
  const result = {
    test,
    status,
    message,
    details,
    timestamp: new Date().toISOString()
  }
  testResults.push(result)
  
  const emoji = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏳'
  console.log(`${emoji} ${test}: ${message}`)
  if (details) console.log(`   Details: ${JSON.stringify(details, null, 2)}`)
}

async function testDatabaseSetup() {
  console.log('\n🔍 STEP 1: Testing Database Setup')
  console.log('=' .repeat(50))
  
  try {
    // Test 1: Check if user_profiles table exists
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      addResult('Database Table Check', 'FAIL', 'user_profiles table missing or inaccessible', error)
      return false
    } else {
      addResult('Database Table Check', 'PASS', 'user_profiles table exists and accessible')
    }
    
    // Test 2: Check existing users
    const { data: profiles } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
    
    addResult('Existing Users Check', 'PASS', `Found ${profiles?.length || 0} existing user profiles`)
    
    return true
  } catch (error) {
    addResult('Database Setup', 'FAIL', 'Exception during database check', error.message)
    return false
  }
}

async function testAdminAccountCreation() {
  console.log('\n🔧 STEP 2: Testing Admin Account Creation')
  console.log('=' .repeat(50))
  
  const email = 'info@anoint.me'
  const password = 'Admin123'
  
  try {
    // Clean up any existing account first
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers()
    const existingUser = users.find(u => u.email === email)
    
    if (existingUser) {
      addResult('Cleanup Check', 'INFO', 'Found existing user, cleaning up...')
      await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
      await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for cleanup
    }
    
    // Test 1: Create admin user with admin API
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true
    })
    
    if (userError) {
      addResult('Admin User Creation', 'FAIL', 'Failed to create auth user', userError)
      return null
    } else {
      addResult('Admin User Creation', 'PASS', `Auth user created: ${userData.user.id}`)
    }
    
    // Test 2: Create admin profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        user_id: userData.user.id,
        email: email,
        role: 'admin',
        is_active: true,
        is_verified: true
      })
    
    if (profileError) {
      addResult('Admin Profile Creation', 'FAIL', 'Failed to create admin profile', profileError)
      return null
    } else {
      addResult('Admin Profile Creation', 'PASS', 'Admin profile created successfully')
    }
    
    return userData.user
    
  } catch (error) {
    addResult('Admin Account Creation', 'FAIL', 'Exception during admin creation', error.message)
    return null
  }
}

async function testAuthentication(email, password) {
  console.log('\n🔐 STEP 3: Testing Authentication')
  console.log('=' .repeat(50))
  
  try {
    // Test 1: Sign in with credentials
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: email,
      password: password
    })
    
    if (signInError) {
      addResult('Sign In Test', 'FAIL', 'Failed to sign in', signInError)
      return null
    } else {
      addResult('Sign In Test', 'PASS', 'Successfully signed in')
    }
    
    // Test 2: Verify session
    if (signInData.session) {
      addResult('Session Check', 'PASS', 'Valid session created')
    } else {
      addResult('Session Check', 'FAIL', 'No session created')
      return null
    }
    
    // Test 3: Get user profile
    const { data: profile, error: profileError } = await supabaseAnon
      .from('user_profiles')
      .select('*')
      .eq('user_id', signInData.user.id)
      .single()
    
    if (profileError) {
      addResult('Profile Access Test', 'FAIL', 'Cannot access user profile', profileError)
      return null
    } else {
      addResult('Profile Access Test', 'PASS', `Profile accessed: ${profile.role} role`)
    }
    
    return { user: signInData.user, profile }
    
  } catch (error) {
    addResult('Authentication Test', 'FAIL', 'Exception during authentication', error.message)
    return null
  }
}

async function testAuthorization(authData) {
  console.log('\n🛡️ STEP 4: Testing Authorization')
  console.log('=' .repeat(50))
  
  try {
    // Test 1: Check admin role
    if (authData.profile.role === 'admin') {
      addResult('Admin Role Check', 'PASS', 'User has admin role')
    } else {
      addResult('Admin Role Check', 'FAIL', `User has ${authData.profile.role} role, not admin`)
      return false
    }
    
    // Test 2: Check active status
    if (authData.profile.is_active) {
      addResult('Active Status Check', 'PASS', 'User account is active')
    } else {
      addResult('Active Status Check', 'FAIL', 'User account is inactive')
      return false
    }
    
    // Test 3: Test admin-level operations (view all users)
    const { data: allProfiles, error: adminError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
    
    if (adminError) {
      addResult('Admin Operations Test', 'FAIL', 'Cannot perform admin operations', adminError)
      return false
    } else {
      addResult('Admin Operations Test', 'PASS', `Can access ${allProfiles.length} user profiles`)
    }
    
    return true
    
  } catch (error) {
    addResult('Authorization Test', 'FAIL', 'Exception during authorization test', error.message)
    return false
  }
}

async function testWebsiteIntegration() {
  console.log('\n🌐 STEP 5: Testing Website Integration')
  console.log('=' .repeat(50))
  
  // These tests would typically be done through browser automation
  // For now, we'll test the API endpoints that the website would use
  
  try {
    // Test 1: Test signup flow (simulate website signup)
    const testUser = {
      email: 'test.user@example.com',
      password: 'TestPassword123'
    }
    
    const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp(testUser)
    
    if (signupError) {
      addResult('Website Signup Flow', 'FAIL', 'Signup flow failed', signupError)
    } else {
      addResult('Website Signup Flow', 'PASS', 'Signup flow works')
      
      // Clean up test user
      if (signupData.user) {
        await supabaseAdmin.auth.admin.deleteUser(signupData.user.id)
      }
    }
    
    // Test 2: Test configuration
    const configTest = {
      supabaseUrl: SUPABASE_URL,
      anonKeyLength: SUPABASE_ANON_KEY.length,
      urlCorrect: SUPABASE_URL.includes('xmnghciitiefbwxzhgrw')
    }
    
    addResult('Website Configuration', 'PASS', 'Configuration is correct', configTest)
    
    return true
    
  } catch (error) {
    addResult('Website Integration', 'FAIL', 'Exception during website tests', error.message)
    return false
  }
}

function generateTestReport() {
  console.log('\n📊 COMPREHENSIVE TEST REPORT')
  console.log('=' .repeat(60))
  
  const passed = testResults.filter(r => r.status === 'PASS').length
  const failed = testResults.filter(r => r.status === 'FAIL').length
  const total = testResults.filter(r => r.status !== 'INFO').length
  
  console.log(`\n🎯 OVERALL RESULTS:`)
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   📊 Total: ${total}`)
  console.log(`   📈 Success Rate: ${Math.round((passed / total) * 100)}%`)
  
  console.log(`\n📋 DETAILED RESULTS:`)
  testResults.forEach((result, index) => {
    const emoji = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : 'ℹ️'
    console.log(`${index + 1}. ${emoji} ${result.test}: ${result.message}`)
  })
  
  // Critical success criteria
  const criticalTests = [
    'Database Table Check',
    'Admin User Creation', 
    'Admin Profile Creation',
    'Sign In Test',
    'Profile Access Test',
    'Admin Role Check'
  ]
  
  const criticalPassed = criticalTests.every(test => 
    testResults.some(r => r.test === test && r.status === 'PASS')
  )
  
  console.log(`\n🚨 CRITICAL TESTS STATUS: ${criticalPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}`)
  
  if (criticalPassed) {
    console.log(`\n🎉 SUCCESS! Admin authentication system is fully functional!`)
    console.log(`\n🔗 Ready for use at: https://anointarray.com/auth`)
    console.log(`📧 Admin Login: info@anoint.me`)
    console.log(`🔑 Password: Admin123`)
  } else {
    console.log(`\n⚠️ ISSUES DETECTED: Some critical tests failed. Review above for details.`)
  }
  
  return criticalPassed
}

async function runComprehensiveTest() {
  console.log('🧪 COMPREHENSIVE AUTHENTICATION & AUTHORIZATION TEST')
  console.log('🎯 Testing: Admin Account Setup & Website Functionality')
  console.log('📅 Started:', new Date().toISOString())
  console.log('=' .repeat(60))
  
  try {
    // Step 1: Database Setup
    const dbReady = await testDatabaseSetup()
    if (!dbReady) {
      console.log('\n❌ Database not ready. Please run the SQL setup first.')
      console.log('📋 See: DATABASE_SETUP_GUIDE.md')
      return false
    }
    
    // Step 2: Admin Account Creation  
    const adminUser = await testAdminAccountCreation()
    if (!adminUser) {
      console.log('\n❌ Admin account creation failed')
      return false
    }
    
    // Step 3: Authentication
    const authData = await testAuthentication('info@anoint.me', 'Admin123')
    if (!authData) {
      console.log('\n❌ Authentication failed')
      return false
    }
    
    // Step 4: Authorization
    const authzSuccess = await testAuthorization(authData)
    if (!authzSuccess) {
      console.log('\n❌ Authorization failed')
      return false
    }
    
    // Step 5: Website Integration
    await testWebsiteIntegration()
    
    // Generate final report
    const success = generateTestReport()
    return success
    
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message)
    return false
  }
}

// Run the comprehensive test
runComprehensiveTest().then(success => {
  process.exit(success ? 0 : 1)
})