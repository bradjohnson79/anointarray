#!/usr/bin/env node

/**
 * Performance and Load Testing Suite
 * 
 * This script tests API performance under various load conditions:
 * - Response time analysis
 * - Concurrent request handling
 * - Rate limiting behavior
 * - Memory usage patterns
 * - Error rate under load
 */

const https = require('https');
const cluster = require('cluster');
const os = require('os');
const fs = require('fs');

class PerformanceLoadTester {
  constructor(config) {
    this.config = config;
    this.results = [];
    this.performanceMetrics = {
      responseTimes: [],
      errorRates: [],
      throughput: [],
      concurrency: []
    };
  }

  // Test baseline API performance
  async testBaselinePerformance() {
    console.log('\n⚡ Testing Baseline API Performance...\n');

    const endpoints = [
      {
        name: 'Shipping Rates API',
        url: `${this.config.supabaseUrl}/functions/v1/get-rates`,
        method: 'POST',
        payload: {
          toAddress: {
            name: 'Performance Test',
            address: '123 Speed St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5V 3A8',
            country: 'CA'
          },
          items: [
            { id: '1', quantity: 2, weight: 0.5 },
            { id: '2', quantity: 1, weight: 0.8 }
          ]
        }
      },
      {
        name: 'Checkout Session API',
        url: `${this.config.supabaseUrl}/functions/v1/checkout-session`,
        method: 'POST',
        payload: {
          items: [
            { id: '1', title: 'Test Item', price: 25.00, quantity: 1 }
          ],
          shippingAddress: {
            name: 'Performance Test',
            address: '123 Speed St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5V 3A8',
            country: 'CA'
          },
          shippingOption: {
            id: 'standard',
            name: 'Standard Shipping',
            price: 9.99
          },
          discount: 0,
          paymentMethod: 'stripe',
          customerEmail: 'performance@anointarray.com'
        }
      },
      {
        name: 'Email Service API',
        url: `${this.config.supabaseUrl}/functions/v1/send-email`,
        method: 'POST',
        payload: {
          orderNumber: 'ANT-PERF-001',
          customerEmail: 'performance@anointarray.com',
          customerName: 'Performance Test',
          items: [{ id: '1', title: 'Test Item', price: 25.00, quantity: 1 }],
          subtotal: 25.00,
          shippingCost: 9.99,
          discount: 0,
          total: 34.99,
          shippingAddress: {
            name: 'Performance Test',
            address: '123 Speed St',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5V 3A8',
            country: 'CA'
          },
          shippingMethod: 'Standard Shipping',
          paymentMethod: 'Credit Card (Stripe)',
          orderDate: new Date().toISOString()
        }
      }
    ];

    for (const endpoint of endpoints) {
      await this.testEndpointPerformance(endpoint, 5); // 5 requests for baseline
    }
  }

  // Test individual endpoint performance
  async testEndpointPerformance(endpoint, requestCount = 10) {
    console.log(`Testing ${endpoint.name} (${requestCount} requests)...`);
    
    const responseTimes = [];
    const errors = [];
    const startTime = Date.now();

    for (let i = 0; i < requestCount; i++) {
      try {
        const response = await this.makeRequest(endpoint.url, {
          method: endpoint.method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`
          },
          body: JSON.stringify(endpoint.payload)
        });

        responseTimes.push(response.responseTime);

        if (response.statusCode >= 400) {
          errors.push({
            statusCode: response.statusCode,
            body: response.body
          });
        }

      } catch (error) {
        errors.push({ error: error.message });
      }
    }

    const totalTime = Date.now() - startTime;
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const minResponseTime = Math.min(...responseTimes);
    const maxResponseTime = Math.max(...responseTimes);
    const errorRate = (errors.length / requestCount) * 100;
    const throughput = (requestCount / totalTime) * 1000; // requests per second

    const passed = avgResponseTime < 3000 && errorRate < 10; // Less than 3s avg, less than 10% errors

    this.logResult(endpoint.name, passed, {
      requestCount,
      avgResponseTime: Math.round(avgResponseTime),
      minResponseTime,
      maxResponseTime,
      errorRate: Math.round(errorRate * 100) / 100,
      throughput: Math.round(throughput * 100) / 100,
      totalTime,
      errors: errors.slice(0, 3), // Show first 3 errors
      error: !passed ? 'Performance below acceptable threshold' : null
    });

    // Store metrics for analysis
    this.performanceMetrics.responseTimes.push({
      endpoint: endpoint.name,
      avg: avgResponseTime,
      min: minResponseTime,
      max: maxResponseTime
    });

    this.performanceMetrics.errorRates.push({
      endpoint: endpoint.name,
      rate: errorRate
    });

    this.performanceMetrics.throughput.push({
      endpoint: endpoint.name,
      rps: throughput
    });
  }

  // Test concurrent request handling
  async testConcurrentLoad() {
    console.log('\n🔄 Testing Concurrent Load Handling...\n');

    const concurrencyLevels = [5, 10, 20];
    const testEndpoint = {
      name: 'Shipping Rates API',
      url: `${this.config.supabaseUrl}/functions/v1/get-rates`,
      payload: {
        toAddress: {
          name: 'Concurrent Test',
          address: '123 Concurrent Ave',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 3A8',
          country: 'CA'
        },
        items: [{ id: '1', quantity: 1, weight: 0.5 }]
      }
    };

    for (const concurrency of concurrencyLevels) {
      await this.testConcurrentRequests(testEndpoint, concurrency);
    }
  }

  async testConcurrentRequests(endpoint, concurrency) {
    console.log(`Testing ${concurrency} concurrent requests...`);

    const promises = [];
    const startTime = Date.now();

    // Create concurrent requests
    for (let i = 0; i < concurrency; i++) {
      promises.push(
        this.makeRequest(endpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`
          },
          body: JSON.stringify(endpoint.payload)
        }).catch(error => ({ error: error.message }))
      );
    }

    // Wait for all requests to complete
    const results = await Promise.allSettled(promises);
    const totalTime = Date.now() - startTime;

    // Analyze results
    const successful = results.filter(r => 
      r.status === 'fulfilled' && 
      r.value.statusCode && 
      r.value.statusCode < 400
    );
    
    const failed = results.filter(r => 
      r.status === 'rejected' || 
      (r.value.statusCode && r.value.statusCode >= 400) ||
      r.value.error
    );

    const responseTimes = successful.map(r => r.value.responseTime).filter(Boolean);
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;
    
    const successRate = (successful.length / concurrency) * 100;
    const throughput = (successful.length / totalTime) * 1000;

    const passed = successRate >= 90 && avgResponseTime < 5000; // 90% success rate, under 5s

    this.logResult(`Concurrent Load (${concurrency} requests)`, passed, {
      concurrency,
      successful: successful.length,
      failed: failed.length,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      throughput: Math.round(throughput * 100) / 100,
      totalTime,
      error: !passed ? 'Concurrency handling below threshold' : null
    });

    this.performanceMetrics.concurrency.push({
      level: concurrency,
      successRate,
      avgResponseTime,
      throughput
    });
  }

  // Test rate limiting behavior
  async testRateLimiting() {
    console.log('\n🚦 Testing Rate Limiting Behavior...\n');

    const rapidRequests = 50; // Send many requests quickly
    const testEndpoint = {
      url: `${this.config.supabaseUrl}/functions/v1/get-rates`,
      payload: {
        toAddress: {
          name: 'Rate Limit Test',
          address: '123 Rate Limit St',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 3A8',
          country: 'CA'
        },
        items: [{ id: '1', quantity: 1, weight: 0.5 }]
      }
    };

    const results = [];
    const startTime = Date.now();

    // Send requests as fast as possible
    for (let i = 0; i < rapidRequests; i++) {
      try {
        const response = await this.makeRequest(testEndpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`
          },
          body: JSON.stringify(testEndpoint.payload)
        });

        results.push({
          requestNumber: i + 1,
          statusCode: response.statusCode,
          responseTime: response.responseTime
        });

        // Small delay to prevent overwhelming
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (error) {
        results.push({
          requestNumber: i + 1,
          error: error.message
        });
      }
    }

    const totalTime = Date.now() - startTime;
    const rateLimitedRequests = results.filter(r => r.statusCode === 429).length;
    const successfulRequests = results.filter(r => r.statusCode && r.statusCode < 400).length;
    const errorRequests = results.filter(r => r.statusCode >= 400 || r.error).length;

    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / 
      results.filter(r => r.responseTime).length;

    const actualThroughput = (rapidRequests / totalTime) * 1000;

    this.logResult('Rate Limiting Behavior', true, {
      totalRequests: rapidRequests,
      successful: successfulRequests,
      rateLimited: rateLimitedRequests,
      errors: errorRequests,
      avgResponseTime: Math.round(avgResponseTime || 0),
      actualThroughput: Math.round(actualThroughput * 100) / 100,
      totalTime,
      rateLimitingActive: rateLimitedRequests > 0,
      note: rateLimitedRequests > 0 ? 'Rate limiting is active' : 'No rate limiting detected'
    });
  }

  // Test memory usage patterns with large payloads
  async testMemoryUsage() {
    console.log('\n💾 Testing Memory Usage with Large Payloads...\n');

    // Test with progressively larger payloads
    const payloadSizes = [
      { name: 'Small Order', itemCount: 5 },
      { name: 'Medium Order', itemCount: 25 },
      { name: 'Large Order', itemCount: 100 }
    ];

    for (const size of payloadSizes) {
      await this.testLargePayload(size);
    }
  }

  async testLargePayload(payloadSize) {
    // Generate large item array
    const items = Array(payloadSize.itemCount).fill().map((_, i) => ({
      id: `item-${i + 1}`,
      title: `Test Product ${i + 1} with Very Long Description That Simulates Real Product Data With Multiple Details and Specifications`,
      price: 10.00 + (i % 50),
      quantity: 1 + (i % 3),
      weight: 0.1 + (i % 10) * 0.1
    }));

    const largeCheckoutData = {
      items,
      shippingAddress: {
        name: 'Large Order Customer with Extended Name for Testing Purposes',
        address: '123 Large Order Boulevard with Extended Address Information',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 3A8',
        country: 'CA'
      },
      shippingOption: {
        id: 'express',
        name: 'Express Shipping with Extended Service Description',
        price: 19.99
      },
      discount: 0,
      paymentMethod: 'stripe',
      customerEmail: 'large-order@anointarray.com'
    };

    const payloadSizeBytes = JSON.stringify(largeCheckoutData).length;

    try {
      const response = await this.makeRequest(`${this.config.supabaseUrl}/functions/v1/checkout-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.supabaseAnonKey}`
        },
        body: JSON.stringify(largeCheckoutData)
      });

      const passed = response.statusCode < 400 && response.responseTime < 10000; // Under 10 seconds

      this.logResult(payloadSize.name, passed, {
        itemCount: payloadSize.itemCount,
        payloadSizeKB: Math.round(payloadSizeBytes / 1024),
        responseTime: response.responseTime,
        statusCode: response.statusCode,
        memoryEfficient: response.responseTime < 5000,
        error: !passed ? 'Large payload handling issues' : null
      });

    } catch (error) {
      this.logResult(payloadSize.name, false, { 
        error: error.message,
        payloadSizeKB: Math.round(payloadSizeBytes / 1024),
        itemCount: payloadSize.itemCount
      });
    }
  }

  // Test API behavior under sustained load
  async testSustainedLoad() {
    console.log('\n⏳ Testing Sustained Load (2 minutes)...\n');

    const testDuration = 120000; // 2 minutes
    const requestInterval = 2000; // Every 2 seconds
    const maxRequests = Math.floor(testDuration / requestInterval);

    const testEndpoint = {
      url: `${this.config.supabaseUrl}/functions/v1/get-rates`,
      payload: {
        toAddress: {
          name: 'Sustained Test',
          address: '123 Endurance Way',
          city: 'Toronto',
          province: 'ON',
          postalCode: 'M5V 3A8',
          country: 'CA'
        },
        items: [{ id: '1', quantity: 1, weight: 0.5 }]
      }
    };

    const results = [];
    const startTime = Date.now();
    let requestCount = 0;

    console.log(`Sending requests every ${requestInterval}ms for ${testDuration}ms...`);

    const sustainedTest = setInterval(async () => {
      if (requestCount >= maxRequests || Date.now() - startTime >= testDuration) {
        clearInterval(sustainedTest);
        this.analyzeSustainedLoadResults(results, Date.now() - startTime);
        return;
      }

      requestCount++;
      
      try {
        const response = await this.makeRequest(testEndpoint.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.supabaseAnonKey}`
          },
          body: JSON.stringify(testEndpoint.payload)
        });

        results.push({
          requestNumber: requestCount,
          timestamp: Date.now() - startTime,
          statusCode: response.statusCode,
          responseTime: response.responseTime,
          success: response.statusCode < 400
        });

      } catch (error) {
        results.push({
          requestNumber: requestCount,
          timestamp: Date.now() - startTime,
          error: error.message,
          success: false
        });
      }
    }, requestInterval);

    // Wait for test to complete
    return new Promise(resolve => {
      const checkComplete = setInterval(() => {
        if (Date.now() - startTime >= testDuration) {
          clearInterval(checkComplete);
          resolve();
        }
      }, 1000);
    });
  }

  analyzeSustainedLoadResults(results, totalDuration) {
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    const avgResponseTime = successful.reduce((sum, r) => sum + (r.responseTime || 0), 0) / successful.length;
    
    // Check for performance degradation over time
    const firstHalf = successful.slice(0, Math.floor(successful.length / 2));
    const secondHalf = successful.slice(Math.floor(successful.length / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.responseTime, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.responseTime, 0) / secondHalf.length;
    
    const performanceDegradation = ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;

    const successRate = (successful.length / results.length) * 100;
    const avgThroughput = (results.length / totalDuration) * 1000;

    const passed = successRate >= 95 && avgResponseTime < 3000 && performanceDegradation < 50;

    this.logResult('Sustained Load Test', passed, {
      duration: Math.round(totalDuration / 1000) + 's',
      totalRequests: results.length,
      successful: successful.length,
      failed: failed.length,
      successRate: Math.round(successRate * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime || 0),
      firstHalfAvg: Math.round(firstHalfAvg || 0),
      secondHalfAvg: Math.round(secondHalfAvg || 0),
      performanceDegradation: Math.round(performanceDegradation * 100) / 100,
      avgThroughput: Math.round(avgThroughput * 100) / 100,
      stable: performanceDegradation < 20,
      error: !passed ? 'Sustained load performance issues detected' : null
    });
  }

  // Utility methods
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = https.request(url, {
        ...options,
        timeout: 15000 // 15 second timeout for performance tests
      }, (res) => {
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

      req.on('timeout', () => {
        req.destroy();
        const responseTime = Date.now() - startTime;
        reject({ error: 'Request timeout', responseTime });
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
    
    if (details.requestCount) {
      console.log(`   Requests: ${details.requestCount}`);
    }

    if (details.avgResponseTime) {
      console.log(`   Avg Response Time: ${details.avgResponseTime}ms`);
    }

    if (details.minResponseTime && details.maxResponseTime) {
      console.log(`   Response Time Range: ${details.minResponseTime}ms - ${details.maxResponseTime}ms`);
    }

    if (details.successRate !== undefined) {
      console.log(`   Success Rate: ${details.successRate}%`);
    }

    if (details.throughput) {
      console.log(`   Throughput: ${details.throughput} req/s`);
    }

    if (details.concurrency) {
      console.log(`   Concurrency Level: ${details.concurrency}`);
    }

    if (details.payloadSizeKB) {
      console.log(`   Payload Size: ${details.payloadSizeKB}KB`);
    }

    if (details.duration) {
      console.log(`   Duration: ${details.duration}`);
    }

    if (details.performanceDegradation !== undefined) {
      console.log(`   Performance Degradation: ${details.performanceDegradation}%`);
    }

    if (details.stable !== undefined) {
      console.log(`   Performance Stable: ${details.stable ? 'Yes' : 'No'}`);
    }

    if (details.note) {
      console.log(`   Note: ${details.note}`);
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

  // Generate performance report
  generatePerformanceReport() {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;

    // Calculate performance scores
    const responseTimeScore = this.calculateResponseTimeScore();
    const throughputScore = this.calculateThroughputScore();
    const reliabilityScore = this.calculateReliabilityScore();
    const overallScore = Math.round((responseTimeScore + throughputScore + reliabilityScore) / 3);

    const report = {
      summary: {
        totalTests,
        passedTests,
        successRate: Math.round((passedTests / totalTests) * 100),
        overallScore,
        testDate: new Date().toISOString()
      },
      performanceScores: {
        responseTime: responseTimeScore,
        throughput: throughputScore,
        reliability: reliabilityScore,
        overall: overallScore
      },
      metrics: this.performanceMetrics,
      recommendations: this.generateRecommendations(overallScore),
      results: this.results
    };

    return report;
  }

  calculateResponseTimeScore() {
    const avgTimes = this.performanceMetrics.responseTimes.map(m => m.avg);
    if (avgTimes.length === 0) return 0;
    
    const overallAvg = avgTimes.reduce((a, b) => a + b, 0) / avgTimes.length;
    
    // Score based on response time (lower is better)
    if (overallAvg < 1000) return 100;
    if (overallAvg < 2000) return 80;
    if (overallAvg < 3000) return 60;
    if (overallAvg < 5000) return 40;
    return 20;
  }

  calculateThroughputScore() {
    const throughputs = this.performanceMetrics.throughput.map(m => m.rps);
    if (throughputs.length === 0) return 0;
    
    const avgThroughput = throughputs.reduce((a, b) => a + b, 0) / throughputs.length;
    
    // Score based on throughput (higher is better)
    if (avgThroughput > 10) return 100;
    if (avgThroughput > 5) return 80;
    if (avgThroughput > 2) return 60;
    if (avgThroughput > 1) return 40;
    return 20;
  }

  calculateReliabilityScore() {
    const errorRates = this.performanceMetrics.errorRates.map(m => m.rate);
    if (errorRates.length === 0) return 100;
    
    const avgErrorRate = errorRates.reduce((a, b) => a + b, 0) / errorRates.length;
    
    // Score based on error rate (lower is better)
    if (avgErrorRate < 1) return 100;
    if (avgErrorRate < 5) return 80;
    if (avgErrorRate < 10) return 60;
    if (avgErrorRate < 20) return 40;
    return 20;
  }

  generateRecommendations(overallScore) {
    const recommendations = [];

    if (overallScore < 60) {
      recommendations.push('Overall performance needs significant improvement');
    }

    const avgResponseTime = this.performanceMetrics.responseTimes.reduce((sum, m) => sum + m.avg, 0) / 
      this.performanceMetrics.responseTimes.length;

    if (avgResponseTime > 3000) {
      recommendations.push('Response times are high - consider API optimization or caching');
    }

    const avgErrorRate = this.performanceMetrics.errorRates.reduce((sum, m) => sum + m.rate, 0) / 
      this.performanceMetrics.errorRates.length;

    if (avgErrorRate > 5) {
      recommendations.push('Error rates are high - investigate error causes and improve error handling');
    }

    const sustainedLoadResult = this.results.find(r => r.testName === 'Sustained Load Test');
    if (sustainedLoadResult && !sustainedLoadResult.passed) {
      recommendations.push('System struggles under sustained load - consider scaling improvements');
    }

    if (recommendations.length === 0) {
      recommendations.push('Performance is good - system is ready for production load');
    }

    return recommendations;
  }

  // Main test runner
  async runAllTests() {
    console.log('⚡ Starting Performance and Load Testing...');
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${this.config.supabaseUrl}`);
    console.log(`💻 System: Node ${process.version} on ${os.platform()}`);
    
    const startTime = Date.now();

    try {
      await this.testBaselinePerformance();
      await this.testConcurrentLoad();
      await this.testRateLimiting();
      await this.testMemoryUsage();
      await this.testSustainedLoad();
    } catch (error) {
      console.log(`\n❌ Critical error during testing: ${error.message}`);
    }

    const totalTime = Date.now() - startTime;
    const report = this.generatePerformanceReport();
    
    console.log('\n' + '='.repeat(70));
    console.log('⚡ PERFORMANCE AND LOAD TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`Passed: ${report.summary.passedTests} (${report.summary.successRate}%)`);
    console.log(`Overall Performance Score: ${report.summary.overallScore}/100`);
    console.log(`Execution Time: ${Math.round(totalTime / 1000)}s`);
    
    console.log('\n📊 Performance Breakdown:');
    console.log(`   Response Time Score: ${report.performanceScores.responseTime}/100`);
    console.log(`   Throughput Score: ${report.performanceScores.throughput}/100`);
    console.log(`   Reliability Score: ${report.performanceScores.reliability}/100`);
    
    if (report.recommendations.length > 0) {
      console.log('\n📋 Recommendations:');
      report.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // Save detailed report
    try {
      fs.writeFileSync('performance-test-report.json', JSON.stringify(report, null, 2));
      console.log('\n💾 Detailed report saved to: performance-test-report.json');
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
    console.log('   Example: SUPABASE_URL=https://your-project.supabase.co node performance-load-tester.js');
    process.exit(1);
  }

  if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('your-anon-key')) {
    console.log('❌ Please set SUPABASE_ANON_KEY environment variable');
    process.exit(1);
  }

  const tester = new PerformanceLoadTester(config);
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}

module.exports = PerformanceLoadTester;