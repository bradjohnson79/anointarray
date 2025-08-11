const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runDemoTest() {
  console.log('🧪 Running Demo Tax Management Interface Test...');
  console.log('================================================\n');
  
  let browser;
  let results = {
    status: 'pending',
    tests: [],
    screenshots: [],
    issues: [],
    startTime: new Date()
  };
  
  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security',
        '--single-process'
      ]
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    console.log('✅ Browser launched successfully\n');
    
    // Create screenshots directory
    const screenshotsDir = path.join(__dirname, 'screenshots', 'tax-management');
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }
    
    // Test 1: Navigation to admin page
    console.log('📍 Test 1: Navigation to Admin Products Page');
    console.log('   → URL: http://localhost:3000/admin/products');
    
    const navStart = Date.now();
    await page.goto('http://localhost:3000/admin/products', { 
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    const navDuration = Date.now() - navStart;
    
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-load.png'),
      fullPage: true
    });
    
    console.log(`   ✅ Page loaded successfully (${navDuration}ms)`);
    results.tests.push({ name: 'Page Navigation', status: 'passed', duration: navDuration });
    results.screenshots.push({ name: '01-initial-load.png', description: 'Initial page load' });
    
    // Test 2: Check for tab navigation elements
    console.log('\n🔍 Test 2: Tab Navigation Elements');
    
    try {
      const tabs = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons
          .filter(btn => btn.textContent && (
            btn.textContent.includes('Products') || 
            btn.textContent.includes('Taxes') ||
            btn.textContent.includes('Preview')
          ))
          .map(btn => ({
            text: btn.textContent.trim(),
            classes: btn.className,
            visible: btn.offsetWidth > 0 && btn.offsetHeight > 0
          }));
      });
      
      console.log('   → Found tabs:', tabs.map(t => t.text));
      
      if (tabs.length >= 2) {
        console.log('   ✅ Tab navigation elements found');
        results.tests.push({ name: 'Tab Elements Detection', status: 'passed', count: tabs.length });
      } else {
        console.log('   ⚠️ Expected multiple tabs, found:', tabs.length);
        results.issues.push({ type: 'navigation', severity: 'medium', issue: 'Insufficient tab elements detected' });
      }
      
    } catch (error) {
      console.log('   ❌ Failed to detect tab elements:', error.message);
      results.tests.push({ name: 'Tab Elements Detection', status: 'failed', error: error.message });
    }
    
    // Test 3: Click Taxes tab if available
    console.log('\n💰 Test 3: Taxes Tab Interaction');
    
    try {
      const taxesTabClicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const taxesTab = buttons.find(btn => btn.textContent && btn.textContent.includes('Taxes'));
        if (taxesTab) {
          taxesTab.click();
          return true;
        }
        return false;
      });
      
      if (taxesTabClicked) {
        await page.waitForTimeout(2000); // Wait for content to load
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, '02-taxes-tab.png'),
          fullPage: true
        });
        
        console.log('   ✅ Taxes tab clicked successfully');
        results.tests.push({ name: 'Taxes Tab Click', status: 'passed' });
        results.screenshots.push({ name: '02-taxes-tab.png', description: 'Taxes tab activated' });
        
        // Check for tax-related content
        const taxContent = await page.evaluate(() => {
          const text = document.body.textContent.toLowerCase();
          const indicators = ['tax', 'gst', 'pst', 'hst', 'province', 'rate', 'canada'];
          return indicators.filter(indicator => text.includes(indicator));
        });
        
        console.log('   → Tax content indicators found:', taxContent);
        
      } else {
        console.log('   ⚠️ Taxes tab not found or not clickable');
        results.issues.push({ type: 'functionality', severity: 'high', issue: 'Taxes tab not accessible' });
      }
      
    } catch (error) {
      console.log('   ❌ Taxes tab interaction failed:', error.message);
      results.tests.push({ name: 'Taxes Tab Click', status: 'failed', error: error.message });
    }
    
    // Test 4: Check table elements
    console.log('\n📊 Test 4: Tax Rates Table Detection');
    
    try {
      const tableInfo = await page.evaluate(() => {
        const tables = document.querySelectorAll('table');
        const tableData = Array.from(tables).map(table => ({
          rows: table.querySelectorAll('tr').length,
          headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
          visible: table.offsetWidth > 0 && table.offsetHeight > 0
        }));
        
        return {
          count: tables.length,
          tables: tableData
        };
      });
      
      console.log('   → Tables found:', tableInfo.count);
      if (tableInfo.tables.length > 0) {
        tableInfo.tables.forEach((table, i) => {
          console.log(`   → Table ${i + 1}: ${table.rows} rows, headers: [${table.headers.join(', ')}]`);
        });
      }
      
      if (tableInfo.count > 0) {
        console.log('   ✅ Table elements detected');
        results.tests.push({ name: 'Table Detection', status: 'passed', tableCount: tableInfo.count });
      } else {
        console.log('   ⚠️ No table elements found');
        results.issues.push({ type: 'data', severity: 'medium', issue: 'No tax rates table detected' });
      }
      
    } catch (error) {
      console.log('   ❌ Table detection failed:', error.message);
      results.tests.push({ name: 'Table Detection', status: 'failed', error: error.message });
    }
    
    // Test 5: Responsive design check
    console.log('\n📱 Test 5: Responsive Design Check');
    
    const viewports = [
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Mobile', width: 375, height: 812 }
    ];
    
    for (const viewport of viewports) {
      try {
        console.log(`   → Testing ${viewport.name} (${viewport.width}x${viewport.height})`);
        
        await page.setViewport({ width: viewport.width, height: viewport.height });
        await page.waitForTimeout(1000);
        
        const responsiveIssues = await page.evaluate((viewportName) => {
          const issues = [];
          
          // Check for horizontal scroll
          if (document.body.scrollWidth > window.innerWidth) {
            issues.push(`Horizontal scroll on ${viewportName}`);
          }
          
          // Check for elements that might be too small
          const buttons = document.querySelectorAll('button');
          buttons.forEach(btn => {
            const rect = btn.getBoundingClientRect();
            if (rect.width > 0 && rect.width < 44) { // iOS minimum touch target
              issues.push(`Button too small (${Math.round(rect.width)}px) on ${viewportName}`);
            }
          });
          
          return issues;
        }, viewport.name);
        
        await page.screenshot({ 
          path: path.join(screenshotsDir, `03-${viewport.name.toLowerCase()}-view.png`),
          fullPage: true
        });
        
        if (responsiveIssues.length === 0) {
          console.log(`   ✅ ${viewport.name} view looks good`);
        } else {
          console.log(`   ⚠️ ${viewport.name} issues:`, responsiveIssues);
          responsiveIssues.forEach(issue => {
            results.issues.push({ type: 'responsive', severity: 'medium', issue, viewport: viewport.name });
          });
        }
        
        results.screenshots.push({ 
          name: `03-${viewport.name.toLowerCase()}-view.png`, 
          description: `${viewport.name} responsive view` 
        });
        
      } catch (error) {
        console.log(`   ❌ ${viewport.name} test failed:`, error.message);
      }
    }
    
    // Reset viewport
    await page.setViewport({ width: 1920, height: 1080 });
    
    results.status = 'completed';
    results.endTime = new Date();
    results.duration = results.endTime - results.startTime;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    results.status = 'failed';
    results.error = error.message;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
  
  // Generate summary report
  console.log('\n📊 Test Summary');
  console.log('================');
  console.log(`Status: ${results.status}`);
  console.log(`Duration: ${Math.round(results.duration / 1000)}s`);
  console.log(`Tests Run: ${results.tests.length}`);
  console.log(`Screenshots: ${results.screenshots.length}`);
  console.log(`Issues Found: ${results.issues.length}`);
  
  if (results.tests.length > 0) {
    console.log('\nTest Results:');
    results.tests.forEach((test, i) => {
      const status = test.status === 'passed' ? '✅' : '❌';
      console.log(`  ${i + 1}. ${status} ${test.name}`);
    });
  }
  
  if (results.issues.length > 0) {
    console.log('\nIssues Found:');
    results.issues.forEach((issue, i) => {
      const severity = issue.severity === 'high' ? '🔴' : issue.severity === 'medium' ? '🟡' : '🟢';
      console.log(`  ${i + 1}. ${severity} [${issue.type.toUpperCase()}] ${issue.issue}`);
    });
  }
  
  if (results.screenshots.length > 0) {
    console.log('\nScreenshots Captured:');
    results.screenshots.forEach((screenshot, i) => {
      console.log(`  ${i + 1}. 📷 ${screenshot.name} - ${screenshot.description}`);
    });
  }
  
  // Save detailed report
  const reportPath = path.join(__dirname, 'screenshots', 'tax-management', 'demo-test-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved: ${reportPath}`);
  
  console.log('\n✅ Demo test completed!');
  
  return results;
}

// Run the demo test
if (require.main === module) {
  runDemoTest().catch(console.error);
}

module.exports = { runDemoTest };