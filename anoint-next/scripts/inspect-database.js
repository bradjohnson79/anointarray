#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function inspectDatabase() {
  console.log('=== SUPABASE DATABASE INSPECTION ===\n');
  
  try {
    console.log('1. DATABASE SCHEMA OVERVIEW');
    console.log('==========================');
    
    // Try to list tables by attempting to query them directly
    const tablesToCheck = ['user_profiles', 'profiles', 'site_updates', 'auth.users'];
    console.log('Checking for tables:');
    
    for (const tableName of tablesToCheck) {
      try {
        const { error } = await supabase.from(tableName.replace('auth.', '')).select('*').limit(0);
        if (!error) {
          console.log(`  ✓ ${tableName} - exists`);
        }
      } catch (e) {
        console.log(`  ✗ ${tableName} - not accessible`);
      }
    }

    console.log('\n2. USER_PROFILES TABLE STRUCTURE');
    console.log('================================');
    
    // Get a sample record to understand the structure
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error fetching user_profiles sample:', sampleError);
    } else if (sampleRecord && sampleRecord.length > 0) {
      console.log('user_profiles columns (from sample record):');
      const columns = Object.keys(sampleRecord[0]);
      columns.forEach(col => {
        const value = sampleRecord[0][col];
        const type = typeof value;
        console.log(`  - ${col}: ${type} (sample: ${value})`);
      });
    } else {
      console.log('user_profiles table is empty or not accessible');
    }

    console.log('\n3. PROFILES VIEW CHECK');
    console.log('======================');
    
    // Check if profiles view exists by trying to query it
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (profilesError) {
        console.log('  ✗ profiles view does not exist or is not accessible');
        console.log(`    Error: ${profilesError.message}`);
      } else {
        console.log('  ✓ profiles view exists and is accessible');
        if (profilesData && profilesData.length > 0) {
          console.log('    Sample columns:', Object.keys(profilesData[0]).join(', '));
        }
      }
    } catch (e) {
      console.log('  ✗ profiles view error:', e.message);
    }

    console.log('\n4. ADMIN USER CHECK');
    console.log('===================');
    
    // Check admin user in user_profiles
    const { data: adminUser, error: adminError } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, email_verified, is_admin, created_at')
      .eq('email', 'info@anoint.me')
      .single();

    if (adminError) {
      console.error('Error fetching admin user:', adminError);
    } else if (adminUser) {
      console.log('Admin user found:');
      console.log(`  - ID: ${adminUser.id}`);
      console.log(`  - Email: ${adminUser.email}`);
      console.log(`  - Role: ${adminUser.role}`);
      console.log(`  - Display Name: ${adminUser.display_name}`);
      console.log(`  - Email Verified: ${adminUser.email_verified}`);
      console.log(`  - Is Admin: ${adminUser.is_admin}`);
      console.log(`  - Created: ${adminUser.created_at}`);
    } else {
      console.log('Admin user not found');
    }

    console.log('\n5. AUTHENTICATION QUERIES TEST');
    console.log('===============================');
    
    // Test the exact queries used by clean auth store
    console.log('Testing profile lookup query...');
    const { data: profileTest, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);

    if (profileError) {
      console.error('Profile lookup test failed:', profileError);
    } else {
      console.log(`Profile lookup test passed - returned ${profileTest?.length || 0} records`);
    }

    console.log('\nTesting auth store query...');
    const { data: authTest, error: authError } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, email_verified, created_at, updated_at')
      .limit(1);

    if (authError) {
      console.error('Auth store query test failed:', authError);
    } else {
      console.log(`Auth store query test passed - returned ${authTest?.length || 0} records`);
    }

    console.log('\n6. RLS POLICIES CHECK');
    console.log('=====================');
    
    // Check RLS policies by attempting operations
    console.log('Testing RLS policies with service role...');
    
    // Test if we can query without restrictions (service role should bypass RLS)
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('user_profiles')
      .select('id, email, role');

    if (allRecordsError) {
      console.log('  ✗ Service role query failed:', allRecordsError.message);
    } else {
      console.log(`  ✓ Service role can query all records (${allRecords?.length || 0} found)`);
    }
    
    console.log('\n7. PERFORMANCE CONSIDERATIONS');
    console.log('==============================');
    
    // Test query performance for common operations
    const startTime = Date.now();
    const { data: performanceTest, error: perfError } = await supabase
      .from('user_profiles')
      .select('id, email, role, display_name, email_verified, created_at, updated_at')
      .eq('email', 'info@anoint.me');
    const queryTime = Date.now() - startTime;
    
    if (perfError) {
      console.log('  ✗ Performance test failed:', perfError.message);
    } else {
      console.log(`  ✓ Email lookup query completed in ${queryTime}ms`);
      console.log('  💡 Consider adding index on email column if query time > 100ms');
    }

    console.log('\n8. STORAGE BUCKETS');
    console.log('==================');
    
    // Check storage buckets
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

    if (bucketsError) {
      console.error('Error fetching storage buckets:', bucketsError);
    } else if (buckets && buckets.length > 0) {
      console.log('Storage buckets:');
      buckets.forEach(bucket => {
        console.log(`  - ${bucket.name} (public: ${bucket.public}, created: ${bucket.created_at})`);
      });
    } else {
      console.log('No storage buckets found');
    }

    console.log('\n=== INSPECTION COMPLETE ===');

  } catch (error) {
    console.error('Unexpected error during inspection:', error);
  }
}

// Run the inspection
inspectDatabase().catch(console.error);