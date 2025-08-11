import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

interface TaxCalculationRequest {
  amount: number
  province_code: string
  is_tax_inclusive?: boolean
  product_type?: 'physical' | 'digital'
}

interface TaxBreakdown {
  gst: { rate: number; amount: number }
  hst: { rate: number; amount: number }
  pst: { rate: number; amount: number }
  qst: { rate: number; amount: number }
}

interface TaxCalculationResult {
  province_code: string
  province_name: string
  tax_type: string
  base_amount: number
  tax_breakdown: TaxBreakdown
  total_tax: number
  total_amount: number
  effective_rate: number
}

// POST /api/taxes/calculate - Calculate Canadian taxes
export async function POST(request: NextRequest) {
  try {
    const body: TaxCalculationRequest = await request.json()

    // Validate required fields
    if (!body.amount || !body.province_code) {
      return NextResponse.json(
        { error: 'Amount and province_code are required' },
        { status: 400 }
      )
    }

    if (body.amount < 0) {
      return NextResponse.json(
        { error: 'Amount must be positive' },
        { status: 400 }
      )
    }

    // Get tax rate for the province
    const { data: taxRate, error: taxError } = await supabase
      .from('tax_rates')
      .select('*')
      .eq('province_code', body.province_code.toUpperCase())
      .eq('is_active', true)
      .single()

    if (taxError || !taxRate) {
      return NextResponse.json(
        { error: 'Invalid province code or tax rate not found' },
        { status: 400 }
      )
    }

    const amount = parseFloat(body.amount.toString())
    const isInclusive = body.is_tax_inclusive || false
    
    let baseAmount = amount
    let gstAmount = 0
    let hstAmount = 0
    let pstAmount = 0
    let qstAmount = 0

    // Calculate tax based on tax type and whether amount is inclusive/exclusive
    switch (taxRate.tax_type) {
      case 'GST_ONLY':
        if (isInclusive) {
          baseAmount = amount / (1 + taxRate.gst_rate)
          gstAmount = baseAmount * taxRate.gst_rate
        } else {
          gstAmount = amount * taxRate.gst_rate
        }
        break

      case 'HST':
        if (isInclusive) {
          baseAmount = amount / (1 + taxRate.hst_rate)
          hstAmount = baseAmount * taxRate.hst_rate
        } else {
          hstAmount = amount * taxRate.hst_rate
        }
        break

      case 'GST_PST':
        if (isInclusive) {
          const totalRate = taxRate.gst_rate + taxRate.pst_rate
          baseAmount = amount / (1 + totalRate)
          gstAmount = baseAmount * taxRate.gst_rate
          pstAmount = baseAmount * taxRate.pst_rate
        } else {
          gstAmount = amount * taxRate.gst_rate
          pstAmount = amount * taxRate.pst_rate
        }
        break

      case 'GST_QST':
        // Quebec: QST is calculated on GST-inclusive amount
        if (isInclusive) {
          const totalRate = taxRate.gst_rate + taxRate.qst_rate * (1 + taxRate.gst_rate)
          baseAmount = amount / (1 + totalRate)
          gstAmount = baseAmount * taxRate.gst_rate
          qstAmount = (baseAmount + gstAmount) * taxRate.qst_rate
        } else {
          gstAmount = amount * taxRate.gst_rate
          qstAmount = (amount + gstAmount) * taxRate.qst_rate
        }
        break

      default:
        return NextResponse.json(
          { error: 'Unsupported tax type' },
          { status: 400 }
        )
    }

    const totalTax = gstAmount + hstAmount + pstAmount + qstAmount
    const totalAmount = isInclusive ? amount : baseAmount + totalTax
    const effectiveRate = baseAmount > 0 ? totalTax / baseAmount : 0

    const result: TaxCalculationResult = {
      province_code: taxRate.province_code,
      province_name: taxRate.province_name,
      tax_type: taxRate.tax_type,
      base_amount: Math.round(baseAmount * 100) / 100,
      tax_breakdown: {
        gst: {
          rate: taxRate.gst_rate,
          amount: Math.round(gstAmount * 100) / 100
        },
        hst: {
          rate: taxRate.hst_rate,
          amount: Math.round(hstAmount * 100) / 100
        },
        pst: {
          rate: taxRate.pst_rate,
          amount: Math.round(pstAmount * 100) / 100
        },
        qst: {
          rate: taxRate.qst_rate,
          amount: Math.round(qstAmount * 100) / 100
        }
      },
      total_tax: Math.round(totalTax * 100) / 100,
      total_amount: Math.round(totalAmount * 100) / 100,
      effective_rate: Math.round(effectiveRate * 10000) / 10000
    }

    return NextResponse.json({
      success: true,
      data: result
    })

  } catch (error) {
    console.error('Tax calculation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET /api/taxes/calculate - Get tax calculation (for query params)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const amount = searchParams.get('amount')
    const province_code = searchParams.get('province_code')
    const is_tax_inclusive = searchParams.get('is_tax_inclusive') === 'true'

    if (!amount || !province_code) {
      return NextResponse.json(
        { error: 'Amount and province_code are required' },
        { status: 400 }
      )
    }

    // Convert to POST body format and reuse POST logic
    const body = {
      amount: parseFloat(amount),
      province_code,
      is_tax_inclusive
    }

    // Create a new request with the body
    const postRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })

    return await POST(postRequest)

  } catch (error) {
    console.error('Tax calculation GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}