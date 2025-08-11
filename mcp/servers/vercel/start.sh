#!/bin/bash
# Wrapper script to start Vercel MCP server with proper environment
cd "$(dirname "$0")"
export VERCEL_TOKEN=${VERCEL_TOKEN:-TCVidCUpIdBpM3NE6wHghz93}
export VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-prj_rc4JpBUeOGNDdts7FApnqxopbeC0}
export VERCEL_PROJECT_NAME=${VERCEL_PROJECT_NAME:-anointarray}
npm start