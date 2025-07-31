import { useState, useEffect } from 'react'
import Layout from '../../components/layout/Layout'
import { useCart } from '../../contexts/CartContext'
import { useAuth } from '../../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { Trash2, Plus, Minus, ShoppingBag, Loader2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient'

interface ShippingRate {
  id: string
  name: string
  carrier: string
  price: number
  estimatedDays: string
  description?: string
}

const Cart = () => {
  const {
    items,
    removeFromCart,
    updateQuantity,
    getSubtotal,
    getFinalTotal,
    couponCode,
    setCouponCode,
    discount,
    setDiscount,
    selectedShipping,
    setSelectedShipping
  } = useCart()

  const { getUserEmail } = useAuth()

  const [couponInput, setCouponInput] = useState('')
  const [couponError, setCouponError] = useState('')
  const [shippingOptions, setShippingOptions] = useState<ShippingRate[]>([])
  const [loadingRates, setLoadingRates] = useState(false)
  const [shippingAddress, setShippingAddress] = useState({
    name: '',
    address: '',
    city: '',
    province: 'ON',
    postalCode: '',
    country: 'CA'
  })
  const [showAddressForm, setShowAddressForm] = useState(false)

  // Load shipping rates when address is provided
  const fetchShippingRates = async () => {
    if (!shippingAddress.address || !shippingAddress.city || !shippingAddress.postalCode) {
      return
    }

    setLoadingRates(true)
    try {
      const { data, error } = await supabase.functions.invoke('get-rates', {
        body: {
          toAddress: shippingAddress,
          items: items.map(item => ({
            id: item.id,
            quantity: item.quantity,
            weight: 0.5 // Default weight per item in kg
          }))
        }
      })

      if (error) {
        console.error('Error fetching shipping rates:', error)
        // Fallback to default rates
        setShippingOptions([
          { id: 'standard', name: 'Standard Shipping', carrier: 'Canada Post', price: 9.99, estimatedDays: '5-7 business days' },
          { id: 'express', name: 'Express Shipping', carrier: 'UPS', price: 19.99, estimatedDays: '2-3 business days' }
        ])
      } else if (data?.rates) {
        setShippingOptions(data.rates)
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error)
      // Fallback rates
      setShippingOptions([
        { id: 'standard', name: 'Standard Shipping', carrier: 'Canada Post', price: 9.99, estimatedDays: '5-7 business days' }
      ])
    } finally {
      setLoadingRates(false)
    }
  }

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return

    try {
      // Validate coupon via Supabase
      const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', couponInput.toUpperCase())
        .eq('is_active', true)
        .single()

      if (error || !coupon) {
        setCouponError('Invalid coupon code')
        setDiscount(0)
        setCouponCode('')
        return
      }

      // Check expiration
      if (coupon.expiration_date && new Date(coupon.expiration_date) < new Date()) {
        setCouponError('Coupon has expired')
        setDiscount(0)
        setCouponCode('')
        return
      }

      // Check usage limit
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        setCouponError('Coupon usage limit reached')
        setDiscount(0)
        setCouponCode('')
        return
      }

      // Apply coupon
      const discountValue = coupon.type === 'percentage' ? coupon.value : (coupon.value / getSubtotal()) * 100
      setDiscount(discountValue)
      setCouponCode(couponInput.toUpperCase())
      setCouponError('')
      
    } catch (error) {
      console.error('Error validating coupon:', error)
      setCouponError('Error validating coupon')
      setDiscount(0)
      setCouponCode('')
    }
  }

  const handleCheckout = async () => {
    if (!selectedShipping) {
      alert('Please select a shipping option')
      return
    }

    if (!shippingAddress.address) {
      alert('Please provide a shipping address')
      return
    }

    // Proceed to checkout with selected options
    try {
      const checkoutData = {
        items,
        shippingAddress,
        shippingOption: selectedShipping,
        couponCode: couponCode || undefined,
        discount,
        paymentMethod: 'stripe', // Default to Stripe, will offer choice in actual checkout
        customerEmail: getUserEmail() || 'guest@anointarray.com'
      }

      const { data, error } = await supabase.functions.invoke('checkout-session', {
        body: checkoutData
      })

      if (error) {
        console.error('Checkout error:', error)
        alert('Checkout failed. Please try again.')
        return
      }

      if (data?.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl
      } else if (data?.approvalUrl) {
        // Redirect to PayPal
        window.location.href = data.approvalUrl
      }
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Checkout failed. Please try again.')
    }
  }

  // Fetch rates when address changes
  useEffect(() => {
    if (shippingAddress.address && shippingAddress.city && shippingAddress.postalCode) {
      fetchShippingRates()
    }
  }, [shippingAddress])

  if (items.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <ShoppingBag size={64} className="mx-auto mb-4 text-gray-600" />
            <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
            <p className="text-gray-400 mb-8">Add some products to get started!</p>
            <Link to="/products">
              <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors">
                Browse Products
              </button>
            </Link>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout auroraVariant="subtle">
      <div className="min-h-screen bg-gray-900 text-white py-12 px-6 md:px-16 lg:px-32">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl font-serif mb-8">Shopping Cart</h1>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-lg p-6">
                {items.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 py-4 border-b border-gray-700 last:border-b-0">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-800 to-cyan-800 rounded-lg flex items-center justify-center">
                      <img src={item.image} alt={item.title} className="max-h-full max-w-full object-contain" />
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="font-bold text-white">{item.title}</h3>
                      <p className="text-cyan-400">${item.price.toFixed(2)}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="bg-gray-700 hover:bg-gray-600 text-white w-8 h-8 rounded flex items-center justify-center transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-white">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-400 hover:text-red-300 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Shipping Address Form */}
              <div className="bg-gray-800 rounded-lg p-6 mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold">Shipping Address</h3>
                  <button
                    onClick={() => setShowAddressForm(!showAddressForm)}
                    className="text-purple-400 hover:text-purple-300 text-sm"
                  >
                    {showAddressForm ? 'Hide' : 'Edit'}
                  </button>
                </div>
                
                {showAddressForm && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <input
                      type="text"
                      placeholder="Full Name"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                      className="bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <input
                      type="text"
                      placeholder="Street Address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress({...shippingAddress, address: e.target.value})}
                      className="bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <input
                      type="text"
                      placeholder="City"
                      value={shippingAddress.city}
                      onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                      className="bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <select
                      value={shippingAddress.province}
                      onChange={(e) => setShippingAddress({...shippingAddress, province: e.target.value})}
                      className="bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="AB">Alberta</option>
                      <option value="BC">British Columbia</option>
                      <option value="MB">Manitoba</option>
                      <option value="NB">New Brunswick</option>
                      <option value="NL">Newfoundland and Labrador</option>
                      <option value="NS">Nova Scotia</option>
                      <option value="ON">Ontario</option>
                      <option value="PE">Prince Edward Island</option>
                      <option value="QC">Quebec</option>
                      <option value="SK">Saskatchewan</option>
                    </select>
                    <input
                      type="text"
                      placeholder="Postal Code"
                      value={shippingAddress.postalCode}
                      onChange={(e) => setShippingAddress({...shippingAddress, postalCode: e.target.value.toUpperCase()})}
                      className="bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <select
                      value={shippingAddress.country}
                      onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                      className="bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    >
                      <option value="CA">Canada</option>
                      <option value="US">United States</option>
                    </select>
                  </div>
                )}
                
                {shippingAddress.name && (
                  <div className="bg-gray-700 p-3 rounded text-sm">
                    <strong>{shippingAddress.name}</strong><br />
                    {shippingAddress.address}<br />
                    {shippingAddress.city}, {shippingAddress.province} {shippingAddress.postalCode}<br />
                    {shippingAddress.country}
                  </div>
                )}
              </div>

              {/* Shipping Options */}
              <div className="bg-gray-800 rounded-lg p-6 mt-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  Shipping Options
                  {loadingRates && <Loader2 size={20} className="animate-spin" />}
                </h3>
                
                {!shippingAddress.address ? (
                  <p className="text-gray-400 text-center py-4">
                    Please provide a shipping address to see available shipping options
                  </p>
                ) : shippingOptions.length === 0 && !loadingRates ? (
                  <p className="text-gray-400 text-center py-4">
                    No shipping options available for this address
                  </p>
                ) : (
                  <>
                    {shippingOptions.map((option) => (
                      <label key={option.id} className="flex items-center justify-between py-3 cursor-pointer hover:bg-gray-700 px-4 -mx-4 rounded">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="shipping"
                            value={option.id}
                            checked={selectedShipping?.id === option.id}
                            onChange={() => setSelectedShipping(option)}
                            className="text-purple-600"
                          />
                          <div>
                            <p className="font-semibold">{option.name}</p>
                            <p className="text-sm text-gray-400">
                              {option.carrier} • {option.estimatedDays}
                            </p>
                            {option.description && (
                              <p className="text-xs text-gray-500">{option.description}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-cyan-400">${option.price.toFixed(2)}</span>
                      </label>
                    ))}
                    
                    {!selectedShipping && shippingOptions.length > 0 && (
                      <p className="text-yellow-400 text-sm mt-4">
                        Please select a shipping option to continue
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-gray-800 rounded-lg p-6 sticky top-20">
                <h3 className="text-xl font-bold mb-4">Order Summary</h3>
                
                {/* Coupon Code */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-400 mb-2">Coupon Code</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="Enter code"
                      className="flex-grow bg-gray-700 text-white px-4 py-2 rounded focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-400 text-sm mt-2">{couponError}</p>}
                  {discount > 0 && <p className="text-green-400 text-sm mt-2">Coupon applied: {discount}% off</p>}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Subtotal</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Discount ({discount}%)</span>
                      <span>-${((getSubtotal() * discount) / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {selectedShipping && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Shipping</span>
                      <span>${selectedShipping.price.toFixed(2)}</span>
                    </div>
                  )}
                  
                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total</span>
                      <span className="text-cyan-400">${getFinalTotal().toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Checkout Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleCheckout}
                    disabled={!selectedShipping}
                    className={`w-full py-3 rounded-lg font-bold transition-colors ${
                      selectedShipping
                        ? 'bg-purple-600 hover:bg-purple-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    Proceed to Checkout
                  </button>
                  
                  <div className="text-center text-sm text-gray-400">
                    <p>Secure checkout powered by</p>
                    <div className="flex justify-center gap-4 mt-2">
                      <span className="text-purple-400">Stripe</span>
                      <span className="text-cyan-400">PayPal</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default Cart