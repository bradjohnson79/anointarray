#!/bin/bash

# install-server.sh
# Installs a new MCP server from JSON configuration

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_SETTINGS="/Users/bradjohnson/.config/claude/mcp/settings.json"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <server-config.json>"
    echo ""
    echo "Examples:"
    echo "  $0 ../recommended/context7.json"
    echo "  $0 ../active/serena.json"
    exit 1
fi

SERVER_CONFIG="$1"

# Check if config file exists
if [ ! -f "$SERVER_CONFIG" ]; then
    echo "❌ Error: Server configuration file not found: $SERVER_CONFIG"
    exit 1
fi

echo "🚀 Installing MCP server from configuration..."
echo "📁 Config file: $SERVER_CONFIG"

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo "❌ Error: jq is required but not installed."
    echo "   Install with: brew install jq"
    exit 1
fi

# Extract server details from config
SERVER_NAME=$(jq -r '.name' "$SERVER_CONFIG")
SERVER_DESCRIPTION=$(jq -r '.description' "$SERVER_CONFIG")
INSTALLATION_COMMAND=$(jq -r '.installation_command // empty' "$SERVER_CONFIG")
DEPENDENCIES=$(jq -r '.dependencies[]?' "$SERVER_CONFIG")

echo "📋 Server: $SERVER_NAME"
echo "📝 Description: $SERVER_DESCRIPTION"

# Install dependencies if installation command is provided
if [ -n "$INSTALLATION_COMMAND" ] && [ "$INSTALLATION_COMMAND" != "null" ]; then
    echo "🔧 Installing server dependencies..."
    echo "   Command: $INSTALLATION_COMMAND"
    read -p "Proceed with installation? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        eval "$INSTALLATION_COMMAND"
        echo "✅ Dependencies installed successfully"
    else
        echo "⏭️  Skipping dependency installation"
    fi
fi

# Add server to Claude settings
echo "🔧 Adding server to Claude settings..."

# Create backup of current settings
cp "$CLAUDE_SETTINGS" "${CLAUDE_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"

# Extract server configuration (remove our custom fields)
SERVER_CONFIG_FOR_CLAUDE=$(jq '{
    command: .command,
    args: .args,
    env: .env
}' "$SERVER_CONFIG")

# Add to Claude settings
jq --arg name "$SERVER_NAME" --argjson config "$SERVER_CONFIG_FOR_CLAUDE" '
.mcpServers[$name] = $config
' "$CLAUDE_SETTINGS" > "${CLAUDE_SETTINGS}.tmp" && mv "${CLAUDE_SETTINGS}.tmp" "$CLAUDE_SETTINGS"

echo "✅ Server '$SERVER_NAME' added to Claude settings"

# Move config to active directory if it was from recommended
if [[ "$SERVER_CONFIG" == *"/recommended/"* ]]; then
    ACTIVE_CONFIG="$SCRIPT_DIR/../active/$(basename "$SERVER_CONFIG")"
    cp "$SERVER_CONFIG" "$ACTIVE_CONFIG"
    # Update status to active
    jq '.status = "active"' "$ACTIVE_CONFIG" > "${ACTIVE_CONFIG}.tmp" && mv "${ACTIVE_CONFIG}.tmp" "$ACTIVE_CONFIG"
    echo "📁 Configuration moved to active directory"
fi

echo ""
echo "🎉 Installation completed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load the new server"
echo "2. Test the server functionality"
echo "3. Check server logs if needed: ./check-server-logs.sh $SERVER_NAME"