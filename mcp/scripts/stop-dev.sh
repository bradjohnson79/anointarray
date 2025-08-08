#!/bin/bash

# Stop MCP Development Servers
echo "🛑 Stopping MCP development servers..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

servers_stopped=0

for pidfile in mcp/logs/*-dev.pid; do
    if [ -f "$pidfile" ]; then
        server=$(basename "$pidfile" -dev.pid)
        pid=$(cat "$pidfile")
        
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            print_success "Stopped $server dev server (PID: $pid)"
            servers_stopped=$((servers_stopped + 1))
        else
            print_warning "$server dev server was not running"
        fi
        
        rm -f "$pidfile"
    fi
done

if [ $servers_stopped -eq 0 ]; then
    print_warning "No development servers were running"
else
    print_success "🎉 Stopped $servers_stopped development servers!"
fi