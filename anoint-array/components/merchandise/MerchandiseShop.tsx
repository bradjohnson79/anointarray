'use client'

import { useState, useEffect, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  CreditCard,
  Package,
  Tag,
  Filter,
  Grid3x3,
  List,
  Star,
  ExternalLink,
  ChevronDown,
  Heart,
  Eye,
  Loader2,
  CheckCircle
} from 'lucide-react'
import PaymentGateway from './PaymentGateway'
import { 
  MERCHANDISE_CATALOG, 
  CATEGORIES, 
  MerchandiseProduct, 
  getProductsByCategory,
  getFeaturedProducts,
  getPopularProducts 
} from '@/lib/merchandise'

interface CartItem {
  productId: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface MerchandiseShopProps {
  sealArrayImage: string
  fileName: string
}

export default function MerchandiseShop({ sealArrayImage, fileName }: MerchandiseShopProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'popular' | 'price-low' | 'price-high' | 'name'>('popular')
  const [cart, setCart] = useState<CartItem[]>([])
  const [showCart, setShowCart] = useState(false)
  const [isGeneratingMockups, setIsGeneratingMockups] = useState(false)
  const [mockupProgress, setMockupProgress] = useState(0)
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [showPaymentGateway, setShowPaymentGateway] = useState(false)
  const [orderComplete, setOrderComplete] = useState<string | null>(null)

  // Filter products based on selections
  const filteredProducts = useMemo(() => {
    let products = Object.values(MERCHANDISE_CATALOG)

    // Apply category filter
    if (selectedCategory !== 'all') {
      products = getProductsByCategory(selectedCategory)
    }

    // Apply subcategory filter
    if (selectedSubcategory !== 'all') {
      products = products.filter(p => p.subcategory === selectedSubcategory)
    }

    // Apply sorting
    products.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.sellingPrice - b.sellingPrice
        case 'price-high': return b.sellingPrice - a.sellingPrice
        case 'name': return a.name.localeCompare(b.name)
        case 'popular':
        default:
          // Sort by featured first, then popular, then by profit margin
          if (a.featured && !b.featured) return -1
          if (!a.featured && b.featured) return 1
          if (a.popular && !b.popular) return -1
          if (!a.popular && b.popular) return 1
          return b.markup - a.markup
      }
    })

    return products
  }, [selectedCategory, selectedSubcategory, sortBy])

  // Get available subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'all') return []
    
    const categoryProducts = getProductsByCategory(selectedCategory)
    const subcategories = [...new Set(categoryProducts.map(p => p.subcategory))]
    return subcategories
  }, [selectedCategory])

  // Cart functions
  const addToCart = (productId: string, size?: string, color?: string) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.productId === productId && 
        item.selectedSize === size && 
        item.selectedColor === color
      )
      
      if (existing) {
        return prev.map(item =>
          item.productId === productId && 
          item.selectedSize === size && 
          item.selectedColor === color
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      
      return [...prev, { productId, quantity: 1, selectedSize: size, selectedColor: color }]
    })
  }

  const updateQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index)
      return
    }
    
    setCart(prev => prev.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ))
  }

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index))
  }

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return cart.reduce((total, item) => {
      const product = MERCHANDISE_CATALOG[item.productId]
      return total + (product?.sellingPrice || 0) * item.quantity
    }, 0)
  }

  // Checkout function
  const handleCheckout = () => {
    if (cart.length === 0) return
    setShowPaymentGateway(true)
    setCheckoutError(null)
  }

  // Payment success handler
  const handlePaymentSuccess = (orderRef: string) => {
    setOrderComplete(orderRef)
    setCart([])
    setShowCart(false)
    setShowPaymentGateway(false)
  }

  // Payment gateway back handler
  const handlePaymentBack = () => {
    setShowPaymentGateway(false)
  }

  // Generate mockups simulation
  const generateMockups = async () => {
    setIsGeneratingMockups(true)
    setMockupProgress(0)
    
    const totalProducts = filteredProducts.length
    for (let i = 0; i < totalProducts && i < 20; i++) {
      const progress = Math.round(((i + 1) / Math.min(totalProducts, 20)) * 100)
      setMockupProgress(progress)
      await new Promise(resolve => setTimeout(resolve, 150))
    }
    
    setIsGeneratingMockups(false)
  }

  // Auto-generate mockups when products change
  useEffect(() => {
    if (filteredProducts.length > 0) {
      generateMockups()
    }
  }, [filteredProducts.length])

  const ProductCard = ({ product }: { product: MerchandiseProduct }) => {
    const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '')
    const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '')
    
    const getProductStyling = () => {
      // Check for professional mockup images first
      if (product.category === 'apparel' && product.subcategory === 'tshirts') {
        return { 
          mockupImage: '/mockups/array-tshirt.png', 
          hasProfessionalMockup: true,
          sealSize: '30%', 
          sealPos: { top: '45%', left: '50%' }
        }
      } else if (product.subcategory === 'drinkware' && product.id.includes('mug')) {
        return { 
          mockupImage: '/mockups/array-coffee-mug.png', 
          hasProfessionalMockup: true,
          sealSize: '25%', 
          sealPos: { top: '45%', left: '50%' }
        }
      } else if (product.category === 'prints' && (product.subcategory === 'canvas' || product.subcategory === 'framed')) {
        return { 
          mockupImage: '/mockups/array-framed-poster.png', 
          hasProfessionalMockup: true,
          sealSize: '35%', 
          sealPos: { top: '50%', left: '50%' }
        }
      }
      
      // Fallback to CSS-based mockups for unsupported products
      else if (product.category === 'apparel') {
        return { bg: '#2D3748', sealSize: '35%', sealPos: 'center-top', hasProfessionalMockup: false }
      } else if (product.subcategory === 'drinkware') {
        return { bg: '#4A5568', sealSize: '30%', sealPos: 'center', hasProfessionalMockup: false }
      } else if (product.category === 'headwear') {
        return { bg: '#1A202C', sealSize: '25%', sealPos: 'center', hasProfessionalMockup: false }
      } else if (product.category === 'prints') {
        return { bg: '#F7FAFC', sealSize: '70%', sealPos: 'center', hasProfessionalMockup: false }
      } else if (product.category === 'home') {
        return { bg: '#2D3748', sealSize: '50%', sealPos: 'center', hasProfessionalMockup: false }
      } else {
        return { bg: '#2D3748', sealSize: '40%', sealPos: 'center', hasProfessionalMockup: false }
      }
    }

    const styling = getProductStyling()
    
    return (
      <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group overflow-hidden">
        <div className="relative">
          {/* Product Preview */}
          <div 
            className="aspect-square relative overflow-hidden" 
            style={{ backgroundColor: styling.hasProfessionalMockup ? '#f5f5f5' : styling.bg }}
          >
            {!isGeneratingMockups ? (
              <div className="w-full h-full relative">
                {/* Professional mockup background (if available) */}
                {styling.hasProfessionalMockup ? (
                  <img 
                    src={styling.mockupImage}
                    alt={`${product.name} mockup`}
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load mockup image: ${styling.mockupImage}`)
                      // Hide the image and show fallback
                      ;(e.target as HTMLImageElement).style.display = 'none'
                    }}
                  />
                ) : null}
                
                {/* Seal array overlay */}
                <img 
                  src={sealArrayImage} 
                  alt={`Your design on ${product.name}`}
                  className="absolute z-10 object-contain"
                  style={styling.hasProfessionalMockup ? {
                    width: styling.sealSize,
                    height: styling.sealSize,
                    top: styling.sealPos.top,
                    left: styling.sealPos.left,
                    transform: 'translate(-50%, -50%)',
                    mixBlendMode: 'multiply'
                  } : {
                    width: styling.sealSize,
                    height: styling.sealSize,
                    top: styling.sealPos === 'center-top' ? '35%' : '50%',
                    left: '50%',
                    transform: styling.sealPos === 'center-top' 
                      ? 'translate(-50%, -50%)' 
                      : 'translate(-50%, -50%)'
                  }}
                  onError={(e) => {
                    console.error('Failed to load seal array image')
                    ;(e.target as HTMLImageElement).style.display = 'none'
                  }}
                />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <Button size="sm" variant="secondary" className="bg-white/10 backdrop-blur-sm">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white/10 backdrop-blur-sm">
                      <Heart className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <Loader2 className="mx-auto mb-2 animate-spin h-8 w-8" />
                  <div className="text-xs">Generating Preview...</div>
                </div>
              </div>
            )}

            {/* Badges */}
            {product.featured && (
              <Badge className="absolute top-2 right-2 bg-purple-600/80 text-white border-0 text-xs">
                ⭐ Featured
              </Badge>
            )}
            {product.popular && (
              <Badge className="absolute top-2 left-2 bg-red-600/80 text-white border-0 text-xs">
                🔥 Popular
              </Badge>
            )}
          </div>

          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-medium text-white text-sm mb-1">{product.name}</h3>
                <p className="text-xs text-gray-400 mb-2">{product.description}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-purple-400">${product.sellingPrice}</div>
                <div className="text-xs text-gray-500">{product.markup}% margin</div>
              </div>
            </div>

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 1 && (
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">Size:</label>
                <select 
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                >
                  {product.sizes.map(size => (
                    <option key={size} value={size}>{size}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 1 && (
              <div className="mb-3">
                <label className="text-xs text-gray-400 mb-1 block">Color:</label>
                <select 
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value)}
                  className="w-full text-xs bg-gray-700 border border-gray-600 rounded px-2 py-1 text-white"
                >
                  {product.colors.map(color => (
                    <option key={color} value={color}>{color}</option>
                  ))}
                </select>
              </div>
            )}

            <Button 
              onClick={() => addToCart(product.id, selectedSize, selectedColor)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white text-sm"
              size="sm"
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
          </CardContent>
        </div>
      </Card>
    )
  }

  // Show payment gateway if checkout initiated
  if (showPaymentGateway) {
    return (
      <PaymentGateway
        cartItems={cart}
        totalAmount={getTotalPrice()}
        sealArrayImage={sealArrayImage}
        onBack={handlePaymentBack}
        onSuccess={handlePaymentSuccess}
      />
    )
  }

  // Show order completion message
  if (orderComplete) {
    return (
      <div className="text-center space-y-6 p-8">
        <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle className="h-10 w-10 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Order Placed Successfully!</h2>
          <p className="text-gray-400 mb-4">
            Thank you for your purchase. Your custom merchandise order has been submitted.
          </p>
          <div className="bg-gray-800/40 rounded-lg p-4 border border-gray-700/50 max-w-md mx-auto">
            <p className="text-sm text-gray-300">Order Reference:</p>
            <p className="font-mono text-purple-400 font-bold">{orderComplete}</p>
          </div>
        </div>
        <Alert className="bg-blue-900/60 border-blue-700/50 text-blue-200 max-w-2xl mx-auto">
          <AlertDescription>
            <strong>What happens next:</strong><br/>
            1. You'll receive an email confirmation shortly<br/>
            2. Your custom design will be applied to the products<br/>
            3. Items will be printed and shipped within 3-5 business days<br/>
            4. You'll receive tracking information via email
          </AlertDescription>
        </Alert>
        <Button 
          onClick={() => setOrderComplete(null)}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Place Another Order
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Category Selection */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value)
                setSelectedSubcategory('all')
              }}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="all">All Categories</option>
              {Object.entries(CATEGORIES).map(([key, category]) => (
                <option key={key} value={key}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory Selection */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Subcategory</label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              disabled={selectedCategory === 'all' || availableSubcategories.length === 0}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm disabled:opacity-50"
            >
              <option value="all">All Subcategories</option>
              {availableSubcategories.map(sub => (
                <option key={sub} value={sub}>
                  {sub.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
            >
              <option value="popular">Popular First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
              <option value="name">Name A-Z</option>
            </select>
          </div>

          {/* View Toggle */}
          <div>
            <label className="text-xs text-gray-400 mb-1 block">View</label>
            <div className="flex bg-gray-700 rounded p-1">
              <Button
                size="sm"
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                onClick={() => setViewMode('grid')}
                className="flex-1 h-8"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                onClick={() => setViewMode('list')}
                className="flex-1 h-8"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Cart Button */}
        <Button
          onClick={() => setShowCart(!showCart)}
          className="bg-purple-600 hover:bg-purple-700 text-white relative"
        >
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart ({getTotalItems()})
          {getTotalItems() > 0 && (
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center p-0">
              {getTotalItems()}
            </Badge>
          )}
        </Button>
      </div>

      {/* Progress Bar */}
      {isGeneratingMockups && (
        <div className="p-4 bg-purple-900/20 rounded-lg border border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-purple-300">Generating product mockups with your design...</span>
            <span className="text-sm text-purple-400">{mockupProgress}%</span>
          </div>
          <div className="bg-gray-700/50 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${mockupProgress}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Products Grid */}
        <div className="lg:col-span-3">
          <div className="mb-4">
            <p className="text-gray-400 text-sm">
              Showing {filteredProducts.length} products • Using: {fileName}
            </p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
              <p className="text-gray-400">Try selecting a different category</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" 
              : "space-y-4"
            }>
              {filteredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>

        {/* Shopping Cart Sidebar */}
        {showCart && (
          <div className="lg:col-span-1">
            <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <ShoppingCart className="h-5 w-5" />
                  Shopping Cart ({getTotalItems()})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.length === 0 ? (
                  <p className="text-gray-400 text-center py-8">Your cart is empty</p>
                ) : (
                  <>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {cart.map((item, index) => {
                        const product = MERCHANDISE_CATALOG[item.productId]
                        if (!product) return null

                        return (
                          <div key={`${item.productId}-${item.selectedSize}-${item.selectedColor}`} 
                               className="flex items-center gap-3 p-3 bg-gray-700/50 rounded">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-white truncate">{product.name}</h4>
                              <div className="text-xs text-gray-400">
                                {item.selectedSize && `Size: ${item.selectedSize}`}
                                {item.selectedSize && item.selectedColor && ' • '}
                                {item.selectedColor && `Color: ${item.selectedColor}`}
                              </div>
                              <div className="text-sm font-bold text-purple-400">
                                ${product.sellingPrice}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-sm text-white w-8 text-center">{item.quantity}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="h-6 w-6 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => removeFromCart(index)}
                              className="h-6 w-6 p-0 text-red-400 hover:text-red-300"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      })}
                    </div>

                    <div className="border-t border-gray-600 pt-4">
                      <div className="flex justify-between items-center mb-4">
                        <span className="font-semibold text-white">Total:</span>
                        <span className="font-bold text-xl text-purple-400">
                          ${getTotalPrice().toFixed(2)}
                        </span>
                      </div>

                      {checkoutError && (
                        <Alert className="mb-3 bg-red-900/60 border-red-700/50 text-red-200">
                          <AlertDescription className="text-xs">
                            {checkoutError}
                          </AlertDescription>
                        </Alert>
                      )}

                      <Button 
                        onClick={handleCheckout}
                        disabled={cart.length === 0}
                        className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white disabled:opacity-50"
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Proceed to Checkout
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Info Alert */}
      <Alert className="bg-blue-900/60 backdrop-blur-lg border-blue-700/50 text-blue-200">
        <Package className="h-4 w-4" />
        <AlertDescription>
          <strong>How it works:</strong> Each product shows a mockup with your seal array design. 
          Simply add items to cart and complete your purchase here. Our team will custom-produce your items 
          and send you tracking information once your order ships.
        </AlertDescription>
      </Alert>
    </div>
  )
}