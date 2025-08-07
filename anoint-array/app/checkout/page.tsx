'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AuroraBackground from '@/components/AuroraBackground'
import { 
  CreditCard, 
  ArrowLeft, 
  Shield, 
  Clock, 
  CheckCircle,
  AlertTriangle,
  Copy,
  QrCode,
  Loader2,
  Lock,
  User,
  Mail,
  Phone,
  MapPin
} from 'lucide-react'
import { getProductById } from '@/lib/products'
import { formatCurrency, calculateTax, hasPhysicalItems, type ShippingAddress } from '@/lib/shipping'
import { 
  PAYMENT_METHODS, 
  processStripePayment,
  processPayPalPayment,
  processNOWPayment,
  calculateProcessingFee,
  generateOrderId,
  validatePaymentMethod,
  formatCryptoAmount,
  getCryptoNetworkFees,
  type PaymentMethod,
  type OrderData,
  type PaymentResult,
  type CryptoPaymentDetails
} from '@/lib/payments'

interface CartItem {
  productId: string
  quantity: number
}

export default function CheckoutPage() {
  const router = useRouter()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [orderData, setOrderData] = useState<OrderData | null>(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null)
  const [processing, setProcessing] = useState(false)
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null)
  const [cryptoDetails, setCryptoDetails] = useState<CryptoPaymentDetails | null>(null)
  const [step, setStep] = useState<'review' | 'payment' | 'processing' | 'complete' | 'crypto-pending'>('review')
  
  // Form states
  const [customerInfo, setCustomerInfo] = useState({
    email: '',
    name: '',
    phone: ''
  })
  
  const [billingAddress, setBillingAddress] = useState<ShippingAddress>({
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
  
  const [useSameAsShipping, setUseSameAsShipping] = useState(true)
  const [agreeToTerms, setAgreeToTerms] = useState(false)

  useEffect(() => {
    // Load cart and shipping info from localStorage
    const savedCart = localStorage.getItem('cart')
    const savedShipping = localStorage.getItem('shippingAddress')
    const savedShippingRate = localStorage.getItem('selectedShippingRate')
    
    if (!savedCart) {
      router.push('/cart')
      return
    }

    const cart = JSON.parse(savedCart)
    setCartItems(cart)

    // Build order data
    const items = cart.map((item: CartItem) => {
      const product = getProductById(item.productId)
      return {
        productId: item.productId,
        title: product?.title || 'Unknown Product',
        quantity: item.quantity,
        price: product?.price || 0,
        productType: product?.productType || 'physical'
      }
    }).filter((item: any) => item.title !== 'Unknown Product')

    const subtotal = items.reduce((total: number, item: any) => total + (item.price * item.quantity), 0)
    const shippingAddress = savedShipping ? JSON.parse(savedShipping) : null
    const shippingRate = savedShippingRate ? JSON.parse(savedShippingRate) : null
    const shipping = shippingRate?.price || 0
    const taxes = calculateTax(subtotal, shipping, shippingAddress?.province || 'ON')

    const order: OrderData = {
      orderId: generateOrderId(),
      items,
      subtotal,
      shipping,
      taxes,
      total: subtotal + shipping + taxes.total,
      currency: 'CAD',
      customer: customerInfo,
      shippingAddress,
      billingAddress: useSameAsShipping ? shippingAddress : billingAddress
    }

    setOrderData(order)
    
    // Pre-fill customer info if available
    if (shippingAddress) {
      setCustomerInfo(prev => ({
        ...prev,
        name: shippingAddress.name,
        phone: shippingAddress.phone || ''
      }))
      
      if (useSameAsShipping) {
        setBillingAddress(shippingAddress)
      }
    }
  }, [])

  const handlePaymentMethodSelect = (method: PaymentMethod) => {
    if (!orderData) return
    
    const validation = validatePaymentMethod(
      method.id,
      orderData.total,
      hasPhysicalItems(orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        product: {
          title: item.title,
          price: item.price,
          productType: item.productType
        }
      })))
    )

    if (!validation.valid) {
      alert(validation.message)
      return
    }

    setSelectedPaymentMethod(method)
    setStep('payment')
  }

  const handleProcessPayment = async () => {
    if (!orderData || !selectedPaymentMethod || !agreeToTerms) return

    // Update order with customer info
    const updatedOrder = {
      ...orderData,
      customer: customerInfo,
      billingAddress: useSameAsShipping ? orderData.shippingAddress : billingAddress
    }

    setProcessing(true)
    setStep('processing')

    try {
      let result: PaymentResult & { cryptoDetails?: CryptoPaymentDetails }

      switch (selectedPaymentMethod.type) {
        case 'stripe':
          result = await processStripePayment(updatedOrder, 'pm_mock_success')
          break
        
        case 'paypal':
          result = await processPayPalPayment(updatedOrder)
          if (result.success && result.redirectUrl) {
            window.location.href = result.redirectUrl
            return
          }
          break
        
        case 'nowpayments':
          const cryptoCurrency = selectedPaymentMethod.id.split('-')[1].toUpperCase()
          result = await processNOWPayment(updatedOrder, cryptoCurrency)
          if (result.success && result.cryptoDetails) {
            setCryptoDetails(result.cryptoDetails)
            setStep('crypto-pending')
            setPaymentResult(result)
            return
          }
          break
        
        default:
          throw new Error('Unsupported payment method')
      }

      setPaymentResult(result)
      
      if (result.success) {
        // Clear cart on successful payment
        localStorage.removeItem('cart')
        localStorage.removeItem('shippingAddress')
        localStorage.removeItem('selectedShippingRate')
        setStep('complete')
      } else {
        setStep('payment')
      }
    } catch (error) {
      console.error('Payment processing error:', error)
      setPaymentResult({
        success: false,
        status: 'failed',
        message: 'Payment processing failed. Please try again.',
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      setStep('payment')
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  if (!orderData) {
    return (
      <div className="min-h-screen bg-gray-900 relative flex items-center justify-center">
        <AuroraBackground variant="subtle" />
        <div className="relative z-10">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-white">Loading checkout...</p>
        </div>
      </div>
    )
  }

  const processingFee = selectedPaymentMethod ? calculateProcessingFee(orderData.total, selectedPaymentMethod) : 0
  const finalTotal = orderData.total + processingFee

  return (
    <div className="min-h-screen bg-gray-900 relative">
      <AuroraBackground variant="subtle" />
      
      {/* Header */}
      <div className="relative z-10 bg-gray-800/80 backdrop-blur-lg border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => step === 'review' ? router.back() : setStep('review')}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white">Secure Checkout</h1>
              <div className="flex items-center space-x-2 mt-1">
                <Shield className="w-4 h-4 text-green-400" />
                <p className="text-gray-400">256-bit SSL encrypted</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {[
              { key: 'review', label: 'Review Order', icon: CheckCircle },
              { key: 'payment', label: 'Payment', icon: CreditCard },
              { key: 'complete', label: 'Complete', icon: CheckCircle }
            ].map((stepItem, index) => {
              const Icon = stepItem.icon
              const isActive = step === stepItem.key || (step === 'processing' && stepItem.key === 'payment') || (step === 'crypto-pending' && stepItem.key === 'payment')
              const isCompleted = (step === 'payment' || step === 'processing' || step === 'complete' || step === 'crypto-pending') && stepItem.key === 'review'
              
              return (
                <div key={stepItem.key} className="flex items-center">
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-lg ${
                    isActive ? 'bg-purple-600 text-white' : 
                    isCompleted ? 'bg-green-600 text-white' : 
                    'bg-gray-700 text-gray-400'
                  }`}>
                    <Icon size={16} />
                    <span className="text-sm font-medium">{stepItem.label}</span>
                  </div>
                  {index < 2 && (
                    <div className={`w-8 h-0.5 mx-4 ${
                      (step === 'payment' || step === 'processing' || step === 'complete' || step === 'crypto-pending') && index === 0 ? 'bg-green-500' :
                      step === 'complete' && index === 1 ? 'bg-green-500' :
                      'bg-gray-600'
                    }`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Review Step */}
            {step === 'review' && (
              <div className="space-y-6">
                {/* Customer Information */}
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center space-x-2">
                      <User className="w-5 h-5 text-blue-400" />
                      <h3 className="text-lg font-semibold text-white">Customer Information</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Mail className="w-4 h-4 inline mr-2" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={customerInfo.email}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
                          required
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                          placeholder="your@email.com"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <User className="w-4 h-4 inline mr-2" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          value={customerInfo.name}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
                          required
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          <Phone className="w-4 h-4 inline mr-2" />
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={customerInfo.phone}
                          onChange={(e) => setCustomerInfo(prev => ({ ...prev, phone: e.target.value }))}
                          className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Billing Address */}
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                  <div className="p-6 border-b border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-5 h-5 text-green-400" />
                        <h3 className="text-lg font-semibold text-white">Billing Address</h3>
                      </div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={useSameAsShipping}
                          onChange={(e) => setUseSameAsShipping(e.target.checked)}
                          className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500"
                        />
                        <span className="text-sm text-gray-300">Same as shipping</span>
                      </label>
                    </div>
                  </div>
                  
                  {!useSameAsShipping && (
                    <div className="p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                          type="text"
                          placeholder="Full Name"
                          value={billingAddress.name}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, name: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          type="text"
                          placeholder="Company (Optional)"
                          value={billingAddress.company}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, company: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            placeholder="Address Line 1"
                            value={billingAddress.address1}
                            onChange={(e) => setBillingAddress(prev => ({ ...prev, address1: e.target.value }))}
                            className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="City"
                          value={billingAddress.city}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, city: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                        <select
                          value={billingAddress.province}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, province: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:border-purple-500 focus:outline-none"
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
                        <input
                          type="text"
                          placeholder="Postal Code"
                          value={billingAddress.postalCode}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, postalCode: e.target.value.toUpperCase() }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                        <input
                          type="tel"
                          placeholder="Phone (Optional)"
                          value={billingAddress.phone}
                          onChange={(e) => setBillingAddress(prev => ({ ...prev, phone: e.target.value }))}
                          className="px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-purple-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment Methods */}
                <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                  <div className="p-6 border-b border-gray-700">
                    <h3 className="text-lg font-semibold text-white">Select Payment Method</h3>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {PAYMENT_METHODS.map((method) => {
                        const fee = calculateProcessingFee(orderData.total, method)
                        return (
                          <button
                            key={method.id}
                            onClick={() => handlePaymentMethodSelect(method)}
                            className="p-4 border border-gray-600 rounded-lg hover:border-purple-500 transition-colors text-left"
                          >
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="text-2xl">{method.icon}</span>
                              <div>
                                <h4 className="font-semibold text-white">{method.name}</h4>
                                <p className="text-sm text-gray-400">{method.description}</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-400">Fee: {method.fees}%</span>
                              <span className="text-purple-400">+{formatCurrency(fee)}</span>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                              <Clock className="w-3 h-3 text-gray-500" />
                              <span className="text-xs text-gray-500">{method.processingTime}</span>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Payment Step */}
            {step === 'payment' && selectedPaymentMethod && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedPaymentMethod.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{selectedPaymentMethod.name}</h3>
                      <p className="text-gray-400">{selectedPaymentMethod.description}</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6">
                  {selectedPaymentMethod.type === 'stripe' && (
                    <div className="space-y-4">
                      <p className="text-gray-300">You will be redirected to Stripe's secure payment form.</p>
                      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">Secured by Stripe - PCI DSS Level 1 compliant</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedPaymentMethod.type === 'paypal' && (
                    <div className="space-y-4">
                      <p className="text-gray-300">You will be redirected to PayPal to complete your payment.</p>
                      <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-blue-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-sm">PayPal Buyer Protection applies</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {selectedPaymentMethod.type === 'nowpayments' && (
                    <div className="space-y-4">
                      <p className="text-gray-300">Pay with cryptocurrency. Transaction will be confirmed on the blockchain.</p>
                      <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                          <AlertTriangle className="w-4 h-4" />
                          <span className="text-sm font-medium">Important Crypto Payment Information</span>
                        </div>
                        <ul className="text-xs text-gray-300 space-y-1">
                          <li>• Refunds require manual processing with network fees deducted</li>
                          <li>• Digital products are non-refundable</li>
                          <li>• Physical products: 14-day refund policy after delivery</li>
                          <li>• Network fees apply and vary by blockchain congestion</li>
                        </ul>
                      </div>
                      
                      {/* Network Fees Info */}
                      <div className="bg-gray-700/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-white mb-2">Current Network Fees (Estimated)</h4>
                        <div className="grid grid-cols-3 gap-4 text-xs">
                          {Object.entries(getCryptoNetworkFees()).map(([currency, fees]) => (
                            <div key={currency}>
                              <div className="text-gray-400">{currency}</div>
                              <div className="text-white">~{formatCryptoAmount(fees.standard.toString(), currency)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Terms Agreement */}
                  <div className="mt-6 p-4 bg-gray-700/30 rounded-lg">
                    <label className="flex items-start space-x-3">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 text-purple-600 bg-gray-700 border-gray-600 rounded focus:ring-purple-500 mt-1"
                      />
                      <div className="text-sm">
                        <p className="text-gray-300">
                          I agree to the{' '}
                          <button className="text-purple-400 hover:text-purple-300 underline">Terms of Service</button>{' '}
                          and{' '}
                          <button className="text-purple-400 hover:text-purple-300 underline">Privacy Policy</button>.
                          {selectedPaymentMethod.type === 'nowpayments' && (
                            <span className="block mt-1 text-yellow-400">
                              I understand cryptocurrency refund policies and network fees.
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </div>

                  <button
                    onClick={handleProcessPayment}
                    disabled={!agreeToTerms || processing}
                    className="w-full mt-6 flex items-center justify-center space-x-2 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg transition-colors font-semibold text-lg"
                  >
                    <Lock className="w-5 h-5" />
                    <span>Pay {formatCurrency(finalTotal)} Securely</span>
                  </button>
                </div>
              </div>
            )}

            {/* Processing Step */}
            {step === 'processing' && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50 p-8 text-center">
                <Loader2 className="w-12 h-12 animate-spin text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
                <p className="text-gray-400">Please wait while we process your payment securely...</p>
              </div>
            )}

            {/* Crypto Pending Step */}
            {step === 'crypto-pending' && cryptoDetails && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50">
                <div className="p-6 border-b border-gray-700">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{selectedPaymentMethod?.icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Complete Your Cryptocurrency Payment</h3>
                      <p className="text-gray-400">Send the exact amount to the address below</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 space-y-6">
                  {/* Payment Amount */}
                  <div className="bg-gray-700/30 rounded-lg p-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-2">
                        {formatCryptoAmount(cryptoDetails.amount, cryptoDetails.currency)}
                      </div>
                      <div className="text-sm text-gray-400">
                        Expires: {new Date(cryptoDetails.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Payment Address */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Send to this {cryptoDetails.currency} address:
                    </label>
                    <div className="flex items-center space-x-2">
                      <code className="flex-1 px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white text-sm break-all">
                        {cryptoDetails.address}
                      </code>
                      <button
                        onClick={() => copyToClipboard(cryptoDetails.address)}
                        className="p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                        title="Copy Address"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  {/* QR Code */}
                  <div className="text-center">
                    <div className="inline-block p-4 bg-white rounded-lg">
                      <QrCode size={150} className="text-black" />
                      <p className="text-xs text-gray-600 mt-2">Scan to pay</p>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      Scan with your crypto wallet or copy the address above
                    </p>
                  </div>

                  {/* Status */}
                  <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4">
                    <div className="flex items-center space-x-2 text-yellow-400 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="font-medium">Waiting for payment...</span>
                    </div>
                    <p className="text-sm text-gray-300">
                      Confirmations: {cryptoDetails.confirmations} / {cryptoDetails.requiredConfirmations}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Your order will be processed once the payment is confirmed on the blockchain.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Complete Step */}
            {step === 'complete' && paymentResult && (
              <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50 p-8 text-center">
                {paymentResult.success ? (
                  <>
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Payment Successful!</h3>
                    <p className="text-gray-400 mb-6">Your order has been confirmed and is being processed.</p>
                    <div className="space-y-2 text-sm">
                      <p className="text-gray-300">Order ID: <span className="font-mono text-purple-400">{orderData.orderId}</span></p>
                      {paymentResult.transactionId && (
                        <p className="text-gray-300">Transaction ID: <span className="font-mono text-purple-400">{paymentResult.transactionId}</span></p>
                      )}
                    </div>
                    <div className="flex space-x-4 mt-6">
                      <button
                        onClick={() => router.push('/products')}
                        className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                      >
                        Continue Shopping
                      </button>
                      <button
                        onClick={() => router.push('/member/dashboard')}
                        className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                      >
                        View Orders
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h3 className="text-2xl font-semibold text-white mb-2">Payment Failed</h3>
                    <p className="text-gray-400 mb-6">{paymentResult.message}</p>
                    <button
                      onClick={() => setStep('payment')}
                      className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                    >
                      Try Again
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="bg-gray-800/60 backdrop-blur-lg rounded-lg border border-gray-700/50 h-fit">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">Order Summary</h3>
            </div>
            
            <div className="p-6">
              {/* Items */}
              <div className="space-y-3 mb-6">
                {orderData.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-300">
                      {item.title} × {item.quantity}
                    </span>
                    <span className="text-white">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 text-sm border-t border-gray-700 pt-4">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(orderData.subtotal)}</span>
                </div>
                
                {orderData.shipping > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Shipping</span>
                    <span>{formatCurrency(orderData.shipping)}</span>
                  </div>
                )}
                
                {orderData.taxes.hst > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>HST</span>
                    <span>{formatCurrency(orderData.taxes.hst)}</span>
                  </div>
                )}
                
                {orderData.taxes.gst > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>GST</span>
                    <span>{formatCurrency(orderData.taxes.gst)}</span>
                  </div>
                )}
                
                {orderData.taxes.pst > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>PST</span>
                    <span>{formatCurrency(orderData.taxes.pst)}</span>
                  </div>
                )}
                
                {selectedPaymentMethod && processingFee > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Processing Fee ({selectedPaymentMethod.fees}%)</span>
                    <span>{formatCurrency(processingFee)}</span>
                  </div>
                )}
                
                <div className="border-t border-gray-700 pt-2 mt-2">
                  <div className="flex justify-between text-lg font-bold text-white">
                    <span>Total</span>
                    <span>{formatCurrency(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}