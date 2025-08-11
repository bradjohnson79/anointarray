const puppeteer = require('puppeteer');

async function testOrderPageDirect() {
  let browser;
  try {
    console.log('🔍 Testing Order Management page directly...');
    
    browser = await puppeteer.launch({ 
      headless: false,
      devtools: true,  // Open DevTools to see console
      args: ['--disable-web-security', '--disable-features=VizDisplayCompositor']
    });
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log(`🖥️  ${msg.type()}: ${msg.text()}`);
    });

    page.on('pageerror', error => {
      console.log(`❌ Page Error: ${error.message}`);
    });

    console.log('1. Testing homepage first...');
    await page.goto('http://localhost:3002', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    const homeAnalysis = await page.evaluate(() => ({
      title: document.title,
      bodyTextLength: document.body.textContent?.length || 0,
      hasContent: document.body.innerHTML.length > 1000,
      elementCount: document.querySelectorAll('*').length
    }));

    console.log(`✅ Homepage: ${homeAnalysis.bodyTextLength} chars, ${homeAnalysis.elementCount} elements`);
    await page.screenshot({ path: './test-homepage.png' });

    console.log('2. Testing admin orders page...');
    await page.goto('http://localhost:3002/admin/orders', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait longer for React to hydrate
    await new Promise(resolve => setTimeout(resolve, 8000));

    const ordersAnalysis = await page.evaluate(() => {
      // Look for auth-related elements
      const authElements = {
        protectedRoute: document.querySelector('[data-component="protected-route"]') || document.body.textContent?.includes('ProtectedRoute'),
        loginForm: document.querySelector('form[action*="login"]') || document.querySelector('input[type="email"]'),
        authContext: window.__NEXT_DATA__ ? 'Next.js loaded' : 'No Next.js',
        reactRoot: document.querySelector('#__next') ? 'React root found' : 'No React root'
      };

      return {
        title: document.title,
        bodyTextLength: document.body.textContent?.length || 0,
        hasOrderManagement: document.body.textContent?.includes('Order Management'),
        hasOrderText: document.body.textContent?.includes('order'),
        hasReactElements: document.querySelectorAll('[data-reactroot], [data-react-*]').length,
        elementCount: document.querySelectorAll('*').length,
        authElements,
        url: window.location.href,
        nextJsData: window.__NEXT_DATA__ ? 'Present' : 'Missing',
        reactVersion: window.React ? window.React.version : 'Not loaded'
      };
    });

    console.log('\n📊 Orders Page Analysis:');
    console.log('========================');
    console.log(`URL: ${ordersAnalysis.url}`);
    console.log(`Title: ${ordersAnalysis.title}`);
    console.log(`Body text length: ${ordersAnalysis.bodyTextLength}`);
    console.log(`Has "Order Management": ${ordersAnalysis.hasOrderManagement}`);
    console.log(`Has "order" text: ${ordersAnalysis.hasOrderText}`);
    console.log(`React elements: ${ordersAnalysis.hasReactElements}`);
    console.log(`Total elements: ${ordersAnalysis.elementCount}`);
    console.log(`Next.js data: ${ordersAnalysis.nextJsData}`);
    console.log(`React version: ${ordersAnalysis.reactVersion}`);
    console.log('\n🔐 Auth Elements:');
    Object.entries(ordersAnalysis.authElements).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    await page.screenshot({ path: './test-orders-direct.png', fullPage: true });
    console.log('\n📸 Screenshots saved: ./test-homepage.png, ./test-orders-direct.png');

    // Keep browser open for manual inspection
    console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
    await new Promise(resolve => setTimeout(resolve, 30000));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

testOrderPageDirect();