'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/AuroraBackground'
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  ArrowLeft, 
  Truck, 
  Package, 
  Zap,
  MapPin,
  Calculator,
  CreditCard,
  Loader2
} from 'lucide-react'
import { getProductById } from '@/lib/products'
import { 
  getShippingRates, 
  calculateTax, 
  formatCurrency,
  hasPhysicalItems,
  calculateCartWeight,
  calculateCartDimensions,
  type ShippingAddress,
  type ShippingRate,
  type CartItem 
} from '@/lib/shipping'

interface CartItemWithProduct extends CartItem {
  id: string
}

export default function CartPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItemWithProduct[]>([])
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    company: '',
    address1: '',
    address2: '',
    city: '',
    province: 'ON',
    postalCode: '',
    country: 'CA',
    phone: ''
  })
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedShippingRate, setSelectedShippingRate] = useState<ShippingRate | null>(null)
  const [loadingRates, setLoadingRates] = useState(false)
  const [showShippingForm, setShowShippingForm] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart')
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart)
      const cartWithProducts = parsedCart.map((item: any) => {
        const product = getProductById(item.productId)
        return {
          id: `${item.productId}_${Date.now()}`,
          productId: item.productId,
          quantity: item.quantity,
          product: product ? {
            title: product.title,
            price: product.price,
            weight: product.weight,
            dimensions: product.dimensions,
            productType: product.productType
          } : null
        }
      }).filter((item: any) => item.product !== null)
      
      setCartItems(cartWithProducts)
    }
  }, [])

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    const cartToSave = cartItems.map(item => ({
      productId: item.productId,
      quantity: item.quantity
    }))
    localStorage.setItem('cart', JSON.stringify(cartToSave))
  }, [cartItems])

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(itemId)
      return
    }

    setCartItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, quantity: newQuantity } : item
    ))
  }

  const removeItem = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId))
    // Reset shipping selection when cart changes
    setSelectedShippingRate(null)
    setShippingRates([])
  }

  const clearCart = () => {
    setCartItems([])
    setSelectedShippingRate(null)
    setShippingRates([])
  }

  const calculateSubtotal = () => {
    return cartItems.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const handleShippingAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!hasPhysicalItems(cartItems)) {
      return // No shipping needed for digital-only orders
    }

    setLoadingRates(true)
    try {
      const rates = await getShippingRates(cartItems, shippingAddress)
      setShippingRates(rates)
      if (rates.length > 0) {
        setSelectedShippingRate(rates[0]) // Select cheapest by default
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error)
      alert('Error calculating shipping rates. Please try again.')
    } finally {
      setLoadingRates(false)
    }
  }

  const calculateTotal = () => {
    const subtotal = calculateSubtotal()
    const shipping = selectedShippingRate?.price || 0
    const taxes = calculateTax(subtotal, shipping, shippingAddress.province)
    
    return {
      subtotal,
      shipping,
      taxes,
      total: subtotal + shipping + taxes.total
    }
  }

  const totals = calculateTotal()
  const needsShipping = hasPhysicalItems(cartItems)
  const cartWeight = calculateCartWeight(cartItems)
  const cartDimensions = calculateCartDimensions(cartItems)

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 relative">
        <AuroraBackground variant="subtle" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-6 py-12">
          <div className="text-center">
            <ShoppingCart className="w-24 h-24 text-gray-500 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-white mb-4">Your cart is empty</h1>
            <p className="text-gray-400 mb-8">Add some products to get started</p>
            <button
              onClick={() => router.push('/products')}
              className="inline-flex items-center space-x-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              <Package size={20} />
              <span>Browse Products</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <AuroraBackground variant="subtle" />
      
      {/* Header */}
      <div className="relative z-10 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.back()}
                className="p-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft size={24} />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">Shopping Cart</h1>
                <p className="text-gray-400 mt-1">{cartItems.length} item{cartItems.length !== 1 ? 's' : ''}</p>
              </div>
            </div>
            
            <button
              onClick={clearCart}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
              <span>Clear Cart</span>
            </button>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
              <div className="p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Cart Items</h2>
                {needsShipping && (
                  <div className="mt-2 text-sm text-gray-400">
                    <p>Weight: {cartWeight.toFixed(1)} kg</p>
                    <p>Dimensions: {cartDimensions.length}×{cartDimensions.width}×{cartDimensions.height} cm</p>
                  </div>
                )}
              </div>
              
              <div className="divide-y divide-gray-700">
                {cartItems.map((item) => (
                  <div key={item.id} className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-16 h-16 bg-gray-700/50 rounded-lg flex items-center justify-center">
                        {item.product.productType === 'digital' ? (
                          <Zap className="w-8 h-8 text-purple-400" />
                        ) : (
                          <Package className="w-8 h-8 text-blue-400" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">{item.product.title}</h3>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            item.product.productType === 'digital'
                              ? 'bg-purple-600/20 text-purple-300'
                              : 'bg-blue-600/20 text-blue-300'
                          }`}>
                            {item.product.productType === 'digital' ? 'Digital' : 'Physical'}
                          </span>
                          {item.product.weight && (
                            <span className="text-xs text-gray-400">{item.product.weight} kg</span>
                          )}
                        </div>
                        <p className="text-lg font-bold text-purple-400">
                          {formatCurrency(item.product.price)}
                        </p>
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-2 bg-gray-700/50 rounded-lg">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <Minus size={16} />
                          </button>
                          <span className="px-3 py-2 text-white font-medium">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                        
                        {/* Remove Button */}
                        <button
                          onClick={() => removeItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="mt-4 flex justify-end">
                      <p className="text-lg font-bold text-white">
                        Subtotal: {formatCurrency(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary and Shipping */}
          <div className="space-y-6">
            {/* Shipping Address Form */}
            {needsShipping && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <MapPin className="w-5 h-5 text-blue-400" />
                    <h3 className="text-lg font-semibold text-white">Shipping Address</h3>
                  </div>
                </div>
                
                <div className="p-6">
                  {!showShippingForm ? (
                    <button
                      onClick={() => setShowShippingForm(true)}
                      className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      Enter Shipping Address
                    </button>
                  ) : (
                    <form onSubmit={handleShippingAddressSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={shippingAddress.name}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Company (Optional)"
                          value={shippingAddress.company}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, company: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <input
                        type="text"
                        placeholder="Address Line 1"
                        value={shippingAddress.address1}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address1: e.target.value }))}
                        required
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      />
                      
                      <input
                        type="text"
                        placeholder="Address Line 2 (Optional)"
                        value={shippingAddress.address2}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, address2: e.target.value }))}
                        className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                      />
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="City"
                          value={shippingAddress.city}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                          required
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                        <select
                          value={shippingAddress.province}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, province: e.target.value }))}
                          required
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-blue-500 focus:outline-none"
                        >
                          <option value="AB">Alberta</option>
                          <option value="BC">British Columbia</option>
                          <option value="MB">Manitoba</option>
                          <option value="NB">New Brunswick</option>
                          <option value="NL">Newfoundland and Labrador</option>
                          <option value="NS">Nova Scotia</option>
                          <option value="NT">Northwest Territories</option>
                          <option value="NU">Nunavut</option>
                          <option value="ON">Ontario</option>
                          <option value="PE">Prince Edward Island</option>
                          <option value="QC">Quebec</option>
                          <option value="SK">Saskatchewan</option>
                          <option value="YT">Yukon</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={shippingAddress.postalCode}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                          required
                          pattern="[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d"
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="Phone (Optional)"
                          value={shippingAddress.phone}
                          onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                      
                      <button
                        type="submit"
                        disabled={loadingRates}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg transition-colors"
                      >
                        {loadingRates ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Calculating Rates...</span>
                          </>
                        ) : (
                          <>
                            <Calculator className="w-4 h-4" />
                            <span>Get Shipping Rates</span>
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Options */}
            {needsShipping && shippingRates.length > 0 && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center space-x-2">
                    <Truck className="w-5 h-5 text-green-400" />
                    <h3 className="text-lg font-semibold text-white">Shipping Options</h3>
                  </div>
                </div>
                
                <div className="p-6 space-y-3">
                  {shippingRates.map((rate) => (
                    <label
                      key={rate.id}
                      className={`flex items-center space-x-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedShippingRate?.id === rate.id
                          ? 'border-green-500 bg-green-600/10'
                          : 'border-gray-600 hover:border-gray-500'
                      }`}
                    >
                      <input
                        type="radio"
                        name="shipping"
                        value={rate.id}
                        checked={selectedShippingRate?.id === rate.id}
                        onChange={() => setSelectedShippingRate(rate)}
                        className="w-4 h-4 text-green-600 bg-gray-700 border-gray-600 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-semibold text-white">{rate.name}</h4>
                          <span className="font-bold text-green-400">{formatCurrency(rate.price)}</span>
                        </div>
                        <p className="text-sm text-gray-400">{rate.description}</p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-400">{rate.estimatedDays}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            rate.carrier === 'canada-post'
                              ? 'bg-red-600/20 text-red-300'
                              : 'bg-yellow-600/20 text-yellow-300'
                          }`}>
                            {rate.carrier === 'canada-post' ? 'Canada Post' : 'UPS'}
                          </span>
                          {rate.guaranteed && (
                            <span className="text-xs px-2 py-1 bg-green-600/20 text-green-300 rounded-full">
                              Guaranteed
                            </span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
              <div className="p-6 border-b border-gray-700">
                <h3 className="text-lg font-semibold text-white">Order Summary</h3>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(totals.subtotal)}</span>
                </div>
                
                {needsShipping && (
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span>
                      {selectedShippingRate ? formatCurrency(totals.shipping) : 'Select shipping method'}
                    </span>
                  </div>
                )}
                
                {totals.taxes.hst > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>HST ({shippingAddress.province})</span>
                    <span>{formatCurrency(totals.taxes.hst)}</span>
                  </div>
                )}
                
                {totals.taxes.gst > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>GST</span>
                    <span>{formatCurrency(totals.taxes.gst)}</span>
                  </div>
                )}
                
                {totals.taxes.pst > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>PST ({shippingAddress.province})</span>
                    <span>{formatCurrency(totals.taxes.pst)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between text-xl font-bold text-white">
                    <span>Total</span>
                    <span>{formatCurrency(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={() => router.push('/checkout')}
              disabled={needsShipping && !selectedShippingRate}
              className="w-full flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold text-lg"
            >
              <CreditCard size={20} />
              <span>Proceed to Checkout</span>
            </button>
            
            {needsShipping && !selectedShippingRate && (
              <p className="text-sm text-gray-400 text-center">
                Please select a shipping method to continue
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}