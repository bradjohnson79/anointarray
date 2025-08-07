import { NextResponse } from 'next/server'

interface PaymentGatewayStatus {
  stripe: boolean
  paypal: boolean
  nowpayments: boolean
}

async function testStripe(): Promise<{ success: boolean; message?: string; details?: any }> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return { 
        success: false, 
        message: 'STRIPE_SECRET_KEY environment variable not configured' 
      }
    }

    if (!process.env.STRIPE_PUBLISHABLE_KEY) {
      return { 
        success: false, 
        message: 'STRIPE_PUBLISHABLE_KEY environment variable not configured' 
      }
    }

    // Test Stripe connection by retrieving account info
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return { 
        success: false, 
        message: `Stripe API error: ${response.status}`,
        details: error
      }
    }

    const account = await response.json()
    return { 
      success: true, 
      message: `Connected to Stripe account: ${account.display_name || account.id}`,
      details: {
        accountId: account.id,
        country: account.country,
        currency: account.default_currency,
        charges_enabled: account.charges_enabled,
        payouts_enabled: account.payouts_enabled
      }
    }
  } catch (error) {
    console.error('Stripe test failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown Stripe error'
    }
  }
}

async function testPayPal(): Promise<{ success: boolean; message?: string; details?: any }> {
  try {
    if (!process.env.PAYPAL_CLIENT_ID) {
      return { 
        success: false, 
        message: 'PAYPAL_CLIENT_ID environment variable not configured' 
      }
    }

    if (!process.env.PAYPAL_CLIENT_SECRET) {
      return { 
        success: false, 
        message: 'PAYPAL_CLIENT_SECRET environment variable not configured' 
      }
    }

    // Test PayPal by getting an access token
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const environment = process.env.PAYPAL_ENVIRONMENT || 'sandbox'
    const baseUrl = environment === 'production' 
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
      return { 
        success: false, 
        message: `PayPal API error: ${response.status}`,
        details: error
      }
    }

    const tokenData = await response.json()
    return { 
      success: true, 
      message: `Connected to PayPal ${environment} environment`,
      details: {
        environment,
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in,
        scope: tokenData.scope
      }
    }
  } catch (error) {
    console.error('PayPal test failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown PayPal error'
    }
  }
}

async function testNowPayments(): Promise<{ success: boolean; message?: string; details?: any }> {
  try {
    if (!process.env.NOWPAYMENTS_API_KEY) {
      return { 
        success: false, 
        message: 'NOWPAYMENTS_API_KEY environment variable not configured' 
      }
    }

    // Test NowPayments by checking API status
    const response = await fetch('https://api.nowpayments.io/v1/status', {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const error = await response.text()
      return { 
        success: false, 
        message: `NowPayments API error: ${response.status}`,
        details: error
      }
    }

    const statusData = await response.json()
    
    // Also get available currencies
    const currenciesResponse = await fetch('https://api.nowpayments.io/v1/currencies', {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    })

    let currencies = []
    if (currenciesResponse.ok) {
      const currenciesData = await currenciesResponse.json()
      currencies = currenciesData.currencies?.slice(0, 10) || [] // First 10 currencies
    }

    return { 
      success: true, 
      message: `Connected to NowPayments API`,
      details: {
        status: statusData.message || 'Active',
        availableCurrencies: currencies.length,
        sampleCurrencies: currencies.join(', ')
      }
    }
  } catch (error) {
    console.error('NowPayments test failed:', error)
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Unknown NowPayments error'
    }
  }
}

export async function POST() {
  try {
    // Test all payment gateways in parallel
    const [stripeResult, paypalResult, nowpaymentsResult] = await Promise.allSettled([
      testStripe(),
      testPayPal(),
      testNowPayments()
    ])

    // Extract results
    const stripeTest = stripeResult.status === 'fulfilled' ? stripeResult.value : { success: false, message: 'Test failed' }
    const paypalTest = paypalResult.status === 'fulfilled' ? paypalResult.value : { success: false, message: 'Test failed' }
    const nowpaymentsTest = nowpaymentsResult.status === 'fulfilled' ? nowpaymentsResult.value : { success: false, message: 'Test failed' }

    const gateways: PaymentGatewayStatus = {
      stripe: stripeTest.success,
      paypal: paypalTest.success,
      nowpayments: nowpaymentsTest.success
    }

    // Detailed test results
    const testResults = {
      stripe: stripeTest,
      paypal: paypalTest,
      nowpayments: nowpaymentsTest
    }

    // Check for environment variables
    const envCheck = {
      stripe: {
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        hasPublishableKey: !!process.env.STRIPE_PUBLISHABLE_KEY,
        hasWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      },
      paypal: {
        hasClientId: !!process.env.PAYPAL_CLIENT_ID,
        hasClientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
        environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox'
      },
      nowpayments: {
        hasApiKey: !!process.env.NOWPAYMENTS_API_KEY,
        hasIpnSecret: !!process.env.NOWPAYMENTS_IPN_SECRET
      }
    }

    // Configuration recommendations
    const recommendations = []
    if (!stripeTest.success) {
      if (!process.env.STRIPE_SECRET_KEY) {
        recommendations.push('Add STRIPE_SECRET_KEY to environment variables')
      }
      if (!process.env.STRIPE_PUBLISHABLE_KEY) {
        recommendations.push('Add STRIPE_PUBLISHABLE_KEY to environment variables')
      }
      if (!process.env.STRIPE_WEBHOOK_SECRET) {
        recommendations.push('Add STRIPE_WEBHOOK_SECRET for webhook verification')
      }
    }

    if (!paypalTest.success) {
      if (!process.env.PAYPAL_CLIENT_ID) {
        recommendations.push('Add PAYPAL_CLIENT_ID to environment variables')
      }
      if (!process.env.PAYPAL_CLIENT_SECRET) {
        recommendations.push('Add PAYPAL_CLIENT_SECRET to environment variables')
      }
      recommendations.push('Set PAYPAL_ENVIRONMENT to "production" for live payments (currently: ' + (process.env.PAYPAL_ENVIRONMENT || 'sandbox') + ')')
    }

    if (!nowpaymentsTest.success) {
      if (!process.env.NOWPAYMENTS_API_KEY) {
        recommendations.push('Add NOWPAYMENTS_API_KEY to environment variables')
      }
      recommendations.push('Consider adding NOWPAYMENTS_IPN_SECRET for webhook verification')
    }

    return NextResponse.json({
      success: true,
      gateways,
      testResults,
      envCheck,
      recommendations,
      summary: {
        totalActive: Object.values(gateways).filter(Boolean).length,
        totalGateways: Object.keys(gateways).length,
        allActive: Object.values(gateways).every(Boolean)
      },
      price: {
        amount: 17.00,
        currency: 'USD',
        stripe: { amount: 1700, currency: 'usd' }, // Stripe uses cents
        paypal: { amount: '17.00', currency_code: 'USD' },
        nowpayments: { price_amount: 17, price_currency: 'usd' }
      }
    })

  } catch (error) {
    console.error('Payment gateway test failed:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to test payment gateways',
      gateways: {
        stripe: false,
        paypal: false,
        nowpayments: false
      },
      testResults: {
        stripe: { success: false, message: 'Test execution failed' },
        paypal: { success: false, message: 'Test execution failed' },
        nowpayments: { success: false, message: 'Test execution failed' }
      }
    })
  }
}