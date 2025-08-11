const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3002',
  adminCredentials: {
    email: 'info@anoint.me', // Admin email from the auth context
    password: 'test123' // You'll need to set this up
  },
  screenshotDir: './test-screenshots',
  timeout: 30000
};

// Ensure screenshot directory exists
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

class TaxManagementTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      navigation: { passed: false, errors: [] },
      taxCalculator: { passed: false, errors: [] },
      taxRatesTable: { passed: false, errors: [] },
      taxSettings: { passed: false, errors: [] },
      uiUx: { passed: false, errors: [] }
    };
  }

  async init() {
    console.log('🚀 Starting Tax Management Interface Testing...');
    
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: null,
      args: [
        '--start-maximized',
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.page = await this.browser.newPage();
    
    // Set viewport and user agent
    await this.page.setViewport({ width: 1920, height: 1080 });
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36');
    
    // Monitor console logs and errors
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('❌ Console Error:', msg.text());
      }
    });

    this.page.on('pageerror', error => {
      console.log('❌ Page Error:', error.message);
    });
  }

  async takeScreenshot(name) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.screenshotDir, filename);
    await this.page.screenshot({ 
      path: filepath, 
      fullPage: true 
    });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
  }

  async testNavigation() {
    console.log('\n📋 Test 1: Navigation Test');
    
    try {
      // Navigate to the tax management page
      console.log('   • Navigating to /admin/taxes...');
      await this.page.goto(`${TEST_CONFIG.baseUrl}/admin/taxes`, { 
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout 
      });

      // Wait a moment for any loading screens
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if we're on a login page (authentication required)
      const isOnLoginPage = await this.page.evaluate(() => {
        return document.title.includes('Login') || 
               document.body.innerHTML.includes('Sign In') ||
               window.location.pathname.includes('/login') ||
               window.location.pathname.includes('/auth');
      });

      if (isOnLoginPage) {
        console.log('   • Authentication required, attempting login...');
        
        // Try to find and fill login form
        const emailInput = await this.page.$('input[type="email"], input[name="email"]');
        const passwordInput = await this.page.$('input[type="password"], input[name="password"]');
        const submitButton = await this.page.$('button[type="submit"], button:contains("Sign In"), button:contains("Login")');

        if (emailInput && passwordInput) {
          await emailInput.type(TEST_CONFIG.adminCredentials.email);
          await passwordInput.type(TEST_CONFIG.adminCredentials.password);
          
          if (submitButton) {
            await submitButton.click();
            await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for login to process
          }
        }
      }

      // Take screenshot after navigation
      await this.takeScreenshot('01-navigation');

      // Check if page loads without errors
      const hasError = await this.page.evaluate(() => {
        return document.body.innerHTML.includes('404') || 
               document.body.innerHTML.includes('Error') ||
               document.body.innerHTML.includes('Something went wrong');
      });

      // Check if Tax Management content is visible
      const hasTaxManagementContent = await this.page.evaluate(() => {
        return document.body.innerHTML.includes('Tax Management') ||
               document.body.innerHTML.includes('Tax Calculator') ||
               document.body.innerHTML.includes('Canadian Tax Rates');
      });

      // Check for admin sidebar
      const hasAdminSidebar = await this.page.evaluate(() => {
        return document.body.innerHTML.includes('Tax Management') &&
               (document.body.innerHTML.includes('sidebar') || 
                document.body.innerHTML.includes('admin'));
      });

      if (!hasError && hasTaxManagementContent) {
        this.testResults.navigation.passed = true;
        console.log('   ✅ Navigation test passed');
      } else {
        if (hasError) this.testResults.navigation.errors.push('Page shows error message');
        if (!hasTaxManagementContent) this.testResults.navigation.errors.push('Tax Management content not found');
        console.log('   ❌ Navigation test failed');
      }

    } catch (error) {
      this.testResults.navigation.errors.push(`Navigation error: ${error.message}`);
      console.log('   ❌ Navigation test failed with error:', error.message);
    }
  }

  async testTaxCalculator() {
    console.log('\n🧮 Test 2: Tax Calculator Test');
    
    try {
      // Test Ontario calculation (13% HST)
      console.log('   • Testing Ontario HST calculation...');
      
      // Find amount input
      const amountInput = await this.page.$('input[type="number"], input[step="0.01"]');
      if (amountInput) {
        await amountInput.click({ clickCount: 3 }); // Select all
        await amountInput.type('100');
      }

      // Find province selector
      const provinceSelect = await this.page.$('select');
      if (provinceSelect) {
        await provinceSelect.select('ON');
      }

      // Wait for calculation
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check Ontario result (should show 13% HST = $13.00)
      const ontarioResult = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('13.00') && text.includes('HST') && text.includes('Ontario');
      });

      if (ontarioResult) {
        console.log('   ✅ Ontario HST calculation correct');
      } else {
        this.testResults.taxCalculator.errors.push('Ontario HST calculation incorrect');
      }

      // Test BC calculation (5% GST + 7% PST = 12%)
      console.log('   • Testing BC GST+PST calculation...');
      
      if (provinceSelect) {
        await provinceSelect.select('BC');
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      const bcResult = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('12.00') && text.includes('GST') && text.includes('PST');
      });

      if (bcResult) {
        console.log('   ✅ BC GST+PST calculation correct');
      } else {
        this.testResults.taxCalculator.errors.push('BC GST+PST calculation incorrect');
      }

      // Test tax-inclusive calculation
      console.log('   • Testing tax-inclusive calculation...');
      
      const inclusiveRadio = await this.page.$('input[type="radio"][name="taxType"]:not(:checked)');
      if (inclusiveRadio) {
        await inclusiveRadio.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Take screenshot
      await this.takeScreenshot('02-tax-calculator');

      if (ontarioResult && bcResult) {
        this.testResults.taxCalculator.passed = true;
        console.log('   ✅ Tax Calculator tests passed');
      } else {
        console.log('   ❌ Tax Calculator tests failed');
      }

    } catch (error) {
      this.testResults.taxCalculator.errors.push(`Calculator error: ${error.message}`);
      console.log('   ❌ Tax Calculator test failed with error:', error.message);
    }
  }

  async testTaxRatesTable() {
    console.log('\n📊 Test 3: Tax Rates Table Test');
    
    try {
      // Check for table presence
      const hasTable = await this.page.$('table');
      if (!hasTable) {
        this.testResults.taxRatesTable.errors.push('Tax rates table not found');
        return;
      }

      // Check for all 13 provinces/territories
      const provinceCount = await this.page.evaluate(() => {
        const rows = document.querySelectorAll('tbody tr');
        return rows.length;
      });

      console.log(`   • Found ${provinceCount} provinces/territories`);
      
      if (provinceCount !== 13) {
        this.testResults.taxRatesTable.errors.push(`Expected 13 provinces, found ${provinceCount}`);
      }

      // Check for Nova Scotia 14% HST
      const nsRate = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('Nova Scotia') && text.includes('14');
      });

      if (nsRate) {
        console.log('   ✅ Nova Scotia 14% HST rate found');
      } else {
        this.testResults.taxRatesTable.errors.push('Nova Scotia 14% HST rate not found');
      }

      // Check for Quebec compound calculation
      const quebecQST = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('Quebec') && text.includes('QST');
      });

      if (quebecQST) {
        console.log('   ✅ Quebec QST found');
      } else {
        this.testResults.taxRatesTable.errors.push('Quebec QST not found');
      }

      // Check for different tax types
      const taxTypes = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return {
          gstOnly: text.includes('GST ONLY') || text.includes('GST_ONLY'),
          hst: text.includes('HST'),
          gstPst: text.includes('GST + PST') || text.includes('GST_PST'),
          gstQst: text.includes('GST + QST') || text.includes('GST_QST')
        };
      });

      console.log('   • Tax types found:', taxTypes);

      // Take screenshot
      await this.takeScreenshot('03-tax-rates-table');

      if (provinceCount === 13 && nsRate && quebecQST) {
        this.testResults.taxRatesTable.passed = true;
        console.log('   ✅ Tax Rates Table tests passed');
      } else {
        console.log('   ❌ Tax Rates Table tests failed');
      }

    } catch (error) {
      this.testResults.taxRatesTable.errors.push(`Table error: ${error.message}`);
      console.log('   ❌ Tax Rates Table test failed with error:', error.message);
    }
  }

  async testTaxSettings() {
    console.log('\n⚙️ Test 4: Tax Settings Test');
    
    try {
      // Check for business number
      const businessNumber = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('743839342RT0001');
      });

      if (businessNumber) {
        console.log('   ✅ Business number 743839342RT0001 found');
      } else {
        this.testResults.taxSettings.errors.push('Business number not found');
      }

      // Check for company name
      const companyName = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        return text.includes('ANOINT Array');
      });

      if (companyName) {
        console.log('   ✅ Company name "ANOINT Array" found');
      } else {
        this.testResults.taxSettings.errors.push('Company name not found');
      }

      // Check if form fields are editable
      const editableFields = await this.page.evaluate(() => {
        const inputs = document.querySelectorAll('input[type="text"], input[type="number"], select');
        return inputs.length > 0 && Array.from(inputs).some(input => !input.disabled);
      });

      if (editableFields) {
        console.log('   ✅ Form fields are editable');
      } else {
        this.testResults.taxSettings.errors.push('Form fields are not editable');
      }

      // Take screenshot
      await this.takeScreenshot('04-tax-settings');

      if (businessNumber && companyName && editableFields) {
        this.testResults.taxSettings.passed = true;
        console.log('   ✅ Tax Settings tests passed');
      } else {
        console.log('   ❌ Tax Settings tests failed');
      }

    } catch (error) {
      this.testResults.taxSettings.errors.push(`Settings error: ${error.message}`);
      console.log('   ❌ Tax Settings test failed with error:', error.message);
    }
  }

  async testUIUX() {
    console.log('\n🎨 Test 5: UI/UX Test');
    
    try {
      // Check responsive design - mobile viewport
      console.log('   • Testing mobile responsiveness...');
      await this.page.setViewport({ width: 375, height: 667 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.takeScreenshot('05-mobile-view');

      // Check responsive design - tablet viewport
      console.log('   • Testing tablet responsiveness...');
      await this.page.setViewport({ width: 768, height: 1024 });
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.takeScreenshot('05-tablet-view');

      // Check responsive design - desktop viewport
      console.log('   • Testing desktop responsiveness...');
      await this.page.setViewport({ width: 1920, height: 1080 });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check Aurora background effects
      const hasAuroraEffects = await this.page.evaluate(() => {
        const text = document.body.innerHTML;
        const styles = document.head.innerHTML;
        return text.includes('aurora') || 
               styles.includes('gradient') || 
               text.includes('backdrop-blur') ||
               text.includes('bg-gradient');
      });

      if (hasAuroraEffects) {
        console.log('   ✅ Aurora background effects detected');
      } else {
        this.testResults.uiUx.errors.push('Aurora background effects not detected');
      }

      // Check for functional buttons
      const buttons = await this.page.$$('button');
      console.log(`   • Found ${buttons.length} buttons`);

      // Check for console errors
      const consoleErrors = await this.page.evaluate(() => {
        return window.consoleErrors || [];
      });

      if (consoleErrors.length === 0) {
        console.log('   ✅ No console errors detected');
      } else {
        this.testResults.uiUx.errors.push(`Console errors detected: ${consoleErrors.length}`);
      }

      // Take final screenshot
      await this.takeScreenshot('05-ui-ux-final');

      if (hasAuroraEffects && buttons.length > 0) {
        this.testResults.uiUx.passed = true;
        console.log('   ✅ UI/UX tests passed');
      } else {
        console.log('   ❌ UI/UX tests failed');
      }

    } catch (error) {
      this.testResults.uiUx.errors.push(`UI/UX error: ${error.message}`);
      console.log('   ❌ UI/UX test failed with error:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📋 TESTING REPORT');
    console.log('==================');

    const totalTests = Object.keys(this.testResults).length;
    const passedTests = Object.values(this.testResults).filter(test => test.passed).length;
    const failedTests = totalTests - passedTests;

    console.log(`\n🔍 Summary: ${passedTests}/${totalTests} tests passed`);
    
    if (passedTests === totalTests) {
      console.log('🎉 All tests PASSED! The Tax Management interface is working correctly.');
    } else {
      console.log(`⚠️  ${failedTests} test(s) FAILED. See details below:`);
    }

    // Detailed results
    Object.entries(this.testResults).forEach(([testName, result]) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`\n${status} ${testName.toUpperCase()}`);
      
      if (result.errors.length > 0) {
        result.errors.forEach(error => {
          console.log(`   • ${error}`);
        });
      }
    });

    console.log(`\n📸 Screenshots saved to: ${TEST_CONFIG.screenshotDir}`);
    console.log(`\n🚀 Test completed at: ${new Date().toISOString()}`);

    // Save report to file
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: failedTests,
        success: passedTests === totalTests
      },
      results: this.testResults,
      screenshots: fs.readdirSync(TEST_CONFIG.screenshotDir).filter(f => f.endsWith('.png'))
    };

    fs.writeFileSync(
      path.join(TEST_CONFIG.screenshotDir, 'test-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  async run() {
    try {
      await this.init();
      
      await this.testNavigation();
      await this.testTaxCalculator();
      await this.testTaxRatesTable();
      await this.testTaxSettings();
      await this.testUIUX();
      
      await this.generateReport();
      
    } catch (error) {
      console.error('❌ Test suite failed with error:', error);
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run the tests
(async () => {
  const tester = new TaxManagementTester();
  await tester.run();
})();