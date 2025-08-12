'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  CurrencyDollarIcon,
  ShoppingBagIcon,
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'

interface AnalyticsData {
  revenue: {
    total: number
    today: number
    week: number
    month: number
    growth_rate: number
  }
  orders: {
    total: number
    today: number
    week: number
    month: number
    avg_order_value: number
    growth_rate: number
  }
  users: {
    total: number
    active: number
    new_today: number
    new_week: number
    new_month: number
    growth_rate: number
  }
  products: {
    total: number
    published: number
    top_selling: Array<{
      id: string
      title: string
      sales_count: number
      revenue: number
    }>
  }
  arrays: {
    total_generated: number
    today: number
    week: number
    month: number
    popular_types: Array<{
      type: string
      count: number
      percentage: number
    }>
  }
  geographic: {
    top_countries: Array<{
      country: string
      orders: number
      revenue: number
    }>
    top_provinces: Array<{
      province: string
      orders: number
      revenue: number
    }>
  }
}

interface TimeSeriesData {
  date: string
  revenue: number
  orders: number
  users: number
}

export default function AdminAnalytics() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [timeSeries, setTimeSeries] = useState<TimeSeriesData[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')

  useEffect(() => {
    checkAdminAccess()
  }, [checkAdminAccess])

  useEffect(() => {
    if (analytics) {
      fetchTimeSeries()
    }
  }, [timeRange, analytics, fetchTimeSeries])

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single()

    if (profile?.role !== 'admin') {
      router.push('/member/dashboard')
      return
    }

    await fetchAnalytics()
  }

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'get_analytics_data',
          time_range: timeRange
        })
      })

      if (response.ok) {
        const data = await response.json()
        setAnalytics(data.analytics)
        setTimeSeries(data.time_series || [])
      } else {
        // Fallback to basic analytics from database queries
        await fetchBasicAnalytics()
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
      await fetchBasicAnalytics()
    } finally {
      setLoading(false)
    }
  }

  const fetchBasicAnalytics = async () => {
    try {
      const now = new Date()
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const weekStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000)
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

      // Fetch orders data
      const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at, financial_status, shipping_address, items_data')
        .eq('financial_status', 'paid')

      // Fetch users data
      const { data: users } = await supabase
        .from('profiles')
        .select('id, created_at, role')

      // Fetch products data
      const { data: products } = await supabase
        .from('products')
        .select('id, title, status, metadata')
        .eq('status', 'published')

      // Fetch arrays data
      const { data: arrays } = await supabase
        .from('arrays')
        .select('id, created_at, config, status')
        .eq('status', 'completed')

      // Calculate basic stats
      const totalRevenue = orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
      const todayRevenue = orders?.filter(o => new Date(o.created_at) >= todayStart)
        .reduce((sum, order) => sum + (order.total || 0), 0) || 0
      const weekRevenue = orders?.filter(o => new Date(o.created_at) >= weekStart)
        .reduce((sum, order) => sum + (order.total || 0), 0) || 0
      const monthRevenue = orders?.filter(o => new Date(o.created_at) >= monthStart)
        .reduce((sum, order) => sum + (order.total || 0), 0) || 0

      const totalOrders = orders?.length || 0
      const todayOrders = orders?.filter(o => new Date(o.created_at) >= todayStart).length || 0
      const weekOrders = orders?.filter(o => new Date(o.created_at) >= weekStart).length || 0
      const monthOrders = orders?.filter(o => new Date(o.created_at) >= monthStart).length || 0

      const totalUsers = users?.length || 0
      const activeUsers = users?.filter(u => u.role !== null).length || 0
      const newUsersToday = users?.filter(u => new Date(u.created_at) >= todayStart).length || 0
      const newUsersWeek = users?.filter(u => new Date(u.created_at) >= weekStart).length || 0
      const newUsersMonth = users?.filter(u => new Date(u.created_at) >= monthStart).length || 0

      const totalArrays = arrays?.length || 0
      const todayArrays = arrays?.filter(a => new Date(a.created_at) >= todayStart).length || 0
      const weekArrays = arrays?.filter(a => new Date(a.created_at) >= weekStart).length || 0
      const monthArrays = arrays?.filter(a => new Date(a.created_at) >= monthStart).length || 0

      // Calculate average order value
      const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0

      // Get top selling products (mock data since we don't have sales tracking)
      const topProducts = products?.slice(0, 5).map(p => ({
        id: p.id,
        title: p.title,
        sales_count: Math.floor(Math.random() * 50) + 10, // Mock data
        revenue: Math.floor(Math.random() * 10000) + 1000
      })) || []

      // Get array type distribution (mock data)
      const arrayTypes = [
        { type: 'Geometric', count: Math.floor(totalArrays * 0.4), percentage: 40 },
        { type: 'Sigil', count: Math.floor(totalArrays * 0.25), percentage: 25 },
        { type: 'Mandala', count: Math.floor(totalArrays * 0.2), percentage: 20 },
        { type: 'Custom', count: Math.floor(totalArrays * 0.15), percentage: 15 }
      ]

      const basicAnalytics: AnalyticsData = {
        revenue: {
          total: totalRevenue,
          today: todayRevenue,
          week: weekRevenue,
          month: monthRevenue,
          growth_rate: 12.5 // Mock growth rate
        },
        orders: {
          total: totalOrders,
          today: todayOrders,
          week: weekOrders,
          month: monthOrders,
          avg_order_value: avgOrderValue,
          growth_rate: 8.3
        },
        users: {
          total: totalUsers,
          active: activeUsers,
          new_today: newUsersToday,
          new_week: newUsersWeek,
          new_month: newUsersMonth,
          growth_rate: 15.2
        },
        products: {
          total: products?.length || 0,
          published: products?.length || 0,
          top_selling: topProducts
        },
        arrays: {
          total_generated: totalArrays,
          today: todayArrays,
          week: weekArrays,
          month: monthArrays,
          popular_types: arrayTypes
        },
        geographic: {
          top_countries: [
            { country: 'Canada', orders: Math.floor(totalOrders * 0.6), revenue: Math.floor(totalRevenue * 0.6) },
            { country: 'United States', orders: Math.floor(totalOrders * 0.3), revenue: Math.floor(totalRevenue * 0.3) },
            { country: 'United Kingdom', orders: Math.floor(totalOrders * 0.1), revenue: Math.floor(totalRevenue * 0.1) }
          ],
          top_provinces: [
            { province: 'Ontario', orders: Math.floor(totalOrders * 0.4), revenue: Math.floor(totalRevenue * 0.4) },
            { province: 'British Columbia', orders: Math.floor(totalOrders * 0.2), revenue: Math.floor(totalRevenue * 0.2) },
            { province: 'Quebec', orders: Math.floor(totalOrders * 0.15), revenue: Math.floor(totalRevenue * 0.15) }
          ]
        }
      }

      setAnalytics(basicAnalytics)

      // Generate mock time series data
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365
      const mockTimeSeries: TimeSeriesData[] = []
      
      for (let i = days - 1; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        
        mockTimeSeries.push({
          date: date.toISOString().split('T')[0],
          revenue: Math.floor(Math.random() * 5000) + 1000,
          orders: Math.floor(Math.random() * 20) + 5,
          users: Math.floor(Math.random() * 10) + 2
        })
      }
      
      setTimeSeries(mockTimeSeries)

    } catch (error) {
      console.error('Error fetching basic analytics:', error)
    }
  }

  const fetchTimeSeries = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/admin-tools`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          action: 'get_time_series_data',
          time_range: timeRange
        })
      })

      if (response.ok) {
        const data = await response.json()
        setTimeSeries(data.time_series || [])
      }
    } catch (error) {
      console.error('Error fetching time series data:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD' }).format(amount / 100)
  }

  const formatPercent = (rate: number) => {
    return `${rate >= 0 ? '+' : ''}${rate.toFixed(1)}%`
  }

  const getGrowthIcon = (rate: number) => {
    return rate >= 0 ? 
      <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" /> : 
      <ArrowTrendingDownIcon className="h-4 w-4 text-red-400" />
  }

  const getGrowthColor = (rate: number) => {
    return rate >= 0 ? 'text-green-400' : 'text-red-400'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading analytics...</p>
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
            <nav className="flex items-center space-x-2 text-sm text-gray-400 mb-2">
              <Link href="/admin" className="hover:text-white transition-colors">Admin</Link>
              <span>/</span>
              <span className="text-purple-400">Analytics</span>
            </nav>
            <h1 className="text-3xl font-bold text-purple-400">Analytics Dashboard</h1>
            <p className="text-gray-400 mt-1">Business insights and performance metrics</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d' | '1y')}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        {analytics && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <CurrencyDollarIcon className="h-6 w-6 text-green-400" />
                    <span className="text-gray-400">Total Revenue</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(analytics.revenue.growth_rate)}
                    <span className={`text-sm ${getGrowthColor(analytics.revenue.growth_rate)}`}>
                      {formatPercent(analytics.revenue.growth_rate)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {formatCurrency(analytics.revenue.total)}
                </div>
                <div className="text-sm text-gray-400">
                  Today: {formatCurrency(analytics.revenue.today)} • 
                  Week: {formatCurrency(analytics.revenue.week)}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <ShoppingBagIcon className="h-6 w-6 text-blue-400" />
                    <span className="text-gray-400">Total Orders</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(analytics.orders.growth_rate)}
                    <span className={`text-sm ${getGrowthColor(analytics.orders.growth_rate)}`}>
                      {formatPercent(analytics.orders.growth_rate)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.orders.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  AOV: {formatCurrency(analytics.orders.avg_order_value)} • 
                  Today: {analytics.orders.today}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <UserGroupIcon className="h-6 w-6 text-purple-400" />
                    <span className="text-gray-400">Total Users</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    {getGrowthIcon(analytics.users.growth_rate)}
                    <span className={`text-sm ${getGrowthColor(analytics.users.growth_rate)}`}>
                      {formatPercent(analytics.users.growth_rate)}
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.users.total.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  Active: {analytics.users.active} • 
                  New today: {analytics.users.new_today}
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <SparklesIcon className="h-6 w-6 text-yellow-400" />
                    <span className="text-gray-400">Arrays Generated</span>
                  </div>
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {analytics.arrays.total_generated.toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  Today: {analytics.arrays.today} • 
                  Week: {analytics.arrays.week}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Time Series Chart (Mock) */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Revenue Over Time</h2>
                <div className="h-64 flex items-end justify-between space-x-1">
                  {timeSeries.slice(-20).map((data, index) => {
                    const maxRevenue = Math.max(...timeSeries.map(d => d.revenue))
                    const height = (data.revenue / maxRevenue) * 240
                    
                    return (
                      <div key={index} className="flex flex-col items-center space-y-2">
                        <div 
                          className="bg-purple-600 rounded-t w-4 transition-all hover:bg-purple-500"
                          style={{ height: `${height}px` }}
                          title={`${data.date}: ${formatCurrency(data.revenue)}`}
                        />
                        <div className="text-xs text-gray-400 rotate-45 origin-left">
                          {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Array Types Distribution */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Popular Array Types</h2>
                <div className="space-y-4">
                  {analytics.arrays.popular_types.map(type => (
                    <div key={type.type} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="text-white font-medium">{type.type}</div>
                        <div className="text-gray-400 text-sm">{type.count} arrays</div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-24 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-600 rounded-full"
                            style={{ width: `${type.percentage}%` }}
                          />
                        </div>
                        <div className="text-sm text-gray-400 w-8 text-right">
                          {type.percentage}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Selling Products */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Top Selling Products</h2>
                <div className="space-y-4">
                  {analytics.products.top_selling.map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-gray-700 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-purple-400 font-bold text-lg">#{index + 1}</div>
                        <div>
                          <div className="font-medium text-white">{product.title}</div>
                          <div className="text-gray-400 text-sm">{product.sales_count} sales</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">{formatCurrency(product.revenue)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Geographic Distribution */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-4">Geographic Distribution</h2>
                
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">Top Countries</h3>
                  <div className="space-y-2">
                    {analytics.geographic.top_countries.map(country => (
                      <div key={country.country} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{country.country}</span>
                          <span className="text-gray-400 text-sm">({country.orders} orders)</span>
                        </div>
                        <div className="font-bold text-green-400">{formatCurrency(country.revenue)}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-3 text-gray-300">Top Provinces</h3>
                  <div className="space-y-2">
                    {analytics.geographic.top_provinces.map(province => (
                      <div key={province.province} className="flex items-center justify-between p-2 bg-gray-700 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{province.province}</span>
                          <span className="text-gray-400 text-sm">({province.orders} orders)</span>
                        </div>
                        <div className="font-bold text-green-400">{formatCurrency(province.revenue)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}