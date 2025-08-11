const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Create screenshots directory
const screenshotDir = path.join(__dirname, 'test-screenshots');
if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir);
}

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function takeScreenshot(page, name) {
    const filename = path.join(screenshotDir, `${Date.now()}-${name}.png`);
    await page.screenshot({ path: filename, fullPage: true });
    console.log(`📸 Screenshot saved: ${filename}`);
    return filename;
}

async function testAuthentication() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1280, height: 720 },
        devtools: false 
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🚀 Starting Authentication Flow Tests');
        console.log('=====================================');
        
        // Test 1: Initial Navigation and Redirect
        console.log('\n📝 TEST 1: Initial Navigation (should redirect to /login)');
        await page.goto('http://localhost:3001', { waitUntil: 'networkidle2' });
        await delay(2000);
        
        const currentUrl = page.url();
        console.log(`Current URL: ${currentUrl}`);
        await takeScreenshot(page, 'initial-redirect');
        
        if (currentUrl.includes('/login')) {
            console.log('✅ PASS: Correctly redirected to login page');
        } else {
            console.log('❌ FAIL: Did not redirect to login page');
        }
        
        // Test 2: Login Form
        console.log('\n📝 TEST 2: Login Form Fill and Submit');
        
        // Wait for login form elements
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        await page.waitForSelector('input[type="password"]', { timeout: 5000 });
        await page.waitForSelector('button[type="submit"]', { timeout: 5000 });
        
        // Fill in credentials
        await page.type('input[type="email"]', 'info@anoint.me');
        await page.type('input[type="password"]', 'Admin123');
        await takeScreenshot(page, 'login-form-filled');
        
        // Submit form and wait for response
        console.log('Submitting login form...');
        
        // Listen for console logs to see what's happening
        page.on('console', msg => {
            console.log('Browser Console:', msg.text());
        });
        
        // Click submit and wait for either navigation or error
        const submitPromise = page.click('button[type="submit"]');
        
        try {
            // Wait for either navigation or a specific selector to change
            await Promise.race([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 8000 }),
                page.waitForFunction(
                    () => document.querySelector('div[class*="bg-red"]') !== null || 
                          window.location.pathname !== '/login',
                    { timeout: 8000 }
                )
            ]);
        } catch (error) {
            console.log('Navigation/form submission timeout, checking current state...');
        }
        
        await delay(3000);
        
        const postLoginUrl = page.url();
        console.log(`Post-login URL: ${postLoginUrl}`);
        await takeScreenshot(page, 'post-login');
        
        if (postLoginUrl.includes('/dashboard')) {
            console.log('✅ PASS: Successfully redirected to dashboard after login');
        } else {
            console.log('❌ FAIL: Did not redirect to dashboard after login');
        }
        
        // Test 3: Dashboard Content
        console.log('\n📝 TEST 3: Dashboard Content and Admin Badge');
        
        // Check for welcome message
        const welcomeText = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
                if (el.textContent && el.textContent.toLowerCase().includes('welcome')) {
                    return el.textContent;
                }
            }
            return null;
        });
        
        if (welcomeText) {
            console.log(`✅ PASS: Welcome message found: "${welcomeText}"`);
        } else {
            console.log('❌ FAIL: No welcome message found');
        }
        
        // Check for admin badge
        const adminBadge = await page.evaluate(() => {
            const elements = document.querySelectorAll('*');
            for (let el of elements) {
                if (el.textContent && (el.textContent.toLowerCase().includes('admin') || el.className.includes('badge'))) {
                    return el.textContent;
                }
            }
            return null;
        });
        
        if (adminBadge) {
            console.log(`✅ PASS: Admin badge found: "${adminBadge}"`);
        } else {
            console.log('❌ FAIL: No admin badge found');
        }
        
        // Check for "Go to Admin" button
        const adminButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a');
            for (let btn of buttons) {
                if (btn.textContent && btn.textContent.toLowerCase().includes('admin')) {
                    return btn.textContent;
                }
            }
            return null;
        });
        
        if (adminButton) {
            console.log(`✅ PASS: Admin button found: "${adminButton}"`);
        } else {
            console.log('❌ FAIL: No admin button found');
        }
        
        await takeScreenshot(page, 'dashboard-content');
        
        // Test 4: Admin Panel Access
        console.log('\n📝 TEST 4: Admin Panel Access');
        
        try {
            // Try to navigate to admin panel
            await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle2' });
            await delay(2000);
            
            const adminUrl = page.url();
            console.log(`Admin panel URL: ${adminUrl}`);
            await takeScreenshot(page, 'admin-panel');
            
            if (adminUrl.includes('/admin')) {
                console.log('✅ PASS: Successfully accessed admin panel');
                
                // Check for admin-specific content
                const adminHeader = await page.evaluate(() => {
                    const headers = document.querySelectorAll('h1, h2, h3, .header, [class*="admin"]');
                    for (let header of headers) {
                        if (header.textContent && header.textContent.toLowerCase().includes('admin')) {
                            return header.textContent;
                        }
                    }
                    return null;
                });
                
                if (adminHeader) {
                    console.log(`✅ PASS: Admin header found: "${adminHeader}"`);
                } else {
                    console.log('⚠️  WARNING: No admin header found');
                }
            } else {
                console.log('❌ FAIL: Could not access admin panel');
            }
        } catch (error) {
            console.log(`❌ FAIL: Error accessing admin panel: ${error.message}`);
        }
        
        // Test 5: Logout Flow
        console.log('\n📝 TEST 5: Logout Flow (Critical Test!)');
        
        // Go back to dashboard first
        await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
        await delay(2000);
        
        // Look for sign out button
        const signOutButton = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button, a');
            for (let btn of buttons) {
                if (btn.textContent && (
                    btn.textContent.toLowerCase().includes('sign out') || 
                    btn.textContent.toLowerCase().includes('logout') ||
                    btn.textContent.toLowerCase().includes('log out')
                )) {
                    return btn;
                }
            }
            return null;
        });
        
        if (signOutButton) {
            console.log('✅ PASS: Sign out button found');
            await page.evaluate(() => {
                const buttons = document.querySelectorAll('button, a');
                for (let btn of buttons) {
                    if (btn.textContent && (
                        btn.textContent.toLowerCase().includes('sign out') || 
                        btn.textContent.toLowerCase().includes('logout') ||
                        btn.textContent.toLowerCase().includes('log out')
                    )) {
                        btn.click();
                        return;
                    }
                }
            });
            
            // Wait for logout redirect
            await delay(3000);
            
            const logoutUrl = page.url();
            console.log(`Post-logout URL: ${logoutUrl}`);
            await takeScreenshot(page, 'post-logout');
            
            if (logoutUrl.includes('/login')) {
                console.log('✅ PASS: Successfully redirected to login after logout');
            } else {
                console.log('❌ FAIL: Did not redirect to login after logout');
            }
        } else {
            console.log('❌ FAIL: No sign out button found');
        }
        
        // Test 6: Route Protection
        console.log('\n📝 TEST 6: Route Protection');
        
        // Test dashboard access without login
        await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
        await delay(2000);
        
        const protectedUrl = page.url();
        console.log(`Accessing /dashboard without login: ${protectedUrl}`);
        
        if (protectedUrl.includes('/login')) {
            console.log('✅ PASS: Dashboard properly protected - redirected to login');
        } else {
            console.log('❌ FAIL: Dashboard not protected - should redirect to login');
        }
        
        // Test admin access without login
        await page.goto('http://localhost:3001/admin', { waitUntil: 'networkidle2' });
        await delay(2000);
        
        const protectedAdminUrl = page.url();
        console.log(`Accessing /admin without login: ${protectedAdminUrl}`);
        
        if (protectedAdminUrl.includes('/login')) {
            console.log('✅ PASS: Admin panel properly protected - redirected to login');
        } else {
            console.log('❌ FAIL: Admin panel not protected - should redirect to login');
        }
        
        await takeScreenshot(page, 'route-protection');
        
        console.log('\n🎉 Authentication Tests Complete!');
        console.log(`📸 Screenshots saved to: ${screenshotDir}`);
        
    } catch (error) {
        console.error('❌ Test failed with error:', error);
        await takeScreenshot(page, 'error-state');
    } finally {
        await browser.close();
    }
}

// Run the tests
testAuthentication().catch(console.error);