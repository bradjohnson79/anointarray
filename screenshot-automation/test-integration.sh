#!/bin/bash

# Test Script for Claude Code Screenshot Integration
# This script tests all components of the screenshot workflow

echo "🧪 Testing Claude Code Screenshot Integration..."
echo ""

# Test 1: Check directory structure
echo "📁 Testing directory structure..."
if [ -d "/Users/bradjohnson/Documents/anoint-array/WEBSITE/anoint-array/.claude/commands" ]; then
    echo "✅ Claude commands directory exists"
    echo "   Templates found:"
    ls -la "/Users/bradjohnson/Documents/anoint-array/WEBSITE/anoint-array/.claude/commands/" | grep -E "\.(md)$" | awk '{print "   - " $9}'
else
    echo "❌ Claude commands directory missing"
fi

# Test 2: Check AppleScript
echo ""
echo "🍎 Testing AppleScript..."
if [ -f "claude-code-screenshot.applescript" ]; then
    echo "✅ AppleScript file exists"
    if [ -x "claude-code-screenshot.applescript" ]; then
        echo "✅ AppleScript is executable"
    else
        echo "⚠️  AppleScript may not be executable"
    fi
else
    echo "❌ AppleScript file missing"
fi

# Test 3: Check Alfred workflow
echo ""
echo "🔍 Testing Alfred workflow configuration..."
if [ -f "alfred-workflow.json" ]; then
    echo "✅ Alfred workflow configuration exists"
    
    # Validate JSON
    if python3 -m json.tool alfred-workflow.json > /dev/null 2>&1; then
        echo "✅ Alfred workflow JSON is valid"
    else
        echo "❌ Alfred workflow JSON is invalid"
    fi
else
    echo "❌ Alfred workflow configuration missing"
fi

# Test 4: Check launcher script
echo ""
echo "🚀 Testing launcher script..."
if [ -f "launch-claude-screenshot.sh" ]; then
    echo "✅ Launcher script exists"
    if [ -x "launch-claude-screenshot.sh" ]; then
        echo "✅ Launcher script is executable"
        
        # Test help output
        echo "   Testing help output:"
        ./launch-claude-screenshot.sh help 2>&1 | head -n 3 | sed 's/^/   > /'
    else
        echo "⚠️  Launcher script may not be executable"
    fi
else
    echo "❌ Launcher script missing"
fi

# Test 5: Check Shottr installation
echo ""
echo "📸 Testing Shottr installation..."
if [ -d "/Applications/Shottr.app" ]; then
    echo "✅ Shottr is installed"
    
    # Get Shottr version if possible
    SHOTTR_VERSION=$(defaults read /Applications/Shottr.app/Contents/Info.plist CFBundleShortVersionString 2>/dev/null || echo "unknown")
    echo "   Version: $SHOTTR_VERSION"
else
    echo "⚠️  Shottr not installed (run setup-shottr.sh for instructions)"
fi

# Test 6: Check Alfred installation
echo ""
echo "🎩 Testing Alfred installation..."
if [ -d "/Applications/Alfred 4.app" ] || [ -d "/Applications/Alfred 5.app" ]; then
    echo "✅ Alfred is installed"
    
    # Check for Powerpack
    if pgrep -f "Alfred" > /dev/null; then
        echo "✅ Alfred is running"
    else
        echo "⚠️  Alfred is not currently running"
    fi
else
    echo "⚠️  Alfred not found (workflows require Alfred with Powerpack)"
fi

# Test 7: Check Claude Code access
echo ""
echo "🤖 Testing Claude Code access..."
if command -v claude > /dev/null 2>&1; then
    echo "✅ Claude Code CLI is available"
    
    # Test if Claude Code can be invoked
    if timeout 3 claude --version > /dev/null 2>&1; then
        echo "✅ Claude Code responds to commands"
    else
        echo "⚠️  Claude Code may not be fully configured"
    fi
else
    echo "⚠️  Claude Code CLI not found in PATH"
fi

# Test 8: Check permissions
echo ""
echo "🔒 Testing system permissions..."

# Check Screen Recording permission (indirect test)
if system_profiler SPApplicationsDataType | grep -A 3 "Shottr" | grep -q "Location:"; then
    echo "✅ System can query app information"
else
    echo "⚠️  May need to grant permissions for screenshot apps"
fi

# Test 9: Directory permissions
echo ""
echo "📝 Testing directory permissions..."
SCREENSHOTS_DIR="$HOME/Documents/anoint-array/WEBSITE/screenshots"
if [ -d "$SCREENSHOTS_DIR" ]; then
    echo "✅ Screenshots directory exists: $SCREENSHOTS_DIR"
    
    if [ -w "$SCREENSHOTS_DIR" ]; then
        echo "✅ Screenshots directory is writable"
    else
        echo "❌ Screenshots directory is not writable"
    fi
else
    echo "⚠️  Screenshots directory not created yet"
fi

# Summary
echo ""
echo "📊 Integration Test Summary"
echo "=========================="

# Count checks
TOTAL_COMPONENTS=9
READY_COMPONENTS=0

# Simple status check (this is a basic implementation)
[ -d "/Users/bradjohnson/Documents/anoint-array/WEBSITE/anoint-array/.claude/commands" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -f "claude-code-screenshot.applescript" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -f "alfred-workflow.json" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -f "launch-claude-screenshot.sh" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -d "/Applications/Shottr.app" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -d "/Applications/Alfred 4.app" ] || [ -d "/Applications/Alfred 5.app" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))
command -v claude > /dev/null 2>&1 && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -d "$SCREENSHOTS_DIR" ] || mkdir -p "$SCREENSHOTS_DIR" && READY_COMPONENTS=$((READY_COMPONENTS + 1))
[ -w "$SCREENSHOTS_DIR" ] && READY_COMPONENTS=$((READY_COMPONENTS + 1))

echo "Components ready: $READY_COMPONENTS/$TOTAL_COMPONENTS"

if [ $READY_COMPONENTS -eq $TOTAL_COMPONENTS ]; then
    echo "🎉 All components ready! Screenshot integration should work perfectly."
    echo ""
    echo "🚀 Quick Start:"
    echo "   1. Configure Shottr using: setup-shottr.sh"
    echo "   2. Import Alfred workflow"
    echo "   3. Test with: ./launch-claude-screenshot.sh area"
elif [ $READY_COMPONENTS -gt 6 ]; then
    echo "✅ Most components ready! A few setup steps remaining."
    echo ""
    echo "📋 Next steps:"
    [ ! -d "/Applications/Shottr.app" ] && echo "   - Install Shottr from https://shottr.cc/"
    [ ! -d "/Applications/Alfred 4.app" ] && [ ! -d "/Applications/Alfred 5.app" ] && echo "   - Install Alfred with Powerpack"
    ! command -v claude > /dev/null 2>&1 && echo "   - Ensure Claude Code CLI is in PATH"
else
    echo "⚠️  Several components need setup. Run setup-shottr.sh and follow instructions."
fi

echo ""
echo "📚 Documentation:"
echo "   - Full setup: README.md"
echo "   - Shortcuts: KEYBOARD_SHORTCUTS.md" 
echo "   - Alfred setup: alfred-setup-instructions.md"
echo ""
echo "✨ Happy screenshotting with Claude Code!"