'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  Loader2, 
  ArrowLeft, 
  Shield,
  CheckCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react'

interface CartItem {
  productId: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface PaymentGatewayProps {
  cartItems: CartItem[]
  totalAmount: number
  sealArrayImage: string
  onBack: () => void
  onSuccess: (orderRef: string) => void
}

interface CustomerInfo {
  email: string
  name: string
  address?: {
    line1: string
    city: string
    state: string
    postal_code: string
    country: string
  }
}

export default function PaymentGateway({ 
  cartItems, 
  totalAmount, 
  sealArrayImage, 
  onBack, 
  onSuccess 
}: PaymentGatewayProps) {
  const [selectedMethod, setSelectedMethod] = useState<'stripe' | 'paypal' | 'nowpayments' | null>(null)
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    email: '',
    name: ''
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [step, setStep] = useState<'method' | 'info' | 'processing'>('method')

  const paymentMethods = [
    {
      id: 'stripe' as const,
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, MasterCard, American Express',
      icon: '💳',
      fees: '2.9% + $0.30',
      popular: true,
      available: true
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with your PayPal account or card',
      icon: '🅿️',
      fees: '2.9% + $0.30',
      popular: true,
      available: true
    },
    {
      id: 'nowpayments' as const,
      name: 'Cryptocurrency',
      description: 'Pay with Bitcoin, Ethereum, USDT, and more',
      icon: '₿',
      fees: '~1%',
      popular: false,
      available: true
    }
  ]

  const handlePaymentMethod = (method: 'stripe' | 'paypal' | 'nowpayments') => {
    setSelectedMethod(method)
    setStep('info')
    setError(null)
  }

  const handleCustomerInfo = (e: React.FormEvent) => {
    e.preventDefault()
    if (!customerInfo.email || !customerInfo.name) {
      setError('Please fill in all required fields')
      return
    }
    setStep('processing')
    processPayment()
  }

  const processPayment = async () => {
    if (!selectedMethod) return
    
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/merchandise/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          paymentMethod: selectedMethod,
          cartItems,
          sealArrayImage,
          customerInfo,
          totalAmount
        })
      })

      const result = await response.json()

      if (result.success) {
        // Redirect to payment gateway
        if (result.checkout_url) {
          window.open(result.checkout_url, '_blank')
        }
        
        // Call success callback
        onSuccess(result.orderReference)
      } else {
        setError(result.error || 'Payment processing failed')
        setStep('info') // Go back to info step
      }
    } catch (error) {
      console.error('Payment error:', error)
      setError('Unable to process payment. Please try again.')
      setStep('info')
    } finally {
      setIsProcessing(false)
    }
  }

  const renderMethodSelection = () => (
    <div className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Choose Payment Method</h3>
        <p className="text-gray-400">Select how you'd like to pay for your custom merchandise</p>
        <div className="mt-4 p-3 bg-green-900/20 rounded-lg border border-green-700/50">
          <div className="text-lg font-bold text-green-400">Total: ${totalAmount.toFixed(2)}</div>
          <div className="text-sm text-gray-300">{cartItems.reduce((sum, item) => sum + item.quantity, 0)} items</div>
        </div>
      </div>

      <div className="grid gap-3">
        {paymentMethods.map(method => (
          <Card 
            key={method.id}
            className={`cursor-pointer transition-all duration-200 ${
              method.available 
                ? 'bg-gray-800/60 hover:bg-gray-700/60 border-gray-700/50 hover:border-purple-500/50' 
                : 'bg-gray-800/30 border-gray-700/30 opacity-50'
            }`}
            onClick={() => method.available && handlePaymentMethod(method.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{method.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{method.name}</h4>
                      {method.popular && (
                        <Badge className="bg-purple-600/20 text-purple-300 text-xs">Popular</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-400">{method.description}</p>
                    <p className="text-xs text-gray-500">Processing fee: {method.fees}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {method.available ? (
                    <CheckCircle className="h-5 w-5 text-green-400" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-orange-400" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Alert className="bg-blue-900/60 border-blue-700/50 text-blue-200">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          All payments are processed securely through trusted third-party providers. 
          Your payment information is never stored on our servers.
        </AlertDescription>
      </Alert>
    </div>
  )

  const renderCustomerInfo = () => (
    <form onSubmit={handleCustomerInfo} className="space-y-4">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-white mb-2">Customer Information</h3>
        <p className="text-gray-400">
          Paying with {paymentMethods.find(m => m.id === selectedMethod)?.name}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Email Address *
        </label>
        <input
          type="email"
          required
          value={customerInfo.email}
          onChange={(e) => setCustomerInfo(prev => ({ ...prev, email: e.target.value }))}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
          placeholder="your@email.com"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Full Name *
        </label>
        <input
          type="text"
          required
          value={customerInfo.name}
          onChange={(e) => setCustomerInfo(prev => ({ ...prev, name: e.target.value }))}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400"
          placeholder="Your full name"
        />
      </div>

      {error && (
        <Alert className="bg-red-900/60 border-red-700/50 text-red-200">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep('method')}
          className="flex-1"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button
          type="submit"
          disabled={!customerInfo.email || !customerInfo.name}
          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
        >
          Continue to Payment
          <ExternalLink className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </form>
  )

  const renderProcessing = () => (
    <div className="text-center space-y-6">
      <div>
        <Loader2 className="h-12 w-12 animate-spin text-purple-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Processing Payment</h3>
        <p className="text-gray-400">
          Redirecting you to {paymentMethods.find(m => m.id === selectedMethod)?.name} to complete your payment...
        </p>
      </div>

      <div className="p-4 bg-gray-800/40 rounded-lg border border-gray-700/50">
        <h4 className="font-medium text-white mb-2">Order Summary</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <div className="flex justify-between">
            <span>Items:</span>
            <span>{cartItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
          </div>
          <div className="flex justify-between font-bold text-purple-400">
            <span>Total:</span>
            <span>${totalAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <Alert className="bg-amber-900/60 border-amber-700/50 text-amber-200">
        <AlertDescription>
          Please complete your payment in the new window. This page will be updated once payment is confirmed.
        </AlertDescription>
      </Alert>
    </div>
  )

  return (
    <Card className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <CreditCard className="h-5 w-5" />
          Secure Checkout
        </CardTitle>
      </CardHeader>
      <CardContent>
        {step === 'method' && renderMethodSelection()}
        {step === 'info' && renderCustomerInfo()}
        {step === 'processing' && renderProcessing()}
        
        {step !== 'processing' && (
          <div className="mt-6 pt-4 border-t border-gray-600">
            <Button
              variant="outline"
              onClick={onBack}
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cart
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}