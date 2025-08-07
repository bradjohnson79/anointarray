import { NextRequest, NextResponse } from 'next/server'

interface PaymentRequest {
  gateway: 'stripe' | 'paypal' | 'nowpayments'
  amount: number
  currency: string
  sealArrayId: string
}

export async function POST(request: NextRequest) {
  try {
    const { gateway, amount, currency, sealArrayId }: PaymentRequest = await request.json()

    // Validate request
    if (!gateway || !amount || !currency || !sealArrayId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required payment parameters'
      }, { status: 400 })
    }

    // Validate amount (should be $17 USD)
    if (amount !== 17 || currency !== 'USD') {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment amount'
      }, { status: 400 })
    }

    let paymentUrl: string

    switch (gateway) {
      case 'stripe':
        paymentUrl = await createStripeSession(sealArrayId, amount)
        break
      case 'paypal':
        paymentUrl = await createPayPalOrder(sealArrayId, amount)
        break
      case 'nowpayments':
        paymentUrl = await createCryptoInvoice(sealArrayId, amount)
        break
      default:
        throw new Error('Unsupported payment gateway')
    }

    return NextResponse.json({
      success: true,
      url: paymentUrl,
      gateway,
      amount,
      currency
    })

  } catch (error: any) {
    console.error('Payment creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create payment session'
    }, { status: 500 })
  }
}

async function createStripeSession(sealArrayId: string, amount: number): Promise<string> {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe not configured')
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'ANOINT Array - Personalized Metaphysical Seal',
          description: 'Custom-generated seal array with unique numerology, glyphs, and sacred geometry',
          images: [`${process.env.NEXT_PUBLIC_URL}/images/anoint-array-preview.png`]
        },
        unit_amount: amount * 100 // Convert to cents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_URL}/generator/success?session_id={CHECKOUT_SESSION_ID}&seal_id=${sealArrayId}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/generator/cancel`,
    metadata: {
      sealArrayId: sealArrayId,
      type: 'anoint_array_purchase'
    },
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI']
    }
  })

  return session.url
}

async function createPayPalOrder(sealArrayId: string, amount: number): Promise<string> {
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

  // Create PayPal order
  const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${tokenData.access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: amount.toFixed(2)
        },
        description: 'ANOINT Array - Personalized Metaphysical Seal',
        custom_id: sealArrayId
      }],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_URL}/generator/success?seal_id=${sealArrayId}`,
        cancel_url: `${process.env.NEXT_PUBLIC_URL}/generator/cancel`,
        brand_name: 'ANOINT Array',
        landing_page: 'LOGIN',
        user_action: 'PAY_NOW'
      }
    })
  })

  const orderData = await orderResponse.json()

  if (!orderResponse.ok) {
    throw new Error('Failed to create PayPal order')
  }

  // Find approval URL
  const approvalUrl = orderData.links?.find((link: any) => link.rel === 'approve')?.href

  if (!approvalUrl) {
    throw new Error('PayPal approval URL not found')
  }

  return approvalUrl
}

async function createCryptoInvoice(sealArrayId: string, amount: number): Promise<string> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error('NowPayments not configured')
  }

  const response = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      price_amount: amount,
      price_currency: 'usd',
      order_id: sealArrayId,
      order_description: 'ANOINT Array - Personalized Metaphysical Seal',
      ipn_callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/nowpayments`,
      success_url: `${process.env.NEXT_PUBLIC_URL}/generator/success?seal_id=${sealArrayId}`,
      cancel_url: `${process.env.NEXT_PUBLIC_URL}/generator/cancel`
    })
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error('Failed to create crypto invoice')
  }

  return data.invoice_url
}