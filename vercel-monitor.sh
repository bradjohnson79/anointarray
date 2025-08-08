#!/bin/bash

# ANOINT Array Vercel Deployment Monitor
# API Token: 8ewKwtgf5sVqCD9mzjUq8yhF
# Project ID: prj_rc4JpBUeOGNDdts7FApnqxopbeC0

API_TOKEN="8ewKwtgf5sVqCD9mzjUq8yhF"
PROJECT_ID="prj_rc4JpBUeOGNDdts7FApnqxopbeC0"
PROJECT_NAME="anointarray"

echo "=== ANOINT Array Deployment Monitor ==="
echo "$(date)"
echo ""

# Function to check deployment status
check_deployments() {
    echo "📊 Recent Deployments Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    # Get the last 5 deployments
    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=5" \
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
    FAILED_DEPLOYMENT=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=10" \
        | jq -r '.deployments[] | select(.readyState == "ERROR") | .id' | head -1)
    
    if [ "$FAILED_DEPLOYMENT" = "null" ] || [ -z "$FAILED_DEPLOYMENT" ]; then
        echo "No recent failed deployments found."
    else
        echo "Latest failed deployment: $FAILED_DEPLOYMENT"
        echo ""
        echo "Error logs:"
        curl -s -H "Authorization: Bearer $API_TOKEN" \
            "https://api.vercel.com/v2/deployments/$FAILED_DEPLOYMENT/events" \
            | jq -r '.[] | select(.type == "stderr") | .payload.text' \
            | grep -E "(Error|Failed|⨯)" | tail -10
    fi
    echo ""
}

# Function to check environment variables
check_env_vars() {
    echo "🔧 Environment Variables Status:"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    
    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.vercel.com/v9/projects/$PROJECT_ID" \
        | jq -r '.env[] | .key' \
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
    
    curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.vercel.com/v9/projects/$PROJECT_ID" \
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
    RECENT_DEPLOYMENT=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=1" \
        | jq -r '.deployments[0].id')
    
    if [ "$RECENT_DEPLOYMENT" != "null" ] && [ -n "$RECENT_DEPLOYMENT" ]; then
        echo "Checking deployment: $RECENT_DEPLOYMENT"
        AUTH_ERRORS=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
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
    CURRENT_STATUS=$(curl -s -H "Authorization: Bearer $API_TOKEN" \
        "https://api.vercel.com/v6/deployments?projectId=$PROJECT_ID&limit=1" \
        | jq -r '.deployments[0].readyState')
    
    echo "Current deployment status: $CURRENT_STATUS"
    
    # Create a simple monitoring flag file
    MONITOR_FILE="/tmp/anoint-array-status"
    echo "$CURRENT_STATUS" > "$MONITOR_FILE"
    
    echo "Monitor file created: $MONITOR_FILE"
    echo "Run this script periodically to monitor status changes."
    echo ""
}

# Main execution
main() {
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