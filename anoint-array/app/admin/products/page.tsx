'use client'

import { useState, useEffect, useCallback, memo } from 'react'
import ProtectedRoute from '@/components/ProtectedRoute'
import Layout from '@/components/Layout'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  Eye, 
  Edit, 
  Trash2, 
  Upload,
  Save,
  X,
  Image as ImageIcon,
  FileText,
  DollarSign,
  Zap,
  Archive,
  Star,
  Grid
} from 'lucide-react'
import { 
  Product, 
  ProductCategory,
  getAllProducts, 
  getAllCategories,
  getProductById,
  generateSKU,
  createSlug 
} from '@/lib/products'

interface FeaturedProduct {
  id: string
  title: string
  description: string
  productType: 'digital' | 'physical'
  price: number
  featuredImage: string
}

interface ProductsPreviewTabProps {
  featuredProducts: FeaturedProduct[]
  onProductChange: (index: number, field: keyof FeaturedProduct, value: string | number) => void
  onImageUpload: (index: number, event: React.ChangeEvent<HTMLInputElement>) => void
  onSave: () => void
}

const ProductsPreviewTab = memo(({ featuredProducts, onProductChange, onImageUpload, onSave }: ProductsPreviewTabProps) => {
  const handleImageRemove = useCallback((index: number) => {
    const product = featuredProducts[index]
    if (product.featuredImage && product.featuredImage.startsWith('blob:')) {
      URL.revokeObjectURL(product.featuredImage)
    }
    onProductChange(index, 'featuredImage', '')
  }, [featuredProducts, onProductChange])

  return (
    <div className="p-6 min-h-full">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Products Preview</h1>
            <p className="text-gray-400">Manage the 6 featured products that appear on your homepage</p>
          </div>
          <button
            onClick={onSave}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <Save size={16} />
            <span>Save Featured Products</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 auto-rows-fr min-h-fit">
          {featuredProducts.map((product, index) => (
            <div key={`product-${product.id}`} className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Featured Image <span className="text-xs text-gray-500">(Product {index + 1}/6)</span>
                </label>
                <div className="relative">
                  {product.featuredImage ? (
                    <div className="relative">
                      <img
                        src={product.featuredImage}
                        alt={product.title || 'Featured product'}
                        className="w-full h-32 object-cover rounded-lg border border-gray-600"
                      />
                      <button
                        onClick={() => handleImageRemove(index)}
                        className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full"
                        type="button"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                      <Upload className="w-8 h-8 text-gray-400 mb-2" />
                      <span className="text-sm text-gray-400">Upload Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => onImageUpload(index, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Product Title
                  </label>
                  <input
                    type="text"
                    value={product.title}
                    onChange={(e) => onProductChange(index, 'title', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Enter product title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <textarea
                    value={product.description}
                    onChange={(e) => onProductChange(index, 'description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    placeholder="Enter product description"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Type
                    </label>
                    <select
                      value={product.productType}
                      onChange={(e) => onProductChange(index, 'productType', e.target.value as 'digital' | 'physical')}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                    >
                      <option value="digital">Digital</option>
                      <option value="physical">Physical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Price ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={product.price}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value)
                        if (!isNaN(value) && value >= 0) {
                          onProductChange(index, 'price', value)
                        }
                      }}
                      className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
})

ProductsPreviewTab.displayName = 'ProductsPreviewTab'

export default function ProductManagementPage() {
  const [activeTab, setActiveTab] = useState<'preview' | 'products'>('preview')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [isCreatingNew, setIsCreatingNew] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  // Featured products state
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([
    { id: '1', title: '', description: '', productType: 'digital', price: 0, featuredImage: '' },
    { id: '2', title: '', description: '', productType: 'digital', price: 0, featuredImage: '' },
    { id: '3', title: '', description: '', productType: 'digital', price: 0, featuredImage: '' },
    { id: '4', title: '', description: '', productType: 'digital', price: 0, featuredImage: '' },
    { id: '5', title: '', description: '', productType: 'digital', price: 0, featuredImage: '' },
    { id: '6', title: '', description: '', productType: 'digital', price: 0, featuredImage: '' }
  ])

  // Form state
  const [formData, setFormData] = useState<Partial<Product>>({
    title: '',
    description: '',
    price: 0,
    compareAtPrice: undefined,
    category: '',
    keywords: [],
    productType: 'physical',
    status: 'draft',
    isVisible: true,
    images: [],
    mainImageIndex: 0,
    weight: undefined,
    dimensions: undefined,
    inventory: undefined,
    lowStockThreshold: undefined,
    digitalFile: undefined,
    fileSize: undefined,
    downloadLimit: 3,
    instructionsPdf: undefined,
    metaTitle: '',
    metaDescription: ''
  })

  useEffect(() => {
    setProducts(getAllProducts())
    setCategories(getAllCategories())
  }, [])

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || product.category === filterCategory
    const matchesStatus = filterStatus === 'all' || product.status === filterStatus
    
    return matchesSearch && matchesCategory && matchesStatus
  })

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product)
    setIsCreatingNew(false)
    setFormData({
      ...product,
      keywords: [...product.keywords]
    })
  }

  const handleNewProduct = () => {
    setIsCreatingNew(true)
    setSelectedProduct(null)
    setFormData({
      title: '',
      description: '',
      price: 0,
      compareAtPrice: undefined,
      category: '',
      keywords: [],
      productType: 'physical',
      status: 'draft',
      isVisible: true,
      images: [],
      mainImageIndex: 0,
      weight: undefined,
      dimensions: undefined,
      inventory: undefined,
      lowStockThreshold: undefined,
      digitalFile: undefined,
      fileSize: undefined,
      downloadLimit: 3,
      instructionsPdf: undefined,
      metaTitle: '',
      metaDescription: ''
    })
  }

  const handleInputChange = (field: string, value: string | number | boolean | string[] | undefined) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    // Auto-generate slug and SKU when title changes
    if (field === 'title' && value) {
      setFormData(prev => ({
        ...prev,
        slug: createSlug(value),
        sku: isCreatingNew ? generateSKU(value) : prev.sku,
        metaTitle: !prev.metaTitle ? `${value} - ANOINT Array` : prev.metaTitle
      }))
    }
  }

  const handleKeywordAdd = (keyword: string) => {
    if (keyword.trim() && !formData.keywords?.includes(keyword.trim())) {
      setFormData(prev => ({
        ...prev,
        keywords: [...(prev.keywords || []), keyword.trim()]
      }))
    }
  }

  const handleKeywordRemove = (keyword: string) => {
    setFormData(prev => ({
      ...prev,
      keywords: prev.keywords?.filter(k => k !== keyword) || []
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      // In production, this would upload to a storage service
      const newImages = Array.from(files).slice(0, 4 - (formData.images?.length || 0))
      const imageUrls = newImages.map(file => URL.createObjectURL(file))
      
      setFormData(prev => ({
        ...prev,
        images: [...(prev.images || []), ...imageUrls]
      }))
    }
  }

  const handleImageRemove = (index: number) => {
    setFormData(prev => {
      const newImages = prev.images?.filter((_, i) => i !== index) || []
      return {
        ...prev,
        images: newImages,
        mainImageIndex: prev.mainImageIndex === index ? 0 : 
                       prev.mainImageIndex! > index ? prev.mainImageIndex! - 1 : prev.mainImageIndex
      }
    })
  }

  const handleSetMainImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      mainImageIndex: index
    }))
  }

  const handleSaveProduct = () => {
    // In production, this would save to database
    const productToSave = {
      ...formData,
      id: isCreatingNew ? `prod_${Date.now()}` : selectedProduct?.id || '',
      createdAt: isCreatingNew ? new Date().toISOString() : selectedProduct?.createdAt || '',
      updatedAt: new Date().toISOString(),
      publishedAt: formData.status === 'published' ? new Date().toISOString() : undefined
    } as Product

    console.log('Saving product:', productToSave)
    alert('Product saved successfully! (In production, this would save to database)')
  }

  const handleDeleteProduct = () => {
    if (!selectedProduct) return
    
    // In production, this would delete from database
    console.log('Deleting product:', selectedProduct.id)
    
    // Remove from products array
    setProducts(prev => prev.filter(p => p.id !== selectedProduct.id))
    
    // Clear form and selection
    setSelectedProduct(null)
    setIsCreatingNew(false)
    setShowDeleteModal(false)
    
    alert('Product deleted successfully! (In production, this would delete from database)')
  }

  const handleFeaturedProductChange = useCallback((index: number, field: keyof FeaturedProduct, value: string | number) => {
    setFeaturedProducts(prev => prev.map((product, i) => 
      i === index ? { ...product, [field]: value } : product
    ))
  }, [])

  const handleFeaturedImageUpload = useCallback((index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Clean up previous URL to prevent memory leaks
      const currentProduct = featuredProducts[index]
      if (currentProduct.featuredImage && currentProduct.featuredImage.startsWith('blob:')) {
        URL.revokeObjectURL(currentProduct.featuredImage)
      }
      
      const imageUrl = URL.createObjectURL(file)
      handleFeaturedProductChange(index, 'featuredImage', imageUrl)
    }
  }, [featuredProducts, handleFeaturedProductChange])

  const saveFeaturedProducts = () => {
    // In production, this would save to database
    console.log('Saving featured products:', featuredProducts)
    alert('Featured products saved successfully! (In production, this would save to database)')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'text-green-400 bg-green-400/10'
      case 'draft': return 'text-yellow-400 bg-yellow-400/10'
      case 'hidden': return 'text-gray-400 bg-gray-400/10'
      default: return 'text-gray-400 bg-gray-400/10'
    }
  }

  const getProductTypeIcon = (type: string) => {
    return type === 'digital' ? <Zap className="w-4 h-4" /> : <Package className="w-4 h-4" />
  }

  // Clean up blob URLs on component unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      featuredProducts.forEach(product => {
        if (product.featuredImage && product.featuredImage.startsWith('blob:')) {
          URL.revokeObjectURL(product.featuredImage)
        }
      })
    }
  }, [featuredProducts])

  const ProductsTab = () => {
    return (
      <div className="h-full flex overflow-hidden">
        {/* Left Sidebar - Product List */}
        <div className="w-96 bg-gray-800/50 border-r border-gray-700 flex flex-col">
          {/* Sidebar Header */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Products</h2>
              <button
                onClick={handleNewProduct}
                className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                <Plus size={16} />
                <span>New</span>
              </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm focus:border-purple-500 focus:outline-none"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="hidden">Hidden</option>
              </select>
            </div>
          </div>

          {/* Product List */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-2">
              {filteredProducts.map(product => (
                <div
                  key={product.id}
                  onClick={() => handleProductSelect(product)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all ${
                    selectedProduct?.id === product.id
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-gray-700/30 border-gray-600 hover:bg-gray-700/50 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="w-12 h-12 bg-gray-600 rounded-lg flex items-center justify-center overflow-hidden">
                      {product.images.length > 0 ? (
                        <img
                          src={product.images[product.mainImageIndex]}
                          alt={product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        {getProductTypeIcon(product.productType)}
                        <h3 className="font-medium text-white truncate">{product.title}</h3>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">${product.price}</p>
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(product.status)}`}>
                          {product.status}
                        </span>
                        {product.productType === 'physical' && product.inventory !== undefined && product.inventory <= (product.lowStockThreshold || 0) && (
                          <span className="text-xs text-red-400">Low Stock</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content - Product Form */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {(selectedProduct || isCreatingNew) ? (
            <>
              {/* Form Header */}
              <div className="p-6 border-b border-gray-700 bg-gray-800/30">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-white">
                      {isCreatingNew ? 'Create New Product' : `Edit Product: ${selectedProduct?.title}`}
                    </h1>
                    {!isCreatingNew && (
                      <p className="text-gray-400 mt-1">SKU: {selectedProduct?.sku}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSaveProduct}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                    >
                      <Save size={16} />
                      <span>Save Product</span>
                    </button>
                    {!isCreatingNew && selectedProduct && (
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>Delete Product</span>
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedProduct(null)
                        setIsCreatingNew(false)
                      }}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </div>

              {/* Form Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-4xl mx-auto space-y-8">
                  {/* Basic Information */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Product Title
                        </label>
                        <input
                          type="text"
                          value={formData.title}
                          onChange={(e) => handleInputChange('title', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="Enter product title"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Description
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) => handleInputChange('description', e.target.value)}
                          rows={4}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="Enter product description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Category
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => handleInputChange('category', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Select category</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Product Type
                        </label>
                        <select
                          value={formData.productType}
                          onChange={(e) => handleInputChange('productType', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="physical">Physical Product</option>
                          <option value="digital">Digital Product</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Price ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Compare at Price ($) <span className="text-gray-500">(optional)</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.compareAtPrice || ''}
                          onChange={(e) => handleInputChange('compareAtPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="0.00"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Status
                        </label>
                        <select
                          value={formData.status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                        >
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                          <option value="hidden">Hidden</option>
                        </select>
                      </div>

                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="isVisible"
                          checked={formData.isVisible}
                          onChange={(e) => handleInputChange('isVisible', e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="isVisible" className="ml-2 text-sm text-gray-300">
                          Visible to customers
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Images */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Product Images (Max 4)</h3>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {formData.images?.map((image, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={image}
                            alt={`Product image ${index + 1}`}
                            className={`w-full h-32 object-cover rounded-lg border-2 ${
                              formData.mainImageIndex === index ? 'border-purple-500' : 'border-gray-600'
                            }`}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleSetMainImage(index)}
                              className={`p-1 rounded-full ${
                                formData.mainImageIndex === index ? 'bg-purple-600' : 'bg-gray-600'
                              } hover:bg-purple-700 text-white transition-colors`}
                              title="Set as main image"
                            >
                              <Star size={16} />
                            </button>
                            <button
                              onClick={() => handleImageRemove(index)}
                              className="p-1 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                              title="Remove image"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          {formData.mainImageIndex === index && (
                            <div className="absolute top-2 left-2">
                              <span className="px-2 py-1 bg-purple-600 text-white text-xs rounded-full">
                                Main
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      
                      {(formData.images?.length || 0) < 4 && (
                        <label className="w-full h-32 border-2 border-dashed border-gray-600 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-purple-500 transition-colors">
                          <Upload className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-400">Upload Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-400">
                      Upload up to 4 images. Click the star icon to set the main image.
                    </p>
                  </div>

                  {/* Product Type Specific Fields */}
                  {formData.productType === 'physical' ? (
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Physical Product Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Weight (kg)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.weight || ''}
                            onChange={(e) => handleInputChange('weight', e.target.value ? parseFloat(e.target.value) : undefined)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0.0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Inventory
                          </label>
                          <input
                            type="number"
                            value={formData.inventory || ''}
                            onChange={(e) => handleInputChange('inventory', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Length (cm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.dimensions?.length || ''}
                            onChange={(e) => handleInputChange('dimensions', {
                              ...formData.dimensions,
                              length: e.target.value ? parseFloat(e.target.value) : 0
                            })}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0.0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Low Stock Threshold
                          </label>
                          <input
                            type="number"
                            value={formData.lowStockThreshold || ''}
                            onChange={(e) => handleInputChange('lowStockThreshold', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Width (cm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.dimensions?.width || ''}
                            onChange={(e) => handleInputChange('dimensions', {
                              ...formData.dimensions,
                              width: e.target.value ? parseFloat(e.target.value) : 0
                            })}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0.0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Height (cm)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={formData.dimensions?.height || ''}
                            onChange={(e) => handleInputChange('dimensions', {
                              ...formData.dimensions,
                              height: e.target.value ? parseFloat(e.target.value) : 0
                            })}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0.0"
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-800/50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Digital Product Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Digital File (ZIP)
                          </label>
                          <div className="flex items-center space-x-2">
                            <input
                              type="text"
                              value={formData.digitalFile || ''}
                              onChange={(e) => handleInputChange('digitalFile', e.target.value)}
                              className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                              placeholder="/path/to/file.zip"
                            />
                            <button className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                              Browse
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            File Size (MB)
                          </label>
                          <input
                            type="number"
                            value={formData.fileSize || ''}
                            onChange={(e) => handleInputChange('fileSize', e.target.value ? parseInt(e.target.value) : undefined)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="0"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Download Limit
                          </label>
                          <input
                            type="number"
                            value={formData.downloadLimit || 3}
                            onChange={(e) => handleInputChange('downloadLimit', parseInt(e.target.value) || 3)}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Keywords */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">Keywords</h3>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {formData.keywords?.map((keyword, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-purple-600/20 text-purple-300 rounded-full text-sm flex items-center space-x-1"
                          >
                            <span>{keyword}</span>
                            <button
                              onClick={() => handleKeywordRemove(keyword)}
                              className="text-purple-300 hover:text-white"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                      <input
                        type="text"
                        placeholder="Add keyword and press Enter"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleKeywordAdd(e.currentTarget.value)
                            e.currentTarget.value = ''
                          }
                        }}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* SEO & Additional Files */}
                  <div className="bg-gray-800/50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-white mb-4">SEO & Additional Files</h3>
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Meta Title
                        </label>
                        <input
                          type="text"
                          value={formData.metaTitle || ''}
                          onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="SEO meta title"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Meta Description
                        </label>
                        <textarea
                          value={formData.metaDescription || ''}
                          onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                          placeholder="SEO meta description"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Instructions PDF <span className="text-gray-500">(optional)</span>
                        </label>
                        <div className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={formData.instructionsPdf || ''}
                            onChange={(e) => handleInputChange('instructionsPdf', e.target.value)}
                            className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
                            placeholder="/path/to/instructions.pdf"
                          />
                          <button className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors">
                            Browse
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-16 h-16 text-gray-500 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">No Product Selected</h2>
                <p className="text-gray-400 mb-6">Select a product from the sidebar or create a new one</p>
                <button
                  onClick={handleNewProduct}
                  className="flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors mx-auto"
                >
                  <Plus size={20} />
                  <span>Create New Product</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout userRole="admin">
        <div className="h-screen flex flex-col overflow-hidden">
          {/* Tab Navigation */}
          <div className="bg-gray-800/50 border-b border-gray-700">
            <div className="px-6 pt-6 pb-0">
              <div className="flex items-center space-x-1">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-colors ${
                    activeTab === 'preview'
                      ? 'bg-gray-700 text-white border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Grid size={18} />
                  <span>Products Preview</span>
                </button>
                <button
                  onClick={() => setActiveTab('products')}
                  className={`flex items-center space-x-2 px-4 py-3 rounded-t-lg transition-colors ${
                    activeTab === 'products'
                      ? 'bg-gray-700 text-white border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
                  }`}
                >
                  <Package size={18} />
                  <span>Products</span>
                </button>
              </div>
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'preview' ? (
              <ProductsPreviewTab 
                featuredProducts={featuredProducts}
                onProductChange={handleFeaturedProductChange}
                onImageUpload={handleFeaturedImageUpload}
                onSave={saveFeaturedProducts}
              />
            ) : (
              <ProductsTab />
            )}
          </div>

          {/* Delete Confirmation Modal */}
          {showDeleteModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-gray-800 rounded-lg p-6 max-w-md mx-4">
                <h3 className="text-xl font-bold text-white mb-4">Confirm Delete</h3>
                <p className="text-gray-300 mb-6">
                  Are you sure you want to delete &quot;{selectedProduct?.title || 'this product'}&quot;? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteProduct}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Layout>
    </ProtectedRoute>
  )
}