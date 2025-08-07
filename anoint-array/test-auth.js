#!/usr/bin/env node

// Test script to verify Supabase configuration and authentication
const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

console.log('🔧 Environment Variable Check:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
console.log('SUPABASE_ADMIN_EMAIL:', process.env.SUPABASE_ADMIN_EMAIL)

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('❌ Missing required Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testSupabaseConnection() {
  try {
    console.log('\n📡 Testing Supabase connection...')
    
    // Test basic connection
    const { data, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Supabase connection error:', error.message)
      return false
    }
    
    console.log('✅ Supabase connection successful')
    
    // Check if profiles table exists
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1)
    
    if (profileError) {
      console.log('ℹ️  Profiles table check:', profileError.message)
    } else {
      console.log('✅ Profiles table accessible')
    }
    
    return true
  } catch (error) {
    console.error('❌ Connection test failed:', error.message)
    return false
  }
}

async function checkAdminUser() {
  console.log('\n👤 Checking for admin user...')
  const adminEmail = process.env.SUPABASE_ADMIN_EMAIL
  
  if (!adminEmail) {
    console.log('❌ SUPABASE_ADMIN_EMAIL not set')
    return
  }
  
  try {
    // Check if user exists in profiles table
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail.toLowerCase())
      .single()
    
    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('❌ Profile query error:', error.message)
      return
    }
    
    if (profile) {
      console.log('✅ Admin profile found:', {
        email: profile.email,
        display_name: profile.display_name,
        created_at: profile.created_at
      })
    } else {
      console.log('⚠️  Admin profile not found in profiles table')
      console.log('   This might be normal if the user hasn\'t logged in yet')
    }
    
    // Admin role is determined by the ADMIN_EMAILS array in auth.ts
    // It doesn't require a database entry, just the email match
    const adminEmails = ['info@anoint.me']
    const isAdminConfigured = adminEmails.includes(adminEmail.toLowerCase())
    
    console.log('🔧 Admin configuration check:')
    console.log('   Admin emails in code:', adminEmails)
    console.log('   Environment admin email:', adminEmail)
    console.log('   Is admin configured?', isAdminConfigured ? '✅ Yes' : '❌ No')
    
  } catch (error) {
    console.error('❌ Admin check failed:', error.message)
  }
}

async function main() {
  console.log('🧪 ANOINT Array Authentication Test\n')
  
  const connectionOk = await testSupabaseConnection()
  
  if (connectionOk) {
    await checkAdminUser()
    
    console.log('\n📝 Next Steps:')
    console.log('1. Try logging in to anointarray.com with info@anoint.me')
    console.log('2. Check browser console for debug messages')
    console.log('3. If login fails, check Supabase dashboard for user status')
    console.log('4. Admin role should be assigned automatically based on email')
  }
}

main().catch(console.error)