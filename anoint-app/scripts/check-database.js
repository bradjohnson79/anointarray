#!/usr/bin/env node

// Database structure check script
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

async function checkDatabase() {
  console.log('🔍 Checking database structure...')
  
  try {
    // Try to query the user_profiles table
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('❌ user_profiles table error:', error)
      console.log('\n📝 Creating user_profiles table...')
      
      // Create the table using raw SQL
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
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
          
          -- Enable RLS
          ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
          
          -- RLS policies
          CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = user_id);
          CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = user_id);
          CREATE POLICY "Service role can do anything" ON user_profiles FOR ALL USING (auth.role() = 'service_role');
        `
      })
      
      if (createError) {
        console.error('❌ Error creating table:', createError)
      } else {
        console.log('✅ user_profiles table created!')
      }
    } else {
      console.log('✅ user_profiles table exists')
      console.log(`📊 Found ${data?.length || 0} existing profiles`)
    }
    
  } catch (error) {
    console.error('❌ Database check failed:', error.message)
  }
}

checkDatabase()