'use client'

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import Link from 'next/link'
import Image from 'next/image'
import { 
  EyeIcon, 
  CubeIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon as ExternalLinkIcon
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
  created_at: string
  updated_at: string
}

export default function ProductsPreviewTab() {
  const supabase = createBrowserSupabase()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublishedProducts()
  }, [])

  const fetchPublishedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .eq('is_visible', true)
        .order('created_at', { ascending: false })
        .limit(12)

      if (error) throw error

      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching published products:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInventoryStatus = (product: Product) => {
    if (!product.track_inventory) {
      return { text: 'Available', color: 'text-green-400' }
    }
    
    if (product.inventory_quantity === 0) {
      return { text: 'Out of stock', color: 'text-red-400' }
    } else if (product.inventory_quantity <= 5) {
      return { text: `${product.inventory_quantity} left`, color: 'text-yellow-400' }
    } else {
      return { text: 'In stock', color: 'text-green-400' }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading product preview...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <EyeIcon className="h-6 w-6 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Customer Product Preview</h3>
          </div>
          <p className="text-gray-400 text-sm mt-1">
            How your published products appear to customers ({products.length} published products)
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Link
            href="/products"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
          >
            <ExternalLinkIcon className="h-5 w-5" />
            <span>View Store</span>
          </Link>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Info Panel */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <div className="flex items-start space-x-2">
          <EyeIcon className="h-5 w-5 text-blue-400 mt-0.5" />
          <div className="text-blue-300 text-sm">
            <p className="font-medium mb-1">Customer View Preview</p>
            <p>This shows how your published and visible products appear to customers on your storefront. Only products with status "Published" and visibility enabled are shown here.</p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="text-center py-12">
          <CubeIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg">No published products</p>
          <p className="text-gray-500 mb-6">Publish some products to see how they appear to customers</p>
          
          <Link
            href="/admin/products/new"
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg inline-flex items-center space-x-2 transition-colors"
          >
            <CubeIcon className="h-5 w-5" />
            <span>Create Product</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map(product => {
            const inventoryStatus = getInventoryStatus(product)
            
            return (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                {/* Product Image */}
                <div className="relative aspect-square bg-gray-100">
                  {product.images && product.images.length > 0 ? (
                    <Image
                      src={product.images[0]}
                      alt={product.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <PhotoIcon className="h-16 w-16 text-gray-400" />
                    </div>
                  )}
                  
                  {/* Category Badge */}
                  <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded-lg text-xs font-medium">
                    {product.category}
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900 text-lg mb-1 line-clamp-2">
                      {product.title}
                    </h3>
                    <p className="text-gray-600 text-sm line-clamp-2">
                      {product.description}
                    </p>
                  </div>

                  {/* Price */}
                  <div className="mb-3">
                    <span className="text-2xl font-bold text-purple-600">
                      ${(product.price / 100).toFixed(2)}
                    </span>
                    <span className="text-gray-500 text-sm ml-1">CAD</span>
                  </div>

                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {product.tags.slice(0, 2).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full">
                            {tag}
                          </span>
                        ))}
                        {product.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{product.tags.length - 2}</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Inventory Status */}
                  <div className="mb-4">
                    <span className={`text-sm font-medium ${inventoryStatus.color}`}>
                      {inventoryStatus.text}
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    className={`w-full py-2 rounded-lg font-medium transition-colors ${
                      inventoryStatus.color === 'text-red-400'
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                    disabled={inventoryStatus.color === 'text-red-400'}
                  >
                    {inventoryStatus.color === 'text-red-400' ? 'Out of Stock' : 'Add to Cart'}
                  </button>

                  {/* Admin Actions */}
                  <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      SKU: {product.sku}
                    </span>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                    >
                      Edit →
                    </Link>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="text-sm text-gray-400 text-center">
        Last updated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}