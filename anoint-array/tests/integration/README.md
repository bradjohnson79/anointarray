# ANOINT Array Integration Testing Suite

## Overview

This comprehensive integration testing suite validates all system interactions, data flows, and third-party service integrations for the ANOINT Array platform. The test framework covers end-to-end user journeys, API integrations, payment processing, performance metrics, and cross-browser compatibility.

## Test Structure

### 🧪 Test Categories

1. **API Integration Tests** (`api-integration-tests.js`)
   - AI service integration (Claude, OpenAI)
   - Payment gateway APIs (Stripe, PayPal, Crypto)
   - Webhook processing
   - FourthWall merchandise API
   - Admin and health check endpoints

2. **End-to-End Browser Tests** (`playwright-integration-tests.js`)
   - Complete user journeys
   - Authentication flows
   - Canvas rendering and interactions
   - Payment processing UI
   - Cross-browser compatibility

3. **Performance Integration Tests** (`performance-integration-tests.js`)
   - Page load performance
   - AI generation performance
   - Memory usage and leak detection
   - Load testing with concurrent users
   - Canvas rendering optimization

## 🚀 Quick Start

### Prerequisites

```bash
# Ensure Node.js 18+ is installed
node --version  # Should be >= 18.0.0

# Ensure the main application is running
npm run dev  # In the main project directory (port 3001)
```

### Installation

```bash
# Navigate to tests directory
cd tests/integration

# Install test dependencies
npm install

# Install Playwright browsers (if running E2E tests)
npx playwright install
```

### Running Tests

#### All Tests (Recommended for CI/CD)
```bash
npm test
```

#### Individual Test Suites
```bash
# API Integration Tests (fastest)
npm run test:api

# End-to-End Browser Tests  
npm run test:e2e

# Performance Tests (slowest)
npm run test:performance
```

#### Filtered Test Runs
```bash
# Smoke tests only (critical path validation)
npm run test:smoke

# Critical functionality tests
npm run test:critical

# Cross-browser compatibility tests
npm run test:cross-browser

# Load testing
npm run test:load
```

#### Development Testing
```bash
# Watch mode for development
npm run test:dev

# Specific test patterns
npm test -- --testNamePattern="authentication"
npm test -- --testNamePattern="payment"
npm test -- --testNamePattern="AI generation"
```

## 📋 Test Execution Order

Tests run in optimized sequence for reliability and performance:

1. **API Tests** → Validate service health and core functionality
2. **E2E Tests** → Test complete user workflows
3. **Performance Tests** → Resource-intensive performance validation

## 🔧 Configuration

### Environment Variables

Create a `.env.test` file in the test directory:

```bash
# Application URL
NEXT_PUBLIC_URL=http://localhost:3001

# Test configuration  
TEST_TIMEOUT=120000
TEST_RETRIES=3
TEST_HEADLESS=true

# Browser configuration
BROWSER_COUNT=3
CONCURRENT_USERS=5

# Performance thresholds
MAX_PAGE_LOAD_TIME=3000
MAX_AI_GENERATION_TIME=45000
MAX_MEMORY_USAGE=104857600
```

### Jest Configuration

The test suite uses custom Jest configuration:

- **Test Environment**: Node.js for API tests, Puppeteer for browser tests
- **Timeout**: 120 seconds default (configurable per test)
- **Sequencer**: Custom test ordering for optimal execution
- **Coverage**: Disabled by default (enable with `--coverage`)
- **Workers**: Single worker (`maxWorkers: 1`) for stability

## 🎯 Test Scenarios

### Authentication Integration
- ✅ Member login/logout flow
- ✅ Admin access verification  
- ✅ Protected route access control
- ✅ Session persistence and recovery
- ✅ Role-based permission validation

### AI Service Integration
- ✅ Claude 3.5 Sonnet generation workflow
- ✅ API response validation and parsing
- ✅ Error handling and retry mechanisms
- ✅ Token usage and cost tracking
- ✅ Concurrent generation handling

### Payment Processing
- ✅ Stripe checkout session creation
- ✅ Payment amount validation ($17 USD)
- ✅ PayPal integration flow
- ✅ Cryptocurrency payment processing
- ✅ Webhook event processing
- ✅ Payment status synchronization

### Canvas and Image Generation
- ✅ Seal array rendering performance
- ✅ Asset loading and caching
- ✅ Zoom and interaction controls
- ✅ Image download functionality
- ✅ Memory usage optimization

### Cross-Browser Compatibility
- ✅ Chrome, Firefox, Safari, Edge support
- ✅ Mobile browser testing
- ✅ Touch interaction validation
- ✅ Progressive Web App features

### Performance Validation
- ✅ Page load time monitoring
- ✅ Memory leak detection
- ✅ Network request optimization
- ✅ Concurrent user load testing
- ✅ Bundle size validation

## 📊 Performance Thresholds

| Metric | Threshold | Description |
|--------|-----------|-------------|
| Page Load Time | < 3 seconds | Initial page render |
| AI Generation | < 45 seconds | Complete seal array generation |
| Payment Processing | < 10 seconds | Payment gateway response |
| Canvas Render | < 5 seconds | Seal array canvas rendering |
| Memory Usage | < 100MB | JavaScript heap size |
| Success Rate | > 95% | Overall test pass rate |

## 🔍 Test Data

### Mock Users Available
```javascript
// Admin Users
'info@anoint.me' / 'Admin123'
'bradjohnson79@gmail.com' / 'Admin123'

// Member Users (Password: 'Customer123')
'sarah.wilson@email.com' - Gold tier customer
'michael.chen@email.com' - Business account
'emma.thompson@email.com' - Crypto preference
'james.martinez@email.com' - First-time user
'lisa.wang@email.com' - Rural delivery
'robert.johnson@businessmail.com' - Wholesale account
```

### Test Generation Data
```javascript
const testGeneration = {
  fullName: 'Integration Test User',
  birthdate: { month: 8, day: 7, year: 1990 },
  template: 'torus-field',
  category: 'Healing',
  sealType: 'Integration Test Array'
};
```

## 🚨 Troubleshooting

### Common Issues

#### Tests Failing Due to Service Unavailability
```bash
# Check if the main application is running
curl http://localhost:3001/api/health

# Restart the application
npm run dev  # In main project directory
```

#### Browser Tests Not Starting
```bash
# Install/reinstall Playwright browsers
npx playwright install --force

# Check browser dependencies
npx playwright install-deps
```

#### Memory-Related Failures
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max_old_space_size=4096"

# Run tests with reduced concurrency
npm test -- --maxWorkers=1
```

#### API Integration Failures
```bash
# Check environment variables
env | grep -E "(ANTHROPIC|STRIPE|SUPABASE)"

# Verify API keys are valid
npm run test:api -- --testNamePattern="health"
```

### Performance Issues

#### Slow Test Execution
- Run individual test suites instead of full suite
- Use `--testNamePattern` to run specific tests
- Increase test timeouts if needed
- Reduce concurrent user counts for load tests

#### Memory Leaks
- Check browser processes aren't accumulating
- Verify proper cleanup in test teardown
- Monitor system memory during test execution

## 📈 Monitoring and Reporting

### Test Reports

Tests generate detailed reports including:
- Performance metrics for each test
- Memory usage snapshots
- Network request analysis
- Cross-browser compatibility results
- Load testing statistics

### Continuous Integration

For CI/CD integration:

```yaml
# GitHub Actions example
- name: Run Integration Tests
  run: |
    cd tests/integration
    npm install
    npm run test:ci
  env:
    ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
    STRIPE_SECRET_KEY: ${{ secrets.STRIPE_SECRET_KEY }}
```

### Monitoring Dashboards

The test suite can integrate with monitoring tools:
- **Datadog**: Performance metrics tracking
- **New Relic**: Application performance monitoring  
- **Lighthouse CI**: Automated performance auditing
- **Percy/Chromatic**: Visual regression testing

## 🔄 Maintenance

### Regular Tasks

#### Weekly
- Review test execution times and optimize slow tests
- Update test data and mock responses
- Check for new browser version compatibility

#### Monthly  
- Update test dependencies and Playwright browsers
- Review performance thresholds and adjust if needed
- Analyze test failure patterns and improve reliability

#### Quarterly
- Comprehensive test suite audit
- Performance benchmark updates
- Integration with new third-party services

### Adding New Tests

1. **Identify Integration Point**: Determine what system interaction needs testing
2. **Choose Test Category**: API, E2E, or Performance
3. **Write Test**: Follow existing patterns and use test utilities
4. **Validate**: Ensure test is reliable and provides value
5. **Document**: Update this README with new test scenarios

### Test Quality Guidelines

- **Reliability**: Tests should pass consistently (>95% success rate)
- **Performance**: Individual tests should complete within reasonable time
- **Isolation**: Tests should not depend on each other
- **Cleanup**: Proper teardown to prevent state pollution
- **Documentation**: Clear test descriptions and assertions

## 🤝 Contributing

When contributing to the integration test suite:

1. Follow the existing test patterns and utilities
2. Add appropriate error handling and timeouts
3. Include performance assertions where relevant
4. Update documentation for new test scenarios
5. Ensure tests work in CI/CD environment

## 📞 Support

For issues with the integration test suite:

1. Check this README and troubleshooting section
2. Review test logs for specific error messages
3. Validate environment setup and dependencies
4. Contact the development team for integration issues

---

**Last Updated**: August 2025  
**Test Suite Version**: 1.0.0  
**Platform**: ANOINT Array Integration Testing Framework