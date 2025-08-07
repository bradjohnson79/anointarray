// Performance Integration Tests for ANOINT Array Platform
// Tests system performance under load, memory usage, and optimization effectiveness

const puppeteer = require('puppeteer');
const { expect } = require('@jest/globals');

// Configuration
const config = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://anoint-array.vercel.app' 
    : 'http://localhost:3001',
  timeout: 120000, // 2 minutes for performance tests
  loadTestUsers: [1, 5, 10, 25], // Concurrent user levels to test
  performanceThresholds: {
    pageLoadTime: 3000, // 3 seconds
    aiGenerationTime: 45000, // 45 seconds
    paymentProcessingTime: 10000, // 10 seconds
    canvasRenderTime: 5000, // 5 seconds
    memoryUsageLimit: 100 * 1024 * 1024, // 100MB
    networkRequestLimit: 50, // Max requests per page
    bundleSizeLimit: 5 * 1024 * 1024 // 5MB bundle size
  }
};

// Test user credentials
const testUser = {
  email: 'sarah.wilson@email.com',
  password: 'Customer123'
};

describe('Page Load Performance Tests', () => {
  
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Enable request/response monitoring
    await page.setRequestInterception(true);
    
    const requestSizes = [];
    const requestTimes = [];
    
    page.on('request', request => {
      request.continue();
    });
    
    page.on('response', response => {
      requestSizes.push(response.headers()['content-length'] || 0);
      requestTimes.push(Date.now());
    });
    
    // Store metrics on page object for later access
    page.requestSizes = requestSizes;
    page.requestTimes = requestTimes;
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });
  
  test('Home page load performance', async () => {
    const startTime = Date.now();
    
    // Navigate to home page
    await page.goto(config.baseURL, { waitUntil: 'networkidle2', timeout: config.timeout });
    
    const loadTime = Date.now() - startTime;
    
    // Performance metrics
    const performanceMetrics = await page.metrics();
    const navigationMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        loadComplete: navigation.loadEventEnd - navigation.navigationStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Assertions
    expect(loadTime).toBeLessThan(config.performanceThresholds.pageLoadTime);
    expect(navigationMetrics.domContentLoaded).toBeLessThan(2000); // 2 seconds for DOM ready
    expect(navigationMetrics.firstContentfulPaint).toBeLessThan(1500); // 1.5 seconds for FCP
    expect(performanceMetrics.JSHeapUsedSize).toBeLessThan(config.performanceThresholds.memoryUsageLimit);
    
    console.log('Home Page Performance:', {
      totalLoadTime: loadTime,
      domContentLoaded: navigationMetrics.domContentLoaded,
      firstContentfulPaint: navigationMetrics.firstContentfulPaint,
      memoryUsage: performanceMetrics.JSHeapUsedSize,
      networkRequests: page.requestSizes.length
    });
  });
  
  test('Generator page load performance', async () => {
    // Login first
    await page.goto(config.baseURL + '/login');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    const startTime = Date.now();
    
    // Navigate to generator
    await page.goto(config.baseURL + '/member/generator', { 
      waitUntil: 'networkidle2', 
      timeout: config.timeout 
    });
    
    const loadTime = Date.now() - startTime;
    
    // Wait for form to be ready
    await page.waitForSelector('input[name="fullName"]', { timeout: 5000 });
    
    const performanceMetrics = await page.metrics();
    
    // Check for asset loading
    const assetMetrics = await page.evaluate(() => {
      const resources = performance.getEntriesByType('resource');
      return {
        totalResources: resources.length,
        imageResources: resources.filter(r => r.initiatorType === 'img').length,
        scriptResources: resources.filter(r => r.initiatorType === 'script').length,
        totalTransferSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0)
      };
    });
    
    // Assertions
    expect(loadTime).toBeLessThan(config.performanceThresholds.pageLoadTime);
    expect(assetMetrics.totalTransferSize).toBeLessThan(config.performanceThresholds.bundleSizeLimit);
    expect(performanceMetrics.JSHeapUsedSize).toBeLessThan(config.performanceThresholds.memoryUsageLimit);
    
    console.log('Generator Page Performance:', {
      totalLoadTime: loadTime,
      memoryUsage: performanceMetrics.JSHeapUsedSize,
      totalAssets: assetMetrics.totalResources,
      transferSize: assetMetrics.totalTransferSize
    });
  });
  
  test('Admin dashboard performance', async () => {
    // Login as admin
    await page.goto(config.baseURL + '/login');
    await page.type('input[type="email"]', 'info@anoint.me');
    await page.type('input[type="password"]', 'Admin123');
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    
    const startTime = Date.now();
    
    await page.goto(config.baseURL + '/admin/dashboard', { 
      waitUntil: 'networkidle2', 
      timeout: config.timeout 
    });
    
    const loadTime = Date.now() - startTime;
    const performanceMetrics = await page.metrics();
    
    // Check for data table rendering performance
    await page.waitForSelector('[data-testid="admin-data-table"]', { timeout: 10000 });
    
    expect(loadTime).toBeLessThan(config.performanceThresholds.pageLoadTime);
    expect(performanceMetrics.JSHeapUsedSize).toBeLessThan(config.performanceThresholds.memoryUsageLimit);
    
    console.log('Admin Dashboard Performance:', {
      totalLoadTime: loadTime,
      memoryUsage: performanceMetrics.JSHeapUsedSize
    });
  });
});

describe('AI Generation Performance Tests', () => {
  
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Login
    await page.goto(config.baseURL + '/login');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto(config.baseURL + '/member/generator');
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });
  
  test('Single AI generation performance', async () => {
    const startTime = Date.now();
    
    // Fill form
    await page.type('input[name="fullName"]', 'Performance Test User');
    await page.select('select[name="template"]', 'torus-field');
    await page.type('input[name="sealType"]', 'Performance Test Array');
    
    // Submit and monitor network
    let generationStartTime;
    let generationEndTime;
    
    page.on('request', request => {
      if (request.url().includes('/api/generator/generate')) {
        generationStartTime = Date.now();
      }
    });
    
    page.on('response', response => {
      if (response.url().includes('/api/generator/generate')) {
        generationEndTime = Date.now();
      }
    });
    
    await page.click('button[type="submit"]');
    
    // Wait for generation completion
    await page.waitForSelector('canvas', { timeout: config.performanceThresholds.aiGenerationTime });
    
    const totalTime = Date.now() - startTime;
    const apiCallTime = generationEndTime - generationStartTime;
    
    // Check memory usage after generation
    const finalMemory = await page.metrics();
    
    expect(totalTime).toBeLessThan(config.performanceThresholds.aiGenerationTime);
    expect(apiCallTime).toBeLessThan(config.performanceThresholds.aiGenerationTime - 5000); // API should be faster than UI
    expect(finalMemory.JSHeapUsedSize).toBeLessThan(config.performanceThresholds.memoryUsageLimit);
    
    console.log('AI Generation Performance:', {
      totalTime,
      apiCallTime,
      renderTime: totalTime - apiCallTime,
      memoryUsage: finalMemory.JSHeapUsedSize
    });
  });
  
  test('Multiple concurrent generations performance', async () => {
    const concurrentUsers = 3;
    const generationPromises = [];
    
    for (let i = 0; i < concurrentUsers; i++) {
      const userPage = await browser.newPage();
      
      // Login each user
      await userPage.goto(config.baseURL + '/login');
      await userPage.type('input[type="email"]', testUser.email);
      await userPage.type('input[type="password"]', testUser.password);
      await userPage.click('button[type="submit"]');
      await userPage.waitForNavigation();
      await userPage.goto(config.baseURL + '/member/generator');
      
      // Start generation
      const generationPromise = async () => {
        const startTime = Date.now();
        
        await userPage.type('input[name="fullName"]', `Concurrent User ${i + 1}`);
        await userPage.select('select[name="template"]', 'torus-field');
        await userPage.type('input[name="sealType"]', `Concurrent Test Array ${i + 1}`);
        await userPage.click('button[type="submit"]');
        
        await userPage.waitForSelector('canvas', { 
          timeout: config.performanceThresholds.aiGenerationTime 
        });
        
        const endTime = Date.now();
        await userPage.close();
        
        return endTime - startTime;
      };
      
      generationPromises.push(generationPromise());
    }
    
    const results = await Promise.all(generationPromises);
    
    // All generations should complete within reasonable time
    results.forEach(time => {
      expect(time).toBeLessThan(config.performanceThresholds.aiGenerationTime * 1.5); // 50% buffer for concurrent load
    });
    
    const averageTime = results.reduce((sum, time) => sum + time, 0) / results.length;
    const maxTime = Math.max(...results);
    
    console.log('Concurrent Generation Performance:', {
      concurrentUsers,
      averageTime,
      maxTime,
      allResults: results
    });
  });
});

describe('Canvas Rendering Performance Tests', () => {
  
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Login and setup
    await page.goto(config.baseURL + '/login');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });
  
  test('Canvas initial render performance', async () => {
    // Mock generation data for consistent testing
    await page.goto(config.baseURL + '/member/generator');
    
    const mockData = {
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
      ring3: { text: 'Performance Test Array', language: 'English', repetitions: 1 },
      metadata: { template: 'torus-field', generated: new Date() }
    };
    
    // Inject mock data and trigger render
    const renderStartTime = Date.now();
    
    await page.evaluate((data) => {
      // Simulate canvas render with performance measurement
      window.mockRenderStart = performance.now();
      window.generationData = data;
      
      // Trigger canvas render (this would be done by the actual component)
      if (window.triggerCanvasRender) {
        window.triggerCanvasRender(data);
      }
    }, mockData);
    
    // Wait for canvas to appear
    await page.waitForSelector('canvas', { timeout: config.performanceThresholds.canvasRenderTime });
    
    const renderTime = Date.now() - renderStartTime;
    
    // Check render performance metrics
    const renderMetrics = await page.evaluate(() => {
      return {
        renderTime: window.mockRenderStart ? performance.now() - window.mockRenderStart : 0,
        canvasMemory: window.performance?.memory?.usedJSHeapSize || 0
      };
    });
    
    expect(renderTime).toBeLessThan(config.performanceThresholds.canvasRenderTime);
    
    console.log('Canvas Render Performance:', {
      initialRenderTime: renderTime,
      jsRenderTime: renderMetrics.renderTime,
      memoryUsage: renderMetrics.canvasMemory
    });
  });
  
  test('Canvas zoom and interaction performance', async () => {
    // Setup canvas first (using similar mock data approach)
    await page.goto(config.baseURL + '/member/generator');
    await page.waitForSelector('[data-testid="zoom-controls"]', { timeout: 10000 });
    
    const zoomTestStart = Date.now();
    
    // Perform multiple zoom operations
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="zoom-in"]');
      await page.waitForTimeout(100); // Small delay to allow render
    }
    
    for (let i = 0; i < 5; i++) {
      await page.click('[data-testid="zoom-out"]');
      await page.waitForTimeout(100);
    }
    
    const zoomTestTime = Date.now() - zoomTestStart;
    
    // Reset zoom
    await page.click('[data-testid="zoom-reset"]');
    
    const memoryAfterZoom = await page.evaluate(() => {
      return window.performance?.memory?.usedJSHeapSize || 0;
    });
    
    expect(zoomTestTime).toBeLessThan(2000); // 2 seconds for all zoom operations
    expect(memoryAfterZoom).toBeLessThan(config.performanceThresholds.memoryUsageLimit);
    
    console.log('Canvas Interaction Performance:', {
      zoomOperationsTime: zoomTestTime,
      memoryAfterZoom
    });
  });
  
  test('Image generation and download performance', async () => {
    // Mock purchased state to enable downloads
    await page.goto(config.baseURL + '/member/generator');
    
    await page.evaluate(() => {
      window.isPurchased = true;
      window.hasGeneratedData = true;
    });
    
    await page.waitForSelector('[data-testid="download-png"]:not([disabled])', { timeout: 5000 });
    
    const downloadStartTime = Date.now();
    
    // Start download and measure performance
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="download-png"]');
    
    const download = await downloadPromise;
    const downloadTime = Date.now() - downloadStartTime;
    
    expect(downloadTime).toBeLessThan(3000); // 3 seconds for image generation and download
    
    console.log('Image Download Performance:', {
      downloadTime,
      fileName: download.suggestedFilename()
    });
  });
});

describe('Payment Processing Performance Tests', () => {
  
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ headless: true });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
    
    // Setup: Complete generation first
    await page.goto(config.baseURL + '/login');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });
  
  test('Payment processing initialization performance', async () => {
    await page.goto(config.baseURL + '/member/generator');
    
    // Mock generation completion
    await page.evaluate(() => {
      window.hasGeneratedData = true;
      window.showPaymentOptions = true;
    });
    
    const paymentStartTime = Date.now();
    
    // Navigate to payment section
    await page.waitForSelector('[data-testid="payment-section"]', { timeout: 5000 });
    await page.click('[data-testid="purchase-button"]');
    
    // Wait for payment options to load
    await page.waitForSelector('[data-testid="payment-options"]', { timeout: 5000 });
    
    const paymentLoadTime = Date.now() - paymentStartTime;
    
    expect(paymentLoadTime).toBeLessThan(2000); // 2 seconds for payment UI to load
    
    console.log('Payment UI Performance:', {
      paymentLoadTime
    });
  });
  
  test('Stripe integration performance', async () => {
    await page.goto(config.baseURL + '/member/generator');
    
    // Mock payment request
    const paymentStartTime = Date.now();
    
    const paymentResponse = await page.evaluate(async () => {
      const startTime = performance.now();
      
      try {
        const response = await fetch('/api/payments/stripe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: 17.00,
            currency: 'USD',
            sealArrayId: 'performance_test_' + Date.now(),
            type: 'checkout'
          })
        });
        
        const data = await response.json();
        const endTime = performance.now();
        
        return {
          success: data.success,
          responseTime: endTime - startTime,
          hasCheckoutUrl: !!data.checkoutUrl
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          responseTime: performance.now() - startTime
        };
      }
    });
    
    const totalPaymentTime = Date.now() - paymentStartTime;
    
    if (paymentResponse.success) {
      expect(paymentResponse.responseTime).toBeLessThan(config.performanceThresholds.paymentProcessingTime);
      expect(paymentResponse.hasCheckoutUrl).toBe(true);
    }
    
    expect(totalPaymentTime).toBeLessThan(config.performanceThresholds.paymentProcessingTime);
    
    console.log('Stripe Payment Performance:', {
      totalTime: totalPaymentTime,
      apiResponseTime: paymentResponse.responseTime,
      success: paymentResponse.success
    });
  });
});

describe('Memory Usage and Leak Tests', () => {
  
  let browser, page;
  
  beforeAll(async () => {
    browser = await puppeteer.launch({ 
      headless: true,
      args: ['--enable-precise-memory-info'] // Enable memory tracking
    });
  });
  
  afterAll(async () => {
    if (browser) await browser.close();
  });
  
  beforeEach(async () => {
    page = await browser.newPage();
  });
  
  afterEach(async () => {
    if (page) await page.close();
  });
  
  test('Memory usage during navigation', async () => {
    const memorySnapshots = [];
    
    // Baseline memory
    await page.goto(config.baseURL);
    await page.waitForLoadState('networkidle');
    
    let memory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    memorySnapshots.push({ page: 'home', memory });
    
    // Login page
    await page.goto(config.baseURL + '/login');
    await page.waitForLoadState('networkidle');
    memory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    memorySnapshots.push({ page: 'login', memory });
    
    // Login and go to dashboard
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    memory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    memorySnapshots.push({ page: 'dashboard', memory });
    
    // Generator page
    await page.goto(config.baseURL + '/member/generator');
    await page.waitForLoadState('networkidle');
    memory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    memorySnapshots.push({ page: 'generator', memory });
    
    // Check for memory leaks (memory should not continuously grow)
    const maxMemory = Math.max(...memorySnapshots.map(s => s.memory));
    expect(maxMemory).toBeLessThan(config.performanceThresholds.memoryUsageLimit);
    
    console.log('Memory Usage Snapshots:', memorySnapshots);
  });
  
  test('Memory cleanup after generation', async () => {
    await page.goto(config.baseURL + '/login');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    await page.waitForNavigation();
    await page.goto(config.baseURL + '/member/generator');
    
    const initialMemory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    
    // Simulate generation (using mock data for speed)
    await page.evaluate(() => {
      // Create large mock data to test memory handling
      window.generationData = {
        ring1: Array.from({ length: 24 }, (_, i) => ({
          number: i + 1,
          color: 'BLUE',
          position: `${i}:00`,
          angle: i * 15,
          x: 600 + Math.cos(i * 15 * Math.PI / 180) * 360,
          y: 600 + Math.sin(i * 15 * Math.PI / 180) * 360
        })),
        ring2: Array.from({ length: 24 }, (_, i) => ({
          glyph: 'test.png',
          color: 'GREEN',
          position: `${i}:00`,
          angle: i * 15,
          x: 600 + Math.cos(i * 15 * Math.PI / 180) * 460,
          y: 600 + Math.sin(i * 15 * Math.PI / 180) * 460
        })),
        ring3: { text: 'Memory Test Array', language: 'English', repetitions: 1 }
      };
    });
    
    const afterGenerationMemory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if (window.gc) {
        window.gc();
      }
    });
    
    // Clear data and check memory cleanup
    await page.evaluate(() => {
      window.generationData = null;
      if (window.gc) {
        window.gc();
      }
    });
    
    const finalMemory = await page.evaluate(() => window.performance.memory?.usedJSHeapSize || 0);
    
    const memoryIncrease = afterGenerationMemory - initialMemory;
    const memoryCleanup = afterGenerationMemory - finalMemory;
    
    // Memory should not increase excessively and should clean up somewhat
    expect(memoryIncrease).toBeLessThan(config.performanceThresholds.memoryUsageLimit / 2);
    
    console.log('Memory Cleanup Test:', {
      initialMemory,
      afterGenerationMemory,
      finalMemory,
      memoryIncrease,
      memoryCleanup
    });
  });
});

describe('Load Testing', () => {
  
  test.each(config.loadTestUsers)('Load test with %i concurrent users', async (userCount) => {
    const browsers = [];
    const userPromises = [];
    
    try {
      // Create multiple browser instances
      for (let i = 0; i < Math.min(userCount, 5); i++) { // Limit actual browsers to prevent system overload
        const browser = await puppeteer.launch({ headless: true });
        browsers.push(browser);
      }
      
      // Create user simulation promises
      for (let i = 0; i < userCount; i++) {
        const browser = browsers[i % browsers.length]; // Reuse browsers
        
        const userPromise = async () => {
          const page = await browser.newPage();
          const startTime = Date.now();
          
          try {
            // Basic navigation test
            await page.goto(config.baseURL, { timeout: 30000 });
            await page.waitForSelector('h1', { timeout: 10000 });
            
            // Login test
            await page.goto(config.baseURL + '/login');
            await page.type('input[type="email"]', testUser.email);
            await page.type('input[type="password"]', testUser.password);
            await page.click('button[type="submit"]');
            await page.waitForNavigation({ timeout: 15000 });
            
            const endTime = Date.now();
            await page.close();
            
            return {
              userId: i,
              success: true,
              duration: endTime - startTime
            };
          } catch (error) {
            await page.close();
            return {
              userId: i,
              success: false,
              error: error.message,
              duration: Date.now() - startTime
            };
          }
        };
        
        userPromises.push(userPromise());
      }
      
      const results = await Promise.allSettled(userPromises);
      
      const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
      const failed = results.length - successful;
      const averageTime = results
        .filter(r => r.status === 'fulfilled')
        .reduce((sum, r) => sum + r.value.duration, 0) / successful || 0;
      
      const successRate = (successful / userCount) * 100;
      
      // Assertions based on load
      if (userCount <= 5) {
        expect(successRate).toBeGreaterThan(90); // 90% success rate for light load
      } else if (userCount <= 15) {
        expect(successRate).toBeGreaterThan(75); // 75% success rate for medium load
      } else {
        expect(successRate).toBeGreaterThan(50); // 50% success rate for heavy load
      }
      
      console.log(`Load Test Results (${userCount} users):`, {
        successful,
        failed,
        successRate: `${successRate.toFixed(1)}%`,
        averageTime: `${averageTime.toFixed(0)}ms`
      });
      
    } finally {
      // Cleanup browsers
      await Promise.all(browsers.map(browser => browser.close()));
    }
  }, 300000); // 5 minute timeout for load tests
});

// Utility functions
async function measurePageLoadMetrics(page) {
  return await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      resources: performance.getEntriesByType('resource').length,
      memoryUsage: window.performance?.memory?.usedJSHeapSize || 0
    };
  });
}

async function simulateNetworkConditions(page, condition) {
  const conditions = {
    slow3g: { offline: false, downloadThroughput: 500 * 1024 / 8, uploadThroughput: 500 * 1024 / 8, latency: 400 },
    fast3g: { offline: false, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8, latency: 150 },
    offline: { offline: true }
  };
  
  if (conditions[condition]) {
    await page.emulateNetworkConditions(conditions[condition]);
  }
}

module.exports = {
  config,
  measurePageLoadMetrics,
  simulateNetworkConditions
};