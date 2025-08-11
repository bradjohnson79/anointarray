const puppeteer = require('puppeteer');

async function testPageContent() {
  let browser;
  try {
    console.log('🔍 Testing page content...');
    
    browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    
    await page.goto('http://localhost:3002/admin/orders', { 
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    // Wait for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Get detailed page analysis
    const analysis = await page.evaluate(() => {
      return {
        title: document.title,
        bodyHTML: document.body.innerHTML.substring(0, 1000) + '...',
        bodyText: document.body.textContent?.substring(0, 500) + '...' || '',
        bodyTextLength: document.body.textContent?.length || 0,
        hasOrderText: document.body.textContent?.includes('Order Management') || false,
        elements: {
          divs: document.querySelectorAll('div').length,
          spans: document.querySelectorAll('span').length,
          paragraphs: document.querySelectorAll('p').length,
          buttons: document.querySelectorAll('button').length,
          inputs: document.querySelectorAll('input').length,
          h1: document.querySelectorAll('h1').length,
          tables: document.querySelectorAll('table').length
        },
        styles: {
          bodyBackground: window.getComputedStyle(document.body).background,
          bodyColor: window.getComputedStyle(document.body).color,
          bodyDisplay: window.getComputedStyle(document.body).display,
          bodyVisibility: window.getComputedStyle(document.body).visibility
        },
        firstFewElements: Array.from(document.body.children).slice(0, 5).map(el => ({
          tagName: el.tagName,
          className: el.className,
          id: el.id,
          textContent: el.textContent?.substring(0, 100) + '...' || ''
        }))
      };
    });

    console.log('📊 Page Analysis:');
    console.log('================');
    console.log(`Title: ${analysis.title}`);
    console.log(`Body text length: ${analysis.bodyTextLength}`);
    console.log(`Has "Order Management": ${analysis.hasOrderText}`);
    console.log('\n🎨 Styles:');
    console.log(`Background: ${analysis.styles.bodyBackground}`);
    console.log(`Color: ${analysis.styles.bodyColor}`);
    console.log(`Display: ${analysis.styles.bodyDisplay}`);
    console.log(`Visibility: ${analysis.styles.bodyVisibility}`);
    console.log('\n🧩 Elements:');
    Object.entries(analysis.elements).forEach(([key, count]) => {
      console.log(`${key}: ${count}`);
    });
    console.log('\n📝 Body text preview:');
    console.log(analysis.bodyText);
    console.log('\n🏗️  First elements:');
    analysis.firstFewElements.forEach((el, i) => {
      console.log(`${i + 1}. <${el.tagName}> class="${el.className}" - ${el.textContent}`);
    });

    // Take screenshot
    await page.screenshot({ 
      path: './debug-order-page.png', 
      fullPage: true 
    });
    console.log('\n📸 Screenshot saved to: ./debug-order-page.png');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    if (browser) await browser.close();
  }
}

testPageContent();