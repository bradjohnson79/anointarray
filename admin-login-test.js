const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false, slowMo: 1000 });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    console.log('BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  page.on('pageerror', error => {
    console.log('PAGE ERROR:', error.message);
  });
  
  page.on('requestfailed', request => {
    console.log('REQUEST FAILED:', request.url(), request.failure().errorText);
  });
  
  try {
    console.log('=== ADMIN LOGIN TEST STARTING ===');
    
    // Navigate to login page
    console.log('1. Navigating to login page...');
    await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
    
    console.log('Current page title:', await page.title());
    
    // Wait for login form to load
    console.log('2. Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    await page.waitForSelector('input[type="password"]', { timeout: 10000 });
    
    // Fill in admin credentials
    console.log('3. Entering admin credentials...');
    await page.type('input[type="email"]', 'info@anoint.me');
    await page.type('input[type="password"]', 'Admin123');
    
    // Take screenshot before clicking
    await page.screenshot({ path: 'before-login.png' });
    
    // Click sign in button
    console.log('4. Clicking sign in button...');
    const signInButton = await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
    await signInButton.click();
    
    // Wait for response and check for redirect or errors
    console.log('5. Waiting for authentication response...');
    await page.waitForTimeout(5000);
    
    const currentUrl = page.url();
    console.log('Current URL after login attempt:', currentUrl);
    
    // Take screenshot after login attempt
    await page.screenshot({ path: 'after-login.png' });
    
    // Check if we're redirected to dashboard
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Redirected to dashboard');
      
      // Check for admin badge by looking for text content
      console.log('6. Checking for admin badge...');
      const pageContent = await page.content();
      if (pageContent.includes('Admin') || pageContent.includes('admin')) {
        console.log('✅ SUCCESS: Admin content found on page');
      } else {
        console.log('❌ WARNING: No admin content found');
      }
      
      // Check for admin panel access button
      console.log('7. Looking for admin panel button...');
      const adminButtonExists = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(button => 
          button.textContent.includes('Admin') || 
          button.textContent.includes('admin')
        );
      });
      
      if (adminButtonExists) {
        console.log('✅ SUCCESS: Admin button found');
        
        // Try to click admin button
        await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const adminButton = buttons.find(button => 
            button.textContent.includes('Admin') || 
            button.textContent.includes('admin')
          );
          if (adminButton) adminButton.click();
        });
        
        await page.waitForTimeout(3000);
        
        const adminUrl = page.url();
        console.log('URL after admin button click:', adminUrl);
        
        if (adminUrl.includes('/admin')) {
          console.log('✅ SUCCESS: Admin panel accessible');
        } else {
          console.log('❌ WARNING: Admin panel may not be accessible');
        }
      } else {
        console.log('❌ WARNING: Admin panel button not found');
      }
      
    } else {
      console.log('❌ ERROR: Login failed - still on login page or other page');
      
      // Check for error messages
      const errorElements = await page.$$('[class*="error"], [class*="alert"]');
      if (errorElements.length > 0) {
        console.log('Error elements found:', errorElements.length);
        for (let element of errorElements) {
          const text = await element.textContent();
          if (text.trim()) {
            console.log('Error message:', text);
          }
        }
      }
    }
    
    // Test logout
    console.log('8. Testing logout functionality...');
    const logoutButton = await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const logoutBtn = buttons.find(button => 
        button.textContent.includes('Logout') || 
        button.textContent.includes('Sign out') ||
        button.textContent.includes('Log out')
      );
      return !!logoutBtn;
    });
    
    if (logoutButton) {
      console.log('✅ SUCCESS: Logout button found');
    } else {
      console.log('❌ WARNING: Logout button not found');
    }
    
  } catch (error) {
    console.log('❌ TEST ERROR:', error.message);
    console.log('Stack trace:', error.stack);
  }
  
  console.log('=== TEST COMPLETED ===');
  await browser.close();
})();