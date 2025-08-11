const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Track all network requests
  const requests = [];
  const responses = [];
  
  page.on('request', request => {
    requests.push({
      url: request.url(),
      method: request.method(),
      headers: request.headers(),
      postData: request.postData()
    });
    console.log(`📤 REQUEST: ${request.method()} ${request.url()}`);
  });
  
  page.on('response', response => {
    responses.push({
      url: response.url(),
      status: response.status(),
      headers: response.headers()
    });
    console.log(`📥 RESPONSE: ${response.status()} ${response.url()}`);
  });
  
  // Capture console messages with our debug messages
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Attempting login') || text.includes('Authentication') || text.includes('error') || text.includes('Error')) {
      console.log(`🖥️  IMPORTANT CONSOLE: ${msg.type()} ${text}`);
    }
  });
  
  try {
    console.log('🔍 DETAILED ADMIN LOGIN TEST');
    console.log('============================');
    
    console.log('1️⃣  Navigating to login page...');
    await page.goto('http://localhost:3001/login', { 
      waitUntil: 'networkidle0',
      timeout: 15000 
    });
    
    console.log('2️⃣  Waiting for form to be ready...');
    await page.waitForSelector('input[type="email"]', { visible: true });
    await page.waitForSelector('input[type="password"]', { visible: true });
    await page.waitForSelector('button[type="submit"]', { visible: true });
    
    console.log('3️⃣  Filling form fields...');
    await page.focus('input[type="email"]');
    await page.type('input[type="email"]', 'info@anoint.me', { delay: 50 });
    
    await page.focus('input[type="password"]');
    await page.type('input[type="password"]', 'Admin123', { delay: 50 });
    
    // Check form values were set correctly
    const formData = await page.evaluate(() => {
      const email = document.querySelector('input[type="email"]').value;
      const password = document.querySelector('input[type="password"]').value;
      return { email, password };
    });
    console.log('   Form data:', formData);
    
    console.log('4️⃣  Submitting form...');
    
    // Start monitoring for responses
    const authResponse = page.waitForResponse(response => 
      response.url().includes('/api/auth') || response.url().includes('/auth')
    ).catch(() => null);
    
    // Click submit button
    await page.click('button[type="submit"]');
    
    console.log('5️⃣  Waiting for auth response...');
    const response = await Promise.race([
      authResponse,
      new Promise(resolve => setTimeout(() => resolve(null), 10000))
    ]);
    
    if (response) {
      console.log(`✅ Auth response received: ${response.status()} ${response.url()}`);
      try {
        const responseText = await response.text();
        console.log('   Response body:', responseText.substring(0, 200));
      } catch (e) {
        console.log('   Could not read response body');
      }
    } else {
      console.log('❌ No auth response received within timeout');
    }
    
    // Wait a bit more for navigation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const finalUrl = page.url();
    console.log('6️⃣  Final URL:', finalUrl);
    
    // Check for error messages on the page
    const errorMessages = await page.evaluate(() => {
      const messages = [];
      const selectors = [
        '[class*="error"]', 
        '[class*="alert"]', 
        '.text-red-500', 
        '.text-red-600',
        '[role="alert"]',
        '.error',
        '.alert'
      ];
      
      selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
          const text = el.textContent.trim();
          if (text && !messages.includes(text)) {
            messages.push(text);
          }
        });
      });
      
      return messages;
    });
    
    if (errorMessages.length > 0) {
      console.log('🚨 Error messages found:', errorMessages);
    }
    
    // Summary
    console.log('============================');
    if (finalUrl.includes('/dashboard')) {
      console.log('✅ LOGIN SUCCESSFUL - Redirected to dashboard');
    } else if (finalUrl.includes('/login')) {
      console.log('❌ LOGIN FAILED - Still on login page');
    } else {
      console.log(`🤔 UNEXPECTED RESULT - On page: ${finalUrl}`);
    }
    
    console.log('\n📊 NETWORK SUMMARY:');
    const authRequests = requests.filter(req => req.url.includes('/api/auth') || req.url.includes('/auth'));
    console.log(`   Auth requests made: ${authRequests.length}`);
    authRequests.forEach((req, i) => {
      console.log(`   ${i + 1}. ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`      Data: ${req.postData.substring(0, 100)}`);
      }
    });
    
  } catch (error) {
    console.log('💥 TEST ERROR:', error.message);
  } finally {
    await browser.close();
  }
})();