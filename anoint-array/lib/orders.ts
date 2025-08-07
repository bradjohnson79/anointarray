// Order Management System with Full Lifecycle Support

import { MockAuth, type User } from './auth'

export interface Order {
  id: string
  orderNumber: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded'
  fulfillmentStatus: 'unfulfilled' | 'partial' | 'fulfilled' | 'shipped' | 'delivered'
  
  // Customer Information
  customer: {
    id?: string
    email: string
    name: string
    phone?: string
    avatar?: string
    loyaltyTier?: 'bronze' | 'silver' | 'gold'
    totalOrders?: number
    totalSpent?: number
    averageOrderValue?: number
    lastOrderDate?: string
    notes?: string[]
    communicationPreferences?: string[]
  }
  
  // Order Items
  items: OrderItem[]
  
  // Addresses
  shippingAddress?: ShippingAddress
  billingAddress: ShippingAddress
  
  // Financial
  subtotal: number
  shipping: number
  taxes: {
    hst: number
    gst: number
    pst: number
    total: number
  }
  total: number
  currency: string
  
  // Payment Information
  paymentMethod: 'stripe' | 'paypal' | 'nowpayments'
  paymentGatewayId?: string
  transactionId?: string
  
  // Shipping Information
  shippingMethod?: {
    id: string
    name: string
    carrier: 'canada-post' | 'ups'
    serviceCode: string
    trackingNumber?: string
    estimatedDelivery?: string
  }
  
  // Fulfillment
  fulfillments: Fulfillment[]
  
  // Notes and Communication
  notes: OrderNote[]
  customerNotes?: string
  internalNotes?: string
  
  // Digital Delivery
  digitalDelivery?: {
    downloadLinks: DigitalDownloadLink[]
    expiryDate: string
  }
  
  // Timestamps
  createdAt: string
  updatedAt: string
  shippedAt?: string
  deliveredAt?: string
  cancelledAt?: string
}

export interface OrderItem {
  id: string
  productId: string
  title: string
  sku: string
  quantity: number
  price: number
  productType: 'physical' | 'digital'
  weight?: number
  digitalFile?: string
  fulfillmentStatus: 'unfulfilled' | 'fulfilled'
  refundedQuantity?: number
}

export interface ShippingAddress {
  name: string
  company?: string
  address1: string
  address2?: string
  city: string
  province: string
  postalCode: string
  country: string
  phone?: string
}

export interface Fulfillment {
  id: string
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  items: {
    orderItemId: string
    quantity: number
  }[]
  shippingMethod: {
    carrier: 'canada-post' | 'ups'
    service: string
    trackingNumber?: string
  }
  shippingLabel?: {
    url: string
    format: string
    size: string
  }
  createdAt: string
  shippedAt?: string
  deliveredAt?: string
}

export interface OrderNote {
  id: string
  type: 'internal' | 'customer' | 'system'
  message: string
  author: string
  createdAt: string
}

export interface DigitalDownloadLink {
  id: string
  productId: string
  url: string
  token: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  createdAt: string
}

export interface ShippingLabel {
  id: string
  orderId: string
  fulfillmentId: string
  carrier: 'canada-post' | 'ups'
  service: string
  trackingNumber: string
  labelUrl: string
  labelFormat: 'PDF' | 'PNG'
  labelSize: '4x6' | '8.5x11'
  cost: number
  createdAt: string
}

// Mock order data
export const mockOrders: Order[] = [
  {
    id: 'order_001',
    orderNumber: 'AA-1722556800-ABC123',
    status: 'processing',
    paymentStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
    customer: {
      id: 'cust_001',
      email: 'sarah.wilson@email.com',
      name: 'Sarah Wilson',
      phone: '+1 (416) 555-0123',
      avatar: 'https://i.pravatar.cc/150?u=sarah.wilson@email.com',
      loyaltyTier: 'gold',
      totalOrders: 8,
      totalSpent: 1247.89,
      averageOrderValue: 155.99,
      lastOrderDate: '2025-08-01T10:30:00Z',
      notes: ['VIP customer', 'Prefers express shipping', 'Interested in crystal healing'],
      communicationPreferences: ['email', 'sms']
    },
    items: [
      {
        id: 'item_001',
        productId: 'prod_001',
        title: 'Sacred Crystal Energy Array',
        sku: 'AA-CRYSTAL-001',
        quantity: 1,
        price: 149.99,
        productType: 'physical',
        weight: 2.5,
        fulfillmentStatus: 'unfulfilled'
      },
      {
        id: 'item_002',
        productId: 'prod_002',
        title: 'Meditation Frequency Generator Pack',
        sku: 'AA-DIGITAL-001',
        quantity: 1,
        price: 47.99,
        productType: 'digital',
        digitalFile: '/digital/meditation-frequency-pack.zip',
        fulfillmentStatus: 'unfulfilled'
      }
    ],
    shippingAddress: {
      name: 'Sarah Wilson',
      address1: '123 Queen Street West',
      address2: 'Apt 456',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2M9',
      country: 'CA',
      phone: '+1 (416) 555-0123'
    },
    billingAddress: {
      name: 'Sarah Wilson',
      address1: '123 Queen Street West',
      address2: 'Apt 456',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5H 2M9',
      country: 'CA',
      phone: '+1 (416) 555-0123'
    },
    subtotal: 197.98,
    shipping: 18.99,
    taxes: {
      hst: 28.21,
      gst: 0,
      pst: 0,
      total: 28.21
    },
    total: 245.18,
    currency: 'CAD',
    paymentMethod: 'stripe',
    transactionId: 'pi_1234567890',
    shippingMethod: {
      id: 'cp-expedited',
      name: 'Canada Post Expedited Parcel',
      carrier: 'canada-post',
      serviceCode: 'DOM.EP',
      estimatedDelivery: '2-3 business days'
    },
    fulfillments: [],
    notes: [
      {
        id: 'note_001',
        type: 'customer',
        message: 'Please leave package with concierge if not home.',
        author: 'Sarah Wilson',
        createdAt: '2025-08-01T10:30:00Z'
      }
    ],
    customerNotes: 'Please leave package with concierge if not home.',
    createdAt: '2025-08-01T10:30:00Z',
    updatedAt: '2025-08-01T10:30:00Z'
  },
  {
    id: 'order_002',
    orderNumber: 'AA-1722553200-DEF456',
    status: 'shipped',
    paymentStatus: 'paid',
    fulfillmentStatus: 'shipped',
    customer: {
      id: 'cust_002',
      email: 'michael.chen@email.com',
      name: 'Michael Chen',
      phone: '+1 (604) 555-0789',
      avatar: 'https://i.pravatar.cc/150?u=michael.chen@email.com',
      loyaltyTier: 'silver',
      totalOrders: 4,
      totalSpent: 398.45,
      averageOrderValue: 99.61,
      lastOrderDate: '2025-08-01T07:00:00Z',
      notes: ['Bulk buyer for events', 'Owns spiritual retreat center', 'Tax exempt - business account'],
      communicationPreferences: ['email']
    },
    items: [
      {
        id: 'item_003',
        productId: 'prod_003',
        title: 'Premium White Sage Smudge Kit',
        sku: 'AA-SAGE-001',
        quantity: 2,
        price: 29.99,
        productType: 'physical',
        weight: 0.6,
        fulfillmentStatus: 'fulfilled'
      }
    ],
    shippingAddress: {
      name: 'Michael Chen',
      address1: '789 Robson Street',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6Z 1A1',
      country: 'CA',
      phone: '+1 (604) 555-0789'
    },
    billingAddress: {
      name: 'Michael Chen',
      address1: '789 Robson Street',
      city: 'Vancouver',
      province: 'BC',
      postalCode: 'V6Z 1A1',
      country: 'CA',
      phone: '+1 (604) 555-0789'
    },
    subtotal: 59.98,
    shipping: 15.99,
    taxes: {
      hst: 0,
      gst: 3.80,
      pst: 5.32,
      total: 9.12
    },
    total: 85.09,
    currency: 'CAD',
    paymentMethod: 'paypal',
    transactionId: 'PAYID-123456789',
    shippingMethod: {
      id: 'ups-ground',
      name: 'UPS Ground',
      carrier: 'ups',
      serviceCode: '03',
      trackingNumber: '1Z999AA1234567890',
      estimatedDelivery: '3-5 business days'
    },
    fulfillments: [
      {
        id: 'fulfillment_001',
        status: 'shipped',
        items: [
          {
            orderItemId: 'item_003',
            quantity: 2
          }
        ],
        shippingMethod: {
          carrier: 'ups',
          service: 'Ground',
          trackingNumber: '1Z999AA1234567890'
        },
        shippingLabel: {
          url: '/labels/ups_1Z999AA1234567890.pdf',
          format: 'PDF',
          size: '4x6'
        },
        createdAt: '2025-08-01T08:00:00Z',
        shippedAt: '2025-08-01T08:30:00Z'
      }
    ],
    notes: [
      {
        id: 'note_002',
        type: 'system',
        message: 'Shipping label generated for UPS Ground',
        author: 'System',
        createdAt: '2025-08-01T08:00:00Z'
      },
      {
        id: 'note_003',
        type: 'internal',
        message: 'Package picked up by UPS driver',
        author: 'Admin',
        createdAt: '2025-08-01T08:30:00Z'
      }
    ],
    createdAt: '2025-08-01T07:00:00Z',
    updatedAt: '2025-08-01T08:30:00Z',
    shippedAt: '2025-08-01T08:30:00Z'
  },
  {
    id: 'order_003',
    orderNumber: 'AA-1722549600-GHI789',
    status: 'delivered',
    paymentStatus: 'paid',
    fulfillmentStatus: 'delivered',
    customer: {
      id: 'cust_003',
      email: 'emma.thompson@email.com',
      name: 'Emma Thompson',
      phone: '+1 (403) 555-0456',
      avatar: 'https://i.pravatar.cc/150?u=emma.thompson@email.com',
      loyaltyTier: 'bronze',
      totalOrders: 2,
      totalSpent: 144.84,
      averageOrderValue: 72.42,
      lastOrderDate: '2025-08-01T06:00:00Z',
      notes: ['Digital product enthusiast', 'Student discount eligible', 'Prefers cryptocurrency payments'],
      communicationPreferences: ['email']
    },
    items: [
      {
        id: 'item_004',
        productId: 'prod_005',
        title: 'Astral Projection Training Course',
        sku: 'AA-DIGITAL-002',
        quantity: 1,
        price: 97.00,
        productType: 'digital',
        digitalFile: '/digital/astral-projection-course.zip',
        fulfillmentStatus: 'fulfilled'
      }
    ],
    billingAddress: {
      name: 'Emma Thompson',
      address1: '456 Main Street',
      city: 'Calgary',
      province: 'AB',
      postalCode: 'T2P 1N6',
      country: 'CA'
    },
    subtotal: 97.00,
    shipping: 0,
    taxes: {
      hst: 0,
      gst: 4.85,
      pst: 0,
      total: 4.85
    },
    total: 101.85,
    currency: 'CAD',
    paymentMethod: 'nowpayments',
    transactionId: 'crypto_btc_123456',
    fulfillments: [],
    notes: [
      {
        id: 'note_004',
        type: 'system',
        message: 'Digital download links generated and sent to customer',
        author: 'System',
        createdAt: '2025-08-01T06:15:00Z'
      }
    ],
    digitalDelivery: {
      downloadLinks: [
        {
          id: 'dl_001',
          productId: 'prod_005',
          url: '/download/secure/astral-projection-course-abc123',
          token: 'abc123def456ghi789',
          expiresAt: '2025-08-08T06:15:00Z',
          downloadCount: 2,
          maxDownloads: 3,
          createdAt: '2025-08-01T06:15:00Z'
        }
      ],
      expiryDate: '2025-08-08T06:15:00Z'
    },
    createdAt: '2025-08-01T06:00:00Z',
    updatedAt: '2025-08-01T06:15:00Z',
    deliveredAt: '2025-08-01T06:15:00Z'
  },
  {
    id: 'order_004',
    orderNumber: 'AA-1722545600-JKL012',
    status: 'pending',
    paymentStatus: 'pending',
    fulfillmentStatus: 'unfulfilled',
    customer: {
      id: 'cust_004',
      email: 'james.martinez@email.com',
      name: 'James Martinez',
      phone: '+1 (514) 555-0321',
      avatar: 'https://i.pravatar.cc/150?u=james.martinez@email.com',
      loyaltyTier: 'bronze',
      totalOrders: 1,
      totalSpent: 0,
      averageOrderValue: 0,
      lastOrderDate: '2025-08-01T05:00:00Z',
      notes: ['First-time customer', 'Found us through Instagram ads', 'Interested in tarot readings'],
      communicationPreferences: ['email', 'phone']
    },
    items: [
      {
        id: 'item_005',
        productId: 'prod_007',
        title: 'Mystical Tarot Deck & Guidebook',
        sku: 'AA-TAROT-001',
        quantity: 1,
        price: 34.99,
        productType: 'physical',
        weight: 0.4,
        fulfillmentStatus: 'unfulfilled'
      },
      {
        id: 'item_006',
        productId: 'prod_008',
        title: 'Moon Phase Ritual Calendar 2025',
        sku: 'AA-DIGITAL-003',
        quantity: 1,
        price: 19.99,
        productType: 'digital',
        digitalFile: '/digital/moon-calendar-2025.zip',
        fulfillmentStatus: 'unfulfilled'
      }
    ],
    shippingAddress: {
      name: 'James Martinez',
      address1: '2150 Rue Saint-Catherine Ouest',
      address2: 'Apt 8B',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H3H 1M7',
      country: 'CA',
      phone: '+1 (514) 555-0321'
    },
    billingAddress: {
      name: 'James Martinez',
      address1: '2150 Rue Saint-Catherine Ouest',
      address2: 'Apt 8B',
      city: 'Montreal',
      province: 'QC',
      postalCode: 'H3H 1M7',
      country: 'CA',
      phone: '+1 (514) 555-0321'
    },
    subtotal: 54.98,
    shipping: 16.99,
    taxes: {
      hst: 0,
      gst: 2.75,
      pst: 5.47,
      total: 8.22
    },
    total: 80.19,
    currency: 'CAD',
    paymentMethod: 'stripe',
    shippingMethod: {
      id: 'cp-regular',
      name: 'Canada Post Regular Parcel',
      carrier: 'canada-post',
      serviceCode: 'DOM.RP',
      estimatedDelivery: '5-8 business days'
    },
    fulfillments: [],
    notes: [
      {
        id: 'note_005',
        type: 'customer',
        message: 'This is a gift for my girlfriend. Please include a gift receipt.',
        author: 'James Martinez',
        createdAt: '2025-08-01T05:00:00Z'
      }
    ],
    customerNotes: 'This is a gift for my girlfriend. Please include a gift receipt.',
    createdAt: '2025-08-01T05:00:00Z',
    updatedAt: '2025-08-01T05:00:00Z'
  },
  {
    id: 'order_005',
    orderNumber: 'AA-1722542000-MNO345',
    status: 'cancelled',
    paymentStatus: 'refunded',
    fulfillmentStatus: 'unfulfilled',
    customer: {
      id: 'cust_005',
      email: 'lisa.wang@email.com',
      name: 'Lisa Wang',
      phone: '+1 (780) 555-0654',
      avatar: 'https://i.pravatar.cc/150?u=lisa.wang@email.com',
      loyaltyTier: 'silver',
      totalOrders: 3,
      totalSpent: 287.56,
      averageOrderValue: 95.85,
      lastOrderDate: '2025-07-28T14:30:00Z',
      notes: ['Occasionally requests refunds', 'Quality-conscious buyer', 'Lives in rural area - special shipping'],
      communicationPreferences: ['email']
    },
    items: [
      {
        id: 'item_007',
        productId: 'prod_004',
        title: 'The Complete Guide to Sacred Geometry',
        sku: 'AA-BOOK-001',
        quantity: 2,
        price: 39.99,
        productType: 'physical',
        weight: 1.6,
        fulfillmentStatus: 'unfulfilled'
      }
    ],
    shippingAddress: {
      name: 'Lisa Wang',
      address1: 'RR 2 Box 47',
      city: 'Whitecourt',
      province: 'AB',
      postalCode: 'T7S 1N3',
      country: 'CA',
      phone: '+1 (780) 555-0654'
    },
    billingAddress: {
      name: 'Lisa Wang',
      address1: 'RR 2 Box 47',
      city: 'Whitecourt',
      province: 'AB',
      postalCode: 'T7S 1N3',
      country: 'CA',
      phone: '+1 (780) 555-0654'
    },
    subtotal: 79.98,
    shipping: 24.99,
    taxes: {
      hst: 0,
      gst: 5.25,
      pst: 0,
      total: 5.25
    },
    total: 110.22,
    currency: 'CAD',
    paymentMethod: 'paypal',
    shippingMethod: {
      id: 'cp-expedited',
      name: 'Canada Post Expedited Parcel',
      carrier: 'canada-post',
      serviceCode: 'DOM.EP',
      estimatedDelivery: '2-3 business days'
    },
    fulfillments: [],
    notes: [
      {
        id: 'note_006',
        type: 'customer',
        message: 'I need to cancel this order due to unexpected expenses.',
        author: 'Lisa Wang',
        createdAt: '2025-08-01T04:15:00Z'
      },
      {
        id: 'note_007',
        type: 'internal',
        message: 'Customer requested cancellation within 2 hours of ordering. Full refund processed.',
        author: 'Admin',
        createdAt: '2025-08-01T04:30:00Z'
      },
      {
        id: 'note_008',
        type: 'system',
        message: 'Refund processed: $110.22 CAD. Refund ID: re_1722542400',
        author: 'System',
        createdAt: '2025-08-01T04:30:00Z'
      }
    ],
    createdAt: '2025-08-01T04:00:00Z',
    updatedAt: '2025-08-01T04:30:00Z',
    cancelledAt: '2025-08-01T04:30:00Z'
  },
  {
    id: 'order_006',
    orderNumber: 'AA-1722538400-PQR678',
    status: 'processing',
    paymentStatus: 'paid',
    fulfillmentStatus: 'unfulfilled',
    customer: {
      id: 'cust_006',
      email: 'robert.johnson@businessmail.com',
      name: 'Robert Johnson',
      phone: '+1 (902) 555-0987',
      avatar: 'https://i.pravatar.cc/150?u=robert.johnson@businessmail.com',
      loyaltyTier: 'gold',
      totalOrders: 12,
      totalSpent: 2847.33,
      averageOrderValue: 237.28,
      lastOrderDate: '2025-08-01T03:00:00Z',
      notes: ['Business account - wholesale pricing', 'Owns spiritual wellness center', 'Bulk orders for retail'],
      communicationPreferences: ['email', 'phone']
    },
    items: [
      {
        id: 'item_008',
        productId: 'prod_003',
        title: 'Premium White Sage Smudge Kit',
        sku: 'AA-SAGE-001',
        quantity: 10,
        price: 24.99, // Bulk discount applied
        productType: 'physical',
        weight: 3.0,
        fulfillmentStatus: 'unfulfilled'
      },
      {
        id: 'item_009',
        productId: 'prod_006',
        title: 'Chakra Alignment Incense Set',
        sku: 'AA-INCENSE-001',
        quantity: 15,
        price: 19.99, // Bulk discount applied
        productType: 'physical',
        weight: 3.0,
        fulfillmentStatus: 'unfulfilled'
      }
    ],
    shippingAddress: {
      name: 'Harmony Wellness Center',
      company: 'Harmony Wellness Center Inc.',
      address1: '456 Spring Garden Road',
      city: 'Halifax',
      province: 'NS',
      postalCode: 'B3J 3R4',
      country: 'CA',
      phone: '+1 (902) 555-0987'
    },
    billingAddress: {
      name: 'Robert Johnson',
      company: 'Harmony Wellness Center Inc.',
      address1: '456 Spring Garden Road',
      city: 'Halifax',
      province: 'NS',
      postalCode: 'B3J 3R4',
      country: 'CA',
      phone: '+1 (902) 555-0987'
    },
    subtotal: 549.75,
    shipping: 39.99,
    taxes: {
      hst: 88.46,
      gst: 0,
      pst: 0,
      total: 88.46
    },
    total: 678.20,
    currency: 'CAD',
    paymentMethod: 'stripe',
    transactionId: 'pi_0987654321',
    shippingMethod: {
      id: 'ups-ground',
      name: 'UPS Ground',
      carrier: 'ups',
      serviceCode: '03',
      estimatedDelivery: '3-5 business days'
    },
    fulfillments: [],
    notes: [
      {
        id: 'note_009',
        type: 'customer',
        message: 'Business delivery - please deliver to loading dock at rear of building. Operating hours 9 AM - 6 PM.',
        author: 'Robert Johnson',
        createdAt: '2025-08-01T03:00:00Z'
      },
      {
        id: 'note_010',
        type: 'internal',
        message: 'Wholesale customer - bulk pricing applied. HST number on file.',
        author: 'Admin',
        createdAt: '2025-08-01T03:05:00Z'
      }
    ],
    customerNotes: 'Business delivery - please deliver to loading dock at rear of building. Operating hours 9 AM - 6 PM.',
    internalNotes: 'Wholesale customer - bulk pricing applied. HST number on file.',
    createdAt: '2025-08-01T03:00:00Z',
    updatedAt: '2025-08-01T03:05:00Z'
  }
]

// Order management functions
export function getAllOrders(): Order[] {
  return mockOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getOrderById(id: string): Order | undefined {
  return mockOrders.find(order => order.id === id)
}

export function getOrdersByStatus(status: Order['status']): Order[] {
  return mockOrders.filter(order => order.status === status)
}

export function getOrdersByPaymentStatus(paymentStatus: Order['paymentStatus']): Order[] {
  return mockOrders.filter(order => order.paymentStatus === paymentStatus)
}

export function searchOrders(query: string): Order[] {
  const lowercaseQuery = query.toLowerCase()
  return mockOrders.filter(order =>
    order.orderNumber.toLowerCase().includes(lowercaseQuery) ||
    order.customer.email.toLowerCase().includes(lowercaseQuery) ||
    order.customer.name.toLowerCase().includes(lowercaseQuery) ||
    order.items.some(item => item.title.toLowerCase().includes(lowercaseQuery))
  )
}

export function updateOrderStatus(orderId: string, status: Order['status']): boolean {
  const orderIndex = mockOrders.findIndex(order => order.id === orderId)
  if (orderIndex !== -1) {
    mockOrders[orderIndex].status = status
    mockOrders[orderIndex].updatedAt = new Date().toISOString()
    
    // Update related timestamps
    if (status === 'shipped') {
      mockOrders[orderIndex].shippedAt = new Date().toISOString()
    } else if (status === 'delivered') {
      mockOrders[orderIndex].deliveredAt = new Date().toISOString()
    } else if (status === 'cancelled') {
      mockOrders[orderIndex].cancelledAt = new Date().toISOString()
    }
    
    return true
  }
  return false
}

export function generateShippingLabel(
  orderId: string,
  carrier: 'canada-post' | 'ups',
  service: string
): ShippingLabel | null {
  const order = getOrderById(orderId)
  if (!order) return null

  // Generate mock tracking number
  const trackingNumber = carrier === 'canada-post' 
    ? `CP${Date.now().toString().slice(-9)}`
    : `1Z999AA${Date.now().toString().slice(-9)}`

  const label: ShippingLabel = {
    id: `label_${Date.now()}`,
    orderId,
    fulfillmentId: `fulfillment_${Date.now()}`,
    carrier,
    service,
    trackingNumber,
    labelUrl: `/api/shipping/labels/${trackingNumber}.pdf`,
    labelFormat: 'PDF',
    labelSize: '4x6',
    cost: carrier === 'canada-post' ? 2.50 : 3.00,
    createdAt: new Date().toISOString()
  }

  // Update order with tracking number
  if (order.shippingMethod) {
    order.shippingMethod.trackingNumber = trackingNumber
  }

  return label
}

export function generateDigitalDownloadLinks(orderId: string): DigitalDownloadLink[] {
  const order = getOrderById(orderId)
  if (!order) return []

  const digitalItems = order.items.filter(item => item.productType === 'digital')
  const links: DigitalDownloadLink[] = []

  digitalItems.forEach(item => {
    const token = generateSecureToken()
    const link: DigitalDownloadLink = {
      id: `dl_${Date.now()}_${Math.random().toString(36).substring(2)}`,
      productId: item.productId,
      url: `/download/secure/${item.sku.toLowerCase()}-${token}`,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      downloadCount: 0,
      maxDownloads: 3,
      createdAt: new Date().toISOString()
    }
    links.push(link)
  })

  return links
}

export function addOrderNote(
  orderId: string,
  message: string,
  type: OrderNote['type'] = 'internal',
  author: string = 'Admin'
): boolean {
  const orderIndex = mockOrders.findIndex(order => order.id === orderId)
  if (orderIndex !== -1) {
    const note: OrderNote = {
      id: `note_${Date.now()}`,
      type,
      message,
      author,
      createdAt: new Date().toISOString()
    }
    
    mockOrders[orderIndex].notes.push(note)
    mockOrders[orderIndex].updatedAt = new Date().toISOString()
    return true
  }
  return false
}

export function processRefund(
  orderId: string,
  amount: number,
  reason: string
): { success: boolean; refundId?: string; message: string } {
  const order = getOrderById(orderId)
  if (!order) {
    return { success: false, message: 'Order not found' }
  }

  if (order.paymentStatus === 'refunded') {
    return { success: false, message: 'Order already refunded' }
  }

  // Different handling for crypto payments
  if (order.paymentMethod === 'nowpayments') {
    addOrderNote(orderId, `Refund requested: ${amount} CAD. Reason: ${reason}. Manual crypto refund required with network fees deducted.`, 'internal')
    return {
      success: true,
      message: 'Crypto refund initiated. Manual processing required with network fees deducted.'
    }
  }

  // Mock refund processing for Stripe/PayPal
  const refundId = `re_${Date.now()}`
  
  // Update order status
  const orderIndex = mockOrders.findIndex(o => o.id === orderId)
  if (orderIndex !== -1) {
    mockOrders[orderIndex].paymentStatus = amount >= order.total ? 'refunded' : 'partially_refunded'
    mockOrders[orderIndex].status = 'refunded'
    mockOrders[orderIndex].updatedAt = new Date().toISOString()
  }

  addOrderNote(orderId, `Refund processed: ${amount} CAD. Reason: ${reason}. Refund ID: ${refundId}`, 'system')

  return {
    success: true,
    refundId,
    message: `Refund of ${amount} CAD processed successfully`
  }
}

export function calculateOrderMetrics(orders: Order[]) {
  const total = orders.length
  const pending = orders.filter(o => o.status === 'pending').length
  const processing = orders.filter(o => o.status === 'processing').length
  const shipped = orders.filter(o => o.status === 'shipped').length
  const delivered = orders.filter(o => o.status === 'delivered').length
  const cancelled = orders.filter(o => o.status === 'cancelled').length

  const totalRevenue = orders
    .filter(o => o.paymentStatus === 'paid')
    .reduce((sum, order) => sum + order.total, 0)

  const averageOrderValue = total > 0 ? totalRevenue / total : 0

  return {
    total,
    pending,
    processing,
    shipped,
    delivered,
    cancelled,
    totalRevenue,
    averageOrderValue
  }
}

export function getOrderStatusColor(status: Order['status']): string {
  switch (status) {
    case 'pending': return 'text-yellow-400 bg-yellow-400/10'
    case 'processing': return 'text-blue-400 bg-blue-400/10'
    case 'shipped': return 'text-purple-400 bg-purple-400/10'
    case 'delivered': return 'text-green-400 bg-green-400/10'
    case 'cancelled': return 'text-red-400 bg-red-400/10'
    case 'refunded': return 'text-gray-400 bg-gray-400/10'
    default: return 'text-gray-400 bg-gray-400/10'
  }
}

export function getPaymentStatusColor(status: Order['paymentStatus']): string {
  switch (status) {
    case 'pending': return 'text-yellow-400 bg-yellow-400/10'
    case 'paid': return 'text-green-400 bg-green-400/10'
    case 'failed': return 'text-red-400 bg-red-400/10'
    case 'refunded': return 'text-gray-400 bg-gray-400/10'
    case 'partially_refunded': return 'text-orange-400 bg-orange-400/10'
    default: return 'text-gray-400 bg-gray-400/10'
  }
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-CA', {
    style: 'currency',
    currency: 'CAD'
  }).format(amount)
}

function generateSecureToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// Customer integration functions
export function getCustomerUser(customerId: string): User | null {
  return MockAuth.getUserById(customerId)
}

export function getCustomerByEmail(email: string): User | null {
  return MockAuth.getUserByEmail(email)
}

export function validateOrderCustomer(order: Order): boolean {
  return MockAuth.getUserById(order.customer.id || '') !== null
}

export function getAllCustomers(): User[] {
  return MockAuth.getAllCustomers()
}