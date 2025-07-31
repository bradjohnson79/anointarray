#!/usr/bin/env node

/**
 * Test script to diagnose and create admin account via Edge Function
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
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY

async function testAdminCreation() {
  console.log('🔮 ANOINT Array - Admin Account Test')
  console.log('=====================================')

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  console.log('✅ Environment variables loaded')
  console.log(`   URL: ${SUPABASE_URL}`)
  console.log(`   Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...`)

  // Initialize client with anon key
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

  try {
    console.log('\n📡 Testing Edge Function approach...')
    
    const response = await fetch(`${SUPABASE_URL}/functions/v1/create-admin-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        email: 'info@anoint.me',
        password: 'Admin123',
        firstName: 'ANOINT',
        lastName: 'Administrator'
      })
    })

    const result = await response.json()
    
    if (response.ok && result.success) {
      console.log('✅ Admin user created successfully via Edge Function!')
      console.log(`   User ID: ${result.userId}`)
      console.log(`   Email: ${result.email}`)
      console.log('')
      console.log('🎯 Login Credentials:')
      console.log('   Email: info@anoint.me')
      console.log('   Password: Admin123')
    } else {
      console.error('❌ Edge Function error:', result.error || 'Unknown error')
      console.log('Full response:', result)
    }

  } catch (error) {
    console.error('❌ Connection error:', error.message)
    console.log('\n💡 Possible issues:')
    console.log('   1. Edge Function may not be deployed')
    console.log('   2. Supabase project may need to be activated')
    console.log('   3. Network connectivity issues')
  }

  console.log('\n📊 Testing database connection...')
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('❌ Database connection error:', error.message)
    } else {
      console.log('✅ Database connection successful')
    }
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  }
}

// Run the test
testAdminCreation()