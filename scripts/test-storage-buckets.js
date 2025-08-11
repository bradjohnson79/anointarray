const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Create test files
function createTestFiles() {
  const testDir = path.join(__dirname, 'test-files');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Create a test PNG file (simple 1x1 pixel PNG)
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 pixel
    0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53,
    0xDE, 0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, // IDAT chunk
    0x54, 0x08, 0x99, 0x01, 0x01, 0x00, 0x00, 0x00,
    0x00, 0xFF, 0xFF, 0x00, 0x00, 0x00, 0x02, 0x00,
    0x01, 0xE5, 0x27, 0xDE, 0xFC, 0x00, 0x00, 0x00, // IEND chunk
    0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);

  // Create a test SVG
  const svgData = `<svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5" cy="5" r="4" fill="blue"/>
  </svg>`;

  // Create a simple PDF header (minimal PDF)
  const pdfData = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
100 700 Td
(Test Receipt) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000060 00000 n 
0000000120 00000 n 
0000000200 00000 n 
trailer
<<
/Size 5
/Root 1 0 R
>>
startxref
290
%%EOF`;

  fs.writeFileSync(path.join(testDir, 'test-array.png'), pngData);
  fs.writeFileSync(path.join(testDir, 'test-glyph.svg'), svgData);
  fs.writeFileSync(path.join(testDir, 'test-receipt.pdf'), pdfData);

  return testDir;
}

async function testStorageFunctionality() {
  console.log('🧪 Testing storage bucket functionality...\n');

  // Create test files
  const testDir = createTestFiles();
  console.log('📁 Created test files in:', testDir);

  // Test each bucket
  const tests = [
    {
      bucket: 'arrays',
      file: 'test-array.png',
      path: 'test-user-123/test-array.png',
      contentType: 'image/png',
      description: 'Test array image upload'
    },
    {
      bucket: 'glyphs',
      file: 'test-glyph.svg',
      path: 'mystical-symbols/test-glyph.svg',
      contentType: 'image/svg+xml',
      description: 'Test glyph image upload'
    },
    {
      bucket: 'receipts',
      file: 'test-receipt.pdf',
      path: 'test-user-123/order-12345.pdf',
      contentType: 'application/pdf',
      description: 'Test receipt upload'
    }
  ];

  console.log('🔬 Running upload/download tests...\n');

  for (const test of tests) {
    console.log(`📤 Testing bucket: ${test.bucket}`);
    console.log(`   File: ${test.file}`);
    console.log(`   Path: ${test.path}`);
    console.log(`   Description: ${test.description}`);

    try {
      // Read test file
      const filePath = path.join(testDir, test.file);
      const fileBuffer = fs.readFileSync(filePath);

      // Upload file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(test.bucket)
        .upload(test.path, fileBuffer, {
          contentType: test.contentType,
          upsert: true
        });

      if (uploadError) {
        console.error(`   ❌ Upload failed:`, uploadError.message);
        continue;
      }

      console.log(`   ✅ Upload successful:`, uploadData.path);

      // Try to download the file
      const { data: downloadData, error: downloadError } = await supabase.storage
        .from(test.bucket)
        .download(test.path);

      if (downloadError) {
        console.error(`   ❌ Download failed:`, downloadError.message);
      } else {
        console.log(`   ✅ Download successful: ${downloadData.size} bytes`);
      }

      // Get public URL (for testing)
      const { data: urlData } = supabase.storage
        .from(test.bucket)
        .getPublicUrl(test.path);

      console.log(`   🔗 Public URL: ${urlData.publicUrl}`);

    } catch (error) {
      console.error(`   ❌ Test failed:`, error.message);
    }

    console.log('');
  }

  // List files in each bucket
  console.log('📋 Listing files in each bucket...\n');

  for (const bucket of ['arrays', 'glyphs', 'receipts']) {
    console.log(`📦 Files in ${bucket} bucket:`);
    
    const { data: files, error } = await supabase.storage
      .from(bucket)
      .list('', {
        limit: 10,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) {
      console.error(`   ❌ Error listing files:`, error.message);
    } else {
      if (files.length === 0) {
        console.log(`   📄 No files found`);
      } else {
        files.forEach(file => {
          console.log(`   📄 ${file.name} (${file.metadata?.size || 'unknown'} bytes)`);
        });
      }
    }
    console.log('');
  }

  console.log('✨ Storage functionality testing completed!');

  // Clean up test files
  try {
    fs.rmSync(testDir, { recursive: true, force: true });
    console.log('🗑️  Cleaned up test files');
  } catch (err) {
    console.log('⚠️  Could not clean up test files:', err.message);
  }
}

// Run the test
testStorageFunctionality().catch(error => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});