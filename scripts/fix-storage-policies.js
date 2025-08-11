const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixStoragePolicies() {
  console.log('🔧 Fixing storage bucket RLS policies...\n');

  // First, let's drop existing policies and recreate them correctly
  console.log('🗑️  Dropping existing policies...');
  
  const policyNames = [
    'arrays_authenticated_users_select',
    'arrays_users_insert_own',
    'arrays_users_update_own',
    'arrays_users_delete_own',
    'glyphs_public_select',
    'glyphs_admin_insert',
    'glyphs_admin_update',
    'glyphs_admin_delete',
    'receipts_users_select_own',
    'receipts_system_insert',
    'receipts_admin_update',
    'receipts_admin_delete'
  ];

  // Drop existing policies
  for (const policyName of policyNames) {
    try {
      await supabase.rpc('execute_sql', {
        sql_query: `DROP POLICY IF EXISTS "${policyName}" ON storage.objects;`
      });
      console.log(`   🗑️  Dropped policy: ${policyName}`);
    } catch (err) {
      console.log(`   ⚠️  Could not drop ${policyName}: ${err.message}`);
    }
  }

  console.log('\n🔐 Creating improved RLS policies...\n');

  // Improved policies that should work better
  const policies = [
    // ARRAYS BUCKET POLICIES - Allow authenticated users to manage their own files
    {
      bucket: 'arrays',
      policy_name: 'arrays_select_own_and_public',
      operation: 'SELECT',
      definition: `(
        auth.role() = 'authenticated' AND 
        (
          (storage.foldername(name))[1] = auth.uid()::text OR
          (storage.foldername(name))[1] = 'public'
        )
      )`,
      description: 'Allow users to see their own arrays and public ones'
    },
    {
      bucket: 'arrays', 
      policy_name: 'arrays_insert_own_folder',
      operation: 'INSERT',
      definition: `(
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )`,
      description: 'Allow users to upload to their own folder'
    },
    {
      bucket: 'arrays',
      policy_name: 'arrays_update_own_files', 
      operation: 'UPDATE',
      definition: `(
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )`,
      description: 'Allow users to update their own files'
    },
    {
      bucket: 'arrays',
      policy_name: 'arrays_delete_own_files',
      operation: 'DELETE', 
      definition: `(
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      )`,
      description: 'Allow users to delete their own files'
    },

    // GLYPHS BUCKET POLICIES - Public read, admin write
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_public_read',
      operation: 'SELECT',
      definition: `true`,
      description: 'Allow anyone to read glyph images'
    },
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_service_role_insert',
      operation: 'INSERT',
      definition: `auth.role() = 'service_role'`,
      description: 'Allow service role to upload glyphs'
    },
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_service_role_update',
      operation: 'UPDATE',
      definition: `auth.role() = 'service_role'`,
      description: 'Allow service role to update glyphs'
    },
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_service_role_delete',
      operation: 'DELETE',
      definition: `auth.role() = 'service_role'`,
      description: 'Allow service role to delete glyphs'
    },

    // RECEIPTS BUCKET POLICIES - Users see own, system writes
    {
      bucket: 'receipts',
      policy_name: 'receipts_select_own',
      operation: 'SELECT',
      definition: `(
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
      ) OR auth.role() = 'service_role'`,
      description: 'Allow users to see their own receipts, service role sees all'
    },
    {
      bucket: 'receipts',
      policy_name: 'receipts_service_role_insert',
      operation: 'INSERT',
      definition: `auth.role() = 'service_role'`,
      description: 'Allow service role to create receipts'
    },
    {
      bucket: 'receipts',
      policy_name: 'receipts_service_role_update',
      operation: 'UPDATE',
      definition: `auth.role() = 'service_role'`,
      description: 'Allow service role to update receipts'
    },
    {
      bucket: 'receipts',
      policy_name: 'receipts_service_role_delete',
      operation: 'DELETE',
      definition: `auth.role() = 'service_role'`,
      description: 'Allow service role to delete receipts'
    }
  ];

  // Create new policies
  for (const policy of policies) {
    console.log(`🔒 Creating policy: ${policy.policy_name}`);
    console.log(`   Bucket: ${policy.bucket} | Operation: ${policy.operation}`);
    console.log(`   Description: ${policy.description}`);

    try {
      const sql = `
        CREATE POLICY "${policy.policy_name}" ON storage.objects
        FOR ${policy.operation}
        USING (bucket_id = '${policy.bucket}' AND ${policy.definition});
      `;

      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: sql
      });

      if (error) {
        console.error(`   ❌ Failed: ${error.message}`);
      } else {
        console.log(`   ✅ Created successfully`);
      }
    } catch (err) {
      console.error(`   ❌ Exception: ${err.message}`);
    }
    console.log('');
  }

  // Ensure RLS is enabled
  console.log('🔐 Ensuring RLS is enabled...');
  try {
    await supabase.rpc('execute_sql', {
      sql_query: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    console.log('✅ RLS is enabled');
  } catch (err) {
    console.log('⚠️  RLS enable error (may already be enabled):', err.message);
  }

  // Verify policies were created
  console.log('\n📋 Verifying created policies...');
  try {
    const { data: allPolicies, error } = await supabase.rpc('execute_sql', {
      sql_query: `
        SELECT policyname, cmd 
        FROM pg_policies 
        WHERE tablename = 'objects' 
        AND schemaname = 'storage'
        ORDER BY policyname;
      `
    });

    if (error) {
      console.log('❌ Could not verify policies:', error.message);
    } else {
      console.log(`📝 Found ${allPolicies.length} total policies on storage.objects`);
      
      // Filter for our policies
      const ourPolicies = allPolicies.filter(p => 
        p.policyname.includes('arrays_') || 
        p.policyname.includes('glyphs_') || 
        p.policyname.includes('receipts_')
      );
      
      console.log(`🎯 Our policies (${ourPolicies.length}):`);
      ourPolicies.forEach(p => {
        console.log(`   ✅ ${p.policyname} (${p.cmd})`);
      });
    }
  } catch (err) {
    console.log('❌ Error verifying policies:', err.message);
  }

  console.log('\n✨ Storage policy fix completed!');
}

// Run the script
fixStoragePolicies().catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});