const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Enable console logging to catch our debug messages
  page.on('console', msg => {
    console.log('🖥️  BROWSER CONSOLE:', msg.type(), msg.text());
  });
  
  page.on('response', response => {
    const url = response.url();
    const status = response.status();
    if (url.includes('api/auth') || status >= 400) {
      console.log(`📡 API RESPONSE: ${status} ${url}`);
    }
  });
  
  try {
    console.log('🔍 ADMIN LOGIN TEST - Quick Version');
    console.log('==================================');
    
    // Navigate to login page
    console.log('1️⃣  Navigating to login page...');
    const response = await page.goto('http://localhost:3001/login', { 
      waitUntil: 'domcontentloaded',
      timeout: 15000 
    });
    console.log(`   Status: ${response.status()}`);
    
    // Check if form elements exist
    console.log('2️⃣  Checking for login form elements...');
    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');
    const submitButton = await page.$('button[type="submit"]');
    
    if (!emailInput || !passwordInput || !submitButton) {
      console.log('❌ Login form elements not found');
      return;
    }
    console.log('✅ Login form elements found');
    
    // Fill credentials
    console.log('3️⃣  Entering admin credentials...');
    await page.type('input[type="email"]', 'info@anoint.me');
    await page.type('input[type="password"]', 'Admin123');
    
    console.log('4️⃣  Submitting login form...');
    
    // Listen for navigation after form submit
    const navigationPromise = page.waitForNavigation({ 
      waitUntil: 'domcontentloaded',
      timeout: 10000 
    }).catch(() => null);
    
    await page.click('button[type="submit"]');
    
    // Wait for either navigation or timeout
    await Promise.race([
      navigationPromise,
      new Promise(resolve => setTimeout(resolve, 8000))
    ]);
    
    const currentUrl = page.url();
    console.log('5️⃣  Current URL after login:', currentUrl);
    
    // Check results
    if (currentUrl.includes('/dashboard')) {
      console.log('✅ SUCCESS: Successfully redirected to dashboard');
      
      // Look for admin indicators
      const pageText = await page.evaluate(() => document.body.textContent);
      const hasAdminText = pageText.toLowerCase().includes('admin');
      
      console.log(`6️⃣  Admin content check: ${hasAdminText ? '✅ Found' : '❌ Not found'}`);
      
    } else if (currentUrl.includes('/login')) {
      console.log('❌ FAILED: Still on login page');
      
      // Check for error messages
      const errorMessages = await page.evaluate(() => {
        const errors = [];
        const errorElements = document.querySelectorAll('[class*="error"], .text-red, .text-danger, [role="alert"]');
        errorElements.forEach(el => {
          const text = el.textContent.trim();
          if (text) errors.push(text);
        });
        return errors;
      });
      
      if (errorMessages.length > 0) {
        console.log('🚨 Error messages found:', errorMessages);
      }
      
    } else {
      console.log('🤔 UNEXPECTED: Redirected to unexpected page');
    }
    
    console.log('==================================');
    console.log('🏁 Test completed');
    
  } catch (error) {
    console.log('💥 TEST ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();