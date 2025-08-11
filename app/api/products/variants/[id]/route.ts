import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products/variants/[id] - Get single product variant
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        products (
          id,
          title,
          sku,
          base_price,
          description,
          images
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      console.error('Product variant fetch error:', error)
      return NextResponse.json(
        { error: 'Product variant not found', details: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Product variant API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/variants/[id] - Update single product variant
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()

    // Add updated timestamp
    const updateData = {
      ...body,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        products (
          id,
          title,
          sku,
          base_price
        )
      `)
      .single()

    if (error) {
      console.error('Product variant update error:', error)
      return NextResponse.json(
        { error: 'Failed to update product variant', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product variant updated successfully'
    })

  } catch (error) {
    console.error('Product variant update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/variants/[id] - Delete single product variant
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const { error } = await supabase
      .from('product_variants')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Product variant deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete product variant', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product variant deleted successfully'
    })

  } catch (error) {
    console.error('Product variant deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}