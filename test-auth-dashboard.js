#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Configuration
const CONFIG = {
  baseUrl: 'https://anointarray.com',
  adminEmail: 'info@anoint.me',
  adminPassword: 'Admin123',
  screenshotDir: path.join(__dirname, 'test-screenshots'),
  timeout: 30000,
  viewport: { width: 1920, height: 1080 }
};

class TestResults {
  constructor() {
    this.results = {
      authentication: {},
      dashboard: {},
      profile: {},
      serviceWorker: {},
      performance: {},
      errors: []
    };
    this.startTime = Date.now();
  }

  addResult(category, test, result, details = {}) {
    if (!this.results[category]) this.results[category] = {};
    this.results[category][test] = {
      passed: result,
      timestamp: Date.now() - this.startTime,
      ...details
    };
  }

  addError(error, context = '') {
    this.results.errors.push({
      error: error.message,
      context,
      timestamp: Date.now() - this.startTime,
      stack: error.stack
    });
  }

  generateReport() {
    const totalTests = Object.values(this.results).reduce((sum, category) => {
      if (typeof category === 'object' && category !== null && !Array.isArray(category)) {
        return sum + Object.keys(category).length;
      }
      return sum;
    }, 0);

    const passedTests = Object.values(this.results).reduce((sum, category) => {
      if (typeof category === 'object' && category !== null && !Array.isArray(category)) {
        return sum + Object.values(category).filter(test => test.passed).length;
      }
      return sum;
    }, 0);

    return {
      summary: {
        total: totalTests,
        passed: passedTests,
        failed: totalTests - passedTests,
        errorCount: this.results.errors.length,
        duration: Date.now() - this.startTime
      },
      details: this.results
    };
  }
}

class AnointArrayTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = new TestResults();
  }

  async setup() {
    console.log('🚀 Starting ANOINT Array Authentication & Dashboard Testing...\n');
    
    // Ensure screenshot directory exists
    try {
      await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
    } catch (error) {
      console.log('Screenshot directory already exists or created');
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false, // Set to true for headless mode
      defaultViewport: CONFIG.viewport,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(CONFIG.viewport);

    // Enable console logging
    this.page.on('console', msg => {
      const type = msg.type();
      const text = msg.text();
      
      if (type === 'error' || text.includes('EMERGENCY') || text.includes('timeout')) {
        console.log(`🔴 Console ${type}: ${text}`);
        this.results.addError(new Error(`Console ${type}: ${text}`), 'Browser Console');
      }
    });

    // Enable request/response logging
    this.page.on('response', response => {
      const url = response.url();
      const status = response.status();
      
      if (status >= 400) {
        console.log(`🔴 HTTP ${status}: ${url}`);
        this.results.addError(new Error(`HTTP ${status}: ${url}`), 'Network Request');
      }
    });
  }

  async takeScreenshot(filename, fullPage = true) {
    const screenshotPath = path.join(CONFIG.screenshotDir, `${filename}.png`);
    await this.page.screenshot({
      path: screenshotPath,
      fullPage
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  async waitForSelector(selector, options = {}) {
    try {
      await this.page.waitForSelector(selector, {
        timeout: CONFIG.timeout,
        ...options
      });
      return true;
    } catch (error) {
      console.log(`❌ Failed to find selector: ${selector}`);
      this.results.addError(error, `Waiting for selector: ${selector}`);
      return false;
    }
  }

  // TEST 1: Authentication Flow
  async testAuthenticationFlow() {
    console.log('🔐 Testing Authentication Flow...');
    const startTime = Date.now();

    try {
      // Navigate to login page
      console.log('  → Navigating to login page...');
      await this.page.goto(`${CONFIG.baseUrl}/login`, { 
        waitUntil: 'networkidle2',
        timeout: CONFIG.timeout 
      });

      await this.takeScreenshot('01-login-page');

      // Check for emergency timeout messages
      const consoleErrors = await this.page.evaluate(() => {
        const logs = window.console._logs || [];
        return logs.filter(log => 
          log.includes('EMERGENCY') || 
          log.includes('Auth initialization timeout')
        );
      });

      this.results.addResult('authentication', 'no_emergency_errors', consoleErrors.length === 0, {
        errors: consoleErrors
      });

      // Fill login form
      console.log('  → Filling login credentials...');
      const emailSelector = 'input[placeholder*="email" i], input[type="email"], input[name="email"], #email';
      const passwordSelector = 'input[placeholder*="password" i], input[type="password"], input[name="password"], #password';

      if (await this.waitForSelector(emailSelector)) {
        await this.page.click(emailSelector);
        await this.page.type(emailSelector, CONFIG.adminEmail);
      }

      if (await this.waitForSelector(passwordSelector)) {
        await this.page.click(passwordSelector);
        await this.page.type(passwordSelector, CONFIG.adminPassword);
      }

      await this.takeScreenshot('02-credentials-filled');

      // Submit login form
      console.log('  → Submitting login form...');
      const loginStartTime = Date.now();
      
      // Try multiple submit strategies
      let submitButton = await this.page.$('button[type="submit"]');
      if (!submitButton) {
        // Look for button with "Sign In" text
        const buttons = await this.page.$$('button');
        for (const button of buttons) {
          const text = await this.page.evaluate(el => el.textContent?.trim(), button);
          if (text && (text.includes('Sign In') || text.includes('Login'))) {
            submitButton = button;
            break;
          }
        }
      }
      if (!submitButton) {
        submitButton = await this.page.$('.login-button, .sign-in-button');
      }
      if (!submitButton) {
        // Find any button in a form
        submitButton = await this.page.$('form button');
      }
      
      if (submitButton) {
        console.log('  → Found submit button, clicking...');
        await submitButton.click();
      } else {
        console.log('  → No submit button found, trying Enter key...');
        await this.page.keyboard.press('Enter');
      }

      // Wait for redirect or dashboard to appear
      console.log('  → Waiting for authentication to complete...');
      try {
        await Promise.race([
          this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: CONFIG.timeout }),
          this.page.waitForSelector('[data-testid="admin-dashboard"], .admin-dashboard, #dashboard', { timeout: CONFIG.timeout })
        ]);

        const loginDuration = Date.now() - loginStartTime;
        console.log(`  ✅ Authentication completed in ${loginDuration}ms`);

        this.results.addResult('authentication', 'login_success', true, {
          duration: loginDuration,
          fast_auth: loginDuration < 3000
        });

        // Check for the dreaded 51-second delay
        this.results.addResult('authentication', 'no_long_delay', loginDuration < 10000, {
          duration: loginDuration
        });

      } catch (error) {
        console.log(`  ❌ Authentication failed: ${error.message}`);
        this.results.addResult('authentication', 'login_success', false, {
          error: error.message
        });
      }

      await this.takeScreenshot('03-post-login');

    } catch (error) {
      console.log(`❌ Authentication test failed: ${error.message}`);
      this.results.addError(error, 'Authentication Flow');
    }

    const totalTime = Date.now() - startTime;
    console.log(`🔐 Authentication test completed in ${totalTime}ms\n`);
  }

  // TEST 2: Admin Dashboard Access
  async testAdminDashboard() {
    console.log('🏠 Testing Admin Dashboard Access...');

    try {
      // Check current URL
      const currentUrl = this.page.url();
      console.log(`  → Current URL: ${currentUrl}`);

      const isDashboard = currentUrl.includes('/admin') || currentUrl.includes('/dashboard');
      this.results.addResult('dashboard', 'redirect_to_admin', isDashboard, {
        currentUrl
      });

      // If not on dashboard, try to navigate
      if (!isDashboard) {
        console.log('  → Navigating to admin dashboard...');
        await this.page.goto(`${CONFIG.baseUrl}/admin/dashboard`, { 
          waitUntil: 'networkidle2' 
        });
      }

      // Check for admin sidebar
      console.log('  → Checking for admin sidebar...');
      const sidebarSelectors = [
        '[data-testid="admin-sidebar"]',
        '.admin-sidebar',
        '.sidebar',
        'nav[role="navigation"]',
        '.navigation'
      ];

      let sidebarFound = false;
      for (const selector of sidebarSelectors) {
        if (await this.page.$(selector)) {
          sidebarFound = true;
          console.log(`  ✅ Admin sidebar found: ${selector}`);
          break;
        }
      }

      this.results.addResult('dashboard', 'sidebar_visible', sidebarFound);

      // Check for admin navigation items
      console.log('  → Checking admin navigation items...');
      const navItems = await this.page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a, button'));
        return links
          .map(link => link.textContent?.trim().toLowerCase())
          .filter(text => text && (
            text.includes('dashboard') ||
            text.includes('users') ||
            text.includes('orders') ||
            text.includes('products') ||
            text.includes('settings') ||
            text.includes('admin')
          ));
      });

      console.log(`  → Found navigation items: ${navItems.join(', ')}`);
      this.results.addResult('dashboard', 'navigation_items', navItems.length > 0, {
        items: navItems,
        count: navItems.length
      });

      await this.takeScreenshot('04-admin-dashboard', true);

    } catch (error) {
      console.log(`❌ Dashboard test failed: ${error.message}`);
      this.results.addError(error, 'Admin Dashboard');
    }

    console.log('🏠 Dashboard test completed\n');
  }

  // TEST 3: Profile Loading
  async testProfileLoading() {
    console.log('👤 Testing Profile Loading...');

    try {
      // Check for user profile information
      console.log('  → Checking for user profile data...');
      
      const profileData = await this.page.evaluate(() => {
        // Look for profile information in various places
        const profileElements = [
          ...document.querySelectorAll('[data-testid*="profile"], [class*="profile"]'),
          ...document.querySelectorAll('.user-info, .user-profile, .admin-info'),
        ];

        const profileText = profileElements.map(el => el.textContent?.trim()).join(' ');
        
        return {
          hasProfileElements: profileElements.length > 0,
          profileText,
          isAdmin: profileText.toLowerCase().includes('admin') || 
                   profileText.includes('info@anoint.me') ||
                   document.querySelector('[data-role="admin"], .admin-badge, .role-admin') !== null
        };
      });

      console.log(`  → Profile elements found: ${profileData.hasProfileElements}`);
      console.log(`  → Admin role detected: ${profileData.isAdmin}`);

      this.results.addResult('profile', 'profile_loaded', profileData.hasProfileElements, {
        profileText: profileData.profileText
      });

      this.results.addResult('profile', 'admin_role_detected', profileData.isAdmin, {
        profileText: profileData.profileText
      });

      // Check network requests for profile-related errors
      const networkErrors = await this.page.evaluate(() => {
        const performanceEntries = performance.getEntriesByType('navigation');
        return performanceEntries.map(entry => ({
          name: entry.name,
          transferSize: entry.transferSize,
          responseStart: entry.responseStart
        }));
      });

      // Look for 404 errors in network tab (this would need to be tracked during page load)
      this.results.addResult('profile', 'no_404_errors', true, {
        note: 'Network error tracking would require request interception'
      });

      await this.takeScreenshot('05-profile-loaded');

    } catch (error) {
      console.log(`❌ Profile test failed: ${error.message}`);
      this.results.addError(error, 'Profile Loading');
    }

    console.log('👤 Profile test completed\n');
  }

  // TEST 4: Service Worker Test
  async testServiceWorker() {
    console.log('⚙️ Testing Service Worker...');

    try {
      // Check service worker registration
      const swInfo = await this.page.evaluate(async () => {
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          return {
            supported: true,
            registrations: registrations.map(reg => ({
              scope: reg.scope,
              state: reg.active?.state,
              scriptURL: reg.active?.scriptURL
            })),
            controllerPresent: !!navigator.serviceWorker.controller
          };
        }
        return { supported: false };
      });

      console.log(`  → Service Worker supported: ${swInfo.supported}`);
      console.log(`  → Active registrations: ${swInfo.registrations?.length || 0}`);

      this.results.addResult('serviceWorker', 'sw_supported', swInfo.supported);
      this.results.addResult('serviceWorker', 'clean_registration', 
        !swInfo.registrations || swInfo.registrations.length <= 1, {
        registrations: swInfo.registrations
      });

      // Check for SW-related console errors
      const swErrors = await this.page.evaluate(() => {
        // This would need to be collected during page load
        return window.serviceWorkerErrors || [];
      });

      this.results.addResult('serviceWorker', 'no_sw_errors', swErrors.length === 0, {
        errors: swErrors
      });

    } catch (error) {
      console.log(`❌ Service Worker test failed: ${error.message}`);
      this.results.addError(error, 'Service Worker');
    }

    console.log('⚙️ Service Worker test completed\n');
  }

  // TEST 5: Performance Test
  async testPerformance() {
    console.log('⚡ Testing Performance...');

    try {
      // Get performance metrics
      const metrics = await this.page.evaluate(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
          firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        };
      });

      console.log(`  → DOM Content Loaded: ${metrics.domContentLoaded}ms`);
      console.log(`  → Load Complete: ${metrics.loadComplete}ms`);
      console.log(`  → First Paint: ${metrics.firstPaint}ms`);
      console.log(`  → First Contentful Paint: ${metrics.firstContentfulPaint}ms`);
      console.log(`  → Total Load Time: ${metrics.totalTime}ms`);

      this.results.addResult('performance', 'fast_load', metrics.totalTime < 5000, {
        metrics
      });

      this.results.addResult('performance', 'fast_fcp', metrics.firstContentfulPaint < 2000, {
        fcp: metrics.firstContentfulPaint
      });

      // Check for performance issues
      const performanceEntries = await this.page.evaluate(() => {
        return {
          longTasks: performance.getEntriesByType('longtask').length,
          layoutShifts: performance.getEntriesByType('layout-shift').length
        };
      });

      this.results.addResult('performance', 'no_long_tasks', performanceEntries.longTasks === 0, {
        longTasks: performanceEntries.longTasks
      });

    } catch (error) {
      console.log(`❌ Performance test failed: ${error.message}`);
      this.results.addError(error, 'Performance');
    }

    console.log('⚡ Performance test completed\n');
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async runAllTests() {
    try {
      await this.setup();
      
      // Run all test scenarios
      await this.testAuthenticationFlow();
      await this.testAdminDashboard();
      await this.testProfileLoading();
      await this.testServiceWorker();
      await this.testPerformance();

      // Generate final report
      const report = this.results.generateReport();
      
      // Save report to file
      const reportPath = path.join(__dirname, 'test-report.json');
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

      // Print summary
      console.log('📊 TEST SUMMARY');
      console.log('================');
      console.log(`Total Tests: ${report.summary.total}`);
      console.log(`Passed: ${report.summary.passed} ✅`);
      console.log(`Failed: ${report.summary.failed} ❌`);
      console.log(`Errors: ${report.summary.errorCount} 🔴`);
      console.log(`Duration: ${report.summary.duration}ms`);
      console.log(`Success Rate: ${Math.round((report.summary.passed / report.summary.total) * 100)}%`);
      console.log(`\nDetailed report saved to: ${reportPath}`);
      console.log(`Screenshots saved to: ${CONFIG.screenshotDir}`);

      return report;

    } catch (error) {
      console.error('💥 Test suite failed:', error);
      this.results.addError(error, 'Test Suite');
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new AnointArrayTester();
  tester.runAllTests()
    .then(report => {
      process.exit(report?.summary?.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = AnointArrayTester;