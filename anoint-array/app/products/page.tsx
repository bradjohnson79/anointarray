'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/AuroraBackground'
import { 
  Search, 
  Filter, 
  Star, 
  ShoppingCart, 
  Eye, 
  Zap, 
  Package, 
  Grid, 
  List,
  ArrowLeft,
  Heart,
  Share2
} from 'lucide-react'
import { 
  Product, 
  ProductCategory,
  getPublishedProducts, 
  getAllCategories,
  searchProducts,
  getProductsByCategory 
} from '@/lib/products'

export default function ProductCatalogPage() {
  const router = useRouter()
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [priceRange, setPriceRange] = useState<'all' | 'under-25' | '25-50' | '50-100' | 'over-100'>('all')
  const [productType, setProductType] = useState<'all' | 'physical' | 'digital'>('all')
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high' | 'name'>('newest')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [cart, setCart] = useState<{productId: string, quantity: number}[]>([])

  useEffect(() => {
    const publishedProducts = getPublishedProducts()
    setProducts(publishedProducts)
    setFilteredProducts(publishedProducts)
    setCategories(getAllCategories())
  }, [])

  useEffect(() => {
    let filtered = products

    // Apply search
    if (searchTerm) {
      filtered = searchProducts(searchTerm).filter(p => p.status === 'published' && p.isVisible)
    }

    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Apply product type filter
    if (productType !== 'all') {
      filtered = filtered.filter(product => product.productType === productType)
    }

    // Apply price range filter
    if (priceRange !== 'all') {
      filtered = filtered.filter(product => {
        switch (priceRange) {
          case 'under-25': return product.price < 25
          case '25-50': return product.price >= 25 && product.price < 50
          case '50-100': return product.price >= 50 && product.price < 100
          case 'over-100': return product.price >= 100
          default: return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low': return a.price - b.price
        case 'price-high': return b.price - a.price
        case 'name': return a.title.localeCompare(b.title)
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
    })

    setFilteredProducts(filtered)
  }, [products, searchTerm, selectedCategory, priceRange, productType, sortBy])

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId)
      if (existing) {
        return prev.map(item => 
          item.productId === productId 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }
      return [...prev, { productId, quantity: 1 }]
    })
    
    // Show feedback
    const button = document.querySelector(`[data-product="${productId}"]`)
    if (button) {
      const originalText = button.textContent
      button.textContent = 'Added!'
      button.classList.add('bg-green-600')
      setTimeout(() => {
        button.textContent = originalText
        button.classList.remove('bg-green-600')
      }, 1000)
    }
  }

  const getCartQuantity = (productId: string) => {
    const item = cart.find(item => item.productId === productId)
    return item ? item.quantity : 0
  }

  const getTotalCartItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const formatPrice = (price: number, compareAtPrice?: number) => {
    if (compareAtPrice && compareAtPrice > price) {
      return (
        <div className="flex items-center space-x-2">
          <span className="text-lg font-bold text-purple-400">${price.toFixed(2)}</span>
          <span className="text-sm text-gray-400 line-through">${compareAtPrice.toFixed(2)}</span>
          <span className="text-xs bg-red-500 text-white px-2 py-1 rounded-full">
            {Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}% OFF
          </span>
        </div>
      )
    }
    return <span className="text-lg font-bold text-purple-400">${price.toFixed(2)}</span>
  }

  const ProductCard = ({ product }: { product: Product }) => (
    <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg overflow-hidden border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 group">
      {/* Product Image */}
      <div className="relative h-48 bg-gray-700/50 overflow-hidden">
        {product.images.length > 0 ? (
          <img
            src={product.images[product.mainImageIndex]}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-16 h-16 text-gray-400" />
          </div>
        )}
        
        {/* Product Type Badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            product.productType === 'digital'
              ? 'bg-purple-600/80 text-purple-200'
              : 'bg-blue-600/80 text-blue-200'
          }`}>
            {product.productType === 'digital' ? (
              <><Zap className="w-3 h-3 inline mr-1" />Digital</>
            ) : (
              <><Package className="w-3 h-3 inline mr-1" />Physical</>
            )}
          </span>
        </div>

        {/* Sale Badge */}
        {product.compareAtPrice && product.compareAtPrice > product.price && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
              SALE
            </span>
          </div>
        )}

        {/* Quick Actions */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center space-x-3">
          <button
            onClick={() => router.push(`/products/${product.slug}`)}
            className="p-2 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
            title="View Details"
          >
            <Eye size={18} />
          </button>
          <button
            className="p-2 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
            title="Add to Wishlist"
          >
            <Heart size={18} />
          </button>
          <button
            className="p-2 bg-white/20 backdrop-blur-lg rounded-full text-white hover:bg-white/30 transition-colors"
            title="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Product Info */}
      <div className="p-4">
        <div className="mb-2">
          <h3 className="font-semibold text-white text-lg mb-1 line-clamp-2">{product.title}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
        </div>

        {/* Category */}
        <div className="mb-3">
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-700/50 text-gray-300">
            {categories.find(c => c.id === product.category)?.name || product.category}
          </span>
        </div>

        {/* Price */}
        <div className="mb-4">
          {formatPrice(product.price, product.compareAtPrice)}
        </div>

        {/* Stock Status for Physical Products */}
        {product.productType === 'physical' && product.inventory !== undefined && (
          <div className="mb-3">
            {product.inventory > (product.lowStockThreshold || 0) ? (
              <span className="text-green-400 text-sm">✓ In Stock ({product.inventory} available)</span>
            ) : product.inventory > 0 ? (
              <span className="text-yellow-400 text-sm">⚠ Low Stock ({product.inventory} left)</span>
            ) : (
              <span className="text-red-400 text-sm">✗ Out of Stock</span>
            )}
          </div>
        )}

        {/* Keywords */}
        <div className="mb-4 flex flex-wrap gap-1">
          {product.keywords.slice(0, 3).map((keyword, index) => (
            <span key={index} className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full text-xs">
              {keyword}
            </span>
          ))}
          {product.keywords.length > 3 && (
            <span className="px-2 py-1 bg-gray-600/20 text-gray-400 rounded-full text-xs">
              +{product.keywords.length - 3} more
            </span>
          )}
        </div>

        {/* Add to Cart */}
        <div className="flex items-center space-x-2">
          <button
            data-product={product.id}
            onClick={() => addToCart(product.id)}
            disabled={product.productType === 'physical' && product.inventory === 0}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
          >
            <ShoppingCart size={16} />
            <span>Add to Cart</span>
          </button>
          
          {getCartQuantity(product.id) > 0 && (
            <div className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
              {getCartQuantity(product.id)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const ProductListItem = ({ product }: { product: Product }) => (
    <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50 hover:border-purple-500/50 transition-all duration-300 p-6">
      <div className="flex items-start space-x-6">
        {/* Product Image */}
        <div className="w-32 h-32 bg-gray-700/50 rounded-lg overflow-hidden flex-shrink-0">
          {product.images.length > 0 ? (
            <img
              src={product.images[product.mainImageIndex]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-400" />
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center space-x-2 mb-2">
                {product.productType === 'digital' ? (
                  <Zap className="w-4 h-4 text-purple-400" />
                ) : (
                  <Package className="w-4 h-4 text-blue-400" />
                )}
                <h3 className="text-xl font-semibold text-white">{product.title}</h3>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <span className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                    SALE
                  </span>
                )}
              </div>
              <p className="text-gray-400 mb-3 line-clamp-2">{product.description}</p>
              
              {/* Category and Keywords */}
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="px-2 py-1 bg-gray-700/50 text-gray-300 rounded-full text-sm">
                  {categories.find(c => c.id === product.category)?.name || product.category}
                </span>
                {product.keywords.slice(0, 4).map((keyword, index) => (
                  <span key={index} className="px-2 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
            
            <div className="text-right">
              {formatPrice(product.price, product.compareAtPrice)}
            </div>
          </div>

          {/* Stock Status and Actions */}
          <div className="flex items-center justify-between">
            <div>
              {product.productType === 'physical' && product.inventory !== undefined && (
                <div className="mb-2">
                  {product.inventory > (product.lowStockThreshold || 0) ? (
                    <span className="text-green-400 text-sm">✓ In Stock ({product.inventory} available)</span>
                  ) : product.inventory > 0 ? (
                    <span className="text-yellow-400 text-sm">⚠ Low Stock ({product.inventory} left)</span>
                  ) : (
                    <span className="text-red-400 text-sm">✗ Out of Stock</span>
                  )}
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push(`/products/${product.slug}`)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                View Details
              </button>
              
              <div className="flex items-center space-x-2">
                <button
                  data-product={product.id}
                  onClick={() => addToCart(product.id)}
                  disabled={product.productType === 'physical' && product.inventory === 0}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
                >
                  <ShoppingCart size={16} />
                  <span>Add to Cart</span>
                </button>
                
                {getCartQuantity(product.id) > 0 && (
                  <div className="px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium">
                    {getCartQuantity(product.id)}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <AuroraBackground variant="subtle" />
      
      {/* Header */}
      <div className="relative z-10 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Product Catalog</h1>
                <p className="text-gray-400 mt-1">Discover our spiritual and wellness products</p>
              </div>
            </div>
            
            {/* Cart Button */}
            <button
              onClick={() => router.push('/cart')}
              className="relative flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <ShoppingCart size={20} />
              <span>Cart</span>
              {getTotalCartItems() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                  {getTotalCartItems()}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="relative z-10 bg-gray-800/60 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
            {/* Search */}
            <div className="lg:col-span-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="lg:col-span-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>

              <select
                value={productType}
                onChange={(e) => setProductType(e.target.value as any)}
                className="px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Types</option>
                <option value="physical">Physical</option>
                <option value="digital">Digital</option>
              </select>

              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value as any)}
                className="px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Prices</option>
                <option value="under-25">Under $25</option>
                <option value="25-50">$25 - $50</option>
                <option value="50-100">$50 - $100</option>
                <option value="over-100">Over $100</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="newest">Newest First</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="name">Name A-Z</option>
              </select>
            </div>

            {/* View Toggle */}
            <div className="lg:col-span-2 flex justify-end">
              <div className="flex bg-gray-700/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <Grid size={18} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-purple-600 text-white' : 'text-gray-400 hover:text-white'}`}
                >
                  <List size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Results Info */}
        <div className="mb-6">
          <p className="text-gray-400">
            Showing {filteredProducts.length} of {products.length} products
          </p>
        </div>

        {/* Product Grid/List */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No products found</h3>
            <p className="text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredProducts.map(product => (
              <ProductListItem key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}