// Payment Processing Integration for Multiple Gateways

export interface PaymentMethod {
  id: string
  type: 'stripe' | 'paypal' | 'nowpayments'
  name: string
  description: string
  icon: string
  fees: number // Percentage fee
  processingTime: string
  supportedCurrencies: string[]
}

export interface OrderData {
  orderId: string
  items: Array<{
    productId: string
    title: string
    quantity: number
    price: number
    productType: 'physical' | 'digital'
  }>
  subtotal: number
  shipping: number
  taxes: {
    hst: number
    gst: number
    pst: number
    total: number
  }
  total: number
  currency: string
  customer: {
    email: string
    name: string
    phone?: string
  }
  shippingAddress?: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    province: string
    postalCode: string
    country: string
    phone?: string
  }
  billingAddress?: {
    name: string
    company?: string
    address1: string
    address2?: string
    city: string
    province: string
    postalCode: string
    country: string
    phone?: string
  }
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  transactionId?: string
  status: 'pending' | 'completed' | 'failed' | 'requires_action'
  message: string
  redirectUrl?: string
  clientSecret?: string
  error?: string
}

export interface CryptoPaymentDetails {
  currency: string
  address: string
  amount: string
  qrCode: string
  expiresAt: string
  confirmations: number
  requiredConfirmations: number
  network: string
}

// Available payment methods
export const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'stripe',
    type: 'stripe',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard, American Express',
    icon: '💳',
    fees: 2.9,
    processingTime: 'Instant',
    supportedCurrencies: ['CAD', 'USD']
  },
  {
    id: 'paypal',
    type: 'paypal',
    name: 'PayPal',
    description: 'Pay with your PayPal account',
    icon: '🅿️',
    fees: 3.49,
    processingTime: 'Instant',
    supportedCurrencies: ['CAD', 'USD']
  },
  {
    id: 'nowpayments-btc',
    type: 'nowpayments',
    name: 'Bitcoin (BTC)',
    description: 'Pay with Bitcoin cryptocurrency',
    icon: '₿',
    fees: 0.5,
    processingTime: '10-60 minutes',
    supportedCurrencies: ['BTC']
  },
  {
    id: 'nowpayments-eth',
    type: 'nowpayments',
    name: 'Ethereum (ETH)',
    description: 'Pay with Ethereum cryptocurrency',
    icon: 'Ξ',
    fees: 0.5,
    processingTime: '5-15 minutes',
    supportedCurrencies: ['ETH']
  },
  {
    id: 'nowpayments-ltc',
    type: 'nowpayments',
    name: 'Litecoin (LTC)',
    description: 'Pay with Litecoin cryptocurrency',
    icon: 'Ł',
    fees: 0.5,
    processingTime: '5-30 minutes',
    supportedCurrencies: ['LTC']
  }
]

// Stripe Integration
export async function processStripePayment(
  orderData: OrderData,
  paymentMethodId: string
): Promise<PaymentResult> {
  try {
    // In production, this would call Stripe's API
    const response = await fetch('/api/payments/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(orderData.total * 100), // Convert to cents
        currency: orderData.currency.toLowerCase(),
        payment_method: paymentMethodId,
        customer_email: orderData.customer.email,
        order_id: orderData.orderId,
        metadata: {
          orderId: orderData.orderId,
          customerName: orderData.customer.name,
          items: JSON.stringify(orderData.items.map(item => ({
            title: item.title,
            quantity: item.quantity,
            price: item.price
          })))
        }
      })
    })

    const result = await response.json()

    if (result.success) {
      return {
        success: true,
        paymentId: result.payment_intent_id,
        transactionId: result.transaction_id,
        status: result.status,
        message: 'Payment processed successfully',
        clientSecret: result.client_secret
      }
    } else {
      return {
        success: false,
        status: 'failed',
        message: result.error || 'Payment failed',
        error: result.error
      }
    }
  } catch (error) {
    console.error('Stripe payment error:', error)
    return {
      success: false,
      status: 'failed',
      message: 'Payment processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// PayPal Integration
export async function processPayPalPayment(orderData: OrderData): Promise<PaymentResult> {
  try {
    // In production, this would call PayPal's API
    const response = await fetch('/api/payments/paypal', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          reference_id: orderData.orderId,
          amount: {
            currency_code: orderData.currency,
            value: orderData.total.toFixed(2),
            breakdown: {
              item_total: {
                currency_code: orderData.currency,
                value: orderData.subtotal.toFixed(2)
              },
              shipping: {
                currency_code: orderData.currency,
                value: orderData.shipping.toFixed(2)
              },
              tax_total: {
                currency_code: orderData.currency,
                value: orderData.taxes.total.toFixed(2)
              }
            }
          },
          items: orderData.items.map(item => ({
            name: item.title,
            unit_amount: {
              currency_code: orderData.currency,
              value: item.price.toFixed(2)
            },
            quantity: item.quantity.toString()
          })),
          shipping: orderData.shippingAddress ? {
            name: {
              full_name: orderData.shippingAddress.name
            },
            address: {
              address_line_1: orderData.shippingAddress.address1,
              address_line_2: orderData.shippingAddress.address2,
              admin_area_2: orderData.shippingAddress.city,
              admin_area_1: orderData.shippingAddress.province,
              postal_code: orderData.shippingAddress.postalCode,
              country_code: orderData.shippingAddress.country
            }
          } : undefined
        }],
        application_context: {
          return_url: `${window.location.origin}/checkout/success`,
          cancel_url: `${window.location.origin}/checkout/cancel`
        }
      })
    })

    const result = await response.json()

    if (result.success) {
      return {
        success: true,
        paymentId: result.order_id,
        status: 'pending',
        message: 'Redirecting to PayPal...',
        redirectUrl: result.approval_url
      }
    } else {
      return {
        success: false,
        status: 'failed',
        message: result.error || 'PayPal payment failed',
        error: result.error
      }
    }
  } catch (error) {
    console.error('PayPal payment error:', error)
    return {
      success: false,
      status: 'failed',
      message: 'PayPal processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// NOWPayments (Cryptocurrency) Integration
export async function processNOWPayment(
  orderData: OrderData,
  cryptoCurrency: string
): Promise<PaymentResult & { cryptoDetails?: CryptoPaymentDetails }> {
  try {
    // In production, this would call NOWPayments API
    const response = await fetch('/api/payments/nowpayments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        price_amount: orderData.total,
        price_currency: orderData.currency,
        pay_currency: cryptoCurrency,
        order_id: orderData.orderId,
        order_description: `ANOINT Array Order ${orderData.orderId}`,
        customer_email: orderData.customer.email,
        success_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout/cancel`
      })
    })

    const result = await response.json()

    if (result.success) {
      return {
        success: true,
        paymentId: result.payment_id,
        status: 'pending',
        message: 'Cryptocurrency payment created',
        cryptoDetails: {
          currency: result.pay_currency,
          address: result.pay_address,
          amount: result.pay_amount,
          qrCode: result.qr_code_url,
          expiresAt: result.expires_at,
          confirmations: 0,
          requiredConfirmations: result.required_confirmations || 1,
          network: result.network
        }
      }
    } else {
      return {
        success: false,
        status: 'failed',
        message: result.error || 'Cryptocurrency payment failed',
        error: result.error
      }
    }
  } catch (error) {
    console.error('NOWPayments error:', error)
    return {
      success: false,
      status: 'failed',
      message: 'Cryptocurrency payment processing error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

// Payment status checking
export async function checkPaymentStatus(
  paymentId: string,
  paymentType: 'stripe' | 'paypal' | 'nowpayments'
): Promise<{
  status: 'pending' | 'completed' | 'failed' | 'expired'
  transactionId?: string
  confirmations?: number
  requiredConfirmations?: number
}> {
  try {
    const response = await fetch(`/api/payments/${paymentType}/status/${paymentId}`)
    const result = await response.json()
    
    return {
      status: result.status,
      transactionId: result.transaction_id,
      confirmations: result.confirmations,
      requiredConfirmations: result.required_confirmations
    }
  } catch (error) {
    console.error('Payment status check error:', error)
    return { status: 'failed' }
  }
}

// Calculate processing fees
export function calculateProcessingFee(amount: number, paymentMethod: PaymentMethod): number {
  const fee = (amount * paymentMethod.fees) / 100
  return Math.round(fee * 100) / 100
}

// Generate order ID
export function generateOrderId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8).toUpperCase()
  return `AA-${timestamp}-${random}`
}

// Validate payment method selection
export function validatePaymentMethod(
  paymentMethodId: string,
  orderTotal: number,
  hasPhysicalItems: boolean
): { valid: boolean; message?: string } {
  const method = PAYMENT_METHODS.find(m => m.id === paymentMethodId)
  
  if (!method) {
    return { valid: false, message: 'Invalid payment method selected' }
  }

  // Minimum order amounts for crypto
  if (method.type === 'nowpayments' && orderTotal < 10) {
    return { valid: false, message: 'Minimum $10 CAD required for cryptocurrency payments' }
  }

  // Physical items restrictions (if any)
  if (hasPhysicalItems && method.type === 'nowpayments') {
    // No restrictions for crypto with physical items currently
  }

  return { valid: true }
}

// Format crypto amount display
export function formatCryptoAmount(amount: string, currency: string): string {
  const num = parseFloat(amount)
  
  switch (currency.toUpperCase()) {
    case 'BTC':
      return `${num.toFixed(8)} BTC`
    case 'ETH':
      return `${num.toFixed(6)} ETH`
    case 'LTC':
      return `${num.toFixed(6)} LTC`
    default:
      return `${num.toFixed(8)} ${currency.toUpperCase()}`
  }
}

// Get crypto network fee estimates (mock data)
export function getCryptoNetworkFees(): Record<string, { fast: number; standard: number; slow: number }> {
  return {
    BTC: { fast: 0.0005, standard: 0.0003, slow: 0.0001 },
    ETH: { fast: 0.005, standard: 0.003, slow: 0.001 },
    LTC: { fast: 0.001, standard: 0.0005, slow: 0.0002 }
  }
}