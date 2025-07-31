import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Search, Filter, Eye, Download, DollarSign, Package } from 'lucide-react'

interface Order {
  id: string
  customerEmail: string
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  items: Array<{
    id: string
    name: string
    quantity: number
    price: number
  }>
  shippingAddress: {
    name: string
    address: string
    city: string
    country: string
    postalCode: string
  }
  createdAt: string
  shippedAt?: string
  trackingNumber?: string
}

// Mock order data
const mockOrders: Order[] = [
  {
    id: 'ORD-001',
    customerEmail: 'customer1@example.com',
    total: 156.43,
    status: 'shipped',
    paymentStatus: 'paid',
    items: [
      { id: '1', name: 'AetherX Card Decks', quantity: 2, price: 24.11 },
      { id: '2', name: 'ANOINT Manifestation Sphere', quantity: 1, price: 111.32 }
    ],
    shippingAddress: {
      name: 'John Doe',
      address: '123 Main St',
      city: 'Toronto',
      country: 'Canada',
      postalCode: 'M5V 3A8'
    },
    createdAt: '2025-01-25',
    shippedAt: '2025-01-26',
    trackingNumber: 'CP123456789CA'
  },
  {
    id: 'ORD-002',
    customerEmail: 'customer2@example.com',
    total: 37.31,
    status: 'processing',
    paymentStatus: 'paid',
    items: [
      { id: '3', name: 'ANOINT Pet Collars', quantity: 1, price: 12.32 },
      { id: '4', name: 'Wooden Wall Arrays', quantity: 1, price: 22.31 }
    ],
    shippingAddress: {
      name: 'Jane Smith',
      address: '456 Oak Ave',
      city: 'Vancouver',
      country: 'Canada',
      postalCode: 'V6B 1A1'
    },
    createdAt: '2025-01-24'
  },
  {
    id: 'ORD-003',
    customerEmail: 'customer3@example.com',
    total: 24.64,
    status: 'pending',
    paymentStatus: 'failed',
    items: [
      { id: '5', name: 'ANOINT Torus Donut Necklaces', quantity: 2, price: 12.32 }
    ],
    shippingAddress: {
      name: 'Bob Johnson',
      address: '789 Pine Rd',
      city: 'Montreal',
      country: 'Canada',
      postalCode: 'H3A 0G4'
    },
    createdAt: '2025-01-23'
  }
]

const AdminOrders = () => {
  const [orders, setOrders] = useState<Order[]>(mockOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [showOrderDetails, setShowOrderDetails] = useState(false)

  const statusColors = {
    pending: 'bg-yellow-900 text-yellow-300',
    processing: 'bg-blue-900 text-blue-300',
    shipped: 'bg-green-900 text-green-300',
    delivered: 'bg-emerald-900 text-emerald-300',
    cancelled: 'bg-red-900 text-red-300'
  }

  const paymentStatusColors = {
    pending: 'bg-yellow-900 text-yellow-300',
    paid: 'bg-green-900 text-green-300',
    failed: 'bg-red-900 text-red-300',
    refunded: 'bg-gray-900 text-gray-300'
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const handleStatusUpdate = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(order =>
      order.id === orderId
        ? { ...order, status: newStatus, ...(newStatus === 'shipped' && { shippedAt: new Date().toISOString().split('T')[0] }) }
        : order
    ))
  }

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order)
    setShowOrderDetails(true)
  }

  const exportOrders = () => {
    // Implement CSV export
    console.log('Exporting orders...')
  }

  const getTotalRevenue = () => {
    return orders
      .filter(order => order.paymentStatus === 'paid')
      .reduce((total, order) => total + order.total, 0)
  }

  const getOrderStats = () => {
    const total = orders.length
    const pending = orders.filter(o => o.status === 'pending').length
    const processing = orders.filter(o => o.status === 'processing').length
    const shipped = orders.filter(o => o.status === 'shipped').length
    return { total, pending, processing, shipped }
  }

  const stats = getOrderStats()

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-serif">Order Management</h1>
              <button
                onClick={exportOrders}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Download size={20} />
                Export Orders
              </button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-4 gap-6 mb-8">
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Total Orders</p>
                    <p className="text-3xl font-bold text-white">{stats.total}</p>
                  </div>
                  <Package className="text-purple-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Pending</p>
                    <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                  </div>
                  <Calendar className="text-yellow-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Processing</p>
                    <p className="text-3xl font-bold text-blue-400">{stats.processing}</p>
                  </div>
                  <Package className="text-blue-400" size={32} />
                </div>
              </div>
              
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">Revenue</p>
                    <p className="text-3xl font-bold text-green-400">${getTotalRevenue().toFixed(2)}</p>
                  </div>
                  <DollarSign className="text-green-400" size={32} />
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search by order ID or customer email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 appearance-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Order ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Customer</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Payment</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {filteredOrders.map((order) => (
                      <tr key={order.id} className="hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap font-mono text-sm">{order.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap">{order.customerEmail}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-bold text-green-400">${order.total.toFixed(2)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusUpdate(order.id, e.target.value as Order['status'])}
                            className={`px-2 py-1 text-xs rounded border-none ${statusColors[order.status]}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs rounded ${paymentStatusColors[order.paymentStatus]}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">{order.createdAt}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleViewOrder(order)}
                            className="text-purple-400 hover:text-purple-300 transition-colors"
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Details Modal */}
            {showOrderDetails && selectedOrder && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">Order Details</h2>
                    <button
                      onClick={() => setShowOrderDetails(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Order Info */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-lg font-bold mb-3">Order Information</h3>
                        <div className="space-y-2 text-sm">
                          <p><span className="text-gray-400">Order ID:</span> {selectedOrder.id}</p>
                          <p><span className="text-gray-400">Customer:</span> {selectedOrder.customerEmail}</p>
                          <p><span className="text-gray-400">Date:</span> {selectedOrder.createdAt}</p>
                          <p><span className="text-gray-400">Status:</span> 
                            <span className={`ml-2 px-2 py-1 text-xs rounded ${statusColors[selectedOrder.status]}`}>
                              {selectedOrder.status}
                            </span>
                          </p>
                          {selectedOrder.trackingNumber && (
                            <p><span className="text-gray-400">Tracking:</span> {selectedOrder.trackingNumber}</p>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-bold mb-3">Shipping Address</h3>
                        <div className="text-sm text-gray-300">
                          <p>{selectedOrder.shippingAddress.name}</p>
                          <p>{selectedOrder.shippingAddress.address}</p>
                          <p>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.postalCode}</p>
                          <p>{selectedOrder.shippingAddress.country}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Order Items */}
                    <div>
                      <h3 className="text-lg font-bold mb-3">Order Items</h3>
                      <div className="bg-gray-700 rounded-lg overflow-hidden">
                        <table className="w-full">
                          <thead className="bg-gray-600">
                            <tr>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Product</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Qty</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Price</th>
                              <th className="px-4 py-2 text-left text-xs font-medium text-gray-300">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-600">
                            {selectedOrder.items.map((item, index) => (
                              <tr key={index}>
                                <td className="px-4 py-2">{item.name}</td>
                                <td className="px-4 py-2">{item.quantity}</td>
                                <td className="px-4 py-2">${item.price.toFixed(2)}</td>
                                <td className="px-4 py-2">${(item.quantity * item.price).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-4 text-right">
                        <p className="text-xl font-bold">
                          Total: <span className="text-green-400">${selectedOrder.total.toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default AdminOrders