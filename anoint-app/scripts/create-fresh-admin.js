#!/usr/bin/env node

/**
 * ANOINT Array - Fresh Admin Account Creation Script
 * 
 * This script creates a completely fresh admin account, handling any existing users.
 * It can optionally remove existing admin accounts and create new ones.
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readdir } from 'fs/promises'

// Load environment variables from root .env file
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Try to load from multiple locations
const envPaths = [
  resolve(__dirname, '../.env.local'),
  resolve(__dirname, '../../.env'),
  resolve(__dirname, '../.env')
]

for (const envPath of envPaths) {
  try {
    dotenv.config({ path: envPath })
    console.log(`✅ Loaded environment from: ${envPath}`)
    break
  } catch (error) {
    console.log(`⚠️  Could not load ${envPath}`)
  }
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Admin credentials - exactly as requested
const ADMIN_EMAIL = 'info@anoint.me'
const ADMIN_PASSWORD = 'Admin123'
const ADMIN_FIRST_NAME = 'ANOINT'
const ADMIN_LAST_NAME = 'Administrator'

async function createFreshAdminAccount() {
  console.log('🔮 ANOINT Array - Fresh Admin Account Creation')
  console.log('==============================================')
  console.log(`📧 Target Admin Email: ${ADMIN_EMAIL}`)
  console.log(`🔑 Target Admin Password: ${ADMIN_PASSWORD}`)
  console.log('')

  // Validate environment variables
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: Missing required environment variables')
    console.error('   VITE_SUPABASE_URL:', SUPABASE_URL ? '✅ Found' : '❌ Missing')
    console.error('   SUPABASE_SERVICE_ROLE_KEY:', SUPABASE_SERVICE_ROLE_KEY ? '✅ Found' : '❌ Missing')
    console.error('')
    console.error('💡 Please ensure these are set in your .env file')
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
    console.log('🔍 Step 1: Checking existing users...')

    // List all users to find any existing admin accounts
    const { data: existingUsers, error: listError } = await supabase.auth.admin.listUsers()
    
    if (listError) {
      throw new Error(`Failed to list users: ${listError.message}`)
    }

    console.log(`   Found ${existingUsers.users?.length || 0} existing users`)

    // Find existing admin account
    const existingAdmin = existingUsers.users?.find(user => user.email === ADMIN_EMAIL)
    
    if (existingAdmin) {
      console.log('⚠️  Existing admin account found!')
      console.log(`   User ID: ${existingAdmin.id}`)
      console.log(`   Email: ${existingAdmin.email}`)
      console.log(`   Created: ${existingAdmin.created_at}`)
      
      console.log('')
      console.log('🗑️  Step 2: Removing existing admin account...')
      
      // Remove from user_profiles first
      const { error: profileDeleteError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('user_id', existingAdmin.id)
      
      if (profileDeleteError) {
        console.warn(`   ⚠️  Could not delete profile: ${profileDeleteError.message}`)
      } else {
        console.log('   ✅ Existing admin profile deleted')
      }
      
      // Delete the user account
      const { error: deleteError } = await supabase.auth.admin.deleteUser(existingAdmin.id)
      
      if (deleteError) {
        throw new Error(`Failed to delete existing admin: ${deleteError.message}`)
      }
      
      console.log('   ✅ Existing admin account deleted')
      
      // Wait a moment for cleanup
      await new Promise(resolve => setTimeout(resolve, 2000))
    } else {
      console.log('   ✅ No existing admin account found')
    }

    console.log('')
    console.log('🔨 Step 3: Creating fresh admin account...')

    // Create the new admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: ADMIN_FIRST_NAME,
        last_name: ADMIN_LAST_NAME,
        display_name: `${ADMIN_FIRST_NAME} ${ADMIN_LAST_NAME}`,
        role: 'admin',
        created_by: 'admin-setup-script'
      }
    })

    if (createError) {
      throw new Error(`Failed to create admin user: ${createError.message}`)
    }

    if (!newUser.user) {
      throw new Error('User creation failed - no user returned')
    }

    console.log('   ✅ Fresh admin user created!')
    console.log(`   User ID: ${newUser.user.id}`)
    console.log(`   Email: ${newUser.user.email}`)

    console.log('')
    console.log('👤 Step 4: Setting up admin profile...')
    
    // Wait for any database triggers to complete
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Create/update the admin profile
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
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }], { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })

    if (profileError) {
      console.warn(`   ⚠️  Profile creation warning: ${profileError.message}`)
      console.log('   💡 The profile may be created by database triggers')
    } else {
      console.log('   ✅ Admin profile created successfully')
    }

    console.log('')
    console.log('🔍 Step 5: Verifying admin setup...')
    
    // Verify the profile was created
    const { data: profile, error: fetchError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', newUser.user.id)
      .single()
    
    if (fetchError) {
      console.warn(`   ⚠️  Could not fetch profile: ${fetchError.message}`)
    } else {
      console.log('   ✅ Profile verification successful')
      console.log(`   Role: ${profile.role}`)
      console.log(`   Active: ${profile.is_active}`)
      console.log(`   Verified: ${profile.is_verified}`)
    }

    console.log('')
    console.log('🎉 SUCCESS: Fresh Admin Account Created!')
    console.log('==========================================')
    console.log('')
    console.log('🎯 Login Credentials:')
    console.log(`   Email: ${ADMIN_EMAIL}`)
    console.log(`   Password: ${ADMIN_PASSWORD}`)
    console.log('')
    console.log('🚀 Login URLs:')
    console.log('   Development: http://localhost:5173/auth')
    console.log('   Production:  https://anointarray.com/auth')
    console.log('')
    console.log('⚡ Next Steps:')
    console.log('   1. Test login with the credentials above')
    console.log('   2. Verify admin dashboard access')
    console.log('   3. Consider changing password after first login')
    console.log('')

  } catch (error) {
    console.error('')
    console.error('❌ ERROR: Admin account creation failed')
    console.error('==========================================')
    console.error(`   ${error.message}`)
    console.error('')
    console.error('🔧 Troubleshooting Steps:')
    console.error('   1. Verify Supabase project is active')
    console.error('   2. Check service role key permissions')
    console.error('   3. Ensure database migrations are applied')
    console.error('   4. Review Supabase Auth settings')
    console.error('   5. Check Supabase logs for detailed errors')
    console.error('')
    process.exit(1)
  }
}

// Execute the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createFreshAdminAccount()
}

export default createFreshAdminAccount