import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// PayPal configuration
const PAYPAL_CLIENT_ID = Deno.env.get('PAYPAL_CLIENT_ID_LIVE') || Deno.env.get('PAYPAL_CLIENT_ID_SANDBOX')
const PAYPAL_SECRET = Deno.env.get('PAYPAL_SECRET_LIVE') || Deno.env.get('PAYPAL_CLIENT_SECRET_SANDBOX')
const PAYPAL_BASE_URL = Deno.env.get('PAYPAL_CLIENT_ID_LIVE') 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com'

interface CheckoutItem {
  product_id: string
  variant_id?: string
  quantity: number
  price: number // in cents
  title: string
  sku?: string
}

interface CheckoutRequest {
  items: CheckoutItem[]
  return_url: string
  cancel_url: string
  customer_email?: string
  coupon_code?: string
  shipping_address?: any
  metadata?: Record<string, string>
}

async function getPayPalAccessToken(): Promise<string> {
  const auth = btoa(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`)
  
  const response = await fetch(`${PAYPAL_BASE_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error(`PayPal auth failed: ${response.status}`)
  }

  const data = await response.json()
  return data.access_token
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

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

    const {
      items,
      return_url,
      cancel_url,
      customer_email,
      coupon_code,
      shipping_address,
      metadata = {}
    }: CheckoutRequest = await req.json()

    // Validate items
    if (!items || items.length === 0) {
      return new Response('No items provided', { status: 400 })
    }

    // Calculate totals
    let subtotal = 0
    let discount = 0
    let couponId = null

    for (const item of items) {
      subtotal += item.price * item.quantity
    }

    // Apply coupon if provided
    if (coupon_code) {
      const { data: couponResult } = await supabase.rpc('apply_coupon', {
        coupon_code,
        subtotal_cents: subtotal,
        user_id_param: user.id
      })

      if (couponResult?.valid) {
        discount = couponResult.discount_cents
        couponId = couponResult.coupon_id
      }
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken()

    // Calculate tax (simplified - 13% HST for Ontario)
    const taxAmount = Math.round((subtotal - discount) * 0.13)
    const shippingAmount = 1200 // Default $12 shipping
    const totalAmount = subtotal - discount + taxAmount + shippingAmount

    // Create PayPal order
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        reference_id: `order_${Date.now()}`,
        description: 'Anoint Array Purchase',
        custom_id: user.id,
        amount: {
          currency_code: 'CAD',
          value: (totalAmount / 100).toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'CAD',
              value: (subtotal / 100).toFixed(2),
            },
            shipping: {
              currency_code: 'CAD',
              value: (shippingAmount / 100).toFixed(2),
            },
            tax_total: {
              currency_code: 'CAD',
              value: (taxAmount / 100).toFixed(2),
            },
            discount: discount > 0 ? {
              currency_code: 'CAD',
              value: (discount / 100).toFixed(2),
            } : undefined,
          },
        },
        items: items.map(item => ({
          name: item.title,
          unit_amount: {
            currency_code: 'CAD',
            value: (item.price / 100).toFixed(2),
          },
          quantity: item.quantity.toString(),
          sku: item.sku || item.product_id,
          category: 'PHYSICAL_GOODS',
        })),
        shipping: shipping_address ? {
          type: 'SHIPPING',
          name: {
            full_name: shipping_address.name || 'Customer',
          },
          address: {
            address_line_1: shipping_address.line1,
            address_line_2: shipping_address.line2,
            admin_area_2: shipping_address.city,
            admin_area_1: shipping_address.state,
            postal_code: shipping_address.postal_code,
            country_code: shipping_address.country || 'CA',
          },
        } : undefined,
      }],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            brand_name: 'Anoint Array',
            locale: 'en-CA',
            landing_page: 'LOGIN',
            shipping_preference: shipping_address ? 'SET_PROVIDED_ADDRESS' : 'GET_FROM_FILE',
            user_action: 'PAY_NOW',
            return_url,
            cancel_url,
          },
        },
      },
      application_context: {
        brand_name: 'Anoint Array',
        locale: 'en-CA',
        landing_page: 'LOGIN',
        shipping_preference: shipping_address ? 'SET_PROVIDED_ADDRESS' : 'GET_FROM_FILE',
        user_action: 'PAY_NOW',
        return_url,
        cancel_url,
      },
    }

    const createOrderResponse = await fetch(`${PAYPAL_BASE_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'PayPal-Request-Id': `${user.id}_${Date.now()}`,
      },
      body: JSON.stringify(paypalOrder),
    })

    if (!createOrderResponse.ok) {
      const error = await createOrderResponse.text()
      throw new Error(`PayPal order creation failed: ${error}`)
    }

    const orderData = await createOrderResponse.json()

    // Find the approval URL
    const approvalUrl = orderData.links?.find((link: any) => 
      link.rel === 'approve' || link.rel === 'payer-action'
    )?.href

    // Store PayPal order details temporarily
    await supabase
      .from('webhooks')
      .insert({
        source: 'paypal',
        event_type: 'order.created',
        external_id: orderData.id,
        payload: {
          ...orderData,
          metadata: {
            user_id: user.id,
            coupon_id: couponId,
            coupon_code,
            items,
            discount,
          }
        },
        status: 'pending',
        user_id: user.id,
      })

    // Log the checkout session creation
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'PayPal order created',
      user_id_param: user.id,
      metadata_param: {
        order_id: orderData.id,
        amount: totalAmount,
        items_count: items.length
      }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        approvalUrl,
        status: orderData.status,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('PayPal checkout error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `PayPal checkout error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        error: 'Failed to create PayPal order',
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