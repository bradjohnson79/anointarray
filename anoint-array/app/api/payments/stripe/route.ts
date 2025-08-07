import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

// Stripe Payment API Endpoint
// Creates Stripe Checkout sessions and Payment Intents for ANOINT Array purchases

interface StripePaymentRequest {
  amount: number
  currency: string
  sealArrayId: string
  customerEmail?: string
  paymentMethodId?: string
  returnUrl?: string
  cancelUrl?: string
  type?: 'checkout' | 'payment_intent'
}

// Initialize Stripe
function getStripeInstance(): Stripe {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('Stripe secret key not configured')
  }
  
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2023-10-16'
  })
}

// Create Stripe Checkout Session
async function createCheckoutSession(paymentData: StripePaymentRequest): Promise<Stripe.Checkout.Session> {
  const stripe = getStripeInstance()

  const defaultSuccessUrl = `${process.env.NEXT_PUBLIC_URL}/generator/success`
  const defaultCancelUrl = `${process.env.NEXT_PUBLIC_URL}/generator/cancel`

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: paymentData.currency.toLowerCase(),
        product_data: {
          name: 'ANOINT Array - Personalized Metaphysical Seal',
          description: 'Custom-generated seal array with unique numerology, glyphs, and sacred geometry tailored to your personal data',
          images: [`${process.env.NEXT_PUBLIC_URL}/images/anoint-array-preview.png`],
          metadata: {
            type: 'anoint_array',
            sealArrayId: paymentData.sealArrayId
          }
        },
        unit_amount: Math.round(paymentData.amount * 100) // Convert to cents
      },
      quantity: 1
    }],
    mode: 'payment',
    success_url: paymentData.returnUrl || `${defaultSuccessUrl}?session_id={CHECKOUT_SESSION_ID}&seal_id=${paymentData.sealArrayId}&gateway=stripe`,
    cancel_url: paymentData.cancelUrl || `${defaultCancelUrl}?seal_id=${paymentData.sealArrayId}&gateway=stripe`,
    metadata: {
      sealArrayId: paymentData.sealArrayId,
      type: 'anoint_array_purchase',
      customerEmail: paymentData.customerEmail || ''
    },
    billing_address_collection: 'required',
    shipping_address_collection: {
      allowed_countries: ['US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 'NL', 'SE', 'NO', 'DK', 'FI', 'BE', 'AT', 'CH', 'IE', 'PT', 'LU']
    },
    phone_number_collection: {
      enabled: false
    },
    custom_text: {
      submit: {
        message: 'Your ANOINT Array will be generated and delivered digitally after payment confirmation.'
      }
    }
  }

  // Add customer email if provided
  if (paymentData.customerEmail) {
    sessionParams.customer_email = paymentData.customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  console.log('Stripe checkout session created:', {
    sessionId: session.id,
    sealArrayId: paymentData.sealArrayId,
    amount: paymentData.amount,
    currency: paymentData.currency
  })

  return session
}

// Create Stripe Payment Intent (for custom checkout flows)
async function createPaymentIntent(paymentData: StripePaymentRequest): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeInstance()

  const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
    amount: Math.round(paymentData.amount * 100), // Convert to cents
    currency: paymentData.currency.toLowerCase(),
    metadata: {
      sealArrayId: paymentData.sealArrayId,
      type: 'anoint_array_purchase',
      customerEmail: paymentData.customerEmail || ''
    },
    description: `ANOINT Array - Personalized Metaphysical Seal (${paymentData.sealArrayId})`,
    setup_future_usage: undefined, // One-time payment
    capture_method: 'automatic'
  }

  // Add payment method if provided
  if (paymentData.paymentMethodId) {
    paymentIntentParams.payment_method = paymentData.paymentMethodId
    paymentIntentParams.confirm = true
    paymentIntentParams.return_url = paymentData.returnUrl || `${process.env.NEXT_PUBLIC_URL}/generator/success?seal_id=${paymentData.sealArrayId}&gateway=stripe`
  }

  // Add customer if email provided
  if (paymentData.customerEmail) {
    // Try to find existing customer or create new one
    const customers = await stripe.customers.list({
      email: paymentData.customerEmail,
      limit: 1
    })

    let customerId: string
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        email: paymentData.customerEmail,
        metadata: {
          source: 'anoint_array'
        }
      })
      customerId = customer.id
    }

    paymentIntentParams.customer = customerId
  }

  const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

  console.log('Stripe payment intent created:', {
    paymentIntentId: paymentIntent.id,
    sealArrayId: paymentData.sealArrayId,
    amount: paymentData.amount,
    currency: paymentData.currency,
    status: paymentIntent.status
  })

  return paymentIntent
}

// Confirm Payment Intent
async function confirmPaymentIntent(paymentIntentId: string, paymentMethodId?: string): Promise<Stripe.PaymentIntent> {
  const stripe = getStripeInstance()

  const confirmParams: Stripe.PaymentIntentConfirmParams = {}

  if (paymentMethodId) {
    confirmParams.payment_method = paymentMethodId
  }

  const paymentIntent = await stripe.paymentIntents.confirm(paymentIntentId, confirmParams)

  console.log('Stripe payment intent confirmed:', {
    paymentIntentId: paymentIntent.id,
    status: paymentIntent.status
  })

  return paymentIntent
}

// Get Payment Details
async function getPaymentDetails(sessionId?: string, paymentIntentId?: string): Promise<any> {
  const stripe = getStripeInstance()

  if (sessionId) {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['payment_intent', 'customer']
    })
    return { type: 'session', data: session }
  }

  if (paymentIntentId) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return { type: 'payment_intent', data: paymentIntent }
  }

  throw new Error('Either sessionId or paymentIntentId is required')
}

// POST: Create checkout session or payment intent
export async function POST(request: NextRequest) {
  try {
    const body: StripePaymentRequest = await request.json()

    // Validate request
    if (!body.amount || !body.currency || !body.sealArrayId) {
      return NextResponse.json({
        success: false,
        error: 'Missing required parameters: amount, currency, sealArrayId'
      }, { status: 400 })
    }

    // Validate amount (should be $17 USD)
    if (body.amount !== 17 || body.currency.toUpperCase() !== 'USD') {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment amount. ANOINT Arrays are $17 USD'
      }, { status: 400 })
    }

    // Create either checkout session or payment intent
    const useCheckout = body.type !== 'payment_intent' // Default to checkout

    if (useCheckout) {
      // Create Stripe Checkout Session (recommended for hosted checkout)
      const session = await createCheckoutSession(body)

      return NextResponse.json({
        success: true,
        type: 'checkout_session',
        sessionId: session.id,
        checkoutUrl: session.url,
        sealArrayId: body.sealArrayId,
        amount: body.amount,
        currency: body.currency,
        successUrl: session.success_url,
        cancelUrl: session.cancel_url
      })
    } else {
      // Create Payment Intent (for custom checkout flows)
      const paymentIntent = await createPaymentIntent(body)

      return NextResponse.json({
        success: true,
        type: 'payment_intent',
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
        sealArrayId: body.sealArrayId,
        amount: body.amount,
        currency: body.currency,
        status: paymentIntent.status,
        requiresAction: paymentIntent.status === 'requires_action',
        nextAction: paymentIntent.next_action
      })
    }

  } catch (error: any) {
    console.error('Stripe payment creation failed:', error)
    
    // Handle specific Stripe errors
    if (error.type === 'StripeCardError') {
      return NextResponse.json({
        success: false,
        error: 'Your card was declined. Please try a different payment method.',
        code: error.code
      }, { status: 400 })
    }

    if (error.type === 'StripeInvalidRequestError') {
      return NextResponse.json({
        success: false,
        error: 'Invalid payment request. Please check your information.',
        code: error.code
      }, { status: 400 })
    }

    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create Stripe payment'
    }, { status: 500 })
  }
}

// PUT: Confirm payment intent
export async function PUT(request: NextRequest) {
  try {
    const { paymentIntentId, paymentMethodId } = await request.json()

    if (!paymentIntentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing paymentIntentId parameter'
      }, { status: 400 })
    }

    const paymentIntent = await confirmPaymentIntent(paymentIntentId, paymentMethodId)

    const isSucceeded = paymentIntent.status === 'succeeded'
    const sealArrayId = paymentIntent.metadata?.sealArrayId

    if (isSucceeded && sealArrayId) {
      // Trigger fulfillment workflow
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/generator/fulfill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: paymentIntent.id,
            sealArrayId,
            paymentMethod: 'stripe',
            paymentGateway: 'stripe'
          })
        })
      } catch (fulfillmentError) {
        console.error('Fulfillment trigger failed:', fulfillmentError)
        // Don't fail the payment confirmation, just log the error
      }
    }

    return NextResponse.json({
      success: isSucceeded,
      paymentIntentId: paymentIntent.id,
      sealArrayId,
      status: paymentIntent.status,
      requiresAction: paymentIntent.status === 'requires_action',
      nextAction: paymentIntent.next_action,
      paymentIntent
    })

  } catch (error: any) {
    console.error('Stripe payment confirmation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to confirm Stripe payment'
    }, { status: 500 })
  }
}

// GET: Get payment details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('sessionId')
    const paymentIntentId = searchParams.get('paymentIntentId')

    if (!sessionId && !paymentIntentId) {
      return NextResponse.json({
        success: false,
        error: 'Missing sessionId or paymentIntentId parameter'
      }, { status: 400 })
    }

    const paymentDetails = await getPaymentDetails(sessionId || undefined, paymentIntentId || undefined)

    // Extract relevant information
    const result: any = {
      success: true,
      type: paymentDetails.type,
      data: paymentDetails.data
    }

    if (paymentDetails.type === 'session') {
      const session = paymentDetails.data as Stripe.Checkout.Session
      result.sessionId = session.id
      result.paymentStatus = session.payment_status
      result.amount = session.amount_total
      result.currency = session.currency
      result.customerEmail = session.customer_email
      result.sealArrayId = session.metadata?.sealArrayId
      
      if (session.payment_intent) {
        result.paymentIntentId = typeof session.payment_intent === 'string' 
          ? session.payment_intent 
          : session.payment_intent.id
      }
    } else {
      const paymentIntent = paymentDetails.data as Stripe.PaymentIntent
      result.paymentIntentId = paymentIntent.id
      result.status = paymentIntent.status
      result.amount = paymentIntent.amount
      result.currency = paymentIntent.currency
      result.sealArrayId = paymentIntent.metadata?.sealArrayId
    }

    return NextResponse.json(result)

  } catch (error: any) {
    console.error('Stripe payment details request failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get Stripe payment details'
    }, { status: 500 })
  }
}