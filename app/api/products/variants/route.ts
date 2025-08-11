import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products/variants - List all product variants with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const product_id = searchParams.get('product_id')
    const is_active = searchParams.get('is_active')
    const is_default = searchParams.get('is_default')
    const sku = searchParams.get('sku')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('product_variants')
      .select(`
        *,
        products (
          id,
          title,
          sku,
          base_price
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (product_id) query = query.eq('product_id', product_id)
    if (is_active !== null) query = query.eq('is_active', is_active === 'true')
    if (is_default !== null) query = query.eq('is_default', is_default === 'true')
    if (sku) query = query.eq('sku', sku)
    if (search) {
      query = query.or(`title.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Product variants fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product variants', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || [],
      count,
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })
  } catch (error) {
    console.error('Product variants API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products/variants - Create new product variant
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

    if (!body.option_values || typeof body.option_values !== 'object') {
      return NextResponse.json(
        { error: 'Option values are required as an object' },
        { status: 400 }
      )
    }

    // Get the base product to generate SKU
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('sku, title')
      .eq('id', body.product_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Generate SKU using the database function
    const { data: skuResult, error: skuError } = await supabase
      .rpc('generate_variant_sku', {
        base_sku: product.sku,
        option_values: body.option_values
      })

    if (skuError) {
      console.error('SKU generation error:', skuError)
      return NextResponse.json(
        { error: 'Failed to generate SKU' },
        { status: 500 }
      )
    }

    // Generate variant title from options
    const optionString = Object.entries(body.option_values)
      .map(([key, value]) => `${value}`)
      .join(' ')
    
    const variantTitle = body.title || `${product.title} - ${optionString}`

    const variantData = {
      product_id: body.product_id,
      sku: body.sku || skuResult,
      title: variantTitle,
      option_values: body.option_values,
      
      // Pricing
      price: body.price || null,
      compare_at_price: body.compare_at_price || null,
      cost_price: body.cost_price || null,
      
      // Inventory
      inventory_quantity: body.inventory_quantity || 0,
      track_inventory: body.track_inventory !== undefined ? body.track_inventory : true,
      allow_backorder: body.allow_backorder !== undefined ? body.allow_backorder : false,
      low_stock_threshold: body.low_stock_threshold || 5,
      
      // Physical properties
      weight: body.weight || null,
      dimensions: body.dimensions || null,
      
      // Settings
      is_active: body.is_active !== undefined ? body.is_active : true,
      is_default: body.is_default !== undefined ? body.is_default : false,
      sort_order: body.sort_order || 0,
      
      // Images
      images: body.images || [],
      main_image_index: body.main_image_index || 0
    }

    const { data, error } = await supabase
      .from('product_variants')
      .insert(variantData)
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
      console.error('Product variant creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create product variant', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product variant created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Product variant creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/products/variants - Update product variant
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      )
    }

    // Remove id from update data
    const updateData = { ...body }
    delete updateData.id

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString()

    const { data, error } = await supabase
      .from('product_variants')
      .update(updateData)
      .eq('id', body.id)
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

// DELETE /api/products/variants - Delete product variant
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      )
    }

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