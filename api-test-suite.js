#!/usr/bin/env node

/**
 * ANOINT Array API Integration Test Suite
 * 
 * This comprehensive test suite validates all external API integrations:
 * - Shipping APIs (UPS, Canada Post)
 * - Payment Gateways (Stripe, PayPal) 
 * - Email Service (Resend)
 * - Webhook handling and security
 * 
 * Usage: node api-test-suite.js [test-category]
 * Categories: shipping, payments, email, webhooks, all
 */

const fs = require('fs');
const https = require('https');
const crypto = require('crypto');

// Configuration - Replace with your actual test credentials
const CONFIG = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Test addresses for shipping
  testAddresses: {
    validCanadian: {
      name: 'John Doe',
      address: '123 Main Street',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 3A8',
      country: 'CA'
    },
    validUS: {
      name: 'Jane Smith', 
      address: '456 Broadway',
      city: 'New York',
      province: 'NY',
      postalCode: '10013',
      country: 'US'
    },
    invalidPostalCode: {
      name: 'Invalid Test',
      address: '789 Test St',
      city: 'Toronto',
      province: 'ON', 
      postalCode: 'INVALID',
      country: 'CA'
    }
  },
  
  // Test cart items
  testCartItems: [
    {
      id: '1',
      title: 'AetherX Card Decks: Body, Mind, Energy',
      price: 24.11,
      quantity: 2,
      weight: 0.3
    },
    {
      id: '2', 
      title: 'ANOINT Manifestation Sphere',
      price: 111.32,
      quantity: 1,
      weight: 0.8
    }
  ]
};

class APITester {
  constructor() {
    this.results = {
      shipping: [],
      payments: [],
      email: [],
      webhooks: [],
      security: []
    };
    this.totalTests = 0;
    this.passedTests = 0;
    this.failedTests = 0;
  }

  // Utility method for making HTTP requests
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
        req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
      }

      req.end();
    });
  }

  // Test result logging
  logTest(category, testName, passed, details = {}) {
    this.totalTests++;
    if (passed) {
      this.passedTests++;
      console.log(`✅ [${category.toUpperCase()}] ${testName}`);
    } else {
      this.failedTests++;
      console.log(`❌ [${category.toUpperCase()}] ${testName}`);
      if (details.error) {
        console.log(`   Error: ${details.error}`);
      }
    }
    
    this.results[category].push({
      testName,
      passed,
      details,
      timestamp: new Date().toISOString()
    });
  }

  // Test shipping rate API
  async testShippingRates() {
    console.log('\n🚚 Testing Shipping API Integration...\n');

    // Test 1: Valid Canadian address
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/get-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify({
          toAddress: CONFIG.testAddresses.validCanadian,
          items: CONFIG.testCartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            weight: item.weight
          }))
        })
      });

      const data = JSON.parse(response.body);
      const passed = response.statusCode === 200 && data.success && Array.isArray(data.rates);
      
      this.logTest('shipping', 'Get rates for valid Canadian address', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        ratesCount: data.rates?.length || 0,
        carriers: data.rates?.map(r => r.carrier) || [],
        error: !passed ? data.error || 'Unexpected response format' : null
      });

    } catch (error) {
      this.logTest('shipping', 'Get rates for valid Canadian address', false, { error: error.message });
    }

    // Test 2: Valid US address
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/get-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify({
          toAddress: CONFIG.testAddresses.validUS,
          items: CONFIG.testCartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            weight: item.weight
          }))
        })
      });

      const data = JSON.parse(response.body);
      const passed = response.statusCode === 200 && data.success;
      
      this.logTest('shipping', 'Get rates for valid US address', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        ratesCount: data.rates?.length || 0,
        error: !passed ? data.error || 'Failed to get US rates' : null
      });

    } catch (error) {
      this.logTest('shipping', 'Get rates for valid US address', false, { error: error.message });
    }

    // Test 3: Invalid postal code handling
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/get-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify({
          toAddress: CONFIG.testAddresses.invalidPostalCode,
          items: CONFIG.testCartItems.map(item => ({
            id: item.id,
            quantity: item.quantity,
            weight: item.weight
          }))
        })
      });

      const data = JSON.parse(response.body);
      // Should handle gracefully - either return fallback rates or empty array
      const passed = response.statusCode === 200 && (data.rates === undefined || Array.isArray(data.rates));
      
      this.logTest('shipping', 'Handle invalid postal code gracefully', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        ratesCount: data.rates?.length || 0,
        error: !passed ? 'Did not handle invalid postal code gracefully' : null
      });

    } catch (error) {
      this.logTest('shipping', 'Handle invalid postal code gracefully', false, { error: error.message });
    }

    // Test 4: Missing required fields
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/get-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify({
          // Missing toAddress and items
        })
      });

      const passed = response.statusCode === 400;
      
      this.logTest('shipping', 'Reject missing required fields', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 400 for missing fields' : null
      });

    } catch (error) {
      this.logTest('shipping', 'Reject missing required fields', false, { error: error.message });
    }
  }

  // Test payment integration
  async testPaymentIntegration() {
    console.log('\n💳 Testing Payment Integration...\n');

    const testCheckoutData = {
      items: CONFIG.testCartItems,
      shippingAddress: CONFIG.testAddresses.validCanadian,
      shippingOption: {
        id: 'standard',
        name: 'Standard Shipping',
        price: 9.99
      },
      discount: 0,
      paymentMethod: 'stripe',
      customerEmail: 'test@anointarray.com'
    };

    // Test 1: Create Stripe checkout session
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(testCheckoutData)
      });

      const data = JSON.parse(response.body);
      const passed = response.statusCode === 200 && data.success && data.checkoutUrl;
      
      this.logTest('payments', 'Create Stripe checkout session', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        hasCheckoutUrl: !!data.checkoutUrl,
        hasSessionId: !!data.sessionId,
        error: !passed ? data.error || 'Missing checkout URL' : null
      });

    } catch (error) {
      this.logTest('payments', 'Create Stripe checkout session', false, { error: error.message });
    }

    // Test 2: Create PayPal order
    try {
      const paypalData = { ...testCheckoutData, paymentMethod: 'paypal' };
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(paypalData)
      });

      const data = JSON.parse(response.body);
      const passed = response.statusCode === 200 && data.success && data.approvalUrl;
      
      this.logTest('payments', 'Create PayPal order', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        hasApprovalUrl: !!data.approvalUrl,
        hasOrderId: !!data.orderId,
        error: !passed ? data.error || 'Missing approval URL' : null
      });

    } catch (error) {
      this.logTest('payments', 'Create PayPal order', false, { error: error.message });
    }

    // Test 3: Invalid payment method
    try {
      const invalidData = { ...testCheckoutData, paymentMethod: 'invalid' };
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(invalidData)
      });

      const passed = response.statusCode === 400;
      
      this.logTest('payments', 'Reject invalid payment method', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 400 for invalid payment method' : null
      });

    } catch (error) {
      this.logTest('payments', 'Reject invalid payment method', false, { error: error.message });
    }

    // Test 4: Missing required checkout fields
    try {
      const incompleteData = {
        items: CONFIG.testCartItems,
        paymentMethod: 'stripe'
        // Missing required fields
      };
      
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(incompleteData)
      });

      const passed = response.statusCode === 400;
      
      this.logTest('payments', 'Reject incomplete checkout data', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 400 for missing required fields' : null
      });

    } catch (error) {
      this.logTest('payments', 'Reject incomplete checkout data', false, { error: error.message });
    }
  }

  // Test email service
  async testEmailService() {
    console.log('\n📧 Testing Email Service Integration...\n');

    const testEmailData = {
      orderNumber: 'ANT-000001',
      customerEmail: 'test@anointarray.com',
      customerName: 'Test Customer',
      items: CONFIG.testCartItems,
      subtotal: 159.54,
      shippingCost: 9.99,
      discount: 0,
      total: 169.53,
      shippingAddress: CONFIG.testAddresses.validCanadian,
      shippingMethod: 'Standard Shipping',
      paymentMethod: 'Credit Card (Stripe)',
      orderDate: new Date().toISOString()
    };

    // Test 1: Send order confirmation email
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(testEmailData)
      });

      const data = JSON.parse(response.body);
      const passed = response.statusCode === 200 && data.success;
      
      this.logTest('email', 'Send order confirmation email', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        emailId: data.emailId,
        error: !passed ? data.error || 'Email sending failed' : null
      });

    } catch (error) {
      this.logTest('email', 'Send order confirmation email', false, { error: error.message });
    }

    // Test 2: Email with tracking number
    try {
      const trackingEmailData = {
        ...testEmailData,
        trackingNumber: 'UPS123456789'
      };
      
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(trackingEmailData)
      });

      const data = JSON.parse(response.body);
      const passed = response.statusCode === 200 && data.success;
      
      this.logTest('email', 'Send email with tracking number', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        emailId: data.emailId,
        error: !passed ? data.error || 'Tracking email failed' : null
      });

    } catch (error) {
      this.logTest('email', 'Send email with tracking number', false, { error: error.message });
    }

    // Test 3: Missing required email fields
    try {
      const incompleteEmailData = {
        orderNumber: 'ANT-000002'
        // Missing required fields
      };
      
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
        },
        body: JSON.stringify(incompleteEmailData)
      });

      const passed = response.statusCode === 400;
      
      this.logTest('email', 'Reject incomplete email data', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 400 for missing required fields' : null
      });

    } catch (error) {
      this.logTest('email', 'Reject incomplete email data', false, { error: error.message });
    }
  }

  // Test webhook endpoints
  async testWebhookEndpoints() {
    console.log('\n🔗 Testing Webhook Endpoints...\n');

    // Test 1: Stripe webhook endpoint availability
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/stripe-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'stripe-signature': 'invalid-signature' // Will fail signature verification
        },
        body: JSON.stringify({
          type: 'checkout.session.completed',
          data: { object: { id: 'cs_test_123' } }
        })
      });

      // Should return 401 due to invalid signature
      const passed = response.statusCode === 401;
      
      this.logTest('webhooks', 'Stripe webhook signature validation', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 401 for invalid signature' : null
      });

    } catch (error) {
      this.logTest('webhooks', 'Stripe webhook signature validation', false, { error: error.message });
    }

    // Test 2: PayPal webhook endpoint availability
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/paypal-webhook`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
          // Missing PayPal webhook headers - should fail validation
        },
        body: JSON.stringify({
          event_type: 'CHECKOUT.ORDER.APPROVED',
          resource: { id: 'order_123' }
        })
      });

      // Should return 401 due to missing headers
      const passed = response.statusCode === 401;
      
      this.logTest('webhooks', 'PayPal webhook validation', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        error: !passed ? 'Should return 401 for missing headers' : null
      });

    } catch (error) {
      this.logTest('webhooks', 'PayPal webhook validation', false, { error: error.message });
    }

    // Test 3: Webhook GET redirects (success/cancel URLs)
    try {
      const response = await this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/stripe-webhook/success?session_id=cs_test_123`, {
        method: 'GET'
      });

      // Since we don't have a valid session, this will likely redirect to failure
      // But we're testing that the endpoint is accessible
      const passed = response.statusCode === 302 || response.statusCode === 400;
      
      this.logTest('webhooks', 'Stripe success redirect endpoint', passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        location: response.headers.location,
        error: !passed ? 'Success endpoint not responding correctly' : null
      });

    } catch (error) {
      this.logTest('webhooks', 'Stripe success redirect endpoint', false, { error: error.message });
    }
  }

  // Test API performance and reliability
  async testPerformance() {
    console.log('\n⚡ Testing API Performance...\n');

    const testPayload = {
      toAddress: CONFIG.testAddresses.validCanadian,
      items: CONFIG.testCartItems.map(item => ({
        id: item.id,
        quantity: item.quantity,
        weight: item.weight
      }))
    };

    // Test response time under load
    const concurrentRequests = 5;
    const responseTimes = [];

    try {
      const requests = Array(concurrentRequests).fill().map(() => 
        this.makeRequest(`${CONFIG.supabaseUrl}/functions/v1/get-rates`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${CONFIG.supabaseAnonKey}`
          },
          body: JSON.stringify(testPayload)
        })
      );

      const responses = await Promise.allSettled(requests);
      
      responses.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          responseTimes.push(result.value.responseTime);
        }
      });

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const passed = avgResponseTime < 5000 && responseTimes.length >= concurrentRequests * 0.8; // 80% success rate
      
      this.logTest('performance', `Concurrent requests (${concurrentRequests})`, passed, {
        avgResponseTime: Math.round(avgResponseTime),
        successfulRequests: responseTimes.length,
        totalRequests: concurrentRequests,
        successRate: `${Math.round((responseTimes.length / concurrentRequests) * 100)}%`,
        error: !passed ? 'Performance below acceptable threshold' : null
      });

    } catch (error) {
      this.logTest('performance', `Concurrent requests (${concurrentRequests})`, false, { error: error.message });
    }
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('🧪 API INTEGRATION TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n📊 Overall Results:`);
    console.log(`   Total Tests: ${this.totalTests}`);
    console.log(`   Passed: ${this.passedTests} (${Math.round((this.passedTests/this.totalTests)*100)}%)`);
    console.log(`   Failed: ${this.failedTests} (${Math.round((this.failedTests/this.totalTests)*100)}%)`);
    
    // Category breakdown
    Object.keys(this.results).forEach(category => {
      const tests = this.results[category];
      if (tests.length === 0) return;
      
      const passed = tests.filter(t => t.passed).length;
      const total = tests.length;
      
      console.log(`\n📂 ${category.toUpperCase()} Category: ${passed}/${total} passed`);
      
      tests.forEach(test => {
        const status = test.passed ? '✅' : '❌';
        console.log(`   ${status} ${test.testName}`);
        if (!test.passed && test.details.error) {
          console.log(`      Error: ${test.details.error}`);
        }
        if (test.details.responseTime) {
          console.log(`      Response Time: ${test.details.responseTime}ms`);
        }
      });
    });

    // Recommendations
    console.log('\n📋 Recommendations:');
    
    const failedCategories = Object.keys(this.results).filter(cat => 
      this.results[cat].some(test => !test.passed)
    );
    
    if (failedCategories.length === 0) {
      console.log('   🎉 All tests passed! Your API integrations are production-ready.');
    } else {
      failedCategories.forEach(category => {
        const failedTests = this.results[category].filter(t => !t.passed);
        console.log(`   ⚠️  ${category.toUpperCase()}: ${failedTests.length} issues need attention`);
        failedTests.forEach(test => {
          console.log(`      - Fix: ${test.testName}`);
        });
      });
    }

    // Save detailed report to file
    const reportData = {
      timestamp: new Date().toISOString(),
      summary: {
        total: this.totalTests,
        passed: this.passedTests,
        failed: this.failedTests,
        successRate: Math.round((this.passedTests/this.totalTests)*100)
      },
      results: this.results,
      environment: {
        supabaseUrl: CONFIG.supabaseUrl,
        nodeVersion: process.version
      }
    };

    try {
      fs.writeFileSync('api-test-report.json', JSON.stringify(reportData, null, 2));
      console.log('\n💾 Detailed report saved to: api-test-report.json');
    } catch (error) {
      console.log(`\n❌ Failed to save report: ${error.message}`);
    }

    console.log('\n' + '='.repeat(80));
  }

  // Main test runner
  async runTests(category = 'all') {
    console.log('🚀 Starting ANOINT Array API Integration Tests...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Test Category: ${category.toUpperCase()}`);
    
    const startTime = Date.now();

    try {
      if (category === 'all' || category === 'shipping') {
        await this.testShippingRates();
      }
      
      if (category === 'all' || category === 'payments') {
        await this.testPaymentIntegration();
      }
      
      if (category === 'all' || category === 'email') {
        await this.testEmailService();
      }
      
      if (category === 'all' || category === 'webhooks') {
        await this.testWebhookEndpoints();
      }
      
      if (category === 'all' || category === 'performance') {
        await this.testPerformance();
      }

    } catch (error) {
      console.log(`\n❌ Critical error during testing: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️  Total execution time: ${totalTime}ms`);
    
    this.generateReport();
  }
}

// CLI Interface
if (require.main === module) {
  const category = process.argv[2] || 'all';
  const validCategories = ['shipping', 'payments', 'email', 'webhooks', 'performance', 'all'];
  
  if (!validCategories.includes(category)) {
    console.log('❌ Invalid category. Valid options:', validCategories.join(', '));
    process.exit(1);
  }
  
  const tester = new APITester();
  tester.runTests(category).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = APITester;