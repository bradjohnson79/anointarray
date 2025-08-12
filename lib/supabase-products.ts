// Supabase integration for Products and Orders
// Handles all database operations for the enhanced e-commerce system

import { supabase } from './supabase'

// Types
export interface ProductCategory {
  id: string
  name: string
  slug: string
  description?: string
  parent_id?: string
  image_url?: string
  is_active: boolean
  sort_order: number
  seo_title?: string
  seo_description?: string
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  sku: string
  title: string
  slug: string
  description?: string
  short_description?: string
  images: string[]
  main_image_index: number
  price: number
  compare_at_price?: number
  cost_price?: number
  category_id?: string
  keywords: string[]
  product_type: 'physical' | 'digital'
  
  // Digital product fields
  digital_file_url?: string
  file_size?: number
  download_limit?: number
  license_type?: string
  
  // Physical product fields
  weight?: number
  dimensions?: { length: number; width: number; height: number }
  inventory_quantity: number
  track_inventory: boolean
  allow_backorder: boolean
  low_stock_threshold: number
  
  // Common fields
  instructions_pdf_url?: string
  status: 'draft' | 'published' | 'archived'
  is_visible: boolean
  is_featured: boolean
  requires_shipping: boolean
  is_taxable: boolean
  related_products: string[]
  
  // SEO fields
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
  
  // Analytics
  view_count: number
  purchase_count: number
  
  // Timestamps
  created_at: string
  updated_at: string
  published_at?: string
}

export interface CustomerAddress {
  id: string
  user_id: string
  type: 'billing' | 'shipping' | 'both'
  first_name: string
  last_name: string
  company?: string
  address_line_1: string
  address_line_2?: string
  city: string
  province: string
  postal_code: string
  country: string
  phone?: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  user_id?: string
  guest_email?: string
  
  // Customer information
  customer_email: string
  customer_phone?: string
  
  // Billing address
  billing_first_name: string
  billing_last_name: string
  billing_company?: string
  billing_address_line_1: string
  billing_address_line_2?: string
  billing_city: string
  billing_province: string
  billing_postal_code: string
  billing_country: string
  
  // Shipping address
  shipping_first_name?: string
  shipping_last_name?: string
  shipping_company?: string
  shipping_address_line_1?: string
  shipping_address_line_2?: string
  shipping_city?: string
  shipping_province?: string
  shipping_postal_code?: string
  shipping_country?: string
  
  // Order amounts
  subtotal: number
  shipping_cost: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  
  // Tax breakdown
  tax_breakdown: unknown
  
  // Order status
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded'
  fulfillment_status: 'unfulfilled' | 'partial' | 'fulfilled'
  financial_status: 'pending' | 'paid' | 'partially_paid' | 'refunded' | 'partially_refunded' | 'voided'
  
  // Payment information
  payment_method?: string
  payment_status: string
  payment_reference?: string
  transaction_id?: string
  
  // Shipping information
  shipping_method?: string
  tracking_number?: string
  shipped_at?: string
  delivered_at?: string
  
  // Additional information
  notes?: string
  admin_notes?: string
  discount_code?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  cancelled_at?: string
}

export interface OrderItem {
  id: string
  order_id: string
  product_id: string
  variant_id?: string
  
  // Item details
  sku: string
  title: string
  variant_title?: string
  quantity: number
  unit_price: number
  total_price: number
  
  // Product snapshot
  product_snapshot: unknown
  
  // Fulfillment
  fulfilled_quantity: number
  requires_shipping: boolean
  is_digital: boolean
  download_url?: string
  download_expires_at?: string
  
  created_at: string
}

// Product Categories API
export const ProductCategoriesAPI = {
  // Get all categories
  async getAll(): Promise<ProductCategory[]> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  // Get category by ID
  async getById(id: string): Promise<ProductCategory | null> {
    const { data, error } = await supabase
      .from('product_categories')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Create category
  async create(category: Omit<ProductCategory, 'id' | 'created_at' | 'updated_at'>): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .insert([category])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update category
  async update(id: string, updates: Partial<ProductCategory>): Promise<ProductCategory> {
    const { data, error } = await supabase
      .from('product_categories')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete category
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('product_categories')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}

// Products API
export const ProductsAPI = {
  // Get all products with optional filters
  async getAll(filters?: {
    category_id?: string
    status?: string
    is_visible?: boolean
    is_featured?: boolean
    product_type?: 'physical' | 'digital'
    search?: string
    limit?: number
    offset?: number
  }): Promise<Product[]> {
    let query = supabase.from('products').select(`
      *,
      category:product_categories(name, slug)
    `)

    // Apply filters
    if (filters?.category_id) query = query.eq('category_id', filters.category_id)
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.is_visible !== undefined) query = query.eq('is_visible', filters.is_visible)
    if (filters?.is_featured !== undefined) query = query.eq('is_featured', filters.is_featured)
    if (filters?.product_type) query = query.eq('product_type', filters.product_type)
    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
    }

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit)
    if (filters?.offset) query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Get product by ID
  async getById(id: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(name, slug)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Get product by slug
  async getBySlug(slug: string): Promise<Product | null> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(name, slug)
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .eq('is_visible', true)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Create product
  async create(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update product
  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete product
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Update inventory
  async updateInventory(productId: string, quantityChange: number, transactionType: string, reference?: string, notes?: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('update_product_inventory', {
      product_id_param: productId,
      quantity_change_param: quantityChange,
      transaction_type_param: transactionType,
      reference_param: reference || null,
      notes_param: notes || null,
      created_by_param: null // Will be set to current user ID when available
    })
    
    if (error) throw error
    return data
  },

  // Get featured products
  async getFeatured(limit = 6): Promise<Product[]> {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:product_categories(name, slug)
      `)
      .eq('is_featured', true)
      .eq('status', 'published')
      .eq('is_visible', true)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  // Search products
  async search(query: string, filters?: unknown): Promise<Product[]> {
    return this.getAll({ ...filters, search: query })
  }
}

// Orders API
export const OrdersAPI = {
  // Get all orders with optional filters
  async getAll(filters?: {
    status?: string
    financial_status?: string
    fulfillment_status?: string
    user_id?: string
    limit?: number
    offset?: number
  }): Promise<Order[]> {
    let query = supabase.from('orders').select(`
      *,
      order_items(*)
    `)

    // Apply filters
    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.financial_status) query = query.eq('financial_status', filters.financial_status)
    if (filters?.fulfillment_status) query = query.eq('fulfillment_status', filters.fulfillment_status)
    if (filters?.user_id) query = query.eq('user_id', filters.user_id)

    // Pagination
    if (filters?.limit) query = query.limit(filters.limit)
    if (filters?.offset) query = query.range(filters.offset, (filters.offset || 0) + (filters.limit || 50) - 1)

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  },

  // Get order by ID
  async getById(id: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_status_history(*)
      `)
      .eq('id', id)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Get order by order number
  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items(*),
        order_status_history(*)
      `)
      .eq('order_number', orderNumber)
      .single()
    
    if (error && error.code !== 'PGRST116') throw error
    return data
  },

  // Create order
  async create(order: Omit<Order, 'id' | 'order_number' | 'created_at' | 'updated_at'>, orderItems: Omit<OrderItem, 'id' | 'order_id' | 'created_at'>[]): Promise<Order> {
    // Generate order number
    const { data: orderNumberData, error: orderNumberError } = await supabase.rpc('generate_order_number')
    if (orderNumberError) throw orderNumberError

    const orderWithNumber = {
      ...order,
      order_number: orderNumberData
    }

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([orderWithNumber])
      .select()
      .single()
    
    if (orderError) throw orderError

    // Create order items
    const itemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: orderData.id
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(itemsWithOrderId)
    
    if (itemsError) throw itemsError

    // Update inventory for physical products
    for (const item of orderItems) {
      if (item.requires_shipping) {
        await ProductsAPI.updateInventory(
          item.product_id,
          -item.quantity,
          'sale',
          orderData.order_number,
          `Sale of ${item.quantity} units`
        )
      }
    }

    return orderData
  },

  // Update order
  async update(id: string, updates: Partial<Order>): Promise<Order> {
    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update order status
  async updateStatus(id: string, status: string, comment?: string, notifyCustomer = false): Promise<void> {
    // Update order status
    await this.update(id, { status })

    // Add status history entry
    const { error } = await supabase
      .from('order_status_history')
      .insert([{
        order_id: id,
        status,
        comment: comment || null,
        notify_customer: notifyCustomer,
        created_by: null // Will be set to current user ID when available
      }])
    
    if (error) throw error
  },

  // Calculate order total with Canadian taxes
  async calculateTotal(subtotal: number, shippingCost: number, discountAmount: number, provinceCode: string): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_order_total', {
      subtotal_param: subtotal,
      shipping_cost_param: shippingCost,
      discount_amount_param: discountAmount,
      province_code_param: provinceCode
    })
    
    if (error) throw error
    return data
  },

  // Get user's orders
  async getByUserId(userId: string, limit = 20): Promise<Order[]> {
    return this.getAll({ user_id: userId, limit })
  }
}

// Customer Addresses API
export const CustomerAddressesAPI = {
  // Get user's addresses
  async getByUserId(userId: string): Promise<CustomerAddress[]> {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  // Create address
  async create(address: Omit<CustomerAddress, 'id' | 'created_at' | 'updated_at'>): Promise<CustomerAddress> {
    const { data, error } = await supabase
      .from('customer_addresses')
      .insert([address])
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Update address
  async update(id: string, updates: Partial<CustomerAddress>): Promise<CustomerAddress> {
    const { data, error } = await supabase
      .from('customer_addresses')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // Delete address
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('customer_addresses')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  // Set default address
  async setDefault(userId: string, addressId: string): Promise<void> {
    // First, unset all default addresses for the user
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('user_id', userId)

    // Then set the specified address as default
    const { error } = await supabase
      .from('customer_addresses')
      .update({ is_default: true })
      .eq('id', addressId)
    
    if (error) throw error
  }
}

// Tax calculation helper
export const TaxAPI = {
  // Calculate Canadian tax for any province
  async calculateTax(provinceCode: string, amount: number, taxInclusive = false): Promise<any> {
    const { data, error } = await supabase.rpc('calculate_canadian_tax', {
      province_code_param: provinceCode,
      amount_param: amount,
      tax_inclusive: taxInclusive
    })
    
    if (error) throw error
    return data
  },

  // Get all tax rates
  async getAllRates(): Promise<any> {
    const { data, error } = await supabase.rpc('get_all_tax_rates')
    
    if (error) throw error
    return data
  }
}