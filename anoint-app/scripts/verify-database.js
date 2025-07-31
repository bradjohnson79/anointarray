#!/usr/bin/env node

// Database verification script
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

async function verifyDatabase() {
  console.log('🔍 Verifying database setup...\n')
  
  try {
    // Check table structure
    console.log('📋 Checking user_profiles table structure...')
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (tableError) {
      console.error('❌ Table access error:', tableError.message)
      return
    }
    console.log('✅ Table accessible')
    
    // Check existing users
    console.log('\n👥 Checking existing users...')
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (usersError) {
      console.error('❌ Users query error:', usersError.message)
    } else {
      console.log(`✅ Found ${users.length} users:`)
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.role}) - ${user.is_active ? 'Active' : 'Inactive'}`)
      })
    }
    
    // Check auth users
    console.log('\n🔐 Checking auth users...')
    const { data: { users: authUsers }, error: authError } = await supabaseAdmin.auth.admin.listUsers()
    
    if (authError) {
      console.error('❌ Auth users error:', authError.message)
    } else {
      console.log(`✅ Found ${authUsers.length} auth users:`)
      authUsers.forEach(user => {
        console.log(`  - ${user.email} (Created: ${new Date(user.created_at).toLocaleDateString()})`)
      })
    }
    
    // Test RLS policies with anon client
    console.log('\n🔒 Testing RLS policies...')
    const { data: anonData, error: anonError } = await supabaseAnon
      .from('user_profiles')
      .select('*')
    
    if (anonError) {
      console.log('✅ RLS blocking anonymous access (expected):', anonError.message)
    } else {
      console.log('⚠️ Anonymous access allowed:', anonData.length, 'profiles visible')
    }
    
    console.log('\n🎉 Database verification complete!')
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message)
  }
}

verifyDatabase()