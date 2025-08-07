#!/bin/bash

# Shottr Setup Script for Claude Code Integration
# This script helps configure Shottr for optimal Claude Code screenshot workflow

echo "🎯 Setting up Shottr for Claude Code Integration..."

# Check if Shottr is installed
if [ ! -d "/Applications/Shottr.app" ]; then
    echo "❌ Shottr not found. Please install Shottr first:"
    echo "   1. Visit https://shottr.cc/"
    echo "   2. Download and install Shottr"
    echo "   3. Run this script again"
    exit 1
fi

echo "✅ Shottr found at /Applications/Shottr.app"

# Create Shottr configuration directory if it doesn't exist
SHOTTR_CONFIG_DIR="$HOME/Library/Application Support/Shottr"
mkdir -p "$SHOTTR_CONFIG_DIR"

# Backup existing Shottr preferences if they exist
if [ -f "$SHOTTR_CONFIG_DIR/preferences.plist" ]; then
    cp "$SHOTTR_CONFIG_DIR/preferences.plist" "$SHOTTR_CONFIG_DIR/preferences.plist.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Backed up existing Shottr preferences"
fi

# Configure Shottr preferences for Claude Code workflow
cat > "$SHOTTR_CONFIG_DIR/claude-code-config.md" << 'EOF'
# Shottr Configuration for Claude Code Integration

## Recommended Settings

### General
- ✅ Auto-copy screenshots to clipboard
- ✅ Show screenshot in menu bar
- ✅ Play sound when screenshot is taken
- ✅ Auto-save screenshots to: ~/Documents/anoint-array/WEBSITE/screenshots/

### Hotkeys (Suggested)
- Area Screenshot: Cmd+Shift+4 (override system default)
- Window Screenshot: Cmd+Shift+5
- Full Screen: Cmd+Shift+3 (override system default)
- OCR: Cmd+Shift+O
- Annotate: Cmd+Shift+A

### Quality Settings
- Format: PNG (for best quality)
- Quality: High
- DPI: 144 (Retina quality)

### Features to Enable
- ✅ OCR (Optical Character Recognition)
- ✅ Auto clipboard copying
- ✅ Annotation tools
- ✅ Scrolling screenshots
- ✅ Background app operation

### Claude Code Specific
- Auto-paste delay: 0.5 seconds
- Notification on capture: Enabled
- File naming: claude-screenshot-YYYY-MM-DD-HHMMSS
EOF

# Create screenshots directory
SCREENSHOTS_DIR="$HOME/Documents/anoint-array/WEBSITE/screenshots"
mkdir -p "$SCREENSHOTS_DIR"
echo "📁 Created screenshots directory: $SCREENSHOTS_DIR"

# Create .gitignore for screenshots directory
cat > "$SCREENSHOTS_DIR/.gitignore" << 'EOF'
# Ignore all screenshot files
*.png
*.jpg
*.jpeg
*.gif
*.webp

# But keep this .gitignore file
!.gitignore
EOF

echo "🔒 Added .gitignore to screenshots directory"

# Make AppleScript executable
SCRIPT_DIR="$(dirname "$0")"
chmod +x "$SCRIPT_DIR/claude-code-screenshot.applescript"
echo "🔧 Made AppleScript executable"

# Create quick launcher script
cat > "$SCRIPT_DIR/launch-claude-screenshot.sh" << 'EOF'
#!/bin/bash
# Quick launcher for Claude Code screenshot workflow

case "$1" in
    "area"|"")
        osascript "$(dirname "$0")/claude-code-screenshot.applescript" area quick
        ;;
    "window")
        osascript "$(dirname "$0")/claude-code-screenshot.applescript" window quick
        ;;
    "full")
        osascript "$(dirname "$0")/claude-code-screenshot.applescript" full quick
        ;;
    "ui")
        osascript "$(dirname "$0")/claude-code-screenshot.applescript" area ui
        ;;
    "debug")
        osascript "$(dirname "$0")/claude-code-screenshot.applescript" area debug
        ;;
    "design")
        osascript "$(dirname "$0")/claude-code-screenshot.applescript" area design
        ;;
    *)
        echo "Usage: $0 [area|window|full|ui|debug|design]"
        echo "  area   - Select area (default)"
        echo "  window - Select window"
        echo "  full   - Full screen"
        echo "  ui     - Area with UI feedback template"
        echo "  debug  - Area with debug template"
        echo "  design - Area with design template"
        ;;
esac
EOF

chmod +x "$SCRIPT_DIR/launch-claude-screenshot.sh"
echo "🚀 Created quick launcher script"

# Create Alfred workflow instructions
cat > "$SCRIPT_DIR/alfred-setup-instructions.md" << 'EOF'
# Alfred Workflow Setup Instructions

## Installation Steps

1. **Open Alfred Preferences**
   - Press `Cmd + ,` in Alfred
   - Go to "Workflows" tab

2. **Import Workflow**
   - Click the "+" button at the bottom
   - Select "Import Workflow"
   - Choose the `alfred-workflow.json` file from this directory

3. **Configure Workflow**
   - Double-click on each keyword object to customize hotkeys
   - Verify script paths point to correct locations
   - Test each workflow trigger

## Available Commands

- `ccshot` - Quick area screenshot with Claude Code
- `ccfull` - Full screen screenshot
- `ccwindow` - Window screenshot  
- `ccui` - Area screenshot with UI/UX analysis template
- `ccdebug` - Area screenshot with debug analysis template

## Hotkey Suggestions

- Cmd+Shift+C, C - Quick area screenshot
- Cmd+Shift+C, F - Full screen screenshot
- Cmd+Shift+C, W - Window screenshot
- Cmd+Shift+C, U - UI analysis screenshot
- Cmd+Shift+C, D - Debug analysis screenshot

## Troubleshooting

- Ensure Shottr is installed and running
- Verify Claude Code is accessible via Terminal
- Check AppleScript permissions in System Preferences > Security & Privacy
- Test individual components separately if workflow fails
EOF

echo "📋 Created Alfred setup instructions"

# Final setup check
echo ""
echo "🎉 Shottr setup complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Open Shottr and configure settings using the guide in:"
echo "      $SHOTTR_CONFIG_DIR/claude-code-config.md"
echo ""
echo "   2. Set up Alfred workflow using instructions in:"
echo "      $SCRIPT_DIR/alfred-setup-instructions.md"
echo ""
echo "   3. Test the workflow:"
echo "      ./launch-claude-screenshot.sh area"
echo ""
echo "   4. Screenshots will be saved to:"
echo "      $SCREENSHOTS_DIR"
echo ""
echo "✨ Happy screenshotting with Claude Code!"