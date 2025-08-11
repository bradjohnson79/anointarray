#!/bin/bash

# status.sh
# Comprehensive status check for MCP server configuration system

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="$SCRIPT_DIR/../profiles"
ACTIVE_DIR="$SCRIPT_DIR/../active"
RECOMMENDED_DIR="$SCRIPT_DIR/../recommended"
TEMPLATES_DIR="$SCRIPT_DIR/../templates"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Function to count files in directory
count_files() {
    local dir="$1"
    if [[ -d "$dir" ]]; then
        find "$dir" -name "*.json" | wc -l | xargs
    else
        echo "0"
    fi
}

# Function to get server status
get_server_status() {
    local server_name="$1"
    
    if [[ -f "$ACTIVE_DIR/$server_name.json" ]]; then
        local transport=$(jq -r '.transport.type // "unknown"' "$ACTIVE_DIR/$server_name.json" 2>/dev/null)
        echo "✅ Active ($transport)"
    else
        echo "❌ Not installed"
    fi
}

# Function to display directory status
show_directory_status() {
    local dir="$1"
    local name="$2"
    local emoji="$3"
    
    local count=$(count_files "$dir")
    local status="❌"
    local color="$RED"
    
    if [[ -d "$dir" ]]; then
        if [[ $count -gt 0 ]]; then
            status="✅"
            color="$GREEN"
        else
            status="⚠️"
            color="$YELLOW"
        fi
    fi
    
    echo -e "  $emoji ${color}$name${NC}: $status ($count files)"
}

# Function to show profile summary
show_profile_summary() {
    echo -e "${GREEN}📋 Profile Summary:${NC}"
    
    for profile_file in "$PROFILES_DIR"/*.json; do
        if [[ -f "$profile_file" ]]; then
            local profile_name=$(basename "$profile_file" .json)
            local display_name=$(jq -r '.profile.display_name' "$profile_file")
            local emoji=$(jq -r '.profile.emoji' "$profile_file")
            local keywords=$(jq -r '.profile.keywords | join(", ")' "$profile_file")
            local workflow_count=$(jq -r '.workflows | length' "$profile_file" 2>/dev/null || echo "0")
            
            echo ""
            echo -e "  $emoji ${CYAN}$profile_name${NC} - $display_name"
            echo -e "    🔑 Keywords: $keywords"
            echo -e "    🔄 Workflows: $workflow_count"
            
            # Check server availability for this profile
            local total_servers=0
            local available_servers=0
            
            # Count servers in different categories
            if jq -e '.servers.primary' "$profile_file" >/dev/null 2>&1; then
                local primary_servers=$(jq -r '.servers.primary[].name' "$profile_file" 2>/dev/null)
                local secondary_servers=$(jq -r '.servers.secondary[].name' "$profile_file" 2>/dev/null)
                
                for server in $primary_servers $secondary_servers; do
                    ((total_servers++))
                    if [[ -f "$ACTIVE_DIR/$server.json" ]]; then
                        ((available_servers++))
                    fi
                done
            else
                # Handle "all" profile with different structure
                local all_servers=$(jq -r '.servers[][].name' "$profile_file" 2>/dev/null)
                for server in $all_servers; do
                    ((total_servers++))
                    if [[ -f "$ACTIVE_DIR/$server.json" ]]; then
                        ((available_servers++))
                    fi
                done
            fi
            
            local availability_percent=0
            if [[ $total_servers -gt 0 ]]; then
                availability_percent=$((available_servers * 100 / total_servers))
            fi
            
            local status_emoji="❌"
            if [[ $availability_percent -eq 100 ]]; then
                status_emoji="✅"
            elif [[ $availability_percent -gt 50 ]]; then
                status_emoji="⚠️"
            fi
            
            echo -e "    $status_emoji Server availability: $available_servers/$total_servers ($availability_percent%)"
        fi
    done
}

# Function to show active server details
show_active_servers() {
    echo -e "${GREEN}🔧 Active MCP Servers:${NC}"
    
    if [[ ! -d "$ACTIVE_DIR" ]] || [[ $(count_files "$ACTIVE_DIR") -eq 0 ]]; then
        echo -e "  ${YELLOW}No active servers configured${NC}"
        return
    fi
    
    for server_file in "$ACTIVE_DIR"/*.json; do
        if [[ -f "$server_file" ]]; then
            local server_name=$(basename "$server_file" .json)
            local transport=$(jq -r '.transport.type // "unknown"' "$server_file" 2>/dev/null)
            local endpoint=$(jq -r '.transport.endpoint // .transport.command // "N/A"' "$server_file" 2>/dev/null)
            
            echo ""
            echo -e "  🔧 ${CYAN}$server_name${NC}"
            echo -e "    📡 Transport: $transport"
            echo -e "    🌐 Endpoint: $endpoint"
        fi
    done
}

# Function to check system dependencies
check_dependencies() {
    echo -e "${GREEN}🔍 System Dependencies:${NC}"
    
    local deps=("jq" "git" "curl")
    local missing_deps=()
    
    for dep in "${deps[@]}"; do
        if command -v "$dep" >/dev/null 2>&1; then
            local version=$($dep --version 2>/dev/null | head -1 | cut -d' ' -f2-3 || echo "unknown")
            echo -e "  ✅ $dep ($version)"
        else
            echo -e "  ❌ $dep (not installed)"
            missing_deps+=("$dep")
        fi
    done
    
    if [[ ${#missing_deps[@]} -gt 0 ]]; then
        echo ""
        echo -e "${RED}⚠️  Missing dependencies:${NC}"
        for dep in "${missing_deps[@]}"; do
            echo -e "  • Install $dep with: brew install $dep"
        done
    fi
}

# Function to show project context
show_project_context() {
    echo -e "${GREEN}📁 Project Context:${NC}"
    
    local current_dir="$(pwd)"
    echo -e "  📂 Current directory: $current_dir"
    
    # Check if in git repository
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        local branch=$(git branch --show-current 2>/dev/null)
        local repo_root=$(git rev-parse --show-toplevel 2>/dev/null)
        echo -e "  📚 Git repository: ${repo_root##*/}"
        echo -e "  🌿 Current branch: $branch"
        
        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD -- 2>/dev/null; then
            echo -e "  ⚠️  Uncommitted changes detected"
        else
            echo -e "  ✅ Working directory clean"
        fi
    else
        echo -e "  ❌ Not in a Git repository"
    fi
    
    # Check for key project files
    local key_files=("package.json" "next.config.js" "tailwind.config.js" "supabase/config.toml")
    echo -e "  📄 Key project files:"
    
    for file in "${key_files[@]}"; do
        if [[ -f "$file" ]]; then
            echo -e "    ✅ $file"
        else
            echo -e "    ❌ $file"
        fi
    done
}

# Main function
main() {
    echo -e "${PURPLE}🤖 MCP Server Configuration System Status${NC}"
    echo -e "${BLUE}$(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
    
    # System overview
    echo -e "${GREEN}📊 System Overview:${NC}"
    show_directory_status "$PROFILES_DIR" "Profiles" "📋"
    show_directory_status "$ACTIVE_DIR" "Active Servers" "🔧"
    show_directory_status "$RECOMMENDED_DIR" "Recommended Servers" "💡"
    show_directory_status "$TEMPLATES_DIR" "Templates" "📝"
    
    echo ""
    
    # Check dependencies
    check_dependencies
    
    echo ""
    
    # Show project context
    show_project_context
    
    echo ""
    
    # Show profile summary
    show_profile_summary
    
    echo ""
    
    # Show active servers
    show_active_servers
    
    echo ""
    echo -e "${GREEN}✅ Status check complete!${NC}"
    echo ""
    echo -e "${YELLOW}💡 Quick Commands:${NC}"
    echo "  ./smart-detect.sh           # Auto-detect optimal profile"
    echo "  ./activate-profile.sh all   # Activate complete stack"
    echo "  ./keyword-handler.sh \"@ecommerce features\" # Process keywords"
    echo "  ./run-workflow.sh testing comprehensive-testing # Run workflow"
}

main "$@"