#!/bin/bash

# backup-configs.sh
# Exports current Claude MCP server settings to individual JSON files

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTIVE_DIR="$SCRIPT_DIR/../active"
CLAUDE_SETTINGS="/Users/bradjohnson/.config/claude/mcp/settings.json"

echo "🔄 Backing up MCP server configurations..."

# Check if Claude settings file exists
if [ ! -f "$CLAUDE_SETTINGS" ]; then
    echo "❌ Error: Claude settings file not found at $CLAUDE_SETTINGS"
    exit 1
fi

# Create backup directory with timestamp
BACKUP_DIR="$SCRIPT_DIR/../backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Copy full settings file as backup
cp "$CLAUDE_SETTINGS" "$BACKUP_DIR/settings.json"
echo "📁 Full settings backed up to: $BACKUP_DIR/settings.json"

# Extract individual server configurations
echo "🔍 Extracting individual server configurations..."

# Use jq to extract each server configuration
if command -v jq >/dev/null 2>&1; then
    # Get list of server names
    servers=$(jq -r '.mcpServers | keys[]' "$CLAUDE_SETTINGS")
    
    for server in $servers; do
        echo "  📋 Extracting $server configuration..."
        jq ".mcpServers.\"$server\"" "$CLAUDE_SETTINGS" > "$BACKUP_DIR/${server}.json"
        echo "  ✅ Saved to: $BACKUP_DIR/${server}.json"
    done
else
    echo "⚠️  Warning: jq not installed. Individual server extraction skipped."
    echo "   Install jq with: brew install jq"
fi

echo "✅ Backup completed successfully!"
echo "📂 Backup location: $BACKUP_DIR"
echo ""
echo "To restore configurations:"
echo "  ./restore-configs.sh $BACKUP_DIR"