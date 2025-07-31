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

async function checkDatabase() {
  console.log('🔍 Checking Supabase Database Connection...')
  console.log('==========================================')
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  console.log(`🔗 Connecting to: ${SUPABASE_URL}`)
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Test basic connection
    console.log('⏳ Testing database connection...')
    const { data, error } = await supabase
      .from('auth.users')
      .select('count', { count: 'exact', head: true })

    if (error) {
      console.error('❌ Connection failed:', error.message)
      return
    }

    console.log('✅ Database connection successful!')
    console.log(`📊 Total users: ${data?.length || 0}`)

    // Check if our tables exist
    console.log('\n🔍 Checking for required tables...')
    
    const tables = ['user_profiles', 'orders', 'vip_waitlist', 'contact_submissions']
    
    for (const tableName of tables) {
      try {
        const { error: tableError } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        if (tableError) {
          console.log(`❌ Table '${tableName}' does not exist`)
        } else {
          console.log(`✅ Table '${tableName}' exists`)
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}' does not exist`)
      }
    }

    // Check for existing users
    console.log('\n👥 Checking existing users...')
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers()
    
    if (usersError) {
      console.error('❌ Could not fetch users:', usersError.message)
    } else {
      console.log(`📊 Total auth users: ${users.users?.length || 0}`)
      if (users.users && users.users.length > 0) {
        console.log('Users:')
        users.users.forEach(user => {
          console.log(`  - ${user.email} (${user.id})`)
        })
      }
    }

  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkDatabase()