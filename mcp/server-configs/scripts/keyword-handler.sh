#!/bin/bash

# keyword-handler.sh
# Processes keyword triggers and activates appropriate MCP server profiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="$SCRIPT_DIR/../profiles"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Function to extract keywords from message
extract_keywords() {
    local message="$1"
    echo "$message" | grep -oE '@[a-zA-Z0-9_-]+' | tr '\n' ' '
}

# Function to find matching profile for keyword
find_profile_for_keyword() {
    local keyword="$1"
    
    for profile_file in "$PROFILES_DIR"/*.json; do
        if [ -f "$profile_file" ]; then
            profile_name=$(basename "$profile_file" .json)
            keywords=$(jq -r '.profile.keywords[]' "$profile_file" 2>/dev/null)
            
            echo "$keywords" | while read -r profile_keyword; do
                if [ "$keyword" = "$profile_keyword" ]; then
                    echo "$profile_name"
                    return 0
                fi
            done
        fi
    done
}

# Function to detect file-based profile activation
detect_file_profile() {
    local file_path="$1"
    
    for profile_file in "$PROFILES_DIR"/*.json; do
        if [ -f "$profile_file" ]; then
            profile_name=$(basename "$profile_file" .json)
            
            # Check auto_activate_on paths
            auto_paths=$(jq -r '.automation.auto_activate_on[]?' "$profile_file" 2>/dev/null)
            if [ -n "$auto_paths" ]; then
                echo "$auto_paths" | while read -r pattern; do
                    if [[ "$file_path" == $pattern ]]; then
                        echo "$profile_name"
                        return 0
                    fi
                done
            fi
            
            # Check file extensions
            file_ext="${file_path##*.}"
            extensions=$(jq -r '.automation.file_extensions[]?' "$profile_file" 2>/dev/null)
            if [ -n "$extensions" ]; then
                echo "$extensions" | while read -r ext; do
                    if [ ".$file_ext" = "$ext" ] || [ "*" = "$ext" ]; then
                        echo "$profile_name"
                        return 0
                    fi
                done
            fi
        fi
    done
}

# Main function
main() {
    if [ $# -eq 0 ]; then
        echo -e "${RED}Usage: $0 <message> [file_path]${NC}"
        echo ""
        echo -e "${BLUE}Examples:${NC}"
        echo "  $0 \"Let's work on @ecommerce features\""
        echo "  $0 \"Fix the API\" app/api/users.ts"
        echo "  $0 \"@testing the login flow\" cypress/integration/login.spec.ts"
        exit 1
    fi
    
    local message="$1"
    local file_path="${2:-}"
    
    echo -e "${PURPLE}🔍 Processing message: \"$message\"${NC}"
    [ -n "$file_path" ] && echo -e "${BLUE}📁 File context: $file_path${NC}"
    echo ""
    
    # Extract keywords from message
    keywords=$(extract_keywords "$message")
    profiles_to_activate=()
    
    if [ -n "$keywords" ]; then
        echo -e "${GREEN}🔑 Found keywords: $keywords${NC}"
        
        for keyword in $keywords; do
            profile=$(find_profile_for_keyword "$keyword")
            if [ -n "$profile" ]; then
                profiles_to_activate+=("$profile")
                echo -e "  ✅ $keyword → $profile profile"
            else
                echo -e "  ❌ $keyword → no matching profile"
            fi
        done
    fi
    
    # Check file-based activation
    if [ -n "$file_path" ]; then
        file_profile=$(detect_file_profile "$file_path")
        if [ -n "$file_profile" ]; then
            profiles_to_activate+=("$file_profile")
            echo -e "${GREEN}📄 File-based activation: $file_path → $file_profile${NC}"
        fi
    fi
    
    # Remove duplicates and activate profiles
    if [ ${#profiles_to_activate[@]} -gt 0 ]; then
        unique_profiles=($(printf "%s\n" "${profiles_to_activate[@]}" | sort -u))
        
        echo ""
        echo -e "${YELLOW}🚀 Activating profiles:${NC}"
        
        for profile in "${unique_profiles[@]}"; do
            echo -e "  🔄 Activating $profile..."
            "$SCRIPT_DIR/activate-profile.sh" "$profile"
        done
    else
        echo -e "${YELLOW}⚠️  No matching profiles found. Using default 'all' profile.${NC}"
        "$SCRIPT_DIR/activate-profile.sh" all
    fi
}

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: jq is required but not installed.${NC}"
    echo "   Install with: brew install jq"
    exit 1
fi

main "$@"