#!/bin/bash

# Stop All MCP Servers
echo "🛑 Stopping all MCP servers..."

for pidfile in mcp/logs/*.pid; do
    if [ -f "$pidfile" ]; then
        server=$(basename "$pidfile" .pid)
        pid=$(cat "$pidfile")
        
        if kill -0 "$pid" 2>/dev/null; then
            kill "$pid"
            echo "✅ Stopped $server server (PID: $pid)"
        else
            echo "⚠️  $server server was not running"
        fi
        
        rm -f "$pidfile"
    fi
done

echo "🎉 All MCP servers stopped!"
