# ANOINT Array - API Integration Testing Suite

## Overview

This comprehensive testing suite validates all external API integrations for the ANOINT Array e-commerce platform. The suite tests shipping APIs, payment gateways, email services, webhooks, and end-to-end integration flows to ensure production readiness.

## 🎯 What This Tests

### Shipping API Integration
- **UPS Rating API**: Rate calculations, service mapping, error handling
- **Canada Post API**: Domestic shipping rates, XML parsing, timeout handling
- **Address Validation**: Valid/invalid postal codes, international addresses
- **Fallback Mechanisms**: Graceful degradation when APIs are unavailable

### Payment Gateway Integration
- **Stripe Integration**: Checkout sessions, webhooks, signature verification
- **PayPal Integration**: Order creation, capture flow, webhook handling
- **Error Scenarios**: Invalid payments, expired sessions, failed captures
- **Security**: Webhook signature verification, malformed data handling

### Email Service Integration
- **Resend API**: Order confirmations, delivery reliability
- **Template Rendering**: HTML/text emails, unicode support, large orders
- **Deliverability**: Multiple email providers, spam score analysis
- **Error Handling**: Invalid emails, API failures, retry mechanisms

### System Performance
- **Response Times**: Baseline performance under normal load
- **Concurrent Handling**: Multiple simultaneous requests
- **Load Testing**: Sustained load over time, performance degradation
- **Memory Usage**: Large payload handling, resource management

### End-to-End Flows
- **Complete Checkout**: Cart → Shipping → Payment → Confirmation
- **Webhook Processing**: Payment completion → Database updates → Email
- **Error Recovery**: Failed payments, timeout scenarios
- **Discount Application**: Coupon validation and application

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- Access to Supabase project with deployed Edge Functions
- Environment variables configured

### Environment Setup
```bash
# Required environment variables
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ANON_KEY="your-anon-key-here"

# Optional: For more detailed API testing (if you have test credentials)
export UPS_CLIENT_ID="your-ups-client-id"
export UPS_SECRET="your-ups-secret"
export CANPOST_DEV_USERNAME="your-canpost-username"
export CANPOST_DEV_PASSWORD="your-canpost-password"
export STRIPE_SECRET_KEY="sk_test_your-stripe-key"
export RESEND_API_KEY="re_your-resend-key"
```

### Running Tests

#### Run All Tests (Recommended)
```bash
# Run the complete test suite
node run-all-tests.js
```

#### Run Individual Test Categories
```bash
# Basic API integration tests
node api-test-suite.js

# Payment webhook tests
node payment-webhook-tester.js

# Email delivery tests
node email-delivery-tester.js

# End-to-end integration flows
node integration-flow-tester.js

# Performance and load tests
node performance-load-tester.js
```

#### Run Specific Test Categories
```bash
# Test only shipping APIs
node api-test-suite.js shipping

# Test only payment integration
node api-test-suite.js payments

# Test only email service
node api-test-suite.js email
```

## 📊 Test Reports

The testing suite generates multiple reports:

### Master Report (`master-test-report.json`)
- Complete test results across all suites
- Production readiness assessment
- API health status
- Detailed recommendations

### Simplified Summary (`test-report-summary.md`)
- Quick overview in markdown format
- Key metrics and status
- Immediate actions required

### Individual Suite Reports
- `api-test-report.json` - Basic API integration results
- `email-test-report.json` - Email delivery analysis
- `integration-flow-report.json` - End-to-end flow results
- `performance-test-report.json` - Performance analysis

## 🏥 Production Readiness Assessment

The test suite provides a production readiness score based on:

### Critical Factors (High Impact)
- **API Functionality**: All core APIs must work correctly
- **Payment Processing**: Zero tolerance for payment failures
- **Security**: Webhook verification and data validation
- **Performance**: Response times under acceptable thresholds

### Scoring System
- **95-100**: Ready for production
- **80-94**: Ready with minor issues
- **60-79**: Needs improvement
- **0-59**: Not ready for production

### Health Check Categories
- 🟢 **Healthy**: 80%+ success rate, good performance
- 🟡 **Warning**: 60-79% success rate, some issues
- 🔴 **Critical**: <60% success rate, major problems

## 🧪 Test Categories Explained

### 1. API Integration Tests (`api-test-suite.js`)
Tests basic functionality of all external APIs:
- Valid request/response cycles
- Error handling and graceful degradation
- Response time benchmarks
- Data validation and sanitization

### 2. Payment Webhook Tests (`payment-webhook-tester.js`)
Validates payment processing workflows:
- Stripe webhook signature verification
- PayPal webhook processing
- Payment state transitions
- Security vulnerability testing

### 3. Email Delivery Tests (`email-delivery-tester.js`)
Ensures reliable email communications:
- Template rendering accuracy
- Multi-provider deliverability
- Unicode and special character handling
- Spam score optimization

### 4. Integration Flow Tests (`integration-flow-tester.js`)
Tests complete user journeys:
- Cart to checkout completion
- Payment method switching
- Discount code application
- Error recovery flows

### 5. Performance Tests (`performance-load-tester.js`)
Validates system performance:
- Baseline response times
- Concurrent request handling
- Sustained load testing
- Memory usage patterns

## 🔧 Configuration Options

### Test Addresses
The suite uses predefined test addresses for different scenarios:
- Valid Canadian address (Toronto, ON)
- Valid US address (New York, NY)
- Invalid postal code for error testing

### Test Products
Sample products from the ANOINT Array catalog:
- Various price points and weights
- Different categories for comprehensive testing

### Customization
You can modify test parameters in each script:
- Request timeouts
- Concurrency levels
- Test data variations
- Performance thresholds

## 🚨 Common Issues and Solutions

### Connection Timeouts
```bash
# Increase timeout for slow networks
export TEST_TIMEOUT=30000
```

### Rate Limiting
```bash
# If hitting rate limits, add delays between requests
export TEST_DELAY=1000
```

### Memory Issues
```bash
# For large payload tests, increase Node.js memory
node --max-old-space-size=4096 run-all-tests.js
```

### SSL Certificate Issues
```bash
# For development environments with self-signed certificates
export NODE_TLS_REJECT_UNAUTHORIZED=0
```

## 📋 Pre-Production Checklist

Before deploying to production, ensure:

### ✅ API Integration
- [ ] All shipping APIs return valid rates
- [ ] Payment gateways create sessions successfully
- [ ] Email service sends confirmations
- [ ] Webhook endpoints respond correctly

### ✅ Security
- [ ] Webhook signatures are verified
- [ ] Invalid data is rejected gracefully
- [ ] No sensitive information in logs
- [ ] CORS headers configured correctly

### ✅ Performance
- [ ] Average response time < 3 seconds
- [ ] 95%+ success rate under normal load
- [ ] Graceful degradation under high load
- [ ] No memory leaks during sustained testing

### ✅ Error Handling
- [ ] Invalid addresses handled gracefully
- [ ] Payment failures processed correctly
- [ ] Email delivery failures don't block orders
- [ ] Timeout scenarios recover properly

## 🔍 Monitoring Recommendations

### Production Monitoring
1. **API Response Times**: Monitor all external API calls
2. **Error Rates**: Track failure rates for each integration
3. **Email Delivery**: Monitor bounce rates and delivery confirmations
4. **Webhook Processing**: Ensure all webhooks are processed

### Alert Thresholds
- API response time > 5 seconds
- Error rate > 5% for any integration
- Email delivery rate < 95%
- Webhook processing delays > 30 seconds

## 🤝 Contributing

### Adding New Tests
1. Create test functions following existing patterns
2. Include both success and failure scenarios
3. Add performance metrics where relevant
4. Update this documentation

### Test Data Guidelines
- Use realistic but fictional data
- Include edge cases and boundary conditions
- Test with various data sizes and formats
- Ensure data privacy compliance

## 📞 Support

For issues with the testing suite:

1. Check the console output for specific error messages
2. Verify all environment variables are set correctly
3. Ensure Supabase Edge Functions are deployed
4. Review individual test reports for detailed diagnostics

## 🔄 Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
name: API Integration Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: node run-all-tests.js
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
```

### Automated Monitoring
```bash
# Schedule regular production tests
0 */6 * * * cd /path/to/tests && node run-all-tests.js >> production-test.log 2>&1
```

---

## 📄 License

This testing suite is part of the ANOINT Array project and follows the same license terms.

## 🏷️ Version

Current Version: 1.0.0
Last Updated: 2025-01-30

---

*Generated by APIHammer - The comprehensive API integration testing suite for e-commerce platforms.*