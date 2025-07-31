#!/bin/bash

# Netlify build script that handles environment variables
echo "🔨 Starting Netlify build..."

# Always use the correct values to avoid truncation issues
echo "🔧 Setting up environment variables..."
export VITE_SUPABASE_URL="https://xmnghciitiefbwxzhgrw.supabase.co"
export VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4"

echo "✅ Environment variables set"
echo "📏 URL length: ${#VITE_SUPABASE_URL}"
echo "📏 Key length: ${#VITE_SUPABASE_ANON_KEY}"

# Run the build
echo "📦 Running npm build..."
npm run build

echo "✅ Build complete!"