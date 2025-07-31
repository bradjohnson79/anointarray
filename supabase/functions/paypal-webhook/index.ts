import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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

async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`,
      'PayPal-Request-Id': `anoint-capture-${Date.now()}`
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('PayPal capture failed:', errorData)
    throw new Error('Failed to capture PayPal order')
  }

  return await response.json()
}

async function getPayPalOrderDetails(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken()

  const response = await fetch(`https://api.sandbox.paypal.com/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('PayPal order details failed:', errorData)
    throw new Error('Failed to get PayPal order details')
  }

  return await response.json()
}

// Process successful PayPal payment
async function processSuccessfulPayPalPayment(paypalOrderId: string) {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  try {
    // Find the order by PayPal order ID
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('paypal_order_id', paypalOrderId)
      .single()

    if (orderError || !order) {
      console.error('Order not found for PayPal order:', paypalOrderId, orderError)
      return { success: false, error: 'Order not found' }
    }

    // Get PayPal order details
    const paypalOrder = await getPayPalOrderDetails(paypalOrderId)
    
    // Capture the payment
    const captureResult = await capturePayPalOrder(paypalOrderId)
    
    if (captureResult.status !== 'COMPLETED') {
      throw new Error('PayPal payment capture failed')
    }

    // Calculate totals
    const subtotal = order.items.reduce((sum: number, item: any) => 
      sum + (item.price * item.quantity), 0
    )
    const shippingCost = order.shipping_option?.price || 0
    const discountAmount = order.discount > 0 ? (subtotal * order.discount) / 100 : 0
    const total = subtotal - discountAmount + shippingCost

    // Update order status
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        status: 'paid',
        payment_status: 'completed',
        paypal_capture_id: captureResult.purchase_units[0]?.payments?.captures[0]?.id,
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

    // Get customer info from PayPal order
    const customerName = paypalOrder.payer?.name ? 
      `${paypalOrder.payer.name.given_name} ${paypalOrder.payer.name.surname}` : 
      order.shipping_address?.name || 'Customer'

    // Send confirmation email
    const emailData = {
      orderNumber,
      customerEmail: order.customer_email,
      customerName,
      items: order.items,
      subtotal,
      shippingCost,
      discount: discountAmount,
      total,
      shippingAddress: order.shipping_address,
      shippingMethod: order.shipping_option?.name || 'Standard Shipping',
      paymentMethod: 'PayPal',
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

    console.log(`PayPal order ${orderNumber} processed successfully for ${order.customer_email}`)
    return { success: true, orderNumber, orderId: order.id }

  } catch (error) {
    console.error('Error processing successful PayPal payment:', error)
    return { success: false, error: error.message }
  }
}

// Handle PayPal payment failure
async function processFailedPayPalPayment(paypalOrderId: string) {
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
      .eq('paypal_order_id', paypalOrderId)

    if (updateError) {
      console.error('Failed to update failed PayPal order:', updateError)
      return { success: false, error: 'Failed to update order' }
    }

    console.log(`PayPal payment failed for order: ${paypalOrderId}`)
    return { success: true }

  } catch (error) {
    console.error('Error processing failed PayPal payment:', error)
    return { success: false, error: error.message }
  }
}

// Verify PayPal webhook signature using proper certificate validation
async function verifyPayPalWebhook(payload: string, headers: Headers): Promise<boolean> {
  try {
    const authAlgo = headers.get('PAYPAL-AUTH-ALGO')
    const transmissionId = headers.get('PAYPAL-TRANSMISSION-ID')
    const certId = headers.get('PAYPAL-CERT-ID')
    const signature = headers.get('PAYPAL-TRANSMISSION-SIG')
    const timestamp = headers.get('PAYPAL-TRANSMISSION-TIME')
    
    // Validate required headers are present
    if (!authAlgo || !transmissionId || !certId || !signature || !timestamp) {
      console.error('Missing required PayPal webhook headers')
      return false
    }
    
    // Get webhook ID from environment
    const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID')
    if (!webhookId) {
      console.error('PAYPAL_WEBHOOK_ID not configured')
      return false
    }
    
    // Get PayPal access token for verification
    const accessToken = await getPayPalAccessToken()
    
    // Create verification request
    const verificationData = {
      auth_algo: authAlgo,
      cert_id: certId,
      transmission_id: transmissionId,
      transmission_sig: signature,
      transmission_time: timestamp,
      webhook_id: webhookId,
      webhook_event: JSON.parse(payload)
    }
    
    // Verify with PayPal API
    const verifyResponse = await fetch('https://api.sandbox.paypal.com/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(verificationData)
    })
    
    if (!verifyResponse.ok) {
      console.error('PayPal webhook verification request failed:', verifyResponse.status)
      return false
    }
    
    const verificationResult = await verifyResponse.json()
    const isValid = verificationResult.verification_status === 'SUCCESS'
    
    if (!isValid) {
      console.error('PayPal webhook signature verification failed:', verificationResult)
    }
    
    return isValid
    
  } catch (error) {
    console.error('Error verifying PayPal webhook:', error)
    return false
  }
}

serve(async (req) => {
  // Handle CORS for legitimate requests only (restrict origin)
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    const allowedOrigins = ['https://anointarray.com', 'https://www.anointarray.com']
    
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin! : 'null',
        'Access-Control-Allow-Methods': 'POST, GET',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, paypal-transmission-id, paypal-auth-algo, paypal-cert-id, paypal-transmission-sig',
        'Access-Control-Max-Age': '86400'
      },
    })
  }

  // Handle success redirect from PayPal
  if (req.method === 'GET' && req.url.includes('/success')) {
    const url = new URL(req.url)
    const token = url.searchParams.get('token') // PayPal order ID
    const payerId = url.searchParams.get('PayerID')

    if (!token) {
      return new Response('Missing PayPal order token', { status: 400 })
    }

    try {
      // Process the successful payment
      const result = await processSuccessfulPayPalPayment(token)
      
      if (result.success) {
        // Redirect to success page
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `https://anointarray.com/order-success?paypal_order=${token}&order_number=${result.orderNumber}`
          }
        })
      } else {
        return new Response(null, {
          status: 302,
          headers: {
            'Location': `https://anointarray.com/order-failed?paypal_order=${token}&error=${encodeURIComponent(result.error || 'unknown')}`
          }
        })
      }
    } catch (error) {
      console.error('Error handling PayPal success redirect:', error)
      return new Response(null, {
        status: 302,
        headers: {
          'Location': `https://anointarray.com/order-failed?error=processing`
        }
      })
    }
  }

  // Handle cancel redirect from PayPal
  if (req.method === 'GET' && req.url.includes('/cancel')) {
    const url = new URL(req.url)
    const token = url.searchParams.get('token')
    
    if (token) {
      await processFailedPayPalPayment(token)
    }
    
    return new Response(null, {
      status: 302,
      headers: {
        'Location': `https://anointarray.com/cart?cancelled=true&payment=paypal`
      }
    })
  }

  // Handle webhook events
  if (req.method === 'POST') {
    try {
      const body = await req.text()
      
      // Verify webhook with proper certificate validation
      if (!(await verifyPayPalWebhook(body, req.headers))) {
        console.error('PayPal webhook verification failed')
        return new Response('Invalid webhook signature', { status: 401 })
      }

      // Parse the event
      const event = JSON.parse(body)

      console.log(`Processing PayPal webhook: ${event.event_type}`)

      // Handle different event types
      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED': {
          const orderId = event.resource?.id
          if (orderId) {
            console.log(`PayPal order approved: ${orderId}`)
            // Order is approved but not yet captured
            // Capture will happen when user returns to success URL
          }
          break
        }

        case 'PAYMENT.CAPTURE.COMPLETED': {
          const captureId = event.resource?.id
          const orderId = event.resource?.supplementary_data?.related_ids?.order_id
          
          if (orderId) {
            console.log(`PayPal payment captured: ${captureId} for order: ${orderId}`)
            const result = await processSuccessfulPayPalPayment(orderId)
            if (!result.success) {
              console.error('Failed to process PayPal payment:', result.error)
            }
          }
          break
        }

        case 'PAYMENT.CAPTURE.DENIED':
        case 'CHECKOUT.ORDER.VOIDED': {
          const orderId = event.resource?.id || event.resource?.supplementary_data?.related_ids?.order_id
          if (orderId) {
            console.log(`PayPal payment failed/denied: ${orderId}`)
            await processFailedPayPalPayment(orderId)
          }
          break
        }

        default:
          console.log(`Unhandled PayPal event type: ${event.event_type}`)
      }

      return new Response(
        JSON.stringify({ received: true }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )

    } catch (error) {
      console.error('Error processing PayPal webhook:', error)
      
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