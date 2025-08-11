const puppeteer = require('puppeteer');
const path = require('path');

async function manualTest() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1280, height: 720 },
        devtools: true // Open dev tools to see console
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔍 Manual Authentication Test');
        console.log('==============================');
        console.log('Opening browser with dev tools...');
        console.log('Please manually test the login flow and check the console for errors');
        
        // Navigate to the application
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
        
        console.log('✅ Browser opened and navigated to app');
        console.log('📝 Current URL:', page.url());
        
        // Listen for console logs
        page.on('console', msg => {
            const type = msg.type();
            const text = msg.text();
            console.log(`🖥️  Console [${type}]: ${text}`);
        });
        
        // Listen for page errors
        page.on('pageerror', error => {
            console.log('❌ Page Error:', error.message);
        });
        
        // Listen for network requests
        page.on('response', response => {
            const url = response.url();
            const status = response.status();
            if (url.includes('/auth/') || url.includes('supabase') || status >= 400) {
                console.log(`🌐 Network: ${status} ${url}`);
            }
        });
        
        console.log('\n🎯 Now testing login manually...');
        console.log('1. The login form should be visible');
        console.log('2. Fill in: info@anoint.me / Admin123');
        console.log('3. Click Sign in');
        console.log('4. Should redirect to /dashboard');
        console.log('\n⏳ Waiting for manual testing (60 seconds)...');
        console.log('Press Ctrl+C when done testing');
        
        // Wait for user to test manually
        await new Promise(resolve => setTimeout(resolve, 60000));
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await browser.close();
    }
}

manualTest().catch(console.error);