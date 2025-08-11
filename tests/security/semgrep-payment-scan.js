const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * SEMGREP Security Analysis for Anoint Array Payment Systems
 * Reviews payment processing code for security vulnerabilities
 */

const PAYMENT_SCAN_CONFIG = {
  rules: [
    'auto'
  ],
  scanPaths: [
    'app/api',
    'supabase/functions',
    'middleware.ts'
  ],
  outputFormat: 'json'
};

async function runSemgrepScan() {
  console.log('🔍 Starting SEMGREP Security Analysis for Payment Systems...\n');
  
  const timestamp = new Date().toISOString();
  const reportPath = `tests/security/reports/semgrep-payment-${Date.now()}.json`;
  
  // Ensure reports directory exists
  const reportsDir = path.dirname(reportPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  try {
    // Build semgrep command
    const rules = PAYMENT_SCAN_CONFIG.rules.map(rule => `--config=${rule}`).join(' ');
    const paths = PAYMENT_SCAN_CONFIG.scanPaths.join(' ');
    
    const semgrepCommand = `semgrep ${rules} --json --output="${reportPath}" ${paths}`;
    
    console.log('Running command:', semgrepCommand);
    console.log('Scanning paths:', PAYMENT_SCAN_CONFIG.scanPaths);
    console.log('Using rules:', PAYMENT_SCAN_CONFIG.rules);
    
    return new Promise((resolve, reject) => {
      exec(semgrepCommand, { cwd: process.cwd(), maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
        if (error && error.code !== 1) { // Semgrep returns 1 when findings exist
          console.error('SEMGREP execution error:', error);
          reject(error);
          return;
        }

        console.log('✅ SEMGREP scan completed successfully');
        if (stderr) {
          console.log('SEMGREP warnings:', stderr);
        }

        // Parse results
        let results = { results: [] };
        try {
          if (fs.existsSync(reportPath)) {
            const reportContent = fs.readFileSync(reportPath, 'utf8');
            results = JSON.parse(reportContent);
          }
        } catch (parseError) {
          console.error('Error parsing SEMGREP results:', parseError);
        }

        // Analyze findings
        const findings = results.results || [];
        const paymentFindings = findings.filter(finding => 
          finding.path.includes('checkout') || 
          finding.path.includes('payment') ||
          finding.path.includes('stripe') ||
          finding.path.includes('paypal') ||
          finding.path.includes('cart') ||
          finding.check_id.toLowerCase().includes('payment')
        );

        const criticalFindings = findings.filter(f => f.extra?.severity === 'ERROR');
        const warningFindings = findings.filter(f => f.extra?.severity === 'WARNING');
        const infoFindings = findings.filter(f => f.extra?.severity === 'INFO');

        const summary = {
          timestamp,
          scan_config: PAYMENT_SCAN_CONFIG,
          total_findings: findings.length,
          payment_specific_findings: paymentFindings.length,
          severity_breakdown: {
            critical: criticalFindings.length,
            warning: warningFindings.length,
            info: infoFindings.length
          },
          top_security_issues: findings
            .filter(f => f.extra?.severity === 'ERROR')
            .slice(0, 10)
            .map(f => ({
              rule: f.check_id,
              file: f.path,
              line: f.start.line,
              severity: f.extra?.severity,
              message: f.extra?.message,
              category: f.extra?.metadata?.category
            })),
          payment_security_analysis: {
            authentication_issues: findings.filter(f => 
              f.check_id.includes('auth') || f.extra?.message?.toLowerCase().includes('auth')
            ).length,
            input_validation_issues: findings.filter(f =>
              f.check_id.includes('injection') || f.check_id.includes('validation')
            ).length,
            crypto_issues: findings.filter(f =>
              f.check_id.includes('crypto') || f.check_id.includes('hash')
            ).length,
            session_issues: findings.filter(f =>
              f.check_id.includes('session') || f.check_id.includes('cookie')
            ).length
          },
          recommendations: generateSecurityRecommendations(findings)
        };

        // Generate detailed report
        const detailedReport = {
          summary,
          all_findings: findings,
          report_path: reportPath
        };

        // Save summary report
        const summaryPath = `tests/security/reports/semgrep-payment-summary-${Date.now()}.json`;
        fs.writeFileSync(summaryPath, JSON.stringify(detailedReport, null, 2));

        console.log('\n📊 SEMGREP Security Analysis Results:');
        console.log(`Total findings: ${findings.length}`);
        console.log(`Payment-specific findings: ${paymentFindings.length}`);
        console.log(`Critical issues: ${criticalFindings.length}`);
        console.log(`Warnings: ${warningFindings.length}`);
        console.log(`Info: ${infoFindings.length}`);
        console.log(`\nDetailed report saved to: ${summaryPath}`);

        if (criticalFindings.length > 0) {
          console.log('\n🚨 CRITICAL SECURITY ISSUES FOUND:');
          criticalFindings.slice(0, 5).forEach((finding, index) => {
            console.log(`${index + 1}. ${finding.extra?.message || finding.check_id}`);
            console.log(`   File: ${finding.path}:${finding.start.line}`);
            console.log(`   Rule: ${finding.check_id}\n`);
          });
        }

        resolve(detailedReport);
      });
    });

  } catch (error) {
    console.error('Error running SEMGREP scan:', error);
    throw error;
  }
}

function generateSecurityRecommendations(findings) {
  const recommendations = [];

  // Check for common payment security issues
  const authIssues = findings.filter(f => f.check_id.includes('auth'));
  if (authIssues.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Authentication',
      issue: 'Authentication vulnerabilities detected',
      recommendation: 'Review authentication mechanisms, ensure proper JWT validation, implement rate limiting'
    });
  }

  const injectionIssues = findings.filter(f => f.check_id.includes('injection'));
  if (injectionIssues.length > 0) {
    recommendations.push({
      priority: 'CRITICAL', 
      category: 'Input Validation',
      issue: 'Injection vulnerabilities detected',
      recommendation: 'Implement proper input validation and sanitization for all payment forms'
    });
  }

  const cryptoIssues = findings.filter(f => f.check_id.includes('crypto') || f.check_id.includes('hash'));
  if (cryptoIssues.length > 0) {
    recommendations.push({
      priority: 'HIGH',
      category: 'Cryptography',
      issue: 'Cryptographic issues detected', 
      recommendation: 'Review cryptographic implementations, use secure random number generators'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      priority: 'INFO',
      category: 'General',
      issue: 'No major security issues detected',
      recommendation: 'Continue following security best practices and regular security reviews'
    });
  }

  return recommendations;
}

// Run if called directly
if (require.main === module) {
  runSemgrepScan()
    .then(results => {
      console.log('\n✅ SEMGREP security analysis completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ SEMGREP security analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { runSemgrepScan };