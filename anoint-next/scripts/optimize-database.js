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

async function optimizeDatabase() {
  console.log('=== SUPABASE DATABASE OPTIMIZATION ===\n');
  
  const optimizations = [];
  const issues = [];

  try {
    console.log('1. RLS POLICIES ANALYSIS');
    console.log('========================');
    
    // Test RLS with different roles
    console.log('Testing RLS policies...');
    
    // Create a test client with anon key (regular user)
    const anonClient = createClient(
      supabaseUrl, 
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Test anonymous access
    const { data: anonData, error: anonError } = await anonClient
      .from('user_profiles')
      .select('id, email')
      .limit(1);

    if (anonError) {
      console.log('  ✓ Anonymous access properly restricted');
      console.log(`    Error: ${anonError.message}`);
    } else {
      console.log('  ⚠️  Anonymous access allowed - potential security issue');
      issues.push('Anonymous users can access user_profiles table');
    }

    console.log('\n2. INDEX OPTIMIZATION ANALYSIS');
    console.log('===============================');
    
    // Test query performance for common operations
    const queries = [
      { name: 'Email lookup', query: () => supabase.from('user_profiles').select('*').eq('email', 'info@anoint.me') },
      { name: 'Role filtering', query: () => supabase.from('user_profiles').select('*').eq('role', 'admin') },
      { name: 'ID lookup', query: () => supabase.from('user_profiles').select('*').eq('id', '19b9ecbb-56f7-4ae1-8008-6688e82619c8') },
      { name: 'Active users', query: () => supabase.from('user_profiles').select('*').eq('is_active', true) },
    ];

    for (const queryTest of queries) {
      const start = Date.now();
      const { error } = await queryTest.query();
      const time = Date.now() - start;
      
      console.log(`  ${queryTest.name}: ${time}ms`);
      
      if (error) {
        console.log(`    ✗ Error: ${error.message}`);
        issues.push(`Query error in ${queryTest.name}: ${error.message}`);
      } else if (time > 100) {
        console.log(`    ⚠️  Slow query detected`);
        optimizations.push(`Add index to improve ${queryTest.name} performance`);
      } else {
        console.log(`    ✓ Good performance`);
      }
    }

    console.log('\n3. DATA INTEGRITY CHECK');
    console.log('========================');
    
    // Check for data inconsistencies
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, email, role, is_admin, email_verified');

    if (usersError) {
      console.log('  ✗ Could not check data integrity:', usersError.message);
      issues.push(`Data integrity check failed: ${usersError.message}`);
    } else {
      console.log(`  ✓ Found ${allUsers?.length || 0} user records`);
      
      // Check for inconsistencies
      let inconsistencies = 0;
      allUsers?.forEach(user => {
        // Admin role should have is_admin=true
        if (user.role === 'admin' && !user.is_admin) {
          console.log(`    ⚠️  User ${user.email} has admin role but is_admin=false`);
          inconsistencies++;
        }
        
        // Check for missing emails
        if (!user.email) {
          console.log(`    ⚠️  User ${user.id} has no email address`);
          inconsistencies++;
        }
        
        // Check email verification for admin
        if (user.role === 'admin' && !user.email_verified) {
          console.log(`    ⚠️  Admin user ${user.email} is not email verified`);
          inconsistencies++;
        }
      });
      
      if (inconsistencies === 0) {
        console.log('  ✓ No data inconsistencies found');
      } else {
        issues.push(`Found ${inconsistencies} data inconsistencies`);
      }
    }

    console.log('\n4. STORAGE OPTIMIZATION');
    console.log('=======================');
    
    // Check if storage buckets are needed
    const { data: buckets } = await supabase.storage.listBuckets();
    
    if (!buckets || buckets.length === 0) {
      console.log('  ℹ️  No storage buckets configured');
      console.log('  💡 Consider creating buckets for:');
      console.log('    - avatars (for user profile pictures)');
      console.log('    - uploads (for general file uploads)');
      optimizations.push('Create storage buckets for avatars and uploads');
    } else {
      console.log(`  ✓ Found ${buckets.length} storage buckets`);
    }

    console.log('\n5. SECURITY RECOMMENDATIONS');
    console.log('============================');
    
    // Check for security best practices
    const securityChecks = [];
    
    // Check if profiles view matches user_profiles table
    const { data: profilesView } = await supabase.from('profiles').select('*').limit(1);
    const { data: userProfiles } = await supabase.from('user_profiles').select('*').limit(1);
    
    if (profilesView && userProfiles) {
      const viewCols = Object.keys(profilesView[0]).sort();
      const tableCols = Object.keys(userProfiles[0]).sort();
      
      if (JSON.stringify(viewCols) === JSON.stringify(tableCols)) {
        console.log('  ✓ Profiles view properly mirrors user_profiles table');
      } else {
        console.log('  ⚠️  Profiles view columns differ from user_profiles');
        issues.push('Profiles view schema mismatch');
      }
    }

    // Additional security recommendations
    securityChecks.push('RLS policies should be enabled on all user-facing tables');
    securityChecks.push('Service role key should only be used server-side');
    securityChecks.push('Regular backups should be configured');
    
    securityChecks.forEach(check => {
      console.log(`  💡 ${check}`);
    });

    console.log('\n=== OPTIMIZATION SUMMARY ===');
    console.log(`Issues found: ${issues.length}`);
    console.log(`Optimizations suggested: ${optimizations.length}`);
    
    if (issues.length > 0) {
      console.log('\n🚨 ISSUES TO ADDRESS:');
      issues.forEach((issue, i) => {
        console.log(`  ${i + 1}. ${issue}`);
      });
    }
    
    if (optimizations.length > 0) {
      console.log('\n💡 SUGGESTED OPTIMIZATIONS:');
      optimizations.forEach((opt, i) => {
        console.log(`  ${i + 1}. ${opt}`);
      });
    }
    
    if (issues.length === 0 && optimizations.length === 0) {
      console.log('\n✅ Database is well optimized! No critical issues found.');
    }

    console.log('\n=== DATABASE HEALTH SCORE ===');
    const maxScore = 100;
    let score = maxScore;
    score -= (issues.length * 15); // Deduct 15 points per issue
    score -= (optimizations.length * 5); // Deduct 5 points per optimization
    score = Math.max(0, score); // Don't go below 0
    
    console.log(`Health Score: ${score}/${maxScore}`);
    
    if (score >= 90) {
      console.log('Status: 🟢 Excellent - Production ready');
    } else if (score >= 70) {
      console.log('Status: 🟡 Good - Minor optimizations recommended');
    } else if (score >= 50) {
      console.log('Status: 🟠 Fair - Several improvements needed');
    } else {
      console.log('Status: 🔴 Poor - Critical issues require attention');
    }

  } catch (error) {
    console.error('Unexpected error during optimization analysis:', error);
  }
}

// Run the optimization analysis
optimizeDatabase().catch(console.error);