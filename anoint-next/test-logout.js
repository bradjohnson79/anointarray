const puppeteer = require('puppeteer');

async function testLogout() {
    const browser = await puppeteer.launch({ 
        headless: false, 
        defaultViewport: { width: 1280, height: 720 }
    });
    
    const page = await browser.newPage();
    
    try {
        console.log('🔓 Testing Logout Functionality');
        console.log('==============================');
        
        // First login
        console.log('📝 Step 1: Login first');
        await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle2' });
        await page.waitForSelector('input[type="email"]', { timeout: 5000 });
        
        await page.type('input[type="email"]', 'info@anoint.me');
        await page.type('input[type="password"]', 'Admin123');
        await page.click('button[type="submit"]');
        
        // Wait for redirect to dashboard
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const dashboardUrl = page.url();
        console.log('✅ Logged in, current URL:', dashboardUrl);
        
        if (dashboardUrl.includes('/dashboard')) {
            console.log('✅ Successfully logged in to dashboard');
            
            // Now test logout
            console.log('📝 Step 2: Testing logout');
            
            // Look for Sign Out button using a simpler approach
            console.log('🔍 Looking for Sign Out button...');
            
            // Try a comprehensive search directly
            const allButtons = await page.evaluate(() => {
                const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                return buttons.map(btn => ({
                    text: btn.textContent?.trim(),
                    tag: btn.tagName,
                    className: btn.className
                })).filter(btn => 
                    btn.text?.toLowerCase().includes('sign out') || 
                    btn.text?.toLowerCase().includes('logout') ||
                    btn.text?.toLowerCase().includes('log out')
                );
            });
            
            console.log('🔍 Found logout buttons:', allButtons);
            
            if (allButtons.length > 0) {
                // Click the first logout button found
                await page.evaluate(() => {
                    const buttons = Array.from(document.querySelectorAll('button, a, [role="button"]'));
                    for (let btn of buttons) {
                        const text = btn.textContent?.trim().toLowerCase();
                        if (text?.includes('sign out') || text?.includes('logout') || text?.includes('log out')) {
                            btn.click();
                            return;
                        }
                    }
                });
                
                console.log('🖱️  Clicked logout button');
            } else {
                console.log('❌ No logout button found');
                return;
            }
            
            // Wait for logout to complete
            await new Promise(resolve => setTimeout(resolve, 3000));
            
            const postLogoutUrl = page.url();
            console.log('📝 Post-logout URL:', postLogoutUrl);
            
            if (postLogoutUrl.includes('/login')) {
                console.log('✅ LOGOUT SUCCESS: Redirected to login page');
                
                // Test accessing protected page after logout
                console.log('📝 Step 3: Testing access after logout');
                await page.goto('http://localhost:3001/dashboard', { waitUntil: 'networkidle2' });
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const protectedUrl = page.url();
                console.log('📝 Accessing dashboard after logout:', protectedUrl);
                
                if (protectedUrl.includes('/login')) {
                    console.log('✅ SECURITY CONFIRMED: Dashboard redirects to login after logout');
                } else {
                    console.log('⚠️  WARNING: Dashboard still accessible after logout');
                }
                
            } else {
                console.log('❌ LOGOUT FAILED: Did not redirect to login');
            }
            
        } else {
            console.log('❌ Failed to login initially');
        }
        
        console.log('\n🎉 Logout test completed');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await browser.close();
    }
}

testLogout().catch(console.error);