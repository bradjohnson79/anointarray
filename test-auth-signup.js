#!/usr/bin/env node

const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs').promises;

// Configuration for testing signup flow
const CONFIG = {
  baseUrl: 'https://anointarray.com',
  testEmail: `test-admin-${Date.now()}@anoint.me`,
  testPassword: 'TestAdmin123!',
  screenshotDir: path.join(__dirname, 'test-screenshots-signup'),
  timeout: 30000,
  viewport: { width: 1920, height: 1080 }
};

class SignupTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.results = [];
  }

  async setup() {
    console.log('🚀 Testing ANOINT Array Signup Flow...\n');
    
    // Ensure screenshot directory exists
    try {
      await fs.mkdir(CONFIG.screenshotDir, { recursive: true });
    } catch (error) {
      console.log('Screenshot directory already exists or created');
    }

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: false,
      defaultViewport: CONFIG.viewport,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    this.page = await this.browser.newPage();
    await this.page.setViewport(CONFIG.viewport);

    // Enable console and error logging
    this.page.on('console', msg => {
      console.log(`🔍 Console ${msg.type()}: ${msg.text()}`);
    });

    this.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      if (status >= 400) {
        console.log(`🔴 HTTP ${status}: ${url}`);
      } else if (url.includes('auth') || url.includes('token')) {
        console.log(`✅ HTTP ${status}: ${url}`);
      }
    });
  }

  async takeScreenshot(filename) {
    const screenshotPath = path.join(CONFIG.screenshotDir, `${filename}.png`);
    await this.page.screenshot({
      path: screenshotPath,
      fullPage: true
    });
    console.log(`📸 Screenshot saved: ${screenshotPath}`);
    return screenshotPath;
  }

  async testSignupFlow() {
    console.log('📝 Testing Signup Flow...');

    try {
      // Navigate to signup page
      console.log('  → Navigating to signup page...');
      await this.page.goto(`${CONFIG.baseUrl}/signup`, { 
        waitUntil: 'networkidle2' 
      });

      await this.takeScreenshot('01-signup-page');

      // Check if signup page exists or redirects to different signup
      const currentUrl = this.page.url();
      console.log(`  → Current URL: ${currentUrl}`);

      // Look for signup form elements
      const signupElements = await this.page.evaluate(() => {
        return {
          hasEmailField: !!document.querySelector('input[type="email"], input[name="email"], input[placeholder*="email" i]'),
          hasPasswordField: !!document.querySelector('input[type="password"], input[name="password"], input[placeholder*="password" i]'),
          hasSignupButton: !!document.querySelector('button:contains("Sign Up"), button:contains("Register"), button[type="submit"]'),
          hasSignupLink: !!document.querySelector('a[href*="signup"], a[href*="register"]'),
          formCount: document.querySelectorAll('form').length
        };
      });

      console.log('  → Signup elements found:', signupElements);

      // If no signup form, try to find signup link from login page
      if (!signupElements.hasEmailField) {
        console.log('  → No signup form found, checking for signup link...');
        
        // Go to login page and look for signup link
        await this.page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
        await this.takeScreenshot('02-login-page-for-signup-link');

        const signupLink = await this.page.$('a[href*="signup"], a[href*="register"], a:contains("Sign up"), a:contains("Create account")');
        
        if (signupLink) {
          console.log('  → Found signup link, clicking...');
          await signupLink.click();
          await this.page.waitForNavigation({ waitUntil: 'networkidle2' });
          await this.takeScreenshot('03-after-signup-link');
        } else {
          console.log('  ❌ No signup form or link found');
          return false;
        }
      }

      // Try to fill signup form if it exists
      const emailField = await this.page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const passwordField = await this.page.$('input[type="password"], input[name="password"], input[placeholder*="password" i]');

      if (emailField && passwordField) {
        console.log('  → Filling signup form...');
        await emailField.type(CONFIG.testEmail);
        await passwordField.type(CONFIG.testPassword);

        await this.takeScreenshot('04-signup-form-filled');

        // Look for signup button
        const buttons = await this.page.$$('button');
        let signupButton = null;

        for (const button of buttons) {
          const text = await this.page.evaluate(el => el.textContent?.trim().toLowerCase(), button);
          if (text && (text.includes('sign up') || text.includes('register') || text.includes('create'))) {
            signupButton = button;
            break;
          }
        }

        if (signupButton) {
          console.log('  → Clicking signup button...');
          await signupButton.click();
          
          // Wait for response or redirect
          try {
            await Promise.race([
              this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }),
              this.page.waitForSelector('.success, .error, .message', { timeout: 10000 })
            ]);
          } catch (error) {
            console.log('  → No immediate redirect or message, continuing...');
          }

          await this.takeScreenshot('05-after-signup-submit');
          
          const finalUrl = this.page.url();
          console.log(`  → Final URL after signup: ${finalUrl}`);
          
          return true;
        }
      }

      console.log('  ❌ Could not complete signup flow');
      return false;

    } catch (error) {
      console.log(`❌ Signup test failed: ${error.message}`);
      await this.takeScreenshot('error-signup');
      return false;
    }
  }

  async testLoginWithNewAccount() {
    console.log('🔐 Testing Login with Test Account...');

    try {
      // Navigate to login page
      await this.page.goto(`${CONFIG.baseUrl}/login`, { waitUntil: 'networkidle2' });
      await this.takeScreenshot('06-login-with-test-account');

      // Fill login form with test credentials
      const emailField = await this.page.$('input[type="email"], input[name="email"], input[placeholder*="email" i]');
      const passwordField = await this.page.$('input[type="password"], input[name="password"], input[placeholder*="password" i]');

      if (emailField && passwordField) {
        await emailField.clear();
        await emailField.type(CONFIG.testEmail);
        await passwordField.clear();
        await passwordField.type(CONFIG.testPassword);

        await this.takeScreenshot('07-test-login-filled');

        // Submit login
        const buttons = await this.page.$$('button');
        for (const button of buttons) {
          const text = await this.page.evaluate(el => el.textContent?.trim(), button);
          if (text && text.includes('Sign In')) {
            await button.click();
            break;
          }
        }

        // Wait for auth response
        try {
          await Promise.race([
            this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }),
            this.page.waitForSelector('[data-testid="dashboard"], .dashboard, .admin', { timeout: 15000 })
          ]);

          await this.takeScreenshot('08-after-test-login');
          
          const loginUrl = this.page.url();
          console.log(`  → Login result URL: ${loginUrl}`);
          
          return !loginUrl.includes('/login');

        } catch (error) {
          console.log(`  → Login timeout or failed: ${error.message}`);
          await this.takeScreenshot('09-login-timeout');
          return false;
        }
      }

    } catch (error) {
      console.log(`❌ Login test failed: ${error.message}`);
      return false;
    }
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
    }
  }

  async run() {
    try {
      await this.setup();
      
      console.log(`📧 Test Email: ${CONFIG.testEmail}`);
      console.log(`🔒 Test Password: ${CONFIG.testPassword}\n`);

      const signupResult = await this.testSignupFlow();
      console.log(`📝 Signup Result: ${signupResult ? 'SUCCESS' : 'FAILED'}\n`);

      if (signupResult) {
        const loginResult = await this.testLoginWithNewAccount();
        console.log(`🔐 Login Result: ${loginResult ? 'SUCCESS' : 'FAILED'}\n`);
      }

      console.log('✅ Test completed. Check screenshots in:', CONFIG.screenshotDir);

    } catch (error) {
      console.error('💥 Test failed:', error);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the test
if (require.main === module) {
  const tester = new SignupTester();
  tester.run();
}

module.exports = SignupTester;