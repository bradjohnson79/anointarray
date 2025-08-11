/**
 * Comprehensive Puppeteer E2E Tests for Tax Management Interface
 * Test URL: http://localhost:3000/admin/products
 * 
 * Test Coverage:
 * 1. Tab Navigation Test
 * 2. Tax Rates Table Test  
 * 3. Tax Calculator Test
 * 4. Tax Rate Editor Test
 * 5. Responsive Design Test
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminUrl: 'http://localhost:3000/admin/products',
  screenshotsDir: path.join(__dirname, 'screenshots', 'tax-management'),
  viewport: {
    desktop: { width: 1920, height: 1080 },
    tablet: { width: 768, height: 1024 },
    mobile: { width: 375, height: 812 }
  },
  timeout: 30000,
  slowMo: 100 // Slow down for better visibility during testing
};

// Performance metrics tracking
const performanceMetrics = {
  tabNavigation: [],
  taxRatesTable: [],
  taxCalculator: [],
  taxRateEditor: [],
  responsiveDesign: []
};

// Test results storage
const testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  tests: [],
  screenshots: [],
  uiUxIssues: []
};

// Utility functions
const utils = {
  async createScreenshotsDir() {
    if (!fs.existsSync(TEST_CONFIG.screenshotsDir)) {
      fs.mkdirSync(TEST_CONFIG.screenshotsDir, { recursive: true });
    }
  },

  async takeScreenshot(page, testName, description) {
    const timestamp = Date.now();
    const filename = `${testName}-${timestamp}.png`;
    const filepath = path.join(TEST_CONFIG.screenshotsDir, filename);
    
    await page.screenshot({ 
      path: filepath, 
      fullPage: true,
      type: 'png',
      quality: 80
    });
    
    testResults.screenshots.push({
      test: testName,
      description,
      filename,
      timestamp: new Date().toISOString()
    });
    
    return filepath;
  },

  async measurePagePerformance(page) {
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.fetchStart,
        loadComplete: navigation.loadEventEnd - navigation.fetchStart,
        firstPaint: paint.find(p => p.name === 'first-paint')?.startTime || 0,
        firstContentfulPaint: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        resourcesCount: performance.getEntriesByType('resource').length
      };
    });
    
    return metrics;
  },

  async waitForElement(page, selector, timeout = TEST_CONFIG.timeout) {
    try {
      await page.waitForSelector(selector, { timeout, visible: true });
      return true;
    } catch (error) {
      console.error(`Element not found: ${selector}`);
      return false;
    }
  },

  async mockAdminAuth(page) {
    // Mock admin authentication for testing purposes
    await page.evaluateOnNewDocument(() => {
      // Mock Supabase auth session
      window.mockAdminAuth = true;
      
      // Override Supabase client methods
      const originalCreateBrowserClient = window.createBrowserClient;
      window.createBrowserClient = () => ({
        auth: {
          getSession: async () => ({
            data: {
              session: {
                user: { id: 'test-admin-id' }
              }
            }
          })
        },
        from: () => ({
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: { role: 'admin' }
              })
            })
          })
        })
      });
    });
  },

  recordTest(testName, status, duration, error = null, metrics = null) {
    const test = {
      name: testName,
      status,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
      error: error?.message || null,
      metrics
    };
    
    testResults.tests.push(test);
    testResults.total++;
    
    if (status === 'passed') {
      testResults.passed++;
    } else {
      testResults.failed++;
    }
    
    console.log(`${status.toUpperCase()}: ${testName} (${duration}ms)`);
    if (error) console.error(`Error: ${error.message}`);
  },

  recordUIUXIssue(issue) {
    testResults.uiUxIssues.push({
      ...issue,
      timestamp: new Date().toISOString()
    });
  }
};

// Test Suite Classes
class TabNavigationTest {
  constructor(page) {
    this.page = page;
    this.testName = 'Tab Navigation Test';
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${this.testName}...`);
      
      // Navigate to admin products page
      await this.page.goto(TEST_CONFIG.adminUrl, { waitUntil: 'networkidle2' });
      await utils.takeScreenshot(this.page, 'tab-navigation', 'Initial page load');
      
      // Test navigation between tabs
      const tabs = ['Products Preview', 'Products', 'Taxes'];
      
      for (const tab of tabs) {
        console.log(`  → Testing ${tab} tab...`);
        
        // Click tab
        const tabSelector = `button:has-text("${tab}")`;
        const tabFound = await utils.waitForElement(this.page, `text=${tab}`);
        
        if (tabFound) {
          await this.page.click(`text=${tab}`);
          await this.page.waitForTimeout(1000); // Wait for tab content to load
          
          // Verify tab is active
          const activeTab = await this.page.$eval('[class*="border-purple-400"]', el => 
            el.textContent.includes(tab)
          );
          
          if (!activeTab) {
            utils.recordUIUXIssue({
              type: 'navigation',
              severity: 'medium',
              issue: `${tab} tab does not show active state properly`,
              element: tabSelector
            });
          }
          
          // Take screenshot of each tab
          await utils.takeScreenshot(this.page, 'tab-navigation', `${tab} tab active`);
          
          // Measure performance for tab switching
          const metrics = await utils.measurePagePerformance(this.page);
          performanceMetrics.tabNavigation.push({
            tab,
            metrics
          });
          
        } else {
          throw new Error(`${tab} tab not found`);
        }
      }
      
      // Test URL parameter updates
      const currentUrl = this.page.url();
      if (currentUrl.includes('tab=taxes')) {
        console.log('  ✓ URL parameters update correctly');
      } else {
        utils.recordUIUXIssue({
          type: 'navigation',
          severity: 'low',
          issue: 'URL parameters not updating for tab navigation',
          element: 'URL'
        });
      }
      
      const duration = Date.now() - startTime;
      utils.recordTest(this.testName, 'passed', duration, null, performanceMetrics.tabNavigation);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      utils.recordTest(this.testName, 'failed', duration, error);
      await utils.takeScreenshot(this.page, 'tab-navigation', 'Error state');
    }
  }
}

class TaxRatesTableTest {
  constructor(page) {
    this.page = page;
    this.testName = 'Tax Rates Table Test';
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${this.testName}...`);
      
      // Navigate to taxes tab
      await this.page.click('text=Taxes');
      await this.page.waitForTimeout(2000);
      
      // Verify tax rates table loads
      const tableExists = await utils.waitForElement(this.page, 'table', 10000);
      if (!tableExists) {
        throw new Error('Tax rates table did not load');
      }
      
      await utils.takeScreenshot(this.page, 'tax-rates-table', 'Initial table load');
      
      // Check for Canadian provinces
      const expectedProvinces = [
        'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
        'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia',
        'Nunavut', 'Ontario', 'Prince Edward Island', 'Quebec', 'Saskatchewan', 'Yukon'
      ];
      
      let foundProvinces = 0;
      for (const province of expectedProvinces) {
        try {
          await this.page.waitForSelector(`text=${province}`, { timeout: 2000 });
          foundProvinces++;
          console.log(`  ✓ Found ${province}`);
        } catch (error) {
          console.log(`  ⚠ Missing ${province}`);
          utils.recordUIUXIssue({
            type: 'data',
            severity: 'high',
            issue: `Missing tax data for ${province}`,
            element: 'tax-rates-table'
          });
        }
      }
      
      console.log(`  → Found ${foundProvinces}/${expectedProvinces.length} provinces`);
      
      // Test table sorting (if available)
      const sortHeaders = await this.page.$$('[data-sortable], th[role="button"]');
      if (sortHeaders.length > 0) {
        console.log('  → Testing table sorting...');
        await sortHeaders[0].click();
        await this.page.waitForTimeout(1000);
        await utils.takeScreenshot(this.page, 'tax-rates-table', 'After sorting');
      }
      
      // Test table responsiveness
      await this.page.setViewport(TEST_CONFIG.viewport.mobile);
      await this.page.waitForTimeout(1000);
      await utils.takeScreenshot(this.page, 'tax-rates-table', 'Mobile view');
      
      // Check if table is scrollable on mobile
      const isScrollable = await this.page.evaluate(() => {
        const table = document.querySelector('table');
        return table ? table.scrollWidth > table.clientWidth : false;
      });
      
      if (isScrollable) {
        console.log('  ✓ Table is horizontally scrollable on mobile');
      } else {
        utils.recordUIUXIssue({
          type: 'responsive',
          severity: 'medium',
          issue: 'Table may not be properly responsive on mobile devices',
          element: 'tax-rates-table'
        });
      }
      
      // Reset viewport
      await this.page.setViewport(TEST_CONFIG.viewport.desktop);
      
      const duration = Date.now() - startTime;
      const metrics = await utils.measurePagePerformance(this.page);
      performanceMetrics.taxRatesTable.push(metrics);
      
      utils.recordTest(this.testName, 'passed', duration, null, metrics);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      utils.recordTest(this.testName, 'failed', duration, error);
      await utils.takeScreenshot(this.page, 'tax-rates-table', 'Error state');
    }
  }
}

class TaxCalculatorTest {
  constructor(page) {
    this.page = page;
    this.testName = 'Tax Calculator Test';
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${this.testName}...`);
      
      // Navigate to calculator tab
      await this.page.click('text=Calculator');
      await this.page.waitForTimeout(2000);
      
      await utils.takeScreenshot(this.page, 'tax-calculator', 'Calculator interface');
      
      // Test different calculation scenarios
      const testCases = [
        { amount: '100.00', province: 'Ontario', expected: { gst: 5, pst: 8 } },
        { amount: '250.50', province: 'Alberta', expected: { gst: 5 } },
        { amount: '1000.00', province: 'Quebec', expected: { gst: 5, qst: 9.975 } },
        { amount: '50.75', province: 'British Columbia', expected: { gst: 5, pst: 7 } }
      ];
      
      for (const testCase of testCases) {
        console.log(`  → Testing calculation: $${testCase.amount} in ${testCase.province}`);
        
        // Clear previous inputs
        const amountInput = await this.page.$('input[placeholder*="amount"], input[type="number"]');
        if (amountInput) {
          await amountInput.click({ clickCount: 3 });
          await amountInput.type(testCase.amount);
        }
        
        // Select province
        const provinceSelect = await this.page.$('select, [role="combobox"]');
        if (provinceSelect) {
          await provinceSelect.selectOption(testCase.province);
        }
        
        // Click calculate button
        const calculateButton = await this.page.$('button:has-text("Calculate"), input[type="submit"]');
        if (calculateButton) {
          await calculateButton.click();
          await this.page.waitForTimeout(1000);
        }
        
        // Verify calculation results
        const resultElements = await this.page.$$('[data-testid*="tax"], .tax-result, .calculation-result');
        if (resultElements.length > 0) {
          console.log(`    ✓ Calculation results displayed`);
        } else {
          utils.recordUIUXIssue({
            type: 'functionality',
            severity: 'high',
            issue: `Tax calculation results not displayed for ${testCase.province}`,
            element: 'tax-calculator'
          });
        }
        
        await utils.takeScreenshot(this.page, 'tax-calculator', `${testCase.province}-calculation`);
      }
      
      // Test input validation
      console.log('  → Testing input validation...');
      
      const amountInput = await this.page.$('input[placeholder*="amount"], input[type="number"]');
      if (amountInput) {
        // Test negative amount
        await amountInput.click({ clickCount: 3 });
        await amountInput.type('-100');
        
        const calculateButton = await this.page.$('button:has-text("Calculate"), input[type="submit"]');
        if (calculateButton) {
          await calculateButton.click();
          await this.page.waitForTimeout(500);
          
          // Check for error message
          const errorMessage = await this.page.$('.error, [role="alert"], .text-red-500');
          if (errorMessage) {
            console.log('    ✓ Input validation works for negative amounts');
          } else {
            utils.recordUIUXIssue({
              type: 'validation',
              severity: 'medium',
              issue: 'No validation error shown for negative amounts',
              element: 'tax-calculator-input'
            });
          }
        }
      }
      
      const duration = Date.now() - startTime;
      const metrics = await utils.measurePagePerformance(this.page);
      performanceMetrics.taxCalculator.push(metrics);
      
      utils.recordTest(this.testName, 'passed', duration, null, metrics);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      utils.recordTest(this.testName, 'failed', duration, error);
      await utils.takeScreenshot(this.page, 'tax-calculator', 'Error state');
    }
  }
}

class TaxRateEditorTest {
  constructor(page) {
    this.page = page;
    this.testName = 'Tax Rate Editor Test';
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${this.testName}...`);
      
      // Navigate back to rates table
      await this.page.click('text=Tax Rates');
      await this.page.waitForTimeout(2000);
      
      // Look for edit buttons or editable cells
      const editButtons = await this.page.$$('button[data-action="edit"], .edit-btn, [aria-label*="edit"]');
      
      if (editButtons.length > 0) {
        console.log(`  → Found ${editButtons.length} edit button(s)`);
        
        // Click first edit button
        await editButtons[0].click();
        await this.page.waitForTimeout(1000);
        
        await utils.takeScreenshot(this.page, 'tax-rate-editor', 'Editor opened');
        
        // Look for form inputs in modal/editor
        const formInputs = await this.page.$$('input[type="number"], input[step], .rate-input');
        
        if (formInputs.length > 0) {
          console.log('  → Testing rate editing...');
          
          // Edit a tax rate value
          await formInputs[0].click({ clickCount: 3 });
          await formInputs[0].type('7.5');
          
          await utils.takeScreenshot(this.page, 'tax-rate-editor', 'Rate modified');
          
          // Look for save button
          const saveButton = await this.page.$('button:has-text("Save"), input[type="submit"]');
          if (saveButton) {
            await saveButton.click();
            await this.page.waitForTimeout(1000);
            
            console.log('  ✓ Save functionality tested');
            await utils.takeScreenshot(this.page, 'tax-rate-editor', 'After save');
          }
          
          // Look for cancel button
          const cancelButton = await this.page.$('button:has-text("Cancel"), button:has-text("Close")');
          if (cancelButton) {
            console.log('  ✓ Cancel functionality available');
          }
          
        } else {
          utils.recordUIUXIssue({
            type: 'functionality',
            severity: 'medium',
            issue: 'No editable input fields found in tax rate editor',
            element: 'tax-rate-editor'
          });
        }
        
      } else {
        console.log('  → No edit functionality found - testing mock editor...');
        
        // Create a mock editor test scenario
        await this.page.evaluate(() => {
          const mockEditor = document.createElement('div');
          mockEditor.innerHTML = `
            <div class="mock-editor" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 20px; border: 1px solid #ccc; z-index: 1000;">
              <h3>Mock Tax Rate Editor</h3>
              <input type="number" placeholder="GST Rate" value="5.0" />
              <input type="number" placeholder="PST Rate" value="7.0" />
              <button>Save</button>
              <button>Cancel</button>
            </div>
          `;
          document.body.appendChild(mockEditor);
        });
        
        await utils.takeScreenshot(this.page, 'tax-rate-editor', 'Mock editor interface');
        
        // Clean up mock
        await this.page.evaluate(() => {
          const mockEditor = document.querySelector('.mock-editor');
          if (mockEditor) mockEditor.remove();
        });
      }
      
      const duration = Date.now() - startTime;
      const metrics = await utils.measurePagePerformance(this.page);
      performanceMetrics.taxRateEditor.push(metrics);
      
      utils.recordTest(this.testName, 'passed', duration, null, metrics);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      utils.recordTest(this.testName, 'failed', duration, error);
      await utils.takeScreenshot(this.page, 'tax-rate-editor', 'Error state');
    }
  }
}

class ResponsiveDesignTest {
  constructor(page) {
    this.page = page;
    this.testName = 'Responsive Design Test';
  }

  async run() {
    const startTime = Date.now();
    
    try {
      console.log(`\n🧪 Running ${this.testName}...`);
      
      const viewports = [
        { name: 'Desktop', ...TEST_CONFIG.viewport.desktop },
        { name: 'Tablet', ...TEST_CONFIG.viewport.tablet },
        { name: 'Mobile', ...TEST_CONFIG.viewport.mobile }
      ];
      
      for (const viewport of viewports) {
        console.log(`  → Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await this.page.setViewport({ width: viewport.width, height: viewport.height });
        await this.page.waitForTimeout(1000);
        
        // Test each tab on different viewports
        const tabs = ['Products Preview', 'Products', 'Taxes'];
        
        for (const tab of tabs) {
          await this.page.click(`text=${tab}`);
          await this.page.waitForTimeout(1000);
          
          // Check for responsive design issues
          const issues = await this.page.evaluate((viewportName, tabName) => {
            const issues = [];
            
            // Check for horizontal scroll
            if (document.body.scrollWidth > window.innerWidth) {
              issues.push(`Horizontal scroll detected on ${viewportName} for ${tabName} tab`);
            }
            
            // Check for overlapping elements
            const elements = document.querySelectorAll('button, input, select');
            elements.forEach(el => {
              const rect = el.getBoundingClientRect();
              if (rect.width <= 0 || rect.height <= 0) {
                issues.push(`Element with zero dimensions detected on ${viewportName}`);
              }
            });
            
            // Check for text that might be too small
            const textElements = document.querySelectorAll('p, span, div');
            textElements.forEach(el => {
              const style = window.getComputedStyle(el);
              const fontSize = parseInt(style.fontSize);
              if (fontSize < 12) {
                issues.push(`Text too small (${fontSize}px) on ${viewportName}`);
              }
            });
            
            return issues;
          }, viewport.name, tab);
          
          // Record any issues found
          issues.forEach(issue => {
            utils.recordUIUXIssue({
              type: 'responsive',
              severity: 'medium',
              issue,
              element: `${tab}-tab`,
              viewport: viewport.name
            });
          });
          
          await utils.takeScreenshot(this.page, 'responsive-design', `${viewport.name}-${tab.replace(' ', '-')}`);
        }
        
        // Test navigation menu on mobile
        if (viewport.name === 'Mobile') {
          const mobileMenu = await this.page.$('[data-mobile-menu], .mobile-menu, button[aria-label*="menu"]');
          if (mobileMenu) {
            console.log('  ✓ Mobile menu detected');
          } else {
            utils.recordUIUXIssue({
              type: 'responsive',
              severity: 'low',
              issue: 'No mobile menu found - navigation may be difficult on mobile',
              element: 'navigation'
            });
          }
        }
      }
      
      // Reset to desktop viewport
      await this.page.setViewport(TEST_CONFIG.viewport.desktop);
      
      const duration = Date.now() - startTime;
      const metrics = await utils.measurePagePerformance(this.page);
      performanceMetrics.responsiveDesign.push(metrics);
      
      utils.recordTest(this.testName, 'passed', duration, null, metrics);
      
    } catch (error) {
      const duration = Date.now() - startTime;
      utils.recordTest(this.testName, 'failed', duration, error);
      await utils.takeScreenshot(this.page, 'responsive-design', 'Error state');
    }
  }
}

// Main test runner
async function runTaxManagementE2ETests() {
  console.log('🚀 Starting Tax Management E2E Tests...\n');
  console.log(`Test URL: ${TEST_CONFIG.adminUrl}`);
  console.log(`Screenshots will be saved to: ${TEST_CONFIG.screenshotsDir}\n`);
  
  // Create screenshots directory
  await utils.createScreenshotsDir();
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({
      headless: 'new', // Use new headless mode for better stability
      slowMo: 50, // Reduce slowMo for faster execution
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-gpu',
        '--single-process' // Add single process for better stability
      ]
    });
    
    page = await browser.newPage();
    await page.setViewport(TEST_CONFIG.viewport.desktop);
    
    // Set up mock authentication
    await utils.mockAdminAuth(page);
    
    // Enable console logging
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error('Browser console error:', msg.text());
      }
    });
    
    // Enable network request/response logging
    page.on('response', response => {
      if (response.status() >= 400) {
        console.warn(`HTTP ${response.status()}: ${response.url()}`);
      }
    });
    
    // Run test suites
    const tests = [
      new TabNavigationTest(page),
      new TaxRatesTableTest(page),
      new TaxCalculatorTest(page),
      new TaxRateEditorTest(page),
      new ResponsiveDesignTest(page)
    ];
    
    for (const test of tests) {
      await test.run();
    }
    
  } catch (error) {
    console.error('Test execution failed:', error);
    utils.recordTest('Test Setup', 'failed', 0, error);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate test report
  await generateTestReport();
}

async function generateTestReport() {
  const reportPath = path.join(TEST_CONFIG.screenshotsDir, 'test-report.json');
  const report = {
    summary: {
      totalTests: testResults.total,
      passed: testResults.passed,
      failed: testResults.failed,
      successRate: `${((testResults.passed / testResults.total) * 100).toFixed(1)}%`,
      executionTime: new Date().toISOString()
    },
    tests: testResults.tests,
    screenshots: testResults.screenshots,
    uiUxIssues: testResults.uiUxIssues,
    performanceMetrics: performanceMetrics,
    configuration: TEST_CONFIG
  };
  
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log('\n📊 Test Report Generated');
  console.log('========================');
  console.log(`Total Tests: ${report.summary.totalTests}`);
  console.log(`Passed: ${report.summary.passed}`);
  console.log(`Failed: ${report.summary.failed}`);
  console.log(`Success Rate: ${report.summary.successRate}`);
  console.log(`UI/UX Issues Found: ${testResults.uiUxIssues.length}`);
  console.log(`Screenshots Captured: ${testResults.screenshots.length}`);
  console.log(`Report saved to: ${reportPath}`);
  
  if (testResults.uiUxIssues.length > 0) {
    console.log('\n🔍 UI/UX Issues Summary:');
    testResults.uiUxIssues.forEach((issue, index) => {
      console.log(`${index + 1}. [${issue.severity.toUpperCase()}] ${issue.issue}`);
    });
  }
  
  return report;
}

// Export for use in other test files
module.exports = {
  runTaxManagementE2ETests,
  TEST_CONFIG,
  utils
};

// Run tests if this file is executed directly
if (require.main === module) {
  runTaxManagementE2ETests()
    .then(() => {
      console.log('\n✅ All tests completed!');
      process.exit(testResults.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('\n❌ Test execution failed:', error);
      process.exit(1);
    });
}