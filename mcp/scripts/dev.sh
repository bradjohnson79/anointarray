#!/bin/bash

# MCP Development Script - Start servers in development mode
# This script starts MCP servers with hot reload for development

set -e

echo "🔧 Starting MCP Servers in Development Mode"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[DEV]${NC} $1"
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

# Function to start a server in development mode
start_dev_server() {
    local server=$1
    local port=$2
    
    if [ -f "mcp/servers/$server/package.json" ]; then
        print_status "Starting $server server in dev mode on port $port..."
        
        # Create logs directory if it doesn't exist
        mkdir -p mcp/logs
        
        cd "mcp/servers/$server"
        
        # Start in development mode with nodemon for hot reload
        nohup npm run dev > "../../logs/$server-dev.log" 2>&1 &
        echo $! > "../../logs/$server-dev.pid"
        
        cd - > /dev/null
        
        print_success "$server dev server started (PID: $(cat mcp/logs/$server-dev.pid))"
        
        # Wait a moment and check if the process is still running
        sleep 2
        if kill -0 "$(cat mcp/logs/$server-dev.pid)" 2>/dev/null; then
            print_success "$server is running successfully"
        else
            print_error "$server failed to start, check logs: mcp/logs/$server-dev.log"
            return 1
        fi
    else
        print_warning "$server server package.json not found, skipping..."
        return 1
    fi
}

# Check if any dev servers are already running
if ls mcp/logs/*-dev.pid 1> /dev/null 2>&1; then
    print_warning "Development servers appear to be running. Stop them first with:"
    echo "  ./mcp/scripts/stop-dev.sh"
    echo
    read -p "Do you want to stop existing dev servers and restart? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status "Stopping existing development servers..."
        ./mcp/scripts/stop-dev.sh
        sleep 2
    else
        print_status "Exiting without changes."
        exit 0
    fi
fi

# Check if environment is configured
if [ ! -f ".env.mcp.local" ]; then
    print_warning "No .env.mcp.local found. Creating from template..."
    cp .env.mcp .env.mcp.local
    print_error "Please configure your environment variables in .env.mcp.local before starting development servers!"
    exit 1
fi

print_status "Loading environment configuration..."

# Start development servers
print_status "Starting MCP servers in development mode with hot reload..."

# Start servers one by one with error handling
servers_started=0
total_servers=0

for server_config in "supabase:3001" "serena:3002" "vercel:3003" "github:3004"; do
    server=$(echo "$server_config" | cut -d':' -f1)
    port=$(echo "$server_config" | cut -d':' -f2)
    
    total_servers=$((total_servers + 1))
    
    if start_dev_server "$server" "$port"; then
        servers_started=$((servers_started + 1))
    fi
    
    # Add a small delay between starting servers
    sleep 1
done

echo
print_status "Development server startup summary:"
print_success "$servers_started out of $total_servers servers started successfully"

if [ $servers_started -eq $total_servers ]; then
    echo
    print_success "🎉 All MCP development servers are running!"
    echo
    echo "📋 Development Commands:"
    echo "  ./mcp/scripts/status-dev.sh     - Check development server status"
    echo "  ./mcp/scripts/stop-dev.sh       - Stop development servers"
    echo "  ./mcp/scripts/logs-dev.sh       - View development logs"
    echo "  ./mcp/scripts/restart-dev.sh    - Restart a specific server"
    echo
    echo "📁 Log files are available in:"
    echo "  mcp/logs/*-dev.log"
    echo
    echo "🔍 To monitor logs in real-time:"
    echo "  tail -f mcp/logs/*-dev.log"
    echo
    print_status "Development servers will automatically reload on file changes"
else
    echo
    print_warning "⚠️  Some servers failed to start. Check the logs for details."
    echo
    echo "📋 Troubleshooting:"
    echo "  1. Check log files in mcp/logs/*-dev.log"
    echo "  2. Verify your .env.mcp.local configuration"
    echo "  3. Ensure all dependencies are installed"
    echo "  4. Check that ports are not in use"
fi

# Display server status
echo
./mcp/scripts/status-dev.sh