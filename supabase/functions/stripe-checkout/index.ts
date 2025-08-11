import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

interface CheckoutItem {
  product_id: string
  variant_id?: string
  quantity: number
  price: number
  title: string
  image?: string
}

interface CheckoutRequest {
  items: CheckoutItem[]
  success_url: string
  cancel_url: string
  customer_email?: string
  coupon_code?: string
  shipping_address?: any
  metadata?: Record<string, string>
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
      success_url,
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

    // Calculate totals and apply coupon if provided
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

    // Create or update Stripe customer
    let stripeCustomerId: string
    
    // Check if user already has a Stripe customer ID
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id
    } else {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: customer_email || user.email,
        metadata: {
          user_id: user.id
        }
      })
      stripeCustomerId = customer.id

      // Save Stripe customer ID to profile
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    // Create line items for Stripe
    const lineItems = items.map(item => ({
      price_data: {
        currency: 'cad',
        product_data: {
          name: item.title,
          images: item.image ? [item.image] : undefined,
          metadata: {
            product_id: item.product_id,
            variant_id: item.variant_id || ''
          }
        },
        unit_amount: item.price,
      },
      quantity: item.quantity,
    }))

    // Add discount as a negative line item if applicable
    if (discount > 0) {
      lineItems.push({
        price_data: {
          currency: 'cad',
          product_data: {
            name: `Discount (${coupon_code})`,
          },
          unit_amount: -discount,
        },
        quantity: 1,
      })
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url,
      cancel_url,
      metadata: {
        ...metadata,
        user_id: user.id,
        coupon_id: couponId || '',
        coupon_code: coupon_code || '',
      },
      shipping_address_collection: shipping_address ? {
        allowed_countries: ['CA', 'US'],
      } : undefined,
      shipping_options: [
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 1200,
              currency: 'cad',
            },
            display_name: 'Standard Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 3,
              },
              maximum: {
                unit: 'business_day',
                value: 5,
              },
            },
          },
        },
        {
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: {
              amount: 2400,
              currency: 'cad',
            },
            display_name: 'Express Shipping',
            delivery_estimate: {
              minimum: {
                unit: 'business_day',
                value: 1,
              },
              maximum: {
                unit: 'business_day',
                value: 2,
              },
            },
          },
        },
      ],
      automatic_tax: {
        enabled: true,
      },
      tax_id_collection: {
        enabled: true,
      },
      invoice_creation: {
        enabled: true,
      },
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      locale: 'en',
      billing_address_collection: 'required',
      phone_number_collection: {
        enabled: true,
      },
    })

    // Log the checkout session creation
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'Stripe checkout session created',
      user_id_param: user.id,
      metadata_param: {
        session_id: session.id,
        amount: subtotal - discount,
        items_count: items.length
      }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        sessionId: session.id,
        url: session.url,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Stripe checkout error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `Stripe checkout error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        error: 'Failed to create checkout session',
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