import { NextResponse } from 'next/server'

interface CartItem {
  productId: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface PaymentRequest {
  paymentMethod: 'stripe' | 'paypal' | 'nowpayments'
  cartItems: CartItem[]
  sealArrayImage: string
  customerInfo: {
    email: string
    name: string
    address?: {
      line1: string
      city: string
      state: string
      postal_code: string
      country: string
    }
  }
  totalAmount: number
}

// Stripe Integration
async function processStripePayment(paymentData: PaymentRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe not configured')
    }

    // In a real implementation, you would:
    // 1. Create a Stripe Checkout Session
    // 2. Include custom metadata for the seal array
    // 3. Handle webhooks for order completion
    
    const checkoutData = {
      mode: 'payment',
      line_items: paymentData.cartItems.map(item => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: `Custom Merchandise - ${item.productId}`,
            metadata: {
              product_id: item.productId,
              size: item.selectedSize || '',
              color: item.selectedColor || '',
              seal_array_ref: 'user_upload'
            }
          },
          unit_amount: Math.round(paymentData.totalAmount * 100 / paymentData.cartItems.reduce((sum, item) => sum + item.quantity, 0))
        },
        quantity: item.quantity
      })),
      customer_email: paymentData.customerInfo.email,
      success_url: `${process.env.NEXTAUTH_URL}/merchandise/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXTAUTH_URL}/merchandise/cancel`,
      metadata: {
        seal_array_image: paymentData.sealArrayImage,
        customer_name: paymentData.customerInfo.name
      }
    }

    return {
      success: true,
      checkout_url: 'https://checkout.stripe.com/placeholder', // Would be real Stripe URL
      session_id: 'stripe_' + Date.now(),
      provider: 'stripe'
    }
    
  } catch (error) {
    return {
      success: false,
      error: 'Stripe payment processing failed'
    }
  }
}

// PayPal Integration
async function processPayPalPayment(paymentData: PaymentRequest) {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      throw new Error('PayPal not configured')
    }

    // In a real implementation, you would:
    // 1. Create a PayPal order
    // 2. Include custom metadata
    // 3. Handle IPN webhooks
    
    const orderData = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: paymentData.totalAmount.toFixed(2)
        },
        description: `Custom ANOINT merchandise order`,
        custom_id: 'anoint_' + Date.now(),
        items: paymentData.cartItems.map(item => ({
          name: `Custom ${item.productId}`,
          unit_amount: {
            currency_code: 'USD',
            value: Math.round(paymentData.totalAmount / paymentData.cartItems.reduce((sum, item) => sum + item.quantity, 0) * 100) / 100
          },
          quantity: item.quantity.toString()
        }))
      }],
      application_context: {
        return_url: `${process.env.NEXTAUTH_URL}/merchandise/success`,
        cancel_url: `${process.env.NEXTAUTH_URL}/merchandise/cancel`,
        shipping_preference: 'SET_PROVIDED_ADDRESS'
      }
    }

    return {
      success: true,
      checkout_url: 'https://www.paypal.com/checkoutnow?placeholder', // Would be real PayPal URL
      order_id: 'paypal_' + Date.now(),
      provider: 'paypal'
    }
    
  } catch (error) {
    return {
      success: false,
      error: 'PayPal payment processing failed'
    }
  }
}

// NowPayments (Cryptocurrency) Integration
async function processNowPayment(paymentData: PaymentRequest) {
  try {
    if (!process.env.NOWPAYMENTS_API_KEY) {
      throw new Error('NowPayments not configured')
    }

    // In a real implementation, you would:
    // 1. Create a NowPayments invoice
    // 2. Specify accepted cryptocurrencies
    // 3. Handle payment confirmations
    
    const invoiceData = {
      price_amount: paymentData.totalAmount,
      price_currency: 'USD',
      pay_currency: 'btc', // Default to Bitcoin, could be user selectable
      order_id: 'anoint_crypto_' + Date.now(),
      order_description: `ANOINT Custom Merchandise Order`,
      success_url: `${process.env.NEXTAUTH_URL}/merchandise/success`,
      cancel_url: `${process.env.NEXTAUTH_URL}/merchandise/cancel`,
      customer_email: paymentData.customerInfo.email
    }

    return {
      success: true,
      checkout_url: 'https://nowpayments.io/payment/placeholder', // Would be real NowPayments URL
      invoice_id: 'crypto_' + Date.now(),
      provider: 'nowpayments',
      currencies: ['BTC', 'ETH', 'USDT', 'LTC'] // Available cryptocurrencies
    }
    
  } catch (error) {
    return {
      success: false,
      error: 'Cryptocurrency payment processing failed'
    }
  }
}

export async function POST(request: Request) {
  try {
    let paymentData: PaymentRequest
    
    try {
      paymentData = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!paymentData.paymentMethod) {
      return NextResponse.json(
        { success: false, error: 'Payment method is required' },
        { status: 400 }
      )
    }

    if (!paymentData.cartItems || paymentData.cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Cart is empty' },
        { status: 400 }
      )
    }

    if (!paymentData.customerInfo?.email) {
      return NextResponse.json(
        { success: false, error: 'Customer email is required' },
        { status: 400 }
      )
    }

    if (!paymentData.totalAmount || paymentData.totalAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid total amount' },
        { status: 400 }
      )
    }

    // Process payment based on method
    let paymentResult
    switch (paymentData.paymentMethod) {
      case 'stripe':
        paymentResult = await processStripePayment(paymentData)
        break
      case 'paypal':
        paymentResult = await processPayPalPayment(paymentData)
        break
      case 'nowpayments':
        paymentResult = await processNowPayment(paymentData)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Unsupported payment method' },
          { status: 400 }
        )
    }

    if (!paymentResult.success) {
      return NextResponse.json(
        { success: false, error: paymentResult.error },
        { status: 500 }
      )
    }

    // In a real implementation, save order to database here
    const orderReference = `ANOINT-${Date.now()}-${paymentData.paymentMethod.toUpperCase()}`

    // Send order confirmation email
    try {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || ''}/api/merchandise/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type: 'order_confirmation',
          customerEmail: paymentData.customerInfo.email,
          customerName: paymentData.customerInfo.name,
          orderReference,
          cartItems: paymentData.cartItems,
          totalAmount: paymentData.totalAmount,
          paymentMethod: paymentData.paymentMethod,
          sealArrayImage: paymentData.sealArrayImage
        })
      })

      const emailResult = await emailResponse.json()
      if (!emailResult.success) {
        console.warn('Failed to send confirmation email:', emailResult.error)
      }
    } catch (emailError) {
      console.warn('Email sending failed:', emailError)
      // Don't fail the payment if email fails
    }

    return NextResponse.json({
      success: true,
      ...paymentResult,
      orderReference,
      message: `${paymentData.paymentMethod.toUpperCase()} payment initiated successfully`,
      emailSent: true // Indicate that email was attempted
    })

  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { success: false, error: 'Payment processing failed' },
      { status: 500 }
    )
  }
}