const puppeteer = require('puppeteer');

async function directLoginTest() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1280, height: 720 },
        devtools: true // Open devtools to inspect
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🧪 Direct Login Component Test');
        console.log('==============================');
        
        // Navigate to login
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        
        // Inject debugging code to monitor React state
        await page.evaluate(() => {
            // Store original console.log
            const originalLog = console.log;
            
            // Enhanced logging for debugging
            window.debugLog = (...args) => {
                originalLog('[DEBUG]', new Date().toISOString(), ...args);
            };
            
            // Monitor for React state changes
            window.monitorReactState = () => {
                const interval = setInterval(() => {
                    try {
                        // Check for user state in localStorage or any global state
                        const localStorageKeys = Object.keys(localStorage);
                        const sessionStorageKeys = Object.keys(sessionStorage);
                        
                        window.debugLog('Storage:', {
                            localStorage: localStorageKeys,
                            sessionStorage: sessionStorageKeys
                        });
                        
                        // Check for any Supabase session
                        const supabaseSession = localStorage.getItem('sb-xmnghciitiefbwxzhgrw-auth-token');
                        if (supabaseSession) {
                            try {
                                const session = JSON.parse(supabaseSession);
                                window.debugLog('Supabase session found:', !!session);
                            } catch (e) {
                                window.debugLog('Supabase session parse error:', e.message);
                            }
                        }
                        
                    } catch (error) {
                        window.debugLog('Monitor error:', error.message);
                    }
                }, 1000);
                
                // Stop monitoring after 30 seconds
                setTimeout(() => {
                    clearInterval(interval);
                    window.debugLog('Monitoring stopped');
                }, 30000);
            };
            
            window.monitorReactState();
        });
        
        // Fill form
        console.log('📝 Filling form...');
        await page.type('input[type="email"]', 'info@anoint.me');
        await page.type('input[type="password"]', 'Admin123');
        
        // Add a small delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        console.log('🖱️  Submitting form...');
        
        // Click submit
        await page.click('button[type="submit"]');
        
        // Monitor for changes more carefully
        console.log('⏳ Monitoring for redirect (20 seconds)...');
        
        let redirected = false;
        for (let i = 0; i < 20; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const currentUrl = page.url();
            
            if (currentUrl.includes('/dashboard')) {
                console.log(`✅ REDIRECTED at ${i + 1}s: ${currentUrl}`);
                redirected = true;
                break;
            }
            
            if (i % 3 === 0) {
                console.log(`   ${i + 1}s: ${currentUrl}`);
            }
        }
        
        if (!redirected) {
            console.log('❌ No redirect occurred');
            
            // Get detailed state information
            const debugInfo = await page.evaluate(() => {
                return {
                    url: window.location.href,
                    pathname: window.location.pathname,
                    localStorage: Object.keys(localStorage),
                    sessionStorage: Object.keys(sessionStorage),
                    supabaseToken: !!localStorage.getItem('sb-xmnghciitiefbwxzhgrw-auth-token'),
                    formElements: {
                        emailValue: document.querySelector('input[type="email"]')?.value,
                        passwordValue: '***',
                        buttonDisabled: document.querySelector('button[type="submit"]')?.disabled,
                        buttonText: document.querySelector('button[type="submit"]')?.textContent?.trim()
                    }
                };
            });
            
            console.log('🔍 Debug info:', debugInfo);
        }
        
        // Keep browser open for manual inspection
        console.log('🔍 Browser will stay open for 30 seconds for inspection...');
        console.log('Press Ctrl+C to close early');
        await new Promise(resolve => setTimeout(resolve, 30000));
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

directLoginTest().catch(console.error);