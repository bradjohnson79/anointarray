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
const PAYPAL_WEBHOOK_ID = Deno.env.get('PAYPAL_WEBHOOK_ID')

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

async function verifyWebhookSignature(
  headers: Headers,
  body: string,
  webhookId: string
): Promise<boolean> {
  try {
    const accessToken = await getPayPalAccessToken()
    
    const verificationPayload = {
      auth_algo: headers.get('paypal-auth-algo'),
      cert_url: headers.get('paypal-cert-url'),
      transmission_id: headers.get('paypal-transmission-id'),
      transmission_sig: headers.get('paypal-transmission-sig'),
      transmission_time: headers.get('paypal-transmission-time'),
      webhook_id: webhookId,
      webhook_event: JSON.parse(body),
    }

    const response = await fetch(`${PAYPAL_BASE_URL}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(verificationPayload),
    })

    if (!response.ok) {
      console.error('PayPal signature verification failed:', response.status)
      return false
    }

    const result = await response.json()
    return result.verification_status === 'SUCCESS'
  } catch (error) {
    console.error('Error verifying PayPal webhook signature:', error)
    return false
  }
}

async function handleOrderApproved(event: any) {
  try {
    const orderId = event.resource?.id
    const purchaseUnits = event.resource?.purchase_units || []
    
    if (!orderId || purchaseUnits.length === 0) {
      throw new Error('Invalid order data')
    }

    // Get the stored order details from webhooks table
    const { data: storedOrder } = await supabase
      .from('webhooks')
      .select('payload')
      .eq('external_id', orderId)
      .eq('source', 'paypal')
      .single()

    const metadata = storedOrder?.payload?.metadata || {}
    const userId = metadata.user_id

    if (!userId) {
      throw new Error('User ID not found in order metadata')
    }

    // Capture the payment
    const accessToken = await getPayPalAccessToken()
    const captureResponse = await fetch(
      `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      }
    )

    if (!captureResponse.ok) {
      throw new Error(`Failed to capture PayPal payment: ${captureResponse.status}`)
    }

    const captureData = await captureResponse.json()
    const purchaseUnit = captureData.purchase_units[0]
    const payment = purchaseUnit.payments?.captures?.[0]

    if (!payment || payment.status !== 'COMPLETED') {
      throw new Error('Payment capture failed or incomplete')
    }

    // Create the order in database
    const orderNumber = `ORD-${Date.now()}-${orderId.slice(-8).toUpperCase()}`
    const amount = purchaseUnit.amount
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        order_number: orderNumber,
        status: 'processing',
        financial_status: 'paid',
        fulfillment_status: 'unfulfilled',
        
        // Convert amounts from decimal to cents
        subtotal: Math.round(parseFloat(amount.breakdown?.item_total?.value || '0') * 100),
        tax_total: Math.round(parseFloat(amount.breakdown?.tax_total?.value || '0') * 100),
        shipping_total: Math.round(parseFloat(amount.breakdown?.shipping?.value || '0') * 100),
        discount_total: Math.round(parseFloat(amount.breakdown?.discount?.value || '0') * 100),
        total: Math.round(parseFloat(amount.value) * 100),
        
        // Customer details
        customer_email: event.resource?.payer?.email_address || '',
        customer_phone: event.resource?.payer?.phone?.phone_number?.national_number || '',
        
        // Addresses
        billing_address: event.resource?.payer?.address ? {
          line1: event.resource.payer.address.address_line_1,
          line2: event.resource.payer.address.address_line_2,
          city: event.resource.payer.address.admin_area_2,
          state: event.resource.payer.address.admin_area_1,
          postal_code: event.resource.payer.address.postal_code,
          country: event.resource.payer.address.country_code,
        } : null,
        
        shipping_address: purchaseUnit.shipping?.address ? {
          name: purchaseUnit.shipping.name?.full_name,
          line1: purchaseUnit.shipping.address.address_line_1,
          line2: purchaseUnit.shipping.address.address_line_2,
          city: purchaseUnit.shipping.address.admin_area_2,
          state: purchaseUnit.shipping.address.admin_area_1,
          postal_code: purchaseUnit.shipping.address.postal_code,
          country: purchaseUnit.shipping.address.country_code,
        } : null,
        
        // Payment details
        payment_method: 'paypal',
        payment_details: {
          paypal_order_id: orderId,
          paypal_capture_id: payment.id,
          paypal_transaction_id: payment.id,
          payer_id: event.resource?.payer?.payer_id,
        },
        
        // Items
        items_data: metadata.items || [],
        
        // Metadata
        notes: `PayPal Order: ${orderId}`,
        tags: ['paypal', 'online'],
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
      message_param: 'Order created from PayPal webhook',
      user_id_param: userId,
      metadata_param: {
        order_id: order.id,
        order_number: orderNumber,
        amount: Math.round(parseFloat(amount.value) * 100),
        paypal_order_id: orderId
      }
    })

    return { success: true, order }

  } catch (error) {
    console.error('Error processing PayPal order:', error)
    
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `Failed to process PayPal order: ${error.message}`,
      metadata_param: {
        order_id: event.resource?.id,
        error: error.toString()
      }
    })
    
    throw error
  }
}

async function handlePaymentCaptureCompleted(event: any) {
  // This is handled in handleOrderApproved when we capture the payment
  console.log('Payment capture completed:', event.resource?.id)
}

async function handlePaymentCaptureRefunded(event: any) {
  try {
    const refundId = event.resource?.id
    const captureId = event.resource?.capture_id
    const amount = event.resource?.amount
    
    // Find order with this PayPal transaction
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .or(`payment_details->>paypal_capture_id.eq.${captureId},payment_details->>paypal_transaction_id.eq.${captureId}`)
      .single()

    if (order) {
      const refundAmountCents = Math.round(parseFloat(amount?.value || '0') * 100)
      
      // Update order status
      await supabase
        .from('orders')
        .update({
          financial_status: refundAmountCents >= order.total ? 'refunded' : 'partially_refunded',
          refund_amount: refundAmountCents,
          refunded_at: new Date().toISOString(),
          notes: `${order.notes || ''}\nPayPal Refund: ${refundId}`
        })
        .eq('id', order.id)

      // Log the refund
      await supabase.rpc('log_event', {
        level_param: 'info',
        category_param: 'payment',
        message_param: 'PayPal refund processed',
        user_id_param: order.user_id,
        metadata_param: {
          order_id: order.id,
          refund_id: refundId,
          amount: refundAmountCents,
          status: event.resource?.status
        }
      })
    }
  } catch (error) {
    console.error('Error processing PayPal refund:', error)
  }
}

serve(async (req) => {
  try {
    // Get the raw body for signature verification
    const body = await req.text()
    
    // Verify webhook signature if webhook ID is configured
    if (PAYPAL_WEBHOOK_ID) {
      const isValid = await verifyWebhookSignature(req.headers, body, PAYPAL_WEBHOOK_ID)
      if (!isValid) {
        console.error('PayPal webhook signature verification failed')
        return new Response('Invalid signature', { status: 401 })
      }
    }

    const event = JSON.parse(body)

    // Store the webhook event
    await supabase
      .from('webhooks')
      .insert({
        source: 'paypal',
        event_type: event.event_type,
        external_id: event.id,
        payload: event,
        status: 'processing'
      })

    // Handle different event types
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event)
        break

      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptureCompleted(event)
        break

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentCaptureRefunded(event)
        break

      case 'PAYMENT.CAPTURE.DENIED':
      case 'PAYMENT.CAPTURE.DECLINED':
        console.log('Payment failed:', event.event_type, event.resource?.id)
        break

      default:
        console.log('Unhandled PayPal event type:', event.event_type)
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
    console.error('PayPal webhook error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'payment',
      message_param: `PayPal webhook error: ${error.message}`,
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