const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize different Supabase clients for testing different permission levels
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

async function testStoragePermissions() {
  console.log('🔐 Testing storage bucket permissions and RLS policies...\n');

  // Test 1: Anonymous access to glyphs (should work for read)
  console.log('🔍 Test 1: Anonymous user reading glyphs bucket');
  try {
    const { data: files, error } = await supabaseAnon.storage
      .from('glyphs')
      .list('', { limit: 10 });

    if (error) {
      console.log(`   ❌ Anonymous read failed (expected if no files): ${error.message}`);
    } else {
      console.log(`   ✅ Anonymous read successful: ${files.length} items found`);
    }
  } catch (err) {
    console.log(`   ❌ Exception during anonymous read: ${err.message}`);
  }

  // Test 2: Anonymous upload to glyphs (should fail)
  console.log('\n🚫 Test 2: Anonymous user trying to upload to glyphs (should fail)');
  try {
    const testContent = Buffer.from('test content');
    const { data, error } = await supabaseAnon.storage
      .from('glyphs')
      .upload('test/anonymous-upload.png', testContent, {
        contentType: 'image/png'
      });

    if (error) {
      console.log(`   ✅ Anonymous upload correctly blocked: ${error.message}`);
    } else {
      console.log(`   ❌ Anonymous upload incorrectly allowed - this is a security issue!`);
    }
  } catch (err) {
    console.log(`   ✅ Anonymous upload blocked by exception: ${err.message}`);
  }

  // Test 3: Admin access to all buckets
  console.log('\n👑 Test 3: Admin access to all buckets');
  const buckets = ['arrays', 'glyphs', 'receipts'];
  
  for (const bucket of buckets) {
    try {
      const { data: files, error } = await supabaseAdmin.storage
        .from(bucket)
        .list('', { limit: 10 });

      if (error) {
        console.log(`   ❌ Admin read from ${bucket} failed: ${error.message}`);
      } else {
        console.log(`   ✅ Admin read from ${bucket} successful: ${files.length} items`);
      }
    } catch (err) {
      console.log(`   ❌ Exception during admin read from ${bucket}: ${err.message}`);
    }
  }

  // Test 4: Create a test user and test their permissions
  console.log('\n👤 Test 4: Creating test user to verify user-specific permissions');
  
  try {
    // Create a test user
    const testEmail = `test-user-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true
    });

    if (createError) {
      console.log(`   ❌ Failed to create test user: ${createError.message}`);
    } else {
      console.log(`   ✅ Test user created: ${testEmail}`);
      
      // Sign in as the test user
      const userClient = createClient(supabaseUrl, supabaseAnonKey);
      const { data: signInData, error: signInError } = await userClient.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });

      if (signInError) {
        console.log(`   ❌ Failed to sign in test user: ${signInError.message}`);
      } else {
        console.log(`   ✅ Test user signed in successfully`);
        
        // Test user uploading to their own folder in arrays bucket
        console.log('\n📤 Test 4a: User uploading to their own folder in arrays bucket');
        try {
          const testContent = Buffer.from('test array content');
          const userFolder = `${signInData.user.id}/test-array.png`;
          
          const { data: uploadData, error: uploadError } = await userClient.storage
            .from('arrays')
            .upload(userFolder, testContent, {
              contentType: 'image/png'
            });

          if (uploadError) {
            console.log(`   ❌ User upload to own folder failed: ${uploadError.message}`);
          } else {
            console.log(`   ✅ User upload to own folder successful: ${uploadData.path}`);
          }
        } catch (err) {
          console.log(`   ❌ Exception during user upload: ${err.message}`);
        }

        // Test user trying to upload to another user's folder (should fail)
        console.log('\n🚫 Test 4b: User trying to upload to another user\'s folder (should fail)');
        try {
          const testContent = Buffer.from('malicious content');
          const otherUserFolder = 'other-user-456/malicious-file.png';
          
          const { data: uploadData, error: uploadError } = await userClient.storage
            .from('arrays')
            .upload(otherUserFolder, testContent, {
              contentType: 'image/png'
            });

          if (uploadError) {
            console.log(`   ✅ Cross-user upload correctly blocked: ${uploadError.message}`);
          } else {
            console.log(`   ❌ Cross-user upload incorrectly allowed - security issue!`);
          }
        } catch (err) {
          console.log(`   ✅ Cross-user upload blocked by exception: ${err.message}`);
        }

        // Clean up: delete the test user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
        if (deleteError) {
          console.log(`   ⚠️  Could not delete test user: ${deleteError.message}`);
        } else {
          console.log(`   🗑️  Test user deleted successfully`);
        }
      }
    }
  } catch (err) {
    console.log(`   ❌ Exception during test user creation: ${err.message}`);
  }

  // Test 5: Verify bucket settings and policies exist
  console.log('\n📋 Test 5: Verifying bucket configuration');
  
  try {
    const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
    
    if (error) {
      console.log(`   ❌ Failed to list buckets: ${error.message}`);
    } else {
      console.log(`   📦 Found ${buckets.length} storage buckets:`);
      
      buckets.forEach(bucket => {
        if (['arrays', 'glyphs', 'receipts'].includes(bucket.name)) {
          console.log(`   ✅ ${bucket.name}: ${bucket.public ? 'public' : 'private'} (created: ${bucket.created_at})`);
        }
      });
    }
  } catch (err) {
    console.log(`   ❌ Exception listing buckets: ${err.message}`);
  }

  // Test 6: Check RLS policies exist
  console.log('\n🔒 Test 6: Verifying RLS policies');
  try {
    const { data: policies, error } = await supabaseAdmin.rpc('execute_sql', {
      sql_query: `
        SELECT 
          schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
        FROM pg_policies 
        WHERE tablename = 'objects' AND schemaname = 'storage'
        ORDER BY policyname;
      `
    });

    if (error) {
      console.log(`   ❌ Failed to query policies: ${error.message}`);
    } else {
      console.log(`   🔐 Found ${policies.length} RLS policies on storage.objects:`);
      policies.forEach(policy => {
        if (policy.policyname.includes('arrays') || 
            policy.policyname.includes('glyphs') || 
            policy.policyname.includes('receipts')) {
          console.log(`   ✅ ${policy.policyname} (${policy.cmd})`);
        }
      });
    }
  } catch (err) {
    console.log(`   ❌ Exception querying policies: ${err.message}`);
  }

  console.log('\n✨ Storage permissions testing completed!');
}

// Run the test
testStoragePermissions().catch(error => {
  console.error('❌ Permission test failed:', error);
  process.exit(1);
});