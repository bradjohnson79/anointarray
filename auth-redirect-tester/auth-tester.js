#!/usr/bin/env node

const { chromium } = require('playwright');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
require('dotenv').config();

class AuthRedirectTester {
  constructor(options = {}) {
    this.baseUrl = options.baseUrl || 'https://anointarray.com';
    this.credentials = {
      email: 'info@anoint.me',
      password: 'AdminPassword123'
    };
    
    this.config = {
      testInterval: options.interval || 2 * 60 * 1000, // 2 minutes
      timeout: options.timeout || 30000, // 30 seconds
      headless: options.headless !== false,
      continuous: options.continuous || false,
      maxRetries: options.maxRetries || 3,
      logFile: options.logFile || path.join(__dirname, 'auth-test.log'),
      reportFile: options.reportFile || path.join(__dirname, 'test-report.json')
    };
    
    this.stats = {
      totalTests: 0,
      successfulTests: 0,
      failedTests: 0,
      startTime: new Date(),
      lastSuccessfulTest: null,
      lastFailedTest: null,
      averageResponseTime: 0,
      responseTimes: []
    };
    
    this.isRunning = false;
    this.browser = null;
    this.context = null;
    
    // Setup graceful shutdown
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  async initialize() {
    try {
      this.log('🚀 Initializing Auth Redirect Tester...', 'info');
      
      // Create logs directory if it doesn't exist
      await fs.ensureDir(path.dirname(this.config.logFile));
      await fs.ensureDir(path.dirname(this.config.reportFile));
      
      // Launch browser
      this.browser = await chromium.launch({
        headless: this.config.headless,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-web-security'
        ]
      });
      
      this.log(`✅ Browser launched (headless: ${this.config.headless})`, 'success');
      this.log(`🎯 Target URL: ${this.baseUrl}`, 'info');
      this.log(`👤 Test user: ${this.credentials.email}`, 'info');
      this.log(`⏱️  Test interval: ${this.config.testInterval / 1000}s`, 'info');
      
      return true;
    } catch (error) {
      this.log(`❌ Failed to initialize: ${error.message}`, 'error');
      throw error;
    }
  }

  async runSingleTest() {
    const testId = `test-${Date.now()}`;
    const startTime = Date.now();
    
    let page = null;
    let testResult = {
      testId,
      timestamp: new Date().toISOString(),
      success: false,
      duration: 0,
      steps: [],
      errors: [],
      responseTime: 0,
      redirectTime: 0,
      adminDashboardLoadTime: 0
    };

    try {
      this.log(`🧪 Starting test: ${testId}`, 'info');
      
      // Create new context and page for each test
      this.context = await this.browser.newContext({
        viewport: { width: 1920, height: 1080 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      });
      
      page = await this.context.newPage();
      
      // Enable console logging
      page.on('console', msg => {
        if (msg.type() === 'error') {
          testResult.errors.push(`Console Error: ${msg.text()}`);
          this.log(`🔍 Console Error: ${msg.text()}`, 'warn');
        }
      });

      // Enable error tracking
      page.on('pageerror', error => {
        testResult.errors.push(`Page Error: ${error.message}`);
        this.log(`🚨 Page Error: ${error.message}`, 'error');
      });

      // Step 1: Navigate to login page
      const step1Start = Date.now();
      testResult.steps.push({ step: 'navigate_to_login', status: 'started', timestamp: new Date().toISOString() });
      
      await page.goto(`${this.baseUrl}/login`, { 
        waitUntil: 'networkidle',
        timeout: this.config.timeout 
      });
      
      const step1Duration = Date.now() - step1Start;
      testResult.steps.push({ 
        step: 'navigate_to_login', 
        status: 'completed', 
        duration: step1Duration,
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ Step 1: Navigated to login page (${step1Duration}ms)`, 'success');

      // Step 2: Fill in credentials
      testResult.steps.push({ step: 'fill_credentials', status: 'started', timestamp: new Date().toISOString() });
      
      // Wait for email field and fill it
      const emailSelector = 'input[type="email"]';
      await page.waitForSelector(emailSelector, { timeout: 10000 });
      await page.fill(emailSelector, this.credentials.email);
      
      // Wait for password field and fill it
      const passwordSelector = 'input[type="password"]';
      await page.waitForSelector(passwordSelector, { timeout: 10000 });
      await page.fill(passwordSelector, this.credentials.password);
      
      testResult.steps.push({ 
        step: 'fill_credentials', 
        status: 'completed',
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ Step 2: Filled in credentials`, 'success');

      // Step 3: Submit login form
      const step3Start = Date.now();
      testResult.steps.push({ step: 'submit_login', status: 'started', timestamp: new Date().toISOString() });
      
      // Click submit button
      const submitSelector = 'button[type="submit"]';
      await page.waitForSelector(submitSelector, { timeout: 10000 });
      
      // Wait for navigation after clicking submit
      const navigationPromise = page.waitForURL(/\/(admin|dashboard)/, { timeout: 15000 });
      await page.click(submitSelector);
      
      this.log(`🔄 Step 3: Submitted login form, waiting for redirect...`, 'info');
      
      // Wait for the redirect
      await navigationPromise;
      const currentUrl = page.url();
      const step3Duration = Date.now() - step3Start;
      testResult.responseTime = step3Duration;
      
      testResult.steps.push({ 
        step: 'submit_login', 
        status: 'completed', 
        duration: step3Duration,
        redirectUrl: currentUrl,
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ Step 3: Login submitted and redirected (${step3Duration}ms)`, 'success');
      this.log(`🎯 Current URL: ${currentUrl}`, 'info');

      // Step 4: Verify admin redirect
      const step4Start = Date.now();
      testResult.steps.push({ step: 'verify_admin_redirect', status: 'started', timestamp: new Date().toISOString() });
      
      if (!currentUrl.includes('/admin')) {
        throw new Error(`Expected admin redirect, but got: ${currentUrl}`);
      }
      
      testResult.redirectTime = Date.now() - step4Start;
      testResult.steps.push({ 
        step: 'verify_admin_redirect', 
        status: 'completed', 
        duration: testResult.redirectTime,
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ Step 4: Confirmed admin redirect to ${currentUrl}`, 'success');

      // Step 5: Verify admin dashboard loads
      const step5Start = Date.now();
      testResult.steps.push({ step: 'verify_admin_dashboard', status: 'started', timestamp: new Date().toISOString() });
      
      // Wait for admin dashboard specific elements
      const adminIndicators = [
        'text=Admin Dashboard',
        'text=Total Orders',
        'text=Daily Revenue',
        'text=System Alerts'
      ];
      
      for (const indicator of adminIndicators) {
        try {
          await page.waitForSelector(indicator, { timeout: 5000 });
          this.log(`✅ Found admin dashboard element: ${indicator}`, 'success');
        } catch (error) {
          this.log(`⚠️  Admin dashboard element not found: ${indicator}`, 'warn');
          testResult.errors.push(`Missing admin dashboard element: ${indicator}`);
        }
      }
      
      // Check for admin-specific content
      const adminTitle = await page.textContent('h1').catch(() => null);
      if (adminTitle && adminTitle.includes('Admin Dashboard')) {
        this.log(`✅ Admin Dashboard title confirmed: ${adminTitle}`, 'success');
      } else {
        testResult.errors.push(`Admin Dashboard title not found or incorrect: ${adminTitle}`);
      }
      
      testResult.adminDashboardLoadTime = Date.now() - step5Start;
      testResult.steps.push({ 
        step: 'verify_admin_dashboard', 
        status: 'completed', 
        duration: testResult.adminDashboardLoadTime,
        adminTitle,
        timestamp: new Date().toISOString()
      });
      
      this.log(`✅ Step 5: Admin dashboard verified and loaded (${testResult.adminDashboardLoadTime}ms)`, 'success');

      // Test completed successfully
      testResult.success = true;
      testResult.duration = Date.now() - startTime;
      
      this.stats.successfulTests++;
      this.stats.lastSuccessfulTest = new Date();
      this.stats.responseTimes.push(testResult.responseTime);
      
      this.log(`🎉 Test ${testId} completed successfully in ${testResult.duration}ms`, 'success');
      
    } catch (error) {
      testResult.success = false;
      testResult.duration = Date.now() - startTime;
      testResult.errors.push(`Test failed: ${error.message}`);
      
      this.stats.failedTests++;
      this.stats.lastFailedTest = new Date();
      
      this.log(`❌ Test ${testId} failed: ${error.message}`, 'error');
      
      // Take screenshot on failure
      if (page) {
        try {
          const screenshotPath = path.join(__dirname, `screenshots/failure-${testId}.png`);
          await fs.ensureDir(path.dirname(screenshotPath));
          await page.screenshot({ path: screenshotPath, fullPage: true });
          testResult.screenshot = screenshotPath;
          this.log(`📸 Screenshot saved: ${screenshotPath}`, 'info');
        } catch (screenshotError) {
          this.log(`Failed to take screenshot: ${screenshotError.message}`, 'warn');
        }
      }
    } finally {
      // Clean up
      if (page) {
        await page.close().catch(() => {});
      }
      if (this.context) {
        await this.context.close().catch(() => {});
        this.context = null;
      }
      
      // Update stats
      this.stats.totalTests++;
      if (this.stats.responseTimes.length > 0) {
        this.stats.averageResponseTime = this.stats.responseTimes.reduce((a, b) => a + b, 0) / this.stats.responseTimes.length;
      }
      
      // Save test result
      await this.saveTestResult(testResult);
      
      return testResult;
    }
  }

  async runContinuousTests() {
    this.isRunning = true;
    this.log(`🔄 Starting continuous testing (interval: ${this.config.testInterval / 1000}s)`, 'info');
    
    while (this.isRunning) {
      try {
        await this.runSingleTest();
        
        // Print current stats
        this.printStats();
        
        if (this.isRunning && this.config.continuous) {
          this.log(`⏳ Waiting ${this.config.testInterval / 1000}s until next test...`, 'info');
          await this.sleep(this.config.testInterval);
        }
        
      } catch (error) {
        this.log(`💥 Continuous test error: ${error.message}`, 'error');
        
        if (this.isRunning) {
          this.log(`⏳ Waiting ${this.config.testInterval / 1000}s before retry...`, 'info');
          await this.sleep(this.config.testInterval);
        }
      }
    }
  }

  async saveTestResult(result) {
    try {
      // Save to log file
      const logEntry = `[${result.timestamp}] Test ${result.testId}: ${result.success ? 'PASS' : 'FAIL'} (${result.duration}ms)\n`;
      await fs.appendFile(this.config.logFile, logEntry);
      
      // Save detailed report
      let reports = [];
      try {
        const existingReports = await fs.readFile(this.config.reportFile, 'utf8');
        reports = JSON.parse(existingReports);
      } catch (error) {
        // File doesn't exist or is invalid, start fresh
        reports = [];
      }
      
      reports.push(result);
      
      // Keep only last 100 reports
      if (reports.length > 100) {
        reports = reports.slice(-100);
      }
      
      await fs.writeFile(this.config.reportFile, JSON.stringify(reports, null, 2));
      
      // Save stats
      const statsFile = path.join(path.dirname(this.config.reportFile), 'stats.json');
      await fs.writeFile(statsFile, JSON.stringify(this.stats, null, 2));
      
    } catch (error) {
      this.log(`Failed to save test result: ${error.message}`, 'error');
    }
  }

  printStats() {
    const uptime = Date.now() - this.stats.startTime.getTime();
    const successRate = this.stats.totalTests > 0 ? ((this.stats.successfulTests / this.stats.totalTests) * 100).toFixed(1) : 0;
    
    console.log(chalk.cyan('\n📊 === TEST STATISTICS ==='));
    console.log(chalk.white(`Total Tests: ${this.stats.totalTests}`));
    console.log(chalk.green(`Successful: ${this.stats.successfulTests}`));
    console.log(chalk.red(`Failed: ${this.stats.failedTests}`));
    console.log(chalk.blue(`Success Rate: ${successRate}%`));
    console.log(chalk.yellow(`Average Response Time: ${Math.round(this.stats.averageResponseTime)}ms`));
    console.log(chalk.magenta(`Uptime: ${this.formatDuration(uptime)}`));
    
    if (this.stats.lastSuccessfulTest) {
      console.log(chalk.green(`Last Success: ${this.stats.lastSuccessfulTest.toLocaleString()}`));
    }
    if (this.stats.lastFailedTest) {
      console.log(chalk.red(`Last Failure: ${this.stats.lastFailedTest.toLocaleString()}`));
    }
    console.log(chalk.cyan('========================\n'));
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    const colors = {
      info: chalk.blue,
      success: chalk.green,
      warn: chalk.yellow,
      error: chalk.red
    };
    
    const coloredMessage = colors[level] ? colors[level](message) : message;
    console.log(`[${timestamp}] ${coloredMessage}`);
    
    // Also write to file
    const logEntry = `[${timestamp}] [${level.toUpperCase()}] ${message}\n`;
    fs.appendFileSync(this.config.logFile, logEntry).catch(() => {});
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async shutdown() {
    this.log('🛑 Shutting down Auth Redirect Tester...', 'info');
    this.isRunning = false;
    
    if (this.context) {
      await this.context.close().catch(() => {});
    }
    
    if (this.browser) {
      await this.browser.close().catch(() => {});
    }
    
    this.log('👋 Goodbye!', 'info');
    process.exit(0);
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    continuous: args.includes('--continuous'),
    headless: !args.includes('--headed'),
    single: args.includes('--single'),
    interval: 2 * 60 * 1000 // 2 minutes
  };
  
  // Override interval if specified
  const intervalArg = args.find(arg => arg.startsWith('--interval='));
  if (intervalArg) {
    const intervalSeconds = parseInt(intervalArg.split('=')[1]);
    if (intervalSeconds > 0) {
      options.interval = intervalSeconds * 1000;
    }
  }

  const tester = new AuthRedirectTester(options);
  
  try {
    await tester.initialize();
    
    if (options.single || !options.continuous) {
      const result = await tester.runSingleTest();
      tester.printStats();
      console.log(chalk.cyan(`\n📋 Full test report saved to: ${tester.config.reportFile}`));
      console.log(chalk.cyan(`📋 Test logs saved to: ${tester.config.logFile}`));
      process.exit(result.success ? 0 : 1);
    } else {
      await tester.runContinuousTests();
    }
  } catch (error) {
    console.error(chalk.red(`Fatal error: ${error.message}`));
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}

module.exports = AuthRedirectTester;