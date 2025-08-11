#!/bin/bash

# list-servers.sh
# Lists all available MCP servers with their status and information

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTIVE_DIR="$SCRIPT_DIR/../active"
RECOMMENDED_DIR="$SCRIPT_DIR/../recommended"
CLAUDE_SETTINGS="/Users/bradjohnson/.config/claude/mcp/settings.json"

echo "🔍 MCP Server Inventory"
echo "======================="
echo ""

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo "❌ Error: jq is required but not installed."
    echo "   Install with: brew install jq"
    exit 1
fi

# Function to display server info
display_server_info() {
    local config_file="$1"
    local status_icon="$2"
    
    if [ -f "$config_file" ]; then
        local name=$(jq -r '.name' "$config_file")
        local description=$(jq -r '.description' "$config_file")
        local category=$(jq -r '.category // "uncategorized"' "$config_file")
        local priority=$(jq -r '.priority // "unknown"' "$config_file")
        
        echo "$status_icon $name"
        echo "   📝 $description"
        echo "   🏷️  Category: $category | Priority: $priority"
        echo ""
    fi
}

# List active servers
echo "🟢 ACTIVE SERVERS"
echo "----------------"

if [ -d "$ACTIVE_DIR" ]; then
    active_count=0
    for config_file in "$ACTIVE_DIR"/*.json; do
        if [ -f "$config_file" ]; then
            display_server_info "$config_file" "🟢"
            ((active_count++))
        fi
    done
    
    if [ $active_count -eq 0 ]; then
        echo "   No active servers found"
        echo ""
    fi
else
    echo "   Active directory not found"
    echo ""
fi

# List recommended servers
echo "🔵 RECOMMENDED SERVERS"
echo "---------------------"

if [ -d "$RECOMMENDED_DIR" ]; then
    recommended_count=0
    for config_file in "$RECOMMENDED_DIR"/*.json; do
        if [ -f "$config_file" ]; then
            display_server_info "$config_file" "🔵"
            ((recommended_count++))
        fi
    done
    
    if [ $recommended_count -eq 0 ]; then
        echo "   No recommended servers found"
        echo ""
    fi
else
    echo "   Recommended directory not found"
    echo ""
fi

# Show Claude settings status
echo "⚙️  CLAUDE SETTINGS STATUS"
echo "-------------------------"

if [ -f "$CLAUDE_SETTINGS" ]; then
    claude_servers=$(jq -r '.mcpServers | keys[]' "$CLAUDE_SETTINGS" 2>/dev/null | wc -l | tr -d ' ')
    claude_server_names=$(jq -r '.mcpServers | keys | join(", ")' "$CLAUDE_SETTINGS" 2>/dev/null)
    
    echo "   📊 Servers in Claude: $claude_servers"
    echo "   📋 Server names: $claude_server_names"
else
    echo "   ❌ Claude settings file not found"
fi

echo ""
echo "💡 USAGE TIPS"
echo "-------------"
echo "   Install server:     ./install-server.sh ../recommended/<server>.json"
echo "   Backup configs:     ./backup-configs.sh"
echo "   Restore configs:    ./restore-configs.sh <backup-dir>"
echo "   Server details:     cat ../active/<server>.json | jq"