/**
 * HTML Report Generator for Tax Management E2E Tests
 * Converts JSON test results into a comprehensive HTML report
 */

const fs = require('fs');
const path = require('path');

const REPORT_CONFIG = {
  jsonReportPath: path.join(__dirname, 'screenshots', 'tax-management', 'test-report.json'),
  htmlReportPath: path.join(__dirname, 'screenshots', 'tax-management', 'test-report.html'),
  screenshotsDir: path.join(__dirname, 'screenshots', 'tax-management')
};

function generateHTMLReport() {
  try {
    // Read JSON report
    if (!fs.existsSync(REPORT_CONFIG.jsonReportPath)) {
      console.error('JSON report not found:', REPORT_CONFIG.jsonReportPath);
      process.exit(1);
    }
    
    const reportData = JSON.parse(fs.readFileSync(REPORT_CONFIG.jsonReportPath, 'utf8'));
    
    // Generate HTML content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Tax Management E2E Test Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
        }
        
        .summary-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .summary-card h3 {
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        
        .summary-card.success h3 { color: #10b981; }
        .summary-card.danger h3 { color: #ef4444; }
        .summary-card.info h3 { color: #3b82f6; }
        .summary-card.warning h3 { color: #f59e0b; }
        
        .section {
            background: white;
            margin-bottom: 2rem;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        
        .section-header {
            background: #374151;
            color: white;
            padding: 1rem 1.5rem;
            font-weight: 600;
            font-size: 1.1rem;
        }
        
        .section-content {
            padding: 1.5rem;
        }
        
        .test-list {
            list-style: none;
        }
        
        .test-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
            transition: background-color 0.2s;
        }
        
        .test-item:hover {
            background: #f9fafb;
        }
        
        .test-item:last-child {
            border-bottom: none;
        }
        
        .test-name {
            font-weight: 500;
        }
        
        .test-status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
            font-weight: 500;
        }
        
        .test-status.passed {
            background: #dcfce7;
            color: #166534;
        }
        
        .test-status.failed {
            background: #fef2f2;
            color: #991b1b;
        }
        
        .test-duration {
            font-size: 0.875rem;
            color: #6b7280;
            margin-left: 1rem;
        }
        
        .issue-list {
            list-style: none;
        }
        
        .issue-item {
            padding: 1rem;
            border-left: 4px solid;
            margin-bottom: 1rem;
            background: #f9fafb;
        }
        
        .issue-item.high {
            border-color: #ef4444;
            background: #fef2f2;
        }
        
        .issue-item.medium {
            border-color: #f59e0b;
            background: #fffbeb;
        }
        
        .issue-item.low {
            border-color: #10b981;
            background: #f0fdf4;
        }
        
        .issue-severity {
            display: inline-block;
            padding: 0.125rem 0.5rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            margin-bottom: 0.5rem;
        }
        
        .issue-severity.high {
            background: #ef4444;
            color: white;
        }
        
        .issue-severity.medium {
            background: #f59e0b;
            color: white;
        }
        
        .issue-severity.low {
            background: #10b981;
            color: white;
        }
        
        .screenshots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 1rem;
        }
        
        .screenshot-card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s;
        }
        
        .screenshot-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        }
        
        .screenshot-card img {
            width: 100%;
            height: 200px;
            object-fit: cover;
            cursor: pointer;
        }
        
        .screenshot-info {
            padding: 1rem;
        }
        
        .screenshot-test {
            font-weight: 500;
            color: #374151;
            margin-bottom: 0.25rem;
        }
        
        .screenshot-desc {
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .performance-metrics {
            display: grid;
            gap: 1rem;
        }
        
        .metric-card {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 6px;
            border-left: 4px solid #3b82f6;
        }
        
        .metric-title {
            font-weight: 500;
            margin-bottom: 0.5rem;
            color: #374151;
        }
        
        .metric-value {
            font-size: 1.5rem;
            font-weight: 600;
            color: #3b82f6;
        }
        
        .metric-unit {
            font-size: 0.875rem;
            color: #6b7280;
        }
        
        .no-data {
            text-align: center;
            color: #6b7280;
            font-style: italic;
            padding: 2rem;
        }
        
        .error-details {
            background: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 1rem;
            margin-top: 0.5rem;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
            color: #991b1b;
            white-space: pre-wrap;
        }
        
        .expandable {
            cursor: pointer;
        }
        
        .expandable-content {
            display: none;
        }
        
        .expandable.expanded .expandable-content {
            display: block;
        }
        
        @media (max-width: 768px) {
            .container {
                padding: 10px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
            
            .summary-grid {
                grid-template-columns: repeat(2, 1fr);
            }
            
            .test-item {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .test-duration {
                margin-left: 0;
                margin-top: 0.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 Tax Management E2E Test Report</h1>
            <p>Comprehensive testing results for the tax management interface</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
        
        <div class="summary-grid">
            <div class="summary-card info">
                <h3>${reportData.summary.totalTests}</h3>
                <p>Total Tests</p>
            </div>
            <div class="summary-card success">
                <h3>${reportData.summary.passed}</h3>
                <p>Passed</p>
            </div>
            <div class="summary-card danger">
                <h3>${reportData.summary.failed}</h3>
                <p>Failed</p>
            </div>
            <div class="summary-card warning">
                <h3>${reportData.summary.successRate}</h3>
                <p>Success Rate</p>
            </div>
            <div class="summary-card info">
                <h3>${reportData.screenshots.length}</h3>
                <p>Screenshots</p>
            </div>
            <div class="summary-card warning">
                <h3>${reportData.uiUxIssues.length}</h3>
                <p>UI/UX Issues</p>
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                📋 Test Results
            </div>
            <div class="section-content">
                ${reportData.tests.length > 0 ? `
                    <ul class="test-list">
                        ${reportData.tests.map(test => `
                            <li class="test-item expandable" onclick="toggleExpand(this)">
                                <div>
                                    <div class="test-name">${test.name}</div>
                                    ${test.error ? `
                                        <div class="expandable-content error-details">${test.error}</div>
                                    ` : ''}
                                </div>
                                <div>
                                    <span class="test-status ${test.status}">${test.status.toUpperCase()}</span>
                                    <span class="test-duration">${test.duration}</span>
                                </div>
                            </li>
                        `).join('')}
                    </ul>
                ` : '<div class="no-data">No test results available</div>'}
            </div>
        </div>
        
        ${reportData.uiUxIssues.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    🔍 UI/UX Issues Found
                </div>
                <div class="section-content">
                    <ul class="issue-list">
                        ${reportData.uiUxIssues.map(issue => `
                            <li class="issue-item ${issue.severity}">
                                <div class="issue-severity ${issue.severity}">${issue.severity}</div>
                                <div><strong>${issue.type.charAt(0).toUpperCase() + issue.type.slice(1)}:</strong> ${issue.issue}</div>
                                ${issue.element ? `<div style="margin-top: 0.5rem; font-size: 0.875rem; color: #6b7280;">Element: ${issue.element}</div>` : ''}
                                ${issue.viewport ? `<div style="margin-top: 0.25rem; font-size: 0.875rem; color: #6b7280;">Viewport: ${issue.viewport}</div>` : ''}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
        ` : ''}
        
        ${reportData.screenshots.length > 0 ? `
            <div class="section">
                <div class="section-header">
                    📷 Screenshots
                </div>
                <div class="section-content">
                    <div class="screenshots-grid">
                        ${reportData.screenshots.map(screenshot => `
                            <div class="screenshot-card">
                                <img src="${screenshot.filename}" alt="${screenshot.description}" onclick="openScreenshot('${screenshot.filename}')">
                                <div class="screenshot-info">
                                    <div class="screenshot-test">${screenshot.test}</div>
                                    <div class="screenshot-desc">${screenshot.description}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        ` : ''}
        
        <div class="section">
            <div class="section-header">
                ⚡ Performance Metrics
            </div>
            <div class="section-content">
                ${Object.keys(reportData.performanceMetrics).some(key => reportData.performanceMetrics[key].length > 0) ? `
                    <div class="performance-metrics">
                        ${Object.entries(reportData.performanceMetrics).map(([testType, metrics]) => {
                            if (metrics.length === 0) return '';
                            const avgMetrics = calculateAverageMetrics(metrics);
                            return `
                                <div class="metric-card">
                                    <div class="metric-title">${testType.charAt(0).toUpperCase() + testType.slice(1)} Performance</div>
                                    <div>
                                        <span class="metric-value">${avgMetrics.domContentLoaded}</span>
                                        <span class="metric-unit">ms DOM Content Loaded</span>
                                    </div>
                                    <div>
                                        <span class="metric-value">${avgMetrics.loadComplete}</span>
                                        <span class="metric-unit">ms Load Complete</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                ` : '<div class="no-data">No performance metrics available</div>'}
            </div>
        </div>
        
        <div class="section">
            <div class="section-header">
                ⚙️ Test Configuration
            </div>
            <div class="section-content">
                <div style="display: grid; gap: 1rem;">
                    <div><strong>Test URL:</strong> ${reportData.configuration.adminUrl}</div>
                    <div><strong>Browser:</strong> Headless Chromium</div>
                    <div><strong>Viewports:</strong> Desktop (${reportData.configuration.viewport.desktop.width}x${reportData.configuration.viewport.desktop.height}), Tablet (${reportData.configuration.viewport.tablet.width}x${reportData.configuration.viewport.tablet.height}), Mobile (${reportData.configuration.viewport.mobile.width}x${reportData.configuration.viewport.mobile.height})</div>
                    <div><strong>Timeout:</strong> ${reportData.configuration.timeout}ms</div>
                    <div><strong>Screenshots Directory:</strong> ${reportData.configuration.screenshotsDir}</div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        function toggleExpand(element) {
            element.classList.toggle('expanded');
        }
        
        function openScreenshot(filename) {
            window.open(filename, '_blank');
        }
        
        function calculateAverageMetrics(metrics) {
            if (!metrics.length) return { domContentLoaded: 0, loadComplete: 0 };
            
            const totals = metrics.reduce((acc, metric) => {
                const data = metric.metrics || metric;
                return {
                    domContentLoaded: acc.domContentLoaded + (data.domContentLoaded || 0),
                    loadComplete: acc.loadComplete + (data.loadComplete || 0)
                };
            }, { domContentLoaded: 0, loadComplete: 0 });
            
            return {
                domContentLoaded: Math.round(totals.domContentLoaded / metrics.length),
                loadComplete: Math.round(totals.loadComplete / metrics.length)
            };
        }
    </script>
</body>
</html>
    `.trim();
    
    // Write HTML report
    fs.writeFileSync(REPORT_CONFIG.htmlReportPath, htmlContent);
    console.log('✅ HTML report generated successfully:', REPORT_CONFIG.htmlReportPath);
    
  } catch (error) {
    console.error('❌ Failed to generate HTML report:', error.message);
    process.exit(1);
  }
}

// Helper function to calculate average metrics (used in HTML)
function calculateAverageMetrics(metrics) {
  if (!metrics.length) return { domContentLoaded: 0, loadComplete: 0 };
  
  const totals = metrics.reduce((acc, metric) => {
    const data = metric.metrics || metric;
    return {
      domContentLoaded: acc.domContentLoaded + (data.domContentLoaded || 0),
      loadComplete: acc.loadComplete + (data.loadComplete || 0)
    };
  }, { domContentLoaded: 0, loadComplete: 0 });
  
  return {
    domContentLoaded: Math.round(totals.domContentLoaded / metrics.length),
    loadComplete: Math.round(totals.loadComplete / metrics.length)
  };
}

// Run if this file is executed directly
if (require.main === module) {
  generateHTMLReport();
}

module.exports = { generateHTMLReport };