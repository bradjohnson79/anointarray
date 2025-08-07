'use client'

import { useState, useEffect } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import OrderItemTooltip from '@/components/OrderItemTooltip'
import ShippingLabelPreview from '@/components/ShippingLabelPreview'
import AddressTooltip from '@/components/AddressTooltip'
import { 
  ShoppingCart, 
  Search, 
  Filter, 
  Eye, 
  Package, 
  Truck, 
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Printer,
  MessageCircle,
  RotateCcw,
  ExternalLink,
  Download,
  Mail,
  Phone,
  MapPin,
  Zap,
  AlertTriangle,
  Copy,
  Edit,
  User
} from 'lucide-react'
import { 
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  generateShippingLabel,
  generateDigitalDownloadLinks,
  addOrderNote,
  processRefund,
  calculateOrderMetrics,
  getOrderStatusColor,
  getPaymentStatusColor,
  formatCurrency,
  type Order,
  type OrderNote,
  type ShippingLabel
} from '@/lib/orders'

export default function OrderManagementPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [paymentFilter, setPaymentFilter] = useState<string>('all')
  const [showOrderDetail, setShowOrderDetail] = useState(false)
  const [showRefundModal, setShowRefundModal] = useState(false)
  const [showNoteModal, setShowNoteModal] = useState(false)
  const [newNote, setNewNote] = useState('')
  const [refundAmount, setRefundAmount] = useState('')
  const [refundReason, setRefundReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [hoveredOrder, setHoveredOrder] = useState<string | null>(null)
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
  const [showLabelPreview, setShowLabelPreview] = useState(false)
  const [previewLabel, setPreviewLabel] = useState<ShippingLabel | null>(null)
  const [hoveredAddress, setHoveredAddress] = useState<string | null>(null)
  const [addressTooltipPosition, setAddressTooltipPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setOrders(getAllOrders())
  }, [])

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || order.paymentStatus === paymentFilter
    
    return matchesSearch && matchesStatus && matchesPayment
  })

  const metrics = calculateOrderMetrics(orders)

  const handleOrderSelect = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetail(true)
  }

  const handleStatusUpdate = async (orderId: string, newStatus: Order['status']) => {
    setProcessing(true)
    try {
      const success = updateOrderStatus(orderId, newStatus)
      if (success) {
        // Refresh orders
        setOrders(getAllOrders())
        
        // Update selected order if it's the one being changed
        if (selectedOrder?.id === orderId) {
          const updatedOrder = getOrderById(orderId)
          if (updatedOrder) {
            setSelectedOrder(updatedOrder)
          }
        }
        
        alert(`Order status updated to ${newStatus}`)
      }
    } catch (error) {
      alert('Failed to update order status')
    } finally {
      setProcessing(false)
    }
  }

  const handleGenerateShippingLabel = async (orderId: string) => {
    if (!selectedOrder?.shippingMethod) return
    
    setProcessing(true)
    try {
      const label = generateShippingLabel(
        orderId,
        selectedOrder.shippingMethod.carrier,
        selectedOrder.shippingMethod.serviceCode
      )
      
      if (label) {
        // Add system note
        addOrderNote(orderId, `Shipping label generated: ${label.trackingNumber}`, 'system')
        
        // Refresh order data
        const updatedOrder = getOrderById(orderId)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
          setOrders(getAllOrders())
        }
        
        // Show label preview
        setPreviewLabel(label)
        setShowLabelPreview(true)
      }
    } catch (error) {
      alert('Failed to generate shipping label')
    } finally {
      setProcessing(false)
    }
  }

  const handleGenerateDigitalLinks = async (orderId: string) => {
    setProcessing(true)
    try {
      const links = generateDigitalDownloadLinks(orderId)
      
      if (links.length > 0) {
        // Add system note
        addOrderNote(orderId, `Digital download links generated for ${links.length} items`, 'system')
        
        // Refresh order data
        const updatedOrder = getOrderById(orderId)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
          setOrders(getAllOrders())
        }
        
        alert(`Digital download links generated and sent to customer!\n${links.length} items processed.`)
      }
    } catch (error) {
      alert('Failed to generate digital download links')
    } finally {
      setProcessing(false)
    }
  }

  const handleAddNote = async () => {
    if (!selectedOrder || !newNote.trim()) return
    
    const success = addOrderNote(selectedOrder.id, newNote.trim(), 'internal')
    if (success) {
      setNewNote('')
      setShowNoteModal(false)
      
      // Refresh order data
      const updatedOrder = getOrderById(selectedOrder.id)
      if (updatedOrder) {
        setSelectedOrder(updatedOrder)
        setOrders(getAllOrders())
      }
    }
  }

  const handleProcessRefund = async () => {
    if (!selectedOrder || !refundAmount || !refundReason.trim()) return
    
    setProcessing(true)
    try {
      const result = processRefund(
        selectedOrder.id,
        parseFloat(refundAmount),
        refundReason.trim()
      )
      
      if (result.success) {
        setRefundAmount('')
        setRefundReason('')
        setShowRefundModal(false)
        
        // Refresh order data
        const updatedOrder = getOrderById(selectedOrder.id)
        if (updatedOrder) {
          setSelectedOrder(updatedOrder)
          setOrders(getAllOrders())
        }
        
        alert(result.message)
      } else {
        alert(result.message)
      }
    } catch (error) {
      alert('Failed to process refund')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
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
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-700/25">
                      <td className="p-4 w-44">
                        <div 
                          className="cursor-help transition-colors hover:bg-gray-700/20 p-2 -m-2 rounded"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect()
                            setTooltipPosition({
                              x: rect.left + rect.width / 2,
                              y: rect.top
                            })
                            setHoveredOrder(order.id)
                          }}
                          onMouseLeave={() => setHoveredOrder(null)}
                        >
                          <div className="font-medium text-white">{order.orderNumber}</div>
                          <div className="text-sm text-gray-400">
                            {order.items.length} item{order.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </td>
                      <td className="p-4 w-48">
                        <button
                          onClick={() => handleOrderSelect(order)}
                          className="w-full text-left p-2 rounded hover:bg-gray-700/50 transition-colors cursor-pointer"
                          title="View Order Details"
                        >
                          <div className="font-medium text-white">{order.customer.name}</div>
                          <div className="text-sm text-gray-400">{order.customer.email}</div>
                        </button>
                      </td>
                      <td className="p-4 w-40">
                        {order.shippingAddress ? (
                          <div 
                            className="cursor-help transition-colors hover:bg-gray-700/20 p-1 -m-1 rounded"
                            onMouseEnter={(e) => {
                              const rect = e.currentTarget.getBoundingClientRect()
                              setAddressTooltipPosition({
                                x: rect.left + rect.width / 2,
                                y: rect.top
                              })
                              setHoveredAddress(order.id)
                            }}
                            onMouseLeave={() => setHoveredAddress(null)}
                          >
                            <div className="text-white text-sm font-medium">
                              {order.shippingAddress.city}, {order.shippingAddress.province}
                            </div>
                            <div className="text-gray-400 text-xs">
                              {order.shippingAddress.postalCode}
                            </div>
                          </div>
                        ) : (
                          <div className="text-gray-500 text-sm italic">Digital Only</div>
                        )}
                      </td>
                      <td className="p-4 w-28">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getOrderStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="p-4 w-32">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(order.paymentStatus)}`}>
                          {order.paymentStatus.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 w-28 text-white font-medium">{formatCurrency(order.total)}</td>
                      <td className="p-4 w-28 text-gray-300">{new Date(order.createdAt).toLocaleDateString()}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Order Detail Modal */}
        {showOrderDetail && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center lg:justify-end z-50 p-2 lg:p-4 lg:pl-72">
            <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white">Order Details</h3>
                    <p className="text-gray-400 mt-1">{selectedOrder.orderNumber}</p>
                  </div>
                  <button
                    onClick={() => setShowOrderDetail(false)}
                    className="text-gray-400 hover:text-white text-2xl"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-8">
                <div className="min-w-0 lg:min-w-[900px] overflow-x-auto">
                  <div className="min-w-[800px]">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                            {selectedOrder.paymentStatus.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Status Update Buttons */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
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

                      {/* Action Buttons */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Shipping Label */}
                        {selectedOrder.shippingAddress && !selectedOrder.shippingMethod?.trackingNumber && (
                          <button
                            onClick={() => handleGenerateShippingLabel(selectedOrder.id)}
                            disabled={processing}
                            className="flex items-center justify-center px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Printer size={16} className="mr-2" />
                            Generate Label
                          </button>
                        )}

                        {/* Digital Delivery */}
                        {selectedOrder.items.some(item => item.productType === 'digital') && !selectedOrder.digitalDelivery && (
                          <button
                            onClick={() => handleGenerateDigitalLinks(selectedOrder.id)}
                            disabled={processing}
                            className="flex items-center justify-center px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors text-sm"
                          >
                            <Download size={16} className="mr-2" />
                            Generate Links
                          </button>
                        )}

                        {/* Add Note */}
                        <button
                          onClick={() => setShowNoteModal(true)}
                          className="flex items-center justify-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors text-sm"
                        >
                          <MessageCircle size={16} className="mr-2" />
                          Add Note
                        </button>

                        {/* Process Refund */}
                        {selectedOrder.paymentStatus === 'paid' && (
                          <button
                            onClick={() => setShowRefundModal(true)}
                            className="flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                          >
                            <RotateCcw size={16} className="mr-2" />
                            Process Refund
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Order Items</h4>
                      <div className="space-y-4">
                        {selectedOrder.items.map((item) => (
                          <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-600/30 rounded-lg">
                            <div className="w-12 h-12 bg-gray-500/30 rounded-lg flex items-center justify-center">
                              {item.productType === 'digital' ? (
                                <Zap className="w-6 h-6 text-purple-400" />
                              ) : (
                                <Package className="w-6 h-6 text-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h5 className="font-medium text-white">{item.title}</h5>
                              <div className="flex items-center space-x-4 text-sm text-gray-400">
                                <span>SKU: {item.sku}</span>
                                <span>Qty: {item.quantity}</span>
                                <span>Price: {formatCurrency(item.price)}</span>
                                {item.productType === 'physical' && item.weight && (
                                  <span>Weight: {item.weight}kg</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-semibold text-white">
                                {formatCurrency(item.price * item.quantity)}
                              </div>
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                item.fulfillmentStatus === 'fulfilled' 
                                  ? 'bg-green-600/20 text-green-300'
                                  : 'bg-yellow-600/20 text-yellow-300'
                              }`}>
                                {item.fulfillmentStatus}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Shipping Information */}
                    {selectedOrder.shippingAddress && (
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Shipping Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <h5 className="font-medium text-white mb-2">Shipping Address</h5>
                            <div className="text-gray-300 text-sm space-y-1">
                              <p>{selectedOrder.shippingAddress.name}</p>
                              {selectedOrder.shippingAddress.company && (
                                <p>{selectedOrder.shippingAddress.company}</p>
                              )}
                              <p>{selectedOrder.shippingAddress.address1}</p>
                              {selectedOrder.shippingAddress.address2 && (
                                <p>{selectedOrder.shippingAddress.address2}</p>
                              )}
                              <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.province} {selectedOrder.shippingAddress.postalCode}</p>
                              <p>{selectedOrder.shippingAddress.country}</p>
                              {selectedOrder.shippingAddress.phone && (
                                <p>{selectedOrder.shippingAddress.phone}</p>
                              )}
                            </div>
                          </div>
                          
                          {selectedOrder.shippingMethod && (
                            <div>
                              <h5 className="font-medium text-white mb-2">Shipping Method</h5>
                              <div className="text-gray-300 text-sm space-y-1">
                                <p>{selectedOrder.shippingMethod.name}</p>
                                <p className="capitalize">{selectedOrder.shippingMethod.carrier.replace('-', ' ')}</p>
                                {selectedOrder.shippingMethod.trackingNumber && (
                                  <div className="flex items-center space-x-2">
                                    <span>Tracking: {selectedOrder.shippingMethod.trackingNumber}</span>
                                    <button
                                      onClick={() => copyToClipboard(selectedOrder.shippingMethod!.trackingNumber!)}
                                      className="text-purple-400 hover:text-purple-300"
                                    >
                                      <Copy size={14} />
                                    </button>
                                  </div>
                                )}
                                {selectedOrder.shippingMethod.estimatedDelivery && (
                                  <p>Estimated: {selectedOrder.shippingMethod.estimatedDelivery}</p>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Digital Delivery */}
                    {selectedOrder.digitalDelivery && (
                      <div className="bg-gray-700/30 rounded-lg p-6">
                        <h4 className="text-lg font-semibold text-white mb-4">Digital Delivery</h4>
                        <div className="space-y-3">
                          {selectedOrder.digitalDelivery.downloadLinks.map((link) => (
                            <div key={link.id} className="flex items-center justify-between p-3 bg-gray-600/30 rounded-lg">
                              <div>
                                <div className="text-white font-medium">Download Link</div>
                                <div className="text-sm text-gray-400">
                                  Downloads: {link.downloadCount}/{link.maxDownloads} | 
                                  Expires: {new Date(link.expiresAt).toLocaleDateString()}
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => copyToClipboard(link.url)}
                                  className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                                  title="Copy Link"
                                >
                                  <Copy size={16} />
                                </button>
                                <button
                                  className="p-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                                  title="View Link"
                                >
                                  <ExternalLink size={16} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Order Notes */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-lg font-semibold text-white">Order Notes</h4>
                        <button
                          onClick={() => setShowNoteModal(true)}
                          className="text-purple-400 hover:text-purple-300 text-sm"
                        >
                          Add Note
                        </button>
                      </div>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {selectedOrder.notes.map((note) => (
                          <div key={note.id} className={`p-3 rounded-lg ${
                            note.type === 'internal' ? 'bg-blue-600/10 border border-blue-600/20' :
                            note.type === 'customer' ? 'bg-green-600/10 border border-green-600/20' :
                            'bg-gray-600/10 border border-gray-600/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                note.type === 'internal' ? 'bg-blue-600/20 text-blue-300' :
                                note.type === 'customer' ? 'bg-green-600/20 text-green-300' :
                                'bg-gray-600/20 text-gray-300'
                              }`}>
                                {note.type}
                              </span>
                              <span className="text-xs text-gray-400">
                                {note.author} - {new Date(note.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{note.message}</p>
                          </div>
                        ))}
                        
                        {selectedOrder.customerNotes && (
                          <div className="p-3 rounded-lg bg-green-600/10 border border-green-600/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs px-2 py-1 rounded-full bg-green-600/20 text-green-300">
                                Customer Note
                              </span>
                            </div>
                            <p className="text-gray-300 text-sm">{selectedOrder.customerNotes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Customer and Payment Information */}
                  <div className="space-y-6">
                    {/* Customer Information */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Customer Information</h4>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <User className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedOrder.customer.name}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-300">{selectedOrder.customer.email}</span>
                        </div>
                        {selectedOrder.customer.phone && (
                          <div className="flex items-center space-x-3">
                            <Phone className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-300">{selectedOrder.customer.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Payment Information */}
                    <div className="bg-gray-700/30 rounded-lg p-6">
                      <h4 className="text-lg font-semibold text-white mb-4">Payment Information</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Method:</span>
                          <span className="text-white capitalize">{selectedOrder.paymentMethod}</span>
                        </div>
                        {selectedOrder.transactionId && (
                          <div className="flex justify-between">
                            <span className="text-gray-400">Transaction:</span>
                            <span className="text-white font-mono text-sm">{selectedOrder.transactionId}</span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-gray-400">Status:</span>
                          <span className={`px-2 py-1 rounded-full text-xs ${getPaymentStatusColor(selectedOrder.paymentStatus)}`}>
                            {selectedOrder.paymentStatus.replace('_', ' ')}
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
                        
                        {selectedOrder.shipping > 0 && (
                          <div className="flex justify-between text-gray-300">
                            <span>Shipping:</span>
                            <span>{formatCurrency(selectedOrder.shipping)}</span>
                          </div>
                        )}
                        
                        {selectedOrder.taxes.hst > 0 && (
                          <div className="flex justify-between text-gray-300">
                            <span>HST:</span>
                            <span>{formatCurrency(selectedOrder.taxes.hst)}</span>
                          </div>
                        )}
                        
                        {selectedOrder.taxes.gst > 0 && (
                          <div className="flex justify-between text-gray-300">
                            <span>GST:</span>
                            <span>{formatCurrency(selectedOrder.taxes.gst)}</span>
                          </div>
                        )}
                        
                        {selectedOrder.taxes.pst > 0 && (
                          <div className="flex justify-between text-gray-300">
                            <span>PST:</span>
                            <span>{formatCurrency(selectedOrder.taxes.pst)}</span>
                          </div>
                        )}
                        
                        <div className="border-t border-gray-600 pt-2 mt-2">
                          <div className="flex justify-between text-lg font-semibold text-white">
                            <span>Total:</span>
                            <span>{formatCurrency(selectedOrder.total)}</span>
                          </div>
                        </div>
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

        {/* Add Note Modal */}
        {showNoteModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Add Order Note</h3>
              </div>
              <div className="p-6">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Enter your note..."
                  rows={4}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex justify-end space-x-3 mt-4">
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddNote}
                    disabled={!newNote.trim()}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Add Note
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {showRefundModal && selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Process Refund</h3>
                <p className="text-gray-400 text-sm mt-1">Order Total: {formatCurrency(selectedOrder.total)}</p>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refund Amount ({selectedOrder.currency})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedOrder.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                    placeholder="0.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Refund Reason
                  </label>
                  <textarea
                    value={refundReason}
                    onChange={(e) => setRefundReason(e.target.value)}
                    placeholder="Reason for refund..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                {selectedOrder.paymentMethod === 'nowpayments' && (
                  <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                      <AlertTriangle className="w-4 h-4" />
                      <span className="text-sm font-medium">Cryptocurrency Refund</span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Crypto refunds require manual processing. Network fees will be deducted from the refund amount.
                    </p>
                  </div>
                )}

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowRefundModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProcessRefund}
                    disabled={!refundAmount || !refundReason.trim() || processing}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    {processing ? 'Processing...' : 'Process Refund'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Order Item Tooltip */}
        {hoveredOrder && (
          <OrderItemTooltip
            items={orders.find(o => o.id === hoveredOrder)?.items || []}
            show={hoveredOrder !== null}
            position={tooltipPosition}
          />
        )}

        {/* Shipping Label Preview */}
        {showLabelPreview && previewLabel && (
          <ShippingLabelPreview
            label={previewLabel}
            show={showLabelPreview}
            onClose={() => {
              setShowLabelPreview(false)
              setPreviewLabel(null)
            }}
          />
        )}

        {/* Address Tooltip */}
        {hoveredAddress && (
          <AddressTooltip
            address={orders.find(o => o.id === hoveredAddress)?.shippingAddress!}
            show={hoveredAddress !== null}
            position={addressTooltipPosition}
          />
        )}
      </Layout>
    </ProtectedRoute>
  )
}