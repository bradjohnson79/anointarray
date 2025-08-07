import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'

// NowPayments Webhook Handler
// Processes cryptocurrency payment notifications and updates order status

interface NowPaymentsIPN {
  payment_id: string
  invoice_id?: string
  payment_status: 'waiting' | 'confirming' | 'confirmed' | 'sending' | 'partially_paid' | 'finished' | 'failed' | 'refunded' | 'expired'
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  outcome_amount: number
  outcome_currency: string
  created_at: string
  updated_at: string
  network: string
  network_precision?: number
  burning_percent?: number
  type?: string
}

interface OrderUpdateData {
  orderId: string
  paymentId: string
  paymentStatus: 'pending' | 'processing' | 'completed' | 'failed' | 'expired'
  amount: number
  currency: string
  cryptoAmount: number
  cryptoCurrency: string
  payAddress: string
  network: string
  confirmations?: number
}

// Mock order database - in production this would be a real database
const mockOrders: Record<string, any> = {}

// Update order status based on NowPayments IPN
async function updateOrderStatus(orderData: OrderUpdateData): Promise<boolean> {
  try {
    const { 
      orderId, 
      paymentStatus, 
      paymentId, 
      amount, 
      currency,
      cryptoAmount,
      cryptoCurrency,
      payAddress,
      network
    } = orderData
    
    console.log(`Updating crypto order ${orderId}:`, {
      paymentStatus,
      paymentId,
      amount,
      currency,
      cryptoAmount,
      cryptoCurrency,
      network,
      timestamp: new Date().toISOString()
    })

    // Mock database update
    mockOrders[orderId] = {
      ...mockOrders[orderId],
      paymentStatus: mapCryptoStatusToOrderStatus(paymentStatus),
      paymentId,
      transactionId: paymentId,
      paidAmount: amount,
      currency,
      cryptoAmount,
      cryptoCurrency,
      payAddress,
      network,
      paidAt: paymentStatus === 'completed' ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString()
    }

    // If payment completed, trigger fulfillment workflow
    if (paymentStatus === 'completed') {
      await triggerFulfillmentWorkflow(orderId)
    }

    return true
  } catch (error) {
    console.error('Failed to update crypto order status:', error)
    return false
  }
}

// Map NowPayments status to internal order status
function mapCryptoStatusToOrderStatus(cryptoStatus: string): string {
  switch (cryptoStatus) {
    case 'finished':
    case 'confirmed':
      return 'paid'
    case 'confirming':
    case 'sending':
    case 'waiting':
      return 'pending'
    case 'partially_paid':
      return 'partial'
    case 'failed':
    case 'refunded':
    case 'expired':
      return 'failed'
    default:
      return 'pending'
  }
}

// Trigger order fulfillment after successful payment
async function triggerFulfillmentWorkflow(orderId: string): Promise<void> {
  try {
    console.log(`Triggering fulfillment workflow for crypto order ${orderId}`)

    // Generate digital download for ANOINT Array
    const digitalProductsResponse = await fetch(`${process.env.NEXT_PUBLIC_URL}/api/generator/fulfill`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
        sealArrayId: orderId, // Using orderId as sealArrayId for now
        paymentMethod: 'crypto',
        customerEmail: mockOrders[orderId]?.customerEmail || 'customer@example.com'
      })
    })

    if (digitalProductsResponse.ok) {
      const digitalResult = await digitalProductsResponse.json()
      console.log('ANOINT Array fulfilled:', digitalResult)
    }

    // Send order confirmation email
    await sendOrderConfirmationEmail(orderId)

    // Update order status to processing
    mockOrders[orderId] = {
      ...mockOrders[orderId],
      status: 'processing',
      fulfillmentTriggeredAt: new Date().toISOString()
    }

    console.log(`Crypto fulfillment workflow completed for order ${orderId}`)
  } catch (error) {
    console.error(`Crypto fulfillment workflow failed for order ${orderId}:`, error)
  }
}

// Send order confirmation email
async function sendOrderConfirmationEmail(orderId: string): Promise<void> {
  try {
    const order = mockOrders[orderId]
    const emailData = {
      to: order?.customerEmail || 'customer@example.com',
      from: 'noreply@anoint.me',
      subject: `ANOINT Array Order Confirmed - ${orderId}`,
      template: 'crypto-order-confirmation',
      templateData: {
        orderId,
        orderTotal: order?.total || 17,
        cryptoAmount: order?.cryptoAmount,
        cryptoCurrency: order?.cryptoCurrency,
        network: order?.network,
        customerName: order?.customerName || 'Customer',
        downloadUrl: `${process.env.NEXT_PUBLIC_URL}/downloads/${orderId}`,
        supportEmail: 'support@anoint.me'
      }
    }

    console.log('Crypto order confirmation email would be sent:', emailData)
  } catch (error) {
    console.error('Failed to send crypto order confirmation email:', error)
  }
}

// Log webhook event for audit purposes
function logWebhookEvent(eventType: string, paymentId: string, orderId?: string, success: boolean = true, error?: string): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    eventType,
    paymentId,
    orderId,
    success,
    error,
    source: 'nowpayments_webhook'
  }

  console.log('NowPayments webhook event:', logEntry)
}

// Handle NowPayments IPN
async function handleNowPaymentsIPN(ipn: NowPaymentsIPN): Promise<{ success: boolean; message: string }> {
  try {
    const orderData: OrderUpdateData = {
      orderId: ipn.order_id,
      paymentId: ipn.payment_id,
      paymentStatus: mapNowPaymentsStatus(ipn.payment_status),
      amount: ipn.price_amount,
      currency: ipn.price_currency,
      cryptoAmount: ipn.pay_amount,
      cryptoCurrency: ipn.pay_currency,
      payAddress: ipn.pay_address,
      network: ipn.network
    }

    const updated = await updateOrderStatus(orderData)
    logWebhookEvent('payment_status_update', ipn.payment_id, ipn.order_id, updated)

    if (updated) {
      // Send status-specific notifications
      if (ipn.payment_status === 'finished') {
        console.log(`Crypto payment completed for order ${ipn.order_id}`)
      } else if (ipn.payment_status === 'failed' || ipn.payment_status === 'expired') {
        await sendPaymentFailureEmail(ipn.order_id, ipn.payment_status)
      }
    }

    return { 
      success: updated, 
      message: updated ? 'IPN processed successfully' : 'Failed to update order' 
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    logWebhookEvent('ipn_processing_error', ipn.payment_id, ipn.order_id, false, errorMessage)
    return { success: false, message: errorMessage }
  }
}

// Map NowPayments status to internal status
function mapNowPaymentsStatus(status: string): 'pending' | 'processing' | 'completed' | 'failed' | 'expired' {
  switch (status) {
    case 'finished':
    case 'confirmed':
      return 'completed'
    case 'confirming':
    case 'sending':
      return 'processing'
    case 'waiting':
      return 'pending'
    case 'failed':
    case 'refunded':
      return 'failed'
    case 'expired':
      return 'expired'
    case 'partially_paid':
      return 'pending' // Keep as pending, might get more payments
    default:
      return 'pending'
  }
}

// Send payment failure notification
async function sendPaymentFailureEmail(orderId: string, failureReason: string): Promise<void> {
  try {
    const order = mockOrders[orderId]
    const emailData = {
      to: order?.customerEmail || 'customer@example.com',
      from: 'noreply@anoint.me',
      subject: `Payment Issue - ANOINT Array Order ${orderId}`,
      template: 'crypto-payment-failed',
      templateData: {
        orderId,
        failureReason: failureReason === 'expired' ? 'Payment window expired' : 'Payment could not be processed',
        cryptoCurrency: order?.cryptoCurrency || 'crypto',
        retryUrl: `${process.env.NEXT_PUBLIC_URL}/generator?retry=${orderId}`,
        supportEmail: 'support@anoint.me'
      }
    }

    console.log('Crypto payment failure email would be sent:', emailData)
  } catch (error) {
    console.error('Failed to send crypto payment failure email:', error)
  }
}

// Verify NowPayments IPN signature (optional but recommended)
function verifyIPNSignature(body: string, signature: string): boolean {
  try {
    // In production, you would verify the signature using your IPN secret
    // const expectedSignature = crypto.createHmac('sha512', process.env.NOWPAYMENTS_IPN_SECRET)
    //   .update(body)
    //   .digest('hex')
    // return expectedSignature === signature
    
    // For now, return true - implement proper verification in production
    return true
  } catch (error) {
    console.error('IPN signature verification failed:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = headers().get('x-nowpayments-sig')

    // Verify signature if provided
    if (signature && !verifyIPNSignature(body, signature)) {
      console.error('Invalid NowPayments IPN signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Parse the IPN data
    let ipnData: NowPaymentsIPN
    try {
      ipnData = JSON.parse(body)
    } catch (err) {
      console.error('Invalid JSON in NowPayments IPN:', err)
      return NextResponse.json(
        { error: 'Invalid JSON format' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!ipnData.payment_id || !ipnData.order_id || !ipnData.payment_status) {
      console.error('Missing required fields in NowPayments IPN:', ipnData)
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Handle the IPN
    const result = await handleNowPaymentsIPN(ipnData)

    if (result.success) {
      return NextResponse.json({ 
        received: true, 
        message: result.message,
        paymentId: ipnData.payment_id,
        orderId: ipnData.order_id,
        status: ipnData.payment_status
      })
    } else {
      console.error('Failed to handle NowPayments IPN:', result.message)
      return NextResponse.json(
        { 
          error: result.message,
          paymentId: ipnData.payment_id,
          orderId: ipnData.order_id
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('NowPayments webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

// GET endpoint for webhook endpoint verification
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'NowPayments webhook endpoint is active',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  })
}