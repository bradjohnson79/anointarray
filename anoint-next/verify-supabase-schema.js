#!/usr/bin/env node

/**
 * ANOINT Array - Supabase Schema Verification & Setup
 * This script verifies the database schema is properly configured for the clean rebuild
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role (for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🚀 ANOINT Array - Database Schema Verification');
console.log('============================================');

async function checkConnection() {
  console.log('\n📡 Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('user_profiles').select('count', { count: 'exact', head: true });
    if (error && error.code === '42P01') {
      console.log('⚠️  user_profiles table does not exist - will need to create it');
      return false;
    } else if (error) {
      throw error;
    }
    console.log('✅ Successfully connected to Supabase');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function checkTableStructure() {
  console.log('\n🏗️  Checking user_profiles table structure...');
  try {
    // Try to query the table structure
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'user_profiles' });
    
    if (error && error.code === '42883') {
      // Function doesn't exist, let's check differently
      const { data: testData, error: testError } = await supabase
        .from('user_profiles')
        .select('id, email, role, display_name, email_verified, created_at, updated_at')
        .limit(1);
      
      if (testError && testError.code === '42P01') {
        console.log('❌ user_profiles table does not exist');
        return false;
      } else if (testError && testError.code === '42703') {
        console.log('⚠️  user_profiles table exists but missing some columns');
        return false;
      } else if (testError) {
        throw testError;
      } else {
        console.log('✅ user_profiles table structure looks correct');
        return true;
      }
    }
  } catch (error) {
    console.error('❌ Error checking table structure:', error.message);
    return false;
  }
}

async function checkRLSPolicies() {
  console.log('\n🛡️  Checking Row Level Security policies...');
  try {
    // Check if RLS is enabled
    const { data: rlsData, error: rlsError } = await supabase.rpc('check_rls_enabled', { table_name: 'user_profiles' });
    
    if (rlsError && rlsError.code === '42883') {
      console.log('⚠️  Cannot check RLS status (function not available)');
      return false;
    }
    
    if (rlsError) {
      throw rlsError;
    }
    
    console.log('✅ RLS policies check completed');
    return true;
  } catch (error) {
    console.log('⚠️  Could not verify RLS policies:', error.message);
    return false;
  }
}

async function checkAdminUsers() {
  console.log('\n👑 Checking admin users...');
  try {
    const { data: adminUsers, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name')
      .eq('role', 'admin');

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users:`);
    adminUsers?.forEach(user => {
      console.log(`   - ${user.email} (${user.display_name || 'No display name'})`);
    });

    return adminUsers?.length > 0;
  } catch (error) {
    console.error('❌ Error checking admin users:', error.message);
    return false;
  }
}

async function createProfilesView() {
  console.log('\n🔗 Creating profiles compatibility view...');
  try {
    // Create the profiles view to maintain compatibility
    const { error } = await supabase.rpc('create_profiles_view');
    
    if (error && error.code === '42883') {
      console.log('⚠️  create_profiles_view function not available');
      console.log('   📝 Manual step needed: Create the profiles view in Supabase SQL Editor');
      console.log('   Run: CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.user_profiles;');
      return false;
    }
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Profiles compatibility view created');
    return true;
  } catch (error) {
    console.log('⚠️  Could not create profiles view:', error.message);
    return false;
  }
}

async function testAuthFlow() {
  console.log('\n🔐 Testing authentication flow...');
  try {
    // Test with a dummy query that would be used by the auth store
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, email_verified, created_at')
      .limit(1);

    if (error) {
      throw error;
    }

    console.log('✅ Authentication query structure is compatible');
    return true;
  } catch (error) {
    console.error('❌ Auth flow test failed:', error.message);
    return false;
  }
}

async function runDiagnostics() {
  console.log('\n🔍 Running comprehensive diagnostics...\n');
  
  const results = {
    connection: await checkConnection(),
    tableStructure: false,
    rlsPolicies: false,
    adminUsers: false,
    profilesView: false,
    authFlow: false
  };

  if (results.connection) {
    results.tableStructure = await checkTableStructure();
    if (results.tableStructure) {
      results.rlsPolicies = await checkRLSPolicies();
      results.adminUsers = await checkAdminUsers();
      results.profilesView = await createProfilesView();
      results.authFlow = await testAuthFlow();
    }
  }

  return results;
}

async function showRecommendations(results) {
  console.log('\n📋 SUMMARY AND RECOMMENDATIONS');
  console.log('================================');

  if (!results.connection) {
    console.log('❌ CRITICAL: Cannot connect to Supabase database');
    console.log('   → Check your NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local');
    return;
  }

  if (!results.tableStructure) {
    console.log('❌ CRITICAL: user_profiles table missing or incomplete');
    console.log('   → Run the SQL schema from: supabase-schema-reset.sql');
    console.log('   → Execute in Supabase Dashboard → SQL Editor');
  }

  if (!results.adminUsers) {
    console.log('⚠️  WARNING: No admin users found');
    console.log('   → Admin users should be created during schema setup');
  }

  if (!results.profilesView) {
    console.log('⚠️  WARNING: Profiles compatibility view needs manual creation');
    console.log('   → Run in Supabase SQL Editor:');
    console.log('     CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.user_profiles;');
  }

  if (!results.rlsPolicies) {
    console.log('⚠️  WARNING: Could not verify RLS policies');
    console.log('   → Ensure RLS policies are set up correctly');
  }

  if (!results.authFlow) {
    console.log('❌ CRITICAL: Auth flow compatibility test failed');
    console.log('   → The clean auth store may not work with current schema');
  }

  // Overall status
  const criticalIssues = [results.connection, results.tableStructure, results.authFlow].filter(r => !r).length;
  const warnings = [results.adminUsers, results.profilesView, results.rlsPolicies].filter(r => !r).length;

  console.log(`\n📊 OVERALL STATUS:`);
  if (criticalIssues === 0 && warnings === 0) {
    console.log('✅ Database schema is fully configured and ready!');
  } else if (criticalIssues === 0) {
    console.log(`⚠️  Database is functional but has ${warnings} warnings`);
  } else {
    console.log(`❌ Database has ${criticalIssues} critical issues and ${warnings} warnings`);
  }
}

async function main() {
  try {
    const results = await runDiagnostics();
    await showRecommendations(results);
    
    console.log('\n🏁 Schema verification completed');
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { runDiagnostics, showRecommendations };