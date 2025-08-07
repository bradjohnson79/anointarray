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
  AlertTriangle
} from 'lucide-react'
import { STAFF_PICKS, MerchandiseProduct, MERCHANDISE_CATALOG, CATEGORIES } from '@/lib/merchandise'

interface MerchandiseOptionsStandaloneProps {
  sealArrayImage: string
  fileName: string
}

export default function MerchandiseOptionsStandalone({ 
  sealArrayImage, 
  fileName 
}: MerchandiseOptionsStandaloneProps) {
  const [isMounted, setIsMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedView, setSelectedView] = useState<'featured' | 'categories'>('featured')
  const [selectedCategory, setSelectedCategory] = useState<string>('apparel')
  const [mockupUrls, setMockupUrls] = useState<{[key: string]: string}>({})
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false)
  const [mockupProgress, setMockupProgress] = useState(0)

  // Client-side mounting guard
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Initialize staff picks products state
  const [staffPickProducts, setStaffPickProducts] = useState<MerchandiseProduct[]>([])
  
  // Initialize staff picks when component mounts (SSR-safe)
  useEffect(() => {
    if (STAFF_PICKS && MERCHANDISE_CATALOG) {
      const products = STAFF_PICKS.map(id => MERCHANDISE_CATALOG[id]).filter(Boolean)
      setStaffPickProducts(products)
    }
  }, [])

  // Sequential mockup generation - one product at a time
  const generateSimpleMockups = useCallback(async () => {
    if (!sealArrayImage || !isMounted || staffPickProducts.length === 0) {
      console.log('Not ready: missing image, not mounted, or no products loaded')
      return
    }

    setIsGeneratingMockups(true)
    setMockupProgress(0)
    setError(null)

    try {
      const mockups: {[key: string]: string} = {}
      const totalProducts = staffPickProducts.length // Now 4 products
      
      // Load products one at a time
      for (let i = 0; i < staffPickProducts.length; i++) {
        const product = staffPickProducts[i]
        
        // Update progress: 25%, 50%, 75%, 100%
        const progressPercent = Math.round(((i + 1) / totalProducts) * 100)
        setMockupProgress(progressPercent)
        
        // Set this product as ready
        mockups[product.id] = 'css-overlay'
        setMockupUrls({...mockups}) // Update state with current progress
        
        // Longer delay between products to prevent browser overload
        if (i < staffPickProducts.length - 1) { // Don't delay after the last product
          await new Promise(resolve => setTimeout(resolve, 200))
        }
      }
      
    } catch (error) {
      console.error('Sequential mockup generation failed:', error)
      setError('Failed to prepare product previews.')
    } finally {
      setIsGeneratingMockups(false)
      setMockupProgress(100)
    }
  }, [sealArrayImage, isMounted, staffPickProducts])


  // Get product template background color and styling
  const getProductStyling = useCallback((productId: string) => {
    if (productId.includes('tee') || productId.includes('shirt')) {
      return { bg: '#2D3748', sealSize: '40%', sealPos: 'center-top' }
    } else if (productId.includes('mug')) {
      return { bg: '#4A5568', sealSize: '35%', sealPos: 'center' }
    } else if (productId.includes('hat') || productId.includes('cap')) {
      return { bg: '#1A202C', sealSize: '25%', sealPos: 'center' }
    } else if (productId.includes('canvas')) {
      return { bg: '#F7FAFC', sealSize: '80%', sealPos: 'center' }
    } else if (productId.includes('blanket')) {
      return { bg: '#2D3748', sealSize: '50%', sealPos: 'center' }
    } else {
      return { bg: '#2D3748', sealSize: '40%', sealPos: 'center' }
    }
  }, [])

  // Auto-generate mockups when component mounts and is ready
  useEffect(() => {
    if (isMounted && sealArrayImage && staffPickProducts.length > 0) {
      generateSimpleMockups()
    }
  }, [isMounted, sealArrayImage, staffPickProducts, generateSimpleMockups])

  const ProductCard = useCallback(({ product }: { product: MerchandiseProduct }) => {
    const styling = getProductStyling(product.id)
    const hasActiveMockup = mockupUrls[product.id] === 'css-overlay'
    const isCurrentlyGenerating = isGeneratingMockups && !hasActiveMockup
    
    return (
      <a 
        href={`https://fourthwall.com/shop/anoint-array/${product.id}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block group"
      >
        <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/50 transition-all cursor-pointer group-hover:transform group-hover:scale-[1.02]">
          <div className="aspect-square rounded mb-3 relative overflow-hidden" style={{ backgroundColor: styling.bg }}>
            {hasActiveMockup ? (
              <div className="w-full h-full relative flex items-center justify-center">
                {/* Product outline based on type */}
                {product.id.includes('tee') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-32 border-2 border-white/30 rounded-sm" />
                  </div>
                )}
                {product.id.includes('mug') && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-24 border-2 border-white/30 rounded-sm relative">
                      <div className="absolute -right-4 top-1/2 transform -translate-y-1/2 w-6 h-8 border-2 border-white/30 rounded-r-full" />
                    </div>
                  </div>
                )}
                {(product.id.includes('hat') || product.id.includes('cap')) && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-20 h-12 border-2 border-white/30 rounded-full relative">
                      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-4 border-2 border-white/30 rounded-full" />
                    </div>
                  </div>
                )}
                {product.id.includes('canvas') && (
                  <div className="absolute inset-2 border-4 border-amber-800/60" />
                )}
                {product.id.includes('blanket') && (
                  <div className="absolute inset-4 border-2 border-white/20 rounded" />
                )}
                
                {/* Seal array overlay */}
                <img 
                  src={sealArrayImage} 
                  alt={`Your seal array on ${product.name}`}
                  className="absolute z-10 object-contain"
                  style={{
                    width: styling.sealSize,
                    height: styling.sealSize,
                    top: styling.sealPos === 'center-top' ? '30%' : '50%',
                    left: '50%',
                    transform: styling.sealPos === 'center-top' 
                      ? 'translate(-50%, -50%)' 
                      : 'translate(-50%, -50%)'
                  }}
                  onError={(e) => {
                    console.error('Failed to load seal array image for product preview')
                    // Hide the image if it fails to load
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  {isCurrentlyGenerating ? (
                    <>
                      <Loader2 className="mx-auto mb-2 animate-spin" size={32} />
                      <div className="text-xs">Creating Preview...</div>
                    </>
                  ) : (
                    <>
                      <Package className="mx-auto mb-2" size={32} />
                      <div className="text-xs">Waiting...</div>
                    </>
                  )}
                </div>
              </div>
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
    )
  }, [mockupUrls, sealArrayImage, getProductStyling, isGeneratingMockups])

  // Don't render until component is mounted (prevents SSR issues)
  if (!isMounted) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <div className="text-center text-gray-400">
            <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
            <div className="text-sm">Loading merchandise options...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with uploaded image info */}
      <div className="flex items-center justify-between p-4 bg-gray-800/40 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-700/50 rounded-lg overflow-hidden">
            <img 
              src={sealArrayImage} 
              alt="Your seal array"
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="font-semibold text-white">Using: {fileName}</h3>
            <p className="text-sm text-gray-400">Ready for merchandise creation</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert className="bg-orange-900/60 backdrop-blur-lg border-orange-700/50 text-orange-200">
          <AlertTriangle className="h-4 w-4" />
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
              Creating mockups with your seal array design... ({mockupProgress}%)
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
              
              {staffPickProducts.length > 0 ? (
                <>
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
                      onClick={() => window.open('https://fourthwall.com/shop/anoint-array/bundle', '_blank')}
                      className="w-full mt-3 bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white"
                    >
                      <ShoppingCart className="mr-2 h-4 w-4" />
                      Shop Bundle Now
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-400 py-8">
                  <Loader2 className="mx-auto h-8 w-8 animate-spin mb-2" />
                  <div className="text-sm">Loading products...</div>
                </div>
              )}
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

      {/* Info Alert */}
      <Alert className="bg-blue-900/60 backdrop-blur-lg border-blue-700/50 text-blue-200">
        <ExternalLink className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Click any product to visit our FourthWall store where 
          you can upload your seal array and complete your order. They handle all printing, 
          shipping, and customer service for merchandise orders.
        </AlertDescription>
      </Alert>
    </div>
  )
}