import { NextRequest, NextResponse } from 'next/server'

// NowPayments API Endpoint
// Creates cryptocurrency invoices for ANOINT Array purchases

interface NowPaymentsInvoiceRequest {
  amount: number
  currency: string
  sealArrayId: string
  payCurrency?: string // BTC, ETH, LTC, etc.
  customerEmail?: string
  successUrl?: string
  cancelUrl?: string
}

interface NowPaymentsInvoice {
  id: string
  token_id: string
  order_id: string
  order_description: string
  price_amount: number
  price_currency: string
  pay_currency?: string
  ipn_callback_url: string
  invoice_url: string
  success_url: string
  cancel_url: string
  partially_paid_url?: string
  created_at: string
  updated_at: string
}

interface NowPaymentsPayment {
  payment_id: string
  payment_status: string
  pay_address: string
  price_amount: number
  price_currency: string
  pay_amount: number
  pay_currency: string
  order_id: string
  order_description: string
  purchase_id: string
  created_at: string
  updated_at: string
  outcome_amount: number
  outcome_currency: string
}

// Get available cryptocurrencies
async function getAvailableCurrencies(): Promise<string[]> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error('NowPayments API key not configured')
  }

  const response = await fetch('https://api.nowpayments.io/v1/currencies', {
    method: 'GET',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('NowPayments currencies request failed:', error)
    throw new Error('Failed to get available currencies')
  }

  const data = await response.json()
  return data.currencies || []
}

// Get estimated price for a cryptocurrency
async function getEstimatedPrice(fromCurrency: string, toCurrency: string, amount: number): Promise<number> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error('NowPayments API key not configured')
  }

  const response = await fetch(`https://api.nowpayments.io/v1/estimate?amount=${amount}&currency_from=${fromCurrency}&currency_to=${toCurrency}`, {
    method: 'GET',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('NowPayments estimate request failed:', error)
    throw new Error('Failed to get price estimate')
  }

  const data = await response.json()
  return data.estimated_amount
}

// Create NowPayments invoice
async function createNowPaymentsInvoice(invoiceData: NowPaymentsInvoiceRequest): Promise<NowPaymentsInvoice> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error('NowPayments API key not configured')
  }

  const defaultSuccessUrl = `${process.env.NEXT_PUBLIC_URL}/generator/success`
  const defaultCancelUrl = `${process.env.NEXT_PUBLIC_URL}/generator/cancel`

  const invoicePayload = {
    price_amount: invoiceData.amount,
    price_currency: invoiceData.currency.toLowerCase(),
    pay_currency: invoiceData.payCurrency?.toLowerCase(),
    order_id: invoiceData.sealArrayId,
    order_description: `ANOINT Array - Personalized Metaphysical Seal (${invoiceData.sealArrayId})`,
    ipn_callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/nowpayments`,
    success_url: invoiceData.successUrl || `${defaultSuccessUrl}?seal_id=${invoiceData.sealArrayId}&gateway=crypto`,
    cancel_url: invoiceData.cancelUrl || `${defaultCancelUrl}?seal_id=${invoiceData.sealArrayId}&gateway=crypto`,
    is_fee_paid_by_user: false, // We absorb the network fees
    case: 'checkout' // Invoice type
  }

  const response = await fetch('https://api.nowpayments.io/v1/invoice', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(invoicePayload)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('NowPayments invoice creation failed:', error)
    throw new Error('Failed to create cryptocurrency invoice')
  }

  const invoice = await response.json()
  console.log('NowPayments invoice created:', {
    invoiceId: invoice.id,
    sealArrayId: invoiceData.sealArrayId,
    amount: invoiceData.amount,
    currency: invoiceData.currency,
    payCurrency: invoiceData.payCurrency
  })

  return invoice
}

// Create NowPayments payment (direct payment without invoice)
async function createNowPaymentsPayment(paymentData: NowPaymentsInvoiceRequest): Promise<NowPaymentsPayment> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error('NowPayments API key not configured')
  }

  const paymentPayload = {
    price_amount: paymentData.amount,
    price_currency: paymentData.currency.toLowerCase(),
    pay_currency: paymentData.payCurrency?.toLowerCase() || 'btc',
    order_id: paymentData.sealArrayId,
    order_description: `ANOINT Array - Personalized Metaphysical Seal (${paymentData.sealArrayId})`,
    ipn_callback_url: `${process.env.NEXT_PUBLIC_URL}/api/webhooks/nowpayments`,
    is_fee_paid_by_user: false
  }

  const response = await fetch('https://api.nowpayments.io/v1/payment', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(paymentPayload)
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('NowPayments payment creation failed:', error)
    throw new Error('Failed to create cryptocurrency payment')
  }

  const payment = await response.json()
  console.log('NowPayments payment created:', {
    paymentId: payment.payment_id,
    sealArrayId: paymentData.sealArrayId,
    amount: paymentData.amount,
    payCurrency: payment.pay_currency,
    payAddress: payment.pay_address
  })

  return payment
}

// Get payment status
async function getPaymentStatus(paymentId: string): Promise<any> {
  if (!process.env.NOWPAYMENTS_API_KEY) {
    throw new Error('NowPayments API key not configured')
  }

  const response = await fetch(`https://api.nowpayments.io/v1/payment/${paymentId}`, {
    method: 'GET',
    headers: {
      'x-api-key': process.env.NOWPAYMENTS_API_KEY,
      'Content-Type': 'application/json'
    }
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('NowPayments payment status request failed:', error)
    throw new Error('Failed to get payment status')
  }

  return await response.json()
}

// POST: Create cryptocurrency invoice or payment
export async function POST(request: NextRequest) {
  try {
    const body: NowPaymentsInvoiceRequest & { type?: 'invoice' | 'payment' } = await request.json()

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

    // Get available currencies to validate payCurrency
    if (body.payCurrency) {
      try {
        const availableCurrencies = await getAvailableCurrencies()
        if (!availableCurrencies.includes(body.payCurrency.toLowerCase())) {
          return NextResponse.json({
            success: false,
            error: `Unsupported cryptocurrency: ${body.payCurrency}. Available: ${availableCurrencies.join(', ')}`
          }, { status: 400 })
        }
      } catch (error) {
        console.warn('Could not validate cryptocurrency, proceeding anyway:', error)
      }
    }

    // Create invoice or direct payment based on type
    const createInvoice = body.type !== 'payment' // Default to invoice

    if (createInvoice) {
      // Create invoice (recommended for multi-currency support)
      const invoice = await createNowPaymentsInvoice(body)

      return NextResponse.json({
        success: true,
        type: 'invoice',
        invoiceId: invoice.id,
        tokenId: invoice.token_id,
        invoiceUrl: invoice.invoice_url,
        sealArrayId: body.sealArrayId,
        amount: body.amount,
        currency: body.currency,
        payCurrency: body.payCurrency,
        successUrl: invoice.success_url,
        cancelUrl: invoice.cancel_url,
        createdAt: invoice.created_at
      })
    } else {
      // Create direct payment
      const payment = await createNowPaymentsPayment(body)

      return NextResponse.json({
        success: true,
        type: 'payment',
        paymentId: payment.payment_id,
        payAddress: payment.pay_address,
        payAmount: payment.pay_amount,
        payCurrency: payment.pay_currency,
        sealArrayId: body.sealArrayId,
        amount: body.amount,
        currency: body.currency,
        status: payment.payment_status,
        createdAt: payment.created_at
      })
    }

  } catch (error: any) {
    console.error('NowPayments request failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to create cryptocurrency payment'
    }, { status: 500 })
  }
}

// GET: Get payment status or available currencies
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('paymentId')
    const action = searchParams.get('action')

    if (action === 'currencies') {
      // Get available cryptocurrencies
      const currencies = await getAvailableCurrencies()
      return NextResponse.json({
        success: true,
        currencies
      })
    }

    if (action === 'estimate') {
      // Get price estimate
      const fromCurrency = searchParams.get('from') || 'usd'
      const toCurrency = searchParams.get('to') || 'btc'
      const amount = parseFloat(searchParams.get('amount') || '17')

      const estimatedAmount = await getEstimatedPrice(fromCurrency, toCurrency, amount)

      return NextResponse.json({
        success: true,
        estimate: {
          fromAmount: amount,
          fromCurrency: fromCurrency.toUpperCase(),
          toAmount: estimatedAmount,
          toCurrency: toCurrency.toUpperCase()
        }
      })
    }

    if (paymentId) {
      // Get payment status
      const paymentStatus = await getPaymentStatus(paymentId)
      return NextResponse.json({
        success: true,
        payment: paymentStatus
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Missing required parameters. Use ?action=currencies, ?action=estimate, or ?paymentId=xxx'
    }, { status: 400 })

  } catch (error: any) {
    console.error('NowPayments GET request failed:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to process NowPayments request'
    }, { status: 500 })
  }
}