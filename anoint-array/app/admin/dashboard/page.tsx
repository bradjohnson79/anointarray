'use client'

import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { getAllOrders } from '@/lib/orders'
import { 
  ShoppingCart, 
  DollarSign, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  Shield,
  Zap
} from 'lucide-react'

export default function AdminDashboard() {
  const orders = getAllOrders()
  
  // Calculate e-commerce metrics
  const totalOrders = orders.length
  const paidOrders = orders.filter(o => o.paymentStatus === 'paid')
  
  // Daily revenue (today's orders)
  const today = new Date().toISOString().split('T')[0]
  const dailyOrders = paidOrders.filter(o => o.createdAt.split('T')[0] === today)
  const dailyRevenue = dailyOrders.reduce((sum, o) => sum + o.total, 0)
  
  // Monthly revenue (current month)
  const currentMonth = new Date().toISOString().substring(0, 7)
  const monthlyOrders = paidOrders.filter(o => o.createdAt.substring(0, 7) === currentMonth)
  const monthlyRevenue = monthlyOrders.reduce((sum, o) => sum + o.total, 0)
  
  // Average order value
  const averageOrderValue = paidOrders.length > 0 ? paidOrders.reduce((sum, o) => sum + o.total, 0) / paidOrders.length : 0
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }
  
  const stats = [
    {
      title: 'Total Orders',
      value: totalOrders.toString(),
      change: '+15%',
      changeType: 'positive',
      icon: ShoppingCart,
      color: 'from-blue-500 to-blue-600'
    },
    {
      title: 'Daily Revenue',
      value: formatCurrency(dailyRevenue),
      change: '+23%',
      changeType: 'positive',
      icon: DollarSign,
      color: 'from-green-500 to-green-600'
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(monthlyRevenue),
      change: '+18%',
      changeType: 'positive',
      icon: TrendingUp,
      color: 'from-purple-500 to-purple-600'
    },
    {
      title: 'Avg Order Value',
      value: formatCurrency(averageOrderValue),
      change: '+5%',
      changeType: 'positive',
      icon: Activity,
      color: 'from-cyan-500 to-cyan-600'
    }
  ]

  const recentActivity = [
    { user: 'member@example.com', action: 'Generated new array', time: '2 minutes ago', type: 'success' },
    { user: 'System AI', action: 'Auto-healed login issue', time: '5 minutes ago', type: 'healing' },
    { user: 'member@test.com', action: 'Joined community', time: '10 minutes ago', type: 'info' },
    { user: 'System AI', action: 'Optimized database queries', time: '15 minutes ago', type: 'healing' },
    { user: 'creator@example.com', action: 'Generated advanced array', time: '1 hour ago', type: 'success' }
  ]

  const systemAlerts = [
    { message: 'AI chatbot response time optimized', severity: 'low', time: '10 min ago' },
    { message: 'Backup completed successfully', severity: 'low', time: '1 hour ago' },
    { message: 'Security scan completed - No threats', severity: 'low', time: '2 hours ago' }
  ]

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Monitor and manage your ANOINT Array platform</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
          <div className="mt-8 bg-gray-800/60 backdrop-blur-lg rounded-lg p-6 border border-gray-700/50">
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
      </Layout>
    </ProtectedRoute>
  )
}