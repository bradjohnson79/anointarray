#!/bin/bash

# Start All MCP Servers
echo "🚀 Starting all MCP servers..."

# Function to start a server
start_server() {
    local server=$1
    local port=$2
    
    if [ -f "mcp/servers/$server/index.ts" ]; then
        echo "Starting $server server on port $port..."
        cd "mcp/servers/$server"
        nohup npm start > "../../logs/$server.log" 2>&1 &
        echo $! > "../../logs/$server.pid"
        cd - > /dev/null
        echo "✅ $server server started (PID: $(cat mcp/logs/$server.pid))"
    else
        echo "❌ $server server not found"
    fi
}

# Start all servers
start_server "supabase" 3001
start_server "serena" 3002
start_server "vercel" 3003
start_server "github" 3004
start_server "stripe" 3005
start_server "redis" 3006
start_server "cloudflare" 3007
start_server "monitoring" 3008

echo "🎉 All MCP servers started!"
echo "📋 Check logs in mcp/logs/ directory"
echo "🔍 Use 'npm run mcp:status' to check server status"
