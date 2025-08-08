# 🚀 ANOINT Array MCP Quick Start Guide

Get your MCP server ecosystem up and running in minutes and achieve **10x development speed** immediately.

## ⚡ 5-Minute Setup

### Step 1: Install MCP Ecosystem
```bash
# Install and configure all MCP servers automatically
npm run mcp:install
```

### Step 2: Configure Environment
```bash
# The installer creates .env.mcp.local - add your API keys:
# Required for immediate functionality:
SUPABASE_SERVICE_KEY=your_supabase_service_key
GITHUB_TOKEN=your_github_token
VERCEL_API_TOKEN=your_vercel_token

# Optional but recommended:
GITHUB_OWNER=bradjohnson79
GITHUB_REPO=anointarray
VERCEL_TEAM_ID=your_team_id
```

### Step 3: Start Development Servers
```bash
# Start all MCP servers with hot reload
npm run mcp:dev

# Verify everything is running
npm run mcp:dev:status
```

## 🎯 Immediate Benefits

### Instant Database Management
```bash
# Query your Supabase database directly
# Check user profiles and admin status
# Manage RLS policies automatically
# Real-time schema inspection
```

### Automated Build Optimization  
```bash
# Intelligent dependency analysis
# Automated performance optimizations
# Parallel build processing
# Smart error detection and auto-fix
```

### Seamless Deployment Automation
```bash
# One-command deployments to Vercel
# Automatic environment sync
# Real-time deployment monitoring
# Edge configuration management
```

### GitHub DevOps Integration
```bash
# Automated PR creation and management
# Intelligent code review assistance
# Security scanning and vulnerability management
# Release automation
```

## 🔥 Power User Commands

### Development Workflow
```bash
# Start development with full MCP integration
npm run mcp:dev && npm run dev

# Monitor all systems in real-time
npm run mcp:dev:status
npm run mcp:health

# View live logs from all servers
npm run mcp:logs
```

### Production Deployment
```bash
# Production-ready server startup
npm run mcp:start

# Health check before deployment  
npm run mcp:health

# Deploy with full automation
npm run build && npm run mcp:deploy
```

### Emergency Operations
```bash
# Stop all servers immediately
npm run mcp:stop
npm run mcp:dev:stop

# Restart specific problematic services
./mcp/scripts/restart-dev.sh supabase
./mcp/scripts/restart-dev.sh serena
```

## 🎮 Interactive Usage Examples

### Database Operations
The Supabase MCP server provides instant database access:
- **Schema Inspection**: Automatic database structure analysis
- **Migration Management**: Intelligent migration generation and application
- **User Management**: Streamlined authentication and role management
- **Real-time Subscriptions**: Live data synchronization

### Build Optimization
Serena automatically optimizes your builds:
- **Performance Analysis**: Real-time build metrics and optimization suggestions
- **Dependency Management**: Automated security updates and conflict resolution
- **Error Recovery**: AI-powered error diagnosis and automatic fixes
- **Parallel Processing**: Multi-core build optimization

### Deployment Automation
Vercel integration provides seamless deployments:
- **Environment Sync**: Automatic environment variable synchronization
- **Preview Deployments**: Instant preview environments for every commit
- **Performance Monitoring**: Real-time performance metrics and optimization
- **Edge Configuration**: Global CDN and edge function management

### GitHub Automation
Complete DevOps workflow automation:
- **PR Automation**: Intelligent pull request management and review
- **Security Scanning**: Continuous vulnerability detection and patching
- **Release Management**: Automated versioning and release deployment
- **Code Quality**: Automated code review and quality assurance

## 📊 Monitoring & Debugging

### Real-time Status Monitoring
```bash
# Check all server status
npm run mcp:status

# Development server status
npm run mcp:dev:status

# Comprehensive health check
npm run mcp:health
```

### Log Analysis
```bash
# View all server logs
npm run mcp:logs

# Individual server logs
tail -f mcp/logs/supabase-dev.log
tail -f mcp/logs/serena-dev.log
tail -f mcp/logs/vercel-dev.log
tail -f mcp/logs/github-dev.log
```

### Performance Metrics
Each server provides detailed metrics:
- **Build Performance**: Speed, optimization, and resource usage
- **Deployment Success Rates**: Deployment reliability and rollback metrics  
- **Database Operations**: Query performance and optimization suggestions
- **API Usage**: Rate limiting, error rates, and performance analytics

## 🛠️ Troubleshooting

### Common Issues & Solutions

**Servers won't start:**
```bash
# Check environment configuration
cat .env.mcp.local

# Verify dependencies
npm install

# Check port availability
lsof -i :3001-3008
```

**Build optimization not working:**
```bash
# Restart Serena build server
./mcp/scripts/restart-dev.sh serena

# Check build logs
tail -f mcp/logs/serena-dev.log
```

**Deployment issues:**
```bash
# Verify Vercel token
npm run mcp:health

# Check deployment logs
tail -f mcp/logs/vercel-dev.log
```

**Database connectivity:**
```bash
# Test Supabase connection
./mcp/scripts/health-check.sh

# Verify service key in .env.mcp.local
grep SUPABASE_SERVICE_KEY .env.mcp.local
```

## 🚀 Advanced Features

### Custom Server Development
Extend the ecosystem with custom servers:
```bash
# Create new server template
mkdir mcp/servers/my-server
cp -r mcp/servers/supabase/package.json mcp/servers/my-server/
# Edit and customize for your needs
```

### Integration with CI/CD
```bash
# Add MCP to your GitHub Actions
# Automatic deployment with full MCP integration
# Performance monitoring and alerting
# Automated rollback on failure
```

### Scaling & Performance
```bash
# Configure parallel processing
export SERENA_BUILD_PARALLELISM=8

# Enable aggressive optimization
export SERENA_AUTO_OPTIMIZE=true

# Configure resource limits
export MCP_MEMORY_LIMIT=8192mb
```

## 🎯 Next Steps

1. **Explore Individual Servers**: Check `/mcp/servers/*/README.md` for detailed server documentation
2. **Customize Configuration**: Edit `mcp/config/mcp.config.json` for your specific needs  
3. **Integration**: Connect MCP servers to your existing development workflow
4. **Monitoring**: Set up alerts and monitoring for production environments
5. **Optimization**: Fine-tune performance based on your project requirements

## 💡 Pro Tips

- **Start Small**: Begin with Supabase and Serena servers, then add others as needed
- **Monitor Logs**: Keep log monitoring active during development for real-time insights
- **Environment Sync**: Use the Vercel server to keep environments synchronized
- **Automated Testing**: Leverage GitHub integration for comprehensive automated testing
- **Performance First**: Use Serena's optimization features from day one

---

**🎉 You're now ready to experience 10x faster development with ANOINT Array MCP!**

The ecosystem is designed to learn from your patterns and continuously improve performance. Each deployment will be faster, more reliable, and more optimized than the last.

**Need Help?** Check the main documentation in `/mcp/README.md` or individual server documentation for detailed guides.