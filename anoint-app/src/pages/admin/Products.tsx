import { useState } from 'react'
import Layout from '../../components/layout/Layout'
import ProtectedRoute from '../../components/layout/ProtectedRoute'
import { Plus, Edit, Trash2, Upload, Tag, DollarSign, Package } from 'lucide-react'

interface Product {
  id: string
  title: string
  price: number
  quantity: number
  description: string
  category: string
  tags: string[]
  image?: string
  createdAt: string
}

// Mock product data
const mockProducts: Product[] = [
  {
    id: '1',
    title: 'AetherX Card Decks: Body, Mind, Energy',
    price: 24.11,
    quantity: 50,
    description: 'Transcendental Imbued and Scalar enhanced sacred geometrical cards',
    category: 'Cards',
    tags: ['healing', 'cards', 'energy'],
    createdAt: '2025-01-15'
  },
  {
    id: '2',
    title: 'ANOINT Manifestation Sphere',
    price: 111.32,
    quantity: 20,
    description: 'Manifestation Sphere\'s enhanced transcendental and Scalar frequencies',
    category: 'Technology',
    tags: ['manifestation', 'scalar', '3d-printed'],
    createdAt: '2025-01-10'
  }
]

const AdminProducts = () => {
  const [products, setProducts] = useState<Product[]>(mockProducts)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    quantity: '',
    description: '',
    category: '',
    tags: ''
  })
  // TODO: Add image upload functionality
  // const [imageFile, setImageFile] = useState<File | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingProduct) {
      // Update existing product
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? {
              ...p,
              title: formData.title,
              price: parseFloat(formData.price),
              quantity: parseInt(formData.quantity),
              description: formData.description,
              category: formData.category,
              tags: formData.tags.split(',').map(t => t.trim())
            }
          : p
      ))
    } else {
      // Add new product
      const newProduct: Product = {
        id: Date.now().toString(),
        title: formData.title,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity),
        description: formData.description,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()),
        createdAt: new Date().toISOString().split('T')[0]
      }
      setProducts([...products, newProduct])
    }
    
    resetForm()
  }

  const handleEdit = (product: Product) => {
    setEditingProduct(product)
    setFormData({
      title: product.title,
      price: product.price.toString(),
      quantity: product.quantity.toString(),
      description: product.description,
      category: product.category,
      tags: product.tags.join(', ')
    })
    setShowProductModal(true)
  }

  const handleDelete = async (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setProducts(products.filter(p => p.id !== productId))
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      quantity: '',
      description: '',
      category: '',
      tags: ''
    })
    setEditingProduct(null)
    setShowProductModal(false)
    // TODO: Reset image file when implemented
    // setImageFile(null)
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <h1 className="text-4xl font-serif">Product Management</h1>
              <button
                onClick={() => setShowProductModal(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Plus size={20} />
                Add Product
              </button>
            </div>

            {/* Products Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <div key={product.id} className="bg-gray-800 rounded-lg overflow-hidden">
                  <div className="h-48 bg-gradient-to-br from-purple-800 to-cyan-800 flex items-center justify-center">
                    {product.image ? (
                      <img src={product.image} alt={product.title} className="max-h-full max-w-full object-contain" />
                    ) : (
                      <Package size={64} className="text-white/30" />
                    )}
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-white mb-2">{product.title}</h3>
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{product.description}</p>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-500">Price</p>
                        <p className="text-cyan-400 font-bold">${product.price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Stock</p>
                        <p className="text-white font-bold">{product.quantity} units</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Category</p>
                      <span className="inline-block bg-purple-900 text-purple-300 text-xs px-2 py-1 rounded">
                        {product.category}
                      </span>
                    </div>
                    
                    <div className="mb-4">
                      <p className="text-xs text-gray-500 mb-1">Tags</p>
                      <div className="flex flex-wrap gap-1">
                        {product.tags.map((tag, i) => (
                          <span key={i} className="bg-gray-700 text-gray-300 text-xs px-2 py-1 rounded">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                      >
                        <Edit size={16} />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="flex-1 bg-red-900 hover:bg-red-800 text-white py-2 rounded flex items-center justify-center gap-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Product Modal */}
            {showProductModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                  <h2 className="text-2xl font-bold mb-6">
                    {editingProduct ? 'Edit Product' : 'Add New Product'}
                  </h2>
                  
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Product Title</label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <DollarSign size={16} className="inline mr-1" />
                          Price
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm text-gray-400 mb-2">
                          <Package size={16} className="inline mr-1" />
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={formData.quantity}
                          onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                          className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                          required
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Description</label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">Category</label>
                      <input
                        type="text"
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        <Tag size={16} className="inline mr-1" />
                        Tags (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={formData.tags}
                        onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                        placeholder="healing, energy, scalar"
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm text-gray-400 mb-2">
                        <Upload size={16} className="inline mr-1" />
                        Product Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          // TODO: Handle image file selection
                          console.log('Image selected:', e.target.files?.[0])
                        }}
                        className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                    
                    <div className="flex gap-4 pt-4">
                      <button
                        type="submit"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg transition-colors"
                      >
                        {editingProduct ? 'Update Product' : 'Add Product'}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </Layout>
    </ProtectedRoute>
  )
}

export default AdminProducts