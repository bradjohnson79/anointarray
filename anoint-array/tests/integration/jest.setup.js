// Jest setup for integration tests
// Global configuration and utilities for all test suites

const { expect } = require('@jest/globals');

// Extend Jest with custom matchers
expect.extend({
  toBeWithinRange(received, floor, ceiling) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },

  toHaveValidUrl(received) {
    const pass = typeof received === 'string' && received.startsWith('http');
    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid URL`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid URL`,
        pass: false,
      };
    }
  },

  toHaveValidEmailFormat(received) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const pass = emailRegex.test(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to have valid email format`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have valid email format`,
        pass: false,
      };
    }
  },

  toHaveValidGenerationStructure(received) {
    const hasRing1 = Array.isArray(received.ring1) && received.ring1.length === 24;
    const hasRing2 = Array.isArray(received.ring2) && received.ring2.length === 24;
    const hasRing3 = received.ring3 && typeof received.ring3.text === 'string';
    const hasExplanation = typeof received.explanation === 'string';
    const hasMetadata = received.metadata && received.metadata.template;

    const pass = hasRing1 && hasRing2 && hasRing3 && hasExplanation && hasMetadata;
    
    if (pass) {
      return {
        message: () => 'expected generation data not to have valid structure',
        pass: true,
      };
    } else {
      return {
        message: () => `expected generation data to have valid structure. Missing: ${
          [
            !hasRing1 && 'ring1 (24 items)',
            !hasRing2 && 'ring2 (24 items)', 
            !hasRing3 && 'ring3.text',
            !hasExplanation && 'explanation',
            !hasMetadata && 'metadata.template'
          ].filter(Boolean).join(', ')
        }`,
        pass: false,
      };
    }
  }
});

// Global test configuration
global.testConfig = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://anoint-array.vercel.app' 
    : 'http://localhost:3001',
  timeout: {
    short: 5000,
    medium: 30000,
    long: 120000,
    aiGeneration: 90000,
    loadTest: 300000
  },
  retries: {
    api: 3,
    ui: 2,
    payment: 1
  },
  thresholds: {
    pageLoadTime: 3000,
    aiGenerationTime: 45000,
    paymentProcessingTime: 10000,
    memoryUsage: 100 * 1024 * 1024, // 100MB
    successRate: 95 // 95%
  }
};

// Global test utilities
global.testUtils = {
  
  // Wait for a condition with timeout
  waitForCondition: async (conditionFn, timeout = 30000, interval = 1000) => {
    const start = Date.now();
    
    while (Date.now() - start < timeout) {
      if (await conditionFn()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    
    throw new Error(`Condition not met within ${timeout}ms`);
  },

  // Retry a function with exponential backoff
  retryWithBackoff: async (fn, maxRetries = 3, baseDelay = 1000) => {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (i < maxRetries - 1) {
          const delay = baseDelay * Math.pow(2, i);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  },

  // Generate test data
  generateTestData: {
    user: () => ({
      fullName: `Test User ${Date.now()}`,
      email: `test${Date.now()}@example.com`,
      birthdate: { month: 8, day: 7, year: 1990 },
      template: 'torus-field',
      category: 'Healing',
      sealType: 'Integration Test Array'
    }),
    
    paymentRequest: () => ({
      amount: 17.00,
      currency: 'USD',
      sealArrayId: `test_array_${Date.now()}`,
      customerEmail: `customer${Date.now()}@example.com`
    }),
    
    generationRequest: () => ({
      fullName: `Integration Test User ${Date.now()}`,
      birthdate: { month: 8, day: 7, year: 1990 },
      birthTime: { hour: 2, minute: 30, period: 'PM' },
      birthPlace: {
        displayName: 'Toronto, ON, Canada',
        latitude: 43.6532,
        longitude: -79.3832
      },
      template: 'torus-field',
      category: 'Healing',
      sealType: 'Automated Test Array',
      debugMode: true
    })
  },

  // Validation helpers
  validators: {
    isValidGenerationResponse: (data) => {
      return (
        data &&
        Array.isArray(data.ring1) && data.ring1.length === 24 &&
        Array.isArray(data.ring2) && data.ring2.length === 24 &&
        data.ring3 && typeof data.ring3.text === 'string' &&
        typeof data.explanation === 'string' &&
        data.metadata && data.metadata.template
      );
    },
    
    isValidPaymentResponse: (data) => {
      return (
        data &&
        typeof data.success === 'boolean' &&
        (data.success ? (data.sessionId || data.paymentIntentId) : data.error)
      );
    },
    
    isValidUrl: (url) => {
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    },
    
    isWithinPerformanceThreshold: (actualTime, thresholdTime) => {
      return actualTime <= thresholdTime;
    }
  },

  // Mock data generators
  mocks: {
    generationData: {
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
      ring3: { 
        text: 'Mock Test Array', 
        language: 'English', 
        repetitions: 1 
      },
      explanation: 'This is a mock generation for testing purposes.',
      metadata: { 
        template: 'torus-field', 
        category: 'Testing',
        sealType: 'Mock Array',
        generated: new Date().toISOString()
      }
    },

    stripeWebhookEvent: {
      id: 'evt_test_webhook',
      object: 'event',
      type: 'payment_intent.succeeded',
      data: {
        object: {
          id: 'pi_test_payment_intent',
          object: 'payment_intent',
          amount: 1700,
          currency: 'usd',
          status: 'succeeded',
          metadata: {
            orderId: 'test_order_123',
            sealArrayId: 'test_array_123'
          }
        }
      }
    }
  },

  // Performance measurement helpers
  performance: {
    measureExecutionTime: async (fn) => {
      const start = Date.now();
      const result = await fn();
      const duration = Date.now() - start;
      return { result, duration };
    },
    
    measureMemoryUsage: async (page) => {
      if (page && page.evaluate) {
        return await page.evaluate(() => {
          return {
            usedJSHeapSize: window.performance?.memory?.usedJSHeapSize || 0,
            totalJSHeapSize: window.performance?.memory?.totalJSHeapSize || 0,
            jsHeapSizeLimit: window.performance?.memory?.jsHeapSizeLimit || 0
          };
        });
      }
      return null;
    },
    
    getNavigationMetrics: async (page) => {
      if (page && page.evaluate) {
        return await page.evaluate(() => {
          const navigation = performance.getEntriesByType('navigation')[0];
          if (!navigation) return null;
          
          return {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
            firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
          };
        });
      }
      return null;
    }
  }
};

// Test environment setup
beforeAll(async () => {
  console.log('🧪 Starting Integration Test Suite');
  console.log(`📍 Base URL: ${global.testConfig.baseURL}`);
  console.log(`⏱️  Timeout Settings: ${JSON.stringify(global.testConfig.timeout)}`);
  console.log(`🎯 Performance Thresholds: ${JSON.stringify(global.testConfig.thresholds)}`);
});

beforeEach(async () => {
  // Reset any global state before each test
  global.testState = {
    startTime: Date.now(),
    testName: expect.getState().currentTestName || 'unknown'
  };
});

afterEach(async () => {
  // Clean up after each test
  const duration = Date.now() - global.testState.startTime;
  console.log(`✅ Test "${global.testState.testName}" completed in ${duration}ms`);
});

afterAll(async () => {
  console.log('🏁 Integration Test Suite Complete');
});

// Uncaught error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

// Export for use in tests
module.exports = {
  testConfig: global.testConfig,
  testUtils: global.testUtils
};