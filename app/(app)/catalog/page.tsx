'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { ShoppingCartIcon, HeartIcon, FunnelIcon, MagnifyingGlassIcon, StarIcon } from '@heroicons/react/24/outline'
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'

interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  category: string
  tags: string[]
  sku: string
  status: string
  is_visible: boolean
  inventory_quantity: number
  track_inventory: boolean
  weight_grams?: number
  metadata?: any
  created_at: string
  variants?: ProductVariant[]
}

interface ProductVariant {
  id: string
  product_id: string
  title: string
  price: number
  sku: string
  inventory_quantity: number
  option1?: string
  option2?: string
  option3?: string
}

interface CartItem {
  product_id: string
  variant_id?: string
  title: string
  price: number
  quantity: number
  image?: string
  sku?: string
}

const CATEGORIES = [
  'All',
  'Physical Products',
  'Digital Arrays',
  'Mystical Tools',
  'Books & Guides',
  'Accessories',
  'Limited Edition'
]

const SORT_OPTIONS = [
  { label: 'Featured', value: 'featured' },
  { label: 'Price: Low to High', value: 'price_asc' },
  { label: 'Price: High to Low', value: 'price_desc' },
  { label: 'Newest First', value: 'newest' },
  { label: 'Best Selling', value: 'bestselling' },
]

export default function CatalogPage() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [cart, setCart] = useState<CartItem[]>([])
  const [wishlist, setWishlist] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  
  // Filter states
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('featured')
  const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 })
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    checkUser()
    fetchProducts()
    loadCartFromStorage()
    loadWishlistFromStorage()
  }, [])

  useEffect(() => {
    filterAndSortProducts()
  }, [products, selectedCategory, searchQuery, sortBy, priceRange])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
  }

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, title, description, price, images, category, tags, sku,
          status, is_visible, inventory_quantity, track_inventory,
          weight_grams, metadata, created_at,
          product_variants(*)
        `)
        .eq('status', 'published')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortProducts = () => {
    let filtered = products

    // Category filter
    if (selectedCategory !== 'All') {
      filtered = filtered.filter(product => product.category === selectedCategory)
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Price range filter
    filtered = filtered.filter(product =>
      product.price >= priceRange.min * 100 && 
      product.price <= priceRange.max * 100
    )

    // Sort products
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price)
        break
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price)
        break
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'bestselling':
        // Would sort by sales data if available
        filtered.sort((a, b) => (b.metadata?.sales_count || 0) - (a.metadata?.sales_count || 0))
        break
      default: // featured
        filtered.sort((a, b) => (b.metadata?.featured ? 1 : 0) - (a.metadata?.featured ? 1 : 0))
    }

    setFilteredProducts(filtered)
  }

  const loadCartFromStorage = () => {
    const saved = localStorage.getItem('anoint-cart')
    if (saved) {
      try {
        setCart(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading cart from storage:', error)
      }
    }
  }

  const loadWishlistFromStorage = () => {
    const saved = localStorage.getItem('anoint-wishlist')
    if (saved) {
      try {
        setWishlist(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading wishlist from storage:', error)
      }
    }
  }

  const saveCartToStorage = (newCart: CartItem[]) => {
    localStorage.setItem('anoint-cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const saveWishlistToStorage = (newWishlist: string[]) => {
    localStorage.setItem('anoint-wishlist', JSON.stringify(newWishlist))
    setWishlist(newWishlist)
  }

  const addToCart = (product: Product, variantId?: string) => {
    const variant = variantId ? product.variants?.find(v => v.id === variantId) : null
    const price = variant?.price || product.price
    const title = variant ? `${product.title} - ${variant.title}` : product.title
    const sku = variant?.sku || product.sku

    const existingItemIndex = cart.findIndex(item => 
      item.product_id === product.id && item.variant_id === variantId
    )

    let newCart: CartItem[]
    if (existingItemIndex >= 0) {
      newCart = [...cart]
      newCart[existingItemIndex].quantity += 1
    } else {
      const newItem: CartItem = {
        product_id: product.id,
        variant_id: variantId,
        title,
        price,
        quantity: 1,
        image: product.images[0],
        sku
      }
      newCart = [...cart, newItem]
    }

    saveCartToStorage(newCart)
  }

  const toggleWishlist = (productId: string) => {
    const isInWishlist = wishlist.includes(productId)
    const newWishlist = isInWishlist
      ? wishlist.filter(id => id !== productId)
      : [...wishlist, productId]

    saveWishlistToStorage(newWishlist)
  }

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading mystical products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-purple-400">Mystical Catalog</h1>
              <p className="text-gray-400 mt-1">Discover powerful tools and ancient wisdom</p>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/cart')}
                className="relative bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                <span>Cart</span>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-600 text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-64 space-y-6">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="lg:hidden w-full bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg flex items-center justify-center space-x-2"
            >
              <FunnelIcon className="h-5 w-5" />
              <span>Filters</span>
            </button>
            
            <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
                <div className="relative">
                  <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Categories</label>
                <div className="space-y-2">
                  {CATEGORIES.map(category => (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                        selectedCategory === category
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Price Range</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="500"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange({...priceRange, max: parseInt(e.target.value)})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>$0</span>
                    <span>${priceRange.max}</span>
                  </div>
                </div>
              </div>

              {/* Sort */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                >
                  {SORT_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 text-lg">No products found matching your criteria.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All')
                    setSearchQuery('')
                    setPriceRange({ min: 0, max: 10000 })
                  }}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors group">
                    {/* Product Image */}
                    <div className="relative aspect-square">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <span className="text-gray-500 text-4xl">🔮</span>
                        </div>
                      )}
                      
                      {/* Wishlist Button */}
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="absolute top-2 right-2 p-2 bg-black bg-opacity-50 rounded-full hover:bg-opacity-75 transition-colors"
                      >
                        {wishlist.includes(product.id) ? (
                          <HeartSolidIcon className="h-5 w-5 text-red-500" />
                        ) : (
                          <HeartIcon className="h-5 w-5 text-white" />
                        )}
                      </button>

                      {/* Featured Badge */}
                      {product.metadata?.featured && (
                        <div className="absolute top-2 left-2 bg-purple-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          Featured
                        </div>
                      )}

                      {/* Sale Badge */}
                      {product.metadata?.sale_price && (
                        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-lg text-xs font-semibold">
                          Sale
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-2 line-clamp-2">{product.title}</h3>
                      
                      {/* Rating */}
                      <div className="flex items-center space-x-1 mb-2">
                        {[1, 2, 3, 4, 5].map(star => (
                          <StarSolidIcon
                            key={star}
                            className={`h-4 w-4 ${
                              star <= (product.metadata?.rating || 0)
                                ? 'text-yellow-400'
                                : 'text-gray-600'
                            }`}
                          />
                        ))}
                        <span className="text-sm text-gray-400 ml-2">
                          ({product.metadata?.review_count || 0})
                        </span>
                      </div>

                      <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>

                      {/* Price */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-2">
                          {product.metadata?.sale_price ? (
                            <>
                              <span className="text-lg font-bold text-purple-400">
                                ${(product.metadata.sale_price / 100).toFixed(2)}
                              </span>
                              <span className="text-sm text-gray-500 line-through">
                                ${(product.price / 100).toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-lg font-bold text-purple-400">
                              ${(product.price / 100).toFixed(2)} CAD
                            </span>
                          )}
                        </div>
                        
                        {product.track_inventory && product.inventory_quantity <= 5 && (
                          <span className="text-xs text-orange-400">
                            Only {product.inventory_quantity} left
                          </span>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="space-y-2">
                        <button
                          onClick={() => addToCart(product)}
                          disabled={product.track_inventory && product.inventory_quantity === 0}
                          className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed px-4 py-2 rounded-lg transition-colors flex items-center justify-center space-x-2"
                        >
                          <ShoppingCartIcon className="h-4 w-4" />
                          <span>
                            {product.track_inventory && product.inventory_quantity === 0
                              ? 'Out of Stock'
                              : 'Add to Cart'
                            }
                          </span>
                        </button>

                        <button
                          onClick={() => router.push(`/products/${product.id}`)}
                          className="w-full bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      </div>

                      {/* Tags */}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {product.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}