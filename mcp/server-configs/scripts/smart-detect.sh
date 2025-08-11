#!/bin/bash

# smart-detect.sh
# Smart detection of project context and automatic profile activation

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

# Function to detect current working context
detect_context() {
    local current_dir="$(pwd)"
    local detected_profiles=()
    
    echo -e "${PURPLE}🔍 Analyzing current directory: $current_dir${NC}"
    echo ""
    
    # Check for specific directories and files
    echo -e "${BLUE}📂 Scanning for context clues...${NC}"
    
    # E-commerce indicators
    if [[ -d "app/admin" ]] || [[ -d "components/admin" ]] || [[ -f "app/admin/products/page.tsx" ]]; then
        detected_profiles+=("ecommerce")
        echo "  🛒 E-commerce context detected (admin/products structure)"
    fi
    
    # Frontend indicators
    if [[ -d "components" ]] || [[ -d "app" ]] || [[ -f "tailwind.config.js" ]] || [[ -f "next.config.js" ]]; then
        detected_profiles+=("frontend")
        echo "  🎨 Frontend context detected (React/Next.js structure)"
    fi
    
    # Backend indicators  
    if [[ -d "app/api" ]] || [[ -d "pages/api" ]] || [[ -d "supabase" ]] || [[ -f "supabase/config.toml" ]]; then
        detected_profiles+=("backend")
        echo "  🔧 Backend context detected (API routes/Supabase)"
    fi
    
    # Testing indicators
    if [[ -d "__tests__" ]] || [[ -d "tests" ]] || [[ -d "cypress" ]] || [[ -d "playwright" ]] || [[ -f "jest.config.js" ]]; then
        detected_profiles+=("testing")
        echo "  🧪 Testing context detected (test directories/config)"
    fi
    
    # Deployment indicators
    if [[ -d ".github/workflows" ]] || [[ -d ".vercel" ]] || [[ -f "vercel.json" ]] || [[ -f "Dockerfile" ]]; then
        detected_profiles+=("deployment")
        echo "  🚀 Deployment context detected (CI/CD/Docker)"
    fi
    
    # Git repository check
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "  📚 Git repository detected"
        
        # Check recent commits for context clues
        recent_commit=$(git log -1 --pretty=format:"%s" 2>/dev/null)
        if [[ -n "$recent_commit" ]]; then
            echo "  📝 Recent commit: $recent_commit"
            
            # Analyze commit message for keywords
            if [[ "$recent_commit" =~ (deploy|release|build) ]]; then
                detected_profiles+=("deployment")
                echo "    → Deployment context from commit message"
            elif [[ "$recent_commit" =~ (test|spec|e2e) ]]; then
                detected_profiles+=("testing")
                echo "    → Testing context from commit message"
            elif [[ "$recent_commit" =~ (api|backend|database) ]]; then
                detected_profiles+=("backend")
                echo "    → Backend context from commit message"
            elif [[ "$recent_commit" =~ (ui|frontend|component) ]]; then
                detected_profiles+=("frontend")
                echo "    → Frontend context from commit message"
            fi
        fi
    fi
    
    echo "${detected_profiles[@]}"
}

# Function to get current git branch context
get_branch_context() {
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        local branch=$(git branch --show-current 2>/dev/null)
        if [[ -n "$branch" ]]; then
            echo -e "${GREEN}🌿 Current branch: $branch${NC}"
            
            # Branch naming patterns
            if [[ "$branch" =~ ^feature/ ]]; then
                echo "  → Feature development context"
                return 0
            elif [[ "$branch" =~ ^hotfix/ ]]; then
                echo "  → Hotfix context (deployment focus)"
                echo "deployment"
                return 0
            elif [[ "$branch" =~ ^test/ ]]; then
                echo "  → Testing context"
                echo "testing"
                return 0
            elif [[ "$branch" =~ (deploy|release) ]]; then
                echo "  → Deployment context"
                echo "deployment"
                return 0
            fi
        fi
    fi
}

# Function to analyze recent file changes
analyze_recent_changes() {
    if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo -e "${BLUE}📈 Analyzing recent file changes...${NC}"
        
        # Get files changed in last 5 commits
        local changed_files=$(git diff --name-only HEAD~5..HEAD 2>/dev/null)
        
        if [[ -n "$changed_files" ]]; then
            local detected_profiles=()
            
            while IFS= read -r file; do
                if [[ "$file" =~ ^app/api/ ]] || [[ "$file" =~ \.sql$ ]]; then
                    detected_profiles+=("backend")
                elif [[ "$file" =~ ^components/ ]] || [[ "$file" =~ \.(tsx|jsx)$ ]]; then
                    detected_profiles+=("frontend")
                elif [[ "$file" =~ \.test\. ]] || [[ "$file" =~ \.spec\. ]]; then
                    detected_profiles+=("testing")
                elif [[ "$file" =~ ^\.github/ ]] || [[ "$file" =~ vercel\.json$ ]]; then
                    detected_profiles+=("deployment")
                fi
            done <<< "$changed_files"
            
            # Remove duplicates
            local unique_profiles=($(printf "%s\n" "${detected_profiles[@]}" | sort -u))
            
            if [[ ${#unique_profiles[@]} -gt 0 ]]; then
                echo "  📋 Recent changes suggest: ${unique_profiles[*]}"
                echo "${unique_profiles[@]}"
            fi
        fi
    fi
}

# Main function
main() {
    echo -e "${PURPLE}🤖 Smart Context Detection${NC}"
    echo -e "${BLUE}Automatically detecting optimal MCP server profile...${NC}"
    echo ""
    
    # Collect all detection results
    local context_profiles=($(detect_context))
    local branch_profile=$(get_branch_context)
    local change_profiles=($(analyze_recent_changes))
    
    # Combine all detected profiles
    local all_profiles=("${context_profiles[@]}")
    [[ -n "$branch_profile" ]] && all_profiles+=("$branch_profile")
    all_profiles+=("${change_profiles[@]}")
    
    # Remove duplicates and count occurrences
    local profile_counts
    declare -A profile_counts 2>/dev/null || {
        # Fallback for older bash versions
        local profile_list=($(printf "%s\n" "${all_profiles[@]}" | sort | uniq -c | sort -nr))
    }
    
    for profile in "${all_profiles[@]}"; do
        if [[ -n "${profile_counts[$profile]+x}" ]]; then
            ((profile_counts["$profile"]++))
        else
            profile_counts["$profile"]=1
        fi
    done
    
    echo ""
    echo -e "${GREEN}🎯 Detection Results:${NC}"
    
    if [[ ${#profile_counts[@]} -eq 0 ]]; then
        echo -e "${YELLOW}⚠️  No specific context detected. Using 'all' profile.${NC}"
        "$SCRIPT_DIR/activate-profile.sh" all
        return 0
    fi
    
    # Find most frequent profile
    local top_profile=""
    local max_count=0
    
    for profile in "${!profile_counts[@]}"; do
        local count=${profile_counts[$profile]}
        echo "  $profile: $count detection(s)"
        
        if [[ $count -gt $max_count ]]; then
            max_count=$count
            top_profile=$profile
        fi
    done
    
    echo ""
    
    if [[ -n "$top_profile" ]]; then
        echo -e "${GREEN}🏆 Recommended profile: $top_profile (confidence: $max_count)${NC}"
        
        # Ask for confirmation if not running in auto mode
        if [[ "${1:-}" != "--auto" ]]; then
            echo -e "${YELLOW}Activate '$top_profile' profile? [Y/n]:${NC}"
            read -r confirmation
            
            if [[ "$confirmation" =~ ^[Nn] ]]; then
                echo "Profile activation cancelled."
                exit 0
            fi
        fi
        
        "$SCRIPT_DIR/activate-profile.sh" "$top_profile"
    else
        echo -e "${YELLOW}No clear winner. Activating 'all' profile.${NC}"
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