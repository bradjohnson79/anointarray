import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/taxes/rates - Get all tax rates
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const is_active = searchParams.get('is_active')
    const province_code = searchParams.get('province_code')

    let query = supabase
      .from('tax_rates')
      .select('*')
      .order('province_name', { ascending: true })

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    if (province_code) {
      query = query.eq('province_code', province_code.toUpperCase())
    }

    const { data, error } = await query

    if (error) {
      console.error('Tax rates fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tax rates', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Tax rates API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/taxes/rates - Update tax rate (admin only)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.id || !body.province_code) {
      return NextResponse.json(
        { error: 'ID and province_code are required' },
        { status: 400 }
      )
    }

    // Validate tax rates are within reasonable bounds
    const rates = ['gst_rate', 'hst_rate', 'pst_rate', 'qst_rate']
    for (const rate of rates) {
      if (body[rate] !== undefined) {
        const value = parseFloat(body[rate])
        if (value < 0 || value > 1) {
          return NextResponse.json(
            { error: `${rate} must be between 0 and 1 (e.g., 0.13 for 13%)` },
            { status: 400 }
          )
        }
        body[rate] = value
      }
    }

    // Update timestamp
    body.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('tax_rates')
      .update(body)
      .eq('id', body.id)
      .select('*')
      .single()

    if (error) {
      console.error('Tax rate update error:', error)
      return NextResponse.json(
        { error: 'Failed to update tax rate', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Tax rate updated successfully'
    })

  } catch (error) {
    console.error('Tax rate update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}