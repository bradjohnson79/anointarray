import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// NowPayments configuration
const NOWPAYMENTS_API_KEY = Deno.env.get('NOWPAYMENTS_API_KEY')!
const NOWPAYMENTS_IPN_SECRET = Deno.env.get('NOWPAYMENTS_IPN_SECRET') // Optional IPN secret

function verifyIpnSignature(body: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) {
    return false
  }

  try {
    const expectedSignature = createHmac('sha512', secret)
      .update(body, 'utf8')
      .digest('hex')
    
    return signature === expectedSignature
  } catch (error) {
    console.error('Error verifying IPN signature:', error)
    return false
  }
}

async function handlePaymentFinished(event: any) {
  try {
    const {
      payment_id,
      order_id,
      payment_status,
      pay_address,
      pay_amount,
      pay_currency,
      price_amount,
      price_currency,
      actually_paid,
      outcome_amount,
      outcome_currency,
      created_at,
      updated_at
    } = event

    // Get the stored invoice details
    const { data: storedInvoice } = await supabase
      .from('webhooks')
      .select('payload, user_id')
      .eq('external_id', payment_id)
      .or(`external_id.eq.${order_id}`)
      .eq('source', 'nowpayments')
      .single()

    const metadata = storedInvoice?.payload?.metadata || {}
    const userId = metadata.user_id || storedInvoice?.user_id

    if (!userId) {
      throw new Error('User ID not found in invoice metadata')
    }

    if (payment_status !== 'finished' && payment_status !== 'confirmed') {
      console.log(`Payment not finished yet: ${payment_status}`)
      return { success: true, message: 'Payment not finished' }
    }

    // Check if order already exists
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('payment_details->>nowpayments_payment_id', payment_id)
      .single()

    if (existingOrder) {
      console.log('Order already exists for payment:', payment_id)
      return { success: true, message: 'Order already processed' }
    }

    // Create the order
    const orderNumber = `ORD-${Date.now()}-${payment_id.slice(-8).toUpperCase()}`
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'processing',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        
        // Amounts
        subtotal: metadata.subtotal || 0,
        tax_total: metadata.tax || 0,
        shipping_total: metadata.shipping || 0,
        discount_total: metadata.discount || 0,
        total: metadata.total_cad || Math.round(parseFloat(price_amount) * 100),
        
        // Currency information
        currency: price_currency || 'CAD',
        
        // Payment details
        payment_method: 'cryptocurrency',
        payment_details: {
          nowpayments_payment_id: payment_id,
          nowpayments_order_id: order_id,
          crypto_currency: pay_currency,
          crypto_amount: parseFloat(pay_amount),
          crypto_address: pay_address,
          actually_paid: parseFloat(actually_paid || pay_amount),
          outcome_amount: parseFloat(outcome_amount || pay_amount),
          outcome_currency: outcome_currency || pay_currency,
          payment_status,
          created_at,
          updated_at,
        },
        
        // Items
        items_data: metadata.items || [],
        
        // Metadata
        notes: `Cryptocurrency Payment: ${pay_currency} ${pay_amount}`,
        tags: ['crypto', 'nowpayments', pay_currency.toLowerCase()],
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    // Create order items records
    for (const item of (metadata.items || [])) {
      await supabase
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: item.product_id || null,
          variant_id: item.variant_id || null,
          sku: item.sku || '',
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          total: item.price * item.quantity,
        })
    }

    // Record coupon redemption if applicable
    if (metadata.coupon_id && metadata.coupon_code) {
      await supabase
        .from('coupon_redemptions')
        .insert({
          coupon_id: metadata.coupon_id,
          order_id: order.id,
          user_id: userId,
          discount_amount_cents: metadata.discount || 0,
        })
    }

    // Update inventory
    await supabase.rpc('update_inventory_on_order', {
      order_id_param: order.id
    })

    // Log successful order creation
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'Order created from NowPayments webhook',
      user_id_param: userId,
      metadata_param: {
        order_id: order.id,
        order_number: orderNumber,
        payment_id,
        crypto_currency: pay_currency,
        crypto_amount: parseFloat(pay_amount),
        cad_amount: metadata.total_cad
      }
    })

    return { success: true, order }

  } catch (error) {
    console.error('Error processing NowPayments payment:', error)
    
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `Failed to process NowPayments payment: ${error.message}`,
      metadata_param: {
        payment_id: event.payment_id,
        order_id: event.order_id,
        error: error.toString()
      }
    })
    
    throw error
  }
}

async function handlePaymentFailed(event: any) {
  const { payment_id, order_id, payment_status } = event
  
  // Find any pending order for this payment
  const { data: pendingOrder } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_details->>nowpayments_payment_id', payment_id)
    .single()

  if (pendingOrder) {
    // Update order status
    await supabase
      .from('orders')
      .update({
        financial_status: 'failed',
        status: 'cancelled',
        notes: `${pendingOrder.notes || ''}\nPayment failed: ${payment_status}`
      })
      .eq('id', pendingOrder.id)
  }

  // Log the failure
  await supabase.rpc('log_event', {
    level_param: 'warning',
    category_param: 'payment',
    message_param: 'NowPayments payment failed',
    metadata_param: {
      payment_id,
      order_id,
      status: payment_status
    }
  })
}

async function handlePaymentRefunded(event: any) {
  const { payment_id, order_id, refund_amount, refund_currency } = event
  
  // Find order with this payment
  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('payment_details->>nowpayments_payment_id', payment_id)
    .single()

  if (order) {
    // Convert refund amount to cents (assuming CAD)
    const refundAmountCents = Math.round(parseFloat(refund_amount || '0') * 100)
    
    // Update order status
    await supabase
      .from('orders')
      .update({
        financial_status: refundAmountCents >= order.total ? 'refunded' : 'partially_refunded',
        refund_amount: refundAmountCents,
        refunded_at: new Date().toISOString(),
        notes: `${order.notes || ''}\nCrypto Refund: ${refund_amount} ${refund_currency}`
      })
      .eq('id', order.id)

    // Log the refund
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'payment',
      message_param: 'NowPayments refund processed',
      user_id_param: order.user_id,
      metadata_param: {
        order_id: order.id,
        payment_id,
        refund_amount: parseFloat(refund_amount || '0'),
        refund_currency
      }
    })
  }
}

serve(async (req) => {
  try {
    // Get the raw body for signature verification
    const body = await req.text()
    
    // Verify IPN signature if secret is configured
    if (NOWPAYMENTS_IPN_SECRET) {
      const signature = req.headers.get('x-nowpayments-sig')
      const isValid = verifyIpnSignature(body, signature, NOWPAYMENTS_IPN_SECRET)
      if (!isValid) {
        console.error('NowPayments IPN signature verification failed')
        return new Response('Invalid signature', { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // Store the webhook event
    await supabase
      .from('webhooks')
      .insert({
        source: 'nowpayments',
        event_type: 'payment.status.changed',
        external_id: event.payment_id || event.order_id,
        payload: event,
        status: 'processing'
      })

    // Handle different payment statuses
    switch (event.payment_status) {
      case 'finished':
      case 'confirmed':
        await handlePaymentFinished(event)
        break

      case 'failed':
      case 'expired':
        await handlePaymentFailed(event)
        break

      case 'refunded':
      case 'partially_refunded':
        await handlePaymentRefunded(event)
        break

      case 'waiting':
      case 'confirming':
      case 'sending':
        // Payment in progress, no action needed
        console.log('Payment in progress:', event.payment_status, event.payment_id)
        break

      default:
        console.log('Unhandled NowPayments status:', event.payment_status)
    }

    // Mark webhook as processed
    await supabase
      .from('webhooks')
      .update({
        status: 'completed',
        processed_at: new Date().toISOString()
      })
      .eq('external_id', event.payment_id || event.order_id)

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('NowPayments webhook error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `NowPayments webhook error: ${error.message}`,
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