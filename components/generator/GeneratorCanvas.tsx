'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Download, 
  CreditCard, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Eye,
  Lock,
  AlertTriangle
} from 'lucide-react'

interface GenerationOutput {
  ring1: Array<{
    number: number
    color: string
    position: string
    angle: number
    x: number
    y: number
  }>
  ring2: Array<{
    glyph: string
    color: string
    position: string
    angle: number
    x: number
    y: number
  }>
  ring3: {
    text: string
    language: string
    repetitions: number
  }
  metadata: {
    generated: Date
    template: string
    category: string
    sealType: string
  }
}

interface GeneratorCanvasProps {
  data: GenerationOutput
  isPurchased: boolean
  onPaymentClick: () => void
  onImageGenerated?: (imageDataUrl: string) => void
}

// Color mapping from CSV names to hex values
const COLOR_MAP: { [key: string]: string } = {
  'WHITE': '#FFFFFF',
  'RED': '#FF0000',
  'ORANGE': '#FFA500',
  'YELLOW': '#FFFF00',
  'GREEN': '#00FF00',
  'AQUA': '#00FFFF',
  'BLUE': '#0000FF',
  'INDIGO': '#4B0082',
  'PURPLE': '#800080',
  'VIOLET': '#8A2BE2',
  'GOLD': '#FFD700',
  'SILVER': '#C0C0C0',
  'GRAY': '#808080'
}

export default function GeneratorCanvas({ 
  data, 
  isPurchased, 
  onPaymentClick,
  onImageGenerated
}: GeneratorCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [zoom, setZoom] = useState(0.5) // Start at 50% to fit in container
  const [imageCache, setImageCache] = useState<Map<string, HTMLImageElement>>(new Map())
  const [isMounted, setIsMounted] = useState(false)

  // Ensure component only renders on client
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Load and cache images
  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = src
    })
  }

  // Preload all required images with better error handling
  const preloadImages = async () => {
    try {
      const imagesToLoad: string[] = []
      
      // Add template
      const templatePath = `/generator/templates/${data.metadata.template}-template.png`
      imagesToLoad.push(templatePath)
      
      // Add glyphs - only load glyphs that exist
      data.ring2.forEach(item => {
        if (item.glyph && item.glyph !== '') {
          imagesToLoad.push(`/generator/glyphs/${item.glyph}`)
        }
      })
      
      // Always preload the pentagram ward star as fallback
      imagesToLoad.push('/generator/glyphs/pentagram.png')
      
      // Load all images in parallel with fallbacks
      const loadPromises = imagesToLoad.map(async (src) => {
        if (!imageCache.has(src)) {
          try {
            const img = await loadImage(src)
            setImageCache(prev => new Map(prev).set(src, img))
            return { src, success: true, img }
          } catch (error) {
            console.warn(`Failed to load image: ${src}, continuing without it`, error)
            return { src, success: false, img: null }
          }
        }
        return { src, success: true, img: imageCache.get(src)! }
      })
      
      const results = await Promise.all(loadPromises)
      const failures = results.filter(r => !r.success)
      
      if (failures.length > 0) {
        console.warn(`${failures.length} assets failed to load:`, failures.map(f => f.src))
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to preload images:', error)
      setError('Some assets failed to load, but generator will continue')
      setIsLoading(false)
    }
  }

  // Apply grid watermark (15x15px squares, 30% opacity)
  const applyGridWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save()
    ctx.strokeStyle = 'rgba(128, 128, 128, 0.3)'
    ctx.lineWidth = 1
    
    const gridSize = 15
    
    // Vertical lines
    for (let x = 0; x <= canvas.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvas.height)
      ctx.stroke()
    }
    
    // Horizontal lines
    for (let y = 0; y <= canvas.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvas.width, y)
      ctx.stroke()
    }
    
    ctx.restore()
  }

  // Apply ANOINT copyright watermark (center of seal, visible)
  const applyCopyrightWatermark = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'  // Darker for better center visibility
    ctx.font = 'bold 24px Arial'  // Larger font for center prominence
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('ANOINT © Preview Only', canvas.width / 2, canvas.height / 2)
    
    // Add subtle white outline for better visibility against varied backgrounds
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1
    ctx.strokeText('ANOINT © Preview Only', canvas.width / 2, canvas.height / 2)
    
    ctx.restore()
  }

  // Draw soft silver gradient background ONLY within the seal area
  const drawSealGradientBackground = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    ctx.save()
    
    // Create circular clipping path for the seal area (radius ~580px to contain the outer ring)
    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const sealRadius = 580  // Covers the seal area including outer ring
    
    ctx.beginPath()
    ctx.arc(centerX, centerY, sealRadius, 0, Math.PI * 2)
    ctx.clip() // Only draw within this circular area
    
    // Create soft silver radial gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,          // Start from center
      centerX, centerY, sealRadius  // Extend to seal edge
    )
    
    // Very soft silver gradient that won't obstruct content
    gradient.addColorStop(0, 'rgba(248, 250, 252, 0.6)')    // Very light center
    gradient.addColorStop(0.3, 'rgba(241, 245, 249, 0.4)')  // Light silver
    gradient.addColorStop(0.6, 'rgba(226, 232, 240, 0.3)')  // Medium silver
    gradient.addColorStop(0.8, 'rgba(203, 213, 225, 0.2)')  // Subtle silver
    gradient.addColorStop(1, 'rgba(148, 163, 184, 0.1)')    // Very light edge
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
  }

  // Draw colored circle with black outline
  const drawColoredCircle = (
    ctx: CanvasRenderingContext2D, 
    x: number, 
    y: number, 
    color: string, 
    radius: number = 22.5 // 45px diameter = 22.5px radius
  ) => {
    const hexColor = COLOR_MAP[color] || '#808080'
    
    ctx.save()
    
    // Fill circle
    ctx.fillStyle = hexColor
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
    
    // Black outline
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 2
    ctx.stroke()
    
    ctx.restore()
  }

  // Draw number text (centered, white with black outline, 12pt)
  const drawNumber = (ctx: CanvasRenderingContext2D, x: number, y: number, number: number) => {
    ctx.save()
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // Draw black outline first
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 3
    ctx.strokeText(number.toString(), x, y)
    
    // Draw white text on top
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(number.toString(), x, y)
    
    ctx.restore()
  }

  // Draw glyph image (40x40px, centered) - use ward star for missing glyphs
  const drawGlyph = (ctx: CanvasRenderingContext2D, x: number, y: number, glyph: string) => {
    // If no glyph specified, don't draw anything
    if (!glyph || glyph === '') {
      return
    }
    
    const img = imageCache.get(`/generator/glyphs/${glyph}`)
    if (img) {
      const size = 40
      ctx.drawImage(img, x - size / 2, y - size / 2, size, size)
    } else {
      // If glyph is specified but image not found, use pentagram as ward star
      console.warn(`Glyph not found: ${glyph}, using ward star (pentagram) instead`)
      const wardStarImg = imageCache.get('/generator/glyphs/pentagram.png')
      if (wardStarImg) {
        const size = 40
        ctx.drawImage(wardStarImg, x - size / 2, y - size / 2, size, size)
      } else {
        // Fallback if even pentagram is missing - draw a simple star shape
        ctx.save()
        ctx.fillStyle = '#4A5568'  // Gray color for fallback
        ctx.strokeStyle = '#2D3748'
        ctx.lineWidth = 2
        
        // Draw a simple 5-pointed star
        const radius = 15
        ctx.beginPath()
        for (let i = 0; i < 5; i++) {
          const angle = (i * 2 * Math.PI) / 5 - Math.PI / 2
          const outerX = x + Math.cos(angle) * radius
          const outerY = y + Math.sin(angle) * radius
          
          if (i === 0) {
            ctx.moveTo(outerX, outerY)
          } else {
            ctx.lineTo(outerX, outerY)
          }
          
          // Inner point
          const innerAngle = angle + Math.PI / 5
          const innerX = x + Math.cos(innerAngle) * (radius * 0.4)
          const innerY = y + Math.sin(innerAngle) * (radius * 0.4)
          ctx.lineTo(innerX, innerY)
        }
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      }
    }
  }

  // Draw circular text for Ring 3
  const drawCircularText = (ctx: CanvasRenderingContext2D, text: string, radius: number = 540, letterSpacing: number = 1.0) => {
    ctx.save()
    ctx.fillStyle = '#000000'
    ctx.font = 'bold 24px "Georgia", serif' // Elegant, thick serif font
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    const centerX = 600
    const centerY = 600
    
    // Repeat text based on repetitions with start/end bullets
    const fullText = Array(data.ring3.repetitions).fill(`• ${text} •`).join(' ')
    
    // Calculate text positioning around circle with letter spacing
    const chars = fullText.split('')
    const baseAngleStep = (Math.PI * 2) / chars.length
    const angleStep = baseAngleStep * letterSpacing
    
    chars.forEach((char, index) => {
      const angle = index * angleStep - Math.PI / 2 // Start at top
      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius
      
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(angle + Math.PI / 2) // Rotate character to follow circle
      ctx.fillText(char, 0, 0)
      ctx.restore()
    })
    
    ctx.restore()
  }

  // Generate clean image for merchandise (no watermarks)
  const generateCleanImage = useCallback(() => {
    const cleanCanvas = document.createElement('canvas')
    cleanCanvas.width = 1200
    cleanCanvas.height = 1200
    const ctx = cleanCanvas.getContext('2d')
    if (!ctx) return null

    try {
      // Clear canvas - keep transparent background outside seal
      ctx.clearRect(0, 0, cleanCanvas.width, cleanCanvas.height)

      // 0. Draw soft silver gradient background within seal area only
      drawSealGradientBackground(ctx, cleanCanvas)
      
      // 1. Draw template background
      const templateImg = imageCache.get(`/generator/templates/${data.metadata.template}-template.png`)
      if (templateImg) {
        ctx.drawImage(templateImg, 0, 0, cleanCanvas.width, cleanCanvas.height)
      }

      // 2. Draw Ring 1 (Numbers with colored circles)
      data.ring1.forEach(item => {
        drawColoredCircle(ctx, item.x, item.y, item.color, 22.5)
        drawNumber(ctx, item.x, item.y, item.number)
      })

      // 3. Draw Ring 2 (Glyphs with colored circles - only if glyph exists)
      data.ring2.forEach(item => {
        if (item.glyph && item.glyph !== '') {
          drawColoredCircle(ctx, item.x, item.y, item.color, 22.5)
          drawGlyph(ctx, item.x, item.y, item.glyph)
        }
      })

      // 4. Draw Ring 3 (Circular text)
      drawCircularText(ctx, data.ring3.text, 540, 1.0)

      // NO WATERMARKS for clean image

      return cleanCanvas.toDataURL('image/png')
    } catch (error) {
      console.error('Clean image generation error:', error)
      return null
    }
  }, [data, imageCache])

  // Main render function
  const renderSealArray = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas - keep transparent background outside seal  
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    try {
      // 0. Draw soft silver gradient background within seal area only
      drawSealGradientBackground(ctx, canvas)
      
      // 1. Draw template background
      const templateImg = imageCache.get(`/generator/templates/${data.metadata.template}-template.png`)
      if (templateImg) {
        ctx.drawImage(templateImg, 0, 0, canvas.width, canvas.height)
      }

      // 2. Draw Ring 1 (Numbers with colored circles)
      data.ring1.forEach(item => {
        drawColoredCircle(ctx, item.x, item.y, item.color, 22.5)
        drawNumber(ctx, item.x, item.y, item.number)
      })

      // 3. Draw Ring 2 (Glyphs with colored circles - only if glyph exists)
      data.ring2.forEach(item => {
        // Only draw if there's a glyph assigned to this position
        if (item.glyph && item.glyph !== '') {
          drawColoredCircle(ctx, item.x, item.y, item.color, 22.5)
          drawGlyph(ctx, item.x, item.y, item.glyph)
        }
        // If no glyph, leave the position blank
      })

      // 4. Draw Ring 3 (Circular text)
      drawCircularText(ctx, data.ring3.text, 540, 1.0)

      // 5. Apply watermarks if not purchased
      if (!isPurchased) {
        applyGridWatermark(ctx, canvas)
        applyCopyrightWatermark(ctx, canvas)
      }

    } catch (error) {
      console.error('Render error:', error)
      setError('Failed to render seal array')
    }
  }, [data, isPurchased, imageCache])

  // Handle download
  const handleDownload = (format: 'png' | 'pdf') => {
    if (!isPurchased) {
      onPaymentClick()
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    if (format === 'png') {
      // Create clean version without watermarks
      const cleanCanvas = document.createElement('canvas')
      cleanCanvas.width = 1200
      cleanCanvas.height = 1200
      const cleanCtx = cleanCanvas.getContext('2d')
      
      if (cleanCtx) {
        // Temporarily render without watermarks
        const wasPurchased = isPurchased
        // Re-render clean version
        // ... (same render logic but without watermarks)
        
        // Download
        const link = document.createElement('a')
        const generatedDate = data.metadata.generated instanceof Date 
          ? data.metadata.generated.toISOString() 
          : data.metadata.generated
        link.download = `anoint-array-${generatedDate.split('T')[0]}.png`
        link.href = cleanCanvas.toDataURL('image/png')
        link.click()
      }
    } else if (format === 'pdf') {
      // PDF generation would require a library like jsPDF
      // For now, show message
      alert('PDF download will be implemented with jsPDF library')
    }
  }

  // Initialize
  useEffect(() => {
    if (isMounted) {
      preloadImages()
    }
  }, [data, isMounted])

  // Render when images are loaded
  useEffect(() => {
    if (!isLoading && imageCache.size > 0) {
      renderSealArray()
    }
  }, [isLoading, imageCache, isPurchased, renderSealArray])

  // Expose generateCleanImage function to parent component
  useEffect(() => {
    if (onImageGenerated && !isLoading && imageCache.size > 0) {
      // Wait for render to complete, then generate clean image if needed
      const timer = setTimeout(() => {
        try {
          const cleanImageData = generateCleanImage()
          if (cleanImageData) {
            onImageGenerated(cleanImageData)
          } else {
            console.warn('Failed to generate clean image data')
          }
        } catch (error) {
          console.error('Error generating clean image:', error)
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [generateCleanImage, onImageGenerated, isLoading, imageCache.size])

  // Cleanup canvas on unmount
  useEffect(() => {
    return () => {
      // Clear canvas reference
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }
    }
  }, [])

  if (!isMounted || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading seal array...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <Alert className="bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200" variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      {/* Canvas Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.min(zoom + 0.1, 2))}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(Math.max(zoom - 0.1, 0.2))}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoom(0.5)}
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            {Math.round(zoom * 100)}%
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Badge className="bg-purple-600/80 text-white border-0">{data.metadata.template}</Badge>
          <Badge className="bg-cyan-600/80 text-white border-0">{data.metadata.sealType}</Badge>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-96">
        <div 
          className="mx-auto" 
          style={{ 
            width: `${1200 * zoom}px`, 
            height: `${1200 * zoom}px`,
            minWidth: `${1200 * zoom}px`,
            minHeight: `${1200 * zoom}px`
          }}
        >
          <canvas
            ref={canvasRef}
            width={1200}
            height={1200}
            className="border bg-white shadow-lg"
            style={{ 
              width: '100%', 
              height: '100%',
              imageRendering: 'pixelated'
            } as React.CSSProperties}
          />
        </div>
      </div>

      {/* Seal Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="text-sm font-semibold text-gray-700">Ring 1 (Numbers)</div>
          <div className="text-xs text-gray-600">
            24 personalized numbers with colored backgrounds
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-700">Ring 2 (Glyphs)</div>
          <div className="text-xs text-gray-600">
            24 sacred symbols with colored backgrounds
          </div>
        </div>
        <div>
          <div className="text-sm font-semibold text-gray-700">Ring 3 (Affirmation)</div>
          <div className="text-xs text-gray-600">
            &quot;{data.ring3.text}&quot; ({data.ring3.language})
          </div>
        </div>
      </div>

      {/* Download Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div>
          <div className="font-semibold">
            {isPurchased ? 'Download Options' : 'Purchase Required'}
          </div>
          <div className="text-sm text-gray-600">
            {isPurchased 
              ? 'High-resolution, watermark-free versions'
              : 'Complete purchase to unlock downloads'
            }
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant={isPurchased ? "default" : "outline"}
            onClick={() => handleDownload('png')}
            disabled={!isPurchased}
          >
            {!isPurchased && <Lock className="mr-2 h-4 w-4" />}
            <Download className="mr-2 h-4 w-4" />
            PNG
          </Button>
          
          <Button
            variant={isPurchased ? "default" : "outline"}
            onClick={() => handleDownload('pdf')}
            disabled={!isPurchased}
          >
            {!isPurchased && <Lock className="mr-2 h-4 w-4" />}
            <Download className="mr-2 h-4 w-4" />
            PDF
          </Button>

          {!isPurchased && (
            <Button
              onClick={onPaymentClick}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              Purchase $17
            </Button>
          )}
        </div>
      </div>

      {!isPurchased && (
        <Alert>
          <Eye className="h-4 w-4" />
          <AlertDescription>
            This preview includes security watermarks. The square grid is designed to neutralize all energy functionality radiating from the seal array so it can't be used in its preview version. Purchasing your seal array image will remove the square grid and copyright watermarks and it will be fully functional.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}