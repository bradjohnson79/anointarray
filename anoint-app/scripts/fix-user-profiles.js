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

async function fixUserProfiles() {
  console.log('🔧 Fixing User Profiles Table...')
  console.log('==============================')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // First, let's check current table structure
    console.log('🔍 Checking current user_profiles structure...')
    
    const { data: currentProfiles, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)

    if (checkError) {
      console.log('❌ Error checking table:', checkError.message)
    }

    // Let's try to create the missing role column if it doesn't exist
    console.log('🔧 Adding missing columns to user_profiles...')

    // Since we can't run raw SQL directly, let's create a profile for the existing user
    // and see what happens
    const { data: users } = await supabase.auth.admin.listUsers()
    
    if (users.users && users.users.length > 0) {
      const user = users.users[0]
      console.log(`👤 Found existing user: ${user.email}`)
      
      // Try to create a user profile with all the fields we need
      const { data: newProfile, error: profileError } = await supabase
        .from('user_profiles')
        .upsert([{
          user_id: user.id,
          email: user.email,
          first_name: 'Admin',
          last_name: 'User',
          display_name: 'Admin User',
          role: 'admin',
          is_active: true,
          is_verified: true,
          email_verified_at: new Date().toISOString(),
        }], { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()

      if (profileError) {
        console.log('❌ Profile creation failed:', profileError.message)
        
        // If the role column doesn't exist, we need to run the migration manually
        console.log('\n⚠️  The user_profiles table structure is incomplete.')
        console.log('🔧 You need to run the migration manually in Supabase SQL Editor:')
        console.log('\n1. Go to your Supabase dashboard → SQL Editor')
        console.log('2. Copy and run the contents of: supabase/migrations/004_create_user_profiles.sql')
        console.log('3. Then run: npm run seed-admin')
        
        return
      } else {
        console.log('✅ Profile created successfully!')
        console.log(`👤 ${user.email} is now an admin user`)
        console.log('\n🎉 You can now login with:')
        console.log(`   Email: ${user.email}`)
        console.log(`   Password: [your existing password]`)
        console.log('\n🚀 Visit: http://localhost:5173/auth')
      }
    }

    // Also try to create the info@anoint.me admin user
    console.log('\n🔨 Creating info@anoint.me admin user...')
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'info@anoint.me',
      password: 'Admin123',
      email_confirm: true,
      user_metadata: {
        first_name: 'ANOINT',
        last_name: 'Admin',
        display_name: 'ANOINT Admin',
        role: 'admin'
      }
    })

    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('ℹ️  User info@anoint.me already exists')
      } else {
        console.log('❌ Could not create admin user:', createError.message)
      }
    } else {
      console.log('✅ Created info@anoint.me admin user')
      
      // Create profile for new user
      if (newUser.user) {
        const { error: newProfileError } = await supabase
          .from('user_profiles')
          .upsert([{
            user_id: newUser.user.id,
            email: newUser.user.email,
            first_name: 'ANOINT',
            last_name: 'Admin',
            display_name: 'ANOINT Admin',
            role: 'admin',
            is_active: true,
            is_verified: true,
            email_verified_at: new Date().toISOString(),
          }])

        if (!newProfileError) {
          console.log('✅ Created profile for info@anoint.me')
        }
      }
    }

  } catch (error) {
    console.error('❌ Fix failed:', error.message)
  }
}

fixUserProfiles()