const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting simple test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null
  });

  const page = await browser.newPage();
  
  try {
    console.log('Navigating to /admin/taxes...');
    await page.goto('http://localhost:3002/admin/taxes', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Get page title and URL
    const title = await page.title();
    const url = page.url();
    console.log('Page Title:', title);
    console.log('Current URL:', url);

    // Check if we can see any content
    const bodyText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    console.log('Body text (first 500 chars):', bodyText);

    // Check for specific elements
    const hasTaxManagement = await page.evaluate(() => {
      return document.body.innerText.includes('Tax Management');
    });
    console.log('Has "Tax Management" text:', hasTaxManagement);

    // Check for loading indicators
    const hasLoading = await page.evaluate(() => {
      return document.body.innerText.includes('Loading') || 
             document.body.innerHTML.includes('loading') ||
             document.body.innerHTML.includes('spinner');
    });
    console.log('Has loading indicators:', hasLoading);

    // Check for error messages
    const hasError = await page.evaluate(() => {
      return document.body.innerText.includes('404') || 
             document.body.innerText.includes('Error') ||
             document.body.innerText.includes('not found');
    });
    console.log('Has error messages:', hasError);

    // Take a screenshot
    await page.screenshot({ path: 'debug-screenshot.png', fullPage: true });
    console.log('Screenshot saved as debug-screenshot.png');

    // Wait 5 seconds to see what happens
    console.log('Waiting 5 seconds...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check again after waiting
    const bodyTextAfter = await page.evaluate(() => {
      return document.body.innerText.substring(0, 500);
    });
    console.log('Body text after waiting:', bodyTextAfter);

    await page.screenshot({ path: 'debug-screenshot-after.png', fullPage: true });
    console.log('Second screenshot saved');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await browser.close();
  }
})();