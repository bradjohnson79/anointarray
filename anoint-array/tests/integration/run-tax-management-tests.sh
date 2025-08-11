#!/bin/bash

# Tax Management E2E Test Runner Script
# This script sets up the environment and runs comprehensive Puppeteer tests

set -e

echo "🚀 Tax Management E2E Test Suite"
echo "================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_URL="http://localhost:3000/admin/products"
SCREENSHOT_DIR="./screenshots/tax-management"
REPORT_FILE="$SCREENSHOT_DIR/test-report.json"
HTML_REPORT_FILE="$SCREENSHOT_DIR/test-report.html"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ to continue."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

print_success "Node.js $(node --version) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm to continue."
    exit 1
fi

print_success "npm $(npm --version) detected"

# Create screenshots directory
mkdir -p "$SCREENSHOT_DIR"
print_status "Created screenshots directory: $SCREENSHOT_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing test dependencies..."
    npm install
    print_success "Dependencies installed"
else
    print_status "Dependencies already installed"
fi

# Check if the application server is running
print_status "Checking if application server is running at $TEST_URL..."

if curl -s --head "$TEST_URL" | head -n 1 | grep -q "200 OK"; then
    print_success "Application server is running"
elif curl -s --head "http://localhost:3000" | head -n 1 | grep -q "200 OK"; then
    print_success "Application server is running on http://localhost:3000"
    print_warning "Make sure to navigate to /admin/products for testing"
else
    print_warning "Application server might not be running"
    print_warning "Please ensure your Next.js app is running on http://localhost:3000"
    print_warning "Run: npm run dev (in your main application directory)"
    echo ""
    read -p "Press Enter to continue with testing anyway, or Ctrl+C to exit..."
fi

echo ""
print_status "Starting Tax Management E2E Tests..."
echo ""
print_status "Test Configuration:"
echo "  - Test URL: $TEST_URL"
echo "  - Screenshots: $SCREENSHOT_DIR"
echo "  - Browser: Headless Chromium"
echo "  - Viewports: Desktop (1920x1080), Tablet (768x1024), Mobile (375x812)"
echo ""

# Run the tests
START_TIME=$(date +%s)

if node tax-management-e2e-tests.js; then
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_success "Tests completed successfully in ${DURATION}s"
    
    # Generate HTML report if JSON report exists
    if [ -f "$REPORT_FILE" ]; then
        print_status "Generating HTML report..."
        node generate-html-report.js
        print_success "HTML report generated: $HTML_REPORT_FILE"
    fi
    
    # Display summary
    if [ -f "$REPORT_FILE" ]; then
        print_status "Test Results Summary:"
        echo ""
        
        # Extract key metrics from JSON report
        TOTAL_TESTS=$(cat "$REPORT_FILE" | grep -o '"totalTests":[0-9]*' | cut -d':' -f2)
        PASSED_TESTS=$(cat "$REPORT_FILE" | grep -o '"passed":[0-9]*' | cut -d':' -f2)
        FAILED_TESTS=$(cat "$REPORT_FILE" | grep -o '"failed":[0-9]*' | cut -d':' -f2)
        SUCCESS_RATE=$(cat "$REPORT_FILE" | grep -o '"successRate":"[^"]*"' | cut -d'"' -f4)
        
        echo "  📊 Total Tests: $TOTAL_TESTS"
        echo "  ✅ Passed: $PASSED_TESTS"
        echo "  ❌ Failed: $FAILED_TESTS"
        echo "  📈 Success Rate: $SUCCESS_RATE"
        
        # Count screenshots
        SCREENSHOT_COUNT=$(ls -1 "$SCREENSHOT_DIR"/*.png 2>/dev/null | wc -l | tr -d ' ')
        echo "  📷 Screenshots: $SCREENSHOT_COUNT"
        
        # Count UI/UX issues
        UI_ISSUES=$(cat "$REPORT_FILE" | grep -o '"uiUxIssues":\[.*\]' | grep -o '{"type"' | wc -l | tr -d ' ')
        echo "  🔍 UI/UX Issues: $UI_ISSUES"
        
        echo ""
        print_success "Full report available at: $REPORT_FILE"
        
        if [ -f "$HTML_REPORT_FILE" ]; then
            print_success "HTML report available at: $HTML_REPORT_FILE"
            
            # Try to open HTML report in default browser (macOS/Linux)
            if command -v open &> /dev/null; then
                print_status "Opening HTML report in browser..."
                open "$HTML_REPORT_FILE"
            elif command -v xdg-open &> /dev/null; then
                print_status "Opening HTML report in browser..."
                xdg-open "$HTML_REPORT_FILE"
            fi
        fi
        
        # Exit with appropriate code
        if [ "$FAILED_TESTS" -gt 0 ]; then
            exit 1
        else
            exit 0
        fi
    fi
    
else
    END_TIME=$(date +%s)
    DURATION=$((END_TIME - START_TIME))
    
    print_error "Tests failed after ${DURATION}s"
    
    # Still try to generate report if JSON exists
    if [ -f "$REPORT_FILE" ]; then
        print_status "Generating report from partial results..."
        node generate-html-report.js 2>/dev/null || true
    fi
    
    exit 1
fi