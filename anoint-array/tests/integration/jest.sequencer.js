// Custom Jest test sequencer for integration tests
// Ensures tests run in optimal order for reliability and performance

class IntegrationTestSequencer {
  /**
   * Sort test files in optimal execution order
   * 1. API tests first (fastest, establish service health)
   * 2. E2E tests (moderate speed, test user flows)  
   * 3. Performance tests last (slowest, most resource intensive)
   */
  sort(tests) {
    const testOrder = [
      // Phase 1: API Integration Tests (fastest)
      'api-integration-tests.js',
      
      // Phase 2: End-to-End Browser Tests (moderate)
      'playwright-integration-tests.js',
      
      // Phase 3: Performance Tests (slowest, most resource intensive)
      'performance-integration-tests.js'
    ];

    // Sort tests based on defined order
    const sortedTests = [];
    
    // Add tests in priority order
    testOrder.forEach(filename => {
      const matchingTests = tests.filter(test => 
        test.path.includes(filename)
      );
      sortedTests.push(...matchingTests);
    });
    
    // Add any remaining tests that weren't explicitly ordered
    const remainingTests = tests.filter(test => 
      !testOrder.some(filename => test.path.includes(filename))
    );
    sortedTests.push(...remainingTests);
    
    console.log('🔀 Test Execution Order:');
    sortedTests.forEach((test, index) => {
      const filename = test.path.split('/').pop();
      console.log(`   ${index + 1}. ${filename}`);
    });
    
    return sortedTests;
  }
}

module.exports = IntegrationTestSequencer;