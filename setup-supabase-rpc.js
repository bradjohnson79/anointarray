#!/usr/bin/env node

// Setup script to create the execute_sql RPC function in Supabase
// This enables the MCP server to execute arbitrary SQL

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { readFileSync } from 'fs';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  console.error('Available URL:', supabaseUrl ? 'FOUND' : 'MISSING');
  console.error('Available Service Key:', supabaseServiceKey ? 'FOUND' : 'MISSING');
  process.exit(1);
}

console.log('🔧 Setting up Supabase RPC function...');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Read the SQL file
const sqlContent = readFileSync('./create-execute-sql-rpc.sql', 'utf8');

async function setupRPC() {
  try {
    console.log('📊 Creating execute_sql RPC function...');
    
    // Try to execute the SQL via a simple query
    // Note: This might not work for complex DDL, but let's try
    const { data, error } = await supabase.rpc('query', {
      query: sqlContent
    });

    if (error) {
      console.error('❌ RPC creation via supabase.rpc failed:', error.message);
      
      // Try alternative approach: use fetch directly to Supabase Edge Functions
      console.log('🔄 Trying direct SQL execution...');
      
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql: sqlContent })
      });

      if (!response.ok) {
        console.error('❌ Direct SQL execution failed:', response.statusText);
        console.log('\n📋 MANUAL SETUP REQUIRED:');
        console.log('Please execute the following SQL in your Supabase Dashboard > SQL Editor:');
        console.log('\n' + sqlContent);
        return false;
      }
      
      const result = await response.json();
      console.log('✅ RPC function created via direct execution');
      console.log('Result:', result);
    } else {
      console.log('✅ RPC function created successfully');
      console.log('Data:', data);
    }

    // Test the RPC function
    console.log('🧪 Testing execute_sql RPC function...');
    const { data: testData, error: testError } = await supabase.rpc('execute_sql', {
      sql_query: 'SELECT current_timestamp as test_timestamp'
    });

    if (testError) {
      console.error('❌ RPC test failed:', testError.message);
      return false;
    }

    console.log('✅ RPC function is working!');
    console.log('Test result:', testData);
    return true;

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    return false;
  }
}

// Run the setup
setupRPC().then(success => {
  if (success) {
    console.log('\n🎉 Supabase MCP Server is ready to use!');
    console.log('The execute_sql RPC function has been created and tested.');
  } else {
    console.log('\n⚠️ Manual setup required - see instructions above.');
  }
});