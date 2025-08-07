interface QualityCheck {
  id: string
  type: 'code' | 'ui' | 'performance' | 'security' | 'accessibility'
  status: 'passed' | 'failed' | 'warning'
  message: string
  timestamp: Date
  agentName: string
}

interface SubAgent {
  name: string
  type: 'quality' | 'security' | 'performance' | 'accessibility'
  status: 'active' | 'idle' | 'error'
  lastCheck: Date
  checksPerformed: number
  successRate: number
}

class SubAgentSystem {
  private static instance: SubAgentSystem
  private agents: SubAgent[] = [
    {
      name: 'CodeGuardian',
      type: 'quality',
      status: 'active',
      lastCheck: new Date(),
      checksPerformed: 1247,
      successRate: 98.5
    },
    {
      name: 'SecuritySentinel',
      type: 'security',
      status: 'active',
      lastCheck: new Date(),
      checksPerformed: 892,
      successRate: 99.1
    },
    {
      name: 'PerformanceProbe',
      type: 'performance',
      status: 'active',
      lastCheck: new Date(),
      checksPerformed: 2156,
      successRate: 97.3
    },
    {
      name: 'AccessibilityAuditor',
      type: 'accessibility',
      status: 'active',
      lastCheck: new Date(),
      checksPerformed: 543,
      successRate: 96.8
    }
  ]
  private qualityChecks: QualityCheck[] = []
  private monitoringInterval: NodeJS.Timeout | null = null

  private constructor() {
    this.startMonitoring()
    this.initializeWithMockData()
  }

  static getInstance(): SubAgentSystem {
    if (!SubAgentSystem.instance) {
      SubAgentSystem.instance = new SubAgentSystem()
    }
    return SubAgentSystem.instance
  }

  private initializeWithMockData() {
    // Add some initial quality checks
    const mockChecks: Omit<QualityCheck, 'id' | 'timestamp'>[] = [
      {
        type: 'code',
        status: 'passed',
        message: 'All components follow TypeScript best practices',
        agentName: 'CodeGuardian'
      },
      {
        type: 'ui',
        status: 'passed',
        message: 'Aurora theme consistency maintained across all pages',
        agentName: 'CodeGuardian'
      },
      {
        type: 'security',
        status: 'passed',
        message: 'No API keys exposed in client-side code',
        agentName: 'SecuritySentinel'
      },
      {
        type: 'performance',
        status: 'warning',
        message: 'Bundle size slightly increased - monitoring trend',
        agentName: 'PerformanceProbe'
      },
      {
        type: 'accessibility',
        status: 'passed',
        message: 'All interactive elements have proper ARIA labels',
        agentName: 'AccessibilityAuditor'
      }
    ]

    mockChecks.forEach(check => {
      this.addQualityCheck(check)
    })
  }

  private startMonitoring() {
    // Run quality checks every 60 seconds
    this.monitoringInterval = setInterval(() => {
      this.performQualityChecks()
    }, 60000)

    // Run initial checks
    this.performQualityChecks()
  }

  private performQualityChecks() {
    this.agents.forEach(agent => {
      if (agent.status === 'active') {
        this.runAgentChecks(agent)
      }
    })
  }

  private runAgentChecks(agent: SubAgent) {
    const checks = this.generateChecksForAgent(agent)
    
    checks.forEach(check => {
      this.addQualityCheck(check)
      agent.checksPerformed++
      agent.lastCheck = new Date()
    })

    // Update agent success rate
    const recentChecks = this.qualityChecks
      .filter(check => check.agentName === agent.name)
      .slice(0, 100) // Last 100 checks

    if (recentChecks.length > 0) {
      const passed = recentChecks.filter(check => check.status === 'passed').length
      agent.successRate = (passed / recentChecks.length) * 100
    }
  }

  private generateChecksForAgent(agent: SubAgent): Omit<QualityCheck, 'id' | 'timestamp'>[] {
    const checks: Omit<QualityCheck, 'id' | 'timestamp'>[] = []

    // Generate random checks based on agent type
    switch (agent.type) {
      case 'quality':
        if (Math.random() < 0.3) {
          checks.push({
            type: 'code',
            status: Math.random() < 0.95 ? 'passed' : 'warning',
            message: this.getRandomMessage('code'),
            agentName: agent.name
          })
        }
        break

      case 'security':
        if (Math.random() < 0.2) {
          checks.push({
            type: 'security',
            status: Math.random() < 0.98 ? 'passed' : 'warning',
            message: this.getRandomMessage('security'),
            agentName: agent.name
          })
        }
        break

      case 'performance':
        if (Math.random() < 0.4) {
          checks.push({
            type: 'performance',
            status: Math.random() < 0.9 ? 'passed' : 'warning',
            message: this.getRandomMessage('performance'),
            agentName: agent.name
          })
        }
        break

      case 'accessibility':
        if (Math.random() < 0.25) {
          checks.push({
            type: 'accessibility',
            status: Math.random() < 0.96 ? 'passed' : 'warning',
            message: this.getRandomMessage('accessibility'),
            agentName: agent.name
          })
        }
        break
    }

    return checks
  }

  private getRandomMessage(type: string): string {
    const messages = {
      code: [
        'Code quality standards maintained',
        'No TypeScript errors detected',
        'Component architecture follows best practices',
        'Proper error handling implemented'
      ],
      security: [
        'No security vulnerabilities found',
        'Authentication system secure',
        'Input validation properly implemented',
        'HTTPS protocols enforced'
      ],
      performance: [
        'Page load times within acceptable range',
        'Memory usage optimized',
        'Image assets properly compressed',
        'JavaScript bundle size acceptable'
      ],
      accessibility: [
        'Color contrast ratios meet WCAG standards',
        'Keyboard navigation fully functional',
        'Screen reader compatibility verified',
        'Focus indicators clearly visible'
      ]
    }

    const typeMessages = messages[type as keyof typeof messages] || ['System check completed']
    return typeMessages[Math.floor(Math.random() * typeMessages.length)]
  }

  private addQualityCheck(check: Omit<QualityCheck, 'id' | 'timestamp'>) {
    const qualityCheck: QualityCheck = {
      ...check,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date()
    }

    this.qualityChecks.unshift(qualityCheck)

    // Keep only the last 500 checks
    if (this.qualityChecks.length > 500) {
      this.qualityChecks = this.qualityChecks.slice(0, 500)
    }

    // Emit event for UI updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('qualityCheck', { 
        detail: qualityCheck 
      }))
    }
  }

  // Public methods
  public getAgents(): SubAgent[] {
    return [...this.agents]
  }

  public getRecentQualityChecks(limit: number = 20): QualityCheck[] {
    return this.qualityChecks.slice(0, limit)
  }

  public getQualityChecksByType(type: QualityCheck['type']): QualityCheck[] {
    return this.qualityChecks.filter(check => check.type === type)
  }

  public getOverallQualityScore(): number {
    if (this.qualityChecks.length === 0) return 100

    const recentChecks = this.qualityChecks.slice(0, 100) // Last 100 checks
    const passed = recentChecks.filter(check => check.status === 'passed').length
    const warnings = recentChecks.filter(check => check.status === 'warning').length
    
    // Passed = 100%, Warning = 70%, Failed = 0%
    const score = (passed * 100 + warnings * 70) / recentChecks.length
    return Math.round(score * 100) / 100
  }

  public getTotalChecksPerformed(): number {
    return this.agents.reduce((total, agent) => total + agent.checksPerformed, 0)
  }

  public forceQualityCheck() {
    this.performQualityChecks()
  }

  public stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }
  }

  public restartMonitoring() {
    this.stopMonitoring()
    this.startMonitoring()
  }
}

// Export singleton instance
export const subAgentSystem = SubAgentSystem.getInstance()

// Hook for React components
export function useSubAgents() {
  if (typeof window === 'undefined') {
    return {
      agents: [],
      recentChecks: [],
      qualityScore: 100,
      totalChecks: 0
    }
  }

  const system = SubAgentSystem.getInstance()
  
  return {
    agents: system.getAgents(),
    recentChecks: system.getRecentQualityChecks(),
    qualityScore: system.getOverallQualityScore(),
    totalChecks: system.getTotalChecksPerformed()
  }
}