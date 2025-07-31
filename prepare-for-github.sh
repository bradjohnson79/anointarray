#!/bin/bash

# ANOINT Array - Prepare for GitHub Script
# This script helps prepare your project for GitHub upload

echo "🔮 ANOINT Array - GitHub Preparation Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -d "anoint-app" ]; then
    echo "❌ Error: anoint-app directory not found!"
    echo "Please run this script from the WEBSITE directory"
    exit 1
fi

echo "✅ Found anoint-app directory"

# Check for sensitive files
echo ""
echo "🔍 Checking for sensitive files..."

if [ -f "anoint-app/.env.local" ]; then
    echo "⚠️  Warning: .env.local file found"
    echo "   This file should NOT be committed to GitHub"
    echo "   Make sure it's in .gitignore"
fi

# Create a comprehensive .gitignore at root level
echo ""
echo "📝 Creating root .gitignore..."
cat > .gitignore << 'EOF'
# Environment files
.env
.env.local
.env.production.local
.env.development.local
.env.test.local
*.local

# Dependencies
node_modules/
dist/
build/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Test coverage
coverage/
.nyc_output/

# Temporary files
*.tmp
*.temp
.cache/

# Supabase
supabase/.env
supabase/config.toml
EOF

echo "✅ Root .gitignore created"

# Create example environment file if it doesn't exist
if [ ! -f "anoint-app/.env.local.example" ]; then
    echo ""
    echo "📝 Creating .env.local.example..."
    cat > anoint-app/.env.local.example << 'EOF'
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Service Role Key (for admin operations like user seeding)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# To get these values:
# 1. Go to https://supabase.com and create a project
# 2. In your project dashboard, go to Settings > API
# 3. Copy the values and replace the placeholders above
EOF
    echo "✅ .env.local.example created"
fi

# Summary
echo ""
echo "📊 Summary"
echo "=========="
echo "✅ Project structure verified"
echo "✅ .gitignore files in place"
echo "✅ Example environment file created"
echo ""
echo "⚠️  IMPORTANT REMINDERS:"
echo "   1. Never commit .env.local or any file with real API keys"
echo "   2. Review all files before pushing to GitHub"
echo "   3. Make sure Supabase service role key is kept secret"
echo ""
echo "📌 Next Steps:"
echo "   1. Review the files to ensure no sensitive data"
echo "   2. Initialize git if not already: git init"
echo "   3. Add remote: git remote add origin https://github.com/bradjohnson79/anoint-array.git"
echo "   4. Add files: git add ."
echo "   5. Commit: git commit -m 'Initial commit: ANOINT Array project'"
echo "   6. Push: git push -u origin main"
echo ""
echo "🚀 Your project is ready for GitHub!"