'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChartBarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  CubeIcon,
  DocumentTextIcon,
  CogIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  CurrencyDollarIcon,
  TruckIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  total_orders: number
  total_revenue: number
  active_users: number
  total_products: number
  pending_orders: number
  failed_payments: number
  recent_signups: number
  array_generations: number
}

interface RecentActivity {
  id: string
  type: 'order' | 'user' | 'array' | 'product' | 'payment'
  title: string
  description: string
  timestamp: string
  status: 'success' | 'warning' | 'error' | 'info'
  user_email?: string
  amount?: number
}

interface SystemHealth {
  database: 'healthy' | 'warning' | 'error'
  storage: 'healthy' | 'warning' | 'error'
  edge_functions: 'healthy' | 'warning' | 'error'
  payments: 'healthy' | 'warning' | 'error'
  last_checked: string
}

export default function AdminDashboard() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    // Check if user has admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/member/dashboard')
      return
    }

    setUser(session.user)
    await Promise.all([
      fetchDashboardStats(),
      fetchRecentActivity(),
      checkSystemHealth()
    ])
    setLoading(false)
  }

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'get_dashboard_stats'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
    }
  }

  const fetchRecentActivity = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'get_recent_activity',
          limit: 10
        })
      })

      if (response.ok) {
        const data = await response.json()
        setRecentActivity(data.activities || [])
      }
    } catch (error) {
      console.error('Error fetching recent activity:', error)
    }
  }

  const checkSystemHealth = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'check_system_health'
        })
      })

      if (response.ok) {
        const data = await response.json()
        setSystemHealth(data.health)
      }
    } catch (error) {
      console.error('Error checking system health:', error)
      setSystemHealth({
        database: 'error',
        storage: 'error',
        edge_functions: 'error',
        payments: 'error',
        last_checked: new Date().toISOString()
      })
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return <CheckCircleIcon className="h-5 w-5 text-green-400" />
      case 'warning':
        return <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
      case 'error':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'success':
        return 'text-green-400'
      case 'warning':
        return 'text-yellow-400'
      case 'error':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'order':
        return <ShoppingBagIcon className="h-5 w-5 text-blue-400" />
      case 'user':
        return <UserGroupIcon className="h-5 w-5 text-green-400" />
      case 'array':
        return <SparklesIcon className="h-5 w-5 text-purple-400" />
      case 'product':
        return <CubeIcon className="h-5 w-5 text-orange-400" />
      case 'payment':
        return <CurrencyDollarIcon className="h-5 w-5 text-green-400" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-400" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-400">Admin Dashboard</h1>
            <p className="text-gray-400 mt-1">Manage your mystical e-commerce platform</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Link
              href="/admin/settings"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <CogIcon className="h-5 w-5" />
              <span>Settings</span>
            </Link>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
              </div>
              <ShoppingBagIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">${((stats?.total_revenue || 0) / 100).toFixed(2)}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Users</p>
                <p className="text-2xl font-bold">{stats?.active_users || 0}</p>
              </div>
              <UserGroupIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Products</p>
                <p className="text-2xl font-bold">{stats?.total_products || 0}</p>
              </div>
              <CubeIcon className="h-8 w-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Alert Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-400 font-medium">Pending Orders</p>
                <p className="text-xl font-bold text-yellow-300">{stats?.pending_orders || 0}</p>
              </div>
              <ClockIcon className="h-6 w-6 text-yellow-400" />
            </div>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-400 font-medium">Failed Payments</p>
                <p className="text-xl font-bold text-red-300">{stats?.failed_payments || 0}</p>
              </div>
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
            </div>
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 font-medium">Arrays Generated</p>
                <p className="text-xl font-bold text-green-300">{stats?.array_generations || 0}</p>
              </div>
              <SparklesIcon className="h-6 w-6 text-green-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* System Health */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">System Health</h2>
            
            {systemHealth ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(systemHealth.database)}
                    <span>Database</span>
                  </div>
                  <span className={`font-medium ${getStatusColor(systemHealth.database)}`}>
                    {systemHealth.database}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(systemHealth.storage)}
                    <span>Storage</span>
                  </div>
                  <span className={`font-medium ${getStatusColor(systemHealth.storage)}`}>
                    {systemHealth.storage}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(systemHealth.edge_functions)}
                    <span>Edge Functions</span>
                  </div>
                  <span className={`font-medium ${getStatusColor(systemHealth.edge_functions)}`}>
                    {systemHealth.edge_functions}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(systemHealth.payments)}
                    <span>Payments</span>
                  </div>
                  <span className={`font-medium ${getStatusColor(systemHealth.payments)}`}>
                    {systemHealth.payments}
                  </span>
                </div>

                <div className="text-center text-gray-400 text-sm mt-4">
                  Last checked: {new Date(systemHealth.last_checked).toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-400">Loading system health...</p>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Recent Activity</h2>
            
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {recentActivity.length > 0 ? (
                recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-700 rounded-lg">
                    {getActivityIcon(activity.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">{activity.title}</h4>
                        <span className="text-xs text-gray-400">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-gray-400 text-xs mt-1">{activity.description}</p>
                      {activity.amount && (
                        <p className="text-green-400 text-xs mt-1">
                          ${(activity.amount / 100).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-400">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/orders"
              className="bg-blue-600 hover:bg-blue-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <ShoppingBagIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Manage Orders</h3>
                  <p className="text-blue-200 text-sm">View and update orders</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="bg-orange-600 hover:bg-orange-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <CubeIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Manage Products</h3>
                  <p className="text-orange-200 text-sm">Add and edit products</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/users"
              className="bg-purple-600 hover:bg-purple-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <UserGroupIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Manage Users</h3>
                  <p className="text-purple-200 text-sm">User accounts & roles</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/analytics"
              className="bg-green-600 hover:bg-green-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <ChartBarIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Analytics</h3>
                  <p className="text-green-200 text-sm">Sales & user analytics</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/arrays"
              className="bg-indigo-600 hover:bg-indigo-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <SparklesIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Manage Arrays</h3>
                  <p className="text-indigo-200 text-sm">Generated arrays & templates</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/coupons"
              className="bg-pink-600 hover:bg-pink-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Manage Coupons</h3>
                  <p className="text-pink-200 text-sm">Discount codes & promotions</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/shipping"
              className="bg-teal-600 hover:bg-teal-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <TruckIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">Shipping Settings</h3>
                  <p className="text-teal-200 text-sm">Rates & carrier settings</p>
                </div>
              </div>
            </Link>

            <Link
              href="/admin/logs"
              className="bg-gray-600 hover:bg-gray-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <DocumentTextIcon className="h-8 w-8 text-white" />
                <div>
                  <h3 className="font-medium">System Logs</h3>
                  <p className="text-gray-200 text-sm">View system activity</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}