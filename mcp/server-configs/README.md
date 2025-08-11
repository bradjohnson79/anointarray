# MCP Server Configurations

This directory contains JSON configurations for all Model Context Protocol (MCP) servers used in the anointarray.com development workflow.

## Directory Structure

```
server-configs/
├── active/           # Currently deployed server configurations
├── recommended/      # Recommended servers for installation
├── templates/        # Configuration templates
├── scripts/          # Management and deployment scripts
└── README.md         # This file
```

## Active Servers

### Core Infrastructure
- **serena.json** - Custom development assistant server
- **supabase.json** - Database operations and management
- **vercel.json** - Deployment and hosting management
- **github.json** - Repository management and Git operations

### Development & Testing
- **puppeteer.json** - Browser automation and testing
- **semgrep.json** - Security analysis and code scanning

## Recommended Servers (Pending Installation)

### Development Acceleration
- **context7.json** - Live documentation integration for Next.js/React
- **sequential-thinking.json** - Complex task breakdown and planning
- **memory-bank.json** - Persistent knowledge across sessions

### API & TypeScript Development
- **apidog.json** - OpenAPI specification and TypeScript generation
- **playwright.json** - Advanced browser testing
- **filesystem.json** - Enhanced file operations

### Productivity
- **buildable.json** - AI-powered project management
- **composio.json** - 250+ tool integrations
- **azure.json** - Multi-cloud resource management

## Usage

### Export Current Settings
```bash
./scripts/backup-configs.sh
```

### Install New Server
```bash
./scripts/install-server.sh recommended/context7.json
```

### Update Server Configuration
```bash
./scripts/update-server.sh serena
```

### Restore All Configurations
```bash
./scripts/restore-configs.sh
```

## Configuration Format

Each server configuration follows this standardized format:

```json
{
  "name": "server-name",
  "description": "Purpose and capabilities",
  "command": "execution command",
  "args": ["arguments"],
  "env": {
    "environment": "variables"
  },
  "capabilities": ["list", "of", "features"],
  "priority": "high/medium/low",
  "dependencies": ["required", "packages"],
  "documentation": "link to docs",
  "status": "active/inactive/recommended"
}
```

## Development Benefits

This centralized configuration system provides:

- **Version Control**: All server configurations tracked in Git
- **Easy Deployment**: One-command server installation
- **Disaster Recovery**: Complete backup and restoration
- **Documentation**: Clear server capabilities and dependencies
- **Scalability**: Easy addition/removal of servers

## Maintenance

Server configurations should be updated when:
- Adding new environment variables
- Changing server locations or dependencies
- Updating server capabilities
- Modifying priority levels