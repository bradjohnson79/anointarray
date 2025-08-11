import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// NowPayments configuration
const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY')!
const NOWPAYMENTS_PUBLIC_KEY = Deno.env.get('NOWPAYMENTS_PUBLIC_KEY')!
const NOWPAYMENTS_BASE_URL = 'https://api.nowpayments.io/v1'

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
  currency: string // 'BTC', 'ETH', 'LTC', etc.
  success_url: string
  cancel_url: string
  customer_email?: string
  coupon_code?: string
  metadata?: Record<string, string>
}

async function getAvailableCurrencies(): Promise<string[]> {
  try {
    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/currencies`, {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch currencies: ${response.status}`)
    }

    const data = await response.json()
    return data.currencies || []
  } catch (error) {
    console.error('Error fetching NowPayments currencies:', error)
    // Return common cryptocurrencies as fallback
    return ['BTC', 'ETH', 'LTC', 'BCH', 'XMR', 'ADA', 'DOT', 'USDT', 'USDC']
  }
}

async function getEstimatePrice(amount: number, currencyFrom: string, currencyTo: string): Promise<number> {
  try {
    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/estimate`, {
      method: 'GET',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    })

    const url = new URL(`${NOWPAYMENTS_BASE_URL}/estimate`)
    url.searchParams.set('amount', (amount / 100).toString()) // Convert cents to dollars
    url.searchParams.set('currency_from', currencyFrom)
    url.searchParams.set('currency_to', currencyTo)

    const estimateResponse = await fetch(url.toString(), {
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
      },
    })

    if (!estimateResponse.ok) {
      throw new Error(`Failed to get estimate: ${estimateResponse.status}`)
    }

    const data = await estimateResponse.json()
    return parseFloat(data.estimated_amount || '0')
  } catch (error) {
    console.error('Error getting price estimate:', error)
    return 0
  }
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    // Handle GET request to list available currencies
    if (req.method === 'GET') {
      const currencies = await getAvailableCurrencies()
      return new Response(
        JSON.stringify({
          success: true,
          currencies,
          message: 'Available cryptocurrencies for payment'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )
    }

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
      currency,
      success_url,
      cancel_url,
      customer_email,
      coupon_code,
      metadata = {}
    }: CheckoutRequest = await req.json()

    // Validate items
    if (!items || items.length === 0) {
      return new Response('No items provided', { status: 400 })
    }

    if (!currency) {
      return new Response('Currency is required', { status: 400 })
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

    // Calculate tax and shipping
    const taxAmount = Math.round((subtotal - discount) * 0.13) // 13% HST
    const shippingAmount = 1200 // $12 shipping
    const totalAmountCents = subtotal - discount + taxAmount + shippingAmount

    // Get crypto price estimate
    const cryptoAmount = await getEstimatePrice(totalAmountCents, 'CAD', currency.toUpperCase())
    
    if (cryptoAmount === 0) {
      return new Response(
        JSON.stringify({
          error: 'Unable to get price estimate for selected currency',
          currency
        }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        }
      )
    }

    // Create order reference
    const orderRef = `crypto_${Date.now()}_${user.id.slice(0, 8)}`

    // Create NowPayments invoice
    const invoicePayload = {
      price_amount: (totalAmountCents / 100), // Convert to dollars
      price_currency: 'CAD',
      pay_currency: currency.toUpperCase(),
      pay_amount: cryptoAmount,
      order_id: orderRef,
      order_description: `Anoint Array Purchase - ${items.length} item(s)`,
      success_url,
      cancel_url,
      customer_email: customer_email || user.email,
      is_fixed_rate: false,
      is_fee_paid_by_user: true,
    }

    const response = await fetch(`${NOWPAYMENTS_BASE_URL}/invoice`, {
      method: 'POST',
      headers: {
        'x-api-key': NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(invoicePayload),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`NowPayments invoice creation failed: ${error}`)
    }

    const invoiceData = await response.json()

    // Store the invoice details
    await supabase
      .from('webhooks')
      .insert({
        source: 'nowpayments',
        event_type: 'invoice.created',
        external_id: invoiceData.id || orderRef,
        payload: {
          invoice: invoiceData,
          metadata: {
            user_id: user.id,
            coupon_id: couponId,
            coupon_code,
            items,
            discount,
            subtotal: subtotal,
            tax: taxAmount,
            shipping: shippingAmount,
            total_cad: totalAmountCents,
            crypto_currency: currency.toUpperCase(),
            crypto_amount: cryptoAmount,
          }
        },
        status: 'pending',
        user_id: user.id,
      })

    // Log the invoice creation
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'NowPayments invoice created',
      user_id_param: user.id,
      metadata_param: {
        invoice_id: invoiceData.id,
        order_ref: orderRef,
        amount_cad: totalAmountCents,
        crypto_currency: currency.toUpperCase(),
        crypto_amount: cryptoAmount,
        items_count: items.length
      }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoiceData.id,
          order_id: orderRef,
          payment_url: invoiceData.invoice_url,
          pay_address: invoiceData.pay_address,
          pay_amount: cryptoAmount,
          pay_currency: currency.toUpperCase(),
          price_amount: (totalAmountCents / 100),
          price_currency: 'CAD',
          status: invoiceData.payment_status,
          created_at: invoiceData.created_at,
          expires_at: invoiceData.updated_at, // NowPayments doesn't provide explicit expiry
        }
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('NowPayments checkout error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `NowPayments checkout error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        error: 'Failed to create crypto payment invoice',
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