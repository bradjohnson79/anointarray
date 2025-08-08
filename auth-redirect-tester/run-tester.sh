#!/bin/bash

# ANOINT Array Auth Redirect Tester - Launcher Script
# This script makes it easy to start the auth tester in different modes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if dependencies are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js first."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm first."
        exit 1
    fi
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Are you in the right directory?"
        exit 1
    fi
    
    if [ ! -d "node_modules" ]; then
        print_warning "Dependencies not installed. Installing now..."
        npm install
        npx playwright install
    fi
    
    print_success "Dependencies verified"
}

# Function to show usage
show_usage() {
    echo "ANOINT Array Auth Redirect Tester"
    echo "================================="
    echo
    echo "Usage: $0 [OPTION]"
    echo
    echo "Options:"
    echo "  single       Run a single test and exit"
    echo "  continuous   Run tests continuously (every 2 minutes)"
    echo "  debug        Run a single test with visible browser"
    echo "  setup        Install dependencies and setup the tester"
    echo "  status       Check if the continuous tester is running"
    echo "  stop         Stop any running continuous tests"
    echo "  logs         View recent test logs"
    echo "  help         Show this help message"
    echo
    echo "Examples:"
    echo "  $0 single              # Run one test"
    echo "  $0 continuous          # Start continuous monitoring"
    echo "  $0 debug               # Debug with visible browser"
    echo
}

# Function to run setup
run_setup() {
    print_status "Setting up ANOINT Array Auth Redirect Tester..."
    
    if [ ! -f ".env" ]; then
        print_status "Creating .env file..."
        cat > .env << EOF
# ANOINT Array Auth Redirect Tester Configuration
BASE_URL=https://anointarray.com
TEST_EMAIL=info@anoint.me
TEST_PASSWORD=AdminPassword123
TEST_INTERVAL=120000
TEST_TIMEOUT=30000
HEADLESS=true
MAX_RETRIES=3
LOG_LEVEL=info
ENABLE_SCREENSHOTS=true
EOF
        print_success ".env file created"
    fi
    
    print_status "Installing npm dependencies..."
    npm install
    
    print_status "Installing Playwright browsers..."
    npx playwright install
    
    print_success "Setup complete! You can now run tests."
    echo
    echo "Quick start:"
    echo "  $0 single      # Run a single test"
    echo "  $0 continuous  # Start continuous monitoring"
}

# Function to check status
check_status() {
    print_status "Checking for running auth tester processes..."
    
    if pgrep -f "auth-tester.js.*continuous" > /dev/null; then
        print_success "Continuous auth tester is running"
        echo
        print_status "Process details:"
        ps aux | grep "auth-tester.js.*continuous" | grep -v grep
        echo
        print_status "Recent log entries:"
        if [ -f "auth-test.log" ]; then
            tail -5 auth-test.log
        else
            print_warning "No log file found"
        fi
    else
        print_warning "No continuous auth tester processes found"
    fi
}

# Function to stop continuous testing
stop_testing() {
    print_status "Stopping continuous auth tester..."
    
    if pgrep -f "auth-tester.js.*continuous" > /dev/null; then
        pkill -f "auth-tester.js.*continuous"
        sleep 2
        
        if ! pgrep -f "auth-tester.js.*continuous" > /dev/null; then
            print_success "Continuous auth tester stopped"
        else
            print_error "Failed to stop auth tester. You may need to kill it manually."
            echo "Try: pkill -9 -f auth-tester.js"
        fi
    else
        print_warning "No continuous auth tester processes found"
    fi
}

# Function to view logs
view_logs() {
    print_status "Viewing recent test logs..."
    
    if [ -f "auth-test.log" ]; then
        echo
        echo "=== Last 20 log entries ==="
        tail -20 auth-test.log
        echo "=========================="
        echo
        print_status "Log file: $(pwd)/auth-test.log"
        
        if [ -f "test-report.json" ]; then
            print_status "Detailed reports: $(pwd)/test-report.json"
        fi
        
        if [ -f "stats.json" ]; then
            print_status "Statistics: $(pwd)/stats.json"
        fi
    else
        print_warning "No log file found. Run a test first."
    fi
}

# Main script logic
case "${1:-help}" in
    single)
        check_dependencies
        print_status "Running single authentication test..."
        node auth-tester.js --single
        ;;
    
    continuous)
        check_dependencies
        print_status "Starting continuous authentication testing..."
        print_status "Press Ctrl+C to stop"
        node auth-tester.js --continuous
        ;;
    
    debug)
        check_dependencies
        print_status "Running single test with visible browser (debug mode)..."
        node auth-tester.js --single --headed
        ;;
    
    setup)
        run_setup
        ;;
    
    status)
        check_status
        ;;
    
    stop)
        stop_testing
        ;;
    
    logs)
        view_logs
        ;;
    
    help)
        show_usage
        ;;
    
    *)
        print_error "Unknown option: $1"
        echo
        show_usage
        exit 1
        ;;
esac