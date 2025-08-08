#!/bin/bash

# MCP Server Installation Script for ANOINT Array
# This script installs and configures all MCP servers

set -e

echo "🚀 Installing MCP Servers for ANOINT Array"
echo "==========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
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

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ and try again."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'.' -f1 | sed 's/v//')
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

print_success "Node.js $(node -v) detected"

# Create MCP directories if they don't exist
print_status "Creating MCP directory structure..."
mkdir -p mcp/servers/{supabase,serena,vercel,github,stripe,redis,cloudflare,monitoring}
mkdir -p mcp/config
mkdir -p mcp/logs
mkdir -p mcp/scripts
mkdir -p mcp/types

print_success "Directory structure created"

# Install dependencies for each MCP server
servers=("supabase" "serena" "vercel" "github" "stripe" "redis" "cloudflare" "monitoring")

for server in "${servers[@]}"; do
    server_dir="mcp/servers/$server"
    
    if [ -d "$server_dir" ] && [ -f "$server_dir/package.json" ]; then
        print_status "Installing dependencies for $server server..."
        cd "$server_dir"
        
        if npm install --silent; then
            print_success "$server server dependencies installed"
        else
            print_warning "Failed to install dependencies for $server server"
        fi
        
        cd - > /dev/null
    else
        print_warning "$server server directory or package.json not found, skipping..."
    fi
done

# Create environment file if it doesn't exist
if [ ! -f ".env.mcp.local" ]; then
    print_status "Creating .env.mcp.local from template..."
    cp .env.mcp .env.mcp.local
    print_warning "Please configure your environment variables in .env.mcp.local"
else
    print_status ".env.mcp.local already exists"
fi

# Make scripts executable
print_status "Setting script permissions..."
chmod +x mcp/scripts/*.sh

# Install global dependencies
print_status "Installing global MCP dependencies..."
if npm install --silent; then
    print_success "Global dependencies installed"
else
    print_error "Failed to install global dependencies"
    exit 1
fi

# Create startup script
print_status "Creating MCP startup script..."
cat > mcp/scripts/start-all.sh << 'EOF'
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
EOF

chmod +x mcp/scripts/start-all.sh

# Create stop script
cat > mcp/scripts/stop-all.sh << 'EOF'
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
EOF

chmod +x mcp/scripts/stop-all.sh

# Create status script
cat > mcp/scripts/status.sh << 'EOF'
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
EOF

chmod +x mcp/scripts/status.sh

# Add npm scripts to package.json
print_status "Adding MCP scripts to package.json..."

# Check if scripts section exists and add MCP commands
if command -v jq &> /dev/null; then
    # Use jq if available
    jq '.scripts["mcp:install"] = "./mcp/scripts/install.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["mcp:start"] = "./mcp/scripts/start-all.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["mcp:stop"] = "./mcp/scripts/stop-all.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["mcp:status"] = "./mcp/scripts/status.sh"' package.json > package.json.tmp && mv package.json.tmp package.json
    jq '.scripts["mcp:logs"] = "tail -f mcp/logs/*.log"' package.json > package.json.tmp && mv package.json.tmp package.json
    print_success "MCP scripts added to package.json"
else
    print_warning "jq not found, manually add MCP scripts to package.json:"
    echo '  "mcp:install": "./mcp/scripts/install.sh",'
    echo '  "mcp:start": "./mcp/scripts/start-all.sh",'
    echo '  "mcp:stop": "./mcp/scripts/stop-all.sh",'
    echo '  "mcp:status": "./mcp/scripts/status.sh",'
    echo '  "mcp:logs": "tail -f mcp/logs/*.log"'
fi

# Create health check script
cat > mcp/scripts/health-check.sh << 'EOF'
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
EOF

chmod +x mcp/scripts/health-check.sh

print_success "Installation completed successfully! 🎉"
echo
echo "Next steps:"
echo "1. Configure your environment variables in .env.mcp.local"
echo "2. Start MCP servers with: npm run mcp:start"
echo "3. Check server status with: npm run mcp:status"
echo "4. View logs with: npm run mcp:logs"
echo
print_status "Available commands:"
echo "  npm run mcp:start   - Start all MCP servers"
echo "  npm run mcp:stop    - Stop all MCP servers"
echo "  npm run mcp:status  - Check server status"
echo "  npm run mcp:logs    - View server logs"
echo "  ./mcp/scripts/health-check.sh - Health check"
echo
print_warning "Remember to configure your API keys and tokens in .env.mcp.local before starting!"