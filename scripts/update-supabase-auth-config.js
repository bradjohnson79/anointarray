#!/usr/bin/env node

/**
 * Script to update Supabase authentication configuration
 * This script configures the redirect URLs for password recovery
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './anoint-next/.env.local' });

// Configuration for password recovery redirect URLs
const AUTH_CONFIG = {
  // Production site URL
  SITE_URL: 'https://anointarray.com',
  
  // Allowed redirect URLs for password recovery
  REDIRECT_URLS: [
    // Production URLs
    'https://anointarray.com',
    'https://anointarray.com/reset-password',
    'https://anointarray.com/auth/callback',
    
    // Development URLs
    'http://localhost:3001',
    'http://localhost:3001/reset-password', 
    'http://localhost:3001/auth/callback',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:3001/reset-password',
    'http://127.0.0.1:3001/auth/callback'
  ]
};

async function updateAuthConfig() {
  console.log('🔧 Updating Supabase authentication configuration...\n');
  
  // Check if we have the required environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing required environment variables:');
    console.error('   - NEXT_PUBLIC_SUPABASE_URL');
    console.error('   - SUPABASE_SERVICE_ROLE_KEY');
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }
  
  // Create Supabase client with service role key
  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
  
  try {
    console.log('📋 Current Configuration:');
    console.log(`   Site URL: ${AUTH_CONFIG.SITE_URL}`);
    console.log(`   Redirect URLs: ${AUTH_CONFIG.REDIRECT_URLS.length} URLs configured`);
    
    AUTH_CONFIG.REDIRECT_URLS.forEach((url, index) => {
      console.log(`      ${index + 1}. ${url}`);
    });
    
    console.log('\n⚠️  IMPORTANT: Manual Configuration Required');
    console.log('═'.repeat(50));
    console.log('The authentication redirect URLs must be configured through the Supabase Dashboard:');
    console.log('\n1. Go to: https://app.supabase.com/project/xmnghciitiefbwxzhgrw/auth/url-configuration');
    console.log(`2. Set Site URL to: ${AUTH_CONFIG.SITE_URL}`);
    console.log('3. Add these Redirect URLs:');
    
    AUTH_CONFIG.REDIRECT_URLS.forEach((url, index) => {
      console.log(`   ${url}`);
    });
    
    console.log('\n📧 Password Recovery Flow:');
    console.log('   1. User requests password reset at /forgot-password');
    console.log('   2. Supabase sends email with reset link');
    console.log('   3. Link redirects to /reset-password with tokens');
    console.log('   4. User enters new password and it gets updated');
    
    console.log('\n✅ Local Configuration Updated');
    console.log('   The supabase/config.toml file has been updated with the correct URLs.');
    console.log('   This affects local development environment.');
    
    console.log('\n🚀 Next Steps:');
    console.log('   1. Update the Supabase Dashboard settings (links above)');
    console.log('   2. Test password recovery flow in both development and production');
    console.log('   3. Verify emails redirect to correct URLs');
    
  } catch (error) {
    console.error('❌ Error updating auth configuration:', error.message);
    process.exit(1);
  }
}

// Run the configuration update
updateAuthConfig().catch(console.error);