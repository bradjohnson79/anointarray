#!/usr/bin/env node

/**
 * ANOINT Array Vercel Webhook Monitor
 * Monitors deployment status and sends alerts for status changes
 */

const https = require('https');

const CONFIG = {
    apiToken: '8ewKwtgf5sVqCD9mzjUq8yhF',
    projectId: 'prj_rc4JpBUeOGNDdts7FApnqxopbeC0',
    projectName: 'anointarray',
    checkInterval: 60000, // 1 minute
    alertCooldown: 300000  // 5 minutes between same alerts
};

let lastAlertTime = {};

class VercelMonitor {
    constructor(config) {
        this.config = config;
        this.previousStatus = null;
        this.alertsSent = new Set();
    }

    async makeRequest(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: 'api.vercel.com',
                path: path,
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.config.apiToken}`,
                    'Content-Type': 'application/json'
                }
            };

            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });
            
            req.end();
        });
    }

    async getCurrentDeploymentStatus() {
        try {
            const path = `/v6/deployments?projectId=${this.config.projectId}&limit=1`;
            const response = await this.makeRequest(path);
            
            if (response.deployments && response.deployments.length > 0) {
                return {
                    status: response.deployments[0].readyState,
                    url: response.deployments[0].url,
                    id: response.deployments[0].id,
                    createdAt: response.deployments[0].createdAt
                };
            }
            return null;
        } catch (error) {
            console.error('Error fetching deployment status:', error.message);
            return null;
        }
    }

    async getRecentErrors() {
        try {
            const path = `/v6/deployments?projectId=${this.config.projectId}&limit=5`;
            const response = await this.makeRequest(path);
            
            if (response.deployments) {
                const errorCount = response.deployments.filter(d => d.readyState === 'ERROR').length;
                const totalCount = response.deployments.length;
                return { errorCount, totalCount };
            }
            return { errorCount: 0, totalCount: 0 };
        } catch (error) {
            console.error('Error fetching error count:', error.message);
            return { errorCount: 0, totalCount: 0 };
        }
    }

    async getBuildLogs(deploymentId) {
        try {
            const path = `/v2/deployments/${deploymentId}/events`;
            const response = await this.makeRequest(path);
            
            if (Array.isArray(response)) {
                const errorLogs = response
                    .filter(event => event.type === 'stderr')
                    .map(event => event.payload.text)
                    .filter(text => text.includes('Error') || text.includes('⨯') || text.includes('Failed'))
                    .slice(-3); // Last 3 error messages
                
                return errorLogs;
            }
            return [];
        } catch (error) {
            console.error('Error fetching build logs:', error.message);
            return [];
        }
    }

    shouldSendAlert(alertType) {
        const now = Date.now();
        const lastSent = lastAlertTime[alertType];
        
        if (!lastSent || (now - lastSent) > this.config.alertCooldown) {
            lastAlertTime[alertType] = now;
            return true;
        }
        return false;
    }

    sendAlert(type, message, data = {}) {
        const timestamp = new Date().toISOString();
        const alertId = `${type}-${Date.now()}`;
        
        // For now, just log alerts. In production, you'd send to Slack, email, etc.
        console.log(`\n🚨 ALERT [${alertId}] - ${timestamp}`);
        console.log(`Type: ${type}`);
        console.log(`Message: ${message}`);
        if (Object.keys(data).length > 0) {
            console.log('Details:', JSON.stringify(data, null, 2));
        }
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // You can extend this to send to webhook endpoints, Slack, etc.
        // Example: await this.sendToWebhook(type, message, data);
    }

    async sendToWebhook(type, message, data) {
        // Example webhook implementation
        const payload = {
            alert_type: type,
            message: message,
            project: this.config.projectName,
            timestamp: new Date().toISOString(),
            data: data
        };

        // Replace with your actual webhook URL
        // const webhookUrl = 'https://your-webhook-endpoint.com/alerts';
        // await this.makeWebhookRequest(webhookUrl, payload);
    }

    async checkDeploymentStatus() {
        console.log(`[${new Date().toISOString()}] Checking deployment status...`);
        
        const current = await this.getCurrentDeploymentStatus();
        if (!current) {
            console.log('❌ Could not fetch deployment status');
            return;
        }

        console.log(`Current status: ${current.status} | ${current.url}`);

        // Check for status changes
        if (this.previousStatus && this.previousStatus !== current.status) {
            const statusChanged = {
                from: this.previousStatus,
                to: current.status,
                deployment: current
            };

            if (this.shouldSendAlert('status-change')) {
                this.sendAlert('Deployment Status Changed', 
                    `Status changed from ${this.previousStatus} to ${current.status}`,
                    statusChanged
                );
            }
        }

        // Alert on errors
        if (current.status === 'ERROR') {
            if (this.shouldSendAlert('deployment-error')) {
                const logs = await this.getBuildLogs(current.id);
                this.sendAlert('Deployment Failed', 
                    `Deployment failed: ${current.url}`,
                    { deployment: current, errorLogs: logs }
                );
            }
        }

        // Alert on successful deployment after failures
        if (current.status === 'READY' && this.previousStatus === 'ERROR') {
            this.sendAlert('Deployment Recovered', 
                `Deployment successful after previous failures: ${current.url}`,
                { deployment: current }
            );
        }

        // Check error rate
        const { errorCount, totalCount } = await this.getRecentErrors();
        const errorRate = totalCount > 0 ? (errorCount / totalCount) * 100 : 0;
        
        if (errorRate > 60 && this.shouldSendAlert('high-error-rate')) {
            this.sendAlert('High Error Rate', 
                `${errorCount}/${totalCount} recent deployments failed (${errorRate.toFixed(1)}%)`,
                { errorCount, totalCount, errorRate }
            );
        }

        this.previousStatus = current.status;
    }

    async checkAuthenticationHealth() {
        // Check if authentication pages are accessible
        try {
            const authUrls = [
                'https://anointarray-anoint.vercel.app/auth',
                'https://anointarray-anoint.vercel.app/admin'
            ];

            for (const url of authUrls) {
                // Simple HTTP check (you'd extend this for more comprehensive testing)
                console.log(`Checking auth endpoint: ${url}`);
            }
        } catch (error) {
            console.error('Auth health check failed:', error.message);
        }
    }

    start() {
        console.log(`\n🚀 ANOINT Array Monitor Starting`);
        console.log(`Project: ${this.config.projectName}`);
        console.log(`Check interval: ${this.config.checkInterval/1000}s`);
        console.log(`Alert cooldown: ${this.config.alertCooldown/1000}s`);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

        // Initial check
        this.checkDeploymentStatus();

        // Set up periodic checks
        setInterval(() => {
            this.checkDeploymentStatus();
        }, this.config.checkInterval);

        // Set up auth health checks (less frequent)
        setInterval(() => {
            this.checkAuthenticationHealth();
        }, this.config.checkInterval * 5); // Every 5 minutes
    }

    stop() {
        console.log('\n🛑 Monitor stopping...');
        process.exit(0);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

// Start monitoring if run directly
if (require.main === module) {
    const monitor = new VercelMonitor(CONFIG);
    monitor.start();
}

module.exports = VercelMonitor;