#!/usr/bin/env node

// Admin account creation script
// Run with: node scripts/create-admin-account.js

import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  console.error('   Get it from: https://supabase.com/dashboard/project/xmnghciitiefbwxzhgrw/settings/api')
  process.exit(1)
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createAdminAccount() {
  const email = 'info@anoint.me'
  const password = 'Admin123'
  
  console.log('🚀 Creating admin account...')
  console.log(`📧 Email: ${email}`)
  
  try {
    // Create the user account
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true // Auto-confirm email
    })
    
    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️ User already exists, updating profile...')
        
        // Get existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = users.find(u => u.email === email)
        if (!existingUser) throw new Error('User not found after registration check')
        
        // Update or create profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: existingUser.id,
            email: email,
            role: 'admin',
            is_active: true,
            is_verified: true,
            updated_at: new Date().toISOString()
          })
        
        if (profileError) throw profileError
        
        console.log('✅ Admin profile updated successfully!')
        return
      } else {
        throw authError
      }
    }
    
    console.log('✅ User account created successfully!')
    console.log(`👤 User ID: ${authData.user.id}`)
    
    // Create user profile with admin role
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: authData.user.id,
        email: email,
        role: 'admin',
        is_active: true,
        is_verified: true
      })
    
    if (profileError) {
      console.error('❌ Error creating user profile:', profileError)
      throw profileError
    }
    
    console.log('✅ Admin profile created successfully!')
    console.log('')
    console.log('🎉 Admin account setup complete!')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👑 Role: admin`)
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error.message)
    process.exit(1)
  }
}

// Run the script
createAdminAccount()