const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing the working tax page...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  try {
    console.log('Navigating to /test-taxes...');
    await page.goto('http://localhost:3002/test-taxes', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Test 1: Check if content is visible
    const hasContent = await page.evaluate(() => {
      return document.body.innerText.includes('Tax Management Test') &&
             document.body.innerText.includes('Business Number: 743839342RT0001') &&
             document.body.innerText.includes('Nova Scotia: 14% HST');
    });
    console.log('✓ Content visibility test:', hasContent ? 'PASS' : 'FAIL');

    // Test 2: Test Ontario calculation
    await page.select('select', 'ON'); // Select Ontario
    await page.click('button'); // Click Calculate Tax

    await new Promise(resolve => setTimeout(resolve, 1000));

    const ontarioResult = await page.evaluate(() => {
      return document.body.innerText.includes('Tax Calculation for Ontario') &&
             document.body.innerText.includes('$13.00'); // 13% of $100
    });
    console.log('✓ Ontario HST calculation test:', ontarioResult ? 'PASS' : 'FAIL');

    // Test 3: Test BC calculation
    await page.select('select', 'BC'); // Select BC
    await page.click('button'); // Click Calculate Tax

    await new Promise(resolve => setTimeout(resolve, 1000));

    const bcResult = await page.evaluate(() => {
      return document.body.innerText.includes('Tax Calculation for British Columbia') &&
             document.body.innerText.includes('$12.00'); // 12% of $100 (5% GST + 7% PST)
    });
    console.log('✓ BC GST+PST calculation test:', bcResult ? 'PASS' : 'FAIL');

    // Test 4: Test Nova Scotia calculation
    await page.select('select', 'NS'); // Select Nova Scotia
    await page.click('button'); // Click Calculate Tax

    await new Promise(resolve => setTimeout(resolve, 1000));

    const nsResult = await page.evaluate(() => {
      return document.body.innerText.includes('Tax Calculation for Nova Scotia') &&
             document.body.innerText.includes('$14.00'); // 14% of $100
    });
    console.log('✓ Nova Scotia 14% HST calculation test:', nsResult ? 'PASS' : 'FAIL');

    // Test 5: Test table data
    const tableData = await page.evaluate(() => {
      const tableText = document.body.innerText;
      return {
        hasOntario: tableText.includes('Ontario') && tableText.includes('13.00%'),
        hasBC: tableText.includes('British Columbia') && tableText.includes('5.00%') && tableText.includes('7.00%'),
        hasNovaScotia: tableText.includes('Nova Scotia') && tableText.includes('14.00%'),
        hasBusinessNumber: tableText.includes('743839342RT0001'),
        hasCompanyName: tableText.includes('ANOINT Array')
      };
    });

    console.log('✓ Table data tests:');
    console.log('  - Ontario 13% HST:', tableData.hasOntario ? 'PASS' : 'FAIL');
    console.log('  - BC GST+PST:', tableData.hasBC ? 'PASS' : 'FAIL');
    console.log('  - Nova Scotia 14% HST:', tableData.hasNovaScotia ? 'PASS' : 'FAIL');
    console.log('  - Business Number:', tableData.hasBusinessNumber ? 'PASS' : 'FAIL');
    console.log('  - Company Name:', tableData.hasCompanyName ? 'PASS' : 'FAIL');

    // Take final screenshot
    await page.screenshot({ path: 'working-tax-page.png', fullPage: true });
    console.log('📸 Screenshot saved: working-tax-page.png');

    const allTestsPassed = hasContent && ontarioResult && bcResult && nsResult && 
                           tableData.hasOntario && tableData.hasBC && tableData.hasNovaScotia &&
                           tableData.hasBusinessNumber && tableData.hasCompanyName;

    console.log('\n=== FINAL RESULT ===');
    console.log(allTestsPassed ? '🎉 ALL TESTS PASSED!' : '❌ SOME TESTS FAILED');

    // Keep browser open for inspection
    console.log('\nPress Ctrl+C to close browser...');
    await new Promise(() => {});

  } catch (error) {
    console.error('Test error:', error.message);
  }
})();