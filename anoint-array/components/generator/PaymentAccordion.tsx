'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, 
  DollarSign, 
  Shield, 
  CheckCircle,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react'

interface PaymentAccordionProps {
  amount: number
  currency: string
  sealArrayId: string
  onSuccess: (sessionId: string, sealArrayImage?: string) => void
  sealArrayImage?: string
}

type PaymentGateway = 'stripe' | 'paypal' | 'nowpayments' | null

export default function PaymentAccordion({ 
  amount, 
  currency, 
  sealArrayId, 
  onSuccess,
  sealArrayImage
}: PaymentAccordionProps) {
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentWindow, setPaymentWindow] = useState<Window | null>(null)

  // Cleanup payment window on unmount
  useEffect(() => {
    return () => {
      if (paymentWindow && !paymentWindow.closed) {
        paymentWindow.close()
      }
    }
  }, [paymentWindow])

  const gateways = [
    {
      id: 'stripe' as const,
      name: 'Credit/Debit Card',
      description: 'Visa, Mastercard, American Express',
      icon: <CreditCard className="h-6 w-6" />,
      fees: 'Processing fees included',
      recommended: true
    },
    {
      id: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: (
        <div className="w-6 h-6 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
          PP
        </div>
      ),
      fees: 'Processing fees included',
      recommended: false
    },
    {
      id: 'nowpayments' as const,
      name: 'Cryptocurrency',
      description: 'Bitcoin, Ethereum, and 100+ coins',
      icon: (
        <div className="w-6 h-6 bg-orange-500 rounded text-white text-xs flex items-center justify-center font-bold">
          ₿
        </div>
      ),
      fees: 'Network fees may apply',
      recommended: false
    }
  ]

  const createPaymentSession = async (gateway: PaymentGateway) => {
    if (!gateway) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/generator/create-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gateway,
          amount,
          currency,
          sealArrayId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Payment creation failed')
      }

      // Open payment window
      const popup = window.open(
        result.url,
        'payment',
        'width=600,height=700,left=200,top=100,scrollbars=yes,resizable=yes'
      )

      if (!popup) {
        throw new Error('Please allow popups for payment processing')
      }

      setPaymentWindow(popup)

      // Listen for payment completion
      const messageListener = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return

        if (event.data.type === 'payment_success') {
          popup.close()
          onSuccess(event.data.sessionId)
          window.removeEventListener('message', messageListener)
        } else if (event.data.type === 'payment_error') {
          popup.close()
          setError(event.data.error || 'Payment failed')
          window.removeEventListener('message', messageListener)
        }
      }

      window.addEventListener('message', messageListener)

      // Check if popup is closed manually
      const checkClosed = setInterval(() => {
        if (popup.closed) {
          clearInterval(checkClosed)
          setIsProcessing(false)
          window.removeEventListener('message', messageListener)
        }
      }, 1000)

    } catch (error) {
      console.error('Payment error:', error)
      setError(error instanceof Error ? error.message : 'Payment processing failed')
    } finally {
      setIsProcessing(false)
    }
  }

  const handlePayment = () => {
    if (!selectedGateway) {
      setError('Please select a payment method')
      return
    }

    createPaymentSession(selectedGateway)
  }

  return (
    <div className="space-y-6">
      {/* Price Summary */}
      <div className="bg-gray-800/60 backdrop-blur-lg border border-gray-700/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-lg font-semibold text-white">ANOINT Array - Personalized Seal</span>
          <Badge className="bg-gradient-to-r from-purple-500 to-cyan-500 text-white text-lg px-3 py-1 border-0">
            ${amount} {currency}
          </Badge>
        </div>
        <div className="text-sm text-gray-300">
          • High-resolution PNG and PDF downloads
          • Watermark-free versions
          • Lifetime access from your dashboard
          • Personal use license included
        </div>
      </div>

      {/* Payment Method Selection */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold flex items-center gap-2 text-white">
          <DollarSign className="h-5 w-5 text-purple-400" />
          Choose Payment Method
        </h3>

        {gateways.map(gateway => (
          <button
            key={gateway.id}
            onClick={() => setSelectedGateway(gateway.id)}
            disabled={isProcessing}
            className={`w-full p-4 border-2 rounded-lg text-left transition-all bg-gray-800/60 backdrop-blur-lg hover:border-purple-400/50 disabled:opacity-50 disabled:cursor-not-allowed ${
              selectedGateway === gateway.id 
                ? 'border-purple-500/50 bg-purple-900/20' 
                : 'border-gray-700/50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {gateway.icon}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{gateway.name}</span>
                    {gateway.recommended && (
                      <Badge className="bg-green-600/80 text-white text-xs border-0">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-300">{gateway.description}</div>
                  <div className="text-xs text-gray-400">{gateway.fees}</div>
                </div>
              </div>
              
              <div className={`w-4 h-4 rounded-full border-2 ${
                selectedGateway === gateway.id 
                  ? 'border-purple-500 bg-purple-500' 
                  : 'border-gray-500'
              }`}>
                {selectedGateway === gateway.id && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Error Display */}
      {error && (
        <Alert className="bg-red-900/60 backdrop-blur-lg border-red-700/50 text-red-200" variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <Alert className="bg-gray-800/60 backdrop-blur-lg border-gray-700/50 text-gray-300">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Your payment is processed securely through our certified payment partners. 
          We never store your payment information.
        </AlertDescription>
      </Alert>

      {/* Payment Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={handlePayment}
          disabled={!selectedGateway || isProcessing}
          size="lg"
          className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-5 w-5" />
              Pay ${amount} {currency}
            </>
          )}
        </Button>
      </div>

      {/* Terms */}
      <div className="text-xs text-gray-400 text-center">
        By completing this purchase, you agree to our{' '}
        <a href="/terms" target="_blank" className="text-purple-400 hover:underline">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="/privacy" target="_blank" className="text-purple-400 hover:underline">
          Privacy Policy
        </a>
        . All sales are final.
      </div>

      {/* Development Only - Payment Bypass */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-8 p-4 border-2 border-dashed border-yellow-500/50 rounded-lg bg-yellow-500/10">
          <div className="text-center mb-3">
            <Badge className="bg-yellow-600 text-white">DEV MODE ONLY</Badge>
            <p className="text-sm text-yellow-400 mt-2">Testing bypass - Not available in production</p>
          </div>
          <Button
            onClick={() => onSuccess('test-session-' + Date.now(), sealArrayImage)}
            variant="outline"
            className="w-full border-yellow-500 text-yellow-400 hover:bg-yellow-500/20"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Simulate Payment (Skip to Merchandise)
          </Button>
        </div>
      )}
    </div>
  )
}