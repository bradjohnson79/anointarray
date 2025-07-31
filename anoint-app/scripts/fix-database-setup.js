#!/usr/bin/env node

// Fix database setup by creating table and policies via API
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

async function setupDatabase() {
  console.log('🔧 Setting up database...\n')
  
  try {
    // Create the table with proper structure
    console.log('📋 Creating user_profiles table...')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- Create user_profiles table if it doesn't exist
        CREATE TABLE IF NOT EXISTS user_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          email TEXT NOT NULL,
          first_name TEXT,
          last_name TEXT,
          display_name TEXT,
          role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'vip')),
          is_active BOOLEAN DEFAULT true,
          is_verified BOOLEAN DEFAULT false,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id)
        );
      `
    })
    
    if (error) {
      console.error('❌ Table creation error:', error)
    } else {
      console.log('✅ Table created successfully')
    }
    
    // Enable RLS
    console.log('🔒 Enabling RLS...')
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;'
    })
    
    if (rlsError) {
      console.error('❌ RLS enable error:', rlsError)
    } else {
      console.log('✅ RLS enabled')
    }
    
    // Create simple policies that won't cause recursion
    console.log('📜 Creating RLS policies...')
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing policies
        DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON user_profiles;
        DROP POLICY IF EXISTS "Enable read access for own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Enable update for own profile" ON user_profiles;
        DROP POLICY IF EXISTS "Service role access" ON user_profiles;
        
        -- Allow authenticated users to insert their own profile
        CREATE POLICY "Enable insert for authenticated users only" ON user_profiles
          FOR INSERT WITH CHECK (auth.uid() = user_id);
        
        -- Allow users to read their own profile
        CREATE POLICY "Enable read access for own profile" ON user_profiles
          FOR SELECT USING (auth.uid() = user_id);
        
        -- Allow users to update their own profile
        CREATE POLICY "Enable update for own profile" ON user_profiles
          FOR UPDATE USING (auth.uid() = user_id);
        
        -- Allow service role to do everything
        CREATE POLICY "Service role access" ON user_profiles
          FOR ALL USING (auth.role() = 'service_role');
      `
    })
    
    if (policyError) {
      console.error('❌ Policy creation error:', policyError)
    } else {
      console.log('✅ Policies created successfully')
    }
    
    console.log('\n🎉 Database setup complete!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error)
  }
}

setupDatabase()