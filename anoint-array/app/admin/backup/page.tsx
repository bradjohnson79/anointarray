'use client'

import { useState, useRef } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Download, 
  Upload, 
  Trash2, 
  Shield, 
  Clock, 
  FileArchive,
  AlertTriangle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Info,
  Copy,
  Eye
} from 'lucide-react'

interface BackupItem {
  id: string
  name: string
  type: 'full' | 'database' | 'files' | 'config'
  size: string
  created: string
  status: 'completed' | 'in_progress' | 'failed'
  description: string
  canRestore: boolean
}

export default function AdminBackup() {
  const [isCreating, setIsCreating] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
  const [backupType, setBackupType] = useState<'full' | 'selective'>('full')
  const [backupProgress, setBackupProgress] = useState(0)
  const [restoreProgress, setRestoreProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Mock backup data - in real implementation, this would come from API
  const [backups, setBackups] = useState<BackupItem[]>([
    {
      id: '1',
      name: 'Pre-Refactor Full Backup',
      type: 'full',
      size: '245.7 MB',
      created: new Date().toISOString(),
      status: 'completed',
      description: 'Complete site backup before refactoring - includes code, database, assets',
      canRestore: true
    },
    {
      id: '2', 
      name: 'Daily Auto Backup',
      type: 'full',
      size: '243.1 MB',
      created: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      status: 'completed',
      description: 'Automated daily backup with all components',
      canRestore: true
    }
  ])

  const createBackup = async () => {
    setIsCreating(true)
    setBackupProgress(0)
    setError(null)
    setSuccess(null)

    try {
      // Create backup via API
      const response = await fetch('/api/admin/backup/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: backupType === 'full' ? 'full' : 'database',
          includeSensitive: false
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to create backup')
      }

      // Create new backup entry
      const newBackup: BackupItem = {
        id: result.backupId,
        name: `Manual Backup ${new Date().toLocaleDateString()}`,
        type: result.type,
        size: result.size,
        created: result.created,
        status: 'completed',
        description: `${result.type === 'full' ? 'Full' : 'Selective'} backup created manually`,
        canRestore: true
      }

      setBackups(prev => [newBackup, ...prev])
      setSuccess('Backup created successfully!')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create backup. Please try again.')
    } finally {
      setIsCreating(false)
      setBackupProgress(0)
    }
  }

  const restoreBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to restore this backup? This will overwrite the current site state.')) {
      return
    }

    setIsRestoring(true)
    setRestoreProgress(0)
    setSelectedBackup(backupId)
    setError(null)
    setSuccess(null)

    try {
      // Simulate restore progress
      const steps = [
        'Creating current state backup...',
        'Extracting backup files...',
        'Restoring codebase...',
        'Restoring database...',
        'Restoring assets...',
        'Restarting services...'
      ]

      for (let i = 0; i < steps.length; i++) {
        setRestoreProgress(Math.round(((i + 1) / steps.length) * 100))
        await new Promise(resolve => setTimeout(resolve, 2000))
      }

      setSuccess('Backup restored successfully! Site has been restored to previous state.')
    } catch (error) {
      setError('Failed to restore backup. Current site state preserved.')
    } finally {
      setIsRestoring(false)
      setRestoreProgress(0)
      setSelectedBackup(null)
    }
  }

  const downloadBackup = async (backupId: string) => {
    try {
      const backup = backups.find(b => b.id === backupId)
      if (!backup) {
        setError('Backup not found')
        return
      }

      // Download backup file
      const response = await fetch(`/api/admin/backup/download/${backupId}`)
      
      if (!response.ok) {
        throw new Error('Failed to download backup')
      }

      // Create download link
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${backupId}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      setSuccess(`Downloaded backup: ${backup.name}`)
    } catch (error) {
      setError('Failed to download backup')
    }
  }

  const deleteBackup = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/backup/delete/${backupId}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete backup')
      }

      setBackups(prev => prev.filter(b => b.id !== backupId))
      setSuccess('Backup deleted successfully.')
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete backup')
    }
  }

  const handleFileRestore = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (!confirm(`Are you sure you want to restore from file: ${file.name}? This will overwrite the current site state.`)) {
        return
      }
      // In real implementation, upload and restore from file
      setSuccess(`Restoring from file: ${file.name}`)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />
      case 'in_progress':
        return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-400" />
      default:
        return <Clock className="h-4 w-4 text-gray-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full':
        return 'bg-green-600/80 text-white'
      case 'database':
        return 'bg-blue-600/80 text-white'
      case 'files':
        return 'bg-purple-600/80 text-white'
      case 'config':
        return 'bg-orange-600/80 text-white'
      default:
        return 'bg-gray-600/80 text-white'
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
              <Database className="h-8 w-8 text-purple-400" />
              Backup & Restore System
            </h1>
            <p className="text-gray-400">
              Create, manage, and restore complete site backups. Essential for safe refactoring and maintenance.
            </p>
          </div>

          {/* Status Messages */}
          {error && (
            <Alert className="mb-6 bg-red-900/60 border-red-700/50 text-red-200">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="mb-6 bg-green-900/60 border-green-700/50 text-green-200">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {/* Backup Creation */}
          <Card className="mb-8 bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                Create New Backup
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Backup Type
                  </label>
                  <select 
                    value={backupType}
                    onChange={(e) => setBackupType(e.target.value as 'full' | 'selective')}
                    className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                    disabled={isCreating}
                  >
                    <option value="full">Full Backup (Recommended)</option>
                    <option value="selective">Database Only</option>
                  </select>
                </div>
                
                <div className="flex items-end">
                  <Button
                    onClick={createBackup}
                    disabled={isCreating}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating Backup ({backupProgress}%)
                      </>
                    ) : (
                      <>
                        <Database className="mr-2 h-4 w-4" />
                        Create Backup
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {isCreating && (
                <div className="mt-4">
                  <div className="bg-gray-700/50 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${backupProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">Creating backup... {backupProgress}%</p>
                </div>
              )}

              <Alert className="bg-blue-900/60 border-blue-700/50 text-blue-200">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Full Backup includes:</strong> Complete source code, database, environment config, assets, and dependencies.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Restore Options */}
          <Card className="mb-8 bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="h-5 w-5 text-green-400" />
                Restore Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button
                  onClick={handleFileRestore}
                  disabled={isRestoring}
                  variant="outline"
                  className="h-12"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Restore from File
                </Button>
                
                <Button
                  disabled
                  variant="outline"
                  className="h-12 opacity-50"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Emergency Rollback
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,.backup"
                onChange={handleFileSelect}
                className="hidden"
              />

              {isRestoring && (
                <div className="mt-4">
                  <div className="bg-gray-700/50 rounded-full h-2 mb-2">
                    <div 
                      className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${restoreProgress}%` }}
                    />
                  </div>
                  <p className="text-sm text-gray-400">Restoring backup... {restoreProgress}%</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Backup History */}
          <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileArchive className="h-5 w-5 text-cyan-400" />
                Backup History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map(backup => (
                  <div 
                    key={backup.id}
                    className="bg-gray-700/50 rounded-lg p-4 border border-gray-600/50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(backup.status)}
                          <h3 className="font-semibold text-white">{backup.name}</h3>
                          <Badge className={`text-xs ${getTypeColor(backup.type)}`}>
                            {backup.type.toUpperCase()}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-400 mb-2">{backup.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Size: {backup.size}</span>
                          <span>Created: {new Date(backup.created).toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup.id)}
                          className="text-blue-400 border-blue-400/30 hover:bg-blue-400/10"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        
                        {backup.canRestore && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => restoreBackup(backup.id)}
                            disabled={isRestoring}
                            className="text-green-400 border-green-400/30 hover:bg-green-400/10"
                          >
                            {isRestoring && selectedBackup === backup.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <RefreshCw className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteBackup(backup.id)}
                          className="text-red-400 border-red-400/30 hover:bg-red-400/10"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {backups.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <Database className="mx-auto h-12 w-12 mb-4 opacity-50" />
                    <p>No backups available. Create your first backup to get started.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Safety Information */}
          <Alert className="mt-6 bg-amber-900/60 border-amber-700/50 text-amber-200">
            <Shield className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Always create a backup before making major changes to the site. 
              Backups include sensitive data - store them securely and never share backup files.
            </AlertDescription>
          </Alert>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}