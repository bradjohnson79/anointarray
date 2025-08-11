import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products - List all products with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const category_id = searchParams.get('category_id')
    const status = searchParams.get('status')
    const product_type = searchParams.get('product_type')
    const is_featured = searchParams.get('is_featured')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('products')
      .select(`
        *,
        product_categories (
          id,
          name,
          slug
        )
      `)
      .order('created_at', { ascending: false })

    // Apply filters
    if (category_id) query = query.eq('category_id', category_id)
    if (status) query = query.eq('status', status)
    if (product_type) query = query.eq('product_type', product_type)
    if (is_featured !== null) query = query.eq('is_featured', is_featured === 'true')
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
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
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create new product
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.title || !body.sku || !body.price) {
      return NextResponse.json(
        { error: 'Missing required fields: title, sku, price' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    if (!body.slug) {
      body.slug = body.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    // Set defaults
    const productData = {
      title: body.title,
      sku: body.sku,
      slug: body.slug,
      description: body.description || '',
      short_description: body.short_description || '',
      price: parseFloat(body.price),
      compare_at_price: body.compare_at_price ? parseFloat(body.compare_at_price) : null,
      cost_price: body.cost_price ? parseFloat(body.cost_price) : null,
      category_id: body.category_id || null,
      keywords: body.keywords || [],
      product_type: body.product_type || 'digital',
      images: body.images || [],
      main_image_index: body.main_image_index || 0,
      
      // Digital product fields
      digital_file_url: body.digital_file_url || null,
      file_size: body.file_size || null,
      download_limit: body.download_limit || -1,
      license_type: body.license_type || null,
      
      // Physical product fields
      weight: body.weight ? parseFloat(body.weight) : null,
      dimensions: body.dimensions || null,
      inventory_quantity: parseInt(body.inventory_quantity) || 0,
      track_inventory: body.track_inventory !== undefined ? body.track_inventory : true,
      allow_backorder: body.allow_backorder || false,
      low_stock_threshold: parseInt(body.low_stock_threshold) || 5,
      
      // Settings
      requires_shipping: body.requires_shipping !== undefined ? body.requires_shipping : (body.product_type === 'physical'),
      is_taxable: body.is_taxable !== undefined ? body.is_taxable : true,
      is_visible: body.is_visible !== undefined ? body.is_visible : true,
      is_featured: body.is_featured || false,
      status: body.status || 'draft',
      
      // SEO
      meta_title: body.meta_title || null,
      meta_description: body.meta_description || null,
      meta_keywords: body.meta_keywords || null
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select('*')
      .single()

    if (error) {
      console.error('Product creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Product created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Product creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}