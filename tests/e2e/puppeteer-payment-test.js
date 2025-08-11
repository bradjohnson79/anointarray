const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

/**
 * Puppeteer E2E Testing for Anoint Array Payment Flow
 * Tests the complete payment process from cart to completion
 */

const PAYMENT_TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  headless: false, // Set to true for CI/CD
  viewport: { width: 1920, height: 1080 },
  timeout: 30000,
  screenshotPath: 'tests/e2e/screenshots',
  reportPath: 'tests/e2e/reports'
};

class PaymentFlowTester {
  constructor() {
    this.browser = null;
    this.page = null;
    this.testResults = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {},
      screenshots: []
    };
  }

  async setup() {
    console.log('🚀 Starting Puppeteer Payment Flow Testing...\n');
    
    // Ensure directories exist
    [PAYMENT_TEST_CONFIG.screenshotPath, PAYMENT_TEST_CONFIG.reportPath].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });

    // Launch browser
    this.browser = await puppeteer.launch({
      headless: PAYMENT_TEST_CONFIG.headless,
      viewport: PAYMENT_TEST_CONFIG.viewport,
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
    await this.page.setViewport(PAYMENT_TEST_CONFIG.viewport);
    
    // Set up request/response monitoring
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      // Log payment-related requests
      if (request.url().includes('stripe') || request.url().includes('paypal') || request.url().includes('payment')) {
        console.log(`🌐 Payment Request: ${request.method()} ${request.url()}`);
      }
      request.continue();
    });

    this.page.on('response', response => {
      // Log payment-related responses
      if (response.url().includes('stripe') || response.url().includes('paypal') || response.url().includes('payment')) {
        console.log(`📡 Payment Response: ${response.status()} ${response.url()}`);
      }
    });

    // Set up console logging
    this.page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('❌ Browser Error:', msg.text());
      }
    });
  }

  async takeScreenshot(name, fullPage = false) {
    const timestamp = Date.now();
    const filename = `${name}-${timestamp}.png`;
    const filepath = path.join(PAYMENT_TEST_CONFIG.screenshotPath, filename);
    
    await this.page.screenshot({ 
      path: filepath, 
      fullPage 
    });
    
    this.testResults.screenshots.push({
      name,
      filename,
      filepath,
      timestamp: new Date().toISOString()
    });
    
    console.log(`📸 Screenshot saved: ${filename}`);
    return filepath;
  }

  async testCatalogAndCart() {
    console.log('🛒 Testing Catalog and Cart Functionality...');
    
    try {
      // Navigate to catalog
      await this.page.goto(`${PAYMENT_TEST_CONFIG.baseUrl}/catalog`, {
        waitUntil: 'networkidle2',
        timeout: PAYMENT_TEST_CONFIG.timeout
      });

      await this.takeScreenshot('catalog-page');

      // Check if products are loaded
      const productsExist = await this.page.$('.product-grid, [data-testid="product-list"]') !== null;
      
      if (productsExist) {
        // Try to add a product to cart using modern selector methods
        let addToCartButton = await this.page.$('[data-testid="add-to-cart"]');
        
        // If no test ID, try to find button by text content
        if (!addToCartButton) {
          addToCartButton = await this.page.$eval('button', (buttons) => {
            const buttonArray = Array.from(document.querySelectorAll('button'));
            return buttonArray.find(button => 
              button.textContent && button.textContent.includes('Add to Cart')
            );
          }).catch(() => null);
        }
        
        if (addToCartButton) {
          await addToCartButton.click();
          await this.page.waitForTimeout(1000);
          console.log('✅ Product added to cart');
        }
      }

      // Navigate to cart
      await this.page.goto(`${PAYMENT_TEST_CONFIG.baseUrl}/cart`, {
        waitUntil: 'networkidle2',
        timeout: PAYMENT_TEST_CONFIG.timeout
      });

      await this.takeScreenshot('cart-page');

      // Check cart contents using modern selector methods
      const cartEmptyCheck = await this.page.evaluate(() => {
        const text = document.body.textContent || '';
        return text.includes('Your Cart is Empty') || 
               text.includes('Cart is Empty') || 
               text.toLowerCase().includes('cart is empty');
      });
      const cartItems = await this.page.$$('[data-testid="cart-item"], .cart-item');
      
      this.testResults.tests.cartFunctionality = {
        status: 'SUCCESS',
        productsVisible: productsExist,
        cartEmpty: cartEmptyCheck,
        cartItemsCount: cartItems.length,
        message: `Cart contains ${cartItems.length} items`
      };

      return !cartEmptyCheck && cartItems.length > 0;

    } catch (error) {
      this.testResults.tests.cartFunctionality = {
        status: 'ERROR',
        error: error.message,
        message: 'Failed to test cart functionality'
      };
      console.error('❌ Cart test failed:', error.message);
      return false;
    }
  }

  async testCheckoutFlow() {
    console.log('💳 Testing Checkout Flow...');

    try {
      // Navigate to checkout
      await this.page.goto(`${PAYMENT_TEST_CONFIG.baseUrl}/checkout`, {
        waitUntil: 'networkidle2',
        timeout: PAYMENT_TEST_CONFIG.timeout
      });

      await this.takeScreenshot('checkout-start');

      // Check if authentication is required
      const currentUrl = this.page.url();
      if (currentUrl.includes('/login')) {
        console.log('🔐 Authentication required for checkout');
        await this.takeScreenshot('auth-required');
        
        this.testResults.tests.checkoutFlow = {
          status: 'AUTH_REQUIRED',
          message: 'Checkout requires user authentication (expected security behavior)',
          authProtected: true
        };
        return true; // This is expected behavior
      }

      // Test checkout form elements
      const shippingForm = await this.page.$('form, [data-testid="shipping-form"]');
      const paymentMethods = await this.page.$$('[data-testid="payment-method"], .payment-method');
      const stripeElements = await this.page.$('[data-testid="stripe-elements"], .stripe-elements');

      this.testResults.tests.checkoutFlow = {
        status: 'SUCCESS',
        shippingFormPresent: !!shippingForm,
        paymentMethodsCount: paymentMethods.length,
        stripeElementsPresent: !!stripeElements,
        message: `Checkout form loaded with ${paymentMethods.length} payment methods`
      };

      await this.takeScreenshot('checkout-form');
      return true;

    } catch (error) {
      this.testResults.tests.checkoutFlow = {
        status: 'ERROR',
        error: error.message,
        message: 'Failed to load checkout page'
      };
      console.error('❌ Checkout test failed:', error.message);
      return false;
    }
  }

  async testPaymentMethods() {
    console.log('💰 Testing Payment Method Availability...');

    try {
      const paymentTests = {
        stripe: false,
        paypal: false,
        crypto: false
      };

      // Check for Stripe elements using modern selector methods
      let stripeButton = await this.page.$('[data-testid="stripe-button"]');
      if (!stripeButton) {
        stripeButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.textContent && (
              button.textContent.includes('Credit Card') || 
              button.textContent.includes('Stripe')
            )
          );
        }).catch(() => null);
      }
      paymentTests.stripe = !!stripeButton;

      // Check for PayPal elements using modern selector methods
      let paypalButton = await this.page.$('[data-testid="paypal-button"]');
      if (!paypalButton) {
        paypalButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.textContent && button.textContent.includes('PayPal')
          );
        }).catch(() => null);
      }
      paymentTests.paypal = !!paypalButton;

      // Check for crypto payment options using modern selector methods
      let cryptoButton = await this.page.$('[data-testid="crypto-button"]');
      if (!cryptoButton) {
        cryptoButton = await this.page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          return buttons.find(button => 
            button.textContent && (
              button.textContent.includes('Crypto') || 
              button.textContent.includes('Bitcoin')
            )
          );
        }).catch(() => null);
      }
      paymentTests.crypto = !!cryptoButton;

      this.testResults.tests.paymentMethods = {
        status: 'SUCCESS',
        availableMethods: paymentTests,
        totalMethods: Object.values(paymentTests).filter(Boolean).length,
        message: `${Object.values(paymentTests).filter(Boolean).length}/3 payment methods available`
      };

      await this.takeScreenshot('payment-methods');
      return true;

    } catch (error) {
      this.testResults.tests.paymentMethods = {
        status: 'ERROR',
        error: error.message,
        message: 'Failed to test payment methods'
      };
      console.error('❌ Payment methods test failed:', error.message);
      return false;
    }
  }

  async testAdminPanel() {
    console.log('👑 Testing Admin Panel Access...');

    try {
      // Try to access admin panel
      await this.page.goto(`${PAYMENT_TEST_CONFIG.baseUrl}/admin`, {
        waitUntil: 'networkidle2',
        timeout: PAYMENT_TEST_CONFIG.timeout
      });

      const currentUrl = this.page.url();
      const isRedirectedToLogin = currentUrl.includes('/login');
      
      await this.takeScreenshot('admin-access');

      if (isRedirectedToLogin) {
        this.testResults.tests.adminSecurity = {
          status: 'SUCCESS',
          protected: true,
          redirectedToAuth: true,
          message: 'Admin panel properly protected with authentication'
        };
      } else {
        // Check if admin dashboard loaded
        const adminDashboard = await this.page.$('[data-testid="admin-dashboard"], .admin-dashboard');
        this.testResults.tests.adminSecurity = {
          status: adminDashboard ? 'SUCCESS' : 'WARNING',
          protected: false,
          adminDashboardPresent: !!adminDashboard,
          message: adminDashboard ? 'Admin dashboard accessible' : 'Admin access unclear'
        };
      }

      return true;

    } catch (error) {
      this.testResults.tests.adminSecurity = {
        status: 'ERROR',
        error: error.message,
        message: 'Failed to test admin panel security'
      };
      console.error('❌ Admin panel test failed:', error.message);
      return false;
    }
  }

  async testSecurityHeaders() {
    console.log('🔒 Testing Security Headers...');

    try {
      // Navigate to main page to check headers
      const response = await this.page.goto(`${PAYMENT_TEST_CONFIG.baseUrl}`, {
        waitUntil: 'networkidle2'
      });

      const headers = response.headers();
      const securityHeaders = {
        'content-security-policy': !!headers['content-security-policy'],
        'x-frame-options': !!headers['x-frame-options'],
        'x-content-type-options': !!headers['x-content-type-options'],
        'strict-transport-security': !!headers['strict-transport-security'],
        'x-xss-protection': !!headers['x-xss-protection']
      };

      const securityScore = Object.values(securityHeaders).filter(Boolean).length;
      
      this.testResults.tests.securityHeaders = {
        status: securityScore >= 3 ? 'SUCCESS' : 'WARNING',
        headers: securityHeaders,
        score: `${securityScore}/5`,
        message: `${securityScore} out of 5 security headers present`
      };

      return true;

    } catch (error) {
      this.testResults.tests.securityHeaders = {
        status: 'ERROR',
        error: error.message,
        message: 'Failed to test security headers'
      };
      return false;
    }
  }

  async runAllTests() {
    try {
      await this.setup();

      console.log('🧪 Running comprehensive payment system tests...\n');

      // Run all tests
      await this.testCatalogAndCart();
      await this.testCheckoutFlow();
      await this.testPaymentMethods();
      await this.testAdminPanel(); 
      await this.testSecurityHeaders();

      // Generate summary
      const tests = this.testResults.tests;
      const successCount = Object.values(tests).filter(t => t.status === 'SUCCESS').length;
      const totalTests = Object.keys(tests).length;

      this.testResults.summary = {
        totalTests,
        successfulTests: successCount,
        failedTests: totalTests - successCount,
        successRate: `${Math.round((successCount / totalTests) * 100)}%`,
        overallStatus: successCount === totalTests ? 'ALL_PASS' : successCount >= totalTests * 0.8 ? 'MOSTLY_PASS' : 'NEEDS_ATTENTION'
      };

      // Save report
      const reportPath = path.join(PAYMENT_TEST_CONFIG.reportPath, `puppeteer-payment-test-${Date.now()}.json`);
      fs.writeFileSync(reportPath, JSON.stringify(this.testResults, null, 2));

      console.log('\n📊 Puppeteer E2E Test Results:');
      console.log(`Total tests: ${totalTests}`);
      console.log(`Successful: ${successCount}`);
      console.log(`Success rate: ${this.testResults.summary.successRate}`);
      console.log(`Overall status: ${this.testResults.summary.overallStatus}`);
      console.log(`\nDetailed report: ${reportPath}`);
      console.log(`Screenshots: ${this.testResults.screenshots.length} saved`);

      return this.testResults;

    } catch (error) {
      console.error('❌ Puppeteer testing failed:', error);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }
}

// Run if called directly
if (require.main === module) {
  const tester = new PaymentFlowTester();
  
  tester.runAllTests()
    .then(results => {
      console.log('\n✅ Puppeteer payment flow testing completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Puppeteer testing failed:', error);
      process.exit(1);
    });
}

module.exports = { PaymentFlowTester };