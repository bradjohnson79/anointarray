#!/usr/bin/env node

/**
 * Admin User Seeding Script for ANOINT Array
 * 
 * This script creates a default admin user in the Supabase backend.
 * 
 * Usage:
 *   node scripts/seed-admin.js
 *   
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../anoint-app/.env.local') })

// Default admin credentials
const DEFAULT_ADMIN = {
  email: 'info@anoint.me',
  password: 'Admin123',
  full_name: 'ANOINT Admin'
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
}

function colorLog(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function createAdminUser() {
  try {
    colorLog('\n🚀 ANOINT Array Admin User Seeding Script', 'cyan')
    colorLog('=' .repeat(50), 'cyan')

    // Validate environment variables
    const supabaseUrl = process.env.SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      colorLog('❌ Error: Missing required environment variables', 'red')
      colorLog('Please ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local', 'yellow')
      process.exit(1)
    }

    colorLog(`📡 Connecting to Supabase: ${supabaseUrl}`, 'blue')

    // Create Supabase admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Check if admin user already exists
    colorLog(`🔍 Checking if admin user exists: ${DEFAULT_ADMIN.email}`, 'blue')
    
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('email, role, is_active, created_at')
      .eq('email', DEFAULT_ADMIN.email)
      .single()

    if (existingProfile) {
      colorLog(`⚠️  Admin user already exists:`, 'yellow')
      colorLog(`   Email: ${existingProfile.email}`, 'yellow')
      colorLog(`   Role: ${existingProfile.role}`, 'yellow')
      colorLog(`   Active: ${existingProfile.is_active}`, 'yellow')
      colorLog(`   Created: ${new Date(existingProfile.created_at).toLocaleString()}`, 'yellow')
      
      // Ask if user wants to continue anyway
      const readline = await import('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const answer = await new Promise(resolve => {
        rl.question('\nDo you want to recreate this user? (y/N): ', resolve)
      })
      rl.close()

      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        colorLog('🛑 Seeding cancelled by user', 'yellow')
        process.exit(0)
      }
    }

    colorLog(`👤 Creating admin user: ${DEFAULT_ADMIN.email}`, 'blue')

    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: DEFAULT_ADMIN.full_name,
        role: 'admin'
      }
    })

    if (authError) {
      if (authError.message.includes('already registered')) {
        colorLog('⚠️  User already exists in auth system, updating profile...', 'yellow')
        
        // Get existing user
        const { data: existingUser } = await supabase.auth.admin.listUsers()
        const user = existingUser.users.find(u => u.email === DEFAULT_ADMIN.email)
        
        if (user) {
          // Update user profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .upsert({
              user_id: user.id,
              email: DEFAULT_ADMIN.email,
              full_name: DEFAULT_ADMIN.full_name,
              role: 'admin',
              is_active: true,
              is_verified: true,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })

          if (updateError) {
            throw updateError
          }

          colorLog('✅ Admin user profile updated successfully!', 'green')
        }
      } else {
        throw authError
      }
    } else {
      colorLog('✅ Auth user created successfully', 'green')

      // Create/update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: authUser.user.id,
          email: DEFAULT_ADMIN.email,
          full_name: DEFAULT_ADMIN.full_name,
          role: 'admin',
          is_active: true,
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })

      if (profileError) {
        throw profileError
      }

      colorLog('✅ User profile created successfully', 'green')
    }

    // Verify the admin user was created properly
    const { data: adminProfile, error: verifyError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('email', DEFAULT_ADMIN.email)
      .single()

    if (verifyError || !adminProfile) {
      throw new Error('Failed to verify admin user creation')
    }

    // Display success message
    colorLog('\n🎉 Admin User Created Successfully!', 'green')
    colorLog('=' .repeat(40), 'green')
    colorLog(`📧 Email: ${adminProfile.email}`, 'green')
    colorLog(`👤 Name: ${adminProfile.full_name}`, 'green')
    colorLog(`🔑 Role: ${adminProfile.role}`, 'green')
    colorLog(`✅ Active: ${adminProfile.is_active}`, 'green')
    colorLog(`📅 Created: ${new Date(adminProfile.created_at).toLocaleString()}`, 'green')

    colorLog('\n🚪 Login Credentials:', 'magenta')
    colorLog(`   Email: ${DEFAULT_ADMIN.email}`, 'magenta')
    colorLog(`   Password: ${DEFAULT_ADMIN.password}`, 'magenta')

    colorLog('\n🌐 Access Admin Dashboard:', 'cyan')
    colorLog('   1. Go to http://localhost:5173/auth', 'cyan')
    colorLog('   2. Sign in with the credentials above', 'cyan')
    colorLog('   3. Navigate to /admin/users to manage users', 'cyan')
    colorLog('   4. Navigate to /admin/vip-subscribers to manage VIP list', 'cyan')

    colorLog('\n✨ Admin user seeding completed successfully!', 'bold')

  } catch (error) {
    colorLog('\n❌ Error creating admin user:', 'red')
    colorLog(error.message, 'red')
    
    if (error.details) {
      colorLog('Details:', 'red')
      colorLog(error.details, 'red')
    }
    
    colorLog('\n🔧 Troubleshooting:', 'yellow')
    colorLog('1. Ensure your Supabase project is running', 'yellow')
    colorLog('2. Check that environment variables are correctly set', 'yellow')
    colorLog('3. Verify database migrations have been applied', 'yellow')
    colorLog('4. Check Supabase logs for more details', 'yellow')
    
    process.exit(1)
  }
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  createAdminUser()
}