import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

interface AdminRequest {
  action: string
  data?: any
  filters?: any
}

async function verifyAdminAccess(user: any): Promise<boolean> {
  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, role')
    .eq('id', user.id)
    .single()

  return profile?.is_admin === true || profile?.role === 'admin'
}

async function getDashboardStats(): Promise<any> {
  // Get comprehensive dashboard statistics
  const [
    usersResult,
    ordersResult,
    revenueResult,
    arraysResult,
    glyphsResult,
    affiliatesResult,
    couponsResult,
    webhooksResult
  ] = await Promise.all([
    // User statistics
    supabase.from('profiles').select('id, created_at').order('created_at', { ascending: false }),
    
    // Order statistics
    supabase.from('orders').select('id, total, financial_status, created_at').order('created_at', { ascending: false }),
    
    // Revenue calculation
    supabase.from('orders').select('total').eq('financial_status', 'paid'),
    
    // Array statistics
    supabase.from('arrays').select('id, status, is_public, created_at').order('created_at', { ascending: false }),
    
    // Glyph statistics
    supabase.from('glyphs').select('id, is_active, is_featured, usage_count'),
    
    // Affiliate statistics
    supabase.from('affiliates').select('id, status, total_sales_cents, total_commissions_cents'),
    
    // Coupon statistics
    supabase.from('coupons').select('id, is_active, current_redemptions, max_redemptions'),
    
    // Recent webhook activity
    supabase.from('webhooks').select('id, source, event_type, status, created_at').order('created_at', { ascending: false }).limit(10)
  ])

  // Calculate statistics
  const totalUsers = usersResult.data?.length || 0
  const totalOrders = ordersResult.data?.length || 0
  const totalRevenue = revenueResult.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0
  const totalArrays = arraysResult.data?.length || 0
  const totalGlyphs = glyphsResult.data?.length || 0

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const recentUsers = usersResult.data?.filter(u => u.created_at > thirtyDaysAgo).length || 0
  const recentOrders = ordersResult.data?.filter(o => o.created_at > thirtyDaysAgo).length || 0
  const recentArrays = arraysResult.data?.filter(a => a.created_at > thirtyDaysAgo).length || 0

  // Order status breakdown
  const ordersByStatus = {}
  ordersResult.data?.forEach(order => {
    ordersByStatus[order.financial_status] = (ordersByStatus[order.financial_status] || 0) + 1
  })

  // Top glyphs by usage
  const topGlyphs = glyphsResult.data
    ?.filter(g => g.is_active)
    ?.sort((a, b) => (b.usage_count || 0) - (a.usage_count || 0))
    ?.slice(0, 10) || []

  return {
    overview: {
      total_users: totalUsers,
      total_orders: totalOrders,
      total_revenue_cents: totalRevenue,
      total_arrays: totalArrays,
      total_glyphs: totalGlyphs,
    },
    recent_activity: {
      new_users_30d: recentUsers,
      new_orders_30d: recentOrders,
      new_arrays_30d: recentArrays,
    },
    orders_by_status: ordersByStatus,
    top_glyphs: topGlyphs,
    recent_webhooks: webhooksResult.data || [],
    affiliate_summary: {
      total_affiliates: affiliatesResult.data?.length || 0,
      active_affiliates: affiliatesResult.data?.filter(a => a.status === 'active').length || 0,
      total_commissions: affiliatesResult.data?.reduce((sum, a) => sum + (a.total_commissions_cents || 0), 0) || 0,
    },
    coupon_summary: {
      total_coupons: couponsResult.data?.length || 0,
      active_coupons: couponsResult.data?.filter(c => c.is_active).length || 0,
      total_redemptions: couponsResult.data?.reduce((sum, c) => sum + (c.current_redemptions || 0), 0) || 0,
    }
  }
}

async function getUsers(filters: any = {}): Promise<any> {
  let query = supabase
    .from('profiles')
    .select('id, email, full_name, is_admin, role, created_at, updated_at, stripe_customer_id')
    .order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`)
  }

  return await query
}

async function getOrders(filters: any = {}): Promise<any> {
  let query = supabase
    .from('orders')
    .select(`
      id, order_number, status, financial_status, fulfillment_status,
      total, subtotal, tax_total, shipping_total, discount_total,
      payment_method, created_at, updated_at,
      customer_email, customer_phone,
      profiles!inner(full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.status) {
    query = query.eq('financial_status', filters.status)
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to)
  }

  return await query
}

async function getArrays(filters: any = {}): Promise<any> {
  let query = supabase
    .from('arrays')
    .select(`
      id, title, description, status, is_public, is_featured,
      glyph_count, download_count, view_count,
      created_at, updated_at, completed_at,
      profiles!inner(full_name, email)
    `)
    .order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  if (filters.is_public !== undefined) {
    query = query.eq('is_public', filters.is_public)
  }

  return await query
}

async function updateUserRole(userId: string, role: string, isAdmin: boolean): Promise<any> {
  return await supabase
    .from('profiles')
    .update({
      role,
      is_admin: isAdmin,
      updated_at: new Date().toISOString()
    })
    .eq('id', userId)
    .select()
    .single()
}

async function updateOrderStatus(orderId: string, status: string, financialStatus?: string): Promise<any> {
  const updateData: any = {
    status,
    updated_at: new Date().toISOString()
  }

  if (financialStatus) {
    updateData.financial_status = financialStatus
  }

  return await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single()
}

async function featureArray(arrayId: string, featured: boolean): Promise<any> {
  return await supabase
    .from('arrays')
    .update({
      is_featured: featured,
      updated_at: new Date().toISOString()
    })
    .eq('id', arrayId)
    .select()
    .single()
}

async function createCoupon(couponData: any): Promise<any> {
  return await supabase
    .from('coupons')
    .insert({
      code: couponData.code,
      type: couponData.type,
      value_cents: couponData.value_cents,
      description: couponData.description,
      max_redemptions: couponData.max_redemptions,
      min_order_value_cents: couponData.min_order_value_cents,
      starts_at: couponData.starts_at,
      expires_at: couponData.expires_at,
      is_active: true
    })
    .select()
    .single()
}

async function getLogs(filters: any = {}): Promise<any> {
  let query = supabase
    .from('logs')
    .select('id, level, category, message, user_id, created_at, metadata')
    .order('created_at', { ascending: false })

  if (filters.limit) {
    query = query.limit(filters.limit)
  }

  if (filters.level) {
    query = query.eq('level', filters.level)
  }

  if (filters.category) {
    query = query.eq('category', filters.category)
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from)
  }

  return await query
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Invalid token', { status: 401 })
    }

    // Verify admin access
    const hasAdminAccess = await verifyAdminAccess(user)
    if (!hasAdminAccess) {
      return new Response('Forbidden: Admin access required', { status: 403 })
    }

    let result: any = { success: false, message: 'Unknown error' }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const action = url.searchParams.get('action')
      const filters = Object.fromEntries(url.searchParams.entries())

      switch (action) {
        case 'dashboard_stats':
          result = { success: true, data: await getDashboardStats() }
          break
        case 'users':
          result = await getUsers(filters)
          break
        case 'orders':
          result = await getOrders(filters)
          break
        case 'arrays':
          result = await getArrays(filters)
          break
        case 'logs':
          result = await getLogs(filters)
          break
        default:
          return new Response('Invalid action', { status: 400 })
      }
    } else if (req.method === 'POST' || req.method === 'PUT') {
      const { action, data, filters }: AdminRequest = await req.json()

      switch (action) {
        case 'update_user_role':
          result = await updateUserRole(data.user_id, data.role, data.is_admin)
          break
        case 'update_order_status':
          result = await updateOrderStatus(data.order_id, data.status, data.financial_status)
          break
        case 'feature_array':
          result = await featureArray(data.array_id, data.featured)
          break
        case 'create_coupon':
          result = await createCoupon(data)
          break
        default:
          return new Response('Invalid action', { status: 400 })
      }
    }

    // Log admin action
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'admin',
      message_param: `Admin action: ${req.url}`,
      user_id_param: user.id,
      metadata_param: { method: req.method, action: req.url }
    }).catch(() => {})

    return new Response(
      JSON.stringify(result),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Admin tools error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'admin',
      message_param: `Admin tools error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Admin operation failed',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})