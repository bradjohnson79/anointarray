const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

// Initialize Supabase client with service key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createStoragePolicies() {
  console.log('🔐 Creating RLS policies for storage buckets...\n');

  const policies = [
    // ARRAYS BUCKET POLICIES
    {
      bucket: 'arrays',
      policy_name: 'arrays_authenticated_users_select',
      operation: 'SELECT',
      definition: `(auth.role() = 'authenticated')::boolean`,
      description: 'Allow authenticated users to view array files'
    },
    {
      bucket: 'arrays', 
      policy_name: 'arrays_users_insert_own',
      operation: 'INSERT',
      definition: `(auth.uid()::text = (storage.foldername(name))[1])::boolean`,
      description: 'Allow users to upload arrays to their own folder'
    },
    {
      bucket: 'arrays',
      policy_name: 'arrays_users_update_own', 
      operation: 'UPDATE',
      definition: `(auth.uid()::text = (storage.foldername(name))[1])::boolean`,
      description: 'Allow users to update their own array files'
    },
    {
      bucket: 'arrays',
      policy_name: 'arrays_users_delete_own',
      operation: 'DELETE', 
      definition: `(auth.uid()::text = (storage.foldername(name))[1])::boolean`,
      description: 'Allow users to delete their own array files'
    },

    // GLYPHS BUCKET POLICIES
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_public_select',
      operation: 'SELECT',
      definition: `true`,
      description: 'Allow public read access to glyph images'
    },
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_admin_insert',
      operation: 'INSERT',
      definition: `(auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow only admins to upload glyph images'
    },
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_admin_update',
      operation: 'UPDATE',
      definition: `(auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow only admins to update glyph images'
    },
    {
      bucket: 'glyphs',
      policy_name: 'glyphs_admin_delete',
      operation: 'DELETE',
      definition: `(auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow only admins to delete glyph images'
    },

    // RECEIPTS BUCKET POLICIES
    {
      bucket: 'receipts',
      policy_name: 'receipts_users_select_own',
      operation: 'SELECT',
      definition: `(auth.uid()::text = (storage.foldername(name))[1])::boolean OR (auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow users to view their own receipts, admins can view all'
    },
    {
      bucket: 'receipts',
      policy_name: 'receipts_system_insert',
      operation: 'INSERT',
      definition: `(auth.jwt() ->> 'role' = 'service_role')::boolean OR (auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow system/admin to create receipt files'
    },
    {
      bucket: 'receipts',
      policy_name: 'receipts_admin_update',
      operation: 'UPDATE',
      definition: `(auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow only admins to update receipt files'
    },
    {
      bucket: 'receipts',
      policy_name: 'receipts_admin_delete',
      operation: 'DELETE',
      definition: `(auth.jwt() ->> 'role' = 'admin')::boolean`,
      description: 'Allow only admins to delete receipt files'
    }
  ];

  console.log(`📝 Creating ${policies.length} storage policies...\n`);

  for (const policy of policies) {
    console.log(`🔒 Creating policy: ${policy.policy_name} for bucket: ${policy.bucket}`);
    console.log(`   Operation: ${policy.operation}`);
    console.log(`   Description: ${policy.description}`);
    console.log(`   Definition: ${policy.definition}`);

    try {
      // Create the policy using SQL
      const sql = `
        CREATE POLICY "${policy.policy_name}" ON storage.objects
        FOR ${policy.operation}
        USING (bucket_id = '${policy.bucket}' AND ${policy.definition});
      `;

      const { data, error } = await supabase.rpc('execute_sql', {
        sql_query: sql
      });

      if (error) {
        console.error(`   ❌ Error creating policy '${policy.policy_name}':`, error.message);
      } else {
        console.log(`   ✅ Policy '${policy.policy_name}' created successfully`);
      }
    } catch (err) {
      console.error(`   ❌ Exception creating policy '${policy.policy_name}':`, err.message);
    }

    console.log(''); // Empty line for readability
  }

  console.log('✨ Storage policy creation completed!');
  
  // Enable RLS on storage.objects if not already enabled
  console.log('\n🔐 Ensuring RLS is enabled on storage.objects...');
  try {
    const { error: rlsError } = await supabase.rpc('execute_sql', {
      sql_query: 'ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;'
    });
    
    if (rlsError && !rlsError.message.includes('already enabled')) {
      console.error('Error enabling RLS:', rlsError.message);
    } else {
      console.log('✅ RLS is enabled on storage.objects');
    }
  } catch (err) {
    console.log('⚠️  RLS may already be enabled or error occurred:', err.message);
  }
}

// Run the script
createStoragePolicies().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});