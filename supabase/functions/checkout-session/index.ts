import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'

interface CartItem {
  id: string
  title: string
  price: number
  quantity: number
  image?: string
}

interface ShippingAddress {
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
}

interface CheckoutRequest {
  items: CartItem[]
  shippingAddress: ShippingAddress
  shippingOption: {
    id: string
    name: string
    price: number
  }
  couponCode?: string
  discount?: number
  paymentMethod: 'stripe' | 'paypal'
  customerEmail: string
}

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

// PayPal API functions
async function getPayPalAccessToken(): Promise<string> {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID_SANDBOX') // Use sandbox for now
  const clientSecret = Deno.env.get('PAYPAL_CLIENT_SECRET_SANDBOX')
  
  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials not found')
  }

  const response = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Accept-Language': 'en_US',
      'Authorization': `Basic ${btoa(`${clientId}:${clientSecret}`)}`
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

async function createPayPalOrder(
  items: CartItem[],
  shippingOption: { name: string; price: number },
  discount: number,
  shippingAddress: ShippingAddress
): Promise<{ orderId: string; approvalUrl: string }> {
  const accessToken = await getPayPalAccessToken()
  
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const shippingCost = shippingOption.price
  const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0
  const total = subtotal - discountAmount + shippingCost

  const orderPayload = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: `anoint-${Date.now()}`,
      amount: {
        currency_code: 'CAD',
        value: total.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: 'CAD',
            value: subtotal.toFixed(2)
          },
          shipping: {
            currency_code: 'CAD',
            value: shippingCost.toFixed(2)
          },
          discount: discountAmount > 0 ? {
            currency_code: 'CAD',
            value: discountAmount.toFixed(2)
          } : undefined
        }
      },
      items: items.map(item => ({
        name: item.title,
        unit_amount: {
          currency_code: 'CAD',
          value: item.price.toFixed(2)
        },
        quantity: item.quantity.toString(),
        category: 'PHYSICAL_GOODS'
      })),
      shipping: {
        method: shippingOption.name,
        address: {
          address_line_1: shippingAddress.address,
          admin_area_2: shippingAddress.city,
          admin_area_1: shippingAddress.province,
          postal_code: shippingAddress.postalCode,
          country_code: shippingAddress.country
        }
      }
    }],
    application_context: {
      return_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paypal-webhook/success`,
      cancel_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/paypal-webhook/cancel`,
      brand_name: 'ANOINT Array',
      shipping_preference: 'SET_PROVIDED_ADDRESS',
      user_action: 'PAY_NOW'
    }
  }

  const response = await fetch('https://api.sandbox.paypal.com/v2/checkout/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `anoint-${Date.now()}`
    },
    body: JSON.stringify(orderPayload)
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('PayPal order creation failed:', errorData)
    throw new Error('Failed to create PayPal order')
  }

  const orderData = await response.json()
  const approvalUrl = orderData.links.find((link: any) => link.rel === 'approve')?.href

  if (!approvalUrl) {
    throw new Error('PayPal approval URL not found')
  }

  return {
    orderId: orderData.id,
    approvalUrl
  }
}

async function createStripeSession(
  items: CartItem[],
  shippingOption: { name: string; price: number },
  discount: number,
  shippingAddress: ShippingAddress,
  customerEmail: string
): Promise<{ sessionId: string; checkoutUrl: string }> {
  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const discountAmount = discount > 0 ? (subtotal * discount) / 100 : 0

  // Create line items for Stripe
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(item => ({
    price_data: {
      currency: 'cad',
      product_data: {
        name: item.title,
        images: item.image ? [item.image] : undefined,
      },
      unit_amount: Math.round(item.price * 100), // Convert to cents
    },
    quantity: item.quantity,
  }))

  // Add shipping as a line item
  lineItems.push({
    price_data: {
      currency: 'cad',
      product_data: {
        name: `Shipping - ${shippingOption.name}`,
      },
      unit_amount: Math.round(shippingOption.price * 100),
    },
    quantity: 1,
  })

  // Create session parameters
  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/stripe-webhook/cancel`,
    customer_email: customerEmail,
    shipping_address_collection: {
      allowed_countries: ['CA', 'US'],
    },
    metadata: {
      coupon_code: discount > 0 ? 'applied' : '',
      discount_amount: discountAmount.toFixed(2),
      original_subtotal: subtotal.toFixed(2)
    }
  }

  // Apply discount if present
  if (discount > 0) {
    sessionParams.discounts = [{
      coupon: await createStripeCoupon(discount)
    }]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  if (!session.url) {
    throw new Error('Stripe session URL not generated')
  }

  return {
    sessionId: session.id,
    checkoutUrl: session.url
  }
}

async function createStripeCoupon(discountPercent: number): Promise<string> {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercent,
    duration: 'once',
    name: `${discountPercent}% Off`,
  })
  
  return coupon.id
}

serve(async (req) => {
  // Handle CORS with restricted origins
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    const allowedOrigins = ['https://anointarray.com', 'https://www.anointarray.com', 'http://localhost:5173']
    
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin! : 'null',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400'
      },
    })
  }

  // Security: Validate request method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  // Security: Log request for monitoring
  const origin = req.headers.get('origin')
  const userAgent = req.headers.get('user-agent')
  const authHeader = req.headers.get('authorization')
  
  console.log(`Checkout request from origin: ${origin}, User-Agent: ${userAgent?.substring(0, 100)}`)
  
  if (!authHeader && origin !== 'http://localhost:5173') {
    console.warn('Checkout request without authentication from:', origin)
  }

  try {

    const checkoutData: CheckoutRequest = await req.json()

    // Validate required fields
    if (!checkoutData.items || !checkoutData.shippingAddress || !checkoutData.shippingOption || !checkoutData.paymentMethod || !checkoutData.customerEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    // Store order in Supabase for later completion
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const orderData = {
      customer_email: checkoutData.customerEmail,
      items: checkoutData.items,
      shipping_address: checkoutData.shippingAddress,
      shipping_option: checkoutData.shippingOption,
      coupon_code: checkoutData.couponCode || null,
      discount: checkoutData.discount || 0,
      payment_method: checkoutData.paymentMethod,
      status: 'pending',
      created_at: new Date().toISOString()
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating order:', orderError)
      return new Response(
        JSON.stringify({ error: 'Failed to create order' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    let result: any

    if (checkoutData.paymentMethod === 'stripe') {
      const stripeResult = await createStripeSession(
        checkoutData.items,
        checkoutData.shippingOption,
        checkoutData.discount || 0,
        checkoutData.shippingAddress,
        checkoutData.customerEmail
      )

      // Update order with Stripe session ID
      await supabase
        .from('orders')
        .update({ stripe_session_id: stripeResult.sessionId })
        .eq('id', order.id)

      result = {
        success: true,
        paymentMethod: 'stripe',
        checkoutUrl: stripeResult.checkoutUrl,
        sessionId: stripeResult.sessionId,
        orderId: order.id
      }
    } else if (checkoutData.paymentMethod === 'paypal') {
      const paypalResult = await createPayPalOrder(
        checkoutData.items,
        checkoutData.shippingOption,
        checkoutData.discount || 0,
        checkoutData.shippingAddress
      )

      // Update order with PayPal order ID
      await supabase
        .from('orders')
        .update({ paypal_order_id: paypalResult.orderId })
        .eq('id', order.id)

      result = {
        success: true,
        paymentMethod: 'paypal',
        approvalUrl: paypalResult.approvalUrl,
        orderId: paypalResult.orderId,
        dbOrderId: order.id
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid payment method' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    return new Response(
      JSON.stringify(result),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in checkout-session function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})