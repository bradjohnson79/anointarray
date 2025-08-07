'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Bot, Activity, AlertTriangle, CheckCircle, Clock, RotateCcw, Download, Eye, Zap, Shield } from 'lucide-react'

interface RepairLog {
  id: string
  timestamp: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  status: 'in_progress' | 'completed' | 'failed' | 'rolled_back'
  issueType: string
  userReport: string
  oracleAnalysis: string
  claudeRepair: string
  filesModified: string[]
  rollbackAvailable: boolean
  executionTime: number
  handoffId?: string
}

interface SystemBackup {
  id: string
  timestamp: string
  description: string
  size: string
  preRepairSnapshot: boolean
  repairLogId?: string
}

export default function AISystemsPage() {
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'backups'>('overview')
  const [selectedLog, setSelectedLog] = useState<RepairLog | null>(null)
  const [systemStatus, setSystemStatus] = useState({
    oracleOnline: true,
    claudeOnline: true,
    activeRepairs: 0,
    totalRepairs: 47,
    successRate: 98.2,
    avgRepairTime: 3.4
  })

  // Mock repair logs data
  const [repairLogs] = useState<RepairLog[]>([
    {
      id: 'repair_1754031876542_6fjb04iyn',
      timestamp: '2025-08-01T06:45:23.123Z',
      priority: 'medium',
      status: 'completed',
      issueType: 'UI Interaction Issue',
      userReport: 'Login button hover effect not working on Safari browsers',
      oracleAnalysis: 'Detected CSS vendor prefix issue in login component. Safari requires -webkit- prefix for hover transitions.',
      claudeRepair: 'Applied -webkit-transition prefix to button hover states in login.tsx. Preserved all existing functionality and design.',
      filesModified: ['/app/login/page.tsx', '/app/globals.css'],
      rollbackAvailable: true,
      executionTime: 2.8,
      handoffId: 'handoff_oracle_claude_001'
    },
    {
      id: 'repair_1754031456789_9kln12xyz',
      timestamp: '2025-08-01T05:22:17.456Z',
      priority: 'high',
      status: 'completed',
      issueType: 'Authentication Flow',
      userReport: 'Login form occasionally shows loading state indefinitely',
      oracleAnalysis: 'Identified race condition in authentication context. Missing timeout handling in login submission.',
      claudeRepair: 'Added 10-second timeout to login function with proper error handling. Maintained exact UX flow.',
      filesModified: ['/contexts/AuthContext.tsx', '/lib/auth.ts'],
      rollbackAvailable: true,
      executionTime: 4.2,
      handoffId: 'handoff_oracle_claude_002'
    },
    {
      id: 'repair_1754030123456_3def67abc',
      timestamp: '2025-08-01T03:15:45.789Z',
      priority: 'low',
      status: 'completed',
      issueType: 'Performance Issue',
      userReport: 'Analytics page loads slowly with large datasets',
      oracleAnalysis: 'Performance bottleneck in analytics data rendering. Missing virtualization for large tables.',
      claudeRepair: 'Implemented lazy loading and pagination for analytics tables. Improved performance by 67%.',
      filesModified: ['/app/admin/analytics/page.tsx'],
      rollbackAvailable: true,
      executionTime: 6.1,
      handoffId: 'handoff_oracle_claude_003'
    },
    {
      id: 'repair_1754029876543_8hij90klm',
      timestamp: '2025-08-01T01:33:12.234Z',
      priority: 'critical',
      status: 'completed',
      issueType: 'API Response Issue',
      userReport: 'AI chatbot returns 500 error when processing certain queries',
      oracleAnalysis: 'Critical error in ChatGPT API response parsing. Missing null checks for edge cases.',
      claudeRepair: 'Added comprehensive error handling and fallback responses. System now handles all edge cases gracefully.',
      filesModified: ['/app/api/self-healing-ai/route.ts', '/lib/selfHealingAI.ts'],
      rollbackAvailable: true,
      executionTime: 8.7,
      handoffId: 'handoff_oracle_claude_004'
    },
    {
      id: 'repair_1754028765432_5nop12qrs',
      timestamp: '2025-07-31T22:18:56.567Z',
      priority: 'medium',
      status: 'rolled_back',
      issueType: 'Rendering Issue',
      userReport: 'Dashboard widgets not displaying correctly on mobile',
      oracleAnalysis: 'Mobile responsive design issue in dashboard grid layout.',
      claudeRepair: 'Modified grid responsive classes but caused layout shift on desktop. Rolled back after 15 minutes.',
      filesModified: ['/app/admin/dashboard/page.tsx'],
      rollbackAvailable: false,
      executionTime: 3.9,
      handoffId: 'handoff_oracle_claude_005'
    }
  ])

  // Mock system backups
  const [systemBackups] = useState<SystemBackup[]>([
    {
      id: 'backup_pre_repair_6fjb04iyn',
      timestamp: '2025-08-01T06:45:20.000Z',
      description: 'Pre-repair snapshot before login button fix',
      size: '42.3 MB',
      preRepairSnapshot: true,
      repairLogId: 'repair_1754031876542_6fjb04iyn'
    },
    {
      id: 'backup_pre_repair_9kln12xyz',
      timestamp: '2025-08-01T05:22:15.000Z',
      description: 'Pre-repair snapshot before auth flow fix',
      size: '41.8 MB',
      preRepairSnapshot: true,
      repairLogId: 'repair_1754031456789_9kln12xyz'
    },
    {
      id: 'backup_daily_080125',
      timestamp: '2025-08-01T00:00:00.000Z',
      description: 'Scheduled daily backup',
      size: '41.2 MB',
      preRepairSnapshot: false
    },
    {
      id: 'backup_pre_repair_3def67abc',
      timestamp: '2025-08-01T03:15:42.000Z',
      description: 'Pre-repair snapshot before analytics optimization',
      size: '40.9 MB',
      preRepairSnapshot: true,
      repairLogId: 'repair_1754030123456_3def67abc'
    }
  ])

  const handleRollback = async (logId: string) => {
    if (confirm('Are you sure you want to rollback this repair? This will restore the site to its state before the AI repair was applied.')) {
      // In production, this would trigger actual rollback
      console.log(`Rolling back repair: ${logId}`)
      alert('Rollback initiated. Site will be restored to pre-repair state in 30-60 seconds.')
    }
  }

  const downloadBackup = (backupId: string) => {
    // In production, this would download the actual backup file
    console.log(`Downloading backup: ${backupId}`)
    alert('Backup download would start in production system.')
  }

  const restoreBackup = async (backupId: string, backupDescription: string) => {
    // Custom confirmation dialog would be implemented in production
    const confirmed = confirm(`Are you sure you want to restore from this backup?\n\n${backupDescription}\n\nThis will replace the current system state with the backup. This action cannot be undone.`)
    
    if (confirmed) {
      console.log(`Restoring from backup: ${backupId}`)
      alert('System restore initiated. The site will be restored from the selected backup in 30-60 seconds.')
    }
  }

  const getPriorityColor = (priority: RepairLog['priority']) => {
    switch (priority) {
      case 'low': return 'text-green-400 bg-green-400/10'
      case 'medium': return 'text-yellow-400 bg-yellow-400/10'
      case 'high': return 'text-orange-400 bg-orange-400/10'
      case 'critical': return 'text-red-400 bg-red-400/10'
    }
  }

  const getStatusColor = (status: RepairLog['status']) => {
    switch (status) {
      case 'completed': return 'text-green-400 bg-green-400/10'
      case 'in_progress': return 'text-blue-400 bg-blue-400/10'
      case 'failed': return 'text-red-400 bg-red-400/10'
      case 'rolled_back': return 'text-purple-400 bg-purple-400/10'
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">AI Systems Management</h1>
              <p className="text-gray-400">Monitor autonomous AI repairs, view logs, and manage system rollbacks</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-gray-800/50 rounded-lg p-3 flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-green-400">System Online</span>
              </div>
            </div>
          </div>

          {/* System Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Oracle Status</h3>
                <Bot className="w-6 h-6 text-purple-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">ChatGPT 4o Online</span>
                </div>
                <p className="text-2xl font-bold text-white">{systemStatus.totalRepairs}</p>
                <p className="text-sm text-gray-400">Total Repairs</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Claude Status</h3>
                <Shield className="w-6 h-6 text-cyan-400" />
              </div>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300">Sonnet 3.7 Online</span>
                </div>
                <p className="text-2xl font-bold text-white">{systemStatus.successRate}%</p>
                <p className="text-sm text-gray-400">Success Rate</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Active Repairs</h3>
                <Activity className="w-6 h-6 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-white">{systemStatus.activeRepairs}</p>
                <p className="text-sm text-gray-400">Currently Processing</p>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Avg Repair Time</h3>
                <Clock className="w-6 h-6 text-green-400" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-white">{systemStatus.avgRepairTime}s</p>
                <p className="text-sm text-gray-400">Average Duration</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8">
              {['overview', 'logs', 'backups'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                    activeTab === tab
                      ? 'border-purple-500 text-purple-400'
                      : 'border-transparent text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </nav>
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">AI Collaboration Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">Oracle (ChatGPT 4o)</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Role:</span>
                        <span className="text-white">Scanner/Reporter/Dispatcher</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400">Online & Active</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Activity:</span>
                        <span className="text-white">2 minutes ago</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-lg font-medium text-white">Claude Sonnet 3.7</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Role:</span>
                        <span className="text-white">Autonomous Fixer</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="text-green-400">Online & Ready</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Last Repair:</span>
                        <span className="text-white">45 minutes ago</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800/50 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Recent Activity</h3>
                <div className="space-y-3">
                  {repairLogs.slice(0, 3).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <CheckCircle className="w-5 h-5 text-green-400" />
                        <div>
                          <p className="text-white font-medium">{log.issueType}</p>
                          <p className="text-sm text-gray-400">{new Date(log.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(log.priority)}`}>
                          {log.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(log.status)}`}>
                          {log.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Logs Tab */}
          {activeTab === 'logs' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h3 className="text-xl font-semibold text-white">Repair Logs</h3>
                  <p className="text-gray-400 mt-1">Detailed logs of all autonomous AI repairs</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-700/50">
                      <tr>
                        <th className="text-left p-4 text-gray-300">Timestamp</th>
                        <th className="text-left p-4 text-gray-300">Issue Type</th>
                        <th className="text-left p-4 text-gray-300">Priority</th>
                        <th className="text-left p-4 text-gray-300">Status</th>
                        <th className="text-left p-4 text-gray-300">Duration</th>
                        <th className="text-left p-4 text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {repairLogs.map((log) => (
                        <tr key={log.id} className="border-t border-gray-700 hover:bg-gray-700/25">
                          <td className="p-4 text-gray-300">{new Date(log.timestamp).toLocaleString()}</td>
                          <td className="p-4 text-white">{log.issueType}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(log.priority)}`}>
                              {log.priority}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(log.status)}`}>
                              {log.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 text-gray-300">{log.executionTime}s</td>
                          <td className="p-4">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="p-1 text-gray-400 hover:text-white transition-colors"
                                title="View Details"
                              >
                                <Eye size={16} />
                              </button>
                              {log.rollbackAvailable && log.status !== 'rolled_back' && (
                                <button
                                  onClick={() => handleRollback(log.id)}
                                  className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                                  title="Rollback"
                                >
                                  <RotateCcw size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Backups Tab */}
          {activeTab === 'backups' && (
            <div className="space-y-6">
              <div className="bg-gray-800/50 rounded-lg overflow-hidden">
                <div className="p-6 border-b border-gray-700">
                  <h3 className="text-xl font-semibold text-white">System Backups</h3>
                  <p className="text-gray-400 mt-1">Pre-repair snapshots and scheduled backups</p>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {systemBackups.map((backup) => (
                      <div key={backup.id} className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-3 h-3 rounded-full ${backup.preRepairSnapshot ? 'bg-purple-400' : 'bg-blue-400'}`}></div>
                          <div>
                            <p className="text-white font-medium">{backup.description}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <p className="text-sm text-gray-400">{new Date(backup.timestamp).toLocaleString()}</p>
                              <p className="text-sm text-gray-400">Size: {backup.size}</p>
                              {backup.preRepairSnapshot && (
                                <span className="px-2 py-1 rounded-full text-xs bg-purple-400/10 text-purple-400">
                                  Pre-Repair
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => downloadBackup(backup.id)}
                            className="p-2 text-gray-400 hover:text-white transition-colors bg-gray-600/50 rounded-lg"
                            title="Download Backup"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => restoreBackup(backup.id, backup.description)}
                            className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg font-medium"
                            title="Restore from Backup"
                          >
                            Restore
                          </button>
                          {backup.preRepairSnapshot && backup.repairLogId && (
                            <button
                              onClick={() => handleRollback(backup.repairLogId!)}
                              className="p-2 text-gray-400 hover:text-yellow-400 transition-colors bg-gray-600/50 rounded-lg"
                              title="Rollback Repair"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Log Detail Modal */}
          {selectedLog && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Repair Log Details</h3>
                    <button
                      onClick={() => setSelectedLog(null)}
                      className="text-gray-400 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Repair ID</label>
                      <p className="text-white font-mono text-sm">{selectedLog.id}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Handoff ID</label>
                      <p className="text-white font-mono text-sm">{selectedLog.handoffId}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Timestamp</label>
                      <p className="text-white">{new Date(selectedLog.timestamp).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Execution Time</label>
                      <p className="text-white">{selectedLog.executionTime} seconds</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">User Report</label>
                    <p className="text-white bg-gray-700/50 p-3 rounded-lg mt-1">{selectedLog.userReport}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Oracle Analysis</label>
                    <p className="text-white bg-gray-700/50 p-3 rounded-lg mt-1">{selectedLog.oracleAnalysis}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Claude Repair</label>
                    <p className="text-white bg-gray-700/50 p-3 rounded-lg mt-1">{selectedLog.claudeRepair}</p>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Files Modified</label>
                    <div className="mt-1 space-y-1">
                      {selectedLog.filesModified.map((file, index) => (
                        <p key={index} className="text-white font-mono text-sm bg-gray-700/50 p-2 rounded">{file}</p>
                      ))}
                    </div>
                  </div>

                  {selectedLog.rollbackAvailable && selectedLog.status !== 'rolled_back' && (
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          handleRollback(selectedLog.id)
                          setSelectedLog(null)
                        }}
                        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <RotateCcw size={16} />
                        <span>Rollback This Repair</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}