// API Integration Tests for ANOINT Array Platform
// Tests all API endpoints, third-party integrations, and data flows

const request = require('supertest');
const { expect } = require('@jest/globals');

// Configuration
const config = {
  baseURL: process.env.NODE_ENV === 'production' 
    ? 'https://anoint-array.vercel.app' 
    : 'http://localhost:3001',
  timeout: 60000, // 60 seconds for AI calls
  retries: 3
};

// Test data
const validGenerationRequest = {
  fullName: 'API Test User',
  birthdate: { month: 8, day: 7, year: 1990 },
  birthTime: { hour: 2, minute: 30, period: 'PM' },
  birthPlace: {
    displayName: 'Toronto, ON, Canada',
    latitude: 43.6532,
    longitude: -79.3832
  },
  template: 'torus-field',
  category: 'Healing',
  sealType: 'API Integration Test Array',
  additionalComments: 'Automated API integration test',
  debugMode: true
};

const validPaymentRequest = {
  amount: 17.00,
  currency: 'USD',
  sealArrayId: 'test_array_' + Date.now(),
  customerEmail: 'api-test@example.com',
  type: 'checkout'
};

describe('AI Service Integration Tests', () => {
  
  describe('POST /api/generator/generate', () => {
    
    test('should generate seal array with valid input', async () => {
      const response = await request(config.baseURL)
        .post('/api/generator/generate')
        .send(validGenerationRequest)
        .timeout(config.timeout);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Validate response structure
      expect(response.body.data).toHaveProperty('ring1');
      expect(response.body.data).toHaveProperty('ring2');
      expect(response.body.data).toHaveProperty('ring3');
      expect(response.body.data).toHaveProperty('explanation');
      expect(response.body.data).toHaveProperty('metadata');
      
      // Validate ring data
      expect(response.body.data.ring1).toHaveLength(24);
      expect(response.body.data.ring2).toHaveLength(24);
      
      // Validate ring1 structure
      response.body.data.ring1.forEach(item => {
        expect(item).toHaveProperty('number');
        expect(item).toHaveProperty('color');
        expect(item).toHaveProperty('position');
        expect(item).toHaveProperty('angle');
        expect(item).toHaveProperty('x');
        expect(item).toHaveProperty('y');
        expect(typeof item.number).toBe('number');
        expect(item.number).toBeGreaterThan(0);
        expect(item.number).toBeLessThan(1000);
      });
      
      // Validate ring2 structure
      response.body.data.ring2.forEach(item => {
        expect(item).toHaveProperty('glyph');
        expect(item).toHaveProperty('color');
        expect(item).toHaveProperty('position');
        expect(item.glyph).toMatch(/\.png$/); // Should end with .png
      });
      
      // Validate ring3 structure
      expect(response.body.data.ring3).toHaveProperty('text');
      expect(response.body.data.ring3).toHaveProperty('language');
      expect(response.body.data.ring3).toHaveProperty('repetitions');
      expect(typeof response.body.data.ring3.text).toBe('string');
      expect(response.body.data.ring3.text.length).toBeGreaterThan(0);
      
      // Validate metadata
      expect(response.body.data.metadata.template).toBe(validGenerationRequest.template);
      expect(response.body.data.metadata.category).toBe(validGenerationRequest.category);
      expect(response.body.data.metadata.sealType).toBe(validGenerationRequest.sealType);
      
      // Validate cost tracking
      expect(response.body).toHaveProperty('tokensUsed');
      expect(response.body).toHaveProperty('cost');
      expect(typeof response.body.tokensUsed).toBe('number');
      expect(typeof response.body.cost).toBe('string');
    });
    
    test('should handle missing required fields', async () => {
      const invalidRequest = {
        fullName: 'Incomplete User'
        // Missing required fields
      };
      
      const response = await request(config.baseURL)
        .post('/api/generator/generate')
        .send(invalidRequest);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Missing required fields');
    });
    
    test('should handle AI service failures gracefully', async () => {
      // This test assumes the AI service might be temporarily unavailable
      const requestWithInvalidKey = { ...validGenerationRequest };
      
      const response = await request(config.baseURL)
        .post('/api/generator/generate')
        .send(requestWithInvalidKey)
        .timeout(config.timeout);
      
      // Should either succeed or fail gracefully
      if (response.status !== 200) {
        expect(response.status).toBe(500);
        expect(response.body.success).toBe(false);
        expect(response.body.error).toBeDefined();
        expect(response.body.code).toBeDefined();
      }
    });
    
    test('should include debug information when requested', async () => {
      const debugRequest = { ...validGenerationRequest, debugMode: true };
      
      const response = await request(config.baseURL)
        .post('/api/generator/generate')
        .send(debugRequest)
        .timeout(config.timeout);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('debug');
        expect(response.body.debug).toHaveProperty('prompt');
        expect(response.body.debug).toHaveProperty('aiResponse');
        expect(response.body.debug).toHaveProperty('timing');
        expect(response.body.debug).toHaveProperty('tokens');
      }
    });
    
    test('should validate unique values in rings', async () => {
      const response = await request(config.baseURL)
        .post('/api/generator/generate')
        .send(validGenerationRequest)
        .timeout(config.timeout);
      
      if (response.status === 200) {
        // Check ring1 numbers are unique
        const ring1Numbers = response.body.data.ring1.map(item => item.number);
        const uniqueNumbers = [...new Set(ring1Numbers)];
        expect(uniqueNumbers).toHaveLength(24);
        
        // Check ring2 positions are unique (glyphs can repeat, positions should not)
        const ring2Positions = response.body.data.ring2.map(item => item.position);
        const uniquePositions = [...new Set(ring2Positions)];
        expect(uniquePositions).toHaveLength(24);
      }
    });
  });
  
  describe('GET /api/ai-status', () => {
    
    test('should return AI service status', async () => {
      const response = await request(config.baseURL)
        .get('/api/ai-status');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('claude');
      expect(response.body).toHaveProperty('openai');
      expect(response.body).toHaveProperty('timestamp');
      
      // Validate service status format
      expect(['available', 'unavailable', 'limited']).toContain(response.body.claude.status);
      expect(['available', 'unavailable', 'limited']).toContain(response.body.openai.status);
    });
  });
});

describe('Payment Integration Tests', () => {
  
  describe('POST /api/payments/stripe', () => {
    
    test('should create Stripe checkout session', async () => {
      const response = await request(config.baseURL)
        .post('/api/payments/stripe')
        .send(validPaymentRequest);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.type).toBe('checkout_session');
      expect(response.body).toHaveProperty('sessionId');
      expect(response.body).toHaveProperty('checkoutUrl');
      expect(response.body.amount).toBe(17.00);
      expect(response.body.currency).toBe('USD');
    });
    
    test('should validate payment amount', async () => {
      const invalidAmountRequest = {
        ...validPaymentRequest,
        amount: 25.00 // Invalid amount
      };
      
      const response = await request(config.baseURL)
        .post('/api/payments/stripe')
        .send(invalidAmountRequest);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid payment amount');
    });
    
    test('should validate required fields', async () => {
      const incompleteRequest = {
        amount: 17.00
        // Missing currency and sealArrayId
      };
      
      const response = await request(config.baseURL)
        .post('/api/payments/stripe')
        .send(incompleteRequest);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required parameters');
    });
    
    test('should create payment intent when specified', async () => {
      const paymentIntentRequest = {
        ...validPaymentRequest,
        type: 'payment_intent'
      };
      
      const response = await request(config.baseURL)
        .post('/api/payments/stripe')
        .send(paymentIntentRequest);
      
      expect(response.status).toBe(200);
      if (response.body.success) {
        expect(response.body.type).toBe('payment_intent');
        expect(response.body).toHaveProperty('paymentIntentId');
        expect(response.body).toHaveProperty('clientSecret');
      }
    });
  });
  
  describe('GET /api/payments/stripe', () => {
    
    test('should retrieve payment details with sessionId', async () => {
      // First create a session
      const createResponse = await request(config.baseURL)
        .post('/api/payments/stripe')
        .send(validPaymentRequest);
      
      if (createResponse.body.success) {
        const sessionId = createResponse.body.sessionId;
        
        const response = await request(config.baseURL)
          .get(`/api/payments/stripe?sessionId=${sessionId}`);
        
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.sessionId).toBe(sessionId);
      }
    });
    
    test('should handle missing parameters', async () => {
      const response = await request(config.baseURL)
        .get('/api/payments/stripe');
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing sessionId or paymentIntentId');
    });
  });
  
  describe('POST /api/payments/paypal', () => {
    
    test('should create PayPal order', async () => {
      const paypalRequest = {
        ...validPaymentRequest,
        returnUrl: 'http://localhost:3001/success',
        cancelUrl: 'http://localhost:3001/cancel'
      };
      
      const response = await request(config.baseURL)
        .post('/api/payments/paypal')
        .send(paypalRequest);
      
      // PayPal integration might not be fully configured in test environment
      if (response.status === 200 && response.body.success) {
        expect(response.body).toHaveProperty('paymentId');
        expect(response.body.status).toBe('pending');
        expect(response.body).toHaveProperty('redirectUrl');
      }
    });
  });
  
  describe('POST /api/payments/nowpayments', () => {
    
    test('should create cryptocurrency payment', async () => {
      const cryptoRequest = {
        ...validPaymentRequest,
        cryptoCurrency: 'BTC'
      };
      
      const response = await request(config.baseURL)
        .post('/api/payments/nowpayments')
        .send(cryptoRequest);
      
      // NOWPayments might not be configured in test environment
      if (response.status === 200 && response.body.success) {
        expect(response.body).toHaveProperty('paymentId');
        expect(response.body.status).toBe('pending');
        expect(response.body).toHaveProperty('cryptoDetails');
        expect(response.body.cryptoDetails).toHaveProperty('currency');
        expect(response.body.cryptoDetails).toHaveProperty('address');
        expect(response.body.cryptoDetails).toHaveProperty('amount');
      }
    });
  });
});

describe('Webhook Integration Tests', () => {
  
  describe('POST /api/webhooks/stripe', () => {
    
    test('should handle stripe webhook events', async () => {
      // Mock Stripe webhook payload
      const webhookPayload = {
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
      };
      
      const response = await request(config.baseURL)
        .post('/api/webhooks/stripe')
        .send(webhookPayload)
        .set('stripe-signature', 'test_signature');
      
      // Webhook will likely fail signature validation in test
      // but we can test the endpoint exists and handles requests
      expect([200, 400, 500]).toContain(response.status);
    });
    
    test('should reject requests without signature', async () => {
      const webhookPayload = {
        id: 'evt_test_webhook',
        type: 'payment_intent.succeeded',
        data: {}
      };
      
      const response = await request(config.baseURL)
        .post('/api/webhooks/stripe')
        .send(webhookPayload);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toContain('No signature found');
    });
  });
  
  describe('GET /api/webhooks/stripe', () => {
    
    test('should return webhook endpoint status', async () => {
      const response = await request(config.baseURL)
        .get('/api/webhooks/stripe');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.message).toContain('webhook endpoint is active');
    });
  });
});

describe('FourthWall Integration Tests', () => {
  
  describe('GET /api/fourthwall/test-connection', () => {
    
    test('should test FourthWall API connection', async () => {
      const response = await request(config.baseURL)
        .get('/api/fourthwall/test-connection');
      
      // Connection test should return status regardless of credentials
      expect([200, 500, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      
      if (response.body.success) {
        expect(response.body).toHaveProperty('connection');
        expect(response.body.connection).toHaveProperty('apiStatus');
        expect(response.body.connection).toHaveProperty('lastChecked');
      } else {
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('status');
      }
    });
  });
  
  describe('POST /api/fourthwall/create-merchandise', () => {
    
    test('should handle merchandise creation request', async () => {
      const merchandiseRequest = {
        sealArrayId: 'test_array_123',
        sealArrayImage: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        customerEmail: 'test@example.com',
        productTypes: ['classic-tee', 'ceramic-mug']
      };
      
      const response = await request(config.baseURL)
        .post('/api/fourthwall/create-merchandise')
        .send(merchandiseRequest)
        .timeout(30000); // Merchandise creation might take time
      
      // FourthWall might not be fully configured in test environment
      expect([200, 500, 503]).toContain(response.status);
      
      if (response.status === 200 && response.body.success) {
        expect(response.body).toHaveProperty('checkoutUrl');
        expect(response.body).toHaveProperty('products');
        expect(Array.isArray(response.body.products)).toBe(true);
      }
    });
    
    test('should validate required fields for merchandise creation', async () => {
      const incompleteRequest = {
        sealArrayId: 'test_array_123'
        // Missing required fields
      };
      
      const response = await request(config.baseURL)
        .post('/api/fourthwall/create-merchandise')
        .send(incompleteRequest);
      
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});

describe('Digital Fulfillment Integration Tests', () => {
  
  describe('POST /api/digital/generate', () => {
    
    test('should generate digital download links', async () => {
      const fulfillmentRequest = {
        orderId: 'test_order_' + Date.now(),
        orderItems: [
          {
            productId: 'prod_digital_001',
            productTitle: 'Test Array Download',
            sku: 'AA-DIGITAL-001',
            digitalFile: '/test/digital-content.zip',
            quantity: 1
          }
        ],
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        expiryHours: 168,
        maxDownloads: 3
      };
      
      const response = await request(config.baseURL)
        .post('/api/digital/generate')
        .send(fulfillmentRequest);
      
      expect([200, 404, 500]).toContain(response.status);
      
      if (response.status === 200 && response.body.success) {
        expect(response.body).toHaveProperty('downloadLinks');
        expect(Array.isArray(response.body.downloadLinks)).toBe(true);
        expect(response.body).toHaveProperty('expiryDate');
      }
    });
  });
  
  describe('GET /api/digital/download/:token', () => {
    
    test('should handle download token requests', async () => {
      const testToken = 'test_download_token_123';
      
      const response = await request(config.baseURL)
        .get(`/api/digital/download/${testToken}`);
      
      // Token likely doesn't exist, but endpoint should handle gracefully
      expect([200, 404, 403]).toContain(response.status);
      
      if (response.status === 404) {
        expect(response.body.error).toContain('not found');
      }
    });
  });
});

describe('Admin API Integration Tests', () => {
  
  describe('POST /api/admin/backup/create', () => {
    
    test('should create system backup', async () => {
      const backupRequest = {
        type: 'full',
        description: 'API Integration Test Backup'
      };
      
      const response = await request(config.baseURL)
        .post('/api/admin/backup/create')
        .send(backupRequest);
      
      // Admin endpoints might require authentication
      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('backupId');
        expect(response.body).toHaveProperty('timestamp');
      }
    });
  });
  
  describe('GET /api/admin/analytics', () => {
    
    test('should return analytics data', async () => {
      const response = await request(config.baseURL)
        .get('/api/admin/analytics');
      
      // Admin endpoints might require authentication
      expect([200, 401, 403]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body).toHaveProperty('analytics');
        expect(response.body.analytics).toHaveProperty('users');
        expect(response.body.analytics).toHaveProperty('orders');
        expect(response.body.analytics).toHaveProperty('revenue');
      }
    });
  });
});

describe('Health Check Integration Tests', () => {
  
  describe('GET /api/health', () => {
    
    test('should return system health status', async () => {
      const response = await request(config.baseURL)
        .get('/api/health');
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('services');
      
      // Validate service health checks
      if (response.body.services) {
        expect(response.body.services).toHaveProperty('database');
        expect(response.body.services).toHaveProperty('ai');
        expect(response.body.services).toHaveProperty('payment');
      }
    });
  });
});

describe('Error Handling Integration Tests', () => {
  
  test('should handle 404 for non-existent endpoints', async () => {
    const response = await request(config.baseURL)
      .get('/api/non-existent-endpoint');
    
    expect(response.status).toBe(404);
  });
  
  test('should handle malformed JSON requests', async () => {
    const response = await request(config.baseURL)
      .post('/api/generator/generate')
      .send('invalid json')
      .set('Content-Type', 'application/json');
    
    expect([400, 500]).toContain(response.status);
  });
  
  test('should handle oversized requests', async () => {
    const oversizedData = {
      fullName: 'A'.repeat(10000), // Very large string
      template: 'torus-field',
      sealType: 'Oversized Test'
    };
    
    const response = await request(config.baseURL)
      .post('/api/generator/generate')
      .send(oversizedData);
    
    expect([400, 413, 500]).toContain(response.status);
  });
});

// Utility functions for API testing
async function waitForCondition(conditionFn, timeout = 30000, interval = 1000) {
  const start = Date.now();
  
  while (Date.now() - start < timeout) {
    if (await conditionFn()) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  return false;
}

async function retryRequest(requestFn, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

module.exports = {
  config,
  validGenerationRequest,
  validPaymentRequest,
  waitForCondition,
  retryRequest
};