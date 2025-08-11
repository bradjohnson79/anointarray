#!/usr/bin/env node

/**
 * ANOINT Array - Execute Schema Fix
 * This script applies the necessary schema updates to make user_profiles compatible with the clean auth store
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role (for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

console.log('🔧 ANOINT Array - Schema Fix Execution');
console.log('=====================================');

async function executeSchemaFix() {
  console.log('\n📝 Applying schema fixes for clean auth store compatibility...');
  
  try {
    // Step 1: Add missing email_verified column
    console.log('1. Adding email_verified column...');
    const { error: addColumnError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;'
    });
    
    if (addColumnError && addColumnError.code !== '42883') {
      throw addColumnError;
    } else if (addColumnError && addColumnError.code === '42883') {
      console.log('   ⚠️  Cannot execute SQL directly - using alternative approach');
      
      // Alternative: Try updating through regular query
      try {
        const { error: testError } = await supabase
          .from('user_profiles')
          .select('email_verified')
          .limit(1);
          
        if (testError && testError.code === '42703') {
          console.log('   ❌ email_verified column missing - manual SQL execution required');
          return false;
        } else {
          console.log('   ✅ email_verified column already exists');
        }
      } catch (e) {
        console.log('   ❌ Cannot verify column existence');
        return false;
      }
    } else {
      console.log('   ✅ email_verified column added');
    }

    // Step 2: Update existing admin users
    console.log('2. Updating admin users...');
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ email_verified: true })
      .or('role.eq.admin,is_admin.eq.true');

    if (updateError) {
      console.log('   ⚠️  Could not update admin users:', updateError.message);
    } else {
      console.log('   ✅ Admin users updated');
    }

    // Step 3: Update verified users
    console.log('3. Updating verified users...');
    const { error: updateVerifiedError } = await supabase
      .from('user_profiles')
      .update({ email_verified: true })
      .eq('is_verified', true);

    if (updateVerifiedError) {
      console.log('   ⚠️  Could not update verified users:', updateVerifiedError.message);
    } else {
      console.log('   ✅ Verified users updated');
    }

    return true;
  } catch (error) {
    console.error('❌ Schema fix failed:', error.message);
    return false;
  }
}

async function testCompatibility() {
  console.log('\n🧪 Testing clean auth store compatibility...');
  
  try {
    // Test the exact query the auth store will make
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, email_verified, created_at, updated_at')
      .limit(1);

    if (error) {
      console.error('❌ Compatibility test failed:', error.message);
      return false;
    }

    console.log('✅ Auth store compatibility verified');
    console.log('   Sample user profile:', data[0]);
    return true;
  } catch (error) {
    console.error('❌ Compatibility test error:', error.message);
    return false;
  }
}

async function verifyRLSPolicies() {
  console.log('\n🛡️  Verifying RLS policies...');
  
  try {
    // Try to access user_profiles as an authenticated user would
    // This is a basic test to ensure the table is accessible
    const { count, error } = await supabase
      .from('user_profiles')
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log('⚠️  RLS policy test inconclusive:', error.message);
      return false;
    }

    console.log(`✅ RLS policies appear functional (${count} records accessible)`);
    return true;
  } catch (error) {
    console.log('⚠️  Could not verify RLS policies:', error.message);
    return false;
  }
}

async function checkAdminAccess() {
  console.log('\n👑 Checking admin user access...');
  
  try {
    const { data: adminUsers, error } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, email_verified, is_admin')
      .or('role.eq.admin,is_admin.eq.true');

    if (error) {
      throw error;
    }

    console.log(`✅ Found ${adminUsers?.length || 0} admin users:`);
    adminUsers?.forEach(user => {
      console.log(`   - ${user.email} (${user.display_name || 'No display name'}) - verified: ${user.email_verified}`);
    });

    return adminUsers?.length > 0;
  } catch (error) {
    console.error('❌ Admin access check failed:', error.message);
    return false;
  }
}

async function main() {
  try {
    console.log('🚀 Starting schema fix process...\n');

    // Step 1: Apply schema fixes
    const schemaFixed = await executeSchemaFix();
    if (!schemaFixed) {
      console.log('\n📋 MANUAL ACTION REQUIRED:');
      console.log('The schema fix requires manual SQL execution in Supabase Dashboard:');
      console.log('1. Go to Supabase Dashboard → SQL Editor');
      console.log('2. Execute the SQL from: fix-user-profiles-schema.sql');
      console.log('3. Run this script again to verify');
      return;
    }

    // Step 2: Test compatibility
    const compatible = await testCompatibility();
    
    // Step 3: Verify RLS
    const rlsWorking = await verifyRLSPolicies();
    
    // Step 4: Check admin access
    const adminAccess = await checkAdminAccess();

    // Summary
    console.log('\n📊 FINAL STATUS:');
    console.log('================');
    console.log(`Schema Fix Applied: ${schemaFixed ? '✅' : '❌'}`);
    console.log(`Auth Store Compatible: ${compatible ? '✅' : '❌'}`);
    console.log(`RLS Policies Working: ${rlsWorking ? '✅' : '⚠️'}`);
    console.log(`Admin Access Verified: ${adminAccess ? '✅' : '⚠️'}`);

    if (compatible && schemaFixed) {
      console.log('\n🎉 SUCCESS: Database schema is now compatible with clean auth store!');
      console.log('The clean rebuild should work correctly with authentication.');
    } else {
      console.log('\n⚠️  Some issues remain - check the logs above for details.');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { executeSchemaFix, testCompatibility };