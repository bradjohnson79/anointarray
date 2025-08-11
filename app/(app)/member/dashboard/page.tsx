'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ChartBarIcon,
  ShoppingBagIcon,
  SparklesIcon,
  CogIcon,
  PlusIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  HeartIcon
} from '@heroicons/react/24/outline'

interface DashboardStats {
  total_orders: number
  total_spent: number
  arrays_created: number
  favorite_category: string
}

interface RecentOrder {
  id: string
  order_number: string
  total: number
  status: string
  financial_status: string
  created_at: string
  items_count?: number
}

interface RecentArray {
  id: string
  title: string
  status: string
  glyph_count: number
  view_count: number
  download_count: number
  is_public: boolean
  created_at: string
  thumbnail_url?: string
  svg_url?: string
}

export default function MemberDashboard() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [recentArrays, setRecentArrays] = useState<RecentArray[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }
      
      setUser(session.user)
      await Promise.all([
        fetchProfile(session.user.id),
        fetchStats(session.user.id),
        fetchRecentOrders(session.user.id),
        fetchRecentArrays(session.user.id)
      ])
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    setProfile(data)
  }

  const fetchStats = async (userId: string) => {
    try {
      // Try to call the RPC function, fallback to manual queries if not available
      const { data, error } = await supabase.rpc('get_user_analytics', {
        user_id_param: userId
      })

      if (!error && data) {
        setStats({
          total_orders: data.total_orders || 0,
          total_spent: data.total_spent_cents || 0,
          arrays_created: data.arrays_created || 0,
          favorite_category: data.favorite_category || 'None'
        })
      } else {
        // Fallback to manual queries
        const [ordersResult, arraysResult] = await Promise.all([
          supabase
            .from('orders')
            .select('total, financial_status')
            .eq('user_id', userId)
            .eq('financial_status', 'paid'),
          supabase
            .from('arrays')
            .select('id')
            .eq('user_id', userId)
        ])

        const totalOrders = ordersResult.data?.length || 0
        const totalSpent = ordersResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
        const arraysCreated = arraysResult.data?.length || 0

        setStats({
          total_orders: totalOrders,
          total_spent: totalSpent,
          arrays_created: arraysCreated,
          favorite_category: 'None'
        })
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      setStats({
        total_orders: 0,
        total_spent: 0,
        arrays_created: 0,
        favorite_category: 'None'
      })
    }
  }

  const fetchRecentOrders = async (userId: string) => {
    const { data } = await supabase
      .from('orders')
      .select('id, order_number, total, status, financial_status, created_at, items_data')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) {
      const ordersWithItemCount = data.map(order => ({
        ...order,
        items_count: Array.isArray(order.items_data) ? order.items_data.length : 0
      }))
      setRecentOrders(ordersWithItemCount)
    }
  }

  const fetchRecentArrays = async (userId: string) => {
    const { data } = await supabase
      .from('arrays')
      .select('id, title, status, glyph_count, view_count, download_count, is_public, created_at, thumbnail_url, svg_url')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(6)

    if (data) {
      setRecentArrays(data)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'delivered':
        return 'text-green-400'
      case 'processing':
      case 'generating':
      case 'pending':
        return 'text-yellow-400'
      case 'failed':
      case 'cancelled':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'paid':
      case 'delivered':
        return 'bg-green-900/50 border-green-700'
      case 'processing':
      case 'generating':
      case 'pending':
        return 'bg-yellow-900/50 border-yellow-700'
      case 'failed':
      case 'cancelled':
        return 'bg-red-900/50 border-red-700'
      default:
        return 'bg-gray-900/50 border-gray-700'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading your dashboard...</p>
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
            <h1 className="text-3xl font-bold text-purple-400">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0] || 'Mystic'}!
            </h1>
            <p className="text-gray-400 mt-1">Here's your mystical journey so far</p>
          </div>
          
          <div className="flex space-x-3">
            <Link
              href="/generator"
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <PlusIcon className="h-5 w-5" />
              <span>Create Array</span>
            </Link>
            
            <Link
              href="/catalog"
              className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              <span>Shop</span>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{stats?.total_orders || 0}</p>
              </div>
              <ShoppingBagIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold">${((stats?.total_spent || 0) / 100).toFixed(2)}</p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-green-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Arrays Created</p>
                <p className="text-2xl font-bold">{stats?.arrays_created || 0}</p>
              </div>
              <SparklesIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Favorite Category</p>
                <p className="text-lg font-semibold">{stats?.favorite_category || 'None'}</p>
              </div>
              <HeartIcon className="h-8 w-8 text-pink-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Orders */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Recent Orders</h2>
              <Link
                href="/member/orders"
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                View All
              </Link>
            </div>

            {recentOrders.length > 0 ? (
              <div className="space-y-4">
                {recentOrders.map(order => (
                  <div key={order.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-medium">{order.order_number}</h3>
                        <p className="text-gray-400 text-sm">
                          {new Date(order.created_at).toLocaleDateString()} • {order.items_count} items
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${(order.total / 100).toFixed(2)}</p>
                        <span className={`text-xs px-2 py-1 rounded-full border ${getStatusBg(order.financial_status)}`}>
                          {order.financial_status}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ShoppingBagIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500">No orders yet</p>
                <Link
                  href="/catalog"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Start shopping
                </Link>
              </div>
            )}
          </div>

          {/* Recent Arrays */}
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold">Your Arrays</h2>
              <Link
                href="/member/creations"
                className="text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                View All
              </Link>
            </div>

            {recentArrays.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {recentArrays.map(array => (
                  <div key={array.id} className="border border-gray-700 rounded-lg p-4">
                    <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                      {array.thumbnail_url ? (
                        <img
                          src={array.thumbnail_url}
                          alt={array.title}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <SparklesIcon className="h-8 w-8 text-gray-500" />
                      )}
                    </div>
                    
                    <div>
                      <h3 className="font-medium text-sm mb-1 truncate">{array.title}</h3>
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <span className={getStatusColor(array.status)}>{array.status}</span>
                        <div className="flex items-center space-x-2">
                          <span className="flex items-center">
                            <EyeIcon className="h-3 w-3 mr-1" />
                            {array.view_count}
                          </span>
                          <span className="flex items-center">
                            <ArrowDownTrayIcon className="h-3 w-3 mr-1" />
                            {array.download_count}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          {array.glyph_count} glyphs
                        </span>
                        {array.is_public && (
                          <span className="text-xs bg-purple-900 text-purple-300 px-2 py-1 rounded-full">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <SparklesIcon className="h-12 w-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">No arrays created yet</p>
                <Link
                  href="/generator"
                  className="text-purple-400 hover:text-purple-300 transition-colors"
                >
                  Create your first array
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/generator"
              className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-purple-600 rounded-lg p-3 group-hover:bg-purple-500 transition-colors">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Create New Array</h3>
                  <p className="text-gray-400 text-sm">Design mystical patterns</p>
                </div>
              </div>
            </Link>

            <Link
              href="/member/settings"
              className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-gray-600 rounded-lg p-3 group-hover:bg-gray-500 transition-colors">
                  <CogIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Account Settings</h3>
                  <p className="text-gray-400 text-sm">Manage your profile</p>
                </div>
              </div>
            </Link>

            <Link
              href="/catalog"
              className="bg-gray-800 hover:bg-gray-700 rounded-lg p-4 transition-colors group"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-green-600 rounded-lg p-3 group-hover:bg-green-500 transition-colors">
                  <ShoppingBagIcon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-medium">Browse Catalog</h3>
                  <p className="text-gray-400 text-sm">Discover new products</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}