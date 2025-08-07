# ANOINT Array - PM2 Localhost Automation Guide

## 🎯 **Quick Start**

Your ANOINT Array application is now running autonomously with PM2!

### **Essential Commands**

```bash
# Start ANOINT Array
./start-localhost.sh

# Check status
./status-localhost.sh

# Restart application
./restart-localhost.sh

# Stop application
./stop-localhost.sh
```

## 🌐 **Access Your Application**

- **Primary URL**: http://localhost:3001
- **Network URL**: http://10.0.0.193:3001 (accessible from other devices)

## 📊 **Monitoring & Management**

### **PM2 Commands**
```bash
# View all processes
pm2 status

# View real-time logs
pm2 logs anoint-array

# View specific number of log lines
pm2 logs anoint-array --lines 50

# Real-time monitoring dashboard
pm2 monit

# Restart application
pm2 restart anoint-array

# Stop application
pm2 stop anoint-array

# Delete from PM2 (removes completely)
pm2 delete anoint-array
```

### **Log Files**
- **All logs**: `./logs/anoint-array.log`
- **Output logs**: `./logs/anoint-array-out.log`
- **Error logs**: `./logs/anoint-array-error.log`

## 🔄 **Auto-Restart Features**

PM2 automatically handles:
- ✅ **Crash Recovery**: Restarts if application crashes
- ✅ **File Watching**: Restarts on code changes (development mode)
- ✅ **Memory Management**: Restarts if memory usage exceeds limit
- ✅ **Process Monitoring**: Continuous health checks

## 🚀 **Boot Persistence** (Optional)

To make ANOINT Array start automatically when you boot your Mac:

1. **Enable PM2 Startup**:
   ```bash
   pm2 startup
   ```

2. **Copy and run the command it provides** (requires password):
   ```bash
   sudo env PATH=$PATH:/usr/local/bin [command from step 1]
   ```

3. **Save current process list**:
   ```bash
   pm2 save
   ```

## ⚙️ **Configuration**

### **Ecosystem Config** (`ecosystem.config.js`)
- **Port**: 3001 (to avoid conflicts)
- **File Watching**: Enabled for development
- **Memory Limit**: 500MB restart threshold
- **Max Restarts**: 10 attempts
- **Restart Delay**: 1 second

### **Watched Directories**
- `app/` - Next.js pages and components
- `components/` - React components
- `lib/` - Utility libraries
- `contexts/` - React contexts

### **Ignored Directories**
- `node_modules/` - Dependencies
- `.next/` - Next.js build cache
- `.git/` - Git repository
- `logs/` - PM2 log files

## 🛠 **Troubleshooting**

### **Application Won't Start**
```bash
# Check PM2 status
pm2 status

# View detailed logs
pm2 logs anoint-array --lines 50

# Delete and restart fresh
pm2 delete anoint-array
./start-localhost.sh
```

### **Port Already in Use**
```bash
# Kill process on port 3001
lsof -ti:3001 | xargs kill -9

# Restart ANOINT Array
./restart-localhost.sh
```

### **High Memory Usage**
```bash
# Check memory usage
pm2 monit

# Restart to clear memory
./restart-localhost.sh
```

### **File Changes Not Detected**
```bash
# Restart with fresh file watching
pm2 restart anoint-array --watch
```

## 📱 **Development Workflow**

### **Daily Usage**
1. **Boot Mac** → ANOINT Array auto-starts (if boot persistence enabled)
2. **Visit** http://localhost:3001 → Application ready
3. **Edit Code** → Auto-reload happens automatically
4. **Close Laptop** → PM2 keeps running in background

### **Development Commands**
```bash
# Quick status check
./status-localhost.sh

# View recent activity
pm2 logs anoint-array --lines 20

# Real-time log monitoring
pm2 logs anoint-array -f

# Performance monitoring
pm2 monit
```

## 🎯 **Demo Accounts**

- **Admin**: `info@anoint.me` / `Admin123`
- **Member**: `bradjohnson79@gmail.com` / `Admin123`

## 🔧 **Advanced Features**

### **Environment Switching**
```bash
# Development mode (default)
NODE_ENV=development pm2 restart anoint-array

# Production mode
NODE_ENV=production pm2 restart anoint-array
```

### **Multiple Instances** (for production)
```bash
# Run 4 instances with load balancing
pm2 start ecosystem.config.js -i 4
```

### **Custom Memory Limit**
```bash
# Restart with different memory limit
pm2 restart anoint-array --max-memory-restart 1G
```

## ✨ **Benefits You Now Have**

- 🚀 **Zero Manual Startup**: Never run `npm run dev` again
- 🔄 **Auto-Recovery**: Restarts on crashes or code changes  
- 📊 **Monitoring**: Real-time performance and log monitoring
- 💾 **Persistence**: Survives computer restarts (when configured)
- ⚡ **Hot Reload**: File changes automatically restart application
- 🛡️ **Process Management**: Professional-grade application lifecycle management

---

**🎉 Your ANOINT Array localhost is now fully automated!** 

Just like the self-healing AI features built into the application, your development environment now heals and maintains itself. ✨