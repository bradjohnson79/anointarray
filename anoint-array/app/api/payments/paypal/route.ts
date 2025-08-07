import { NextRequest, NextResponse } from 'next/server'

// PayPal Payment API Endpoint
// Creates PayPal orders for ANOINT Array purchases

interface PayPalOrderRequest {
  amount: number
  currency: string
  sealArrayId: string
  customerEmail?: string
  returnUrl?: string
  cancelUrl?: string
}

interface PayPalOrder {
  id: string
  status: string
  links: Array<{
    href: string
    rel: string
    method: string
  }>
}

// Get PayPal access token
async function getPayPalAccessToken(): Promise<string> {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    throw new Error('PayPal credentials not configured')
  }

  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64')

  const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com'

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal token request failed:', error)
    throw new Error('Failed to get PayPal access token')
  }

  const data = await response.json()
  return data.access_token
}

// Create PayPal order
async function createPayPalOrder(orderData: PayPalOrderRequest): Promise<PayPalOrder> {
  const accessToken = await getPayPalAccessToken()
  
  const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com'

  const defaultReturnUrl = `${process.env.NEXT_PUBLIC_URL}/generator/success`
  const defaultCancelUrl = `${process.env.NEXT_PUBLIC_URL}/generator/cancel`

  const orderPayload = {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: orderData.sealArrayId,
      amount: {
        currency_code: orderData.currency.toUpperCase(),
        value: orderData.amount.toFixed(2),
        breakdown: {
          item_total: {
            currency_code: orderData.currency.toUpperCase(),
            value: orderData.amount.toFixed(2)
          }
        }
      },
      items: [{
        name: 'ANOINT Array - Personalized Metaphysical Seal',
        description: 'Custom-generated seal array with unique numerology, glyphs, and sacred geometry tailored to your personal data',
        unit_amount: {
          currency_code: orderData.currency.toUpperCase(),
          value: orderData.amount.toFixed(2)
        },
        quantity: '1',
        category: 'DIGITAL_GOODS'
      }],
      custom_id: orderData.sealArrayId,
      description: `ANOINT Array Order - ${orderData.sealArrayId}`,
      soft_descriptor: 'ANOINT Array'
    }],
    application_context: {
      brand_name: 'ANOINT Array',
      landing_page: 'LOGIN',
      user_action: 'PAY_NOW',
      return_url: orderData.returnUrl || `${defaultReturnUrl}?seal_id=${orderData.sealArrayId}&gateway=paypal`,
      cancel_url: orderData.cancelUrl || `${defaultCancelUrl}?seal_id=${orderData.sealArrayId}&gateway=paypal`,
      shipping_preference: 'NO_SHIPPING'
    },
    metadata: {
      sealArrayId: orderData.sealArrayId,
      customerEmail: orderData.customerEmail,
      type: 'anoint_array_purchase'
    }
  }

  const response = await fetch(`${baseUrl}/v2/checkout/orders`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'PayPal-Request-Id': `anoint-${orderData.sealArrayId}-${Date.now()}` // Idempotency key
    },
    body: JSON.stringify(orderPayload)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal order creation failed:', error)
    throw new Error('Failed to create PayPal order')
  }

  const order = await response.json()
  console.log('PayPal order created:', {
    orderId: order.id,
    sealArrayId: orderData.sealArrayId,
    amount: orderData.amount,
    currency: orderData.currency
  })

  return order
}

// Capture PayPal order (used after user approves payment)
async function capturePayPalOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken()
  
  const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com'

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}/capture`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal order capture failed:', error)
    throw new Error('Failed to capture PayPal payment')
  }

  const captureResult = await response.json()
  console.log('PayPal payment captured:', {
    orderId,
    captureId: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id,
    status: captureResult.status
  })

  return captureResult
}

// GET order details (for verification)
async function getPayPalOrderDetails(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken()
  
  const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
    ? 'https://api.paypal.com'
    : 'https://api.sandbox.paypal.com'

  const response = await fetch(`${baseUrl}/v2/checkout/orders/${orderId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('PayPal order details request failed:', error)
    throw new Error('Failed to get PayPal order details')
  }

  return await response.json()
}

// POST: Create PayPal order
export async function POST(request: NextRequest) {
  try {
    const body: PayPalOrderRequest = await request.json()

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

    // Create PayPal order
    const order = await createPayPalOrder(body)

    // Find approval URL
    const approvalUrl = order.links?.find(link => link.rel === 'approve')?.href

    if (!approvalUrl) {
      return NextResponse.json({
        success: false,
        error: 'PayPal approval URL not found'
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderId: order.id,
      approvalUrl,
      status: order.status,
      sealArrayId: body.sealArrayId,
      amount: body.amount,
      currency: body.currency,
      links: order.links
    })

  } catch (error: any) {
    console.error('PayPal order creation failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create PayPal order'
    }, { status: 500 })
  }
}

// PUT: Capture PayPal order (after user approval)
export async function PUT(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Missing orderId parameter'
      }, { status: 400 })
    }

    // Capture the payment
    const captureResult = await capturePayPalOrder(orderId)

    const isCompleted = captureResult.status === 'COMPLETED'
    const captureId = captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.id
    const sealArrayId = captureResult.purchase_units?.[0]?.reference_id

    if (isCompleted && captureId) {
      // Trigger fulfillment workflow
      try {
        await fetch(`${process.env.NEXT_PUBLIC_URL}/api/generator/fulfill`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId: captureId,
            sealArrayId,
            paymentMethod: 'paypal',
            paymentGateway: 'paypal'
          })
        })
      } catch (fulfillmentError) {
        console.error('Fulfillment trigger failed:', fulfillmentError)
        // Don't fail the payment capture, just log the error
      }
    }

    return NextResponse.json({
      success: isCompleted,
      orderId,
      captureId,
      sealArrayId,
      status: captureResult.status,
      amount: captureResult.purchase_units?.[0]?.payments?.captures?.[0]?.amount,
      captureResult
    })

  } catch (error: any) {
    console.error('PayPal order capture failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to capture PayPal payment'
    }, { status: 500 })
  }
}

// GET: Get order details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json({
        success: false,
        error: 'Missing orderId parameter'
      }, { status: 400 })
    }

    const orderDetails = await getPayPalOrderDetails(orderId)

    return NextResponse.json({
      success: true,
      order: orderDetails
    })

  } catch (error: any) {
    console.error('PayPal order details request failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to get PayPal order details'
    }, { status: 500 })
  }
}