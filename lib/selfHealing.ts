interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  performance: number
  errors: string[]
  lastCheck: Date
}

interface HealingAction {
  id: string
  type: 'performance' | 'error' | 'security' | 'maintenance'
  description: string
  timestamp: Date
  success: boolean
}

class SelfHealingSystem {
  private static instance: SelfHealingSystem
  private healingActions: HealingAction[] = []
  private systemHealth: SystemHealth = {
    status: 'healthy',
    uptime: 99.9,
    performance: 97.5,
    errors: [],
    lastCheck: new Date()
  }
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startMonitoring()
  }

  static getInstance(): SelfHealingSystem {
    if (!SelfHealingSystem.instance) {
      SelfHealingSystem.instance = new SelfHealingSystem()
    }
    return SelfHealingSystem.instance
  }

  private startMonitoring() {
    // Check system health every 30 seconds
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck()
    }, 30000)

    // Initial health check
    this.performHealthCheck()
  }

  private performHealthCheck() {
    const issues = this.detectIssues()
    
    if (issues.length > 0) {
      issues.forEach(issue => this.healIssue(issue))
    }

    this.updateSystemHealth()
  }

  private detectIssues(): Array<{type: string, severity: 'low' | 'medium' | 'high', description: string}> {
    const issues = []

    // Simulate various system checks
    if (Math.random() < 0.1) { // 10% chance of performance issue
      issues.push({
        type: 'performance',
        severity: 'medium' as const,
        description: 'High response time detected'
      })
    }

    if (Math.random() < 0.05) { // 5% chance of error
      issues.push({
        type: 'error',
        severity: 'high' as const,
        description: 'Database connection timeout'
      })
    }

    if (Math.random() < 0.03) { // 3% chance of security issue
      issues.push({
        type: 'security',
        severity: 'high' as const,
        description: 'Suspicious login attempt detected'
      })
    }

    return issues
  }

  private healIssue(issue: {type: string, severity: string, description: string}) {
    const healingAction: HealingAction = {
      id: Date.now().toString(),
      type: issue.type as HealingAction['type'],
      description: `Auto-healing: ${issue.description}`,
      timestamp: new Date(),
      success: true
    }

    // Simulate healing actions
    switch (issue.type) {
      case 'performance':
        this.optimizePerformance()
        break
      case 'error':
        this.fixErrors()
        break
      case 'security':
        this.enhanceSecurity()
        break
      default:
        this.performMaintenance()
    }

    this.healingActions.unshift(healingAction)
    
    // Keep only the last 100 actions
    if (this.healingActions.length > 100) {
      this.healingActions = this.healingActions.slice(0, 100)
    }

    // Emit healing event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('selfHealing', { 
        detail: healingAction 
      }))
    }
  }

  private optimizePerformance() {
    // Simulate performance optimization
    this.systemHealth.performance = Math.min(99.9, this.systemHealth.performance + 2)
  }

  private fixErrors() {
    // Simulate error fixing
    this.systemHealth.errors = this.systemHealth.errors.filter(() => 
      Math.random() > 0.7 // 70% chance to fix each error
    )
  }

  private enhanceSecurity() {
    // Simulate security enhancement
    console.log('Security protocols enhanced')
  }

  private performMaintenance() {
    // Simulate maintenance tasks
    this.systemHealth.uptime = Math.min(99.9, this.systemHealth.uptime + 0.1)
  }

  private updateSystemHealth() {
    this.systemHealth.lastCheck = new Date()
    
    // Determine overall status
    if (this.systemHealth.performance > 95 && this.systemHealth.uptime > 99 && this.systemHealth.errors.length === 0) {
      this.systemHealth.status = 'healthy'
    } else if (this.systemHealth.performance > 85 && this.systemHealth.uptime > 95) {
      this.systemHealth.status = 'warning'
    } else {
      this.systemHealth.status = 'critical'
    }
  }

  // Public methods for accessing system data
  public getSystemHealth(): SystemHealth {
    return { ...this.systemHealth }
  }

  public getRecentHealingActions(limit: number = 10): HealingAction[] {
    return this.healingActions.slice(0, limit)
  }

  public getTotalHealingActions(): number {
    return this.healingActions.length
  }

  public getSuccessRate(): number {
    if (this.healingActions.length === 0) return 100
    const successful = this.healingActions.filter(action => action.success).length
    return (successful / this.healingActions.length) * 100
  }

  public forceHealthCheck() {
    this.performHealthCheck()
  }

  public emergencyStop() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  public restart() {
    this.emergencyStop()
    this.startMonitoring()
  }
}

// Export singleton instance
export const selfHealingSystem = SelfHealingSystem.getInstance()

// Hook for React components to use self-healing data
export function useSelfHealing() {
  if (typeof window === 'undefined') {
    return {
      systemHealth: {
        status: 'healthy' as const,
        uptime: 99.9,
        performance: 97.5,
        errors: [],
        lastCheck: new Date()
      },
      recentActions: [],
      totalActions: 0,
      successRate: 100
    }
  }

  const system = SelfHealingSystem.getInstance()
  
  return {
    systemHealth: system.getSystemHealth(),
    recentActions: system.getRecentHealingActions(),
    totalActions: system.getTotalHealingActions(),
    successRate: system.getSuccessRate()
  }
}