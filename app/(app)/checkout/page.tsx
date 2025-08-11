'use client'

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react'
import { createBrowserSupabase } from '@/lib/supabase-client'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { 
  CreditCardIcon, 
  TruckIcon, 
  LockClosedIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

interface CheckoutData {
  items: CartItem[]
  coupon_code?: string
  subtotal: number
  discount: number
  tax: number
  shipping: number
  total: number
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

interface ShippingAddress {
  name: string
  line1: string
  line2?: string
  city: string
  state: string
  postal_code: string
  country: string
  phone?: string
}

interface PaymentMethod {
  type: 'stripe' | 'paypal' | 'crypto'
  crypto_currency?: string
}

const PAYMENT_METHODS = [
  { 
    type: 'stripe' as const, 
    name: 'Credit/Debit Card', 
    icon: '💳',
    description: 'Secure payment via Stripe'
  },
  { 
    type: 'paypal' as const, 
    name: 'PayPal', 
    icon: '🅿️',
    description: 'Pay with your PayPal account'
  },
  { 
    type: 'crypto' as const, 
    name: 'Cryptocurrency', 
    icon: '₿',
    description: 'Pay with Bitcoin, Ethereum, and more'
  }
]

const CRYPTO_CURRENCIES = [
  { code: 'BTC', name: 'Bitcoin' },
  { code: 'ETH', name: 'Ethereum' },
  { code: 'LTC', name: 'Litecoin' },
  { code: 'BCH', name: 'Bitcoin Cash' },
  { code: 'USDT', name: 'Tether' },
  { code: 'USDC', name: 'USD Coin' },
]

export default function CheckoutPage() {
  const supabase = createBrowserSupabase()
  const router = useRouter()
  
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<'shipping' | 'payment' | 'review'>('shipping')
  
  // Form states
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'CA',
    phone: ''
  })
  
  const [billingAddress, setBillingAddress] = useState<ShippingAddress | null>(null)
  const [sameAsBilling, setSameAsBilling] = useState(true)
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>({ type: 'stripe' })
  const [acceptTerms, setAcceptTerms] = useState(false)
  
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [shippingRates, setShippingRates] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<any>(null)

  useEffect(() => {
    checkUser()
    loadCheckoutData()
  }, [])

  useEffect(() => {
    if (step === 'payment' && shippingAddress.postal_code && shippingAddress.country) {
      fetchShippingRates()
    }
  }, [step, shippingAddress])

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login?redirectTo=/checkout')
      return
    }
    setUser(session.user)
    
    // Pre-fill user info if available
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, phone, shipping_address, billing_address')
      .eq('id', session.user.id)
      .single()

    if (profile) {
      if (profile.full_name) {
        setShippingAddress(prev => ({ ...prev, name: profile.full_name }))
      }
      if (profile.phone) {
        setShippingAddress(prev => ({ ...prev, phone: profile.phone }))
      }
      if (profile.shipping_address) {
        setShippingAddress(prev => ({ ...prev, ...profile.shipping_address }))
      }
      if (profile.billing_address) {
        setBillingAddress(profile.billing_address)
        setSameAsBilling(false)
      }
    }
  }

  const loadCheckoutData = () => {
    const saved = localStorage.getItem('anoint-checkout')
    if (saved) {
      try {
        setCheckoutData(JSON.parse(saved))
      } catch (error) {
        console.error('Error loading checkout data:', error)
        router.push('/cart')
      }
    } else {
      router.push('/cart')
    }
  }

  const fetchShippingRates = async () => {
    if (!checkoutData) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/shipping-rates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({
          origin: {
            line1: '123 Main St',
            city: 'Toronto',
            state: 'ON',
            postal_code: 'M5V 3A8',
            country: 'CA'
          },
          destination: shippingAddress,
          packages: [{
            weight: 500, // 500g default
            length: 20,
            width: 15,
            height: 10,
            value: checkoutData.subtotal
          }]
        })
      })

      if (response.ok) {
        const data = await response.json()
        setShippingRates(data.rates || [])
        if (data.rates && data.rates.length > 0) {
          setSelectedShipping(data.rates[0]) // Select cheapest by default
        }
      }
    } catch (error) {
      console.error('Error fetching shipping rates:', error)
    }
  }

  const validateShippingForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!shippingAddress.name.trim()) newErrors.name = 'Name is required'
    if (!shippingAddress.line1.trim()) newErrors.line1 = 'Address is required'
    if (!shippingAddress.city.trim()) newErrors.city = 'City is required'
    if (!shippingAddress.state.trim()) newErrors.state = 'Province/State is required'
    if (!shippingAddress.postal_code.trim()) newErrors.postal_code = 'Postal code is required'
    
    // Validate Canadian postal code format
    if (shippingAddress.country === 'CA' && shippingAddress.postal_code) {
      const canadianPostalCode = /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/
      if (!canadianPostalCode.test(shippingAddress.postal_code)) {
        newErrors.postal_code = 'Invalid Canadian postal code format (A1A 1A1)'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const validatePaymentForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!selectedShipping) newErrors.shipping = 'Please select a shipping method'
    if (!acceptTerms) newErrors.terms = 'You must accept the terms and conditions'
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNextStep = () => {
    if (step === 'shipping') {
      if (validateShippingForm()) {
        setStep('payment')
      }
    } else if (step === 'payment') {
      if (validatePaymentForm()) {
        setStep('review')
      }
    }
  }

  const processPayment = async () => {
    if (!checkoutData || !user) return

    setLoading(true)
    try {
      let response: Response
      
      const orderData = {
        items: checkoutData.items,
        success_url: `${window.location.origin}/checkout/success`,
        cancel_url: `${window.location.origin}/checkout`,
        customer_email: user.email,
        coupon_code: checkoutData.coupon_code,
        shipping_address: shippingAddress,
        billing_address: sameAsBilling ? shippingAddress : billingAddress,
        shipping_option: selectedShipping,
        metadata: {
          user_id: user.id,
          step: 'checkout'
        }
      }

      switch (paymentMethod.type) {
        case 'stripe':
          response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/stripe-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify(orderData)
          })
          
          if (response.ok) {
            const data = await response.json()
            window.location.href = data.url
          }
          break

        case 'paypal':
          response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/paypal-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              ...orderData,
              return_url: orderData.success_url,
              cancel_url: orderData.cancel_url
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            window.location.href = data.approvalUrl
          }
          break

        case 'crypto':
          response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/nowpayments-checkout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
            },
            body: JSON.stringify({
              ...orderData,
              currency: paymentMethod.crypto_currency || 'BTC'
            })
          })
          
          if (response.ok) {
            const data = await response.json()
            window.location.href = data.invoice.payment_url
          }
          break
      }

      if (!response?.ok) {
        const errorData = await response?.json()
        throw new Error(errorData?.message || 'Payment processing failed')
      }

    } catch (error) {
      console.error('Payment error:', error)
      setErrors({ payment: error instanceof Error ? error.message : 'Payment failed' })
    } finally {
      setLoading(false)
    }
  }

  if (!checkoutData) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
          <p className="mt-4">Loading checkout...</p>
        </div>
      </div>
    )
  }

  const totalWithShipping = checkoutData.total + (selectedShipping?.cost_cents || 0)

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-purple-400 mb-2">Secure Checkout</h1>
          <p className="text-gray-400">Complete your mystical purchase</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {['shipping', 'payment', 'review'].map((stepName, index) => {
              const isActive = step === stepName
              const isCompleted = ['shipping', 'payment', 'review'].indexOf(step) > index
              
              return (
                <div key={stepName} className="flex items-center">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    isActive ? 'border-purple-500 bg-purple-600' :
                    isCompleted ? 'border-green-500 bg-green-600' :
                    'border-gray-600 bg-gray-800'
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="h-5 w-5 text-white" />
                    ) : (
                      <span className="text-sm font-semibold">{index + 1}</span>
                    )}
                  </div>
                  <span className={`ml-2 text-sm ${
                    isActive ? 'text-purple-400' :
                    isCompleted ? 'text-green-400' :
                    'text-gray-500'
                  }`}>
                    {stepName.charAt(0).toUpperCase() + stepName.slice(1)}
                  </span>
                  {index < 2 && <div className="w-8 h-px bg-gray-600 ml-4" />}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center mb-6">
                  <TruckIcon className="h-6 w-6 text-purple-400 mr-2" />
                  <h2 className="text-xl font-bold">Shipping Information</h2>
                </div>

                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={shippingAddress.name}
                      onChange={(e) => setShippingAddress({...shippingAddress, name: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="John Doe"
                    />
                    {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Address</label>
                    <input
                      type="text"
                      value={shippingAddress.line1}
                      onChange={(e) => setShippingAddress({...shippingAddress, line1: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="123 Main Street"
                    />
                    {errors.line1 && <p className="text-red-400 text-sm mt-1">{errors.line1}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Apartment, unit, etc. (optional)</label>
                    <input
                      type="text"
                      value={shippingAddress.line2}
                      onChange={(e) => setShippingAddress({...shippingAddress, line2: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="Apt 4B"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">City</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="Toronto"
                      />
                      {errors.city && <p className="text-red-400 text-sm mt-1">{errors.city}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Province/State</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({...shippingAddress, state: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="ON"
                      />
                      {errors.state && <p className="text-red-400 text-sm mt-1">{errors.state}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Postal Code</label>
                      <input
                        type="text"
                        value={shippingAddress.postal_code}
                        onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                        placeholder="M5V 3A8"
                      />
                      {errors.postal_code && <p className="text-red-400 text-sm mt-1">{errors.postal_code}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Country</label>
                      <select
                        value={shippingAddress.country}
                        onChange={(e) => setShippingAddress({...shippingAddress, country: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      >
                        <option value="CA">Canada</option>
                        <option value="US">United States</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Phone (optional)</label>
                    <input
                      type="tel"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                      className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>
                </form>
              </div>
            )}

            {step === 'payment' && (
              <div className="space-y-6">
                {/* Shipping Options */}
                {shippingRates.length > 0 && (
                  <div className="bg-gray-800 rounded-lg p-6">
                    <h2 className="text-xl font-bold mb-4">Shipping Options</h2>
                    <div className="space-y-3">
                      {shippingRates.map((rate, index) => (
                        <label key={index} className="flex items-center p-3 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500">
                          <input
                            type="radio"
                            name="shipping"
                            value={index}
                            checked={selectedShipping === rate}
                            onChange={() => setSelectedShipping(rate)}
                            className="mr-3"
                          />
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <span className="font-medium">{rate.service}</span>
                              <span className="font-bold">${(rate.cost_cents / 100).toFixed(2)}</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                              {rate.carrier} • {rate.delivery_days} business days
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                    {errors.shipping && <p className="text-red-400 text-sm mt-2">{errors.shipping}</p>}
                  </div>
                )}

                {/* Payment Methods */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <div className="flex items-center mb-6">
                    <CreditCardIcon className="h-6 w-6 text-purple-400 mr-2" />
                    <h2 className="text-xl font-bold">Payment Method</h2>
                  </div>

                  <div className="space-y-4">
                    {PAYMENT_METHODS.map((method) => (
                      <label key={method.type} className="flex items-center p-4 border border-gray-600 rounded-lg cursor-pointer hover:border-purple-500">
                        <input
                          type="radio"
                          name="payment"
                          value={method.type}
                          checked={paymentMethod.type === method.type}
                          onChange={() => setPaymentMethod({ type: method.type })}
                          className="mr-3"
                        />
                        <div className="flex items-center flex-1">
                          <span className="text-2xl mr-3">{method.icon}</span>
                          <div>
                            <span className="font-medium">{method.name}</span>
                            <p className="text-gray-400 text-sm">{method.description}</p>
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Crypto Currency Selection */}
                  {paymentMethod.type === 'crypto' && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-300 mb-2">Select Cryptocurrency</label>
                      <select
                        value={paymentMethod.crypto_currency || 'BTC'}
                        onChange={(e) => setPaymentMethod({...paymentMethod, crypto_currency: e.target.value})}
                        className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      >
                        {CRYPTO_CURRENCIES.map(crypto => (
                          <option key={crypto.code} value={crypto.code}>
                            {crypto.name} ({crypto.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={acceptTerms}
                      onChange={(e) => setAcceptTerms(e.target.checked)}
                      className="mt-1 mr-3"
                    />
                    <div className="text-sm">
                      <p>I agree to the <a href="/terms" className="text-purple-400 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-purple-400 hover:underline">Privacy Policy</a></p>
                    </div>
                  </label>
                  {errors.terms && <p className="text-red-400 text-sm mt-2">{errors.terms}</p>}
                </div>
              </div>
            )}

            {step === 'review' && (
              <div className="bg-gray-800 rounded-lg p-6">
                <h2 className="text-xl font-bold mb-6">Review Your Order</h2>
                
                {/* Order Items */}
                <div className="space-y-4 mb-6">
                  {checkoutData.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-gray-700 rounded-lg">
                      <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                        {item.image ? (
                          <Image
                            src={item.image}
                            alt={item.title}
                            fill
                            className="object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-600 flex items-center justify-center">
                            <span className="text-gray-400">🔮</span>
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-gray-400 text-sm">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">${((item.price * item.quantity) / 100).toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Shipping & Payment Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-medium mb-2">Shipping Address</h3>
                    <div className="text-gray-400 text-sm">
                      <p>{shippingAddress.name}</p>
                      <p>{shippingAddress.line1}</p>
                      {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postal_code}</p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2">Payment & Shipping</h3>
                    <div className="text-gray-400 text-sm">
                      <p>Payment: {PAYMENT_METHODS.find(m => m.type === paymentMethod.type)?.name}</p>
                      {selectedShipping && (
                        <p>Shipping: {selectedShipping.service} (${(selectedShipping.cost_cents / 100).toFixed(2)})</p>
                      )}
                    </div>
                  </div>
                </div>

                {errors.payment && (
                  <div className="mb-4 p-3 bg-red-900 border border-red-700 rounded-lg flex items-center">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-red-400">{errors.payment}</p>
                  </div>
                )}

                <button
                  onClick={processPayment}
                  disabled={loading}
                  className="w-full bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    <>
                      <LockClosedIcon className="h-5 w-5 mr-2" />
                      Complete Order - ${(totalWithShipping / 100).toFixed(2)} CAD
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <button
                onClick={() => {
                  if (step === 'payment') setStep('shipping')
                  else if (step === 'review') setStep('payment')
                  else router.push('/cart')
                }}
                className="bg-gray-700 hover:bg-gray-600 px-6 py-2 rounded-lg transition-colors"
              >
                {step === 'shipping' ? 'Back to Cart' : 'Back'}
              </button>
              
              {step !== 'review' && (
                <button
                  onClick={handleNextStep}
                  className="bg-purple-600 hover:bg-purple-700 px-6 py-2 rounded-lg transition-colors"
                >
                  {step === 'shipping' ? 'Continue to Payment' : 'Review Order'}
                </button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-gray-800 rounded-lg p-6 h-fit">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>
            
            <div className="space-y-3 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-400">Subtotal</span>
                <span>${(checkoutData.subtotal / 100).toFixed(2)}</span>
              </div>
              
              {checkoutData.discount > 0 && (
                <div className="flex justify-between text-green-400">
                  <span>Discount</span>
                  <span>-${(checkoutData.discount / 100).toFixed(2)}</span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-gray-400">Tax</span>
                <span>${(checkoutData.tax / 100).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping</span>
                <span>
                  {selectedShipping 
                    ? `$${(selectedShipping.cost_cents / 100).toFixed(2)}` 
                    : 'Calculated at next step'
                  }
                </span>
              </div>
              
              <div className="border-t border-gray-700 pt-3">
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-purple-400">
                    ${(totalWithShipping / 100).toFixed(2)} CAD
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-center text-sm text-gray-400">
              <LockClosedIcon className="h-4 w-4 inline mr-1" />
              Secure 256-bit SSL encryption
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}