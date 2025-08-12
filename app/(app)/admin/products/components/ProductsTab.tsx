'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  CubeIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  category: string
  tags: string[]
  sku: string
  status: 'draft' | 'published' | 'archived'
  is_visible: boolean
  inventory_quantity: number
  track_inventory: boolean
  weight_grams?: number
  metadata?: unknown
  created_at: string
  updated_at: string
  product_variants?: ProductVariant[]
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

const CATEGORIES = [
  'Physical Products',
  'Digital Arrays',
  'Mystical Tools',
  'Books & Guides',
  'Accessories',
  'Limited Edition'
]

const PRODUCT_STATUSES = [
  { value: 'draft', label: 'Draft', color: 'text-gray-400', bgColor: 'bg-gray-900/20' },
  { value: 'published', label: 'Published', color: 'text-green-400', bgColor: 'bg-green-900/20' },
  { value: 'archived', label: 'Archived', color: 'text-red-400', bgColor: 'bg-red-900/20' }
]

export default function ProductsTab() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  
  const [products, setProducts] = useState<Product[]>([])
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [inventoryFilter, setInventoryFilter] = useState<string>('all')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    filterProducts()
  }, [products, searchQuery, categoryFilter, statusFilter, inventoryFilter])

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(*)
        `)
        .order('created_at', { ascending: false })

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterProducts = () => {
    let filtered = products

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        product.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category === categoryFilter)
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(product => product.status === statusFilter)
    }

    // Inventory filter
    if (inventoryFilter !== 'all') {
      switch (inventoryFilter) {
        case 'in_stock':
          filtered = filtered.filter(product => 
            !product.track_inventory || product.inventory_quantity > 0
          )
          break
        case 'low_stock':
          filtered = filtered.filter(product => 
            product.track_inventory && product.inventory_quantity <= 5 && product.inventory_quantity > 0
          )
          break
        case 'out_of_stock':
          filtered = filtered.filter(product => 
            product.track_inventory && product.inventory_quantity === 0
          )
          break
      }
    }

    setFilteredProducts(filtered)
  }

  const toggleProductVisibility = async (productId: string, currentVisibility: boolean) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          is_visible: !currentVisibility,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, is_visible: !currentVisibility, updated_at: new Date().toISOString() }
          : product
      ))
    } catch (error) {
      console.error('Error toggling product visibility:', error)
      alert('Failed to update product visibility')
    }
  }

  const updateProductStatus = async (productId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', productId)

      if (error) throw error

      setProducts(products.map(product => 
        product.id === productId 
          ? { ...product, status: newStatus, updated_at: new Date().toISOString() }
          : product
      ))
    } catch (error) {
      console.error('Error updating product status:', error)
      alert('Failed to update product status')
    }
  }

  const deleteProduct = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    setDeleting(productId)
    try {
      // First delete variants
      await supabase
        .from('product_variants')
        .delete()
        .eq('product_id', productId)

      // Then delete the product
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId)

      if (error) throw error

      setProducts(products.filter(product => product.id !== productId))
    } catch (error) {
      console.error('Error deleting product:', error)
      alert('Failed to delete product')
    } finally {
      setDeleting(null)
    }
  }

  const duplicateProduct = async (productId: string) => {
    try {
      const originalProduct = products.find(p => p.id === productId)
      if (!originalProduct) return

      const { id, created_at, updated_at, product_variants, ...productData } = originalProduct
      
      const newProduct = {
        ...productData,
        title: `${originalProduct.title} (Copy)`,
        sku: `${originalProduct.sku}-copy-${Date.now()}`,
        status: 'draft',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('products')
        .insert(newProduct)
        .select()
        .single()

      if (error) throw error

      // Duplicate variants if they exist
      if (product_variants && product_variants.length > 0) {
        const newVariants = product_variants.map(variant => {
          const { id, product_id, ...variantData } = variant
          return {
            ...variantData,
            product_id: data.id,
            sku: `${variant.sku}-copy-${Date.now()}`
          }
        })

        await supabase
          .from('product_variants')
          .insert(newVariants)
      }

      await fetchProducts()
      alert('Product duplicated successfully!')
    } catch (error) {
      console.error('Error duplicating product:', error)
      alert('Failed to duplicate product')
    }
  }

  const getStatusConfig = (status: string) => {
    return PRODUCT_STATUSES.find(s => s.value === status) || PRODUCT_STATUSES[0]
  }

  const getInventoryStatus = (product: Product) => {
    if (!product.track_inventory) {
      return { text: 'Not tracked', color: 'text-gray-400' }
    }
    
    if (product.inventory_quantity === 0) {
      return { text: 'Out of stock', color: 'text-red-400' }
    } else if (product.inventory_quantity <= 5) {
      return { text: `Low stock (${product.inventory_quantity})`, color: 'text-yellow-400' }
    } else {
      return { text: `${product.inventory_quantity} in stock`, color: 'text-green-400' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white">Product Management</h3>
          <p className="text-gray-400 text-sm">{filteredProducts.length} products found</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="lg:hidden bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filters</span>
          </button>
          
          <Link
            href="/admin/products/new"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Product</span>
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-64 space-y-6">            
          <div className={`space-y-6 ${showFilters ? 'block' : 'hidden lg:block'}`}>
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search Products</label>
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Title, SKU, tags..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg pl-10 pr-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Statuses</option>
                {PRODUCT_STATUSES.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Inventory */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Inventory</label>
              <select
                value={inventoryFilter}
                onChange={(e) => setInventoryFilter(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Products</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <CubeIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 text-lg">No products found</p>
              <p className="text-gray-500 mb-6">Try adjusting your filters or create a new product</p>
              
              <Link
                href="/admin/products/new"
                className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add First Product</span>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {filteredProducts.map(product => {
                const statusConfig = getStatusConfig(product.status)
                const inventoryStatus = getInventoryStatus(product)
                
                return (
                  <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden">
                    {/* Product Image */}
                    <div className="relative aspect-square">
                      {product.images && product.images.length > 0 ? (
                        <Image
                          src={product.images[0]}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                          <PhotoIcon className="h-16 w-16 text-gray-500" />
                        </div>
                      )}
                      
                      {/* Status Badge */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg text-xs font-semibold ${statusConfig.bgColor} ${statusConfig.color} border border-current`}>
                        {statusConfig.label}
                      </div>
                      
                      {/* Visibility Badge */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => toggleProductVisibility(product.id, product.is_visible)}
                          className={`p-1 rounded-full ${product.is_visible ? 'bg-green-600' : 'bg-red-600'}`}
                          title={product.is_visible ? 'Visible to customers' : 'Hidden from customers'}
                        >
                          {product.is_visible ? (
                            <EyeIcon className="h-4 w-4 text-white" />
                          ) : (
                            <XCircleIcon className="h-4 w-4 text-white" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-lg mb-1 line-clamp-2">{product.title}</h3>
                        <p className="text-gray-400 text-sm line-clamp-2">{product.description}</p>
                      </div>

                      {/* Price and SKU */}
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="text-lg font-bold text-purple-400">
                            ${(product.price / 100).toFixed(2)} CAD
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-400">SKU: {product.sku}</div>
                        </div>
                      </div>

                      {/* Category and Tags */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-400 mb-1">
                          Category: <span className="text-white">{product.category}</span>
                        </div>
                        {product.tags && product.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {product.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded-full">
                                {tag}
                              </span>
                            ))}
                            {product.tags.length > 3 && (
                              <span className="text-xs text-gray-400">+{product.tags.length - 3} more</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Inventory Status */}
                      <div className="mb-4">
                        <span className={`text-sm ${inventoryStatus.color}`}>
                          {inventoryStatus.text}
                        </span>
                        {product.product_variants && product.product_variants.length > 0 && (
                          <div className="text-xs text-gray-400 mt-1">
                            {product.product_variants.length} variants
                          </div>
                        )}
                      </div>

                      {/* Status Selector */}
                      <div className="mb-4">
                        <select
                          value={product.status}
                          onChange={(e) => updateProductStatus(product.id, e.target.value)}
                          className={`w-full text-sm border border-gray-600 rounded-lg px-2 py-1 bg-gray-700 ${statusConfig.color} focus:outline-none focus:border-purple-500`}
                        >
                          {PRODUCT_STATUSES.map(status => (
                            <option key={status.value} value={status.value}>
                              {status.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <Link
                          href={`/admin/products/${product.id}`}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded-lg text-center transition-colors"
                        >
                          Edit
                        </Link>
                        
                        <button
                          onClick={() => duplicateProduct(product.id)}
                          className="bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-lg transition-colors"
                          title="Duplicate Product"
                        >
                          <CubeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => deleteProduct(product.id)}
                          disabled={deleting === product.id}
                          className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 px-3 py-2 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          {deleting === product.id ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* Last Updated */}
                      <div className="text-xs text-gray-500 mt-3 text-center">
                        Updated {new Date(product.updated_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}