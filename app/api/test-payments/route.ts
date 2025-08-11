import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    
    // Test data for payment integration
    const testOrderData = {
      items: [
        {
          product_id: "test-product-1",
          title: "Test Mystical Array",
          price: 2999, // $29.99 CAD
          quantity: 1
        }
      ],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/checkout`,
      customer_email: "test@anointarray.com",
      shipping_address: {
        name: "Test User",
        line1: "123 Test St",
        city: "Toronto", 
        state: "ON",
        postal_code: "M5V 3A8",
        country: "CA"
      },
      metadata: {
        user_id: "test-user-123",
        step: "payment_integration_test"
      }
    }

    const results = {
      timestamp: new Date().toISOString(),
      tests: {}
    }

    // Test 1: Stripe Checkout Integration
    console.log('Testing Stripe checkout integration...')
    try {
      const stripeResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify(testOrderData)
      })

      if (stripeResponse.ok) {
        const stripeData = await stripeResponse.json()
        results.tests.stripe = {
          status: 'success',
          checkout_url: stripeData.url,
          session_id: stripeData.session_id || 'N/A',
          message: 'Stripe checkout session created successfully'
        }
      } else {
        const errorText = await stripeResponse.text()
        results.tests.stripe = {
          status: 'error',
          error: errorText,
          status_code: stripeResponse.status
        }
      }
    } catch (error) {
      results.tests.stripe = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 2: PayPal Checkout Integration
    console.log('Testing PayPal checkout integration...')
    try {
      const paypalResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paypal-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          ...testOrderData,
          return_url: testOrderData.success_url,
          cancel_url: testOrderData.cancel_url
        })
      })

      if (paypalResponse.ok) {
        const paypalData = await paypalResponse.json()
        results.tests.paypal = {
          status: 'success',
          approval_url: paypalData.approvalUrl,
          payment_id: paypalData.paymentId || 'N/A',
          message: 'PayPal payment created successfully'
        }
      } else {
        const errorText = await paypalResponse.text()
        results.tests.paypal = {
          status: 'error',
          error: errorText,
          status_code: paypalResponse.status
        }
      }
    } catch (error) {
      results.tests.paypal = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 3: NowPayments (Crypto) Integration  
    console.log('Testing NowPayments crypto integration...')
    try {
      const cryptoResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nowpayments-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          ...testOrderData,
          currency: 'BTC'
        })
      })

      if (cryptoResponse.ok) {
        const cryptoData = await cryptoResponse.json()
        results.tests.nowpayments = {
          status: 'success',
          payment_url: cryptoData.invoice?.payment_url,
          payment_id: cryptoData.invoice?.payment_id || 'N/A',
          message: 'Crypto payment invoice created successfully'
        }
      } else {
        const errorText = await cryptoResponse.text()
        results.tests.nowpayments = {
          status: 'error',
          error: errorText,
          status_code: cryptoResponse.status
        }
      }
    } catch (error) {
      results.tests.nowpayments = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 4: Shipping Rates Integration
    console.log('Testing shipping rates integration...')
    try {
      const shippingResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/shipping-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          origin: {
            line1: '123 Main St',
            city: 'Toronto',
            state: 'ON',
            postal_code: 'M5V 3A8',
            country: 'CA'
          },
          destination: testOrderData.shipping_address,
          packages: [{
            weight: 500, // 500g
            length: 20,
            width: 15, 
            height: 10,
            value: 2999
          }]
        })
      })

      if (shippingResponse.ok) {
        const shippingData = await shippingResponse.json()
        results.tests.shipping = {
          status: 'success',
          rates_count: shippingData.rates?.length || 0,
          cheapest_rate: shippingData.rates?.[0]?.cost_cents || 'N/A',
          message: 'Shipping rates calculated successfully'
        }
      } else {
        const errorText = await shippingResponse.text()
        results.tests.shipping = {
          status: 'error',
          error: errorText,
          status_code: shippingResponse.status
        }
      }
    } catch (error) {
      results.tests.shipping = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 5: Email Function Integration
    console.log('Testing email send integration...')
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          to: 'test@anointarray.com',
          template: 'order_confirmation',
          data: {
            order_number: 'TEST-' + Date.now(),
            customer_name: 'Test User',
            items: testOrderData.items,
            total: '$29.99 CAD',
            shipping_address: testOrderData.shipping_address
          }
        })
      })

      if (emailResponse.ok) {
        const emailData = await emailResponse.json()
        results.tests.email = {
          status: 'success',
          message_id: emailData.id || 'N/A',
          message: 'Test email sent successfully'
        }
      } else {
        const errorText = await emailResponse.text()
        results.tests.email = {
          status: 'error',
          error: errorText,
          status_code: emailResponse.status
        }
      }
    } catch (error) {
      results.tests.email = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Test 6: Array Generator Integration
    console.log('Testing array generator integration...')
    try {
      const generatorResponse = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/generate-array`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`
        },
        body: JSON.stringify({
          user_id: 'test-user-123',
          config: {
            name: 'Test Integration Array',
            pattern_type: 'geometric',
            dimensions: { width: 400, height: 300 },
            style: {
              color_scheme: 'monochrome',
              primary_color: '#8B5CF6',
              background_color: '#000000'
            },
            complexity: 'simple'
          }
        })
      })

      if (generatorResponse.ok) {
        const generatorData = await generatorResponse.json()
        results.tests.generator = {
          status: 'success',
          array_id: generatorData.id || 'N/A',
          generation_status: generatorData.status || 'N/A',
          message: 'Array generation initiated successfully'
        }
      } else {
        const errorText = await generatorResponse.text()
        results.tests.generator = {
          status: 'error',
          error: errorText,
          status_code: generatorResponse.status
        }
      }
    } catch (error) {
      results.tests.generator = {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Calculate overall success rate
    const totalTests = Object.keys(results.tests).length
    const successfulTests = Object.values(results.tests).filter(test => test.status === 'success').length
    const successRate = totalTests > 0 ? Math.round((successfulTests / totalTests) * 100) : 0

    results.summary = {
      total_tests: totalTests,
      successful_tests: successfulTests,
      failed_tests: totalTests - successfulTests,
      success_rate: `${successRate}%`,
      overall_status: successRate >= 80 ? 'PASS' : successRate >= 50 ? 'PARTIAL' : 'FAIL'
    }

    console.log('Payment integration tests completed:', results.summary)

    return NextResponse.json(results, { status: 200 })

  } catch (error) {
    console.error('Payment integration test error:', error)
    return NextResponse.json({
      error: 'Payment integration test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Payment Integration Test Endpoint',
    usage: 'POST to this endpoint to run comprehensive payment integration tests',
    endpoints_tested: [
      'Stripe Checkout',
      'PayPal Checkout', 
      'NowPayments Crypto',
      'Shipping Rates',
      'Email Notifications',
      'Array Generator'
    ]
  })
}