import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET /api/products/categories - List all product categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const is_active = searchParams.get('is_active')
    const parent_id = searchParams.get('parent_id')

    let query = supabase
      .from('product_categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true })

    if (is_active !== null) {
      query = query.eq('is_active', is_active === 'true')
    }

    if (parent_id !== null) {
      if (parent_id === 'null') {
        query = query.is('parent_id', null)
      } else {
        query = query.eq('parent_id', parent_id)
      }
    }

    const { data, error } = await query

    if (error) {
      console.error('Categories fetch error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch categories', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data || []
    })
  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/products/categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Missing required field: name' },
        { status: 400 }
      )
    }

    // Generate slug if not provided
    if (!body.slug) {
      body.slug = body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
    }

    const categoryData = {
      name: body.name,
      slug: body.slug,
      description: body.description || null,
      parent_id: body.parent_id || null,
      image_url: body.image_url || null,
      is_active: body.is_active !== undefined ? body.is_active : true,
      sort_order: body.sort_order || 0,
      seo_title: body.seo_title || null,
      seo_description: body.seo_description || null
    }

    const { data, error } = await supabase
      .from('product_categories')
      .insert(categoryData)
      .select('*')
      .single()

    if (error) {
      console.error('Category creation error:', error)
      return NextResponse.json(
        { error: 'Failed to create category', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: 'Category created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Category creation API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}