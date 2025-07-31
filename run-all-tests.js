#!/usr/bin/env node

/**
 * Master Test Runner for ANOINT Array API Integration Testing
 * 
 * This script orchestrates all API integration tests and generates
 * a comprehensive final report.
 */

const APITester = require('./api-test-suite');
const PaymentWebhookTester = require('./payment-webhook-tester');
const EmailDeliveryTester = require('./email-delivery-tester');
const IntegrationFlowTester = require('./integration-flow-tester');
const PerformanceLoadTester = require('./performance-load-tester');
const fs = require('fs');
const path = require('path');

class MasterTestRunner {
  constructor(config) {
    this.config = config;
    this.testResults = {};
    this.overallResults = {
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      testSuites: 0,
      passedSuites: 0,
      startTime: null,
      endTime: null
    };
  }

  async runAllTestSuites() {
    console.log('🚀 ANOINT Array - Master API Integration Test Runner');
    console.log('='.repeat(80));
    console.log(`📅 Started: ${new Date().toISOString()}`);
    console.log(`🎯 Target: ${this.config.supabaseUrl}`);
    console.log(`🔧 Node Version: ${process.version}`);
    console.log('='.repeat(80));

    this.overallResults.startTime = Date.now();

    // Test Suite 1: Basic API Integration Tests
    await this.runTestSuite('API Integration', async () => {
      const tester = new APITester();
      // Override config
      tester.CONFIG.supabaseUrl = this.config.supabaseUrl;
      tester.CONFIG.supabaseAnonKey = this.config.supabaseAnonKey;
      await tester.runTests('all');
      return {
        totalTests: tester.totalTests,
        passedTests: tester.passedTests,
        failedTests: tester.failedTests,
        results: tester.results
      };
    });

    // Test Suite 2: Payment Webhook Tests
    await this.runTestSuite('Payment Webhooks', async () => {
      const tester = new PaymentWebhookTester({
        supabaseUrl: this.config.supabaseUrl
      });
      await tester.runAllTests();
      return {
        totalTests: tester.results.length,
        passedTests: tester.results.filter(r => r.passed).length,
        failedTests: tester.results.filter(r => !r.passed).length,
        results: tester.results
      };
    });

    // Test Suite 3: Email Delivery Tests
    await this.runTestSuite('Email Delivery', async () => {
      const tester = new EmailDeliveryTester({
        supabaseUrl: this.config.supabaseUrl,
        supabaseAnonKey: this.config.supabaseAnonKey
      });
      await tester.runAllTests();
      return {
        totalTests: tester.results.length,
        passedTests: tester.results.filter(r => r.passed).length,
        failedTests: tester.results.filter(r => !r.passed).length,
        results: tester.results,
        emailsSent: tester.emailTests.length
      };
    });

    // Test Suite 4: Integration Flow Tests
    await this.runTestSuite('Integration Flows', async () => {
      const tester = new IntegrationFlowTester({
        supabaseUrl: this.config.supabaseUrl,
        supabaseAnonKey: this.config.supabaseAnonKey
      });
      await tester.runAllTests();
      return {
        totalTests: tester.results.length,
        passedTests: tester.results.filter(r => r.passed).length,
        failedTests: tester.results.filter(r => !r.passed).length,
        results: tester.results
      };
    });

    // Test Suite 5: Performance and Load Tests
    await this.runTestSuite('Performance & Load', async () => {
      const tester = new PerformanceLoadTester({
        supabaseUrl: this.config.supabaseUrl,
        supabaseAnonKey: this.config.supabaseAnonKey
      });
      await tester.runAllTests();
      return {
        totalTests: tester.results.length,
        passedTests: tester.results.filter(r => r.passed).length,
        failedTests: tester.results.filter(r => !r.passed).length,
        results: tester.results,
        performanceScores: tester.generatePerformanceReport().performanceScores
      };
    });

    this.overallResults.endTime = Date.now();
    this.generateMasterReport();
  }

  async runTestSuite(suiteName, testFunction) {
    console.log(`\n🧪 Running ${suiteName} Test Suite...`);
    console.log('-'.repeat(50));
    
    this.overallResults.testSuites++;
    const suiteStartTime = Date.now();

    try {
      const results = await testFunction();
      const suiteEndTime = Date.now();
      const suiteDuration = suiteEndTime - suiteStartTime;

      this.testResults[suiteName] = {
        ...results,
        duration: suiteDuration,
        status: 'completed',
        successRate: Math.round((results.passedTests / results.totalTests) * 100)
      };

      this.overallResults.totalTests += results.totalTests;
      this.overallResults.passedTests += results.passedTests;
      this.overallResults.failedTests += results.failedTests;

      if (results.passedTests === results.totalTests) {
        this.overallResults.passedSuites++;
      }

      console.log(`✅ ${suiteName} Suite Complete: ${results.passedTests}/${results.totalTests} passed (${Math.round(suiteDuration/1000)}s)`);

    } catch (error) {
      const suiteEndTime = Date.now();
      const suiteDuration = suiteEndTime - suiteStartTime;

      this.testResults[suiteName] = {
        totalTests: 0,
        passedTests: 0,
        failedTests: 1,
        duration: suiteDuration,
        status: 'failed',
        error: error.message,
        successRate: 0
      };

      this.overallResults.failedTests++;

      console.log(`❌ ${suiteName} Suite Failed: ${error.message}`);
    }
  }

  generateMasterReport() {
    const totalDuration = this.overallResults.endTime - this.overallResults.startTime;
    const overallSuccessRate = Math.round((this.overallResults.passedTests / this.overallResults.totalTests) * 100);

    console.log('\n' + '='.repeat(80));
    console.log('📊 MASTER API INTEGRATION TEST REPORT');
    console.log('='.repeat(80));

    console.log(`\n🎯 Overall Results:`);
    console.log(`   Test Suites: ${this.overallResults.passedSuites}/${this.overallResults.testSuites} passed`);
    console.log(`   Total Tests: ${this.overallResults.totalTests}`);
    console.log(`   Passed: ${this.overallResults.passedTests} (${overallSuccessRate}%)`);
    console.log(`   Failed: ${this.overallResults.failedTests}`);
    console.log(`   Duration: ${Math.round(totalDuration / 1000)}s`);

    console.log(`\n📋 Test Suite Breakdown:`);
    Object.entries(this.testResults).forEach(([suiteName, results]) => {
      const status = results.status === 'completed' ? '✅' : '❌';
      const duration = Math.round(results.duration / 1000);
      console.log(`   ${status} ${suiteName}: ${results.passedTests}/${results.totalTests} (${results.successRate}%) - ${duration}s`);
      
      if (results.error) {
        console.log(`      Error: ${results.error}`);
      }
    });

    // Production Readiness Assessment
    console.log(`\n🚦 Production Readiness Assessment:`);
    const readinessScore = this.calculateReadinessScore();
    console.log(`   Readiness Score: ${readinessScore.score}/100`);
    console.log(`   Status: ${readinessScore.status}`);

    if (readinessScore.criticalIssues.length > 0) {
      console.log(`\n🚨 Critical Issues:`);
      readinessScore.criticalIssues.forEach(issue => {
        console.log(`   • ${issue}`);
      });
    }

    if (readinessScore.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      readinessScore.recommendations.forEach(rec => {
        console.log(`   • ${rec}`);
      });
    }

    // API Integration Health Check
    console.log(`\n🏥 API Integration Health:`);
    const healthCheck = this.performHealthCheck();
    Object.entries(healthCheck).forEach(([api, status]) => {
      const icon = status === 'healthy' ? '✅' : status === 'warning' ? '⚠️' : '❌';
      console.log(`   ${icon} ${api}: ${status}`);
    });

    // Save comprehensive report
    this.saveMasterReport(totalDuration, overallSuccessRate, readinessScore, healthCheck);

    console.log('='.repeat(80));
  }

  calculateReadinessScore() {
    let score = 100;
    const criticalIssues = [];
    const recommendations = [];

    // Check test suite success rates
    Object.entries(this.testResults).forEach(([suiteName, results]) => {
      if (results.status === 'failed') {
        score -= 30;
        criticalIssues.push(`${suiteName} test suite failed completely`);
      } else if (results.successRate < 80) {
        score -= 15;
        criticalIssues.push(`${suiteName} has low success rate (${results.successRate}%)`);
      } else if (results.successRate < 95) {
        score -= 5;
        recommendations.push(`Improve ${suiteName} success rate from ${results.successRate}%`);
      }
    });

    // Check performance scores if available
    const perfResults = this.testResults['Performance & Load'];
    if (perfResults && perfResults.performanceScores) {
      const avgPerfScore = Object.values(perfResults.performanceScores)
        .filter(s => typeof s === 'number')
        .reduce((a, b) => a + b, 0) / 3;
      
      if (avgPerfScore < 60) {
        score -= 20;
        criticalIssues.push('Performance scores are below acceptable threshold');
      } else if (avgPerfScore < 80) {
        score -= 10;
        recommendations.push('Performance optimization recommended');
      }
    }

    // Check email delivery
    const emailResults = this.testResults['Email Delivery'];
    if (emailResults && emailResults.emailsSent === 0) {
      score -= 15;
      criticalIssues.push('No emails were successfully sent during testing');
    }

    // Determine status
    let status;
    if (score >= 95) status = 'READY FOR PRODUCTION';
    else if (score >= 80) status = 'READY WITH MINOR ISSUES';
    else if (score >= 60) status = 'NEEDS IMPROVEMENT';
    else status = 'NOT READY FOR PRODUCTION';

    return {
      score: Math.max(0, score),
      status,
      criticalIssues,
      recommendations
    };
  }

  performHealthCheck() {
    const health = {
      'Shipping APIs': 'unknown',
      'Payment Processing': 'unknown',
      'Email Service': 'unknown',
      'Webhook Handling': 'unknown',
      'System Performance': 'unknown'
    };

    // Check shipping API health
    const apiResults = this.testResults['API Integration'];
    if (apiResults) {
      const shippingTests = apiResults.results.shipping || [];
      const shippingSuccess = shippingTests.filter(t => t.passed).length / shippingTests.length;
      health['Shipping APIs'] = shippingSuccess >= 0.8 ? 'healthy' : shippingSuccess >= 0.5 ? 'warning' : 'critical';
    }

    // Check payment processing health
    const paymentResults = this.testResults['Payment Webhooks'];
    if (paymentResults) {
      health['Payment Processing'] = paymentResults.successRate >= 80 ? 'healthy' : 
                                   paymentResults.successRate >= 60 ? 'warning' : 'critical';
    }

    // Check email service health
    const emailResults = this.testResults['Email Delivery'];
    if (emailResults) {
      health['Email Service'] = emailResults.successRate >= 90 ? 'healthy' :
                               emailResults.successRate >= 70 ? 'warning' : 'critical';
    }

    // Check webhook handling
    if (paymentResults) {
      // Webhook health based on payment webhook results
      health['Webhook Handling'] = paymentResults.successRate >= 85 ? 'healthy' : 
                                   paymentResults.successRate >= 70 ? 'warning' : 'critical';
    }

    // Check system performance
    const perfResults = this.testResults['Performance & Load'];
    if (perfResults && perfResults.performanceScores) {
      const avgScore = Object.values(perfResults.performanceScores)
        .filter(s => typeof s === 'number')
        .reduce((a, b) => a + b, 0) / 3;
      health['System Performance'] = avgScore >= 80 ? 'healthy' : avgScore >= 60 ? 'warning' : 'critical';
    }

    return health;
  }

  saveMasterReport(totalDuration, overallSuccessRate, readinessScore, healthCheck) {
    const masterReport = {
      metadata: {
        testDate: new Date().toISOString(),
        targetUrl: this.config.supabaseUrl,
        nodeVersion: process.version,
        totalDuration: totalDuration,
        tester: 'APIHammer Integration Test Suite'
      },
      summary: {
        totalTestSuites: this.overallResults.testSuites,
        passedTestSuites: this.overallResults.passedSuites,
        totalTests: this.overallResults.totalTests,
        passedTests: this.overallResults.passedTests,
        failedTests: this.overallResults.failedTests,
        overallSuccessRate: overallSuccessRate
      },
      productionReadiness: readinessScore,
      apiHealth: healthCheck,
      testSuiteResults: this.testResults,
      recommendations: {
        immediate: [],
        shortTerm: [],
        longTerm: []
      }
    };

    // Generate specific recommendations
    if (readinessScore.score < 80) {
      masterReport.recommendations.immediate.push('Address critical issues before production deployment');
    }
    
    if (healthCheck['Shipping APIs'] !== 'healthy') {
      masterReport.recommendations.immediate.push('Fix shipping API integration issues');
    }

    if (healthCheck['Payment Processing'] !== 'healthy') {
      masterReport.recommendations.immediate.push('Resolve payment processing problems');
    }

    if (healthCheck['Email Service'] !== 'healthy') {
      masterReport.recommendations.shortTerm.push('Improve email delivery reliability');
    }

    if (healthCheck['System Performance'] !== 'healthy') {
      masterReport.recommendations.shortTerm.push('Optimize system performance');
    }

    masterReport.recommendations.longTerm.push('Set up continuous monitoring for all API integrations');
    masterReport.recommendations.longTerm.push('Implement automated testing in CI/CD pipeline');

    try {
      fs.writeFileSync('master-test-report.json', JSON.stringify(masterReport, null, 2));
      console.log('\n💾 Master report saved to: master-test-report.json');
      
      // Also create a simplified report for quick review
      this.createSimplifiedReport(masterReport);
      
    } catch (error) {
      console.log(`\n❌ Failed to save master report: ${error.message}`);
    }
  }

  createSimplifiedReport(masterReport) {
    const simplified = `# ANOINT Array API Integration Test Report

## Test Summary
- **Date**: ${new Date(masterReport.metadata.testDate).toLocaleString()}
- **Target**: ${masterReport.metadata.targetUrl}
- **Duration**: ${Math.round(masterReport.metadata.totalDuration / 1000)}s
- **Overall Success Rate**: ${masterReport.summary.overallSuccessRate}%

## Production Readiness
- **Score**: ${masterReport.productionReadiness.score}/100
- **Status**: ${masterReport.productionReadiness.status}

## API Health Status
${Object.entries(masterReport.apiHealth).map(([api, status]) => 
  `- **${api}**: ${status.toUpperCase()}`
).join('\n')}

## Test Suite Results
${Object.entries(masterReport.testSuiteResults).map(([suite, results]) => 
  `- **${suite}**: ${results.passedTests}/${results.totalTests} passed (${results.successRate}%)`
).join('\n')}

## Critical Issues
${masterReport.productionReadiness.criticalIssues.map(issue => `- ${issue}`).join('\n') || 'None'}

## Immediate Actions Required
${masterReport.recommendations.immediate.map(rec => `- ${rec}`).join('\n') || 'None'}

---
Generated by APIHammer Integration Test Suite
`;

    try {
      fs.writeFileSync('test-report-summary.md', simplified);
      console.log('📋 Simplified report saved to: test-report-summary.md');
    } catch (error) {
      console.log(`❌ Failed to save simplified report: ${error.message}`);
    }
  }
}

// CLI Interface
if (require.main === module) {
  const config = {
    supabaseUrl: process.env.SUPABASE_URL || 'https://your-project.supabase.co',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || 'your-anon-key'
  };

  // Validate configuration
  if (!config.supabaseUrl || config.supabaseUrl.includes('your-project')) {
    console.log('❌ Please set SUPABASE_URL environment variable');
    console.log('   Example: SUPABASE_URL=https://your-project.supabase.co npm run test:all');
    process.exit(1);
  }

  if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('your-anon-key')) {
    console.log('❌ Please set SUPABASE_ANON_KEY environment variable');
    console.log('   Example: SUPABASE_ANON_KEY=your-key-here npm run test:all');
    process.exit(1);
  }

  // Run all tests
  const masterRunner = new MasterTestRunner(config);
  masterRunner.runAllTestSuites().catch(error => {
    console.error('❌ Master test runner failed:', error);
    process.exit(1);
  });
}

module.exports = MasterTestRunner;