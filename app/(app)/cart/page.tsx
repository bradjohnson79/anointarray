'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { TrashIcon, PlusIcon, MinusIcon, ShoppingBagIcon } from '@heroicons/react/24/outline'

interface CartItem {
  product_id: string
  variant_id?: string
  title: string
  price: number
  quantity: number
  image?: string
  sku?: string
  max_quantity?: number
}

interface CouponResult {
  valid: boolean
  discount_cents: number
  error?: string
  description?: string
}

const TAX_RATE = 0.13 // 13% HST for Ontario
const SHIPPING_RATE = 1200 // $12 CAD

export default function CartPage() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  
  const [cart, setCart] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponResult, setCouponResult] = useState<CouponResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    checkUser()
    loadCartFromStorage()
  }, [])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user || null)
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

  const saveCartToStorage = (newCart: CartItem[]) => {
    localStorage.setItem('anoint-cart', JSON.stringify(newCart))
    setCart(newCart)
  }

  const updateQuantity = (productId: string, variantId: string | undefined, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(productId, variantId)
      return
    }

    const newCart = cart.map(item => {
      if (item.product_id === productId && item.variant_id === variantId) {
        const maxQty = item.max_quantity || 999
        return {
          ...item,
          quantity: Math.min(newQuantity, maxQty)
        }
      }
      return item
    })

    saveCartToStorage(newCart)
    // Reset coupon when cart changes
    setCouponResult(null)
  }

  const removeItem = (productId: string, variantId: string | undefined) => {
    const newCart = cart.filter(item => 
      !(item.product_id === productId && item.variant_id === variantId)
    )
    saveCartToStorage(newCart)
    setCouponResult(null)
  }

  const clearCart = () => {
    saveCartToStorage([])
    setCouponResult(null)
  }

  const applyCoupon = async () => {
    if (!couponCode.trim()) return

    setLoading(true)
    try {
      const subtotal = getSubtotal()
      
      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          coupon_code: couponCode,
          subtotal_cents: subtotal,
          user_id: user?.id
        })
      })

      const result = await response.json()
      setCouponResult(result)

    } catch (error) {
      console.error('Error applying coupon:', error)
      setCouponResult({
        valid: false,
        discount_cents: 0,
        error: 'Failed to validate coupon'
      })
    } finally {
      setLoading(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setCouponResult(null)
  }

  const getSubtotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0)
  }

  const getDiscount = () => {
    return couponResult?.valid ? couponResult.discount_cents : 0
  }

  const getTax = () => {
    const taxableAmount = getSubtotal() - getDiscount()
    return Math.round(taxableAmount * TAX_RATE)
  }

  const getTotal = () => {
    return getSubtotal() - getDiscount() + getTax() + SHIPPING_RATE
  }

  const getItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0)
  }

  const proceedToCheckout = () => {
    if (cart.length === 0) return

    // Save cart and coupon info for checkout
    const checkoutData = {
      items: cart,
      coupon_code: couponResult?.valid ? couponCode : null,
      subtotal: getSubtotal(),
      discount: getDiscount(),
      tax: getTax(),
      shipping: SHIPPING_RATE,
      total: getTotal()
    }

    localStorage.setItem('anoint-checkout', JSON.stringify(checkoutData))
    router.push('/checkout')
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <ShoppingBagIcon className="h-24 w-24 text-gray-600 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-gray-400 mb-4">Your Cart is Empty</h1>
            <p className="text-gray-500 mb-8">Discover our mystical collection and add some magic to your cart.</p>
            
            <div className="space-x-4">
              <button
                onClick={() => router.push('/catalog')}
                className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Browse Catalog
              </button>
              <button
                onClick={() => router.push('/generator')}
                className="bg-gray-700 hover:bg-gray-600 px-8 py-3 rounded-lg font-semibold transition-colors"
              >
                Create Array
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-purple-400">Shopping Cart</h1>
            <p className="text-gray-400 mt-1">{getItemCount()} items in your cart</p>
          </div>
          
          <button
            onClick={clearCart}
            className="text-red-400 hover:text-red-300 transition-colors"
          >
            Clear Cart
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item, index) => (
              <div key={`${item.product_id}-${item.variant_id || 'default'}`} className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  {/* Product Image */}
                  <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 text-2xl">🔮</span>
                      </div>
                    )}
                  </div>

                  {/* Product Details */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{item.title}</h3>
                        {item.sku && (
                          <p className="text-gray-400 text-sm">SKU: {item.sku}</p>
                        )}
                      </div>
                      
                      <button
                        onClick={() => removeItem(item.product_id, item.variant_id)}
                        className="text-red-400 hover:text-red-300 p-1 transition-colors"
                        title="Remove item"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {/* Quantity and Price */}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors"
                        >
                          <MinusIcon className="h-4 w-4" />
                        </button>
                        
                        <span className="text-lg font-semibold min-w-[3rem] text-center">
                          {item.quantity}
                        </span>
                        
                        <button
                          onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                          className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg transition-colors"
                          disabled={item.max_quantity && item.quantity >= item.max_quantity}
                        >
                          <PlusIcon className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="text-lg font-bold text-purple-400">
                          ${((item.price * item.quantity) / 100).toFixed(2)} CAD
                        </div>
                        <div className="text-sm text-gray-400">
                          ${(item.price / 100).toFixed(2)} each
                        </div>
                      </div>
                    </div>

                    {item.max_quantity && item.quantity >= item.max_quantity && (
                      <p className="text-orange-400 text-sm mt-2">
                        Maximum quantity reached
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-gray-800 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-bold mb-6">Order Summary</h2>

            {/* Coupon Code */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Coupon Code
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="Enter coupon code"
                  className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none"
                  onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                />
                <button
                  onClick={applyCoupon}
                  disabled={!couponCode.trim() || loading}
                  className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors"
                >
                  {loading ? '...' : 'Apply'}
                </button>
              </div>

              {/* Coupon Result */}
              {couponResult && (
                <div className={`mt-2 p-3 rounded-lg ${
                  couponResult.valid 
                    ? 'bg-green-900 border border-green-700' 
                    : 'bg-red-900 border border-red-700'
                }`}>
                  {couponResult.valid ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-400 font-semibold">Coupon Applied!</p>
                        {couponResult.description && (
                          <p className="text-green-300 text-sm">{couponResult.description}</p>
                        )}
                      </div>
                      <button
                        onClick={removeCoupon}
                        className="text-green-400 hover:text-green-300"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <p className="text-red-400">{couponResult.error}</p>
                  )}
                </div>
              )}
            </div>

            {/* Price Breakdown */}
            <div className="space-y-3 mb-6">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal ({getItemCount()} items)</span>
                <span>${(getSubtotal() / 100).toFixed(2)} CAD</span>
              </div>

              {getDiscount() > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-${(getDiscount() / 100).toFixed(2)} CAD</span>
                </div>
              )}

              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span>${(SHIPPING_RATE / 100).toFixed(2)} CAD</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-400">Tax (HST 13%)</span>
                <span>${(getTax() / 100).toFixed(2)} CAD</span>
              </div>

              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-purple-400">${(getTotal() / 100).toFixed(2)} CAD</span>
                </div>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              onClick={proceedToCheckout}
              className="w-full bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Proceed to Checkout
            </button>

            {/* Continue Shopping */}
            <button
              onClick={() => router.push('/catalog')}
              className="w-full mt-3 bg-gray-700 hover:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Continue Shopping
            </button>

            {/* Security Info */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-400">
                🔒 Secure checkout with SSL encryption
              </p>
              <p className="text-xs text-gray-500 mt-1">
                We accept Stripe, PayPal, and Cryptocurrency
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}