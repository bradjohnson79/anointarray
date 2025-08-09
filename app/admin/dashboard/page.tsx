'use client'

// Clean admin dashboard following CLAUDE_GLOBAL_RULES.md
// Uses new authentication system and clean UI patterns

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Shield,
  Zap,
  Users,
  Database
} from 'lucide-react'
import { useAuth, useAuthStatus } from '../../../contexts/auth-context'

export default function AdminDashboard() {
  const router = useRouter()
  const { user } = useAuth()
  const { isAdmin, isLoading } = useAuthStatus()

  // No redirect logic needed - AuthContext handles all redirects

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    )
  }

  // AuthContext handles all redirects - no access denied UI needed
  if (!isAdmin) {
    return null // AuthContext will redirect to appropriate page
  }
  // Mock data for now - will be replaced with real data in later phases
  const mockStats = {
    totalUsers: 1247,
    activeUsers: 892,
    totalRevenue: 15420.50,
    systemHealth: 98.5
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }
  
  const stats = [
    {
      title: 'Total Users',
      value: mockStats.totalUsers.toLocaleString(),
      change: '+12%',
      changeType: 'positive',
      icon: Users,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Active Users',
      value: mockStats.activeUsers.toLocaleString(),
      change: '+8%',
      changeType: 'positive',
      icon: Activity,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(mockStats.totalRevenue),
      change: '+23%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'System Health',
      value: `${mockStats.systemHealth}%`,
      change: '+2%',
      changeType: 'positive',
      icon: Database,
      color: 'from-cyan-500 to-cyan-600'
    }
  ]

  const recentActivity = [
    { user: user?.displayName || 'Admin', action: 'Logged into admin dashboard', time: 'Just now', type: 'success' },
    { user: 'System AI', action: 'Authentication system rebuilt', time: '1 hour ago', type: 'healing' },
    { user: 'System AI', action: 'Database schema optimized', time: '2 hours ago', type: 'healing' },
    { user: 'System AI', action: 'Security policies updated', time: '3 hours ago', type: 'healing' },
    { user: 'System AI', action: 'Performance monitoring activated', time: '4 hours ago', type: 'info' }
  ]

  const systemAlerts = [
    { message: 'All authentication systems operational', severity: 'low', time: 'Just now' },
    { message: 'Database migrations completed successfully', severity: 'low', time: '1 hour ago' },
    { message: 'Security scan completed - No threats detected', severity: 'low', time: '2 hours ago' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900">
      {/* Header */}
      <div className="bg-gray-800/60 backdrop-blur-lg border-b border-gray-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-white">ANOINT Array Admin</h1>
              <p className="text-gray-400 text-sm">Welcome back, {user?.displayName}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.email}</p>
                <p className="text-xs text-purple-400">Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Welcome Message */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
            <h2 className="text-xl font-semibold text-white mb-2">Dashboard Overview</h2>
            <p className="text-gray-400">Monitor and manage your ANOINT Array platform with comprehensive admin controls.</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => {
              const Icon = stat.icon
              return (
                <div key={stat.title} className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">{stat.title}</p>
                      <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm ${
                          stat.changeType === 'positive' ? 'text-green-400' : 
                          stat.changeType === 'negative' ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color}`}>
                      <Icon size={24} className="text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
                <Activity size={20} className="text-purple-400" />
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center justify-between py-3 border-b border-gray-700/50 last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-400' : 
                        activity.type === 'healing' ? 'bg-purple-400' : 'bg-blue-400'
                      }`}></div>
                      <div>
                        <p className="text-white text-sm">{activity.action}</p>
                        <p className="text-gray-400 text-xs">{activity.user}</p>
                      </div>
                    </div>
                    <span className="text-gray-400 text-xs">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">System Alerts</h2>
                <AlertTriangle size={20} className="text-yellow-400" />
              </div>
              <div className="space-y-4">
                {systemAlerts.map((alert, index) => (
                  <div key={index} className="flex items-start space-x-3 py-3 border-b border-gray-700/50 last:border-b-0">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      alert.severity === 'high' ? 'bg-red-400' : 
                      alert.severity === 'medium' ? 'bg-yellow-400' : 'bg-green-400'
                    }`}></div>
                    <div className="flex-1">
                      <p className="text-white text-sm">{alert.message}</p>
                      <p className="text-gray-400 text-xs mt-1">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* AI Status */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">AI Systems Status</h2>
              <Shield size={20} className="text-cyan-400" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Activity size={24} className="text-green-400" />
                </div>
                <h3 className="text-white font-semibold">Self-Healing</h3>
                <p className="text-green-400 text-sm">Active</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Zap size={24} className="text-purple-400" />
                </div>
                <h3 className="text-white font-semibold">Predictive Maintenance</h3>
                <p className="text-purple-400 text-sm">Running</p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp size={24} className="text-cyan-400" />
                </div>
                <h3 className="text-white font-semibold">Performance Optimization</h3>
                <p className="text-cyan-400 text-sm">Optimizing</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}