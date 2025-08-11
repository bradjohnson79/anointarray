'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ShoppingBagIcon,
  EyeIcon,
  PencilIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  XCircleIcon,
  TruckIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'

interface Order {
  id: string
  order_number: string
  user_id: string
  email: string
  total: number
  subtotal: number
  tax_amount: number
  shipping_amount: number
  currency: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  financial_status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  created_at: string
  updated_at: string
  shipping_address: any
  billing_address: any
  items_data: any[]
  payment_method: string
  coupon_code?: string
  discount_amount?: number
  notes?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  user_profile?: {
    full_name: string
    email: string
  }
}

const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-400', bgColor: 'bg-yellow-900/20' },
  { value: 'processing', label: 'Processing', color: 'text-blue-400', bgColor: 'bg-blue-900/20' },
  { value: 'shipped', label: 'Shipped', color: 'text-purple-400', bgColor: 'bg-purple-900/20' },
  { value: 'delivered', label: 'Delivered', color: 'text-green-400', bgColor: 'bg-green-900/20' },
  { value: 'cancelled', label: 'Cancelled', color: 'text-red-400', bgColor: 'bg-red-900/20' },
  { value: 'refunded', label: 'Refunded', color: 'text-gray-400', bgColor: 'bg-gray-900/20' }
]

const FINANCIAL_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'text-yellow-400' },
  { value: 'paid', label: 'Paid', color: 'text-green-400' },
  { value: 'failed', label: 'Failed', color: 'text-red-400' },
  { value: 'refunded', label: 'Refunded', color: 'text-gray-400' },
  { value: 'partially_refunded', label: 'Partially Refunded', color: 'text-orange-400' }
]

export default function AdminOrders() {
  const supabase = createBrowserClient()
  const router = useRouter()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [financialFilter, setFinancialFilter] = useState<string>('all')
  const [dateRange, setDateRange] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    checkAdminAccess()
  }, [])

  useEffect(() => {
    filterOrders()
  }, [orders, searchQuery, statusFilter, financialFilter, dateRange])

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

    await fetchOrders()
  }

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          profiles:user_id(full_name, email)
        `)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      const ordersWithProfile = data?.map(order => ({
        ...order,
        user_profile: order.profiles || { full_name: 'Unknown', email: order.email || 'N/A' }
      })) || []

      setOrders(ordersWithProfile)
    } catch (error) {
      console.error('Error fetching orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterOrders = () => {
    let filtered = orders

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(order =>
        order.order_number.toLowerCase().includes(query) ||
        order.email.toLowerCase().includes(query) ||
        order.user_profile?.full_name.toLowerCase().includes(query) ||
        order.tracking_number?.toLowerCase().includes(query)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter)
    }

    // Financial status filter
    if (financialFilter !== 'all') {
      filtered = filtered.filter(order => order.financial_status === financialFilter)
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const filterDate = new Date()
      
      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0)
          break
        case 'week':
          filterDate.setDate(now.getDate() - 7)
          break
        case 'month':
          filterDate.setMonth(now.getMonth() - 1)
          break
      }
      
      if (dateRange !== 'all') {
        filtered = filtered.filter(order => new Date(order.created_at) >= filterDate)
      }
    }

    setFilteredOrders(filtered)
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const updateData: any = { 
        status: newStatus,
        updated_at: new Date().toISOString()
      }

      // Set timestamps based on status
      if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString()
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId)

      if (error) throw error

      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, ...updateData }
          : order
      ))

      // Log the status change
      await supabase
        .from('order_logs')
        .insert({
          order_id: orderId,
          action: 'status_updated',
          details: { old_status: orders.find(o => o.id === orderId)?.status, new_status: newStatus },
          created_at: new Date().toISOString()
        })

    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    } finally {
      setUpdating(null)
    }
  }

  const updateFinancialStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId)
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          financial_status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)

      if (error) throw error

      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, financial_status: newStatus, updated_at: new Date().toISOString() }
          : order
      ))

    } catch (error) {
      console.error('Error updating financial status:', error)
      alert('Failed to update financial status')
    } finally {
      setUpdating(null)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <ClockIcon className="h-4 w-4" />
      case 'processing':
        return <CurrencyDollarIcon className="h-4 w-4" />
      case 'shipped':
        return <TruckIcon className="h-4 w-4" />
      case 'delivered':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'cancelled':
      case 'failed':
        return <XCircleIcon className="h-4 w-4" />
      default:
        return <ExclamationTriangleIcon className="h-4 w-4" />
    }
  }

  const getStatusConfig = (status: string, type: 'order' | 'financial') => {
    const configs = type === 'order' ? ORDER_STATUSES : FINANCIAL_STATUSES
    return configs.find(s => s.value === status) || configs[0]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading orders...</p>
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
              <span className="text-purple-400">Orders</span>
            </nav>
            <h1 className="text-3xl font-bold text-purple-400">Order Management</h1>
            <p className="text-gray-400 mt-1">{filteredOrders.length} orders found</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">            
            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search Orders</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Order #, email, name..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Order Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Order Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  {ORDER_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Financial Status */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Payment Status</label>
                <select
                  value={financialFilter}
                  onChange={(e) => setFinancialFilter(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Payment Statuses</option>
                  {FINANCIAL_STATUSES.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Past Week</option>
                  <option value="month">Past Month</option>
                </select>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="flex-1">
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Customer
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredOrders.map(order => {
                      const orderStatus = getStatusConfig(order.status, 'order')
                      const financialStatus = getStatusConfig(order.financial_status, 'financial')
                      
                      return (
                        <tr key={order.id} className="hover:bg-gray-750">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-white">{order.order_number}</div>
                              <div className="text-sm text-gray-400">
                                {order.items_data?.length || 0} items
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-white">
                                {order.user_profile?.full_name || 'Unknown'}
                              </div>
                              <div className="text-sm text-gray-400">{order.email}</div>
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.status}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              disabled={updating === order.id}
                              className={`text-sm border border-gray-600 rounded-lg px-2 py-1 bg-gray-700 ${orderStatus.color} focus:outline-none focus:border-purple-500`}
                            >
                              {ORDER_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={order.financial_status}
                              onChange={(e) => updateFinancialStatus(order.id, e.target.value)}
                              disabled={updating === order.id}
                              className={`text-sm border border-gray-600 rounded-lg px-2 py-1 bg-gray-700 ${financialStatus.color} focus:outline-none focus:border-purple-500`}
                            >
                              {FINANCIAL_STATUSES.map(status => (
                                <option key={status.value} value={status.value}>
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-white">
                              ${(order.total / 100).toFixed(2)} {order.currency}
                            </div>
                            <div className="text-sm text-gray-400">
                              {order.payment_method}
                            </div>
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                            {new Date(order.created_at).toLocaleDateString()}
                          </td>
                          
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <Link
                                href={`/admin/orders/${order.id}`}
                                className="text-purple-400 hover:text-purple-300 transition-colors"
                                title="View Details"
                              >
                                <EyeIcon className="h-5 w-5" />
                              </Link>
                              
                              <Link
                                href={`/admin/orders/${order.id}/edit`}
                                className="text-blue-400 hover:text-blue-300 transition-colors"
                                title="Edit Order"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No orders found</p>
                  <p className="text-gray-500">Try adjusting your filters</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}