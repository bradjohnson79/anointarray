const puppeteer = require('puppeteer');

(async () => {
  console.log('Testing direct component access...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    devtools: true
  });

  const page = await browser.newPage();
  
  // Monitor console for errors
  page.on('console', msg => {
    const type = msg.type();
    console.log(`[CONSOLE ${type.toUpperCase()}]: ${msg.text()}`);
  });

  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  try {
    // First, let's try accessing a basic page to see if the app works at all
    console.log('Testing root page...');
    await page.goto('http://localhost:3002/', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const rootPageText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 200);
    });
    console.log('Root page text:', rootPageText);

    // Check if authentication is working by looking for typical auth elements
    const hasAuthElements = await page.evaluate(() => {
      const text = document.body.innerHTML;
      return {
        hasLogin: text.includes('login') || text.includes('sign in') || text.includes('Sign In'),
        hasAuth: text.includes('auth') || text.includes('Auth'),
        hasProtected: text.includes('protected') || text.includes('Protected'),
        hasError: text.includes('error') || text.includes('Error')
      };
    });
    console.log('Root page auth elements:', hasAuthElements);

    // Now try to access a public admin route if one exists
    console.log('\nTesting admin route...');
    await page.goto('http://localhost:3002/admin', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 3000));

    const adminPageText = await page.evaluate(() => {
      return document.body.innerText.substring(0, 200);
    });
    console.log('Admin page text:', adminPageText);

    // Finally, try the taxes route but with more debugging
    console.log('\nTesting /admin/taxes with detailed debugging...');
    await page.goto('http://localhost:3002/admin/taxes', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait longer

    // Get detailed DOM structure
    const domStructure = await page.evaluate(() => {
      const getElementStructure = (element, depth = 0) => {
        if (depth > 3) return '...'; // Prevent infinite recursion
        
        const children = Array.from(element.children);
        return {
          tag: element.tagName.toLowerCase(),
          id: element.id || null,
          className: element.className || null,
          textContent: element.textContent?.substring(0, 100) || null,
          childrenCount: children.length,
          children: children.length > 0 && depth < 2 ? 
            children.map(child => getElementStructure(child, depth + 1)) : []
        };
      };

      return getElementStructure(document.body);
    });
    
    console.log('DOM Structure:', JSON.stringify(domStructure, null, 2));

    // Check for React/Next.js specific elements
    const reactInfo = await page.evaluate(() => {
      return {
        hasReactRoot: !!document.querySelector('#__next'),
        hasNextData: !!window.__NEXT_DATA__,
        hasReact: typeof window.React !== 'undefined',
        pathname: window.location.pathname,
        scripts: Array.from(document.querySelectorAll('script[src]')).map(s => s.src).slice(0, 5)
      };
    });
    console.log('React/Next.js info:', reactInfo);

    // Check auth state in localStorage/sessionStorage
    const authState = await page.evaluate(() => {
      const ls = {};
      const ss = {};
      
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) ls[key] = localStorage.getItem(key)?.substring(0, 100);
        }
      } catch (e) { /* ignore */ }

      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) ss[key] = sessionStorage.getItem(key)?.substring(0, 100);
        }
      } catch (e) { /* ignore */ }

      return { localStorage: ls, sessionStorage: ss };
    });
    console.log('Storage state:', authState);

    console.log('\nKeeping browser open for manual inspection...');
    await new Promise(() => {}); // Keep running

  } catch (error) {
    console.error('Test error:', error.message);
  }
})();