#!/usr/bin/env node

/**
 * Email Delivery Integration Tester
 * 
 * This script tests the Resend API integration for order confirmation emails
 * including template rendering, deliverability, and spam score analysis.
 */

const https = require('https');
const fs = require('fs');

class EmailDeliveryTester {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.emailTests = [];
  }

  // Test email delivery scenarios
  async testEmailDelivery() {
    console.log('\n📧 Testing Email Delivery Integration...\n');

    // Test 1: Basic order confirmation email
    await this.testOrderConfirmationEmail('Basic Order Confirmation', {
      orderNumber: 'ANT-000001',
      customerEmail: 'test@anointarray.com',
      customerName: 'Test Customer',
      items: [
        {
          id: '1',
          title: 'AetherX Card Decks: Body, Mind, Energy',
          price: 24.11,
          quantity: 2
        },
        {
          id: '2',
          title: 'ANOINT Manifestation Sphere',
          price: 111.32,
          quantity: 1
        }
      ],
      subtotal: 159.54,
      shippingCost: 9.99,
      discount: 0,
      total: 169.53,
      shippingAddress: {
        name: 'Test Customer',
        address: '123 Main Street',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 3A8',
        country: 'CA'
      },
      shippingMethod: 'Standard Shipping',
      paymentMethod: 'Credit Card (Stripe)',
      orderDate: new Date().toISOString()
    });

    // Test 2: Email with discount applied
    await this.testOrderConfirmationEmail('Email with Discount Applied', {
      orderNumber: 'ANT-000002',
      customerEmail: 'discount-test@anointarray.com',
      customerName: 'Discount Customer',
      items: [
        {
          id: '3',
          title: 'ANOINT Pet Collars',
          price: 12.32,
          quantity: 3
        }
      ],
      subtotal: 36.96,
      shippingCost: 12.99,
      discount: 18.48, // 50% discount
      total: 31.47,
      shippingAddress: {
        name: 'Discount Customer',
        address: '456 Savings Ave',
        city: 'Vancouver',
        province: 'BC',
        postalCode: 'V5K 1A1',
        country: 'CA'
      },
      shippingMethod: 'Express Shipping',
      paymentMethod: 'PayPal',
      orderDate: new Date().toISOString()
    });

    // Test 3: Email with tracking number
    await this.testOrderConfirmationEmail('Email with Tracking Number', {
      orderNumber: 'ANT-000003',
      customerEmail: 'tracking-test@anointarray.com',
      customerName: 'Tracking Customer',
      items: [
        {
          id: '4',
          title: 'Wooden Wall Arrays',
          price: 22.31,
          quantity: 1
        }
      ],
      subtotal: 22.31,
      shippingCost: 15.99,
      discount: 0,
      total: 38.30,
      shippingAddress: {
        name: 'Tracking Customer',
        address: '789 Track Lane',
        city: 'Calgary',
        province: 'AB',
        postalCode: 'T2P 1J9',
        country: 'CA'
      },
      shippingMethod: 'UPS Express',
      paymentMethod: 'Credit Card (Stripe)',
      orderDate: new Date().toISOString(),
      trackingNumber: 'UPS123456789TEST'
    });

    // Test 4: Large order with multiple items
    await this.testOrderConfirmationEmail('Large Order Email', {
      orderNumber: 'ANT-000004',
      customerEmail: 'large-order@anointarray.com',
      customerName: 'Big Spender',
      items: [
        { id: '1', title: 'AetherX Card Decks: Body, Mind, Energy', price: 24.11, quantity: 5 },
        { id: '2', title: 'ANOINT Manifestation Sphere', price: 111.32, quantity: 3 },
        { id: '3', title: 'ANOINT Pet Collars', price: 12.32, quantity: 10 },
        { id: '4', title: 'Wooden Wall Arrays', price: 22.31, quantity: 4 },
        { id: '5', title: 'ANOINT Torus Donut Necklaces', price: 12.32, quantity: 8 },
        { id: '6', title: 'ANOINT Crystal Bracelets', price: 12.32, quantity: 12 }
      ],
      subtotal: 742.91,
      shippingCost: 25.99,
      discount: 74.29, // 10% bulk discount
      total: 694.61,
      shippingAddress: {
        name: 'Big Spender',
        address: '999 Luxury Boulevard',
        city: 'Montreal',
        province: 'QC',
        postalCode: 'H3A 0G4',
        country: 'CA'
      },
      shippingMethod: 'Express Shipping',
      paymentMethod: 'Credit Card (Stripe)',
      orderDate: new Date().toISOString()
    });

    // Test 5: International shipping
    await this.testOrderConfirmationEmail('International Shipping Email', {
      orderNumber: 'ANT-000005',
      customerEmail: 'international@anointarray.com',
      customerName: 'Global Customer',
      items: [
        {
          id: '2',
          title: 'ANOINT Manifestation Sphere',
          price: 111.32,
          quantity: 1
        }
      ],
      subtotal: 111.32,
      shippingCost: 35.99,
      discount: 0,
      total: 147.31,
      shippingAddress: {
        name: 'Global Customer',
        address: '123 International Way',
        city: 'New York',
        province: 'NY',
        postalCode: '10001',
        country: 'US'
      },
      shippingMethod: 'International Express',
      paymentMethod: 'PayPal',
      orderDate: new Date().toISOString()
    });
  }

  async testOrderConfirmationEmail(testName, emailData) {
    try {
      const response = await this.makeRequest(`${this.config.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        },
        body: JSON.stringify(emailData)
      });

      const data = response.body ? JSON.parse(response.body) : {};
      const passed = response.statusCode === 200 && data.success;
      
      this.logResult(testName, passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        emailId: data.emailId,
        customerEmail: emailData.customerEmail,
        orderNumber: emailData.orderNumber,
        totalAmount: emailData.total,
        itemCount: emailData.items.length,
        hasTracking: !!emailData.trackingNumber,
        hasDiscount: emailData.discount > 0,
        error: !passed ? (data.error || 'Email sending failed') : null
      });

      // Store email test data for analysis
      if (passed) {
        this.emailTests.push({
          testName,
          emailId: data.emailId,
          emailData,
          sentAt: new Date().toISOString()
        });
      }

    } catch (error) {
      this.logResult(testName, false, { error: error.message });
    }
  }

  // Test email edge cases and error scenarios
  async testEmailErrorScenarios() {
    console.log('\n🚨 Testing Email Error Scenarios...\n');

    // Test 1: Missing required fields
    await this.testEmailError('Missing Required Fields', {
      orderNumber: 'ANT-ERROR-001'
      // Missing customerEmail, items, etc.
    });

    // Test 2: Invalid email address
    await this.testEmailError('Invalid Email Address', {
      orderNumber: 'ANT-ERROR-002',
      customerEmail: 'invalid-email-format',
      customerName: 'Invalid Customer',
      items: [{ id: '1', title: 'Test Item', price: 10.00, quantity: 1 }],
      subtotal: 10.00,
      shippingCost: 5.00,
      discount: 0,
      total: 15.00,
      shippingAddress: {
        name: 'Test Customer',
        address: '123 Test St',
        city: 'Test City',
        province: 'ON',
        postalCode: 'M5V 3A8',
        country: 'CA'
      },
      shippingMethod: 'Standard',
      paymentMethod: 'Stripe',
      orderDate: new Date().toISOString()
    });

    // Test 3: Empty items array
    await this.testEmailError('Empty Items Array', {
      orderNumber: 'ANT-ERROR-003',
      customerEmail: 'empty-items@anointarray.com',
      customerName: 'Empty Cart Customer',
      items: [], // Empty array
      subtotal: 0,
      shippingCost: 0,
      discount: 0,
      total: 0,
      shippingAddress: {
        name: 'Test Customer',
        address: '123 Test St',
        city: 'Test City',
        province: 'ON',
        postalCode: 'M5V 3A8',
        country: 'CA'
      },
      shippingMethod: 'Standard',
      paymentMethod: 'Stripe',
      orderDate: new Date().toISOString()
    });

    // Test 4: Malformed data
    await this.testEmailError('Malformed JSON Data', 'invalid-json-data', true);
  }

  async testEmailError(testName, emailData, isRawData = false) {
    try {
      const body = isRawData ? emailData : JSON.stringify(emailData);
      
      const response = await this.makeRequest(`${this.config.supabaseUrl}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        },
        body: body
      });

      // Should return an error status (4xx)
      const passed = response.statusCode >= 400 && response.statusCode < 500;
      
      this.logResult(testName, passed, {
        statusCode: response.statusCode,
        responseTime: response.responseTime,
        expectedError: true,
        error: !passed ? 'Should return 4xx status for invalid data' : null
      });

    } catch (error) {
      // Network errors are acceptable for malformed data
      const passed = testName.includes('Malformed');
      this.logResult(testName, passed, { 
        error: error.message,
        networkError: true
      });
    }
  }

  // Test email template rendering
  async testTemplateRendering() {
    console.log('\n🎨 Testing Email Template Rendering...\n');

    // Test with special characters and unicode
    await this.testOrderConfirmationEmail('Unicode and Special Characters', {
      orderNumber: 'ANT-UNICODE-001',
      customerEmail: 'unicode-test@anointarray.com',
      customerName: 'José María González-O\'Connor & Co. 测试用户',
      items: [
        {
          id: '1',
          title: 'Spëcial Ïtëm with Ümlauts & Émojis 🌟✨',
          price: 29.99,
          quantity: 1
        }
      ],
      subtotal: 29.99,
      shippingCost: 9.99,
      discount: 0,
      total: 39.98,
      shippingAddress: {
        name: 'José María González-O\'Connor',
        address: '123 Spëcial Ströße with "Quotes" & <HTML>',
        city: 'Montréal',
        province: 'QC',
        postalCode: 'H3A 0G4',
        country: 'CA'
      },
      shippingMethod: 'Expréss Shipping™',
      paymentMethod: 'Crédit Card (Stripe®)',
      orderDate: new Date().toISOString()
    });

    // Test with very long text
    await this.testOrderConfirmationEmail('Long Text Content', {
      orderNumber: 'ANT-LONG-001',
      customerEmail: 'long-content@anointarray.com',
      customerName: 'Customer with a Very Very Very Long Name That Should Test Text Wrapping and Overflow Handling',
      items: [
        {
          id: '1',
          title: 'This is an Extremely Long Product Title That Tests How The Email Template Handles Very Long Text Content Without Breaking The Layout Or Causing Display Issues In Various Email Clients',
          price: 99.99,
          quantity: 1
        }
      ],
      subtotal: 99.99,
      shippingCost: 15.99,
      discount: 0,
      total: 115.98,
      shippingAddress: {
        name: 'Customer with a Very Very Very Long Name',
        address: 'This is an extremely long address line that should test how the email template handles overflow text and line wrapping in the shipping address section of the email',
        city: 'City With A Really Long Name For Testing',
        province: 'ON',
        postalCode: 'M5V 3A8',
        country: 'CA'
      },
      shippingMethod: 'Express Shipping with Extra Long Service Name',
      paymentMethod: 'Credit Card (Stripe) with Additional Long Description',
      orderDate: new Date().toISOString()
    });
  }

  // Test email deliverability factors
  async testDeliverabilityFactors() {
    console.log('\n📬 Testing Email Deliverability Factors...\n');

    // Test with different domain types
    const testDomains = [
      'gmail.com',
      'yahoo.com', 
      'outlook.com',
      'hotmail.com',
      'icloud.com',
      'custom-domain.ca'
    ];

    for (const domain of testDomains) {
      await this.testOrderConfirmationEmail(`Delivery to ${domain}`, {
        orderNumber: `ANT-${domain.replace('.', '-').toUpperCase()}-001`,
        customerEmail: `test@${domain}`,
        customerName: `${domain} Customer`,
        items: [
          {
            id: '1',
            title: 'Test Product for Domain Testing',
            price: 15.00,
            quantity: 1
          }
        ],
        subtotal: 15.00,
        shippingCost: 8.99,
        discount: 0,
        total: 23.99,
        shippingAddress: {
          name: `${domain} Customer`,
          address: '123 Domain Test St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 3A8',
          country: 'CA'
        },
        shippingMethod: 'Standard Shipping',
        paymentMethod: 'Credit Card (Stripe)',
        orderDate: new Date().toISOString()
      });
    }
  }

  // Analyze email content for spam indicators
  analyzeSpamFactors(emailData) {
    const spamIndicators = [];
    const content = JSON.stringify(emailData).toLowerCase();

    // Check for common spam keywords
    const spamKeywords = [
      'free', 'urgent', 'act now', 'limited time', 'guaranteed',
      'no obligation', 'risk free', 'click here', 'buy now'
    ];

    spamKeywords.forEach(keyword => {
      if (content.includes(keyword)) {
        spamIndicators.push(`Contains spam keyword: "${keyword}"`);
      }
    });

    // Check for excessive capitalization
    const capsRatio = (emailData.customerName.match(/[A-Z]/g) || []).length / emailData.customerName.length;
    if (capsRatio > 0.5) {
      spamIndicators.push('Excessive capitalization in customer name');
    }

    // Check for suspicious pricing
    if (emailData.discount > 70) {
      spamIndicators.push('Very high discount percentage (>70%)');
    }

    return {
      spamScore: spamIndicators.length,
      indicators: spamIndicators,
      riskLevel: spamIndicators.length === 0 ? 'LOW' : 
                 spamIndicators.length <= 2 ? 'MEDIUM' : 'HIGH'
    };
  }

  // Performance testing for email sending
  async testEmailPerformance() {
    console.log('\n⚡ Testing Email Sending Performance...\n');

    const concurrentEmails = 3; // Test concurrent email sending
    const promises = [];

    for (let i = 0; i < concurrentEmails; i++) {
      promises.push(this.testOrderConfirmationEmail(`Concurrent Email ${i + 1}`, {
        orderNumber: `ANT-PERF-00${i + 1}`,
        customerEmail: `performance-test-${i + 1}@anointarray.com`,
        customerName: `Performance Customer ${i + 1}`,
        items: [
          {
            id: '1',
            title: 'Performance Test Item',
            price: 10.00,
            quantity: 1
          }
        ],
        subtotal: 10.00,
        shippingCost: 5.00,
        discount: 0,
        total: 15.00,
        shippingAddress: {
          name: `Performance Customer ${i + 1}`,
          address: '123 Performance St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 3A8',
          country: 'CA'
        },
        shippingMethod: 'Standard Shipping',
        paymentMethod: 'Credit Card (Stripe)',
        orderDate: new Date().toISOString()
      }));
    }

    const startTime = Date.now();
    await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;

    const avgTime = totalTime / concurrentEmails;
    const passed = avgTime < 3000; // Should average less than 3 seconds per email

    this.logResult('Concurrent Email Performance', passed, {
      concurrentEmails,
      totalTime,
      avgTime: Math.round(avgTime),
      throughput: Math.round((concurrentEmails / totalTime) * 1000), // emails per second
      error: !passed ? 'Average email sending time exceeded 3 seconds' : null
    });
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
    
    if (details.emailId) {
      console.log(`   Email ID: ${details.emailId}`);
    }

    if (details.customerEmail) {
      console.log(`   Recipient: ${details.customerEmail}`);
    }
    
    if (details.orderNumber) {
      console.log(`   Order: ${details.orderNumber}`);
    }

    if (details.totalAmount) {
      console.log(`   Amount: $${details.totalAmount.toFixed(2)} CAD`);
    }

    if (details.avgTime) {
      console.log(`   Avg Time: ${details.avgTime}ms`);
    }

    if (details.throughput) {
      console.log(`   Throughput: ${details.throughput} emails/sec`);
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

  // Generate email testing report
  generateEmailReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    const report = {
      summary: {
        totalTests,
        passedTests,
        failedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        testDate: new Date().toISOString()
      },
      emailsSent: this.emailTests.length,
      categories: {
        delivery: this.results.filter(r => r.testName.includes('Confirmation') || r.testName.includes('Delivery')),
        errors: this.results.filter(r => r.testName.includes('Error')),
        templates: this.results.filter(r => r.testName.includes('Unicode') || r.testName.includes('Long')),
        performance: this.results.filter(r => r.testName.includes('Performance') || r.testName.includes('Concurrent'))
      },
      recommendations: []
    };

    // Generate recommendations
    if (failedTests > 0) {
      report.recommendations.push(`Fix ${failedTests} failed test(s) before production deployment`);
    }

    const avgResponseTime = this.results
      .filter(r => r.details.responseTime)
      .reduce((sum, r) => sum + r.details.responseTime, 0) / 
      this.results.filter(r => r.details.responseTime).length;

    if (avgResponseTime > 2000) {
      report.recommendations.push('Email response times are high - consider optimizing email service');
    }

    if (this.emailTests.length > 0) {
      report.recommendations.push(`Monitor delivery status for ${this.emailTests.length} test emails sent`);
    }

    if (report.recommendations.length === 0) {
      report.recommendations.push('All email tests passed - system is ready for production');
    }

    return report;
  }

  // Main test runner
  async runAllTests() {
    console.log('📧 Starting Email Delivery Integration Tests...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${this.config.supabaseUrl}`);
    
    const startTime = Date.now();

    try {
      await this.testEmailDelivery();
      await this.testEmailErrorScenarios();
      await this.testTemplateRendering();
      await this.testDeliverabilityFactors();
      await this.testEmailPerformance();
    } catch (error) {
      console.log(`\n❌ Critical error during testing: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    const report = this.generateEmailReport();
    
    console.log('\n' + '='.repeat(70));
    console.log('📊 EMAIL DELIVERY TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests} (${report.summary.successRate}%)`);
    console.log(`Failed: ${report.summary.failedTests}`);
    console.log(`Emails Sent: ${report.emailsSent}`);
    console.log(`Execution Time: ${totalTime}ms`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }
    
    // Show failed tests
    const failedTests = this.results.filter(r => !r.passed);
    if (failedTests.length > 0) {
      console.log('\n❌ Failed Tests:');
      failedTests.forEach(test => {
        console.log(`   - ${test.testName}: ${test.details.error || 'Unknown error'}`);
      });
    }

    // Save detailed report
    try {
      fs.writeFileSync('email-test-report.json', JSON.stringify(report, null, 2));
      console.log('\n💾 Detailed report saved to: email-test-report.json');
    } catch (error) {
      console.log(`\n❌ Failed to save report: ${error.message}`);
    }
    
    console.log('='.repeat(70));
  }
}

// CLI Interface
if (require.main === module) {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key'
  };

  if (!config.supabaseUrl || config.supabaseUrl.includes('your-project')) {
    console.log('❌ Please set SUPABASE_URL environment variable');
    console.log('   Example: SUPABASE_URL=https://your-project.supabase.co node email-delivery-tester.js');
    process.exit(1);
  }

  if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('your-anon-key')) {
    console.log('❌ Please set SUPABASE_ANON_KEY environment variable');
    process.exit(1);
  }

  const tester = new EmailDeliveryTester(config);
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = EmailDeliveryTester;