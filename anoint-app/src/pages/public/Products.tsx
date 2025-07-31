import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { useCart } from '../../contexts/CartContext'
import { ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient'

interface Product {
  id: string
  title: string
  price: number
  image_url?: string
  description: string
  category: string
  tags: string[]
  weight: number
  stock_quantity: number
  is_active: boolean
}

const Products = () => {
  const { addToCart, getItemCount } = useCart()
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({})
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [showCartNotification, setShowCartNotification] = useState(false)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<string[]>(['All'])

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })

        if (error) throw error

        setProducts(data || [])
        
        // Extract unique categories
        const uniqueCategories = ['All', ...Array.from(new Set(data?.map(p => p.category) || []))]
        setCategories(uniqueCategories)
      } catch (error) {
        console.error('Error fetching products:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [])

  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.category === selectedCategory)

  const handleQuantityChange = (productId: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, (prev[productId] || 1) + delta)
    }))
  }

  const handleAddToCart = (product: any) => {
    const quantity = quantities[product.id] || 1
    addToCart({
      id: product.id,
      title: product.title,
      price: product.price,
      quantity,
      image: product.image
    })
    
    // Show notification
    setShowCartNotification(true)
    setTimeout(() => setShowCartNotification(false), 3000)
    
    // Reset quantity
    setQuantities(prev => ({ ...prev, [product.id]: 1 }))
  }

  return (
    <Layout auroraVariant="default">
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header Section */}
        <section className="py-12 px-6 md:px-16 lg:px-32 bg-gradient-to-b from-purple-900/20 to-gray-900">
          <div className="max-w-7xl mx-auto">
            <h1 className="text-4xl font-serif text-center mb-4">Product Catalogue</h1>
            <p className="text-center text-gray-400 mb-8">Explore our collection of energy healing arrays and scalar technology</p>
            
            {/* Cart Icon */}
            <div className="flex justify-end mb-8">
              <Link to="/cart" className="relative">
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <ShoppingCart size={20} />
                  <span>Cart ({getItemCount()})</span>
                </button>
              </Link>
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedCategory === category
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Products Grid */}
        <section className="py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            {loading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 size={48} className="animate-spin text-purple-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredProducts.map(product => (
                  <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden shadow-xl hover:shadow-2xl transition-all transform hover:scale-105">
                    <div className="h-48 bg-gradient-to-br from-purple-800 to-cyan-800 flex items-center justify-center">
                      <img 
                        src={product.image_url || '/api/placeholder/300/300'} 
                        alt={product.title} 
                        className="max-h-full max-w-full object-contain" 
                      />
                    </div>
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-white mb-1">{product.title}</h3>
                      <p className="text-purple-400 text-sm mb-2">{product.category}</p>
                      <p className="text-gray-400 text-sm mb-4">{product.description}</p>
                      
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-2xl font-bold text-cyan-400">${product.price.toFixed(2)}</span>
                        <span className={`text-sm ${product.stock_quantity > 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {product.stock_quantity > 0 ? `${product.stock_quantity} in stock` : 'Out of Stock'}
                        </span>
                      </div>

                      {/* Quantity Selector */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-gray-400">Quantity:</span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleQuantityChange(product.id, -1)}
                            className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="w-12 text-center">{quantities[product.id] || 1}</span>
                          <button
                            onClick={() => handleQuantityChange(product.id, 1)}
                            className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className={`w-full py-2 rounded transition-colors ${
                          product.stock_quantity > 0
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {product.stock_quantity > 0 ? 'Add to Cart' : 'Out of Stock'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Cart Notification */}
        {showCartNotification && (
          <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fadeIn">
            Item added to cart!
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Products