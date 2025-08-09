#!/bin/bash

# MCP Health Check Script
echo "🏥 MCP Health Check"
echo "==================="

servers=("supabase:3001" "serena:3002" "vercel:3003" "github:3004" "stripe:3005" "redis:3006" "cloudflare:3007" "monitoring:3008")

for server_port in "${servers[@]}"; do
    server=$(echo "$server_port" | cut -d':' -f1)
    port=$(echo "$server_port" | cut -d':' -f2)
    
    if curl -s --max-time 5 "http://localhost:$port/health" > /dev/null 2>&1; then
        echo "✅ $server ($port): Healthy"
    else
        echo "❌ $server ($port): Unhealthy or not responding"
    fi
done
