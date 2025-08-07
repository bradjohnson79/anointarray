# Claude code Screenshot Integration - Keyboard Shortcuts Reference

## 🎯 Quick Reference Card

| Action | Hotkey | Description |
|--------|--------|-------------|
| **Quick Area Screenshot** | `Cmd+Shift+C, C` | Area selection → Claude Code |
| **Full Screen Screenshot** | `Cmd+Shift+C, F` | Full screen → Claude Code |
| **Window Screenshot** | `Cmd+Shift+C, W` | Window selection → Claude Code |
| **UI Analysis Screenshot** | `Cmd+Shift+C, U` | Area → UI/UX template |
| **Debug Screenshot** | `Cmd+Shift+C, D` | Area → Debug template |

## 📋 Alfred Commands

### Primary Commands
```
ccshot [context]     # Quick area screenshot with optional context
ccfull [context]     # Full screen screenshot  
ccwindow [context]   # Window screenshot
ccui [context]       # Area screenshot with UI analysis template
ccdebug [context]    # Area screenshot with debug template
```

### Usage Examples
```
ccshot "navbar layout issue"
ccui "mobile responsive design"  
ccdebug "login form not working"
ccfull "dashboard overview"
```

## 🎨 Shottr Native Shortcuts

### Screenshot Capture
| Shortcut | Action | Auto-Copy |
|----------|--------|-----------|
| `Cmd+Shift+4` | Area selection | ✅ Yes |
| `Cmd+Shift+5` | Window selection | ✅ Yes |
| `Cmd+Shift+3` | Full screen | ✅ Yes |
| `Cmd+Shift+6` | Scrolling screenshot | ✅ Yes |

### Shottr Features
| Shortcut | Action | Description |
|----------|--------|-------------|
| `Cmd+Shift+O` | OCR | Extract text from screenshot |
| `Cmd+Shift+A` | Annotate | Add arrows, text, highlights |
| `Cmd+Shift+R` | Record | Screen recording mode |
| `Cmd+Shift+H` | History | View recent screenshots |

## 🖥 System Integration

### macOS Native (Fallback)
| Shortcut | Action | Clipboard |
|----------|--------|-----------|
| `Ctrl+Cmd+Shift+4` | Area to clipboard | ✅ Direct |
| `Ctrl+Cmd+Shift+5` | Window to clipboard | ✅ Direct |  
| `Ctrl+Cmd+Shift+3` | Full screen to clipboard | ✅ Direct |

### Terminal/Claude Code
| Shortcut | Action | Note |
|----------|--------|------|
| `Ctrl+V` | Paste image | NOT Cmd+V! |
| `Cmd+T` | New terminal tab | If needed |
| `Cmd+W` | Close terminal tab | Cleanup |

## 🚀 Workflow Shortcuts

### Complete Workflow Chains
1. **Quick UI Feedback**
   ```
   Cmd+Shift+C, U → Select area → Auto-paste → /screenshot-ui-feedback
   ```

2. **Debug Issue**
   ```
   Cmd+Shift+C, D → Select area → Auto-paste → /screenshot-debug  
   ```

3. **Design Implementation**
   ```
   ccshot → Select area → Manual → /screenshot-design [context]
   ```

## 📝 Claude Code Templates

### Slash Commands (Post-Screenshot)
```
/screenshot-quick          # Brief analysis
/screenshot-ui-feedback    # Comprehensive UI/UX review
/screenshot-debug          # Bug identification & solutions
/screenshot-design         # Implementation guidance
```

### Template Usage
```bash
# After pasting screenshot, type:
/screenshot-ui-feedback "mobile navigation menu"
/screenshot-debug "form validation not working"
/screenshot-design "implement this card component"
```

## ⚡ Power User Shortcuts

### Sequential Screenshots
```bash
# Multiple areas quickly
Cmd+Shift+C, C → Select → Cmd+Shift+C, C → Select → ...
```

### Batch Analysis
```bash
# Take several screenshots first, then:
# Use up arrow in Claude Code to repeat previous template commands
```

### Context Switching
```bash
# Switch between analysis types quickly
/screenshot-ui-feedback    # UI review
↑ ↑ /screenshot-debug     # Switch to debug
↑ ↑ /screenshot-design    # Switch to design
```

## 🔧 Customization

### Adding Custom Hotkeys
1. **Alfred**: Preferences → Workflows → Claude Code Screenshots
2. **Shottr**: Preferences → Hotkeys → Set custom combinations
3. **System**: System Preferences → Keyboard → Shortcuts

### Recommended Custom Combinations
```
Cmd+Shift+C, Q    # Quick screenshot (ccshot)
Cmd+Shift+C, 1    # UI analysis (ccui)  
Cmd+Shift+C, 2    # Debug analysis (ccdebug)
Cmd+Shift+C, 3    # Design analysis + /screenshot-design
```

## 📱 Mobile/Responsive Testing

### Device Simulation Screenshots
```
# Chrome DevTools
Cmd+Shift+C, U → Select device view → UI analysis

# Responsive breakpoints  
Cmd+Shift+C, U → Select mobile → "mobile layout issues"
Cmd+Shift+C, U → Select tablet → "tablet responsive behavior"
```

## 🎯 Context-Specific Workflows

### Bug Reporting
```
1. Cmd+Shift+C, D → Select error area
2. Auto-pastes with /screenshot-debug template  
3. Add context: "Steps to reproduce: ..."
```

### Design Review
```
1. ccui "homepage hero section"
2. Screenshot area
3. Get comprehensive UI/UX feedback
4. Iterate based on suggestions
```

### Implementation Planning
```
1. ccshot "design mockup comparison"
2. /screenshot-design "convert to React component"
3. Get step-by-step implementation guide
```

## ⌨️ Accessibility

### Alternative Shortcuts (if conflicts)
```
Option+Cmd+Shift+C, C    # Alternative area screenshot
Ctrl+Option+Shift+C, U   # Alternative UI analysis
Fn+Cmd+Shift+C, D        # Alternative debug screenshot
```

### Voice Control Integration
```
"Take Claude screenshot area"     # Triggers ccshot
"Take Claude UI screenshot"       # Triggers ccui  
"Take Claude debug screenshot"    # Triggers ccdebug
```

## 🔄 Quick Setup Reminder

1. Install Shottr + Alfred
2. Run `./setup-shottr.sh`
3. Import Alfred workflow
4. Test with `Cmd+Shift+C, C`
5. Configure custom hotkeys as needed

---

**Print this reference card for quick access during development!** 📋✨