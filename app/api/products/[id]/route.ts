import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products/[id] - Get single product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          slug
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Product fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data
    })
  } catch (error) {
    console.error('Product API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()

    // Remove readonly fields
    const { id, created_at, updated_at, ...updateData } = body

    // Process the update data
    if (updateData.price) updateData.price = parseFloat(updateData.price)
    if (updateData.compare_at_price) updateData.compare_at_price = parseFloat(updateData.compare_at_price)
    if (updateData.cost_price) updateData.cost_price = parseFloat(updateData.cost_price)
    if (updateData.weight) updateData.weight = parseFloat(updateData.weight)
    if (updateData.inventory_quantity !== undefined) updateData.inventory_quantity = parseInt(updateData.inventory_quantity)
    if (updateData.low_stock_threshold !== undefined) updateData.low_stock_threshold = parseInt(updateData.low_stock_threshold)
    if (updateData.download_limit !== undefined) updateData.download_limit = parseInt(updateData.download_limit)

    // Update timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Product update error:', error)
      return NextResponse.json(
        { error: 'Failed to update product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product updated successfully'
    })

  } catch (error) {
    console.error('Product update API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/products/[id] - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if product has any orders (prevent deletion if it has orders)
    const { data: orders, error: ordersError } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', params.id)
      .limit(1)

    if (ordersError) {
      console.error('Orders check error:', ordersError)
      return NextResponse.json(
        { error: 'Failed to check product dependencies' },
        { status: 500 }
      )
    }

    if (orders && orders.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete product that has associated orders',
          suggestion: 'Consider archiving the product instead'
        },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', params.id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Product not found' },
          { status: 404 }
        )
      }
      console.error('Product deletion error:', error)
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully'
    })

  } catch (error) {
    console.error('Product deletion API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}