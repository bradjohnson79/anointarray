#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function testAdminLogin() {
  let browser;
  const timestamp = Date.now();
  const screenshotDir = `/Users/bradjohnson/Documents/anoint-array/WEBSITE/login-test-${timestamp}`;
  
  try {
    // Create screenshot directory
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir);
    }
    
    console.log('🚀 Starting comprehensive admin login test...');
    console.log(`📁 Screenshots will be saved to: ${screenshotDir}`);
    
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      slowMo: 100,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    const page = await browser.newPage();
    
    // Set up console and network monitoring
    const logs = [];
    const networkRequests = [];
    const errors = [];
    
    page.on('console', msg => {
      const logEntry = `[${msg.type()}] ${msg.text()}`;
      console.log('🖥️  BROWSER CONSOLE:', logEntry);
      logs.push({
        timestamp: new Date().toISOString(),
        type: msg.type(),
        text: msg.text()
      });
    });
    
    page.on('response', response => {
      if (response.url().includes('supabase') || response.url().includes('auth')) {
        const networkEntry = `${response.status()} ${response.url()}`;
        console.log('🌐 NETWORK:', networkEntry);
        networkRequests.push({
          timestamp: new Date().toISOString(),
          status: response.status(),
          url: response.url(),
          method: response.request().method()
        });
      }
    });
    
    page.on('pageerror', error => {
      console.error('❌ PAGE ERROR:', error.message);
      errors.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack
      });
    });
    
    console.log('📱 Navigating to login page...');
    
    // Navigate to login page
    await page.goto('http://localhost:3003/login', { 
      waitUntil: 'networkidle2',
      timeout: 15000 
    });
    
    // Take screenshot of login page
    await page.screenshot({ 
      path: path.join(screenshotDir, '01-login-page.png'),
      fullPage: true 
    });
    
    console.log('✅ Login page loaded');
    
    // Wait for form elements
    await page.waitForSelector('#email', { timeout: 5000 });
    await page.waitForSelector('#password', { timeout: 5000 });
    
    console.log('📝 Filling in credentials...');
    
    // Clear and enter credentials
    await page.click('#email', { clickCount: 3 });
    await page.type('#email', 'info@anoint.me');
    
    await page.click('#password', { clickCount: 3 });
    await page.type('#password', 'Admin123');
    
    // Take screenshot with credentials filled
    await page.screenshot({ 
      path: path.join(screenshotDir, '02-credentials-filled.png'),
      fullPage: true 
    });
    
    console.log('🔑 Credentials entered, submitting form...');
    
    // Click submit and wait for navigation or error
    const [response] = await Promise.all([
      page.waitForResponse(response => 
        response.url().includes('supabase') && 
        response.url().includes('token'), 
        { timeout: 15000 }
      ),
      page.click('button[type="submit"]')
    ]);
    
    console.log('📤 Form submitted, waiting for response...');
    
    // Wait a bit for auth to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const currentUrl = page.url();
    console.log('🌍 Current URL:', currentUrl);
    
    // Take screenshot of current state
    await page.screenshot({ 
      path: path.join(screenshotDir, '03-post-login.png'),
      fullPage: true 
    });
    
    let testResult = {
      success: false,
      message: '',
      details: {
        loginAttempted: true,
        authResponse: response ? response.status() : null,
        currentUrl: currentUrl,
        errors: errors,
        logs: logs,
        networkRequests: networkRequests
      }
    };
    
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ Successfully redirected to dashboard');
      
      // Wait for dashboard to load
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Check for user profile/admin elements
      try {
        // Wait for some content to appear
        await page.waitForSelector('h1, h2, .dashboard, [data-testid="dashboard"]', { timeout: 5000 });
        
        await page.screenshot({ 
          path: path.join(screenshotDir, '04-dashboard-loaded.png'),
          fullPage: true 
        });
        
        // Try to access admin panel
        console.log('🔧 Testing admin access...');
        
        try {
          await page.goto('http://localhost:3003/admin', { 
            waitUntil: 'networkidle2',
            timeout: 10000 
          });
          
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          await page.screenshot({ 
            path: path.join(screenshotDir, '05-admin-panel.png'),
            fullPage: true 
          });
          
          const adminUrl = page.url();
          if (adminUrl.includes('/admin') && !adminUrl.includes('/login')) {
            console.log('✅ Admin access confirmed');
            testResult.success = true;
            testResult.message = 'Login successful with admin access';
            testResult.details.adminAccess = true;
          } else {
            console.log('⚠️  Admin access denied');
            testResult.message = 'Login successful but no admin access';
            testResult.details.adminAccess = false;
          }
          
        } catch (adminError) {
          console.log('⚠️  Could not test admin access:', adminError.message);
          testResult.message = 'Login successful, admin test failed';
          testResult.details.adminAccess = 'test_failed';
        }
        
      } catch (dashboardError) {
        console.log('⚠️  Dashboard content did not load properly:', dashboardError.message);
        testResult.message = 'Redirected to dashboard but content loading failed';
      }
      
    } else if (currentUrl.includes('/login')) {
      // Still on login page - check for errors
      console.log('❌ Still on login page - checking for errors...');
      
      try {
        const errorElement = await page.$('[class*="bg-red"], [class*="error"], .error-message');
        if (errorElement) {
          const errorText = await page.evaluate(el => el.textContent, errorElement);
          console.log('❌ Error message found:', errorText);
          testResult.message = `Login failed: ${errorText}`;
        } else {
          testResult.message = 'Login failed: No error message displayed';
        }
      } catch (e) {
        testResult.message = 'Login failed: Could not check for error messages';
      }
      
    } else {
      testResult.message = `Unexpected redirect to: ${currentUrl}`;
    }
    
    // Test logout functionality if login was successful
    if (testResult.success) {
      console.log('🚪 Testing logout functionality...');
      
      try {
        // Look for logout button/link
        const logoutSelector = await page.$('button:contains("Sign out"), a:contains("Sign out"), button:contains("Logout"), a:contains("Logout")');
        
        if (logoutSelector) {
          await logoutSelector.click();
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const postLogoutUrl = page.url();
          await page.screenshot({ 
            path: path.join(screenshotDir, '06-post-logout.png'),
            fullPage: true 
          });
          
          testResult.details.logoutTest = {
            success: postLogoutUrl.includes('/login'),
            finalUrl: postLogoutUrl
          };
          
          console.log(testResult.details.logoutTest.success ? '✅ Logout successful' : '⚠️  Logout may have failed');
        } else {
          console.log('⚠️  No logout button found');
          testResult.details.logoutTest = { success: false, reason: 'No logout button found' };
        }
        
      } catch (logoutError) {
        console.log('⚠️  Logout test failed:', logoutError.message);
        testResult.details.logoutTest = { success: false, error: logoutError.message };
      }
    }
    
    // Save detailed test report
    const reportPath = path.join(screenshotDir, 'test-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(testResult, null, 2));
    console.log(`📊 Test report saved to: ${reportPath}`);
    
    return testResult;
    
  } catch (error) {
    console.error('💥 Test failed with error:', error.message);
    
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
    
    return {
      success: false,
      message: `Test error: ${error.message}`,
      details: {
        error: error.message,
        stack: error.stack
      }
    };
    
  } finally {
    if (browser) {
      console.log('🔄 Closing browser...');
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
}

// Run the test
if (require.main === module) {
  testAdminLogin()
    .then(result => {
      console.log('\n📊 COMPREHENSIVE TEST RESULTS:');
      console.log('==========================================');
      console.log('Success:', result.success ? '✅ PASSED' : '❌ FAILED');
      console.log('Message:', result.message);
      
      if (result.details) {
        console.log('\nDetails:');
        console.log('- Auth Response Status:', result.details.authResponse || 'N/A');
        console.log('- Final URL:', result.details.currentUrl || 'N/A');
        console.log('- Admin Access:', result.details.adminAccess || 'Not tested');
        console.log('- Errors Found:', result.details.errors?.length || 0);
        console.log('- Network Requests:', result.details.networkRequests?.length || 0);
        
        if (result.details.logoutTest) {
          console.log('- Logout Test:', result.details.logoutTest.success ? '✅ Passed' : '❌ Failed');
        }
      }
      
      console.log('==========================================');
      
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = testAdminLogin;