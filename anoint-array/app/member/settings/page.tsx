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
  CreditCard,
  Download,
  Trash2,
  Eye,
  EyeOff,
  Upload,
  Calendar,
  Clock,
  MapPin
} from 'lucide-react'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MemberSettings() {
  const router = useRouter()
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [birthData, setBirthData] = useState({
    date: '1990-01-01',
    time: '12:00',
    location: 'New York, NY'
  })
  
  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    securityAlerts: true,
    marketingEmails: false
  })

  const [privacy, setPrivacy] = useState({
    profileVisibility: true
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

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const response = await fetch('/api/member/export-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) throw new Error('Export failed')

      // Create blob from response
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      
      // Create download link
      const a = document.createElement('a')
      a.href = url
      a.download = `anoint-arrays-export-${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      
      // Cleanup
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Failed to export data. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  return (
    <ProtectedRoute requiredRole="member">
      <Layout userRole="member">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
            <p className="text-gray-400">Manage your ANOINT Array account preferences</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Settings */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Information */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <User size={20} />
                    Profile Information
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
                        defaultValue="Brad Johnson" 
                        className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
                      <input 
                        type="email" 
                        defaultValue="brad@example.com" 
                        className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Birth Data Fields */}
                  <div className="pt-4 border-t border-gray-700/50">
                    <h3 className="text-white font-medium mb-4 flex items-center gap-2">
                      <Calendar size={18} />
                      Birth Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Birth Date</label>
                        <input 
                          type="date" 
                          value={birthData.date}
                          onChange={(e) => setBirthData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Birth Time</label>
                        <input 
                          type="time" 
                          value={birthData.time}
                          onChange={(e) => setBirthData(prev => ({ ...prev, time: e.target.value }))}
                          className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Birth Location</label>
                        <input 
                          type="text" 
                          value={birthData.location}
                          onChange={(e) => setBirthData(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="City, State/Country"
                          className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Time Zone</label>
                    <select className="w-full p-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:border-purple-500/50 focus:outline-none">
                      <option>Eastern Time (ET)</option>
                      <option>Central Time (CT)</option>
                      <option>Mountain Time (MT)</option>
                      <option>Pacific Time (PT)</option>
                    </select>
                  </div>
                  <Button className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700">
                    Save Profile Changes
                  </Button>
                </CardContent>
              </Card>

              {/* Notification Settings */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Bell size={20} />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Email Updates</p>
                      <p className="text-gray-400 text-sm">Receive important account updates</p>
                    </div>
                    <Switch 
                      checked={notifications.emailUpdates}
                      onCheckedChange={() => toggleNotification('emailUpdates')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Security Alerts</p>
                      <p className="text-gray-400 text-sm">Important security notifications</p>
                    </div>
                    <Switch 
                      checked={notifications.securityAlerts}
                      onCheckedChange={() => toggleNotification('securityAlerts')}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Marketing Emails</p>
                      <p className="text-gray-400 text-sm">Promotional offers and news</p>
                    </div>
                    <Switch 
                      checked={notifications.marketingEmails}
                      onCheckedChange={() => toggleNotification('marketingEmails')}
                    />
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Account Actions */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Account Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/member/billing')}
                    className="w-full justify-start bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Billing & Payments
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isExporting}
                    className="w-full justify-start bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExporting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Export Data
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>

              {/* Security */}
              <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50">
                <CardHeader>
                  <CardTitle className="text-white">Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-gray-300 text-sm">Password</p>
                    <p className="text-white font-medium">Last changed 30 days ago</p>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="mt-2 bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
                    >
                      Change Password
                    </Button>
                  </div>
                  <div>
                    <p className="text-gray-300 text-sm">Two-Factor Authentication</p>
                    <p className="text-red-400 font-medium">Not enabled</p>
                    <Button 
                      size="sm"
                      className="mt-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                    >
                      Enable 2FA
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Subscription Status */}
              <Card className="bg-gradient-to-r from-purple-900/50 to-cyan-900/50 border-purple-500/20">
                <CardHeader>
                  <CardTitle className="text-white">Membership Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-300 text-sm">Current Plan</p>
                    <p className="text-white font-semibold">Active Member</p>
                    <p className="text-gray-300 text-sm">Member since January 2024</p>
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Arrays Generated</span>
                        <span className="text-purple-400 font-medium">47</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-300">Downloads</span>
                        <span className="text-cyan-400 font-medium">34</span>
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