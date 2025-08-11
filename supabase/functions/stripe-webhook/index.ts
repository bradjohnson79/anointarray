import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import Stripe from 'https://esm.sh/stripe@13.10.0?target=deno'

// Initialize clients
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const { 
      id,
      customer,
      customer_details,
      metadata,
      amount_total,
      amount_subtotal,
      total_details,
      shipping_cost,
      shipping_details,
      payment_intent,
      payment_status,
      line_items,
    } = session

    // Get user ID from metadata
    const userId = metadata?.user_id
    if (!userId) {
      throw new Error('User ID not found in session metadata')
    }

    // Retrieve line items with product data
    const lineItemsWithData = await stripe.checkout.sessions.listLineItems(id, {
      expand: ['data.price.product']
    })

    // Create order items array
    const orderItems = []
    for (const item of lineItemsWithData.data) {
      if (item.description !== 'Discount') {
        orderItems.push({
          product_id: item.price?.product?.metadata?.product_id || '',
          variant_id: item.price?.product?.metadata?.variant_id || null,
          sku: item.price?.product?.metadata?.sku || '',
          title: item.description || '',
          price: item.price?.unit_amount || 0,
          quantity: item.quantity || 1,
          total: (item.amount_total || 0)
        })
      }
    }

    // Create the order
    const orderNumber = `ORD-${Date.now()}-${id.slice(-8).toUpperCase()}`
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'processing',
        financial_status: payment_status === 'paid' ? 'paid' : 'pending',
        fulfillment_status: 'unfulfilled',
        
        // Amounts (Stripe uses smallest currency unit)
        subtotal: amount_subtotal || 0,
        tax_total: total_details?.amount_tax || 0,
        shipping_total: shipping_cost?.amount_total || 0,
        discount_total: total_details?.amount_discount || 0,
        total: amount_total || 0,
        
        // Customer details
        customer_email: customer_details?.email || '',
        customer_phone: customer_details?.phone || '',
        
        // Addresses
        billing_address: customer_details?.address ? {
          line1: customer_details.address.line1,
          line2: customer_details.address.line2,
          city: customer_details.address.city,
          state: customer_details.address.state,
          postal_code: customer_details.address.postal_code,
          country: customer_details.address.country,
        } : null,
        
        shipping_address: shipping_details?.address ? {
          name: shipping_details.name,
          line1: shipping_details.address.line1,
          line2: shipping_details.address.line2,
          city: shipping_details.address.city,
          state: shipping_details.address.state,
          postal_code: shipping_details.address.postal_code,
          country: shipping_details.address.country,
        } : null,
        
        // Payment details
        payment_method: 'stripe',
        payment_details: {
          stripe_session_id: id,
          stripe_payment_intent: payment_intent,
          stripe_customer_id: customer,
        },
        
        // Items
        items_data: orderItems,
        
        // Metadata
        notes: `Stripe Checkout Session: ${id}`,
        tags: ['stripe', 'online'],
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Create order items records
    for (const item of orderItems) {
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id || null,
          variant_id: item.variant_id || null,
          sku: item.sku,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          total: item.total,
        })
    }

    // Record coupon redemption if applicable
    if (metadata?.coupon_id && metadata?.coupon_code) {
      await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: metadata.coupon_id,
          order_id: order.id,
          user_id: userId,
          discount_amount_cents: total_details?.amount_discount || 0,
        })
    }

    // Update inventory
    await supabase.rpc('update_inventory_on_order', {
      order_id_param: order.id
    })

    // Send order confirmation email (would integrate with email service)
    // await sendOrderConfirmationEmail(order)

    // Log successful order creation
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'Order created from Stripe webhook',
      user_id_param: userId,
      metadata_param: {
        order_id: order.id,
        order_number: orderNumber,
        amount: amount_total,
        stripe_session_id: id
      }
    })

    return { success: true, order }

  } catch (error) {
    console.error('Error processing checkout:', error)
    
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `Failed to process Stripe checkout: ${error.message}`,
      metadata_param: {
        session_id: session.id,
        error: error.toString()
      }
    })
    
    throw error
  }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
  // Find order with this payment intent
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_details->>stripe_payment_intent', paymentIntent.id)
    .single()

  if (order) {
    // Update order status
    await supabase
      .from('orders')
      .update({
        financial_status: 'failed',
        status: 'cancelled',
        notes: `Payment failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`
      })
      .eq('id', order.id)

    // Log the failure
    await supabase.rpc('log_event', {
      level_param: 'warning',
      category_param: 'payment',
      message_param: 'Payment failed',
      user_id_param: order.user_id,
      metadata_param: {
        order_id: order.id,
        payment_intent: paymentIntent.id,
        error: paymentIntent.last_payment_error
      }
    })
  }
}

async function handleRefund(refund: Stripe.Refund) {
  // Find order with this payment intent
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_details->>stripe_payment_intent', refund.payment_intent)
    .single()

  if (order) {
    // Update order status
    await supabase
      .from('orders')
      .update({
        financial_status: refund.status === 'succeeded' ? 'refunded' : 'partially_refunded',
        refund_amount: refund.amount,
        refunded_at: new Date().toISOString(),
        notes: `Refund processed: ${refund.id}`
      })
      .eq('id', order.id)

    // Log the refund
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'Refund processed',
      user_id_param: order.user_id,
      metadata_param: {
        order_id: order.id,
        refund_id: refund.id,
        amount: refund.amount,
        status: refund.status
      }
    })
  }
}

serve(async (req) => {
  try {
    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      return new Response('No signature', { status: 400 })
    }

    // Verify the webhook signature
    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(body, signature, stripeWebhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return new Response('Invalid signature', { status: 400 })
    }

    // Store the webhook event
    await supabase
      .from('webhooks')
      .insert({
        source: 'stripe',
        event_type: event.type,
        external_id: event.id,
        payload: event,
        status: 'processing'
      })

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
        break

      case 'charge.refunded':
        const charge = event.data.object as Stripe.Charge
        if (charge.refunds?.data[0]) {
          await handleRefund(charge.refunds.data[0])
        }
        break

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        // Handle subscription events if needed
        console.log('Subscription event:', event.type)
        break

      default:
        console.log('Unhandled event type:', event.type)
    }

    // Mark webhook as processed
    await supabase
      .from('webhooks')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('external_id', event.id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Webhook error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `Stripe webhook error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
})