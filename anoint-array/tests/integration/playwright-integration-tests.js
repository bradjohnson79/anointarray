// Integration Test Suite for ANOINT Array Platform
// Comprehensive end-to-end testing using Playwright

const { test, expect, chromium, firefox, webkit } = require('@playwright/test');

// Test configuration
const config = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://anoint-array.vercel.app' 
    : 'http://localhost:3001',
  timeout: 60000, // 60 seconds for AI generation tests
  browsers: ['chromium', 'firefox', 'webkit']
};

// Test data
const testUsers = {
  admin: { email: 'info@anoint.me', password: 'Admin123' },
  member: { email: 'sarah.wilson@email.com', password: 'Customer123' },
  newUser: { email: 'james.martinez@email.com', password: 'Customer123' }
};

const sampleGenerationInput = {
  fullName: 'Integration Test User',
  birthdate: { month: 8, day: 7, year: 1990 },
  birthTime: { hour: 2, minute: 30, period: 'PM' },
  birthPlace: {
    displayName: 'Toronto, ON, Canada',
    latitude: 43.6532,
    longitude: -79.3832
  },
  template: 'torus-field',
  category: 'Healing',
  sealType: 'General Wellness Array',
  additionalComments: 'Integration test for automated testing system'
};

// Test Suite 1: Authentication and Authorization
test.describe('Authentication Integration Tests', () => {
  
  test('Complete login flow with member account', async ({ page }) => {
    await page.goto(config.baseURL + '/login');
    
    // Fill login form
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    
    // Submit and verify redirect
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/member\/dashboard/);
    
    // Verify user is authenticated
    const userDisplay = page.locator('[data-testid="user-display-name"]');
    await expect(userDisplay).toBeVisible();
  });

  test('Admin access verification', async ({ page }) => {
    // Login as admin
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.admin.email);
    await page.fill('input[type="password"]', testUsers.admin.password);
    await page.click('button[type="submit"]');
    
    // Access admin panel
    await page.goto(config.baseURL + '/admin/dashboard');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    
    // Verify admin-only features
    const userManagement = page.locator('[href="/admin/users"]');
    await expect(userManagement).toBeVisible();
  });

  test('Protected route access control', async ({ page }) => {
    // Try accessing protected route without authentication
    await page.goto(config.baseURL + '/member/generator');
    await expect(page).toHaveURL(/\/login/);
    
    // Try accessing admin route as regular member
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    
    await page.goto(config.baseURL + '/admin/dashboard');
    await expect(page).toHaveURL(/\/unauthorized/);
  });
});

// Test Suite 2: AI Generation Integration
test.describe('AI Generation Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    await page.goto(config.baseURL + '/member/generator');
  });

  test('Complete array generation workflow', async ({ page }) => {
    // Set longer timeout for AI generation
    test.setTimeout(120000); // 2 minutes
    
    // Fill user input form
    await page.fill('input[name="fullName"]', sampleGenerationInput.fullName);
    
    // Birthdate selection
    await page.selectOption('select[name="birthMonth"]', sampleGenerationInput.birthdate.month.toString());
    await page.selectOption('select[name="birthDay"]', sampleGenerationInput.birthdate.day.toString());
    await page.selectOption('select[name="birthYear"]', sampleGenerationInput.birthdate.year.toString());
    
    // Template and category selection
    await page.selectOption('select[name="template"]', sampleGenerationInput.template);
    await page.selectOption('select[name="category"]', sampleGenerationInput.category);
    await page.fill('input[name="sealType"]', sampleGenerationInput.sealType);
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Wait for generation to start
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    
    // Wait for generation completion (up to 90 seconds)
    await page.waitForSelector('[data-testid="seal-array-canvas"]', { timeout: 90000 });
    
    // Verify canvas rendered
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Verify generation data
    const ring1Data = await page.evaluate(() => {
      return window.generatedData ? window.generatedData.ring1.length : 0;
    });
    expect(ring1Data).toBe(24);
    
    // Verify explanation is present
    const explanation = page.locator('[data-testid="explanation-section"]');
    await expect(explanation).toBeVisible();
  });

  test('AI generation error handling', async ({ page }) => {
    // Mock API failure by intercepting request
    await page.route('/api/generator/generate', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, error: 'AI service temporarily unavailable' })
      });
    });
    
    // Fill minimal form data
    await page.fill('input[name="fullName"]', 'Error Test User');
    await page.selectOption('select[name="template"]', 'torus-field');
    await page.fill('input[name="sealType"]', 'Test Array');
    
    // Submit form
    await page.click('button[type="submit"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-alert"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-alert"]')).toContainText('AI service temporarily unavailable');
  });

  test('Generation progress indicators', async ({ page }) => {
    // Start generation
    await page.fill('input[name="fullName"]', 'Progress Test User');
    await page.selectOption('select[name="template"]', 'flower-of-life');
    await page.fill('input[name="sealType"]', 'Progress Test Array');
    await page.click('button[type="submit"]');
    
    // Verify progress elements appear
    await expect(page.locator('[data-testid="generation-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-bar"]')).toBeVisible();
    
    // Verify progress steps
    const progressSteps = page.locator('[data-testid="progress-step"]');
    await expect(progressSteps).toHaveCount(4); // input, generating, preview, payment
  });
});

// Test Suite 3: Payment Integration Tests
test.describe('Payment Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Setup: Complete generation first
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    await page.goto(config.baseURL + '/member/generator');
    
    // Quick generation setup
    await page.fill('input[name="fullName"]', 'Payment Test User');
    await page.selectOption('select[name="template"]', 'torus-field');
    await page.fill('input[name="sealType"]', 'Payment Test Array');
    await page.click('button[type="submit"]');
    
    // Wait for generation (or mock it for faster testing)
    await page.waitForSelector('[data-testid="payment-section"]', { timeout: 90000 });
  });

  test('Stripe payment integration', async ({ page }) => {
    // Click purchase button
    await page.click('[data-testid="purchase-button"]');
    
    // Verify payment options appear
    await expect(page.locator('[data-testid="stripe-payment-option"]')).toBeVisible();
    
    // Select Stripe payment
    await page.click('[data-testid="stripe-payment-option"]');
    
    // For testing, we'll mock the Stripe response
    await page.route('/api/payments/stripe', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          checkoutUrl: 'https://checkout.stripe.com/test-session',
          sessionId: 'cs_test_12345'
        })
      });
    });
    
    // Submit payment form
    await page.click('[data-testid="submit-payment"]');
    
    // Verify redirect to Stripe (or success page in test mode)
    // In real integration, this would test the full Stripe flow
  });

  test('Payment amount validation', async ({ page }) => {
    // Verify correct price displayed
    const priceElement = page.locator('[data-testid="price-display"]');
    await expect(priceElement).toContainText('$17');
    
    // Verify price in multiple locations
    const purchaseButton = page.locator('[data-testid="purchase-button"]');
    await expect(purchaseButton).toContainText('$17');
  });

  test('Payment success flow', async ({ page }) => {
    // Mock successful payment
    await page.route('/api/payments/stripe', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          sessionId: 'cs_success_test',
          paymentStatus: 'succeeded'
        })
      });
    });
    
    // Simulate payment success by navigating to success URL
    await page.goto(config.baseURL + '/generator/success?session_id=cs_success_test&seal_id=test_array_123');
    
    // Verify success state
    await expect(page.locator('[data-testid="payment-success"]')).toBeVisible();
    await expect(page.locator('[data-testid="download-section"]')).toBeVisible();
  });
});

// Test Suite 4: Canvas and Image Generation Tests
test.describe('Canvas Rendering Integration Tests', () => {
  
  test.beforeEach(async ({ page }) => {
    // Login and navigate to generator with mock data
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
  });

  test('Canvas rendering with mock data', async ({ page }) => {
    // Navigate to generator
    await page.goto(config.baseURL + '/member/generator');
    
    // Use JavaScript to set mock generation data
    await page.evaluate(() => {
      window.mockGenerationData = {
        ring1: Array.from({ length: 24 }, (_, i) => ({
          number: i + 1,
          color: 'BLUE',
          position: `${Math.floor(i / 2)}:${(i % 2) * 30}`,
          angle: i * 15,
          x: 600 + Math.cos((i * 15 - 90) * Math.PI / 180) * 360,
          y: 600 + Math.sin((i * 15 - 90) * Math.PI / 180) * 360
        })),
        ring2: Array.from({ length: 24 }, (_, i) => ({
          glyph: 'om.png',
          color: 'GREEN',
          position: `${Math.floor(i / 2)}:${(i % 2) * 30}`,
          angle: i * 15,
          x: 600 + Math.cos((i * 15 - 90) * Math.PI / 180) * 460,
          y: 600 + Math.sin((i * 15 - 90) * Math.PI / 180) * 460
        })),
        ring3: { text: 'Peace and Harmony', language: 'English', repetitions: 1 },
        metadata: { template: 'torus-field', generated: new Date() }
      };
      
      // Trigger render with mock data
      if (window.renderMockCanvas) {
        window.renderMockCanvas(window.mockGenerationData);
      }
    });
    
    // Wait for canvas to render
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Verify canvas properties
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    
    // Check canvas dimensions
    const canvasDimensions = await canvas.evaluate(el => ({
      width: el.width,
      height: el.height
    }));
    expect(canvasDimensions.width).toBe(1200);
    expect(canvasDimensions.height).toBe(1200);
  });

  test('Zoom and canvas controls', async ({ page }) => {
    // Navigate to generator (assuming canvas is rendered)
    await page.goto(config.baseURL + '/member/generator');
    
    // Wait for canvas controls
    await page.waitForSelector('[data-testid="zoom-controls"]', { timeout: 5000 });
    
    // Test zoom in
    await page.click('[data-testid="zoom-in"]');
    const zoomDisplay = page.locator('[data-testid="zoom-display"]');
    await expect(zoomDisplay).toContainText('60%');
    
    // Test zoom out
    await page.click('[data-testid="zoom-out"]');
    await expect(zoomDisplay).toContainText('50%');
    
    // Test reset zoom
    await page.click('[data-testid="zoom-reset"]');
    await expect(zoomDisplay).toContainText('50%');
  });

  test('Image download functionality', async ({ page }) => {
    // Mock successful payment state
    await page.goto(config.baseURL + '/member/generator');
    await page.evaluate(() => {
      window.isPurchased = true;
    });
    
    // Wait for download buttons to be enabled
    await page.waitForSelector('[data-testid="download-png"]:not([disabled])', { timeout: 5000 });
    
    // Start download listening
    const downloadPromise = page.waitForEvent('download');
    
    // Click download PNG
    await page.click('[data-testid="download-png"]');
    
    // Verify download started
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain('anoint-array');
    expect(download.suggestedFilename()).toContain('.png');
  });
});

// Test Suite 5: Cross-Browser Compatibility Tests
test.describe('Cross-Browser Compatibility', () => {
  
  ['chromium', 'firefox', 'webkit'].forEach(browserName => {
    test(`${browserName} compatibility test`, async () => {
      const browser = await { chromium, firefox, webkit }[browserName].launch();
      const page = await browser.newPage();
      
      try {
        // Test basic navigation
        await page.goto(config.baseURL);
        await expect(page.locator('h1')).toBeVisible();
        
        // Test login functionality
        await page.goto(config.baseURL + '/login');
        await page.fill('input[type="email"]', testUsers.member.email);
        await page.fill('input[type="password"]', testUsers.member.password);
        await page.click('button[type="submit"]');
        
        // Verify successful login
        await expect(page).toHaveURL(/\/member\/dashboard/);
        
        // Test generator page load
        await page.goto(config.baseURL + '/member/generator');
        await expect(page.locator('[data-testid="user-input-form"]')).toBeVisible();
        
      } finally {
        await browser.close();
      }
    });
  });
});

// Test Suite 6: Performance Integration Tests
test.describe('Performance Integration Tests', () => {
  
  test('Page load performance', async ({ page }) => {
    // Measure home page load time
    const startTime = Date.now();
    await page.goto(config.baseURL);
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Assert reasonable load time (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance issues
    const performanceEntry = await page.evaluate(() => {
      return JSON.stringify(performance.getEntriesByType('navigation')[0]);
    });
    const timing = JSON.parse(performanceEntry);
    
    // Assert key performance metrics
    expect(timing.domContentLoadedEventEnd - timing.navigationStart).toBeLessThan(2000);
  });

  test('Memory usage during generation', async ({ page }) => {
    // Login and navigate
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    await page.goto(config.baseURL + '/member/generator');
    
    // Measure initial memory
    const initialMemory = await page.evaluate(() => {
      if (window.performance && window.performance.memory) {
        return window.performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Perform generation (mocked for speed)
    await page.route('/api/generator/generate', route => {
      setTimeout(() => {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            data: {
              ring1: Array.from({ length: 24 }, (_, i) => ({ number: i, color: 'BLUE', position: '12:00', angle: 0, x: 600, y: 600 })),
              ring2: Array.from({ length: 24 }, (_, i) => ({ glyph: 'om.png', color: 'GREEN', position: '12:00', angle: 0, x: 600, y: 600 })),
              ring3: { text: 'Test', language: 'English', repetitions: 1 },
              explanation: 'Test explanation',
              metadata: { generated: new Date(), template: 'torus-field', category: 'Test', sealType: 'Test' }
            }
          })
        });
      }, 1000);
    });
    
    // Start generation
    await page.fill('input[name="fullName"]', 'Memory Test User');
    await page.selectOption('select[name="template"]', 'torus-field');
    await page.fill('input[name="sealType"]', 'Memory Test Array');
    await page.click('button[type="submit"]');
    
    // Wait for completion
    await page.waitForSelector('canvas', { timeout: 10000 });
    
    // Measure final memory
    const finalMemory = await page.evaluate(() => {
      if (window.performance && window.performance.memory) {
        return window.performance.memory.usedJSHeapSize;
      }
      return 0;
    });
    
    // Calculate memory increase
    const memoryIncrease = finalMemory - initialMemory;
    
    // Assert reasonable memory usage (under 50MB increase)
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
  });
});

// Test Suite 7: Error Handling and Recovery
test.describe('Error Handling Integration Tests', () => {
  
  test('Network failure recovery', async ({ page }) => {
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    await page.goto(config.baseURL + '/member/generator');
    
    // Simulate network failure
    await page.route('**/*', route => route.abort());
    
    // Try to submit form
    await page.fill('input[name="fullName"]', 'Network Test User');
    await page.click('button[type="submit"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="network-error"]')).toBeVisible({ timeout: 10000 });
    
    // Restore network
    await page.unroute('**/*');
    
    // Verify recovery mechanism
    await page.click('[data-testid="retry-button"]');
    await expect(page.locator('[data-testid="network-error"]')).toBeHidden();
  });

  test('API timeout handling', async ({ page }) => {
    await page.goto(config.baseURL + '/login');
    await page.fill('input[type="email"]', testUsers.member.email);
    await page.fill('input[type="password"]', testUsers.member.password);
    await page.click('button[type="submit"]');
    await page.goto(config.baseURL + '/member/generator');
    
    // Mock API timeout
    await page.route('/api/generator/generate', route => {
      // Never respond to simulate timeout
    });
    
    // Start generation
    await page.fill('input[name="fullName"]', 'Timeout Test User');
    await page.selectOption('select[name="template"]', 'torus-field');
    await page.fill('input[name="sealType"]', 'Timeout Test Array');
    await page.click('button[type="submit"]');
    
    // Wait for timeout error (should appear after configured timeout)
    await expect(page.locator('[data-testid="timeout-error"]')).toBeVisible({ timeout: 65000 });
  });
});

// Utility functions for test setup
async function setupTestData(page) {
  // Helper to set up common test data
  await page.evaluate(() => {
    window.testData = {
      sampleUser: {
        fullName: 'Integration Test User',
        email: 'test@example.com'
      },
      sampleGeneration: {
        template: 'torus-field',
        category: 'Healing',
        sealType: 'Test Array'
      }
    };
  });
}

async function loginUser(page, userType = 'member') {
  const user = testUsers[userType];
  await page.goto(config.baseURL + '/login');
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(member|admin)/);
}

// Export test configuration for use in other test files
module.exports = {
  config,
  testUsers,
  sampleGenerationInput,
  setupTestData,
  loginUser
};