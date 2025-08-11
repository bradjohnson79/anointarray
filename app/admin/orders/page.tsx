'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  ShoppingCart, 
  Search, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle,
  Clock,
  DollarSign,
  Download,
  Mail,
  Phone,
  MapPin,
  Copy,
  User
} from 'lucide-react'
import { OrdersAPI, Order, OrderItem, TaxAPI } from '@/lib/supabase-products'

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [statusFilter, paymentFilter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const filters: any = {}
      
      if (statusFilter !== 'all') filters.status = statusFilter
      if (paymentFilter !== 'all') filters.financial_status = paymentFilter
      
      const ordersData = await OrdersAPI.getAll(filters)
      setOrders(ordersData)
    } catch (error) {
      console.error('Failed to load orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (searchTerm === '') return true
    
    const searchLower = searchTerm.toLowerCase()
    return (
      order.order_number.toLowerCase().includes(searchLower) ||
      order.customer_email.toLowerCase().includes(searchLower) ||
      (order.billing_first_name + ' ' + order.billing_last_name).toLowerCase().includes(searchLower)
    )
  })

  const getOrderStats = () => {
    return {
      total: orders.length,
      pending: orders.filter(o => o.status === 'pending').length,
      processing: orders.filter(o => o.status === 'processing').length,
      shipped: orders.filter(o => o.status === 'shipped').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      totalRevenue: orders.filter(o => o.financial_status === 'paid').reduce((sum, o) => sum + o.total_amount, 0),
      averageOrderValue: orders.length > 0 ? orders.reduce((sum, o) => sum + o.total_amount, 0) / orders.length : 0
    }
  }

  const metrics = getOrderStats()

  const handleOrderSelect = async (order: Order) => {
    try {
      // Load full order details including items and status history
      const fullOrder = await OrdersAPI.getById(order.id)
      if (fullOrder) {
        setSelectedOrder(fullOrder)
        setShowOrderDetail(true)
      }
    } catch (error) {
      console.error('Failed to load order details:', error)
    }
  }

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setProcessing(true)
    try {
      await OrdersAPI.updateStatus(orderId, newStatus, `Status updated to ${newStatus}`, true)
      
      // Refresh orders
      await loadOrders()
      
      // Update selected order if it's the one being changed
      if (selectedOrder?.id === orderId) {
        const updatedOrder = await OrdersAPI.getById(orderId)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
        }
      }
      
      alert(`Order status updated to ${newStatus}`)
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(amount)
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600/20 text-yellow-300'
      case 'processing': return 'bg-blue-600/20 text-blue-300'
      case 'shipped': return 'bg-purple-600/20 text-purple-300'
      case 'delivered': return 'bg-green-600/20 text-green-300'
      case 'cancelled': return 'bg-red-600/20 text-red-300'
      case 'refunded': return 'bg-gray-600/20 text-gray-300'
      default: return 'bg-gray-600/20 text-gray-300'
    }
  }

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-600/20 text-green-300'
      case 'pending': return 'bg-yellow-600/20 text-yellow-300'
      case 'partially_paid': return 'bg-orange-600/20 text-orange-300'
      case 'refunded': return 'bg-blue-600/20 text-blue-300'
      case 'partially_refunded': return 'bg-blue-600/20 text-blue-300'
      case 'voided': return 'bg-red-600/20 text-red-300'
      default: return 'bg-gray-600/20 text-gray-300'
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-CA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="p-6 space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
              <p className="text-gray-400">Process orders, manage fulfillment, and handle customer requests</p>
            </div>
          </div>

          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Total Orders</h3>
                <ShoppingCart className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-3xl font-bold text-white">{metrics.total}</p>
              <p className="text-sm text-gray-400 mt-1">All time</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Processing</h3>
                <Clock className="w-6 h-6 text-yellow-400" />
              </div>
              <p className="text-3xl font-bold text-white">{metrics.processing + metrics.pending}</p>
              <p className="text-sm text-gray-400 mt-1">Needs attention</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Revenue</h3>
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(metrics.totalRevenue)}</p>
              <p className="text-sm text-gray-400 mt-1">Total paid orders</p>
            </div>

            <div className="bg-gray-800/50 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Avg Order</h3>
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <p className="text-3xl font-bold text-white">{formatCurrency(metrics.averageOrderValue)}</p>
              <p className="text-sm text-gray-400 mt-1">Average value</p>
            </div>
          </div>

          {/* Filters and Search */}
          <div className="bg-gray-800/50 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Payments</option>
                <option value="pending">Payment Pending</option>
                <option value="paid">Paid</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
                <option value="partially_refunded">Partially Refunded</option>
              </select>

              <div className="text-sm text-gray-400">
                Showing {filteredOrders.length} of {orders.length} orders
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-gray-800/50 rounded-lg overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
              <table className="w-full min-w-[1400px]">
                <thead className="bg-gray-700/50">
                  <tr>
                    <th className="text-left p-4 text-gray-300 w-44">Order</th>
                    <th className="text-left p-4 text-gray-300 w-48">Customer</th>
                    <th className="text-left p-4 text-gray-300 w-40">Shipping Address</th>
                    <th className="text-left p-4 text-gray-300 w-28">Status</th>
                    <th className="text-left p-4 text-gray-300 w-32">Payment</th>
                    <th className="text-left p-4 text-gray-300 w-28">Total</th>
                    <th className="text-left p-4 text-gray-300 w-28">Date</th>
                    <th className="text-left p-4 text-gray-300 w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-white">
                        Loading orders...
                      </td>
                    </tr>
                  ) : filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-gray-400">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((order) => {
                      const itemCount = (order as any).order_items?.length || 0
                      return (
                        <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-700/25">
                          <td className="p-4 w-44">
                            <div className="cursor-pointer" onClick={() => handleOrderSelect(order)}>
                              <div className="font-medium text-white">{order.order_number}</div>
                              <div className="text-sm text-gray-400">
                                {itemCount} item{itemCount !== 1 ? 's' : ''}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 w-48">
                            <button
                              onClick={() => handleOrderSelect(order)}
                              className="w-full text-left p-2 rounded hover:bg-gray-700/50 transition-colors cursor-pointer"
                              title="View Order Details"
                            >
                              <div className="font-medium text-white">
                                {order.billing_first_name} {order.billing_last_name}
                              </div>
                              <div className="text-sm text-gray-400">{order.customer_email}</div>
                            </button>
                          </td>
                          <td className="p-4 w-40">
                            {order.shipping_city ? (
                              <div className="text-white text-sm font-medium">
                                {order.shipping_city}, {order.shipping_province}
                              </div>
                            ) : order.billing_city ? (
                              <div className="text-white text-sm font-medium">
                                {order.billing_city}, {order.billing_province}
                              </div>
                            ) : (
                              <div className="text-gray-500 text-sm italic">No address</div>
                            )}
                          </td>
                          <td className="p-4 w-28">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="p-4 w-32">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.financial_status)}`}>
                              {order.financial_status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="p-4 w-28 text-white font-medium">{formatCurrency(order.total_amount)}</td>
                          <td className="p-4 w-28 text-gray-300">{formatDate(order.created_at)}</td>
                          <td className="p-4 w-20">
                            <button
                              onClick={() => handleOrderSelect(order)}
                              className="p-2 text-gray-400 hover:text-white transition-colors"
                              title="View Details"
                            >
                              <Eye size={16} />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-auto">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Order Details</h3>
                    <p className="text-gray-400 mt-1">{selectedOrder.order_number}</p>
                  </div>
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Order Information */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Status and Actions */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h4 className="text-lg font-semibold text-white">Order Status</h4>
                        <div className="flex items-center space-x-3">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getOrderStatusColor(selectedOrder.status)}`}>
                            {selectedOrder.status}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedOrder.financial_status)}`}>
                            {selectedOrder.financial_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {selectedOrder.status !== 'processing' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, 'processing')}
                            disabled={processing}
                            className="flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Clock size={16} className="mr-2" />
                            Mark Processing
                          </button>
                        )}
                        
                        {selectedOrder.status !== 'shipped' && selectedOrder.status !== 'delivered' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, 'shipped')}
                            disabled={processing}
                            className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Truck size={16} className="mr-2" />
                            Mark Shipped
                          </button>
                        )}
                        
                        {selectedOrder.status !== 'delivered' && (
                          <button
                            onClick={() => handleStatusUpdate(selectedOrder.id, 'delivered')}
                            disabled={processing}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <CheckCircle size={16} className="mr-2" />
                            Mark Delivered
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Order Items</h4>
                      <div className="space-y-4">
                        {(selectedOrder as any).order_items?.map((item: any) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-600/30 rounded-lg">
                            <div className="w-12 h-12 bg-gray-500/30 rounded-lg flex items-center justify-center">
                              {item.is_digital ? (
                                <Download className="w-6 h-6 text-purple-400" />
                              ) : (
                                <Package className="w-6 h-6 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-white">{item.title}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span>SKU: {item.sku}</span>
                                <span>Qty: {item.quantity}</span>
                                <span>Price: {formatCurrency(item.unit_price)}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {formatCurrency(item.total_price)}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.fulfilled_quantity >= item.quantity
                                  ? 'bg-green-600/20 text-green-300'
                                  : 'bg-yellow-600/20 text-yellow-300'
                              }`}>
                                {item.fulfilled_quantity >= item.quantity ? 'fulfilled' : 'pending'}
                              </span>
                            </div>
                          </div>
                        )) || (
                          <div className="text-gray-400 text-center py-4">
                            No items found
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Addresses */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Customer Addresses</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            Billing Address
                          </h5>
                          <div className="text-gray-300 text-sm space-y-1">
                            <p>{selectedOrder.billing_first_name} {selectedOrder.billing_last_name}</p>
                            {selectedOrder.billing_company && <p>{selectedOrder.billing_company}</p>}
                            <p>{selectedOrder.billing_address_line_1}</p>
                            {selectedOrder.billing_address_line_2 && <p>{selectedOrder.billing_address_line_2}</p>}
                            <p>{selectedOrder.billing_city}, {selectedOrder.billing_province} {selectedOrder.billing_postal_code}</p>
                            <p>{selectedOrder.billing_country}</p>
                          </div>
                        </div>
                        
                        {selectedOrder.shipping_address_line_1 && (
                          <div>
                            <h5 className="font-medium text-white mb-2 flex items-center gap-2">
                              <Truck className="w-4 h-4" />
                              Shipping Address
                            </h5>
                            <div className="text-gray-300 text-sm space-y-1">
                              <p>{selectedOrder.shipping_first_name} {selectedOrder.shipping_last_name}</p>
                              {selectedOrder.shipping_company && <p>{selectedOrder.shipping_company}</p>}
                              <p>{selectedOrder.shipping_address_line_1}</p>
                              {selectedOrder.shipping_address_line_2 && <p>{selectedOrder.shipping_address_line_2}</p>}
                              <p>{selectedOrder.shipping_city}, {selectedOrder.shipping_province} {selectedOrder.shipping_postal_code}</p>
                              <p>{selectedOrder.shipping_country}</p>
                            </div>
                            {selectedOrder.tracking_number && (
                              <div className="mt-3 pt-3 border-t border-gray-600">
                                <div className="text-sm text-gray-400">Tracking Number:</div>
                                <div className="text-white font-mono flex items-center gap-2">
                                  {selectedOrder.tracking_number}
                                  <button
                                    onClick={() => copyToClipboard(selectedOrder.tracking_number!)}
                                    className="text-purple-400 hover:text-purple-300"
                                  >
                                    <Copy size={14} />
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Order Notes */}
                    {(selectedOrder.notes || selectedOrder.admin_notes) && (
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Notes</h4>
                        <div className="space-y-3">
                          {selectedOrder.notes && (
                            <div className="p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
                              <div className="text-sm text-blue-300 mb-1">Customer Notes:</div>
                              <p className="text-gray-300 text-sm">{selectedOrder.notes}</p>
                            </div>
                          )}
                          {selectedOrder.admin_notes && (
                            <div className="p-3 rounded-lg bg-purple-600/10 border border-purple-600/20">
                              <div className="text-sm text-purple-300 mb-1">Admin Notes:</div>
                              <p className="text-gray-300 text-sm">{selectedOrder.admin_notes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Customer and Payment Information */}
                  <div className="space-y-6">
                    {/* Customer Information */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Customer Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">
                            {selectedOrder.billing_first_name} {selectedOrder.billing_last_name}
                          </span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedOrder.customer_email}</span>
                        </div>
                        {selectedOrder.customer_phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{selectedOrder.customer_phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <DollarSign className="w-5 h-5" />
                        Payment Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Method:</span>
                          <span className="text-white capitalize">{selectedOrder.payment_method || 'Not specified'}</span>
                        </div>
                        {selectedOrder.transaction_id && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Transaction:</span>
                            <span className="text-white font-mono text-sm">{selectedOrder.transaction_id}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(selectedOrder.financial_status)}`}>
                            {selectedOrder.financial_status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Order Summary */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Order Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-300">
                          <span>Subtotal:</span>
                          <span>{formatCurrency(selectedOrder.subtotal)}</span>
                        </div>
                        
                        {selectedOrder.shipping_cost > 0 && (
                          <div className="flex justify-between text-gray-300">
                            <span>Shipping:</span>
                            <span>{formatCurrency(selectedOrder.shipping_cost)}</span>
                          </div>
                        )}

                        {selectedOrder.discount_amount > 0 && (
                          <div className="flex justify-between text-gray-300">
                            <span>Discount:</span>
                            <span>-{formatCurrency(selectedOrder.discount_amount)}</span>
                          </div>
                        )}
                        
                        <div className="flex justify-between text-gray-300">
                          <span>Tax:</span>
                          <span>{formatCurrency(selectedOrder.tax_amount)}</span>
                        </div>

                        {/* Tax Breakdown */}
                        {selectedOrder.tax_breakdown && (
                          <div className="ml-4 space-y-1 text-xs">
                            {Object.entries(selectedOrder.tax_breakdown).map(([key, value]: [string, any]) => (
                              <div key={key} className="flex justify-between text-gray-400">
                                <span className="capitalize">{key.replace('_', ' ')}:</span>
                                <span>{typeof value === 'number' ? formatCurrency(value) : value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        <div className="border-t border-gray-600 pt-2 mt-2">
                          <div className="flex justify-between text-lg font-semibold text-white">
                            <span>Total:</span>
                            <span>{formatCurrency(selectedOrder.total_amount)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </Layout>
    </ProtectedRoute>
  )
}