#!/bin/bash

# activate-profile.sh
# Activates a specific build profile and its associated MCP servers

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="$SCRIPT_DIR/../profiles"
ACTIVE_DIR="$SCRIPT_DIR/../active"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

if [ $# -eq 0 ]; then
    echo -e "${RED}Usage: $0 <profile-name>${NC}"
    echo ""
    echo -e "${BLUE}Available profiles:${NC}"
    for profile in "$PROFILES_DIR"/*.json; do
        if [ -f "$profile" ]; then
            profile_name=$(basename "$profile" .json)
            display_name=$(jq -r '.profile.display_name' "$profile")
            emoji=$(jq -r '.profile.emoji' "$profile")
            echo "  $emoji $profile_name - $display_name"
        fi
    done
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 ecommerce     # Activate e-commerce development stack"
    echo "  $0 frontend      # Activate frontend development tools"
    echo "  $0 all          # Activate complete development ecosystem"
    exit 1
fi

PROFILE_NAME="$1"
PROFILE_FILE="$PROFILES_DIR/$PROFILE_NAME.json"

# Check if profile exists
if [ ! -f "$PROFILE_FILE" ]; then
    echo -e "${RED}❌ Error: Profile '$PROFILE_NAME' not found${NC}"
    echo -e "${BLUE}Available profiles:${NC}"
    ls "$PROFILES_DIR"/*.json | xargs -n1 basename | sed 's/.json$//' | sed 's/^/  /'
    exit 1
fi

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: jq is required but not installed.${NC}"
    echo "   Install with: brew install jq"
    exit 1
fi

# Load profile information
DISPLAY_NAME=$(jq -r '.profile.display_name' "$PROFILE_FILE")
EMOJI=$(jq -r '.profile.emoji' "$PROFILE_FILE")
DESCRIPTION=$(jq -r '.profile.description' "$PROFILE_FILE")
KEYWORDS=$(jq -r '.profile.keywords | join(", ")' "$PROFILE_FILE")

echo -e "${PURPLE}🚀 Activating Build Profile: $EMOJI $DISPLAY_NAME${NC}"
echo -e "${BLUE}Description:${NC} $DESCRIPTION"
echo -e "${BLUE}Keywords:${NC} $KEYWORDS"
echo ""

# Function to get server priority color
get_priority_color() {
    case "$1" in
        "critical") echo "$RED" ;;
        "high") echo "$YELLOW" ;;
        "medium") echo "$BLUE" ;;
        "low") echo "$NC" ;;
        *) echo "$NC" ;;
    esac
}

# Function to display servers in a category
display_servers() {
    local category="$1"
    local servers=$(jq -r ".servers.$category[]? | .name + \"|\" + .role + \"|\" + .priority" "$PROFILE_FILE" 2>/dev/null)
    
    if [ -n "$servers" ]; then
        echo -e "${GREEN}📋 $(echo $category | tr '_' ' ' | sed 's/.*/\L&/; s/[a-z]*/\u&/g') Servers:${NC}"
        echo "$servers" | while IFS="|" read -r name role priority; do
            color=$(get_priority_color "$priority")
            status="❓"
            
            # Check if server is available in active directory
            if [ -f "$ACTIVE_DIR/$name.json" ]; then
                status="✅"
            else
                status="❌ (not installed)"
            fi
            
            echo -e "  $status ${color}$name${NC} - $role ${color}($priority)${NC}"
        done
        echo ""
    fi
}

# Display all server categories
if jq -e '.servers.primary' "$PROFILE_FILE" >/dev/null 2>&1; then
    display_servers "primary"
    display_servers "secondary"
else
    # Handle "all" profile format with different categories
    display_servers "core_infrastructure" 
    display_servers "development_acceleration"
    display_servers "quality_and_security"
    display_servers "specialized_tools"
fi

# Show available workflows
workflows=$(jq -r '.workflows[]? | .name + " - " + .description' "$PROFILE_FILE" 2>/dev/null)
if [ -n "$workflows" ]; then
    echo -e "${GREEN}🔄 Available Workflows:${NC}"
    echo "$workflows" | while read -r workflow; do
        echo "  🔗 $workflow"
    done
    echo ""
fi

# Show automation triggers
echo -e "${GREEN}🤖 Automation Triggers:${NC}"
auto_activate=$(jq -r '.automation.auto_activate_on[]?' "$PROFILE_FILE" 2>/dev/null)
if [ -n "$auto_activate" ]; then
    echo "  📁 Auto-activate on paths:"
    echo "$auto_activate" | while read -r path; do
        echo "    • $path"
    done
fi

file_extensions=$(jq -r '.automation.file_extensions[]?' "$PROFILE_FILE" 2>/dev/null)
if [ -n "$file_extensions" ]; then
    echo "  📄 File extensions:"
    echo "$file_extensions" | while read -r ext; do
        echo "    • $ext"
    done
fi

echo ""
echo -e "${GREEN}✅ Profile '$PROFILE_NAME' activated successfully!${NC}"
echo ""
echo -e "${YELLOW}💡 Usage Tips:${NC}"
echo "  • Use keyword triggers in your messages: $KEYWORDS"
echo "  • Servers will auto-activate based on file paths and extensions"
echo "  • Run workflows with: ./run-workflow.sh $PROFILE_NAME <workflow-name>"
echo "  • Check server status: ./status.sh"