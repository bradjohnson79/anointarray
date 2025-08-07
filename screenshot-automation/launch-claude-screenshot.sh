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