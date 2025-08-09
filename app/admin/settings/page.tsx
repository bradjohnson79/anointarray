'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { 
  User, 
  Bell, 
  Shield,
  Key,
  Database,
  Eye,
  EyeOff,
  Upload,
  Save,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'

export default function AdminSettings() {
  const { user } = useAuth()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: []
  })
  
  const [notifications, setNotifications] = useState({
    securityAlerts: true,
    systemUpdates: true,
    userActivity: false,
    backupReports: true
  })

  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    debugLogging: false,
    autoBackup: true
  })

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const calculatePasswordStrength = (password: string) => {
    let score = 0
    const feedback = []

    if (password.length < 8) {
      feedback.push('At least 8 characters required')
    } else {
      score += 1
    }

    if (!/[A-Z]/.test(password)) {
      feedback.push('Add uppercase letter')
    } else {
      score += 1
    }

    if (!/[a-z]/.test(password)) {
      feedback.push('Add lowercase letter')
    } else {
      score += 1
    }

    if (!/[0-9]/.test(password)) {
      feedback.push('Add number')
    } else {
      score += 1
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
      feedback.push('Add special character')
    } else {
      score += 1
    }

    return { score, feedback }
  }

  const handlePasswordChange = (field: string, value: string) => {
    const updatedForm = { ...passwordForm, [field]: value }
    setPasswordForm(updatedForm)

    if (field === 'newPassword') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (passwordStrength.score < 4) {
      alert('Password is not strong enough')
      return
    }

    setIsChangingPassword(true)
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to change password')
      }

      alert('Password changed successfully')
      setShowPasswordForm(false)
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Password change failed:', error)
      alert('Failed to change password. Please try again.')
    } finally {
      setIsChangingPassword(false)
    }
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const toggleSystemSetting = (key: keyof typeof systemSettings) => {
    setSystemSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const getPasswordStrengthColor = (score: number) => {
    switch (score) {
      case 0:
      case 1: return 'bg-red-500'
      case 2:
      case 3: return 'bg-yellow-500'
      case 4:
      case 5: return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getPasswordStrengthText = (score: number) => {
    switch (score) {
      case 0:
      case 1: return 'Weak'
      case 2:
      case 3: return 'Medium'
      case 4:
      case 5: return 'Strong'
      default: return 'Unknown'
    }
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Settings</h1>
            <p className="text-gray-400">Manage your admin account and system preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User size={20} />
                    Admin Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Avatar Upload */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-2">Profile Avatar</label>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-24 rounded-full bg-gray-700/50 border-2 border-gray-600/50 overflow-hidden">
                        {avatarPreview ? (
                          <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <User size={36} />
                          </div>
                        )}
                      </div>
                      <div>
                        <input
                          type="file"
                          id="avatar-upload"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          className="hidden"
                        />
                        <label
                          htmlFor="avatar-upload"
                          className="cursor-pointer inline-flex items-center px-4 py-2 bg-gray-700/60 border border-gray-600/50 rounded-lg text-white hover:bg-gray-600/70 transition-colors"
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Photo
                        </label>
                        <p className="text-xs text-gray-400 mt-1">JPG, PNG or GIF, max 5MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                      <input 
                        type="text" 
                        defaultValue="ANOINT Admin" 
                        className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Admin Email</label>
                      <input 
                        type="email" 
                        value={user?.email || 'info@anoint.me'}
                        disabled
                        className="w-full p-3 bg-gray-600/30 border border-gray-600/50 rounded-lg text-gray-400 cursor-not-allowed"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Role</label>
                    <input 
                      type="text" 
                      value="Administrator"
                      disabled
                      className="w-full p-3 bg-gray-600/30 border border-gray-600/50 rounded-lg text-gray-400 cursor-not-allowed"
                    />
                  </div>

                  <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Security Settings */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Shield size={20} />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Password Management */}
                  <div className="border-b border-gray-700/50 pb-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-white font-medium">Password</p>
                        <p className="text-gray-400 text-sm">Last changed recently</p>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setShowPasswordForm(!showPasswordForm)}
                        className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                      >
                        <Key className="mr-2 h-4 w-4" />
                        Change Password
                      </Button>
                    </div>

                    {/* Password Change Form */}
                    {showPasswordForm && (
                      <div className="space-y-4 p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Current Password</label>
                          <div className="relative">
                            <input
                              type={showCurrentPassword ? "text" : "password"}
                              value={passwordForm.currentPassword}
                              onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                              className="w-full p-3 pr-12 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                              placeholder="Enter current password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                          <div className="relative">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={passwordForm.newPassword}
                              onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                              className="w-full p-3 pr-12 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                              placeholder="Enter new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          
                          {/* Password Strength Indicator */}
                          {passwordForm.newPassword && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-300">Password Strength:</span>
                                <span className={`font-medium ${
                                  passwordStrength.score >= 4 ? 'text-green-400' : 
                                  passwordStrength.score >= 2 ? 'text-yellow-400' : 'text-red-400'
                                }`}>
                                  {getPasswordStrengthText(passwordStrength.score)}
                                </span>
                              </div>
                              <div className="w-full bg-gray-600 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                                  style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                                />
                              </div>
                              {passwordStrength.feedback.length > 0 && (
                                <ul className="mt-2 text-xs text-gray-400">
                                  {passwordStrength.feedback.map((item, index) => (
                                    <li key={index} className="flex items-center gap-1">
                                      <AlertTriangle size={12} className="text-yellow-400" />
                                      {item}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                          <div className="relative">
                            <input
                              type={showConfirmPassword ? "text" : "password"}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                              className="w-full p-3 pr-12 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                              placeholder="Confirm new password"
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                            >
                              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          
                          {/* Password Match Indicator */}
                          {passwordForm.confirmPassword && (
                            <div className="mt-2">
                              {passwordForm.newPassword === passwordForm.confirmPassword ? (
                                <div className="flex items-center gap-1 text-green-400 text-sm">
                                  <CheckCircle size={14} />
                                  Passwords match
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-red-400 text-sm">
                                  <AlertTriangle size={14} />
                                  Passwords do not match
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-3 pt-2">
                          <Button
                            onClick={handleChangePassword}
                            disabled={isChangingPassword || passwordStrength.score < 4 || passwordForm.newPassword !== passwordForm.confirmPassword}
                            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isChangingPassword ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                Changing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Update Password
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowPasswordForm(false)
                              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
                            }}
                            className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Two-Factor Authentication */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white font-medium">Two-Factor Authentication</p>
                        <p className="text-red-400 text-sm">Not enabled - Recommended for admin accounts</p>
                      </div>
                      <Button 
                        size="sm"
                        className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                      >
                        Enable 2FA
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell size={20} />
                    Admin Notifications
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Security Alerts</p>
                      <p className="text-gray-400 text-sm">Critical security notifications</p>
                    </div>
                    <Switch 
                      checked={notifications.securityAlerts}
                      onCheckedChange={() => toggleNotification('securityAlerts')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">System Updates</p>
                      <p className="text-gray-400 text-sm">Platform updates and maintenance</p>
                    </div>
                    <Switch 
                      checked={notifications.systemUpdates}
                      onCheckedChange={() => toggleNotification('systemUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">User Activity</p>
                      <p className="text-gray-400 text-sm">New registrations and user actions</p>
                    </div>
                    <Switch 
                      checked={notifications.userActivity}
                      onCheckedChange={() => toggleNotification('userActivity')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Backup Reports</p>
                      <p className="text-gray-400 text-sm">Automated backup status</p>
                    </div>
                    <Switch 
                      checked={notifications.backupReports}
                      onCheckedChange={() => toggleNotification('backupReports')}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* System Controls */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database size={20} />
                    System Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Maintenance Mode</p>
                      <p className="text-gray-400 text-sm text-xs">Disable public access</p>
                    </div>
                    <Switch 
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={() => toggleSystemSetting('maintenanceMode')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Debug Logging</p>
                      <p className="text-gray-400 text-sm text-xs">Enable detailed logs</p>
                    </div>
                    <Switch 
                      checked={systemSettings.debugLogging}
                      onCheckedChange={() => toggleSystemSetting('debugLogging')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Auto Backup</p>
                      <p className="text-gray-400 text-sm text-xs">Daily automated backups</p>
                    </div>
                    <Switch 
                      checked={systemSettings.autoBackup}
                      onCheckedChange={() => toggleSystemSetting('autoBackup')}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Admin Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">Role</p>
                    <p className="text-white font-semibold">System Administrator</p>
                    <p className="text-gray-300 text-sm">Last login</p>
                    <p className="text-purple-400 text-sm">Today at 2:45 PM</p>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Total Users</span>
                        <span className="text-purple-400 font-medium">247</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Active Sessions</span>
                        <span className="text-cyan-400 font-medium">18</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}