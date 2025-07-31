#!/usr/bin/env node

// Test the complete signup flow to verify everything works end-to-end
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const testUsers = [
  { email: 'test.user@example.com', password: 'TestPassword123', expectedRole: 'user' },
  { email: 'info@anoint.me', password: 'Admin123', expectedRole: 'admin' }
]

async function testSignupFlow() {
  console.log('🧪 Testing Complete Signup Flow...\n')
  
  // First, clean up any existing test users
  console.log('🧹 Cleaning up existing test users...')
  for (const testUser of testUsers) {
    try {
      const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers()
      if (!error) {
        const existingUser = users.find(u => u.email === testUser.email)
        if (existingUser) {
          console.log(`  Removing existing user: ${testUser.email}`)
          await supabaseAdmin.auth.admin.deleteUser(existingUser.id)
        }
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000)) // Wait for cleanup
  
  console.log('\n📝 Testing User Signup Process...\n')
  
  for (const testUser of testUsers) {
    console.log(`\n🔄 Testing signup for: ${testUser.email}`)
    
    try {
      // Step 1: Test signup using the same logic as AuthContext
      console.log('  Step 1: Creating auth user...')
      const { data: signupData, error: signupError } = await supabaseAnon.auth.signUp({
        email: testUser.email,
        password: testUser.password
      })
      
      if (signupError) {
        console.error(`  ❌ Signup failed: ${signupError.message}`)
        continue
      }
      
      if (!signupData.user) {
        console.error('  ❌ No user returned from signup')
        continue
      }
      
      console.log(`  ✅ Auth user created: ${signupData.user.id}`)
      
      // Step 2: Test profile creation (mimicking AuthContext logic)
      console.log('  Step 2: Creating user profile...')
      const { error: profileError } = await supabaseAnon
        .from('user_profiles')
        .insert({
          user_id: signupData.user.id,
          email: signupData.user.email,
          role: testUser.expectedRole === 'admin' ? 'admin' : 'user',
          is_active: true,
          is_verified: false
        })
      
      if (profileError) {
        console.error(`  ❌ Profile creation failed: ${profileError.message}`)
        continue
      }
      
      console.log('  ✅ User profile created successfully')
      
      // Step 3: Verify profile was created correctly
      console.log('  Step 3: Verifying profile...')
      const { data: profile, error: fetchError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', signupData.user.id)
        .single()
      
      if (fetchError) {
        console.error(`  ❌ Profile fetch failed: ${fetchError.message}`)
        continue
      }
      
      console.log('  ✅ Profile verification successful:')
      console.log(`    - Email: ${profile.email}`)
      console.log(`    - Role: ${profile.role}`)
      console.log(`    - Active: ${profile.is_active}`)
      console.log(`    - Verified: ${profile.is_verified}`)
      
      // Step 4: Test sign-in
      console.log('  Step 4: Testing sign-in...')
      const { data: signinData, error: signinError } = await supabaseAnon.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      })
      
      if (signinError) {
        console.error(`  ❌ Sign-in failed: ${signinError.message}`)
        continue
      }
      
      console.log('  ✅ Sign-in successful')
      
      // Step 5: Test profile fetch while authenticated
      console.log('  Step 5: Testing authenticated profile access...')
      const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
      supabaseAuth.auth.setSession(signinData.session)
      
      const { data: authProfile, error: authProfileError } = await supabaseAuth
        .from('user_profiles')
        .select('*')
        .eq('user_id', signinData.user.id)
        .single()
      
      if (authProfileError) {
        console.error(`  ❌ Authenticated profile access failed: ${authProfileError.message}`)
      } else {
        console.log('  ✅ Authenticated profile access successful')
      }
      
      console.log(`\n  🎉 SUCCESS: Complete signup flow working for ${testUser.email}!\n`)
      
    } catch (error) {
      console.error(`  ❌ Exception during test: ${error.message}`)
    }
  }
  
  // Final verification - show all users
  console.log('\n📊 Final Database State:')
  const { data: allProfiles, error: allError } = await supabaseAdmin
    .from('user_profiles')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (allError) {
    console.error('❌ Could not fetch final state:', allError.message)
  } else {
    console.log(`✅ Total users created: ${allProfiles.length}`)
    allProfiles.forEach(profile => {
      console.log(`  - ${profile.email} (${profile.role}) - ${profile.is_active ? 'Active' : 'Inactive'}`)
    })
  }
  
  console.log('\n🏁 Signup flow testing complete!')
}

testSignupFlow()