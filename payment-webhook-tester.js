#!/usr/bin/env node

/**
 * Payment Webhook Integration Tester
 * 
 * This script tests payment webhook integrations for Stripe and PayPal
 * with proper signature verification and event handling.
 */

const crypto = require('crypto');
const https = require('https');

class PaymentWebhookTester {
  constructor(config) {
    this.config = config;
    this.results = [];
  }

  // Generate valid Stripe webhook signature
  generateStripeSignature(payload, secret, timestamp) {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${timestamp}.${payloadString}`)
      .digest('hex');
    
    return `t=${timestamp},v1=${signature}`;
  }

  // Generate mock PayPal webhook headers
  generatePayPalHeaders() {
    return {
      'PAYPAL-AUTH-ALGO': 'SHA256withRSA',
      'PAYPAL-TRANSMISSION-ID': crypto.randomUUID(),
      'PAYPAL-CERT-ID': 'CERT-360caa42-fca2a594-a5cafa77',
      'PAYPAL-TRANSMISSION-SIG': 'mock-signature-' + crypto.randomBytes(16).toString('hex')
    };
  }

  // Test Stripe webhook scenarios
  async testStripeWebhooks() {
    console.log('\n💳 Testing Stripe Webhook Integration...\n');

    const testSecret = 'whsec_test_' + crypto.randomBytes(32).toString('hex');
    const timestamp = Math.floor(Date.now() / 1000);

    // Test successful checkout completion
    const checkoutCompletedEvent = {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6',
          object: 'checkout.session',
          payment_status: 'paid',
          amount_total: 16953, // $169.53 in cents
          customer_details: {
            name: 'Test Customer',
            email: 'test@example.com'
          },
          payment_intent: 'pi_test_1234567890'
        }
      }
    };

    await this.testWebhookEndpoint(
      'Stripe Checkout Completed',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      checkoutCompletedEvent,
      {
        'stripe-signature': this.generateStripeSignature(checkoutCompletedEvent, testSecret, timestamp)
      }
    );

    // Test session expired
    const sessionExpiredEvent = {
      id: 'evt_test_expired',
      object: 'event', 
      type: 'checkout.session.expired',
      data: {
        object: {
          id: 'cs_test_expired_session',
          object: 'checkout.session',
          payment_status: 'unpaid'
        }
      }
    };

    await this.testWebhookEndpoint(
      'Stripe Session Expired',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      sessionExpiredEvent,
      {
        'stripe-signature': this.generateStripeSignature(sessionExpiredEvent, testSecret, timestamp)
      }
    );

    // Test payment intent succeeded
    const paymentSucceededEvent = {
      id: 'evt_test_payment_succeeded',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_1234567890',
          object: 'payment_intent',
          amount: 16953,
          currency: 'cad',
          status: 'succeeded'
        }
      }
    };

    await this.testWebhookEndpoint(
      'Stripe Payment Intent Succeeded',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      paymentSucceededEvent,
      {
        'stripe-signature': this.generateStripeSignature(paymentSucceededEvent, testSecret, timestamp)
      }
    );

    // Test invalid signature
    await this.testWebhookEndpoint(
      'Stripe Invalid Signature Rejection',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      checkoutCompletedEvent,
      {
        'stripe-signature': 'invalid-signature'
      },
      401 // Expected status for invalid signature
    );
  }

  // Test PayPal webhook scenarios
  async testPayPalWebhooks() {
    console.log('\n💰 Testing PayPal Webhook Integration...\n');

    // Test order approved
    const orderApprovedEvent = {
      id: 'WH-123456789',
      event_type: 'CHECKOUT.ORDER.APPROVED',
      resource: {
        id: '5O190127TN364715T',
        status: 'APPROVED',
        purchase_units: [
          {
            amount: {
              currency_code: 'CAD',
              value: '169.53'
            }
          }
        ]
      }
    };

    await this.testWebhookEndpoint(
      'PayPal Order Approved',
      `${this.config.supabaseUrl}/functions/v1/paypal-webhook`,
      orderApprovedEvent,
      this.generatePayPalHeaders()
    );

    // Test payment capture completed
    const captureCompletedEvent = {
      id: 'WH-987654321',
      event_type: 'PAYMENT.CAPTURE.COMPLETED',
      resource: {
        id: '8MC585209K746392H',
        status: 'COMPLETED',
        amount: {
          currency_code: 'CAD',
          value: '169.53'
        },
        supplementary_data: {
          related_ids: {
            order_id: '5O190127TN364715T'
          }
        }
      }
    };

    await this.testWebhookEndpoint(
      'PayPal Payment Captured',
      `${this.config.supabaseUrl}/functions/v1/paypal-webhook`,
      captureCompletedEvent,
      this.generatePayPalHeaders()
    );

    // Test payment denied
    const paymentDeniedEvent = {
      id: 'WH-456789123',
      event_type: 'PAYMENT.CAPTURE.DENIED',
      resource: {
        id: '8MC585209K746392H',
        status: 'DENIED',
        supplementary_data: {
          related_ids: {
            order_id: '5O190127TN364715T'
          }
        }
      }
    };

    await this.testWebhookEndpoint(
      'PayPal Payment Denied',
      `${this.config.supabaseUrl}/functions/v1/paypal-webhook`,
      paymentDeniedEvent,
      this.generatePayPalHeaders()
    );

    // Test missing headers
    await this.testWebhookEndpoint(
      'PayPal Missing Headers Rejection',
      `${this.config.supabaseUrl}/functions/v1/paypal-webhook`,
      orderApprovedEvent,
      {}, // No PayPal headers
      401 // Expected status for missing headers
    );
  }

  // Generic webhook endpoint tester
  async testWebhookEndpoint(testName, url, payload, headers, expectedStatus = 200) {
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify(payload)
      });

      const passed = response.statusCode === expectedStatus;
      
      this.logResult(testName, passed, {
        statusCode: response.statusCode,
        expectedStatus,
        responseTime: response.responseTime,
        hasBody: !!response.body,
        error: !passed ? `Expected ${expectedStatus}, got ${response.statusCode}` : null
      });

    } catch (error) {
      this.logResult(testName, false, { error: error.message });
    }
  }

  // Test payment flow redirects
  async testPaymentRedirects() {
    console.log('\n🔄 Testing Payment Flow Redirects...\n');

    // Test Stripe success redirect
    await this.testRedirect(
      'Stripe Success Redirect',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook/success?session_id=cs_test_123`
    );

    // Test Stripe cancel redirect
    await this.testRedirect(
      'Stripe Cancel Redirect',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook/cancel`
    );

    // Test PayPal success redirect
    await this.testRedirect(
      'PayPal Success Redirect',
      `${this.config.supabaseUrl}/functions/v1/paypal-webhook/success?token=5O190127TN364715T&PayerID=TESTPAYERID123`
    );

    // Test PayPal cancel redirect
    await this.testRedirect(
      'PayPal Cancel Redirect',
      `${this.config.supabaseUrl}/functions/v1/paypal-webhook/cancel?token=5O190127TN364715T`
    );
  }

  async testRedirect(testName, url) {
    try {
      const response = await this.makeRequest(url, { method: 'GET' });
      
      // Redirects should return 302 status
      const passed = response.statusCode === 302 && response.headers.location;
      
      this.logResult(testName, passed, {
        statusCode: response.statusCode,
        redirectLocation: response.headers.location,
        responseTime: response.responseTime,
        error: !passed ? 'Should redirect with 302 status and location header' : null
      });

    } catch (error) {
      this.logResult(testName, false, { error: error.message });
    }
  }

  // Test security scenarios
  async testSecurityScenarios() {
    console.log('\n🔒 Testing Security Scenarios...\n');

    // Test malformed JSON
    await this.testMalformedData(
      'Stripe Malformed JSON',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      'invalid-json-data',
      { 'stripe-signature': 'test-signature' }
    );

    // Test oversized payload
    const largePayload = {
      type: 'test',
      data: { object: { large_data: 'x'.repeat(1000000) } } // 1MB of data
    };

    await this.testWebhookEndpoint(
      'Large Payload Handling',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      largePayload,
      { 'stripe-signature': 'test-signature' },
      413 // Expected payload too large
    );

    // Test SQL injection attempt
    const sqlInjectionPayload = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: "'; DROP TABLE orders; --",
          customer_details: {
            email: 'test@example.com'
          }
        }
      }
    };

    await this.testWebhookEndpoint(
      'SQL Injection Prevention',
      `${this.config.supabaseUrl}/functions/v1/stripe-webhook`,
      sqlInjectionPayload,
      { 'stripe-signature': 'test-signature' }
    );
  }

  async testMalformedData(testName, url, data, headers) {
    try {
      const response = await this.makeRequest(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: data // Send as string, not JSON
      });

      // Should handle malformed data gracefully
      const passed = response.statusCode >= 400 && response.statusCode < 500;
      
      this.logResult(testName, passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 4xx status for malformed data' : null
      });

    } catch (error) {
      this.logResult(testName, false, { error: error.message });
    }
  }

  // Utility methods
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = https.request(url, options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            responseTime
          });
        });
      });

      req.on('error', (error) => {
        const responseTime = Date.now() - startTime;
        reject({ error: error.message, responseTime });
      });

      if (options.body) {
        req.write(options.body);
      }

      req.end();
    });
  }

  logResult(testName, passed, details = {}) {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}`);
    
    if (details.responseTime) {
      console.log(`   Response Time: ${details.responseTime}ms`);
    }
    
    if (details.statusCode) {
      console.log(`   Status Code: ${details.statusCode}`);
    }
    
    if (details.redirectLocation) {
      console.log(`   Redirect: ${details.redirectLocation}`);
    }
    
    if (details.error) {
      console.log(`   Error: ${details.error}`);
    }
    
    this.results.push({
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
    
    console.log(); // Empty line for readability
  }

  // Main test runner
  async runAllTests() {
    console.log('🧪 Starting Payment Webhook Integration Tests...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${this.config.supabaseUrl}`);
    
    const startTime = Date.now();

    try {
      await this.testStripeWebhooks();
      await this.testPayPalWebhooks();
      await this.testPaymentRedirects();
      await this.testSecurityScenarios();
    } catch (error) {
      console.log(`\n❌ Critical error during testing: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 PAYMENT WEBHOOK TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} (${Math.round((passedTests/totalTests)*100)}%)`);
    console.log(`Failed: ${totalTests - passedTests} (${Math.round(((totalTests - passedTests)/totalTests)*100)}%)`);
    console.log(`Execution Time: ${totalTime}ms`);
    
    // Show failed tests
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.testName}: ${test.details.error || 'Unknown error'}`);
      });
    }
    
    console.log('='.repeat(60));
  }
}

// CLI Interface
if (require.main === module) {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co'
  };

  if (!config.supabaseUrl || config.supabaseUrl.includes('your-project')) {
    console.log('❌ Please set SUPABASE_URL environment variable');
    console.log('   Example: SUPABASE_URL=https://your-project.supabase.co node payment-webhook-tester.js');
    process.exit(1);
  }

  const tester = new PaymentWebhookTester(config);
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = PaymentWebhookTester;