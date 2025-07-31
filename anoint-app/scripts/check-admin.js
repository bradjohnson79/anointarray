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

async function checkAdminStatus() {
  console.log('🔍 Checking Admin User Status...')
  console.log('===============================')
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Get all users
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Could not fetch users:', usersError.message)
      return
    }

    console.log(`📊 Found ${users.users?.length || 0} auth users`)

    // Check user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*')

    if (profilesError) {
      console.error('❌ Could not fetch user profiles:', profilesError.message)
      return
    }

    console.log(`📊 Found ${profiles?.length || 0} user profiles`)

    if (users.users && users.users.length > 0) {
      for (const user of users.users) {
        console.log(`\n👤 User: ${user.email}`)
        console.log(`   ID: ${user.id}`)
        console.log(`   Created: ${user.created_at}`)
        console.log(`   Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)

        // Check if profile exists
        const profile = profiles?.find(p => p.user_id === user.id)
        if (profile) {
          console.log(`   ✅ Profile exists`)
          console.log(`   Role: ${profile.role}`)
          console.log(`   Active: ${profile.is_active}`)
          console.log(`   Verified: ${profile.is_verified}`)
        } else {
          console.log(`   ❌ No profile found`)
        }
      }
    }

    // Check for admin users specifically
    const { data: adminProfiles, error: adminError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('role', 'admin')

    if (adminError) {
      console.error('❌ Could not fetch admin profiles:', adminError.message)
    } else {
      console.log(`\n🛡️  Admin users: ${adminProfiles?.length || 0}`)
      adminProfiles?.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.role})`)
      })
    }

    // Check for info@anoint.me specifically
    const { data: targetUser } = await supabase.auth.admin.listUsers()
    const infoUser = targetUser.users?.find(u => u.email === 'info@anoint.me')
    
    if (!infoUser) {
      console.log(`\n⚠️  Target admin user 'info@anoint.me' does not exist`)
      console.log(`   You can create it now or use existing user as admin`)
    } else {
      console.log(`\n✅ Target admin user 'info@anoint.me' exists`)
    }

  } catch (error) {
    console.error('❌ Admin check failed:', error.message)
  }
}

checkAdminStatus()