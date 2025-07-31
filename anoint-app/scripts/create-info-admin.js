#!/usr/bin/env node

// Create info@anoint.me admin account
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createInfoAdmin() {
  const email = 'info@anoint.me'
  const password = 'Admin123'
  
  console.log('🚀 Creating info@anoint.me admin account...')
  
  try {
    // Create user with admin privileges using service role
    const { data: createData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Skip email verification
      user_metadata: {
        role: 'admin'
      }
    })
    
    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log('⚠️ User already exists, getting existing user...')
        
        // Get the existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = users.find(u => u.email === email)
        if (!existingUser) throw new Error('User not found')
        
        console.log(`✅ Found existing user: ${existingUser.id}`)
        
        // Create/update profile
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: existingUser.id,
            email: email,
            role: 'admin',
            is_active: true,
            is_verified: true,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          })
        
        if (profileError) throw profileError
        console.log('✅ Admin profile updated!')
        
      } else {
        throw createError
      }
    } else {
      console.log(`✅ User created: ${createData.user.id}`)
      
      // Create profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: createData.user.id,
          email: email,
          role: 'admin',
          is_active: true,
          is_verified: true
        })
      
      if (profileError) {
        // Try upsert instead
        const { error: upsertError } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: createData.user.id,
            email: email,
            role: 'admin',
            is_active: true,
            is_verified: true
          }, {
            onConflict: 'user_id'
          })
        
        if (upsertError) throw upsertError
      }
      
      console.log('✅ Admin profile created!')
    }
    
    console.log('')
    console.log('🎉 SUCCESS! Admin account ready:')
    console.log(`📧 Email: ${email}`)
    console.log(`🔑 Password: ${password}`)
    console.log(`👑 Role: admin`)
    console.log('')
    console.log('✅ You can now login at: https://anointarray.com/auth')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error('Full error:', error)
  }
}

createInfoAdmin()