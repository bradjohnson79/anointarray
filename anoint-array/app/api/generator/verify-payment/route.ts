import { NextRequest, NextResponse } from 'next/server'

interface PaymentVerificationRequest {
  sessionId: string
  sealId: string
}

export async function POST(request: NextRequest) {
  try {
    const { sessionId, sealId }: PaymentVerificationRequest = await request.json()

    if (!sessionId || !sealId) {
      return NextResponse.json({
        success: false,
        error: 'Missing session ID or seal ID'
      }, { status: 400 })
    }

    // Verify payment based on session ID format
    let paymentVerified = false
    let paymentDetails: any = null

    if (sessionId.startsWith('cs_')) {
      // Stripe session
      paymentDetails = await verifyStripePayment(sessionId)
      paymentVerified = paymentDetails.success
    } else if (sessionId.includes('paypal') || sessionId.length > 10) {
      // PayPal order (simplified check)
      paymentDetails = await verifyPayPalPayment(sessionId)
      paymentVerified = paymentDetails.success
    } else {
      // NowPayments or other
      paymentDetails = await verifyCryptoPayment(sessionId)
      paymentVerified = paymentDetails.success
    }

    if (!paymentVerified) {
      return NextResponse.json({
        success: false,
        error: 'Payment verification failed'
      }, { status: 400 })
    }

    // TODO: Store payment record in database
    // This would typically save to Supabase or your database
    const paymentRecord = {
      sessionId,
      sealId,
      amount: 17.00,
      currency: 'USD',
      status: 'completed',
      verifiedAt: new Date(),
      paymentDetails
    }

    console.log('Payment verified:', paymentRecord)

    return NextResponse.json({
      success: true,
      verified: true,
      sealId,
      amount: 17.00,
      currency: 'USD'
    })

  } catch (error: any) {
    console.error('Payment verification error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Payment verification failed'
    }, { status: 500 })
  }
}

async function verifyStripePayment(sessionId: string) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe not configured')
    }

    const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
    
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return {
      success: session.payment_status === 'paid',
      amount: session.amount_total / 100, // Convert from cents
      currency: session.currency,
      customerEmail: session.customer_details?.email,
      paymentId: session.payment_intent
    }
  } catch (error) {
    console.error('Stripe verification failed:', error)
    return { success: false, error: error.message }
  }
}

async function verifyPayPalPayment(orderId: string) {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal not configured')
    }

    // Get PayPal access token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com'

    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      throw new Error('Failed to get PayPal access token')
    }

    // Get order details
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json'
      }
    })

    const orderData = await orderResponse.json()

    if (!orderResponse.ok) {
      throw new Error('Failed to retrieve PayPal order')
    }

    return {
      success: orderData.status === 'COMPLETED' || orderData.status === 'APPROVED',
      amount: parseFloat(orderData.purchase_units[0]?.amount?.value || '0'),
      currency: orderData.purchase_units[0]?.amount?.currency_code,
      customerEmail: orderData.payer?.email_address,
      paymentId: orderId
    }
  } catch (error) {
    console.error('PayPal verification failed:', error)
    return { success: false, error: error.message }
  }
}

async function verifyCryptoPayment(invoiceId: string) {
  try {
    if (!process.env.NOWPAYMENTS_API_KEY) {
      throw new Error('NowPayments not configured')
    }

    const response = await fetch(`https://api.nowpayments.io/v1/payment/${invoiceId}`, {
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY
      }
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error('Failed to verify crypto payment')
    }

    return {
      success: data.payment_status === 'finished' || data.payment_status === 'confirmed',
      amount: data.price_amount,
      currency: data.price_currency,
      cryptoAmount: data.pay_amount,
      cryptoCurrency: data.pay_currency,
      paymentId: invoiceId
    }
  } catch (error) {
    console.error('Crypto payment verification failed:', error)
    return { success: false, error: error.message }
  }
}