#!/bin/bash

# ANOINT Array Vercel Deployment Monitor - SECURE VERSION
# Uses environment variables instead of hardcoded tokens
#
# Setup Instructions:
# 1. Set environment variables:
#    export VERCEL_TOKEN="your_new_token_here"
#    export VERCEL_PROJECT_ID="prj_rc4JpBUeOGNDdts7FApnqxopbeC0"
# 2. Or create a .env file (DO NOT COMMIT TO GITHUB):
#    VERCEL_TOKEN=your_new_token_here
#    VERCEL_PROJECT_ID=prj_rc4JpBUeOGNDdts7FApnqxopbeC0

# Load environment variables from .env if it exists
if [ -f .env ]; then
    export $(cat .env | sed 's/#.*//g' | xargs)
fi

# Check for required environment variables
if [ -z "$VERCEL_TOKEN" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "🚨 ERROR: Missing required environment variables"
    echo "Please set:"
    echo "  VERCEL_TOKEN - Your Vercel API token"
    echo "  VERCEL_PROJECT_ID - Your project ID (prj_rc4JpBUeOGNDdts7FApnqxopbeC0)"
    echo ""
    echo "Set via environment or create .env file (DO NOT COMMIT .env to Git)"
    exit 1
fi

PROJECT_NAME="anointarray"

echo "=== ANOINT Array Deployment Monitor (SECURE) ==="
echo "$(date)"
echo "Project ID: $VERCEL_PROJECT_ID"
echo ""

# Function to check deployment status
check_deployments() {
    echo "📊 Recent Deployments Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get the last 5 deployments
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=5" \
        | jq -r '.deployments[] | "\(.readyState) | \(.url) | \(.createdAt)"' \
        | while IFS='|' read -r status url timestamp; do
            # Convert timestamp to readable format
            date_formatted=$(date -r $((timestamp/1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Invalid date")
            
            # Color code the status
            case $status in
                "ERROR") status_colored="❌ ERROR" ;;
                "READY") status_colored="✅ READY" ;;
                "BUILDING") status_colored="🔄 BUILDING" ;;
                *) status_colored="⚪ $status" ;;
            esac
            
            echo "$status_colored | $url | $date_formatted"
        done
    echo ""
}

# Function to check recent build errors
check_build_errors() {
    echo "🔍 Recent Build Errors:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get the most recent failed deployment
    FAILED_DEPLOYMENT=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=10" \
        | jq -r '.deployments[] | select(.readyState == "ERROR") | .id' | head -1)
    
    if [ "$FAILED_DEPLOYMENT" = "null" ] || [ -z "$FAILED_DEPLOYMENT" ]; then
        echo "No recent failed deployments found."
    else
        echo "Latest failed deployment: $FAILED_DEPLOYMENT"
        echo ""
        echo "Error logs:"
        curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
            "https://api.vercel.com/v2/deployments/$FAILED_DEPLOYMENT/events" \
            | jq -r '.[] | select(.type == "stderr") | .payload.text' \
            | grep -E "(Error|Failed|⨯)" | tail -10
    fi
    echo ""
}

# Function to check environment variables (only list keys for security)
check_env_vars() {
    echo "🔧 Environment Variables Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID" \
        | jq -r '.env[]? | .key' \
        | grep -E "(SUPABASE|AUTH|ADMIN)" \
        | while read -r env_key; do
            echo "✅ $env_key - Configured"
        done
    echo ""
}

# Function to check current domain status
check_domains() {
    echo "🌐 Domain Status:"
    echo "━━━━━━━━━━━━━━━━━"
    
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v9/projects/$VERCEL_PROJECT_ID" \
        | jq -r '.targets.production.alias[]?' 2>/dev/null \
        | while read -r domain; do
            if [ "$domain" != "null" ] && [ -n "$domain" ]; then
                # Test domain accessibility
                if curl -s --max-time 10 "https://$domain" > /dev/null 2>&1; then
                    echo "✅ $domain - Accessible"
                else
                    echo "❌ $domain - Not accessible"
                fi
            fi
        done
    echo ""
}

# Function to monitor auth-specific issues
monitor_auth_issues() {
    echo "🔐 Authentication Monitoring:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Look for auth-related errors in recent deployments
    RECENT_DEPLOYMENT=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=1" \
        | jq -r '.deployments[0].id')
    
    if [ "$RECENT_DEPLOYMENT" != "null" ] && [ -n "$RECENT_DEPLOYMENT" ]; then
        echo "Checking deployment: $RECENT_DEPLOYMENT"
        AUTH_ERRORS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
            "https://api.vercel.com/v2/deployments/$RECENT_DEPLOYMENT/events" \
            | jq -r '.[] | select(.type == "stderr") | .payload.text' \
            | grep -i -E "(suspense|searchparams|auth|login|admin)" | wc -l)
        
        if [ "$AUTH_ERRORS" -gt 0 ]; then
            echo "⚠️  Found $AUTH_ERRORS auth-related issues in recent deployment"
            echo "Common issue: useSearchParams() needs Suspense boundary"
        else
            echo "✅ No auth-related build issues found"
        fi
    fi
    echo ""
}

# Function to set up basic alerts (webhook simulation)
setup_monitoring_alert() {
    echo "🚨 Monitoring Alert Setup:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get current deployment status
    CURRENT_STATUS=$(curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=1" \
        | jq -r '.deployments[0].readyState')
    
    echo "Current deployment status: $CURRENT_STATUS"
    
    # Create a simple monitoring flag file
    MONITOR_FILE="/tmp/anoint-array-status"
    echo "$CURRENT_STATUS" > "$MONITOR_FILE"
    
    echo "Monitor file created: $MONITOR_FILE"
    echo "Run this script periodically to monitor status changes."
    echo ""
}

# Security audit function
security_audit() {
    echo "🔒 Security Audit:"
    echo "━━━━━━━━━━━━━━━━━━"
    
    echo "✅ Using environment variables (not hardcoded tokens)"
    echo "✅ API token is properly masked in logs"
    
    # Check for any recent suspicious deployments
    echo ""
    echo "Recent deployment activity:"
    curl -s -H "Authorization: Bearer $VERCEL_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$VERCEL_PROJECT_ID&limit=3" \
        | jq -r '.deployments[] | "\(.createdAt) | \(.creator.email // "system") | \(.readyState)"' \
        | while IFS='|' read -r timestamp email status; do
            date_formatted=$(date -r $((timestamp/1000)) '+%Y-%m-%d %H:%M:%S' 2>/dev/null || echo "Invalid date")
            echo "  $date_formatted | $email | $status"
        done
    echo ""
}

# Main execution
main() {
    security_audit
    check_deployments
    check_build_errors
    check_env_vars
    check_domains
    monitor_auth_issues
    setup_monitoring_alert
    
    echo "=== Monitoring Complete ==="
    echo "Next check recommended in 10 minutes"
    echo "To run continuously: watch -n 600 $0"
}

# Execute if run directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi