import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Test Stripe API directly
    console.log('Testing Stripe API key...')
    
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (!stripeSecretKey) {
      return NextResponse.json({
        error: 'Stripe secret key not found',
        status: 'FAIL'
      }, { status: 500 })
    }

    // Test Stripe API call
    const stripeResponse = await fetch('https://api.stripe.com/v1/products', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    const stripeStatus = stripeResponse.ok
    const stripeMessage = stripeStatus ? 'Stripe API connected successfully' : `Stripe API error: ${stripeResponse.status}`

    // Test PayPal API
    console.log('Testing PayPal API...')
    
    const paypalClientId = process.env.PAYPAL_CLIENT_ID_SANDBOX
    const paypalClientSecret = process.env.PAYPAL_CLIENT_SECRET_SANDBOX
    
    let paypalStatus = false
    let paypalMessage = 'PayPal credentials not found'
    
    if (paypalClientId && paypalClientSecret) {
      const paypalAuthResponse = await fetch('https://api.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Accept-Language': 'en_US',
          'Authorization': `Basic ${Buffer.from(`${paypalClientId}:${paypalClientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      })
      
      paypalStatus = paypalAuthResponse.ok
      paypalMessage = paypalStatus ? 'PayPal API connected successfully' : `PayPal API error: ${paypalAuthResponse.status}`
    }

    // Test NowPayments API
    console.log('Testing NowPayments API...')
    
    const nowpaymentsApiKey = process.env.NOWPAYMENTS_API_KEY
    let nowpaymentsStatus = false
    let nowpaymentsMessage = 'NowPayments API key not found'
    
    if (nowpaymentsApiKey) {
      const nowpaymentsResponse = await fetch('https://api.nowpayments.io/v1/status', {
        method: 'GET',
        headers: {
          'x-api-key': nowpaymentsApiKey
        }
      })
      
      nowpaymentsStatus = nowpaymentsResponse.ok
      nowpaymentsMessage = nowpaymentsStatus ? 'NowPayments API connected successfully' : `NowPayments API error: ${nowpaymentsResponse.status}`
    }

    const results = {
      timestamp: new Date().toISOString(),
      stripe: {
        status: stripeStatus ? 'SUCCESS' : 'FAIL',
        message: stripeMessage,
        key_configured: !!stripeSecretKey
      },
      paypal: {
        status: paypalStatus ? 'SUCCESS' : 'FAIL', 
        message: paypalMessage,
        key_configured: !!(paypalClientId && paypalClientSecret)
      },
      nowpayments: {
        status: nowpaymentsStatus ? 'SUCCESS' : 'FAIL',
        message: nowpaymentsMessage,
        key_configured: !!nowpaymentsApiKey
      },
      summary: {
        total_providers: 3,
        working_providers: [stripeStatus, paypalStatus, nowpaymentsStatus].filter(Boolean).length,
        overall_status: [stripeStatus, paypalStatus, nowpaymentsStatus].every(Boolean) ? 'ALL WORKING' : 'PARTIAL'
      }
    }

    console.log('Payment API test results:', results)

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    console.error('Payment API test error:', error)
    return NextResponse.json({
      error: 'Payment API test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Payment API Test Endpoint',
    usage: 'POST to test Stripe, PayPal, and NowPayments API connectivity'
  })
}