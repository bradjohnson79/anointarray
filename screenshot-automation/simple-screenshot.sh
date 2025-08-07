#!/bin/bash

# Simple Screenshot Script for Claude Code
# This is a basic version that works without complex AppleScript

echo "📸 Taking screenshot for Claude Code..."

# Get screenshot type (default: area)
SCREENSHOT_TYPE=${1:-area}
TEMPLATE_TYPE=${2:-quick}

echo "🎯 Screenshot type: $SCREENSHOT_TYPE"
echo "📋 Template type: $TEMPLATE_TYPE"

# Take screenshot to clipboard based on type
case $SCREENSHOT_TYPE in
    "area")
        echo "✂️  Select area for screenshot..."
        screencapture -i -c
        ;;
    "window")
        echo "🪟 Select window for screenshot..."
        screencapture -i -w -c
        ;;
    "full")
        echo "🖥️  Taking full screen screenshot..."
        screencapture -c
        ;;
    *)
        echo "❌ Unknown screenshot type: $SCREENSHOT_TYPE"
        echo "Usage: $0 [area|window|full] [quick|ui|debug|design]"
        exit 1
        ;;
esac

# Check if screenshot was taken
sleep 0.5
if ! pbpaste | file - | grep -q image; then
    echo "❌ No screenshot found in clipboard"
    echo "💡 Try taking the screenshot manually with Cmd+Shift+4"
    exit 1
fi

echo "✅ Screenshot captured and copied to clipboard"

# Show template instructions
echo ""
echo "📋 Next steps:"
echo "1. Switch to Claude Code terminal"
echo "2. Paste screenshot with: Ctrl+V (NOT Cmd+V!)"
echo "3. Use template command:"

case $TEMPLATE_TYPE in
    "ui")
        echo "   /screenshot-ui-feedback"
        ;;
    "debug")
        echo "   /screenshot-debug"
        ;;
    "design")
        echo "   /screenshot-design"
        ;;
    *)
        echo "   /screenshot-quick"
        ;;
esac

echo ""
echo "🎉 Ready for Claude Code analysis!"

# Optional: Try to bring Terminal to front if it's running
if pgrep -f "Terminal" > /dev/null; then
    osascript -e 'tell application "Terminal" to activate' 2>/dev/null || true
fi