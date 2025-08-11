#!/usr/bin/env node

/**
 * Script to update Supabase authentication configuration via Management API
 * This script configures the redirect URLs for password recovery
 */

const https = require('https');
const { URL } = require('url');
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

// Extract project reference from Supabase URL
function getProjectRef(supabaseUrl) {
  try {
    const url = new URL(supabaseUrl);
    return url.hostname.split('.')[0];
  } catch (error) {
    throw new Error(`Invalid Supabase URL: ${supabaseUrl}`);
  }
}

// Make HTTPS request
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let body = '';
      
      res.on('data', (chunk) => {
        body += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: jsonBody
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body
          });
        }
      });
    });
    
    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

async function updateAuthConfig() {
  console.log('🔧 Updating Supabase authentication configuration via API...\n');
  
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
  
  const projectRef = getProjectRef(supabaseUrl);
  console.log(`📋 Project Reference: ${projectRef}`);
  console.log(`📋 Site URL: ${AUTH_CONFIG.SITE_URL}`);
  console.log(`📋 Redirect URLs: ${AUTH_CONFIG.REDIRECT_URLS.length} URLs configured\n`);
  
  try {
    // Try to get current auth configuration
    console.log('🔍 Checking current authentication configuration...');
    
    const getOptions = {
      hostname: 'api.supabase.com',
      port: 443,
      path: `/v1/projects/${projectRef}/config/auth`,
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };
    
    const getResponse = await makeRequest(getOptions);
    console.log(`   Status: ${getResponse.statusCode}`);
    
    if (getResponse.statusCode === 401) {
      console.log('\n⚠️  Authentication failed with Management API');
      console.log('This is expected - the service role key doesn\'t have Management API access.');
    } else if (getResponse.statusCode === 200) {
      console.log('✅ Successfully retrieved current auth configuration');
      console.log('   Current site_url:', getResponse.body.site_url);
      console.log('   Current redirect_urls:', getResponse.body.additional_redirect_urls);
      
      // Update the configuration
      const updateData = {
        site_url: AUTH_CONFIG.SITE_URL,
        additional_redirect_urls: AUTH_CONFIG.REDIRECT_URLS
      };
      
      const updateOptions = {
        hostname: 'api.supabase.com',
        port: 443,
        path: `/v1/projects/${projectRef}/config/auth`,
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      };
      
      console.log('\n🔄 Updating authentication configuration...');
      const updateResponse = await makeRequest(updateOptions, updateData);
      console.log(`   Status: ${updateResponse.statusCode}`);
      
      if (updateResponse.statusCode === 200) {
        console.log('✅ Successfully updated authentication configuration!');
      } else {
        console.log('❌ Failed to update configuration:', updateResponse.body);
      }
    } else {
      console.log('❌ Unexpected response:', getResponse.statusCode, getResponse.body);
    }
    
  } catch (error) {
    console.error('❌ Error accessing Supabase Management API:', error.message);
  }
  
  // Always show manual configuration instructions
  console.log('\n⚠️  Manual Configuration (Recommended)');
  console.log('═'.repeat(50));
  console.log('Configure authentication redirect URLs through the Supabase Dashboard:');
  console.log(`\n🔗 Direct link: https://app.supabase.com/project/${projectRef}/auth/url-configuration`);
  console.log(`\n📋 Configuration to apply:`);
  console.log(`   Site URL: ${AUTH_CONFIG.SITE_URL}`);
  console.log(`   Additional redirect URLs:`);
  
  AUTH_CONFIG.REDIRECT_URLS.forEach((url, index) => {
    console.log(`      ${index + 1}. ${url}`);
  });
  
  console.log('\n📧 Password Recovery Flow:');
  console.log('   1. User visits /forgot-password');
  console.log('   2. Enters email and requests reset');
  console.log('   3. Supabase sends email with recovery link');
  console.log('   4. Link redirects to /reset-password with tokens');
  console.log('   5. User enters new password and submits');
  console.log('   6. Password gets updated via Supabase Auth API');
  
  console.log('\n✅ Local Development Configuration');
  console.log(`   File: supabase/config.toml`);
  console.log(`   Status: Updated with correct URLs`);
  console.log(`   Effect: Applies to local Supabase instance`);
  
  console.log('\n🚀 Testing Checklist:');
  console.log('   □ Test password reset in development (localhost:3001)');
  console.log('   □ Test password reset in production (anointarray.com)');
  console.log('   □ Verify email links redirect to correct URLs');
  console.log('   □ Confirm password update functionality works');
  
  console.log('\n💡 Troubleshooting:');
  console.log('   - If emails still redirect to homepage, check Dashboard settings');
  console.log('   - Ensure all redirect URLs are added exactly as shown above');
  console.log('   - Check that Site URL is set to production domain');
  console.log('   - Verify email templates use correct redirect URLs');
}

// Run the configuration update
updateAuthConfig().catch(console.error);