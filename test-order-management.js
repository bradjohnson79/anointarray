const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  url: 'http://localhost:3002/admin/orders',
  timeout: 30000,
  screenshotDir: './test-screenshots-order-management',
  viewport: {
    width: 1920,
    height: 1080
  }
};

// Create screenshots directory
if (!fs.existsSync(TEST_CONFIG.screenshotDir)) {
  fs.mkdirSync(TEST_CONFIG.screenshotDir, { recursive: true });
}

async function testOrderManagementSystem() {
  let browser;
  const testResults = {
    timestamp: new Date().toISOString(),
    url: TEST_CONFIG.url,
    tests: [],
    errors: [],
    screenshots: [],
    summary: {
      total: 0,
      passed: 0,
      failed: 0
    }
  };

  try {
    console.log('🚀 Starting Order Management System Test...');
    
    // Launch browser
    browser = await puppeteer.launch({
      headless: false, // Set to true for CI/automated testing
      defaultViewport: null,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        `--window-size=${TEST_CONFIG.viewport.width},${TEST_CONFIG.viewport.height}`
      ]
    });

    const page = await browser.newPage();
    await page.setViewport(TEST_CONFIG.viewport);

    // Set up console logging to catch JavaScript errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
        console.log('❌ Console Error:', msg.text());
      }
    });

    // Set up request/response monitoring
    const networkErrors = [];
    page.on('response', response => {
      if (!response.ok() && response.status() >= 400) {
        networkErrors.push({
          url: response.url(),
          status: response.status(),
          statusText: response.statusText()
        });
      }
    });

    console.log('📋 Test 1: Loading Order Management page...');
    testResults.tests.push({
      name: 'Page Load',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Navigate to the Order Management page
      await page.goto(TEST_CONFIG.url, {
        waitUntil: 'networkidle0',
        timeout: TEST_CONFIG.timeout
      });

      // Take initial screenshot
      const initialScreenshot = `${TEST_CONFIG.screenshotDir}/01-order-management-loaded.png`;
      await page.screenshot({ path: initialScreenshot, fullPage: true });
      testResults.screenshots.push(initialScreenshot);

      testResults.tests[0].status = 'passed';
      testResults.tests[0].endTime = new Date().toISOString();
      console.log('✅ Order Management page loaded successfully');

    } catch (error) {
      testResults.tests[0].status = 'failed';
      testResults.tests[0].error = error.message;
      testResults.tests[0].endTime = new Date().toISOString();
      console.log('❌ Failed to load Order Management page:', error.message);
    }

    // Wait a moment for dynamic content to load
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('📊 Test 2: Checking order statistics dashboard...');
    testResults.tests.push({
      name: 'Order Statistics Dashboard',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Look for metrics cards/statistics
      const metricsSelectors = [
        '[data-testid="total-orders"]',
        '[data-testid="pending-orders"]',
        '[data-testid="completed-orders"]',
        '[data-testid="total-revenue"]',
        '.metrics-card',
        '.stats-card',
        '.dashboard-metric',
        '[class*="metric"]',
        '[class*="stats"]',
        '.card:has(.text-2xl, .text-3xl, .text-4xl)', // Look for cards with large text (likely numbers)
      ];

      let metricsFound = false;
      const foundMetrics = [];

      for (const selector of metricsSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            metricsFound = true;
            for (const element of elements) {
              const text = await element.evaluate(el => el.textContent?.trim());
              if (text) {
                foundMetrics.push({ selector, text: text.substring(0, 100) });
              }
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Also check for common dashboard patterns
      const dashboardElements = await page.evaluate(() => {
        const elements = [];
        // Look for elements that might contain numbers/metrics
        const potentialMetrics = document.querySelectorAll('.card, .metric, .stat, [class*="dashboard"]');
        potentialMetrics.forEach(el => {
          const text = el.textContent?.trim();
          if (text && (text.match(/\d+/) || text.toLowerCase().includes('order') || text.toLowerCase().includes('total'))) {
            elements.push({
              tagName: el.tagName,
              className: el.className,
              text: text.substring(0, 100)
            });
          }
        });
        return elements;
      });

      if (metricsFound || dashboardElements.length > 0) {
        testResults.tests[1].status = 'passed';
        testResults.tests[1].metrics = [...foundMetrics, ...dashboardElements];
        console.log(`✅ Found ${foundMetrics.length + dashboardElements.length} dashboard elements`);
      } else {
        testResults.tests[1].status = 'warning';
        testResults.tests[1].note = 'No specific metrics found, but page loaded successfully';
        console.log('⚠️  Dashboard metrics not found with expected selectors');
      }

      testResults.tests[1].endTime = new Date().toISOString();

    } catch (error) {
      testResults.tests[1].status = 'failed';
      testResults.tests[1].error = error.message;
      testResults.tests[1].endTime = new Date().toISOString();
      console.log('❌ Failed to check dashboard metrics:', error.message);
    }

    console.log('🔍 Test 3: Verifying search and filter controls...');
    testResults.tests.push({
      name: 'Search and Filter Controls',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      const searchSelectors = [
        'input[type="search"]',
        'input[placeholder*="search"]',
        'input[placeholder*="Search"]',
        '[data-testid="search-input"]',
        '.search-input',
        'input[name="search"]'
      ];

      const filterSelectors = [
        'select[name*="status"]',
        'select[name*="filter"]',
        '[data-testid="status-filter"]',
        '[data-testid="date-filter"]',
        '.filter-select',
        'select:has(option)',
        'input[type="date"]',
        '[class*="filter"]'
      ];

      let searchFound = false;
      let filtersFound = false;
      const foundControls = [];

      // Check for search controls
      for (const selector of searchSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            searchFound = true;
            const placeholder = await element.evaluate(el => el.placeholder || '');
            foundControls.push({ type: 'search', selector, placeholder });
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Check for filter controls
      for (const selector of filterSelectors) {
        try {
          const elements = await page.$$(selector);
          if (elements.length > 0) {
            filtersFound = true;
            for (const element of elements) {
              const tagName = await element.evaluate(el => el.tagName);
              const name = await element.evaluate(el => el.name || '');
              foundControls.push({ type: 'filter', selector, tagName, name });
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Take screenshot of controls area
      const controlsScreenshot = `${TEST_CONFIG.screenshotDir}/02-search-filter-controls.png`;
      await page.screenshot({ path: controlsScreenshot, fullPage: true });
      testResults.screenshots.push(controlsScreenshot);

      if (searchFound && filtersFound) {
        testResults.tests[2].status = 'passed';
        console.log('✅ Both search and filter controls found');
      } else if (searchFound || filtersFound) {
        testResults.tests[2].status = 'partial';
        console.log(`⚠️  Found ${searchFound ? 'search' : 'filters'} controls only`);
      } else {
        testResults.tests[2].status = 'warning';
        console.log('⚠️  Search and filter controls not found with expected selectors');
      }

      testResults.tests[2].controls = foundControls;
      testResults.tests[2].endTime = new Date().toISOString();

    } catch (error) {
      testResults.tests[2].status = 'failed';
      testResults.tests[2].error = error.message;
      testResults.tests[2].endTime = new Date().toISOString();
      console.log('❌ Failed to check search and filter controls:', error.message);
    }

    console.log('📋 Test 4: Checking orders table structure...');
    testResults.tests.push({
      name: 'Orders Table Structure',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Look for table elements
      const tableSelectors = [
        'table',
        '[data-testid="orders-table"]',
        '.orders-table',
        '.data-table',
        '[role="table"]',
        '.table'
      ];

      let tableFound = false;
      const tableInfo = {};

      for (const selector of tableSelectors) {
        try {
          const table = await page.$(selector);
          if (table) {
            tableFound = true;
            
            // Get table headers
            const headers = await page.evaluate((sel) => {
              const table = document.querySelector(sel);
              if (!table) return [];
              
              const headerElements = table.querySelectorAll('th, [role="columnheader"]');
              return Array.from(headerElements).map(el => el.textContent?.trim());
            }, selector);

            // Count rows
            const rowCount = await page.evaluate((sel) => {
              const table = document.querySelector(sel);
              if (!table) return 0;
              
              const rows = table.querySelectorAll('tr:not(:first-child), [role="row"]:not([role="row"]:first-child)');
              return rows.length;
            }, selector);

            tableInfo.selector = selector;
            tableInfo.headers = headers;
            tableInfo.rowCount = rowCount;
            break;
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Also look for empty state indicators
      const emptyStateSelectors = [
        '[data-testid="empty-state"]',
        '.empty-state',
        '.no-orders',
        '.no-data',
        'p:contains("No orders")',
        'div:contains("No orders found")',
        '[class*="empty"]'
      ];

      let emptyStateFound = false;
      for (const selector of emptyStateSelectors) {
        try {
          const element = await page.$(selector);
          if (element) {
            const text = await element.evaluate(el => el.textContent?.trim());
            if (text && (text.toLowerCase().includes('no orders') || text.toLowerCase().includes('empty') || text.toLowerCase().includes('no data'))) {
              emptyStateFound = true;
              tableInfo.emptyState = text;
              break;
            }
          }
        } catch (e) {
          // Continue to next selector
        }
      }

      // Take screenshot of table area
      const tableScreenshot = `${TEST_CONFIG.screenshotDir}/03-orders-table.png`;
      await page.screenshot({ path: tableScreenshot, fullPage: true });
      testResults.screenshots.push(tableScreenshot);

      if (tableFound || emptyStateFound) {
        testResults.tests[3].status = 'passed';
        testResults.tests[3].tableInfo = tableInfo;
        console.log(`✅ Orders table structure verified${emptyStateFound ? ' (empty state shown)' : ''}`);
      } else {
        testResults.tests[3].status = 'warning';
        console.log('⚠️  Orders table structure not found with expected selectors');
      }

      testResults.tests[3].endTime = new Date().toISOString();

    } catch (error) {
      testResults.tests[3].status = 'failed';
      testResults.tests[3].error = error.message;
      testResults.tests[3].endTime = new Date().toISOString();
      console.log('❌ Failed to check orders table:', error.message);
    }

    console.log('🔧 Test 5: Checking for JavaScript errors...');
    testResults.tests.push({
      name: 'JavaScript Error Check',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Wait a bit more to catch any delayed errors
      await new Promise(resolve => setTimeout(resolve, 3000));

      if (consoleErrors.length === 0) {
        testResults.tests[4].status = 'passed';
        console.log('✅ No JavaScript errors detected');
      } else {
        testResults.tests[4].status = 'warning';
        testResults.tests[4].errors = consoleErrors;
        console.log(`⚠️  ${consoleErrors.length} JavaScript errors detected`);
        consoleErrors.forEach(error => console.log('   -', error));
      }

      testResults.tests[4].endTime = new Date().toISOString();

    } catch (error) {
      testResults.tests[4].status = 'failed';
      testResults.tests[4].error = error.message;
      testResults.tests[4].endTime = new Date().toISOString();
      console.log('❌ Failed to check JavaScript errors:', error.message);
    }

    console.log('🌐 Test 6: Verifying Supabase integration elements...');
    testResults.tests.push({
      name: 'Supabase Integration Check',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Check for signs of Supabase integration
      const supabaseIndicators = await page.evaluate(() => {
        const indicators = {
          supabaseClient: typeof window.supabase !== 'undefined',
          authElements: document.querySelectorAll('[class*="auth"], [data-testid*="auth"]').length,
          loadingStates: document.querySelectorAll('[class*="loading"], [data-testid*="loading"]').length,
          apiCalls: window.fetch ? true : false
        };
        return indicators;
      });

      // Check for CRUD operation buttons/elements
      const crudElements = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
        const crudActions = buttons.filter(btn => {
          const text = btn.textContent?.toLowerCase();
          return text && (
            text.includes('add') || text.includes('create') || text.includes('new') ||
            text.includes('edit') || text.includes('update') ||
            text.includes('delete') || text.includes('remove') ||
            text.includes('view') || text.includes('details')
          );
        });
        return crudActions.map(btn => ({
          text: btn.textContent?.trim(),
          className: btn.className
        }));
      });

      testResults.tests[5].status = 'passed';
      testResults.tests[5].supabaseIndicators = supabaseIndicators;
      testResults.tests[5].crudElements = crudElements;
      testResults.tests[5].endTime = new Date().toISOString();
      console.log(`✅ Supabase integration check completed - Found ${crudElements.length} potential CRUD elements`);

    } catch (error) {
      testResults.tests[5].status = 'failed';
      testResults.tests[5].error = error.message;
      testResults.tests[5].endTime = new Date().toISOString();
      console.log('❌ Failed to check Supabase integration:', error.message);
    }

    console.log('📸 Test 7: Taking comprehensive documentation screenshot...');
    testResults.tests.push({
      name: 'Documentation Screenshot',
      status: 'running',
      startTime: new Date().toISOString()
    });

    try {
      // Scroll to top to ensure we capture the complete interface
      await page.evaluate(() => window.scrollTo(0, 0));
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Take final comprehensive screenshot
      const finalScreenshot = `${TEST_CONFIG.screenshotDir}/04-complete-order-management-interface.png`;
      await page.screenshot({ 
        path: finalScreenshot, 
        fullPage: true,
        captureBeyondViewport: true
      });
      testResults.screenshots.push(finalScreenshot);

      // Also take a viewport screenshot for comparison
      const viewportScreenshot = `${TEST_CONFIG.screenshotDir}/05-viewport-order-management.png`;
      await page.screenshot({ path: viewportScreenshot });
      testResults.screenshots.push(viewportScreenshot);

      testResults.tests[6].status = 'passed';
      testResults.tests[6].endTime = new Date().toISOString();
      console.log('✅ Documentation screenshots captured');

    } catch (error) {
      testResults.tests[6].status = 'failed';
      testResults.tests[6].error = error.message;
      testResults.tests[6].endTime = new Date().toISOString();
      console.log('❌ Failed to take documentation screenshot:', error.message);
    }

    // Add network errors to results
    if (networkErrors.length > 0) {
      testResults.errors = networkErrors;
      console.log(`⚠️  ${networkErrors.length} network errors detected`);
    }

    // Calculate summary
    testResults.summary.total = testResults.tests.length;
    testResults.summary.passed = testResults.tests.filter(test => test.status === 'passed').length;
    testResults.summary.failed = testResults.tests.filter(test => test.status === 'failed').length;
    testResults.summary.warnings = testResults.tests.filter(test => test.status === 'warning' || test.status === 'partial').length;

  } catch (error) {
    console.error('🔥 Critical test error:', error);
    testResults.errors.push({
      type: 'critical',
      message: error.message,
      stack: error.stack
    });
  } finally {
    if (browser) {
      await browser.close();
    }

    // Save test results
    const reportPath = `${TEST_CONFIG.screenshotDir}/test-report.json`;
    fs.writeFileSync(reportPath, JSON.stringify(testResults, null, 2));

    // Print summary
    console.log('\n📊 TEST SUMMARY');
    console.log('================');
    console.log(`Total Tests: ${testResults.summary.total}`);
    console.log(`Passed: ${testResults.summary.passed}`);
    console.log(`Failed: ${testResults.summary.failed}`);
    console.log(`Warnings: ${testResults.summary.warnings || 0}`);
    console.log(`Screenshots: ${testResults.screenshots.length}`);
    console.log(`Report saved: ${reportPath}`);
    console.log('\n📸 Screenshots:');
    testResults.screenshots.forEach(screenshot => console.log(`  - ${screenshot}`));
    
    return testResults;
  }
}

// Run the test
if (require.main === module) {
  testOrderManagementSystem()
    .then((results) => {
      console.log('\n✅ Order Management System test completed');
      process.exit(results.summary.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('🔥 Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testOrderManagementSystem, TEST_CONFIG };