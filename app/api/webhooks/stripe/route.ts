import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { headers } from 'next/headers'

// Stripe Webhook Handler
// Processes payment events and updates order status automatically

// Initialize Stripe only when needed to avoid build-time errors
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  })
}

// Webhook endpoint secret for signature verification
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

interface OrderUpdateData {
  orderId: string
  paymentIntentId: string
  paymentStatus: 'pending' | 'processing' | 'succeeded' | 'requires_action' | 'payment_failed' | 'canceled'
  amount: number
  currency: string
  customerEmail?: string
  paymentMethodTypes: string[]
  receiptUrl?: string
  charges?: any[]
}

// Mock order database - in production this would be a real database
const mockOrders: Record<string, any> = {}

// Update order status based on payment event
async function updateOrderStatus(orderData: OrderUpdateData): Promise<boolean> {
  try {
    const { orderId, paymentStatus, paymentIntentId, amount, currency, customerEmail, receiptUrl } = orderData
    
    // In production, this would update the actual database
    console.log(`Updating order ${orderId}:`, {
      paymentStatus,
      paymentIntentId,
      amount: amount / 100, // Convert from cents
      currency,
      timestamp: new Date().toISOString()
    })

    // Mock database update
    mockOrders[orderId] = {
      ...mockOrders[orderId],
      paymentStatus: mapStripeStatusToOrderStatus(paymentStatus),
      paymentIntentId,
      transactionId: paymentIntentId,
      paidAmount: amount / 100,
      currency,
      paidAt: paymentStatus === 'succeeded' ? new Date().toISOString() : null,
      receiptUrl,
      updatedAt: new Date().toISOString()
    }

    // If payment succeeded, trigger fulfillment workflow
    if (paymentStatus === 'succeeded') {
      await triggerFulfillmentWorkflow(orderId, customerEmail)
    }

    return true
  } catch (error) {
    console.error('Failed to update order status:', error)
    return false
  }
}

// Map Stripe payment status to internal order status
function mapStripeStatusToOrderStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case 'succeeded':
      return 'paid'
    case 'processing':
      return 'pending'
    case 'requires_action':
      return 'pending'
    case 'payment_failed':
    case 'canceled':
      return 'failed'
    default:
      return 'pending'
  }
}

// Trigger order fulfillment after successful payment
async function triggerFulfillmentWorkflow(orderId: string, customerEmail?: string): Promise<void> {
  try {
    console.log(`Triggering fulfillment workflow for order ${orderId}`)

    // 1. Generate digital download links for digital products
    const digitalProductsResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/digital/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        orderItems: [
          // Mock order items - in production this would come from the database
          {
            productId: 'prod_002',
            productTitle: 'Meditation Frequency Generator Pack',
            sku: 'AA-DIGITAL-001',
            digitalFile: '/digital/products/meditation-frequency-pack.zip',
            quantity: 1
          }
        ],
        customerEmail: customerEmail || 'customer@example.com',
        customerName: 'Customer',
        expiryHours: 168, // 7 days
        maxDownloads: 3
      })
    })

    if (digitalProductsResponse.ok) {
      const digitalResult = await digitalProductsResponse.json()
      console.log('Digital download links generated:', digitalResult)
    }

    // 2. Create shipping labels for physical products
    const physicalProducts = mockOrders[orderId]?.items?.filter((item: any) => item.productType === 'physical')
    
    if (physicalProducts && physicalProducts.length > 0) {
      const shippingLabelResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/shipping/labels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          carrier: 'canada-post',
          service: 'DOM.EP',
          shipTo: {
            name: 'Customer Name',
            address1: '123 Customer Street',
            city: 'Toronto',
            province: 'ON',
            postalCode: 'M5H 2M9',
            country: 'CA'
          },
          packages: [{
            weight: 2.5,
            length: 25,
            width: 20,
            height: 10,
            description: 'ANOINT Array Products',
            value: mockOrders[orderId]?.total || 100
          }],
          labelFormat: 'PDF',
          labelSize: '4x6'
        })
      })

      if (shippingLabelResponse.ok) {
        const shippingResult = await shippingLabelResponse.json()
        console.log('Shipping label generated:', shippingResult)
      }
    }

    // 3. Send order confirmation email
    await sendOrderConfirmationEmail(orderId, customerEmail)

    // 4. Update order status to processing
    mockOrders[orderId] = {
      ...mockOrders[orderId],
      status: 'processing',
      fulfillmentTriggeredAt: new Date().toISOString()
    }

    console.log(`Fulfillment workflow completed for order ${orderId}`)
  } catch (error) {
    console.error(`Fulfillment workflow failed for order ${orderId}:`, error)
  }
}

// Send order confirmation email
async function sendOrderConfirmationEmail(orderId: string, customerEmail?: string): Promise<void> {
  try {
    // In production, this would use a real email service
    const emailData = {
      to: customerEmail || 'customer@example.com',
      from: 'noreply@anoint.me',
      subject: `Order Confirmation - ${orderId}`,
      template: 'order-confirmation',
      templateData: {
        orderId,
        orderTotal: mockOrders[orderId]?.total || 0,
        customerName: 'Customer',
        orderItems: mockOrders[orderId]?.items || [],
        trackingInfo: 'Available within 24 hours',
        supportEmail: 'support@anoint.me'
      }
    }

    console.log('Order confirmation email would be sent:', emailData)
  } catch (error) {
    console.error('Failed to send order confirmation email:', error)
  }
}

// Log webhook event for audit purposes
function logWebhookEvent(eventType: string, eventId: string, orderId?: string, success: boolean = true, error?: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    eventId,
    orderId,
    success,
    error,
    source: 'stripe_webhook'
  }

  console.log('Stripe webhook event:', logEntry)
}

// Handle different Stripe event types
async function handleStripeEvent(event: Stripe.Event): Promise<{ success: boolean; message: string }> {
  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata?.orderId

        if (!orderId) {
          return { success: false, message: 'No order ID found in payment intent metadata' }
        }

        const orderData: OrderUpdateData = {
          orderId,
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'succeeded',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customerEmail: paymentIntent.receipt_email || undefined,
          paymentMethodTypes: paymentIntent.payment_method_types,
          receiptUrl: paymentIntent.charges?.data[0]?.receipt_url,
          charges: paymentIntent.charges?.data
        }

        const updated = await updateOrderStatus(orderData)
        logWebhookEvent('payment_intent.succeeded', event.id, orderId, updated)

        return { success: updated, message: updated ? 'Payment processed successfully' : 'Failed to update order' }
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata?.orderId

        if (!orderId) {
          return { success: false, message: 'No order ID found in payment intent metadata' }
        }

        const orderData: OrderUpdateData = {
          orderId,
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'payment_failed',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customerEmail: paymentIntent.receipt_email || undefined,
          paymentMethodTypes: paymentIntent.payment_method_types
        }

        const updated = await updateOrderStatus(orderData)
        logWebhookEvent('payment_intent.payment_failed', event.id, orderId, updated)

        // Send payment failure notification
        if (updated && paymentIntent.receipt_email) {
          await sendPaymentFailureEmail(orderId, paymentIntent.receipt_email, paymentIntent.last_payment_error?.message)
        }

        return { success: updated, message: updated ? 'Payment failure processed' : 'Failed to update order' }
      }

      case 'payment_intent.requires_action': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        const orderId = paymentIntent.metadata?.orderId

        if (!orderId) {
          return { success: false, message: 'No order ID found in payment intent metadata' }
        }

        const orderData: OrderUpdateData = {
          orderId,
          paymentIntentId: paymentIntent.id,
          paymentStatus: 'requires_action',
          amount: paymentIntent.amount,
          currency: paymentIntent.currency,
          customerEmail: paymentIntent.receipt_email || undefined,
          paymentMethodTypes: paymentIntent.payment_method_types
        }

        const updated = await updateOrderStatus(orderData)
        logWebhookEvent('payment_intent.requires_action', event.id, orderId, updated)

        return { success: updated, message: updated ? 'Payment requires action' : 'Failed to update order' }
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        const charge = dispute.charge as Stripe.Charge
        const paymentIntentId = typeof charge.payment_intent === 'string' ? charge.payment_intent : charge.payment_intent?.id

        if (paymentIntentId) {
          // In production, you would look up the order by payment intent ID
          const orderId = 'order_dispute_' + dispute.id
          
          logWebhookEvent('charge.dispute.created', event.id, orderId, true)
          
          // Notify admin of dispute
          await sendDisputeNotification(dispute, orderId)
        }

        return { success: true, message: 'Dispute notification processed' }
      }

      case 'invoice.payment_succeeded': {
        // Handle subscription payments if you have recurring billing
        const invoice = event.data.object as Stripe.Invoice
        logWebhookEvent('invoice.payment_succeeded', event.id, invoice.subscription?.toString(), true)
        
        return { success: true, message: 'Invoice payment processed' }
      }

      case 'customer.subscription.deleted': {
        // Handle subscription cancellations
        const subscription = event.data.object as Stripe.Subscription
        logWebhookEvent('customer.subscription.deleted', event.id, subscription.id, true)
        
        return { success: true, message: 'Subscription cancellation processed' }
      }

      default:
        logWebhookEvent(event.type, event.id, undefined, true, 'Unhandled event type')
        return { success: true, message: `Unhandled event type: ${event.type}` }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logWebhookEvent(event.type, event.id, undefined, false, errorMessage)
    return { success: false, message: errorMessage }
  }
}

// Send payment failure notification
async function sendPaymentFailureEmail(orderId: string, customerEmail: string, errorMessage?: string): Promise<void> {
  try {
    const emailData = {
      to: customerEmail,
      from: 'noreply@anoint.me',
      subject: `Payment Issue - Order ${orderId}`,
      template: 'payment-failed',
      templateData: {
        orderId,
        errorMessage: errorMessage || 'Payment could not be processed',
        retryUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/checkout?order=${orderId}`,
        supportEmail: 'support@anoint.me'
      }
    }

    console.log('Payment failure email would be sent:', emailData)
  } catch (error) {
    console.error('Failed to send payment failure email:', error)
  }
}

// Send dispute notification to admin
async function sendDisputeNotification(dispute: Stripe.Dispute, orderId: string): Promise<void> {
  try {
    const adminEmailData = {
      to: 'admin@anoint.me',
      from: 'noreply@anoint.me',
      subject: `URGENT: Chargeback Dispute - Order ${orderId}`,
      template: 'dispute-notification',
      templateData: {
        orderId,
        disputeId: dispute.id,
        amount: dispute.amount / 100,
        currency: dispute.currency,
        reason: dispute.reason,
        status: dispute.status,
        evidenceDetails: dispute.evidence_details,
        created: new Date(dispute.created * 1000).toISOString()
      }
    }

    console.log('Dispute notification email would be sent:', adminEmailData)
  } catch (error) {
    console.error('Failed to send dispute notification:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
      console.error('No Stripe signature found')
      return NextResponse.json(
        { error: 'No signature found' },
        { status: 400 }
      )
    }

    if (!endpointSecret) {
      console.error('Stripe webhook secret not configured')
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      )
    }

    let event: Stripe.Event

    try {
      // Verify the webhook signature
      const stripe = getStripe()
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error('Webhook signature verification failed:', errorMessage)
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${errorMessage}` },
        { status: 400 }
      )
    }

    // Handle the event
    const result = await handleStripeEvent(event)

    if (result.success) {
      return NextResponse.json({ 
        received: true, 
        message: result.message,
        eventId: event.id,
        eventType: event.type
      })
    } else {
      console.error('Failed to handle Stripe event:', result.message)
      return NextResponse.json(
        { 
          error: result.message,
          eventId: event.id,
          eventType: event.type
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Stripe webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook endpoint verification (optional)
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Stripe webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}