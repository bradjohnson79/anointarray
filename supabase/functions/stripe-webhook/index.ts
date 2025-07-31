import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.15.0'

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

// Webhook signature verification
function verifyStripeSignature(payload: string, signature: string, secret: string): boolean {
  try {
    stripe.webhooks.constructEvent(payload, signature, secret)
    return true
  } catch (error) {
    console.error('Stripe signature verification failed:', error.message)
    return false
  }
}

// Process successful payment
async function processSuccessfulPayment(session: Stripe.Checkout.Session) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Find the order by Stripe session ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('stripe_session_id', session.id)
      .single()

    if (orderError || !order) {
      console.error('Order not found for session:', session.id, orderError)
      return { success: false, error: 'Order not found' }
    }

    // Calculate totals from the session
    const subtotal = order.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )
    const shippingCost = order.shipping_option?.price || 0
    const discountAmount = order.discount > 0 ? (subtotal * order.discount) / 100 : 0
    const total = session.amount_total ? session.amount_total / 100 : subtotal - discountAmount + shippingCost

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'completed',
        stripe_payment_intent_id: session.payment_intent,
        total_amount: total,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return { success: false, error: 'Failed to update order' }
    }

    // Generate order number
    const orderNumber = `ANT-${order.id.toString().padStart(6, '0')}`

    // Send confirmation email
    const emailData = {
      orderNumber,
      customerEmail: order.customer_email,
      customerName: session.customer_details?.name || order.shipping_address?.name || 'Customer',
      items: order.items,
      subtotal,
      shippingCost,
      discount: discountAmount,
      total,
      shippingAddress: order.shipping_address,
      shippingMethod: order.shipping_option?.name || 'Standard Shipping',
      paymentMethod: 'Credit Card (Stripe)',
      orderDate: order.created_at
    }

    // Call send-email function
    const emailResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify(emailData)
    })

    if (!emailResponse.ok) {
      console.error('Failed to send confirmation email')
    } else {
      console.log('Confirmation email sent successfully')
    }

    console.log(`Order ${orderNumber} processed successfully for ${order.customer_email}`)
    return { success: true, orderNumber, orderId: order.id }

  } catch (error) {
    console.error('Error processing successful payment:', error)
    return { success: false, error: error.message }
  }
}

// Handle payment failure
async function processFailedPayment(session: Stripe.Checkout.Session) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Update order status to failed
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'failed',
        payment_status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_session_id', session.id)

    if (updateError) {
      console.error('Failed to update failed order:', updateError)
      return { success: false, error: 'Failed to update order' }
    }

    console.log(`Payment failed for session: ${session.id}`)
    return { success: true }

  } catch (error) {
    console.error('Error processing failed payment:', error)
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  // Handle CORS for non-webhook requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
      },
    })
  }

  // Handle success redirect from Stripe Checkout
  if (req.method === 'GET' && req.url.includes('/success')) {
    const url = new URL(req.url)
    const sessionId = url.searchParams.get('session_id')

    if (!sessionId) {
      return new Response('Missing session_id', { status: 400 })
    }

    try {
      // Retrieve the checkout session
      const session = await stripe.checkout.sessions.retrieve(sessionId)
      
      if (session.payment_status === 'paid') {
        await processSuccessfulPayment(session)
        
        // Redirect to success page
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `https://anointarray.com/order-success?session_id=${sessionId}`
          }
        })
      } else {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `https://anointarray.com/order-failed?session_id=${sessionId}`
          }
        })
      }
    } catch (error) {
      console.error('Error handling success redirect:', error)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://anointarray.com/order-failed?error=processing`
        }
      })
    }
  }

  // Handle cancel redirect from Stripe Checkout
  if (req.method === 'GET' && req.url.includes('/cancel')) {
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://anointarray.com/cart?cancelled=true`
      }
    })
  }

  // Handle webhook events
  if (req.method === 'POST') {
    try {
      const body = await req.text()
      const signature = req.headers.get('stripe-signature')

      if (!signature) {
        return new Response('Missing stripe-signature header', { status: 400 })
      }

      // Verify webhook signature
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
      if (!webhookSecret) {
        console.error('STRIPE_WEBHOOK_SECRET not configured')
        return new Response('Webhook secret not configured', { status: 500 })
      }

      if (!verifyStripeSignature(body, signature, webhookSecret)) {
        return new Response('Invalid signature', { status: 401 })
      }

      // Parse the event
      const event = JSON.parse(body) as Stripe.Event

      console.log(`Processing Stripe webhook: ${event.type}`)

      // Handle different event types
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session
          
          if (session.payment_status === 'paid') {
            const result = await processSuccessfulPayment(session)
            if (!result.success) {
              console.error('Failed to process successful payment:', result.error)
            }
          }
          break
        }

        case 'checkout.session.expired': {
          const session = event.data.object as Stripe.Checkout.Session
          await processFailedPayment(session)
          break
        }

        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log(`Payment succeeded: ${paymentIntent.id}`)
          break
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          console.log(`Payment failed: ${paymentIntent.id}`)
          break
        }

        default:
          console.log(`Unhandled event type: ${event.type}`)
      }

      return new Response(
        JSON.stringify({ received: true }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('Error processing webhook:', error)
      
      return new Response(
        JSON.stringify({ 
          error: 'Webhook processing failed',
          message: error.message 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  }

  return new Response('Method not allowed', { status: 405 })
})