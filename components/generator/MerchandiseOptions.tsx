'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  Package, 
  ShoppingCart, 
  Star, 
  Loader2, 
  ExternalLink,
  Gift,
  Truck,
  Shield,
  Check,
  X,
  ArrowRight
} from 'lucide-react'
import { STAFF_PICKS, MerchandiseProduct, MERCHANDISE_CATALOG, CATEGORIES } from '@/lib/merchandise'

interface MerchandiseOptionsProps {
  sealArrayData: GenerationOutput | null
  sealArrayId: string
  sealArrayImage: string | null
  onComplete: () => void
}

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
  explanation: string
  metadata: {
    generated: Date | string
    template: string
    category: string
    sealType: string
  }
}

interface CheckoutSession {
  id: string
  url: string
  totalAmount: number
  totalProfit: number
  estimatedShipping: number
  productCount: number
}

export default function MerchandiseOptions({ sealArrayData, sealArrayId, sealArrayImage, onComplete }: MerchandiseOptionsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'featured' | 'categories'>('featured')
  const [selectedCategory, setSelectedCategory] = useState<string>('apparel')
  const [mockupUrls, setMockupUrls] = useState<{[key: string]: string}>({})
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false)
  const [mockupProgress, setMockupProgress] = useState(0)

  // Get staff picks (featured products)
  const staffPickProducts = STAFF_PICKS.map(id => MERCHANDISE_CATALOG[id]).filter(Boolean)

  // Generate product mockups with actual seal array image
  const generateMockupsWithSealArray = useCallback(async () => {
    if (!sealArrayImage) {
      console.log('No seal array image available, using placeholders')
      return
    }

    setIsGeneratingMockups(true)
    setMockupProgress(0)

    try {
      const mockups: {[key: string]: string} = {}
      const totalProducts = staffPickProducts.length
      
      for (let i = 0; i < staffPickProducts.length; i++) {
        const product = staffPickProducts[i]
        
        // Update progress
        setMockupProgress(Math.round(((i + 1) / totalProducts) * 100))
        
        try {
          // Generate mockup for this product
          const mockupUrl = await createProductMockup(product.id, sealArrayImage)
          mockups[product.id] = mockupUrl
        } catch (error) {
          console.error(`Failed to create mockup for ${product.id}:`, error)
          // Fallback to placeholder
          mockups[product.id] = getFallbackImage(product.id)
        }
        
        // Small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      setMockupUrls(mockups)
    } catch (error) {
      console.error('Mockup generation failed:', error)
      // Use fallback images
      const fallbackMockups: {[key: string]: string} = {}
      staffPickProducts.forEach(product => {
        fallbackMockups[product.id] = getFallbackImage(product.id)
      })
      setMockupUrls(fallbackMockups)
    } finally {
      setIsGeneratingMockups(false)
      setMockupProgress(100)
    }
  }, [sealArrayImage, staffPickProducts])

  // Fallback image generator
  const getFallbackImage = (productId: string): string => {
    if (productId.includes('tee') || productId.includes('shirt')) {
      return 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=T-Shirt'
    } else if (productId.includes('hat') || productId.includes('cap')) {
      return 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=Hat'
    } else if (productId.includes('mug')) {
      return 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=Mug'
    } else if (productId.includes('canvas')) {
      return 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=Canvas+Print'
    } else if (productId.includes('blanket')) {
      return 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=Blanket'
    } else {
      return 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=Product'
    }
  }

  // Create individual product mockup
  const createProductMockup = async (productId: string, sealArrayImageData: string): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      canvas.width = 400
      canvas.height = 400
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        resolve(getFallbackImage(productId))
        return
      }

      // Create background based on product type
      ctx.fillStyle = '#2D3748'
      ctx.fillRect(0, 0, 400, 400)

      // Load and draw seal array image
      const sealImage = new Image()
      sealImage.onload = () => {
        // Determine positioning based on product type
        let sealX = 200, sealY = 200, sealSize = 120
        
        if (productId.includes('tee') || productId.includes('shirt')) {
          // Center chest area for t-shirts
          sealX = 200
          sealY = 180
          sealSize = 100
          
          // Draw simple t-shirt outline
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.beginPath()
          // Simple t-shirt shape
          ctx.moveTo(120, 150)
          ctx.lineTo(280, 150)
          ctx.lineTo(280, 350)
          ctx.lineTo(120, 350)
          ctx.closePath()
          ctx.stroke()
          
        } else if (productId.includes('mug')) {
          // Center on mug
          sealX = 200
          sealY = 200
          sealSize = 80
          
          // Draw simple mug outline
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.rect(150, 150, 100, 120)
          ctx.stroke()
          // Handle
          ctx.beginPath()
          ctx.arc(270, 210, 20, Math.PI / 2, -Math.PI / 2, false)
          ctx.stroke()
          
        } else if (productId.includes('hat') || productId.includes('cap')) {
          // Front of cap
          sealX = 200
          sealY = 200
          sealSize = 60
          
          // Draw simple cap outline
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(200, 200, 80, 0, Math.PI, true)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(120, 200)
          ctx.lineTo(90, 220)
          ctx.lineTo(310, 220)
          ctx.lineTo(280, 200)
          ctx.stroke()
          
        } else if (productId.includes('canvas')) {
          // Full canvas print
          sealX = 200
          sealY = 200
          sealSize = 150
          
          // Draw canvas frame
          ctx.strokeStyle = '#8B4513'
          ctx.lineWidth = 4
          ctx.strokeRect(50, 50, 300, 300)
          
        } else if (productId.includes('blanket')) {
          // Corner of blanket
          sealX = 200
          sealY = 200
          sealSize = 100
          
          // Draw blanket outline
          ctx.strokeStyle = '#FFFFFF'
          ctx.lineWidth = 2
          ctx.strokeRect(80, 80, 240, 240)
        }

        // Draw the seal array on the product
        ctx.drawImage(
          sealImage, 
          sealX - sealSize/2, 
          sealY - sealSize/2, 
          sealSize, 
          sealSize
        )

        resolve(canvas.toDataURL('image/png'))
      }
      
      sealImage.onerror = () => {
        resolve(getFallbackImage(productId))
      }
      
      sealImage.src = sealArrayImageData
    })
  }

  // Auto-generate mockups when component mounts and seal array image is available
  useEffect(() => {
    if (sealArrayImage) {
      generateMockupsWithSealArray()
    } else {
      // Use placeholders if no image
      const placeholders: {[key: string]: string} = {}
      staffPickProducts.forEach(product => {
        placeholders[product.id] = getFallbackImage(product.id)
      })
      setMockupUrls(placeholders)
    }
  }, [sealArrayImage, generateMockupsWithSealArray])

  const handleCreateMerchandise = async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Convert canvas to high-res image
      const canvas = document.createElement('canvas')
      canvas.width = 1200
      canvas.height = 1200
      const ctx = canvas.getContext('2d')
      
      if (!ctx) {
        throw new Error('Could not create canvas context')
      }

      // Here we would redraw the seal array at high resolution
      // For now, we'll create a placeholder
      ctx.fillStyle = '#F8F9FA'
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
      gradient.addColorStop(0, '#F8F9FA')
      gradient.addColorStop(1, '#FFFFFF')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // Add placeholder text (in real implementation, this would be the actual seal array)
      ctx.fillStyle = '#000000'
      ctx.font = 'bold 48px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('ANOINT SEAL ARRAY', canvas.width / 2, canvas.height / 2)

      const imageDataUrl = canvas.toDataURL('image/png')

      // Call API to create merchandise
      const response = await fetch('/api/fourthwall/create-merchandise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sealArrayImage: imageDataUrl,
          sealArrayId: sealArrayId,
          customerEmail: 'customer@example.com' // Would get from user context
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create merchandise')
      }

      const result = await response.json()
      
      if (result.success && result.checkoutSession?.url) {
        // Redirect to FourthWall checkout
        window.open(result.checkoutSession.url, '_blank')
        
        // Show success message and complete the flow
        setTimeout(() => {
          onComplete()
        }, 2000)
      } else {
        throw new Error('Invalid response from merchandise service')
      }

    } catch (error) {
      console.error('Merchandise creation error:', error)
      
      // Handle specific error codes
      let errorMessage = 'Failed to create merchandise'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      // Check if it's a FourthWall unavailable error
      if (errorMessage.includes('FOURTHWALL_UNAVAILABLE') || errorMessage.includes('temporarily unavailable')) {
        errorMessage = 'Merchandise service is temporarily unavailable. We\'re working to restore it. Please try again later or contact support.'
      }
      
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const ProductCard = useCallback(({ product }: { product: MerchandiseProduct }) => (
    <a 
      href={`https://fourthwall.com/shop/${product.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block group"
    >
      <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer group-hover:transform group-hover:scale-[1.02]">
        <div className="aspect-square bg-gray-700/50 rounded mb-3 relative overflow-hidden">
          {mockupUrls[product.id] ? (
            <img 
              src={mockupUrls[product.id]} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback to placeholder
                (e.target as HTMLImageElement).src = getFallbackImage(product.id)
              }}
            />
          ) : sealArrayImage && STAFF_PICKS.includes(product.id) ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Package className="mx-auto mb-2" size={32} />
                <div className="text-xs">Preview Loading</div>
              </div>
            </div>
          ) : (
            <img 
              src={getFallbackImage(product.id)} 
              alt={product.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Final fallback
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x400/2D3748/FFFFFF?text=Product'
              }}
            />
          )}
          
          {product.popular && (
            <Badge className="absolute top-2 left-2 bg-red-600/80 text-white border-0 text-xs">
              🔥 Popular
            </Badge>
          )}
          
          {product.featured && (
            <Badge className="absolute top-2 right-2 bg-purple-600/80 text-white border-0 text-xs">
              ⭐ Featured
            </Badge>
          )}
          
          {/* Click to view indicator */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
            <ExternalLink className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={24} />
          </div>
        </div>
        
        <div>
          <h4 className="font-medium text-white text-sm mb-1 group-hover:text-purple-400 transition-colors">{product.name}</h4>
          <p className="text-xs text-gray-400 mb-2">{product.description}</p>
          
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-white">${product.sellingPrice}</span>
          </div>
          
          {product.sizes && product.sizes.length > 1 && (
            <div className="mt-2 text-xs text-gray-400">
              Sizes: {product.sizes.slice(0, 3).join(', ')}{product.sizes.length > 3 && '...'}
            </div>
          )}
        </div>
      </div>
    </a>
  ), [mockupUrls, sealArrayImage, getFallbackImage])

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="text-center p-6 bg-gradient-to-r from-purple-900/20 to-cyan-900/20 rounded-lg border border-purple-500/20">
        <div className="flex items-center justify-center gap-2 mb-3">
          <Gift className="text-purple-400" size={24} />
          <h3 className="text-xl font-semibold text-white">
            Transform Your Sacred Array into Wearable Art
          </h3>
        </div>
        <p className="text-gray-300 mb-4">
          Your personalized seal array can be printed on premium products and delivered worldwide
        </p>
        
        {/* Benefits */}
        <div className="flex flex-wrap justify-center gap-4 text-sm">
          <div className="flex items-center gap-1 text-green-400">
            <Truck size={16} />
            <span>Free Shipping Over $50</span>
          </div>
          <div className="flex items-center gap-1 text-blue-400">
            <Shield size={16} />
            <span>Premium Quality</span>
          </div>
          <div className="flex items-center gap-1 text-purple-400">
            <Star size={16} />
            <span>Print-on-Demand</span>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200" variant="destructive">
          <X className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Loading State for Mockup Generation */}
      {isGeneratingMockups && (
        <div className="space-y-4 p-6 bg-purple-900/20 rounded-lg border border-purple-500/20">
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
              <h3 className="text-lg font-semibold text-white">
                Generating Your Personalized Product Previews...
              </h3>
            </div>
            
            <div className="bg-gray-700/50 rounded-full h-3 mb-4">
              <div 
                className="bg-gradient-to-r from-purple-500 to-cyan-500 h-3 rounded-full transition-all duration-500"
                style={{ width: `${mockupProgress}%` }}
              />
            </div>
            
            <p className="text-gray-300 text-sm">
              Creating mockups with your seal array design on premium products... ({mockupProgress}%)
            </p>
          </div>
        </div>
      )}

      {/* Product Sections - Only show when not generating mockups */}
      {!isGeneratingMockups && (
        <>
          {/* View Toggle */}
          <div className="flex justify-center">
            <div className="flex bg-gray-800/60 rounded-lg p-1">
              <Button
                variant={selectedView === 'featured' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('featured')}
                className={selectedView === 'featured' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}
              >
                🌟 Staff Picks
              </Button>
              <Button
                variant={selectedView === 'categories' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedView('categories')}
                className={selectedView === 'categories' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}
              >
                📂 Browse All
              </Button>
            </div>
          </div>

      {/* Featured Products */}
      {selectedView === 'featured' && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-white flex items-center gap-2">
              <Star className="text-yellow-400" size={20} />
              Staff Picks (Most Popular)
            </h4>
            <Badge className="bg-gradient-to-r from-green-600/20 to-cyan-600/20 text-green-400 border-green-600/30">
              Best Value Bundle
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            {staffPickProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
          
          {/* Bundle Summary */}
          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-white font-medium">Staff Picks Bundle</span>
                <div className="text-sm text-gray-400 mt-1">
                  {staffPickProducts.length} carefully selected products for maximum appeal
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-white">
                  ${staffPickProducts.reduce((sum, p) => sum + p.sellingPrice, 0).toFixed(2)}
                </div>
              </div>
            </div>
            <Button
              onClick={() => window.open('https://fourthwall.com/shop/anoint-bundle', '_blank')}
              className="w-full mt-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Shop Bundle Now
            </Button>
          </div>
        </div>
      )}

      {/* Category Browse */}
      {selectedView === 'categories' && (
        <div>
          <h4 className="text-lg font-semibold text-white mb-4">Browse by Category</h4>
          
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-4">
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <Button
                key={key}
                variant={selectedCategory === key ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(key)}
                className={selectedCategory === key 
                  ? 'bg-purple-600 text-white' 
                  : 'bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70'}
              >
                {category.icon} {category.name}
              </Button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.values(MERCHANDISE_CATALOG)
              .filter(product => product.category === selectedCategory)
              .slice(0, 12) // Limit to 12 products per category
              .map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
          
          {Object.values(MERCHANDISE_CATALOG).filter(product => product.category === selectedCategory).length === 0 && (
            <div className="text-center text-gray-400 py-8">
              <Package size={48} className="mx-auto mb-2" />
              <p>No products found in this category</p>
            </div>
          )}
        </div>
      )}

        </>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between pt-4 border-t border-gray-700/50">
        <Button 
          variant="outline" 
          onClick={onComplete}
          className="bg-gray-700/60 border-gray-600/50 text-white hover:bg-gray-600/70"
        >
          Skip This Step
        </Button>
        
        <div className="flex gap-3">
          <Button
            onClick={handleCreateMerchandise}
            disabled={isLoading}
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white px-8"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Products...
              </>
            ) : (
              <>
                <ShoppingCart className="mr-2 h-4 w-4" />
                Shop All Products
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-900/60 backdrop-blur-lg border-blue-700/50 text-blue-200">
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Your seal array will be uploaded to our print partner, FourthWall. 
          You&apos;ll be redirected to their secure checkout to complete your order. They handle all printing, 
          shipping, and customer service for merchandise orders.
        </AlertDescription>
      </Alert>
    </div>
  )
}