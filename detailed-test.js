const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting detailed diagnostic test...');
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    devtools: true // Open devtools to see what's happening
  });

  const page = await browser.newPage();
  
  // Collect console messages
  const consoleMessages = [];
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    consoleMessages.push({ type, text });
    console.log(`[CONSOLE ${type.toUpperCase()}]: ${text}`);
  });

  // Collect page errors
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push(error.message);
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  // Monitor network requests
  page.on('request', request => {
    console.log(`[REQUEST]: ${request.method()} ${request.url()}`);
  });

  page.on('response', response => {
    console.log(`[RESPONSE]: ${response.status()} ${response.url()}`);
  });

  try {
    console.log('Navigating to /admin/taxes...');
    
    // Try to navigate and wait for network idle
    await page.goto('http://localhost:3002/admin/taxes', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });

    console.log('Page loaded, checking content...');

    // Wait for potential React hydration
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if React has loaded
    const hasReact = await page.evaluate(() => {
      return typeof window.React !== 'undefined' || 
             typeof window.__REACT_DEVTOOLS_GLOBAL_HOOK__ !== 'undefined' ||
             document.querySelector('[data-reactroot]') !== null ||
             document.querySelector('#__next') !== null;
    });
    console.log('React detected:', hasReact);

    // Check for Next.js
    const hasNextJS = await page.evaluate(() => {
      return typeof window.__NEXT_DATA__ !== 'undefined' ||
             document.querySelector('#__next') !== null;
    });
    console.log('Next.js detected:', hasNextJS);

    // Get the HTML structure
    const htmlStructure = await page.evaluate(() => {
      const body = document.body;
      const children = Array.from(body.children).map(child => ({
        tagName: child.tagName,
        className: child.className,
        id: child.id,
        childCount: child.children.length,
        textContent: child.textContent?.substring(0, 100) || ''
      }));
      return children;
    });
    console.log('HTML Structure:', JSON.stringify(htmlStructure, null, 2));

    // Check for authentication state
    const authStatus = await page.evaluate(() => {
      // Check localStorage/sessionStorage for auth tokens
      const localStorage = window.localStorage || {};
      const sessionStorage = window.sessionStorage || {};
      
      return {
        localStorage: Object.keys(localStorage),
        sessionStorage: Object.keys(sessionStorage),
        cookies: document.cookie,
        pathname: window.location.pathname,
        search: window.location.search
      };
    });
    console.log('Auth status:', JSON.stringify(authStatus, null, 2));

    // Check if we're in a loading state
    const loadingState = await page.evaluate(() => {
      const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spinner"], .animate-spin');
      return {
        hasLoadingElements: loadingElements.length > 0,
        loadingElements: Array.from(loadingElements).map(el => el.className)
      };
    });
    console.log('Loading state:', loadingState);

    // Try to manually trigger React rendering by checking if components are there
    const componentCheck = await page.evaluate(() => {
      // Look for common React patterns
      const reactElements = document.querySelectorAll('[data-react-component], [data-reactid]');
      const nextElements = document.querySelectorAll('[data-next]');
      
      return {
        reactElements: reactElements.length,
        nextElements: nextElements.length,
        hasScriptTags: document.querySelectorAll('script[src*="static"]').length,
        hasStyleTags: document.querySelectorAll('link[rel="stylesheet"]').length
      };
    });
    console.log('Component check:', componentCheck);

    console.log('\n=== SUMMARY ===');
    console.log(`Console messages: ${consoleMessages.length}`);
    console.log(`Page errors: ${pageErrors.length}`);
    console.log(`Has React: ${hasReact}`);
    console.log(`Has Next.js: ${hasNextJS}`);
    
    if (pageErrors.length > 0) {
      console.log('\nPage Errors:');
      pageErrors.forEach(error => console.log(`  - ${error}`));
    }

    // Keep browser open for manual inspection
    console.log('\nBrowser will stay open for manual inspection...');
    console.log('Press Ctrl+C to close');
    
    // Keep the process running
    await new Promise(() => {});

  } catch (error) {
    console.error('Error during test:', error.message);
  }
})();