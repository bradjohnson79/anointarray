#!/bin/bash

# Deployment script for anoint-next clean rebuild
echo "🚀 Deploying anoint-next clean rebuild to Vercel..."

# Set the working directory
cd "/Users/bradjohnson/Documents/anoint-array/WEBSITE/anoint-next"

# Build the project
echo "📦 Building the application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Aborting deployment."
    exit 1
fi

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --yes \
  --env NEXT_PUBLIC_SUPABASE_URL=https://xmnghciitiefbwxzhgrw.supabase.co \
  --env NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4 \
  --env SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcyMzQ3MywiZXhwIjoyMDY5Mjk5NDczfQ.b0az6NSjpooW2BW9OE3ACPQWU_n0D6yV3v1SQKESB1o

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🔗 Preview URL will be displayed above"
else
    echo "❌ Deployment failed"
    exit 1
fi