#!/bin/bash

# restore-configs.sh
# Restores MCP server configurations from backup or directory

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLAUDE_SETTINGS="/Users/bradjohnson/.config/claude/mcp/settings.json"

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup-directory>"
    echo ""
    echo "Examples:"
    echo "  $0 ../backups/20250811_143025"
    echo "  $0 ../active"
    exit 1
fi

RESTORE_DIR="$1"

# Check if restore directory exists
if [ ! -d "$RESTORE_DIR" ]; then
    echo "❌ Error: Restore directory not found: $RESTORE_DIR"
    exit 1
fi

echo "🔄 Restoring MCP server configurations..."
echo "📂 Source directory: $RESTORE_DIR"

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo "❌ Error: jq is required but not installed."
    echo "   Install with: brew install jq"
    exit 1
fi

# Create backup of current settings
if [ -f "$CLAUDE_SETTINGS" ]; then
    cp "$CLAUDE_SETTINGS" "${CLAUDE_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📋 Current settings backed up"
fi

# Check if there's a complete settings.json file
if [ -f "$RESTORE_DIR/settings.json" ]; then
    echo "🔧 Found complete settings.json - using full restore"
    cp "$RESTORE_DIR/settings.json" "$CLAUDE_SETTINGS"
    echo "✅ Full configuration restored"
else
    # Build settings from individual JSON files
    echo "🔧 Building configuration from individual server files"
    
    # Initialize settings structure
    echo '{"mcpServers":{}}' > "$CLAUDE_SETTINGS"
    
    # Process each JSON file in the directory
    for config_file in "$RESTORE_DIR"/*.json; do
        if [ -f "$config_file" ]; then
            server_name=$(basename "$config_file" .json)
            echo "  📋 Processing $server_name..."
            
            # Extract Claude-compatible configuration
            server_config=$(jq '{
                command: .command,
                args: .args,
                env: .env
            }' "$config_file")
            
            # Add to settings
            jq --arg name "$server_name" --argjson config "$server_config" '
            .mcpServers[$name] = $config
            ' "$CLAUDE_SETTINGS" > "${CLAUDE_SETTINGS}.tmp" && mv "${CLAUDE_SETTINGS}.tmp" "$CLAUDE_SETTINGS"
            
            echo "  ✅ Added $server_name"
        fi
    done
fi

# Validate the restored configuration
if jq empty "$CLAUDE_SETTINGS" 2>/dev/null; then
    echo "✅ Configuration validation passed"
    
    # Show summary
    server_count=$(jq '.mcpServers | length' "$CLAUDE_SETTINGS")
    server_names=$(jq -r '.mcpServers | keys | join(", ")' "$CLAUDE_SETTINGS")
    
    echo ""
    echo "📊 Restoration Summary:"
    echo "   Servers restored: $server_count"
    echo "   Server names: $server_names"
else
    echo "❌ Error: Invalid JSON in restored configuration"
    echo "   Restoring from backup..."
    cp "${CLAUDE_SETTINGS}.backup.$(date +%Y%m%d_%H%M%S | head -1)" "$CLAUDE_SETTINGS"
    exit 1
fi

echo ""
echo "🎉 Configuration restoration completed successfully!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load the restored servers"
echo "2. Verify all servers are working correctly"
echo "3. Check server status: ./check-server-status.sh"