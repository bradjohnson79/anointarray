'use client'

import { useState, useEffect } from 'react'
import { 
  Package, Plus, Search, Edit, Trash2, Eye, Star, Archive, 
  Grid, List, Filter, Upload, Save, X, DollarSign, Zap, 
  BarChart3, ShoppingCart, FileText, Globe, Settings
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { ProductsAPI, ProductCategoriesAPI, Product, ProductCategory } from '@/lib/supabase-products'

interface ProductFilters {
  category_id?: string
  status?: 'draft' | 'published' | 'archived'
  product_type?: 'physical' | 'digital'
  is_featured?: boolean
  search?: string
}

interface ProductFormData {
  title: string
  sku: string
  slug: string
  description: string
  short_description: string
  price: number
  compare_at_price?: number
  cost_price?: number
  category_id?: string
  keywords: string[]
  product_type: 'physical' | 'digital'
  images: string[]
  main_image_index: number
  
  // Digital fields
  digital_file_url?: string
  file_size?: number
  download_limit?: number
  license_type?: string
  
  // Physical fields
  weight?: number
  dimensions?: { length: number; width: number; height: number }
  inventory_quantity: number
  track_inventory: boolean
  allow_backorder: boolean
  low_stock_threshold: number
  
  // Settings
  requires_shipping: boolean
  is_taxable: boolean
  is_visible: boolean
  is_featured: boolean
  status: 'draft' | 'published' | 'archived'
  
  // SEO
  meta_title?: string
  meta_description?: string
  meta_keywords?: string
}

const initialFormData: ProductFormData = {
  title: '',
  sku: '',
  slug: '',
  description: '',
  short_description: '',
  price: 0,
  category_id: '',
  keywords: [],
  product_type: 'digital',
  images: [],
  main_image_index: 0,
  inventory_quantity: 0,
  track_inventory: true,
  allow_backorder: false,
  low_stock_threshold: 5,
  requires_shipping: false,
  is_taxable: true,
  is_visible: true,
  is_featured: false,
  status: 'draft'
}

function ProductForm({ 
  product, 
  categories, 
  onSave, 
  onCancel 
}: { 
  product?: Product | null
  categories: ProductCategory[]
  onSave: (data: ProductFormData) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState<ProductFormData>(
    product ? {
      title: product.title,
      sku: product.sku,
      slug: product.slug,
      description: product.description || '',
      short_description: product.short_description || '',
      price: product.price,
      compare_at_price: product.compare_at_price,
      cost_price: product.cost_price,
      category_id: product.category_id || '',
      keywords: product.keywords,
      product_type: product.product_type,
      images: product.images,
      main_image_index: product.main_image_index,
      digital_file_url: product.digital_file_url,
      file_size: product.file_size,
      download_limit: product.download_limit,
      license_type: product.license_type,
      weight: product.weight,
      dimensions: product.dimensions,
      inventory_quantity: product.inventory_quantity,
      track_inventory: product.track_inventory,
      allow_backorder: product.allow_backorder,
      low_stock_threshold: product.low_stock_threshold,
      requires_shipping: product.requires_shipping,
      is_taxable: product.is_taxable,
      is_visible: product.is_visible,
      is_featured: product.is_featured,
      status: product.status,
      meta_title: product.meta_title,
      meta_description: product.meta_description,
      meta_keywords: product.meta_keywords
    } : initialFormData
  )

  const generateSlug = (title: string) => {
    return title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const generateSKU = () => {
    const prefix = formData.product_type === 'digital' ? 'DIG' : 'PHY'
    const timestamp = Date.now().toString().slice(-6)
    return `${prefix}-${timestamp}`
  }

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: prev.slug || generateSlug(title)
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Auto-generate SKU if empty
    if (!formData.sku) {
      formData.sku = generateSKU()
    }
    
    onSave(formData)
  }

  const addKeyword = (keyword: string) => {
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData(prev => ({
        ...prev,
        keywords: [...prev.keywords, keyword]
      }))
    }
  }

  const removeKeyword = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords.filter(k => k !== keyword)
    }))
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-gray-800 rounded-xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-800 p-6 border-b border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">
            {product ? 'Edit Product' : 'Create New Product'}
          </h2>
          <button onClick={onCancel} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  SKU
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                    className="flex-1 bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    placeholder="Auto-generated if empty"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, sku: generateSKU() }))}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  URL Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none font-mono text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, category_id: e.target.value }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="">Select category...</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Type
                </label>
                <select
                  value={formData.product_type}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    product_type: e.target.value as 'physical' | 'digital',
                    requires_shipping: e.target.value === 'physical'
                  }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="digital">Digital Product</option>
                  <option value="physical">Physical Product</option>
                </select>
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Short Description
              </label>
              <textarea
                value={formData.short_description}
                onChange={(e) => setFormData(prev => ({ ...prev, short_description: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                rows={2}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-1">{formData.short_description.length}/500 characters</p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Full Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                rows={6}
              />
            </div>
          </div>

          {/* Pricing */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              Pricing
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Price * ($)
                </label>
                <input
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  step="0.01"
                  min="0"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Compare at Price ($)
                </label>
                <input
                  type="number"
                  value={formData.compare_at_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, compare_at_price: parseFloat(e.target.value) || undefined }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cost Price ($)
                </label>
                <input
                  type="number"
                  value={formData.cost_price || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, cost_price: parseFloat(e.target.value) || undefined }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Inventory (Physical Products) */}
          {formData.product_type === 'physical' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Inventory & Shipping
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Quantity
                  </label>
                  <input
                    type="number"
                    value={formData.inventory_quantity}
                    onChange={(e) => setFormData(prev => ({ ...prev, inventory_quantity: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Weight (g)
                  </label>
                  <input
                    type="number"
                    value={formData.weight || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: parseFloat(e.target.value) || undefined }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    step="0.1"
                    min="0"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.track_inventory}
                    onChange={(e) => setFormData(prev => ({ ...prev, track_inventory: e.target.checked }))}
                    className="mr-3"
                  />
                  <span className="text-gray-300">Track inventory for this product</span>
                </label>

                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.allow_backorder}
                    onChange={(e) => setFormData(prev => ({ ...prev, allow_backorder: e.target.checked }))}
                    className="mr-3"
                  />
                  <span className="text-gray-300">Allow backorders when out of stock</span>
                </label>
              </div>
            </div>
          )}

          {/* Digital Product Settings */}
          {formData.product_type === 'digital' && (
            <div>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5" />
                Digital Product Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Download Limit
                  </label>
                  <input
                    type="number"
                    value={formData.download_limit || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, download_limit: parseInt(e.target.value) || undefined }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    min="-1"
                    placeholder="-1 for unlimited"
                  />
                  <p className="text-xs text-gray-400 mt-1">-1 for unlimited downloads</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    License Type
                  </label>
                  <select
                    value={formData.license_type || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, license_type: e.target.value || undefined }))}
                    className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">Select license...</option>
                    <option value="personal">Personal Use</option>
                    <option value="commercial">Commercial Use</option>
                    <option value="extended">Extended License</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Settings */}
          <div>
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Product Settings
            </h3>
            <div className="space-y-3">
              <label className="flex items-center justify-between">
                <span className="text-gray-300">Visible to customers</span>
                <input
                  type="checkbox"
                  checked={formData.is_visible}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_visible: e.target.checked }))}
                  className="ml-3"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-300">Featured product</span>
                <input
                  type="checkbox"
                  checked={formData.is_featured}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_featured: e.target.checked }))}
                  className="ml-3"
                />
              </label>

              <label className="flex items-center justify-between">
                <span className="text-gray-300">Taxable product</span>
                <input
                  type="checkbox"
                  checked={formData.is_taxable}
                  onChange={(e) => setFormData(prev => ({ ...prev, is_taxable: e.target.checked }))}
                  className="ml-3"
                />
              </label>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'draft' | 'published' | 'archived' }))}
                  className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ProductCard({ product, onEdit, onDelete, onToggleFeatured }: {
  product: Product
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
  onToggleFeatured: (product: Product) => void
}) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-900/50 text-green-300'
      case 'draft': return 'bg-yellow-900/50 text-yellow-300'
      case 'archived': return 'bg-gray-700/50 text-gray-300'
      default: return 'bg-gray-700/50 text-gray-300'
    }
  }

  const getStockStatus = (product: Product) => {
    if (product.product_type === 'digital') return null
    if (!product.track_inventory) return 'Not tracked'
    if (product.inventory_quantity <= 0) return 'Out of stock'
    if (product.inventory_quantity <= product.low_stock_threshold) return 'Low stock'
    return `${product.inventory_quantity} in stock`
  }

  const stockStatus = getStockStatus(product)

  return (
    <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-purple-500/20 hover:border-purple-500/40 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="font-semibold text-white text-lg">{product.title}</h3>
            {product.is_featured && (
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
            )}
          </div>
          <p className="text-gray-400 text-sm mb-2">SKU: {product.sku}</p>
          <p className="text-gray-300 text-sm line-clamp-2">{product.short_description || product.description}</p>
        </div>
      </div>

      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <span className="text-2xl font-bold text-white">${product.price.toFixed(2)}</span>
          {product.compare_at_price && product.compare_at_price > product.price && (
            <span className="text-gray-400 line-through">${product.compare_at_price.toFixed(2)}</span>
          )}
        </div>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(product.status)}`}>
          {product.status}
        </span>
      </div>

      <div className="flex justify-between items-center mb-4 text-sm">
        <span className="text-gray-400">
          Type: <span className="text-white capitalize">{product.product_type}</span>
        </span>
        {stockStatus && (
          <span className={`${
            stockStatus.includes('Out of stock') ? 'text-red-400' :
            stockStatus.includes('Low stock') ? 'text-yellow-400' :
            'text-green-400'
          }`}>
            {stockStatus}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onEdit(product)}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 px-3 rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button
          onClick={() => onToggleFeatured(product)}
          className={`py-2 px-3 rounded-lg transition-colors ${
            product.is_featured
              ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
              : 'bg-gray-600 hover:bg-gray-700 text-white'
          }`}
        >
          <Star className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(product)}
          className="bg-red-600 hover:bg-red-700 text-white py-2 px-3 rounded-lg transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

export default function EnhancedProductManagement() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [filters, setFilters] = useState<ProductFilters>({})
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Load initial data
  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      setLoading(true)
      const [productsData, categoriesData] = await Promise.all([
        ProductsAPI.getAll({ ...filters, search: searchTerm }),
        ProductCategoriesAPI.getAll()
      ])
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProduct = () => {
    setEditingProduct(null)
    setShowForm(true)
  }

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product)
    setShowForm(true)
  }

  const handleSaveProduct = async (formData: ProductFormData) => {
    try {
      if (editingProduct) {
        await ProductsAPI.update(editingProduct.id, formData)
      } else {
        await ProductsAPI.create(formData)
      }
      setShowForm(false)
      setEditingProduct(null)
      loadData()
    } catch (error) {
      console.error('Failed to save product:', error)
    }
  }

  const handleDeleteProduct = async (product: Product) => {
    if (confirm(`Are you sure you want to delete "${product.title}"?`)) {
      try {
        await ProductsAPI.delete(product.id)
        loadData()
      } catch (error) {
        console.error('Failed to delete product:', error)
      }
    }
  }

  const handleToggleFeatured = async (product: Product) => {
    try {
      await ProductsAPI.update(product.id, { is_featured: !product.is_featured })
      loadData()
    } catch (error) {
      console.error('Failed to toggle featured status:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setFilters(prev => ({ ...prev, search: searchTerm }))
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Product Management</h1>
                <p className="text-gray-400">Manage your digital and physical products with Supabase integration</p>
              </div>
              <button
                onClick={handleCreateProduct}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>

            {/* Search and Filters */}
            <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20">
              <div className="flex flex-col md:flex-row gap-4">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search products..."
                      className="w-full bg-gray-700 text-white rounded-lg pl-10 pr-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Search
                  </button>
                </form>

                <div className="flex gap-2">
                  <select
                    value={filters.category_id || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, category_id: e.target.value || undefined }))}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">All Categories</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={filters.status || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any || undefined }))}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">All Status</option>
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>

                  <select
                    value={filters.product_type || ''}
                    onChange={(e) => setFilters(prev => ({ ...prev, product_type: e.target.value as any || undefined }))}
                    className="bg-gray-700 text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-purple-500 focus:outline-none"
                  >
                    <option value="">All Types</option>
                    <option value="digital">Digital</option>
                    <option value="physical">Physical</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="text-white text-lg">Loading products...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl text-white mb-2">No products found</h3>
              <p className="text-gray-400 mb-6">Get started by creating your first product</p>
              <button
                onClick={handleCreateProduct}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg inline-flex items-center gap-2 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Product
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onEdit={handleEditProduct}
                  onDelete={handleDeleteProduct}
                  onToggleFeatured={handleToggleFeatured}
                />
              ))}
            </div>
          )}

          {/* Product Form Modal */}
          {showForm && (
            <ProductForm
              product={editingProduct}
              categories={categories}
              onSave={handleSaveProduct}
              onCancel={() => {
                setShowForm(false)
                setEditingProduct(null)
              }}
            />
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}