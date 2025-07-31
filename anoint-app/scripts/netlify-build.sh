#!/bin/bash

# Netlify build script that handles environment variables
echo "🔨 Starting Netlify build..."

# Check if environment variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
  echo "⚠️  VITE_SUPABASE_URL not set in Netlify environment"
  # Use the production values as fallback
  export VITE_SUPABASE_URL="https://xmnghciitiefbwxzhgrw.supabase.co"
  echo "✅ Using fallback URL"
fi

if [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
  echo "⚠️  VITE_SUPABASE_ANON_KEY not set in Netlify environment"
fi

# Run the build
echo "📦 Running npm build..."
npm run build

echo "✅ Build complete!"