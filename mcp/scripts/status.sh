#!/bin/bash

# Check MCP Server Status
echo "📊 MCP Server Status"
echo "==================="

for pidfile in mcp/logs/*.pid; do
    if [ -f "$pidfile" ]; then
        server=$(basename "$pidfile" .pid)
        pid=$(cat "$pidfile")
        
        if kill -0 "$pid" 2>/dev/null; then
            echo "✅ $server: Running (PID: $pid)"
        else
            echo "❌ $server: Stopped"
            rm -f "$pidfile"
        fi
    else
        server=$(basename "$pidfile" .pid)
        echo "❌ $server: Not started"
    fi
done
