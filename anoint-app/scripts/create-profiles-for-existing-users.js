#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function createProfilesForExistingUsers() {
  console.log('🔧 Creating Profiles for Existing Users...')
  console.log('=========================================')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Get all auth users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Could not fetch users:', usersError.message)
      return
    }

    console.log(`📊 Found ${users.users?.length || 0} auth users`)

    // Get existing profiles
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id')

    if (profilesError) {
      console.error('❌ Could not fetch existing profiles:', profilesError.message)
      return
    }

    const existingProfileUserIds = new Set(existingProfiles?.map(p => p.user_id) || [])
    console.log(`📊 Found ${existingProfiles?.length || 0} existing profiles`)

    // Create profiles for users without them
    for (const user of users.users || []) {
      if (!existingProfileUserIds.has(user.id)) {
        console.log(`\n👤 Creating profile for: ${user.email}`)
        
        // Generate referral code
        const refCode = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase()
        
        const { error: createError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: user.id,
            email: user.email,
            display_name: user.email.split('@')[0],
            referral_code: refCode,
            email_verified_at: user.email_confirmed_at,
            created_at: user.created_at,
            // Make the first user (you) an admin
            role: user.email === 'bradjohnson79@gmail.com' ? 'admin' : 'user',
            is_active: true,
            is_verified: !!user.email_confirmed_at
          }])

        if (createError) {
          console.error(`❌ Failed to create profile for ${user.email}:`, createError.message)
        } else {
          console.log(`✅ Profile created successfully`)
          if (user.email === 'bradjohnson79@gmail.com') {
            console.log(`🛡️  Admin role assigned!`)
          }
        }
      } else {
        console.log(`✅ Profile already exists for: ${user.email}`)
      }
    }

    // Now create the info@anoint.me admin user
    console.log(`\n🔨 Creating info@anoint.me admin user...`)
    
    const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
      email: 'info@anoint.me',
      password: 'Admin123',
      email_confirm: true,
      user_metadata: {
        first_name: 'ANOINT',
        last_name: 'Admin',
        display_name: 'ANOINT Admin'
      }
    })

    if (createUserError) {
      if (createUserError.message.includes('already registered')) {
        console.log('ℹ️  User info@anoint.me already exists')
      } else {
        console.error('❌ Could not create admin user:', createUserError.message)
      }
    } else if (newUser.user) {
      console.log('✅ Created info@anoint.me admin user')
      
      // The trigger should create the profile automatically, but let's make sure
      await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
      
      // Check if profile was created by trigger
      const { data: newProfile, error: checkError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', newUser.user.id)
        .single()

      if (checkError || !newProfile) {
        // Create profile manually if trigger didn't work
        const refCode = 'REF' + Math.random().toString(36).substring(2, 10).toUpperCase()
        
        const { error: manualProfileError } = await supabase
          .from('user_profiles')
          .insert([{
            user_id: newUser.user.id,
            email: newUser.user.email,
            first_name: 'ANOINT',
            last_name: 'Admin',
            display_name: 'ANOINT Admin',
            referral_code: refCode,
            role: 'admin',
            is_active: true,
            is_verified: true,
            email_verified_at: new Date().toISOString()
          }])

        if (manualProfileError) {
          console.error('❌ Could not create profile manually:', manualProfileError.message)
        } else {
          console.log('✅ Created profile for info@anoint.me manually')
        }
      } else {
        // Update role to admin if profile exists but isn't admin
        if (newProfile.role !== 'admin') {
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ role: 'admin', is_active: true, is_verified: true })
            .eq('user_id', newUser.user.id)

          if (!updateError) {
            console.log('✅ Updated profile to admin role')
          }
        } else {
          console.log('✅ Profile created by trigger with admin role')
        }
      }
    }

    // Final verification
    console.log('\n🔍 Final verification...')
    const { data: finalCheck } = await supabase
      .from('user_profiles')
      .select('email, role, is_active')
      .eq('role', 'admin')

    console.log(`\n🛡️  Admin users (${finalCheck?.length || 0}):`)
    finalCheck?.forEach(admin => {
      console.log(`   - ${admin.email} (${admin.role}) - Active: ${admin.is_active}`)
    })

    console.log('\n🎉 Setup complete!')
    console.log('\n🎯 You can now login with either:')
    console.log('   1. bradjohnson79@gmail.com (your existing password)')
    console.log('   2. info@anoint.me / Admin123')
    console.log('\n🚀 Visit: http://localhost:5173/auth')

  } catch (error) {
    console.error('❌ Profile creation failed:', error.message)
  }
}

createProfilesForExistingUsers()