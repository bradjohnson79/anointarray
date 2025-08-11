const puppeteer = require('puppeteer');

async function authStateTest() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Auth State Monitoring Test');
        console.log('=============================');
        
        // Inject monitoring script
        await page.evaluateOnNewDocument(() => {
            window.authStateHistory = [];
            window.monitorAuthState = () => {
                // Try to access the auth store periodically
                const checkAuthState = () => {
                    try {
                        // This will work if we can access the zustand store
                        console.log('Checking auth state...');
                        window.authStateHistory.push({
                            timestamp: Date.now(),
                            url: window.location.href,
                            pathname: window.location.pathname
                        });
                    } catch (error) {
                        console.log('Auth state check error:', error.message);
                    }
                };
                
                // Check every 500ms for 10 seconds
                for (let i = 0; i < 20; i++) {
                    setTimeout(checkAuthState, i * 500);
                }
            };
        });
        
        // Navigate to login
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        
        // Start monitoring
        await page.evaluate(() => {
            window.monitorAuthState();
        });
        
        console.log('📝 Starting login process...');
        
        // Fill and submit form
        await page.type('input[type="email"]', 'info@anoint.me');
        await page.type('input[type="password"]', 'Admin123');
        
        console.log('🖱️  Clicking submit button...');
        await page.click('button[type="submit"]');
        
        // Monitor for URL changes over time
        console.log('⏳ Monitoring authentication state changes...');
        
        for (let i = 0; i < 15; i++) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            const currentUrl = page.url();
            console.log(`   ${i + 1}s: ${currentUrl}`);
            
            if (currentUrl.includes('/dashboard')) {
                console.log('✅ Successfully redirected to dashboard!');
                break;
            }
        }
        
        // Get the monitoring results
        const authHistory = await page.evaluate(() => window.authStateHistory);
        console.log('📊 Auth state history:', authHistory);
        
        // Check final state
        const finalUrl = page.url();
        console.log('📝 Final URL:', finalUrl);
        
        // Check for any error messages
        const errorMessage = await page.evaluate(() => {
            const errorDiv = document.querySelector('div[class*="bg-red"], div[class*="text-red"], .text-red-600');
            return errorDiv ? errorDiv.textContent.trim() : null;
        });
        
        if (errorMessage) {
            console.log('❌ Error message:', errorMessage);
        } else if (finalUrl.includes('/dashboard')) {
            console.log('✅ LOGIN SUCCESS: Redirected to dashboard');
        } else if (finalUrl.includes('/login')) {
            console.log('⚠️  Still on login page - checking why...');
            
            // Check if the button is in loading state
            const buttonState = await page.evaluate(() => {
                const button = document.querySelector('button[type="submit"]');
                return button ? {
                    disabled: button.disabled,
                    text: button.textContent?.trim(),
                    className: button.className
                } : null;
            });
            
            console.log('🖱️  Button state:', buttonState);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

authStateTest().catch(console.error);