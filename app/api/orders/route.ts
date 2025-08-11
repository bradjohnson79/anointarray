import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/orders - List all orders with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const financial_status = searchParams.get('financial_status')
    const user_id = searchParams.get('user_id')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('orders')
      .select(`
        *,
        user_profiles (
          id,
          full_name,
          email
        ),
        order_items (
          *,
          products (
            id,
            title,
            sku,
            images
          )
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (status) query = query.eq('status', status)
    if (financial_status) query = query.eq('financial_status', financial_status)
    if (user_id) query = query.eq('user_id', user_id)
    if (search) {
      query = query.or(`order_number.ilike.%${search}%,guest_email.ilike.%${search}%,billing_name.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Orders fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })
  } catch (error) {
    console.error('Orders API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must have at least one item' },
        { status: 400 }
      )
    }

    if (!body.billing_address || !body.billing_address.first_name || !body.billing_address.email) {
      return NextResponse.json(
        { error: 'Billing address and email are required' },
        { status: 400 }
      )
    }

    // Generate order number
    const timestamp = Date.now().toString().slice(-8)
    const orderNumber = `ORD-${timestamp}`

    // Calculate totals from items
    let subtotal = 0
    let tax_total = 0
    
    for (const item of body.items) {
      const itemTotal = item.price * item.quantity
      subtotal += itemTotal
      tax_total += item.tax_amount || 0
    }

    const shipping_total = body.shipping_total || 0
    const discount_total = body.discount_total || 0
    const total = subtotal + tax_total + shipping_total - discount_total

    const orderData = {
      order_number: orderNumber,
      user_id: body.user_id || null,
      guest_email: body.user_id ? null : body.billing_address.email,
      
      // Totals
      subtotal: subtotal,
      tax_total: tax_total,
      shipping_total: shipping_total,
      discount_total: discount_total,
      total: total,
      
      // Status
      status: 'pending',
      financial_status: 'pending',
      fulfillment_status: 'unfulfilled',
      
      // Addresses
      billing_name: `${body.billing_address.first_name} ${body.billing_address.last_name}`,
      billing_address: body.billing_address,
      shipping_address: body.shipping_address || body.billing_address,
      
      // Tax info
      tax_province: body.tax_province || 'ON',
      tax_breakdown: body.tax_breakdown || {},
      
      // Additional info
      notes: body.notes || null,
      customer_notes: body.customer_notes || null,
      tags: body.tags || []
    }

    // Create the order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select('*')
      .single()

    if (orderError) {
      console.error('Order creation error:', orderError)
      return NextResponse.json(
        { error: 'Failed to create order', details: orderError.message },
        { status: 500 }
      )
    }

    // Create order items
    const orderItems = body.items.map((item: any) => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id || null,
      sku: item.sku,
      title: item.title,
      variant_title: item.variant_title || null,
      price: item.price,
      quantity: item.quantity,
      tax_amount: item.tax_amount || 0,
      total: item.price * item.quantity
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems)

    if (itemsError) {
      // Rollback the order if items creation fails
      await supabase.from('orders').delete().eq('id', order.id)
      
      console.error('Order items creation error:', itemsError)
      return NextResponse.json(
        { error: 'Failed to create order items', details: itemsError.message },
        { status: 500 }
      )
    }

    // Fetch the complete order with items
    const { data: completeOrder, error: fetchError } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (
          *,
          products (
            id,
            title,
            sku
          )
        )
      `)
      .eq('id', order.id)
      .single()

    if (fetchError) {
      console.error('Order fetch error:', fetchError)
      return NextResponse.json(
        { error: 'Order created but failed to fetch details' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: completeOrder,
      message: 'Order created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Order creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}