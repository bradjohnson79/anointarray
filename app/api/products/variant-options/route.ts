import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products/variant-options - List all product variant options with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const product_id = searchParams.get('product_id')
    const option_name = searchParams.get('option_name')

    let query = supabase
      .from('product_variant_options')
      .select(`
        *,
        products (
          id,
          title,
          sku
        )
      `)
      .order('sort_order', { ascending: true })

    // Apply filters
    if (product_id) query = query.eq('product_id', product_id)
    if (option_name) query = query.eq('option_name', option_name)

    const { data, error } = await query

    if (error) {
      console.error('Product variant options fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product variant options', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Product variant options API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products/variant-options - Create new product variant option
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.product_id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    if (!body.option_name) {
      return NextResponse.json(
        { error: 'Option name is required' },
        { status: 400 }
      )
    }

    if (!body.option_values || !Array.isArray(body.option_values)) {
      return NextResponse.json(
        { error: 'Option values are required as an array' },
        { status: 400 }
      )
    }

    const optionData = {
      product_id: body.product_id,
      option_name: body.option_name,
      option_values: body.option_values,
      sort_order: body.sort_order || 0
    }

    const { data, error } = await supabase
      .from('product_variant_options')
      .insert(optionData)
      .select(`
        *,
        products (
          id,
          title,
          sku
        )
      `)
      .single()

    if (error) {
      console.error('Product variant option creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create product variant option', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product variant option created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Product variant option creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/variant-options - Update product variant option
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }

    // Remove id from update data
    const updateData = { ...body }
    delete updateData.id

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('product_variant_options')
      .update(updateData)
      .eq('id', body.id)
      .select(`
        *,
        products (
          id,
          title,
          sku
        )
      `)
      .single()

    if (error) {
      console.error('Product variant option update error:', error)
      return NextResponse.json(
        { error: 'Failed to update product variant option', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product variant option updated successfully'
    })

  } catch (error) {
    console.error('Product variant option update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/variant-options - Delete product variant option
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Option ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('product_variant_options')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Product variant option deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete product variant option', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product variant option deleted successfully'
    })

  } catch (error) {
    console.error('Product variant option deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}