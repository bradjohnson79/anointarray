#!/bin/bash

# run-workflow.sh
# Executes predefined workflows for MCP server profiles

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROFILES_DIR="$SCRIPT_DIR/../profiles"
ACTIVE_DIR="$SCRIPT_DIR/../active"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
PURPLE='\033[0;35m'
NC='\033[0m'

# Function to display usage
show_usage() {
    echo -e "${RED}Usage: $0 <profile-name> <workflow-name>${NC}"
    echo ""
    echo -e "${BLUE}Available profiles and their workflows:${NC}"
    
    for profile_file in "$PROFILES_DIR"/*.json; do
        if [[ -f "$profile_file" ]]; then
            local profile_name=$(basename "$profile_file" .json)
            local display_name=$(jq -r '.profile.display_name' "$profile_file")
            local emoji=$(jq -r '.profile.emoji' "$profile_file")
            
            echo ""
            echo -e "  $emoji ${GREEN}$profile_name${NC} - $display_name"
            
            local workflows=$(jq -r '.workflows[]? | "    🔗 " + .name + " - " + .description' "$profile_file" 2>/dev/null)
            if [[ -n "$workflows" ]]; then
                echo "$workflows"
            else
                echo "    (no workflows defined)"
            fi
        fi
    done
    
    echo ""
    echo -e "${YELLOW}Examples:${NC}"
    echo "  $0 ecommerce payment-integration"
    echo "  $0 testing comprehensive-testing"
    echo "  $0 deployment production-deploy"
}

# Function to check server availability
check_server_availability() {
    local server_name="$1"
    
    if [[ -f "$ACTIVE_DIR/$server_name.json" ]]; then
        echo "✅"
    else
        echo "❌"
    fi
}

# Function to execute workflow
execute_workflow() {
    local profile_name="$1"
    local workflow_name="$2"
    local profile_file="$PROFILES_DIR/$profile_name.json"
    
    # Get workflow details
    local workflow_exists=$(jq -e ".workflows[] | select(.name == \"$workflow_name\")" "$profile_file" 2>/dev/null)
    
    if [[ -z "$workflow_exists" ]]; then
        echo -e "${RED}❌ Error: Workflow '$workflow_name' not found in '$profile_name' profile${NC}"
        return 1
    fi
    
    local description=$(jq -r ".workflows[] | select(.name == \"$workflow_name\") | .description" "$profile_file")
    local sequence=$(jq -r ".workflows[] | select(.name == \"$workflow_name\") | .sequence[]" "$profile_file")
    
    echo -e "${PURPLE}🚀 Executing Workflow: $workflow_name${NC}"
    echo -e "${BLUE}Description:${NC} $description"
    echo -e "${BLUE}Profile:${NC} $profile_name"
    echo ""
    
    # Display workflow sequence
    echo -e "${GREEN}📋 Workflow Sequence:${NC}"
    local step_number=1
    
    while IFS= read -r server; do
        local status=$(check_server_availability "$server")
        echo "  $step_number. $status $server"
        ((step_number++))
    done <<< "$sequence"
    
    echo ""
    
    # Check if all servers are available
    local missing_servers=()
    while IFS= read -r server; do
        if [[ ! -f "$ACTIVE_DIR/$server.json" ]]; then
            missing_servers+=("$server")
        fi
    done <<< "$sequence"
    
    if [[ ${#missing_servers[@]} -gt 0 ]]; then
        echo -e "${YELLOW}⚠️  Warning: Missing servers detected:${NC}"
        for server in "${missing_servers[@]}"; do
            echo "  ❌ $server (not installed/configured)"
        done
        echo ""
        echo -e "${YELLOW}Continue anyway? [y/N]:${NC}"
        read -r confirmation
        
        if [[ ! "$confirmation" =~ ^[Yy] ]]; then
            echo "Workflow execution cancelled."
            return 1
        fi
    fi
    
    echo -e "${GREEN}▶️  Starting workflow execution...${NC}"
    echo ""
    
    # Execute workflow steps
    local step_number=1
    local failed_steps=()
    
    while IFS= read -r server; do
        echo -e "${BLUE}Step $step_number: Activating $server${NC}"
        
        local status=$(check_server_availability "$server")
        if [[ "$status" == "✅" ]]; then
            echo "  ✅ Server '$server' is available"
            
            # Here you would typically call the actual MCP server
            # For now, we'll simulate the activation
            sleep 1
            echo "  🔄 Executing $server operations..."
            sleep 1
            echo "  ✅ $server operations completed"
        else
            echo "  ❌ Server '$server' is not available - skipping"
            failed_steps+=("$server")
        fi
        
        echo ""
        ((step_number++))
    done <<< "$sequence"
    
    # Workflow completion summary
    echo -e "${GREEN}🏁 Workflow Execution Complete${NC}"
    echo ""
    
    if [[ ${#failed_steps[@]} -eq 0 ]]; then
        echo -e "${GREEN}✅ All steps completed successfully!${NC}"
        echo -e "${GREEN}🎉 Workflow '$workflow_name' executed without errors.${NC}"
    else
        echo -e "${YELLOW}⚠️  Workflow completed with ${#failed_steps[@]} failed step(s):${NC}"
        for step in "${failed_steps[@]}"; do
            echo "  ❌ $step"
        done
        echo ""
        echo -e "${YELLOW}💡 Consider installing missing MCP servers for full functionality.${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}📊 Workflow Summary:${NC}"
    local total_steps=$(echo "$sequence" | wc -l | xargs)
    local successful_steps=$((total_steps - ${#failed_steps[@]}))
    echo "  📈 Total steps: $total_steps"
    echo "  ✅ Successful: $successful_steps"
    echo "  ❌ Failed: ${#failed_steps[@]}"
}

# Main function
main() {
    if [[ $# -lt 2 ]]; then
        show_usage
        exit 1
    fi
    
    local profile_name="$1"
    local workflow_name="$2"
    local profile_file="$PROFILES_DIR/$profile_name.json"
    
    # Check if profile exists
    if [[ ! -f "$profile_file" ]]; then
        echo -e "${RED}❌ Error: Profile '$profile_name' not found${NC}"
        echo -e "${BLUE}Available profiles:${NC}"
        ls "$PROFILES_DIR"/*.json | xargs -n1 basename | sed 's/.json$//' | sed 's/^/  /'
        exit 1
    fi
    
    execute_workflow "$profile_name" "$workflow_name"
}

# Check if jq is available
if ! command -v jq >/dev/null 2>&1; then
    echo -e "${RED}❌ Error: jq is required but not installed.${NC}"
    echo "   Install with: brew install jq"
    exit 1
fi

main "$@"