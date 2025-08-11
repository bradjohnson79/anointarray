import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

interface GenerateArrayRequest {
  title: string
  description?: string
  dimensions: {
    width: number
    height: number
    dpi?: number
  }
  glyphs: Array<{
    glyph_id: string
    position_x: number
    position_y: number
    rotation?: number
    scale?: number
    opacity?: number
    fill_color?: string
    stroke_color?: string
    stroke_width?: number
  }>
  layout_config?: any
  is_public?: boolean
  tags?: string[]
}

interface GlyphData {
  id: string
  slug: string
  name: string
  image_path: string
  svg_path?: string
  dimensions: any
  colors?: any
}

async function loadGlyphs(glyphIds: string[]): Promise<Map<string, GlyphData>> {
  const { data: glyphs, error } = await supabase
    .from('glyphs')
    .select('id, slug, name, image_path, svg_path, dimensions, colors')
    .in('id', glyphIds)
    .eq('is_active', true)

  if (error) {
    throw new Error(`Failed to load glyphs: ${error.message}`)
  }

  const glyphMap = new Map<string, GlyphData>()
  for (const glyph of glyphs) {
    glyphMap.set(glyph.id, glyph)
  }

  return glyphMap
}

async function generateSVG(request: GenerateArrayRequest, glyphMap: Map<string, GlyphData>): Promise<string> {
  const { dimensions, glyphs } = request
  
  // Create SVG header
  let svg = `<svg width="${dimensions.width}" height="${dimensions.height}" viewBox="0 0 ${dimensions.width} ${dimensions.height}" xmlns="http://www.w3.org/2000/svg">\n`
  
  // Add background
  svg += `  <rect width="${dimensions.width}" height="${dimensions.height}" fill="#000000" opacity="0.1"/>\n`
  
  // Add mystical border pattern
  svg += `  <defs>\n`
  svg += `    <pattern id="mystical-border" patternUnits="userSpaceOnUse" width="20" height="20">\n`
  svg += `      <circle cx="10" cy="10" r="2" fill="#9333ea" opacity="0.3"/>\n`
  svg += `    </pattern>\n`
  svg += `    <filter id="glow">\n`
  svg += `      <feGaussianBlur stdDeviation="3" result="coloredBlur"/>\n`
  svg += `      <feMerge>\n`
  svg += `        <feMergeNode in="coloredBlur"/>\n`
  svg += `        <feMergeNode in="SourceGraphic"/>\n`
  svg += `      </feMerge>\n`
  svg += `    </filter>\n`
  svg += `  </defs>\n`
  
  // Add border
  svg += `  <rect x="10" y="10" width="${dimensions.width - 20}" height="${dimensions.height - 20}" fill="none" stroke="url(#mystical-border)" stroke-width="2"/>\n`
  
  // Sort glyphs by z_index (default 0)
  const sortedGlyphs = [...glyphs].sort((a, b) => (a.z_index || 0) - (b.z_index || 0))
  
  // Add each glyph
  for (const glyphConfig of sortedGlyphs) {
    const glyph = glyphMap.get(glyphConfig.glyph_id)
    if (!glyph) {
      console.warn(`Glyph not found: ${glyphConfig.glyph_id}`)
      continue
    }
    
    const {
      position_x,
      position_y,
      rotation = 0,
      scale = 1.0,
      opacity = 1.0,
      fill_color,
      stroke_color,
      stroke_width = 0
    } = glyphConfig
    
    // Create transform string
    const transforms = []
    transforms.push(`translate(${position_x}, ${position_y})`)
    if (rotation !== 0) transforms.push(`rotate(${rotation})`)
    if (scale !== 1.0) transforms.push(`scale(${scale})`)
    
    const transform = transforms.length > 0 ? `transform="${transforms.join(' ')}"` : ''
    
    // Add glyph group
    svg += `  <g ${transform} opacity="${opacity}" filter="url(#glow)">\n`
    
    // If we have SVG data, use it; otherwise create a placeholder
    if (glyph.svg_path) {
      // In a real implementation, we'd load the SVG content from storage
      // For now, create a symbolic representation
      svg += `    <!-- SVG content from ${glyph.svg_path} would be inserted here -->\n`
      svg += `    <circle cx="0" cy="0" r="25" fill="${fill_color || '#9333ea'}" stroke="${stroke_color || 'none'}" stroke-width="${stroke_width}"/>\n`
      svg += `    <text x="0" y="5" text-anchor="middle" fill="white" font-size="10" font-family="serif">${glyph.name.charAt(0)}</text>\n`
    } else {
      // Create a placeholder glyph
      const glyphSize = 50 * scale
      svg += `    <rect x="${-glyphSize/2}" y="${-glyphSize/2}" width="${glyphSize}" height="${glyphSize}" fill="${fill_color || '#9333ea'}" stroke="${stroke_color || 'none'}" stroke-width="${stroke_width}" rx="5"/>\n`
      svg += `    <text x="0" y="5" text-anchor="middle" fill="white" font-size="${12 * scale}" font-family="serif">${glyph.name.slice(0, 3)}</text>\n`
    }
    
    svg += `  </g>\n`
  }
  
  // Add mystical center point
  svg += `  <circle cx="${dimensions.width/2}" cy="${dimensions.height/2}" r="3" fill="#9333ea" opacity="0.8"/>\n`
  
  // Close SVG
  svg += `</svg>`
  
  return svg
}

async function generatePNG(svgContent: string, dimensions: any): Promise<Uint8Array> {
  // In a real implementation, this would use a library like Puppeteer or similar
  // to convert SVG to PNG. For now, we'll create a simple implementation.
  
  // This is a placeholder - in production you'd use something like:
  // - Deno's canvas API
  // - Puppeteer for headless browser rendering
  // - ImageMagick bindings
  // - A dedicated image generation service
  
  throw new Error('PNG generation not implemented - SVG-only for now')
}

async function saveToBucket(userId: string, arrayId: string, svgContent: string, dimensions: any): Promise<{ svg_url: string, png_url?: string }> {
  const timestamp = Date.now()
  const svgFileName = `${userId}/array-${arrayId}-${timestamp}.svg`
  
  // Save SVG to storage bucket
  const { error: svgError } = await supabase.storage
    .from('arrays')
    .upload(svgFileName, svgContent, {
      contentType: 'image/svg+xml',
      upsert: false
    })
  
  if (svgError) {
    throw new Error(`Failed to save SVG: ${svgError.message}`)
  }
  
  const { data: { publicUrl: svgUrl } } = supabase.storage
    .from('arrays')
    .getPublicUrl(svgFileName)
  
  return {
    svg_url: svgUrl,
    // PNG URL would be added when PNG generation is implemented
  }
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the JWT from the Authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 })
    }

    // Verify the JWT and get user
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response('Invalid token', { status: 401 })
    }

    const startTime = Date.now()
    const request: GenerateArrayRequest = await req.json()

    // Validate request
    if (!request.title || !request.dimensions || !request.glyphs || request.glyphs.length === 0) {
      return new Response('Missing required fields: title, dimensions, glyphs', { status: 400 })
    }

    // Validate dimensions
    const { width, height } = request.dimensions
    if (width < 100 || width > 4000 || height < 100 || height > 4000) {
      return new Response('Invalid dimensions: width and height must be between 100 and 4000 pixels', { 
        status: 400 
      })
    }

    // Limit number of glyphs
    if (request.glyphs.length > 50) {
      return new Response('Too many glyphs: maximum 50 allowed', { status: 400 })
    }

    // Create the array record first
    const { data: array, error: arrayError } = await supabase
      .from('arrays')
      .insert({
        user_id: user.id,
        title: request.title,
        description: request.description,
        array_type: 'custom',
        dimensions: request.dimensions,
        glyph_count: request.glyphs.length,
        layout_config: request.layout_config || {},
        status: 'generating',
        is_public: request.is_public || false,
        tags: request.tags || []
      })
      .select()
      .single()

    if (arrayError) {
      throw new Error(`Failed to create array record: ${arrayError.message}`)
    }

    try {
      // Load glyph data
      const glyphIds = request.glyphs.map(g => g.glyph_id)
      const glyphMap = await loadGlyphs(glyphIds)
      
      // Validate all glyphs exist
      const missingGlyphs = glyphIds.filter(id => !glyphMap.has(id))
      if (missingGlyphs.length > 0) {
        throw new Error(`Glyphs not found: ${missingGlyphs.join(', ')}`)
      }

      // Generate SVG
      const svgContent = await generateSVG(request, glyphMap)
      
      // Save to storage
      const urls = await saveToBucket(user.id, array.id, svgContent, request.dimensions)
      
      // Create glyph placement records
      for (let i = 0; i < request.glyphs.length; i++) {
        const glyphConfig = request.glyphs[i]
        await supabase
          .from('array_glyphs')
          .insert({
            array_id: array.id,
            glyph_id: glyphConfig.glyph_id,
            position_x: glyphConfig.position_x,
            position_y: glyphConfig.position_y,
            rotation: glyphConfig.rotation || 0,
            scale: glyphConfig.scale || 1.0,
            opacity: glyphConfig.opacity || 1.0,
            fill_color: glyphConfig.fill_color,
            stroke_color: glyphConfig.stroke_color,
            stroke_width: glyphConfig.stroke_width || 0,
            z_index: i
          })
      }

      const generationTime = Date.now() - startTime

      // Update array with completion details
      const { data: finalArray, error: updateError } = await supabase
        .from('arrays')
        .update({
          status: 'completed',
          svg_url: urls.svg_url,
          png_url: urls.png_url,
          file_size_bytes: svgContent.length,
          generation_time_ms: generationTime,
          completed_at: new Date().toISOString()
        })
        .eq('id', array.id)
        .select()
        .single()

      if (updateError) {
        console.error('Failed to update array:', updateError)
      }

      // Log successful generation
      await supabase.rpc('log_event', {
        level_param: 'info',
        category_param: 'array_generation',
        message_param: `Array generated successfully: ${request.title}`,
        user_id_param: user.id,
        metadata_param: {
          array_id: array.id,
          glyph_count: request.glyphs.length,
          dimensions: request.dimensions,
          generation_time_ms: generationTime
        }
      }).catch(() => {})

      return new Response(
        JSON.stringify({
          success: true,
          array: finalArray || array,
          generation_time_ms: generationTime,
          urls
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      )

    } catch (generationError) {
      // Mark array as failed
      await supabase
        .from('arrays')
        .update({
          status: 'failed'
        })
        .eq('id', array.id)

      throw generationError
    }

  } catch (error) {
    console.error('Array generation error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'array_generation',
      message_param: `Array generation failed: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to generate array',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})