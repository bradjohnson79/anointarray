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

async function createStorageBuckets() {
  console.log('🚀 Creating storage buckets for e-commerce platform...\n');

  // List existing buckets first
  console.log('📋 Checking existing buckets...');
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error('Error listing buckets:', listError);
  } else {
    console.log('Existing buckets:', existingBuckets.map(b => b.name));
  }

  // Bucket configurations
  const buckets = [
    {
      name: 'arrays',
      public: false, // Will be controlled via RLS
      description: 'User-generated mystical array images (PNG/PDF/JPG), max 10MB'
    },
    {
      name: 'glyphs',
      public: false, // Will be controlled via RLS for admin uploads, public read
      description: 'Mystical glyph/symbol images (PNG/SVG/JPG), max 2MB'
    },
    {
      name: 'receipts',
      public: false, // Private, controlled via RLS
      description: 'Order receipts and invoices (PDF), max 5MB'
    }
  ];

  console.log('\n🪣 Creating storage buckets...');

  for (const bucket of buckets) {
    console.log(`\n📦 Creating bucket: ${bucket.name}`);
    console.log(`   Description: ${bucket.description}`);
    console.log(`   Public: ${bucket.public}`);

    // Check if bucket already exists
    const bucketExists = existingBuckets?.some(b => b.name === bucket.name);
    if (bucketExists) {
      console.log(`   ⚠️  Bucket '${bucket.name}' already exists, skipping creation`);
      continue;
    }

    // Create bucket
    const { data, error } = await supabase.storage.createBucket(bucket.name, {
      public: bucket.public,
      allowedMimeTypes: bucket.name === 'arrays' 
        ? ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
        : bucket.name === 'glyphs'
        ? ['image/png', 'image/svg+xml', 'image/jpeg', 'image/jpg']
        : ['application/pdf'], // receipts
      fileSizeLimit: bucket.name === 'arrays'
        ? 10 * 1024 * 1024 // 10MB
        : bucket.name === 'glyphs'
        ? 2 * 1024 * 1024 // 2MB
        : 5 * 1024 * 1024 // 5MB for receipts
    });

    if (error) {
      console.error(`   ❌ Error creating bucket '${bucket.name}':`, error.message);
    } else {
      console.log(`   ✅ Bucket '${bucket.name}' created successfully`);
    }
  }

  console.log('\n✨ Storage bucket creation completed!');
  
  // List buckets again to confirm
  console.log('\n📋 Final bucket list:');
  const { data: finalBuckets, error: finalListError } = await supabase.storage.listBuckets();
  if (finalListError) {
    console.error('Error listing final buckets:', finalListError);
  } else {
    finalBuckets.forEach(bucket => {
      console.log(`   📦 ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });
  }
}

// Run the script
createStorageBuckets().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});