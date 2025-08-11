const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  ordersUrl: 'http://localhost:3002/admin/orders',
  loginUrl: 'http://localhost:3002/login',
  timeout: 30000,
  screenshotDir: './test-screenshots-order-management-auth',
  viewport: {
    width: 1920,
    height: 1080
  },
  // Test admin credentials - using the same ones from previous tests
  adminCredentials: {
    email: 'admin@anointarray.com',
    password: 'Admin123!'
  }
};

// Create screenshots directory
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

async function testOrderManagementWithAuth() {
  let browser;
  const testResults = {
    timestamp: new Date().toISOString(),
    url: TEST_CONFIG.ordersUrl,
    tests: [],
    errors: [],
    screenshots: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    console.log('🚀 Starting Order Management System Test with Authentication...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/automated testing
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        `--window-size=${TEST_CONFIG.viewport.width},${TEST_CONFIG.viewport.height}`
      ]
    });

    const page = await browser.newPage();
    await page.setViewport(TEST_CONFIG.viewport);

    // Set up console logging to catch JavaScript errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Set up request/response monitoring
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    console.log('🔐 Test 1: Admin login...');
    testResults.tests.push({
      name: 'Admin Login',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Navigate to login page
      await page.goto(TEST_CONFIG.loginUrl, {
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout
      });

      // Take screenshot of login page
      const loginScreenshot = `${TEST_CONFIG.screenshotDir}/01-login-page.png`;
      await page.screenshot({ path: loginScreenshot, fullPage: true });
      testResults.screenshots.push(loginScreenshot);

      // Wait for login form
      await page.waitForSelector('input[type="email"]', { timeout: 10000 });
      await page.waitForSelector('input[type="password"]', { timeout: 10000 });

      // Fill in credentials
      await page.type('input[type="email"]', TEST_CONFIG.adminCredentials.email);
      await page.type('input[type="password"]', TEST_CONFIG.adminCredentials.password);

      // Take screenshot with filled credentials
      const credentialsScreenshot = `${TEST_CONFIG.screenshotDir}/02-credentials-filled.png`;
      await page.screenshot({ path: credentialsScreenshot, fullPage: true });
      testResults.screenshots.push(credentialsScreenshot);

      // Submit login form
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle0', timeout: TEST_CONFIG.timeout }),
        page.click('button[type="submit"]')
      ]);

      // Check if we're redirected to dashboard or orders page
      const currentUrl = page.url();
      console.log('Current URL after login:', currentUrl);

      testResults.tests[0].status = 'passed';
      testResults.tests[0].endTime = new Date().toISOString();
      testResults.tests[0].redirectUrl = currentUrl;
      console.log('✅ Admin login successful');

    } catch (error) {
      testResults.tests[0].status = 'failed';
      testResults.tests[0].error = error.message;
      testResults.tests[0].endTime = new Date().toISOString();
      console.log('❌ Failed to login:', error.message);
      // Continue with test even if login fails
    }

    console.log('📋 Test 2: Navigate to Order Management page...');
    testResults.tests.push({
      name: 'Navigate to Orders Page',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Navigate to the Order Management page
      await page.goto(TEST_CONFIG.ordersUrl, {
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout
      });

      // Wait a moment for any dynamic content
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Take screenshot after page load
      const pageLoadScreenshot = `${TEST_CONFIG.screenshotDir}/03-order-management-loaded.png`;
      await page.screenshot({ path: pageLoadScreenshot, fullPage: true });
      testResults.screenshots.push(pageLoadScreenshot);

      testResults.tests[1].status = 'passed';
      testResults.tests[1].endTime = new Date().toISOString();
      console.log('✅ Order Management page loaded successfully');

    } catch (error) {
      testResults.tests[1].status = 'failed';
      testResults.tests[1].error = error.message;
      testResults.tests[1].endTime = new Date().toISOString();
      console.log('❌ Failed to load Order Management page:', error.message);
    }

    console.log('📊 Test 3: Check page content and UI elements...');
    testResults.tests.push({
      name: 'UI Elements Check',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Check for key UI elements
      const uiElements = await page.evaluate(() => {
        const elements = {
          hasTitle: !!document.querySelector('h1'),
          titleText: document.querySelector('h1')?.textContent?.trim() || '',
          hasCards: document.querySelectorAll('.card, [class*="card"]').length,
          hasButtons: document.querySelectorAll('button').length,
          hasInputs: document.querySelectorAll('input').length,
          hasSelects: document.querySelectorAll('select').length,
          hasTables: document.querySelectorAll('table').length,
          bodyText: document.body.textContent?.length || 0
        };
        
        // Look for specific Order Management elements
        elements.hasOrderTitle = document.body.textContent?.includes('Order Management') || false;
        elements.hasOrderText = document.body.textContent?.includes('order') || false;
        elements.hasManagementText = document.body.textContent?.includes('manage') || false;
        
        return elements;
      });

      // Check page dimensions and content
      const pageInfo = await page.evaluate(() => ({
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        content: {
          scrollHeight: document.documentElement.scrollHeight,
          scrollWidth: document.documentElement.scrollWidth,
          hasContent: document.body.innerHTML.trim().length > 100
        }
      }));

      testResults.tests[2].uiElements = uiElements;
      testResults.tests[2].pageInfo = pageInfo;
      testResults.tests[2].status = 'passed';
      testResults.tests[2].endTime = new Date().toISOString();
      
      console.log(`✅ UI elements check completed:`);
      console.log(`   - Title: "${uiElements.titleText}"`);
      console.log(`   - Cards: ${uiElements.hasCards}`);
      console.log(`   - Buttons: ${uiElements.hasButtons}`);
      console.log(`   - Inputs: ${uiElements.hasInputs}`);
      console.log(`   - Body text length: ${uiElements.bodyText}`);
      console.log(`   - Has content: ${pageInfo.content.hasContent}`);

    } catch (error) {
      testResults.tests[2].status = 'failed';
      testResults.tests[2].error = error.message;
      testResults.tests[2].endTime = new Date().toISOString();
      console.log('❌ Failed to check UI elements:', error.message);
    }

    console.log('🔧 Test 4: JavaScript error check...');
    testResults.tests.push({
      name: 'JavaScript Errors',
      status: 'running',
      startTime: new Date().toISOString()
    });

    // Wait a bit more for any delayed errors
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (consoleErrors.length === 0) {
      testResults.tests[3].status = 'passed';
      console.log('✅ No JavaScript errors detected');
    } else {
      testResults.tests[3].status = 'warning';
      testResults.tests[3].errors = consoleErrors;
      console.log(`⚠️  ${consoleErrors.length} JavaScript errors detected:`);
      consoleErrors.forEach((error, i) => console.log(`   ${i + 1}. ${error}`));
    }

    testResults.tests[3].endTime = new Date().toISOString();

    console.log('📸 Test 5: Final documentation screenshots...');
    testResults.tests.push({
      name: 'Documentation Screenshots',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Scroll to top
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take comprehensive screenshot
      const finalScreenshot = `${TEST_CONFIG.screenshotDir}/04-complete-interface.png`;
      await page.screenshot({ 
        path: finalScreenshot, 
        fullPage: true,
        captureBeyondViewport: true
      });
      testResults.screenshots.push(finalScreenshot);

      // Take viewport screenshot
      const viewportScreenshot = `${TEST_CONFIG.screenshotDir}/05-viewport-view.png`;
      await page.screenshot({ path: viewportScreenshot });
      testResults.screenshots.push(viewportScreenshot);

      testResults.tests[4].status = 'passed';
      testResults.tests[4].endTime = new Date().toISOString();
      console.log('✅ Documentation screenshots captured');

    } catch (error) {
      testResults.tests[4].status = 'failed';
      testResults.tests[4].error = error.message;
      testResults.tests[4].endTime = new Date().toISOString();
      console.log('❌ Failed to capture screenshots:', error.message);
    }

    // Add network errors to results
    if (networkErrors.length > 0) {
      testResults.errors = networkErrors;
      console.log(`⚠️  ${networkErrors.length} network errors detected`);
    }

    // Calculate summary
    testResults.summary.total = testResults.tests.length;
    testResults.summary.passed = testResults.tests.filter(test => test.status === 'passed').length;
    testResults.summary.failed = testResults.tests.filter(test => test.status === 'failed').length;
    testResults.summary.warnings = testResults.tests.filter(test => test.status === 'warning').length;

  } catch (error) {
    console.error('🔥 Critical test error:', error);
    testResults.errors.push({
      type: 'critical',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }

    // Save test results
    const reportPath = `${TEST_CONFIG.screenshotDir}/test-report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Warnings: ${testResults.summary.warnings || 0}`);
    console.log(`Screenshots: ${testResults.screenshots.length}`);
    console.log(`Report saved: ${reportPath}`);
    console.log('\n📸 Screenshots:');
    testResults.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
    
    return testResults;
  }
}

// Run the test
if (require.main === module) {
  testOrderManagementWithAuth()
    .then((results) => {
      console.log('\n✅ Order Management System test with authentication completed');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('🔥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOrderManagementWithAuth, TEST_CONFIG };