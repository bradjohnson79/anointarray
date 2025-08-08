#!/bin/bash

# Check MCP Development Server Status
echo "📊 MCP Development Server Status"
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

servers_running=0
servers_total=0

for server in "supabase" "serena" "vercel" "github"; do
    servers_total=$((servers_total + 1))
    pidfile="mcp/logs/$server-dev.pid"
    
    if [ -f "$pidfile" ]; then
        pid=$(cat "$pidfile")
        
        if kill -0 "$pid" 2>/dev/null; then
            echo -e "✅ $server: ${GREEN}Running${NC} (PID: $pid)"
            servers_running=$((servers_running + 1))
        else
            echo -e "❌ $server: ${RED}Stopped${NC}"
            rm -f "$pidfile"
        fi
    else
        echo -e "❌ $server: ${RED}Not started${NC}"
    fi
done

echo
echo -e "${BLUE}Summary:${NC} $servers_running/$servers_total development servers running"

if [ $servers_running -gt 0 ]; then
    echo
    echo "📋 Available commands:"
    echo "  ./mcp/scripts/logs-dev.sh     - View development logs"
    echo "  ./mcp/scripts/stop-dev.sh     - Stop all development servers"
    echo "  tail -f mcp/logs/*-dev.log    - Monitor logs in real-time"
fi