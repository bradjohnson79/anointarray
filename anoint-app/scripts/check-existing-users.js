#!/usr/bin/env node

// Check existing users and profiles
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkExistingUsers() {
  console.log('🔍 Checking existing users and profiles...')
  
  try {
    // Check auth users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()
    if (usersError) throw usersError
    
    console.log(`👥 Found ${users.length} auth users:`)
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`)
    })
    
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')
    
    if (profilesError) throw profilesError
    
    console.log(`\n📋 Found ${profiles.length} user profiles:`)
    profiles.forEach(profile => {
      console.log(`  - ${profile.email} (Role: ${profile.role}, Active: ${profile.is_active})`)
    })
    
    // Check if info@anoint.me exists
    const adminUser = users.find(u => u.email === 'info@anoint.me')
    const adminProfile = profiles.find(p => p.email === 'info@anoint.me')
    
    console.log('\n🎯 Admin account status:')
    console.log(`  Auth user exists: ${adminUser ? '✅ YES' : '❌ NO'}`)
    console.log(`  Profile exists: ${adminProfile ? '✅ YES' : '❌ NO'}`)
    
    if (adminUser && !adminProfile) {
      console.log('\n🔧 Creating missing admin profile...')
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: adminUser.id,
          email: adminUser.email,
          role: 'admin',
          is_active: true,
          is_verified: true
        })
      
      if (createError) {
        console.error('❌ Error creating profile:', createError)
      } else {
        console.log('✅ Admin profile created!')
      }
    }
    
    if (adminProfile && adminProfile.role !== 'admin') {
      console.log('\n🔧 Updating profile role to admin...')
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ role: 'admin' })
        .eq('email', 'info@anoint.me')
      
      if (updateError) {
        console.error('❌ Error updating role:', updateError)
      } else {
        console.log('✅ Profile role updated to admin!')
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

checkExistingUsers()