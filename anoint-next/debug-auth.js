const puppeteer = require('puppeteer');

async function debugAuthTest() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🐛 Debug Authentication Test');
        console.log('============================');
        
        // Navigate to login page
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
        console.log('📝 Current URL:', page.url());
        
        // Wait for page to fully load
        await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('🧪 Testing direct Supabase authentication in browser...');
        
        // Test direct authentication using browser console
        const authResult = await page.evaluate(async () => {
            try {
                // Check if Supabase client is available
                if (!window.supabase) {
                    // Try to access it through the module system
                    console.log('Checking for Supabase client...');
                }
                
                // Try to access the auth store
                console.log('Testing auth store...');
                
                // Simulate what happens when form is submitted
                const emailInput = document.querySelector('input[type="email"]');
                const passwordInput = document.querySelector('input[type="password"]');
                const submitButton = document.querySelector('button[type="submit"]');
                
                if (!emailInput || !passwordInput || !submitButton) {
                    return { error: 'Form elements not found' };
                }
                
                // Set values
                emailInput.value = 'info@anoint.me';
                emailInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                passwordInput.value = 'Admin123';
                passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
                
                console.log('Form values set:', emailInput.value, passwordInput.value);
                
                // Check if there's a loading state
                const isLoading = submitButton.disabled || submitButton.textContent.includes('Signing');
                console.log('Submit button state:', { disabled: submitButton.disabled, text: submitButton.textContent });
                
                return { 
                    success: true, 
                    formFound: true,
                    email: emailInput.value,
                    buttonState: { disabled: submitButton.disabled, text: submitButton.textContent }
                };
                
            } catch (error) {
                return { error: error.message };
            }
        });
        
        console.log('🔍 Debug Result:', authResult);
        
        if (authResult.formFound) {
            console.log('✅ Form elements found and values set');
            console.log('📝 Now clicking submit button...');
            
            // Listen for network requests
            const requests = [];
            page.on('request', request => {
                requests.push({
                    url: request.url(),
                    method: request.method(),
                    headers: request.headers()
                });
            });
            
            page.on('response', response => {
                console.log(`🌐 Response: ${response.status()} ${response.url()}`);
            });
            
            // Click the submit button
            await page.click('button[type="submit"]');
            
            // Wait a bit to see what happens
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            console.log('📋 Network requests made:', requests.length);
            requests.forEach(req => {
                if (req.url.includes('supabase') || req.url.includes('auth')) {
                    console.log(`  - ${req.method} ${req.url}`);
                }
            });
            
            console.log('📝 Final URL:', page.url());
        }
        
        console.log('\n✅ Debug test completed');
        
    } catch (error) {
        console.error('❌ Debug test failed:', error);
    } finally {
        await browser.close();
    }
}

debugAuthTest().catch(console.error);