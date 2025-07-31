#!/usr/bin/env node

/**
 * ANOINT Array - Admin User Seeding Script
 * 
 * This script creates the default admin user for the ANOINT Array platform.
 * It uses the Supabase service role key to create the user and assign admin permissions.
 */

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

// Default admin credentials
const ADMIN_EMAIL = 'info@anoint.me'
const ADMIN_PASSWORD = 'Admin123'
const ADMIN_FIRST_NAME = 'ANOINT'
const ADMIN_LAST_NAME = 'Admin'

async function createAdminUser() {
  console.log('🔮 ANOINT Array - Admin User Seeding Script')
  console.log('==========================================')

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing required environment variables')
    console.error('   Please ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
    process.exit(1)
  }

  // Initialize Supabase client with service role
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    console.log('🔍 Checking for existing admin user...')

    // Check if admin user already exists
    const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers()
    
    if (userCheckError) {
      throw new Error(`Failed to check existing users: ${userCheckError.message}`)
    }

    const existingAdmin = existingUsers.users?.find(user => user.email === ADMIN_EMAIL)
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists')
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   User ID: ${existingAdmin.id}`)
      
      // Ensure admin profile exists and is properly configured
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert([{
          user_id: existingAdmin.id,
          email: existingAdmin.email,
          first_name: ADMIN_FIRST_NAME,
          last_name: ADMIN_LAST_NAME,
          display_name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
          role: 'admin',
          is_active: true,
          is_verified: true,
        }], { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })

      if (profileError) {
        console.warn('⚠️  Warning: Could not update admin profile:', profileError.message)
      } else {
        console.log('✅ Admin profile updated successfully')
      }

      console.log('\n🎯 Admin Login Credentials:')
      console.log(`   Email: ${ADMIN_EMAIL}`)
      console.log(`   Password: ${ADMIN_PASSWORD}`)
      console.log('\n🚀 You can now login at: http://localhost:5173/auth')
      return
    }

    console.log('🔨 Creating new admin user...')

    // Create admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        display_name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
        role: 'admin'
      }
    })

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned')
    }

    console.log('✅ Admin user created successfully')
    console.log(`   User ID: ${newUser.user.id}`)
    console.log(`   Email: ${newUser.user.email}`)

    // Wait a moment for the trigger to create the profile
    console.log('⏳ Setting up admin profile...')
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Ensure admin profile is created with correct role
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert([{
        user_id: newUser.user.id,
        email: newUser.user.email,
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        display_name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
        role: 'admin',
        is_active: true,
        is_verified: true,
        email_verified_at: new Date().toISOString(),
      }], { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })

    if (profileError) {
      console.warn('⚠️  Warning: Could not create admin profile:', profileError.message)
      console.log('   The profile may be created automatically by database triggers.')
    } else {
      console.log('✅ Admin profile created successfully')
    }

    console.log('\n🎉 Admin user setup complete!')
    console.log('\n🎯 Admin Login Credentials:')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log('\n⚠️  Important: Change the admin password after first login!')
    console.log('\n🚀 You can now login at: http://localhost:5173/auth')

  } catch (error) {
    console.error('❌ Error creating admin user:', error.message)
    console.error('\n🔧 Troubleshooting:')
    console.error('   1. Ensure your Supabase project is active')
    console.error('   2. Verify your service role key is correct')
    console.error('   3. Make sure database migrations have been run')
    console.error('   4. Check Supabase logs for more details')
    process.exit(1)
  }
}

// Run the script
createAdminUser()