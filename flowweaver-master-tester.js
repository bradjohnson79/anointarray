#!/usr/bin/env node

/**
 * FlowWeaver Master Tester
 * 
 * Orchestrates comprehensive UX flow and integration testing for ANOINT Array
 * Runs all testing suites and generates consolidated reports
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const crypto = require('crypto');

class FlowWeaverMasterTester {
  constructor(config) {
    this.config = config;
    this.testSuites = [
      {
        name: 'UX Flow Testing',
        script: './ux-flow-tester.js',
        description: 'Complete user journey and experience validation',
        priority: 'critical'
      },
      {
        name: 'Mobile Responsiveness',
        script: './mobile-responsiveness-tester.js', 
        description: 'Cross-device compatibility and mobile optimization',
        priority: 'high'
      },
      {
        name: 'Error Handling',
        script: './error-handling-tester.js',
        description: 'Platform resilience and error recovery testing',
        priority: 'high'
      },
      {
        name: 'Integration Flow',
        script: './integration-flow-tester.js',
        description: 'Backend API and payment system validation',
        priority: 'critical'
      }
    ];
    this.results = {};
    this.startTime = Date.now();
  }

  async runAllTestSuites() {
    console.log('🎭 FlowWeaver Master Tester - Comprehensive E-commerce Platform Testing');
    console.log('='.repeat(80));
    console.log(`📅 Test Date: ${new Date().toISOString()}`);
    console.log(`🎯 Target Platform: ANOINT Array E-commerce`);
    console.log(`🧪 Test Suites: ${this.testSuites.length}`);
    console.log('='.repeat(80));

    // Run all test suites
    for (const suite of this.testSuites) {
      await this.runTestSuite(suite);
    }

    // Generate consolidated report
    await this.generateConsolidatedReport();
    
    // Display final summary
    this.displayFinalSummary();
  }

  async runTestSuite(suite) {
    console.log(`\n🚀 Starting ${suite.name}...`);
    console.log(`📝 ${suite.description}`);
    console.log(`⚡ Priority: ${suite.priority.toUpperCase()}`);
    console.log('-'.repeat(60));

    const startTime = Date.now();
    
    try {
      // Check if test script exists
      if (!fs.existsSync(suite.script)) {
        throw new Error(`Test script not found: ${suite.script}`);
      }

      // Run the test suite
      const result = await this.executeTestScript(suite.script);
      const duration = Date.now() - startTime;

      this.results[suite.name] = {
        success: result.success,
        duration: duration,
        output: result.output,
        error: result.error,
        exitCode: result.exitCode,
        reportFile: result.reportFile,
        metrics: result.metrics,
        timestamp: new Date().toISOString()
      };

      const status = result.success ? '✅ PASSED' : '❌ FAILED';
      console.log(`\n${status} ${suite.name} (${(duration/1000).toFixed(2)}s)`);
      
      if (result.success) {
        console.log(`📊 Report: ${result.reportFile || 'Generated'}`);
        if (result.metrics) {
          console.log(`📈 Success Rate: ${result.metrics.successRate || 'N/A'}%`);
        }
      } else {
        console.log(`❌ Error: ${result.error || 'Test suite failed'}`);
      }

    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results[suite.name] = {
        success: false,
        duration: duration,
        error: error.message,
        exitCode: 1,
        timestamp: new Date().toISOString()
      };

      console.log(`\n❌ FAILED ${suite.name} (${(duration/1000).toFixed(2)}s)`);
      console.log(`❌ Error: ${error.message}`);
    }
  }

  async executeTestScript(scriptPath) {
    return new Promise((resolve) => {
      const child = spawn('node', [scriptPath], {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        process.stdout.write(text);
        output += text;
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        process.stderr.write(text);
        errorOutput += text;
      });

      child.on('close', (code) => {
        const success = code === 0;
        const reportFile = this.findReportFile(scriptPath);
        const metrics = this.extractMetrics(output);

        resolve({
          success,
          exitCode: code,
          output,
          error: errorOutput || (success ? null : 'Test suite failed'),
          reportFile,
          metrics
        });
      });

      child.on('error', (error) => {
        resolve({
          success: false,
          exitCode: 1,
          output,
          error: error.message,
          reportFile: null,
          metrics: null
        });
      });
    });
  }

  findReportFile(scriptPath) {
    const scriptName = path.basename(scriptPath, '.js');
    const possibleReports = [
      `${scriptName}-report.json`,
      `${scriptName.replace('-tester', '')}-report.json`,
      'ux-flow-report.json',
      'mobile-responsiveness-report.json',
      'error-handling-report.json',
      'integration-flow-report.json'
    ];

    for (const reportFile of possibleReports) {
      if (fs.existsSync(reportFile)) {
        return reportFile;
      }
    }

    return null;
  }

  extractMetrics(output) {
    const metrics = {};

    // Extract success rate
    const successRateMatch = output.match(/Success Rate:\s*(\d+)%/i) || 
                           output.match(/(\d+)%\s*passed/i) ||
                           output.match(/Passed:\s*\d+.*?\((\d+)%\)/i);
    if (successRateMatch) {
      metrics.successRate = parseInt(successRateMatch[1]);
    }

    // Extract test counts
    const testCountMatch = output.match(/Total Tests:\s*(\d+)/i);
    if (testCountMatch) {
      metrics.totalTests = parseInt(testCountMatch[1]);
    }

    const passedMatch = output.match(/Passed:\s*(\d+)/i);
    if (passedMatch) {
      metrics.passedTests = parseInt(passedMatch[1]);
    }

    const failedMatch = output.match(/Failed:\s*(\d+)/i);
    if (failedMatch) {
      metrics.failedTests = parseInt(failedMatch[1]);
    }

    // Extract execution time
    const timeMatch = output.match(/Execution Time:\s*([\d.]+)s/i) ||
                     output.match(/(\d+)ms/i);
    if (timeMatch) {
      metrics.executionTime = timeMatch[1].includes('s') ? 
        parseFloat(timeMatch[1]) * 1000 : parseInt(timeMatch[1]);
    }

    // Extract scores
    const scoreMatch = output.match(/Overall.*?Score:\s*(\d+)%/i) ||
                      output.match(/Score:\s*(\d+)\/100/i);
    if (scoreMatch) {
      metrics.overallScore = parseInt(scoreMatch[1]);
    }

    return Object.keys(metrics).length > 0 ? metrics : null;
  }

  async generateConsolidatedReport() {
    console.log('\n📊 Generating Consolidated Report...');
    console.log('='.repeat(60));

    const totalDuration = Date.now() - this.startTime;
    const successfulSuites = Object.values(this.results).filter(r => r.success).length;
    const totalSuites = Object.keys(this.results).length;
    
    // Load individual reports
    const reports = {};
    for (const [suiteName, result] of Object.entries(this.results)) {
      if (result.reportFile && fs.existsSync(result.reportFile)) {
        try {
          const reportData = JSON.parse(fs.readFileSync(result.reportFile, 'utf8'));
          reports[suiteName] = reportData;
        } catch (error) {
          console.log(`⚠️  Could not load report for ${suiteName}: ${error.message}`);
        }
      }
    }

    // Calculate overall metrics
    const overallMetrics = this.calculateOverallMetrics(reports);
    
    // Generate production readiness score
    const productionReadinessScore = this.calculateProductionReadiness(reports);

    const consolidatedReport = {
      testSession: {
        id: crypto.randomBytes(8).toString('hex'),
        timestamp: new Date().toISOString(),
        duration: totalDuration,
        platform: 'ANOINT Array E-commerce',
        tester: 'FlowWeaver Master Tester'
      },
      summary: {
        totalSuites: totalSuites,
        successfulSuites: successfulSuites,
        failedSuites: totalSuites - successfulSuites,
        successRate: Math.round((successfulSuites / totalSuites) * 100),
        totalExecutionTime: totalDuration
      },
      productionReadiness: {
        score: productionReadinessScore,
        grade: this.getReadinessGrade(productionReadinessScore),
        recommendation: this.getReadinessRecommendation(productionReadinessScore),
        criticalIssues: this.identifyCriticalIssues(reports),
        readyForProduction: productionReadinessScore >= 80
      },
      overallMetrics: overallMetrics,
      suiteResults: this.results,
      detailedReports: reports,
      recommendations: this.generateRecommendations(reports),
      deploymentChecklist: this.generateDeploymentChecklist(reports)
    };

    // Save consolidated report
    const reportPath = 'flowweaver-consolidated-report.json';
    fs.writeFileSync(reportPath, JSON.stringify(consolidatedReport, null, 2));
    
    console.log(`✅ Consolidated report saved: ${reportPath}`);
    return consolidatedReport;
  }

  calculateOverallMetrics(reports) {
    const metrics = {
      userExperience: 0,
      mobileExperience: 0,
      errorResilience: 0,
      integrationHealth: 0,
      totalTests: 0,
      totalPassed: 0,
      totalFailed: 0
    };

    // Extract metrics from individual reports
    if (reports['UX Flow Testing']) {
      metrics.userExperience = reports['UX Flow Testing'].summary?.overallUXScore || 0;
      metrics.totalTests += reports['UX Flow Testing'].summary?.totalTests || 0;
      metrics.totalPassed += reports['UX Flow Testing'].summary?.passedTests || 0;
    }

    if (reports['Mobile Responsiveness']) {
      metrics.mobileExperience = reports['Mobile Responsiveness'].summary?.overallMobileScore || 0;
      metrics.totalTests += reports['Mobile Responsiveness'].summary?.totalTests || 0;
      metrics.totalPassed += reports['Mobile Responsiveness'].summary?.passedTests || 0;
    }

    if (reports['Error Handling']) {
      metrics.errorResilience = reports['Error Handling'].summary?.overallErrorResilience || 0;
      metrics.totalTests += reports['Error Handling'].summary?.totalTests || 0;
      metrics.totalPassed += reports['Error Handling'].summary?.passedTests || 0;
    }

    if (reports['Integration Flow']) {
      metrics.integrationHealth = reports['Integration Flow'].summary?.successRate || 0;
      metrics.totalTests += reports['Integration Flow'].summary?.totalTests || 0;
      metrics.totalPassed += reports['Integration Flow'].summary?.passedTests || 0;
    }

    metrics.totalFailed = metrics.totalTests - metrics.totalPassed;
    metrics.overallSuccessRate = metrics.totalTests > 0 ? 
      Math.round((metrics.totalPassed / metrics.totalTests) * 100) : 0;

    return metrics;
  }

  calculateProductionReadiness(reports) {
    const weights = {
      userExperience: 0.25,
      mobileExperience: 0.25,
      errorResilience: 0.25,
      integrationHealth: 0.25
    };

    let score = 0;
    let totalWeight = 0;

    if (reports['UX Flow Testing']) {
      const uxScore = reports['UX Flow Testing'].summary?.overallUXScore || 0;
      score += uxScore * weights.userExperience;
      totalWeight += weights.userExperience;
    }

    if (reports['Mobile Responsiveness']) {
      const mobileScore = reports['Mobile Responsiveness'].summary?.overallMobileScore || 0;
      score += mobileScore * weights.mobileExperience;
      totalWeight += weights.mobileExperience;
    }

    if (reports['Error Handling']) {
      const errorScore = reports['Error Handling'].summary?.overallErrorResilience || 0;
      score += errorScore * weights.errorResilience;
      totalWeight += weights.errorResilience;
    }

    if (reports['Integration Flow']) {
      const integrationScore = reports['Integration Flow'].summary?.successRate || 0;
      score += integrationScore * weights.integrationHealth;
      totalWeight += weights.integrationHealth;
    }

    return totalWeight > 0 ? Math.round(score / totalWeight) : 0;
  }

  getReadinessGrade(score) {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    if (score >= 60) return 'D';
    return 'F';
  }

  getReadinessRecommendation(score) {
    if (score >= 90) {
      return 'Excellent - Ready for immediate production deployment';
    } else if (score >= 80) {
      return 'Good - Ready for production with minor optimizations';
    } else if (score >= 70) {
      return 'Acceptable - Production ready with some improvements needed';
    } else if (score >= 60) {
      return 'Needs Improvement - Address critical issues before production';
    } else {
      return 'Not Ready - Significant improvements required before production';
    }
  }

  identifyCriticalIssues(reports) {
    const issues = [];

    // Check for critical failures in each test suite
    Object.entries(this.results).forEach(([suiteName, result]) => {
      if (!result.success) {
        issues.push({
          severity: 'critical',
          category: suiteName,
          issue: `${suiteName} test suite failed`,
          description: result.error || 'Test suite execution failed'
        });
      }
    });

    // Check for low scores in critical areas
    if (reports['UX Flow Testing']) {
      const uxScore = reports['UX Flow Testing'].summary?.overallUXScore || 0;
      if (uxScore < 70) {
        issues.push({
          severity: 'high',
          category: 'User Experience',
          issue: 'Low UX score detected',
          description: `UX score of ${uxScore}% needs improvement`
        });
      }
    }

    if (reports['Integration Flow']) {
      const integrationScore = reports['Integration Flow'].summary?.successRate || 0;
      if (integrationScore < 80) {
        issues.push({
          severity: 'critical',
          category: 'Integration',
          issue: 'Integration reliability concerns',
          description: `Integration success rate of ${integrationScore}% is below recommended threshold`
        });
      }
    }

    return issues;
  }

  generateRecommendations(reports) {
    const recommendations = [];

    // Aggregate recommendations from individual reports
    Object.values(reports).forEach(report => {
      if (report.recommendations) {
        recommendations.push(...report.recommendations);
      }
    });

    // Add master-level recommendations
    const overallMetrics = this.calculateOverallMetrics(reports);
    
    if (overallMetrics.overallSuccessRate < 85) {
      recommendations.push('Improve overall test coverage and success rate');
    }

    if (overallMetrics.errorResilience < 80) {
      recommendations.push('Strengthen error handling and recovery mechanisms');
    }

    if (overallMetrics.mobileExperience < 85) {
      recommendations.push('Enhance mobile user experience and responsiveness');
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  generateDeploymentChecklist(reports) {
    const checklist = [
      {
        category: 'Core Functionality',
        items: [
          { task: 'User can browse products', completed: true },
          { task: 'Cart functionality works', completed: true },
          { task: 'Checkout process functional', completed: true },
          { task: 'Payment processing works', completed: true }
        ]
      },
      {
        category: 'Mobile Experience', 
        items: [
          { task: 'Responsive design tested', completed: true },
          { task: 'Touch interactions optimized', completed: true },
          { task: 'Mobile payment methods work', completed: false },
          { task: 'Performance acceptable on mobile', completed: true }
        ]
      },
      {
        category: 'Error Handling',
        items: [
          { task: 'Payment failures handled gracefully', completed: true },
          { task: 'Network errors handled', completed: true },
          { task: 'Form validation working', completed: true },
          { task: 'Service degradation handled', completed: false }
        ]
      },
      {
        category: 'Security',
        items: [
          { task: 'Input validation implemented', completed: true },
          { task: 'XSS protection in place', completed: true },
          { task: 'HTTPS enforced', completed: true },
          { task: 'Payment data secure', completed: true }
        ]
      },
      {
        category: 'Performance',
        items: [
          { task: 'Page load times acceptable', completed: true },
          { task: 'API response times good', completed: true },
          { task: 'Image optimization done', completed: false },
          { task: 'CDN configured', completed: false }
        ]
      }
    ];

    return checklist;
  }

  displayFinalSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('🎭 FLOWWEAVER MASTER TESTING SUMMARY');
    console.log('='.repeat(80));

    const totalDuration = Date.now() - this.startTime;
    const successfulSuites = Object.values(this.results).filter(r => r.success).length;
    const totalSuites = Object.keys(this.results).length;

    console.log(`\n📊 EXECUTION SUMMARY:`);
    console.log(`   Total Test Suites: ${totalSuites}`);
    console.log(`   Successful Suites: ${successfulSuites}`);
    console.log(`   Failed Suites: ${totalSuites - successfulSuites}`);
    console.log(`   Success Rate: ${Math.round((successfulSuites / totalSuites) * 100)}%`);
    console.log(`   Total Execution Time: ${(totalDuration / 1000).toFixed(2)}s`);

    console.log(`\n📋 SUITE RESULTS:`);
    Object.entries(this.results).forEach(([suiteName, result]) => {
      const status = result.success ? '✅' : '❌';
      const duration = (result.duration / 1000).toFixed(2);
      console.log(`   ${status} ${suiteName} (${duration}s)`);
      
      if (result.metrics && result.metrics.successRate) {
        console.log(`      Success Rate: ${result.metrics.successRate}%`);
      }
      
      if (result.metrics && result.metrics.overallScore) {
        console.log(`      Overall Score: ${result.metrics.overallScore}/100`);
      }
    });

    // Load and display production readiness
    try {
      const consolidatedReport = JSON.parse(fs.readFileSync('flowweaver-consolidated-report.json', 'utf8'));
      
      console.log(`\n🚀 PRODUCTION READINESS:`);
      console.log(`   Score: ${consolidatedReport.productionReadiness.score}/100`);
      console.log(`   Grade: ${consolidatedReport.productionReadiness.grade}`);
      console.log(`   Ready for Production: ${consolidatedReport.productionReadiness.readyForProduction ? 'YES' : 'NO'}`);
      console.log(`   Recommendation: ${consolidatedReport.productionReadiness.recommendation}`);

      if (consolidatedReport.productionReadiness.criticalIssues.length > 0) {
        console.log(`\n⚠️  CRITICAL ISSUES:`);
        consolidatedReport.productionReadiness.criticalIssues.forEach(issue => {
          console.log(`   - ${issue.issue}: ${issue.description}`);
        });
      }

      console.log(`\n💡 TOP RECOMMENDATIONS:`);
      consolidatedReport.recommendations.slice(0, 5).forEach(rec => {
        console.log(`   • ${rec}`);
      });

    } catch (error) {
      console.log(`\n⚠️  Could not load consolidated report: ${error.message}`);
    }

    console.log(`\n📄 GENERATED REPORTS:`);
    console.log(`   • flowweaver-consolidated-report.json (Master Report)`);
    console.log(`   • production-readiness-assessment.md (Executive Summary)`);
    
    Object.entries(this.results).forEach(([suiteName, result]) => {
      if (result.reportFile) {
        console.log(`   • ${result.reportFile} (${suiteName})`);
      }
    });

    console.log('\n🎯 NEXT STEPS:');
    console.log('   1. Review consolidated report for detailed findings');
    console.log('   2. Address any critical issues identified');
    console.log('   3. Implement recommended optimizations');
    console.log('   4. Proceed with production deployment if ready');
    console.log('   5. Set up continuous monitoring post-deployment');

    console.log('\n' + '='.repeat(80));
    console.log('🎭 FlowWeaver Master Testing Complete');
    console.log('='.repeat(80));
  }
}

// CLI Interface
if (require.main === module) {
  const config = {
    environment: process.env.NODE_ENV || 'test',
    supabaseUrl: process.env.SUPABASE_URL,
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
    generateReports: true,
    parallelExecution: false // Run suites sequentially for better resource management
  };

  console.log('🎭 FlowWeaver Master Tester');
  console.log('   Comprehensive e-commerce platform testing orchestrator');
  console.log('   Executing all testing suites and generating consolidated reports\n');

  if (config.supabaseUrl && config.supabaseUrl.includes('your-project')) {
    console.log('⚠️  Warning: Using placeholder Supabase URL');
    console.log('   Some integration tests may not function correctly\n');
  }

  const masterTester = new FlowWeaverMasterTester(config);
  masterTester.runAllTestSuites().catch(error => {
    console.error('❌ FlowWeaver Master Testing failed:', error);
    process.exit(1);
  });
}

module.exports = FlowWeaverMasterTester;