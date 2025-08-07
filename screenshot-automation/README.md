# Claude Code Screenshot Integration

A streamlined workflow for capturing screenshots and getting instant analysis from Claude Code with custom templates and automation.

## 🎯 Overview

This integration provides:
- **Sub-5 second workflow** from screenshot to Claude Code analysis
- **Enhanced screenshots** with Shottr's annotation and OCR capabilities
- **Custom analysis templates** for UI/UX, debugging, and design feedback
- **System-wide accessibility** via Alfred hotkeys
- **Automatic backup** of all screenshots

## 🛠 Installation

### Prerequisites
- macOS (tested on macOS 14+)
- [Alfred](https://www.alfredapp.com/) with Powerpack
- [Shottr](https://shottr.cc/) (free screenshot tool)
- Claude Code CLI installed and accessible

### Step 1: Install Shottr
1. Download Shottr from https://shottr.cc/
2. Install and launch the application
3. Grant necessary permissions (Screen Recording, Accessibility)

### Step 2: Run Setup Script
```bash
cd /Users/bradjohnson/Documents/anoint-array/WEBSITE/screenshot-automation
./setup-shottr.sh
```

### Step 3: Configure Shottr
Open Shottr preferences and configure:
- ✅ Auto-copy screenshots to clipboard
- ✅ Auto-save to `~/Documents/anoint-array/WEBSITE/screenshots/`
- ✅ Enable OCR (Optical Character Recognition)
- ✅ Set hotkeys (see recommended hotkeys below)

### Step 4: Install Alfred Workflow
1. Open Alfred Preferences (`Cmd + ,`)
2. Go to "Workflows" tab
3. Click "+" → "Import Workflow"
4. Select `alfred-workflow.json` from this directory
5. Configure hotkeys as desired

## 🚀 Usage

### Alfred Commands
| Command | Description | Template |
|---------|-------------|----------|
| `ccshot` | Quick area screenshot | Quick analysis |
| `ccfull` | Full screen screenshot | Quick analysis |
| `ccwindow` | Window screenshot | Quick analysis |
| `ccui` | Area screenshot | UI/UX feedback |
| `ccdebug` | Area screenshot | Debug analysis |

### Direct Script Usage
```bash
# Quick area screenshot
./launch-claude-screenshot.sh area

# Window screenshot with UI analysis
./launch-claude-screenshot.sh window ui

# Full screen with debug template
./launch-claude-screenshot.sh full debug
```

### Claude Code Commands
Once you have a screenshot, use these slash commands:
- `/screenshot-quick` - Brief analysis and assessment
- `/screenshot-ui-feedback` - Comprehensive UI/UX evaluation
- `/screenshot-debug` - Bug identification and troubleshooting
- `/screenshot-design` - Implementation guidance

## ⌨️ Recommended Hotkeys

### System-wide Shortcuts
- **Cmd+Shift+C, C** - Quick area screenshot
- **Cmd+Shift+C, F** - Full screen screenshot
- **Cmd+Shift+C, W** - Window screenshot
- **Cmd+Shift+C, U** - UI analysis screenshot
- **Cmd+Shift+C, D** - Debug analysis screenshot

### Shottr Native (Alternative)
- **Cmd+Shift+4** - Area selection
- **Cmd+Shift+5** - Window selection
- **Cmd+Shift+3** - Full screen
- **Cmd+Shift+O** - OCR text extraction

## 📁 File Structure

```
screenshot-automation/
├── README.md                           # This file
├── setup-shottr.sh                     # Automated setup script
├── claude-code-screenshot.applescript  # Main automation script
├── alfred-workflow.json                # Alfred workflow configuration
├── launch-claude-screenshot.sh         # Quick launcher script
└── alfred-setup-instructions.md        # Detailed Alfred setup

.claude/commands/
├── screenshot-quick.md          # Quick analysis template
├── screenshot-ui-feedback.md    # UI/UX analysis template
├── screenshot-debug.md          # Debug analysis template
└── screenshot-design.md         # Design implementation template
```

## 🔄 Workflow Process

1. **Trigger**: Press hotkey or type Alfred command
2. **Capture**: Shottr captures enhanced screenshot
3. **Copy**: Screenshot auto-copies to clipboard
4. **Focus**: Claude Code terminal comes to foreground
5. **Paste**: Screenshot pastes automatically (Ctrl+V)
6. **Template**: Appropriate analysis template loads
7. **Analysis**: Ready for Claude Code feedback

## 🛠 Customization

### Adding New Templates
1. Create new template in `.claude/commands/screenshot-[name].md`
2. Follow existing template format with `$ARGUMENTS` placeholder
3. Update AppleScript with new template option
4. Add Alfred workflow trigger if desired

### Modifying Hotkeys
- **Alfred**: Double-click workflow objects to edit
- **Shottr**: Preferences → Hotkeys tab
- **System**: System Preferences → Keyboard → Shortcuts

### Custom Screenshot Directory
Edit the `SCREENSHOTS_DIR` variable in `setup-shottr.sh` and re-run setup.

## 🔧 Troubleshooting

### Common Issues

**Screenshots not appearing in Claude Code**
- Ensure you're using Ctrl+V (not Cmd+V) to paste
- Check clipboard contains image after screenshot
- Verify Claude Code has focus

**Alfred workflow not working**
- Check AppleScript permissions in System Preferences
- Verify file paths in workflow configuration
- Test AppleScript manually: `osascript claude-code-screenshot.applescript`

**Shottr not capturing**
- Grant Screen Recording permission
- Check hotkey conflicts with other apps
- Restart Shottr if needed

**Template commands not found**
- Ensure `.claude/commands/` directory exists in project root
- Check file permissions on template files
- Verify Claude Code is in correct directory

### Permission Requirements
- **Screen Recording**: Required for screenshots
- **Accessibility**: Required for keyboard automation
- **Terminal**: May need permission for AppleScript control

## 🎨 Advanced Features

### OCR Text Extraction
Shottr's OCR can extract text from screenshots:
1. Take screenshot with Shottr
2. Click OCR button in Shottr interface
3. Text is copied to clipboard automatically

### Annotation Before Sharing
1. Take screenshot with Shottr
2. Use annotation tools (arrows, text, highlights)
3. Copy annotated version to clipboard
4. Proceed with Claude Code workflow

### Batch Screenshot Analysis
```bash
# Analyze multiple screenshots
for file in ~/Documents/anoint-array/WEBSITE/screenshots/*.png; do
    echo "Analyzing: $file"
    claude -p "Analyze this screenshot for UI issues" "$file"
done
```

## 📈 Performance Tips

- Keep Shottr running in background for faster captures
- Use area screenshots instead of full screen when possible
- Enable Shottr's "Fast Mode" for quicker captures
- Configure automatic cleanup of old screenshots

## 🔒 Privacy & Security

- Screenshots are stored locally only
- No cloud upload without explicit action
- .gitignore prevents accidental screenshot commits
- OCR text processing happens locally in Shottr

## 🆘 Support

For issues with:
- **Shottr**: Visit https://shottr.cc/support
- **Alfred**: Check https://www.alfredapp.com/help/
- **Claude Code**: See Claude Code documentation
- **This Integration**: Check troubleshooting section above

## 📝 Changelog

### v1.0.0 (Current)
- Initial release with Shottr + Alfred integration
- Four analysis templates (quick, UI, debug, design)
- Automated AppleScript workflows
- Comprehensive setup automation

---

**Happy screenshotting with Claude Code!** 📸✨