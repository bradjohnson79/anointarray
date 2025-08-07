'use client'

import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  XCircle, 
  ArrowLeft,
  RefreshCw
} from 'lucide-react'

export default function PaymentCancelPage() {
  const handleRetry = () => {
    if (window.opener) {
      // Close popup and let parent handle retry
      window.opener.postMessage({
        type: 'payment_cancelled'
      }, window.location.origin)
      window.close()
    } else {
      // Redirect to generator
      window.location.href = '/member/generator'
    }
  }

  const handleBackToGenerator = () => {
    if (window.opener) {
      window.close()
    } else {
      window.location.href = '/member/generator'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <XCircle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your payment was cancelled. No charges have been made to your account.
          You can try again with a different payment method if you'd like.
        </p>

        <Alert className="mb-6">
          <AlertDescription>
            Your ANOINT Array is still saved and ready for purchase. 
            Simply return to the generator to complete your order.
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <Button 
            onClick={handleRetry}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Different Payment Method
          </Button>
          
          <Button 
            onClick={handleBackToGenerator}
            variant="outline"
            className="w-full"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Generator
          </Button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Need help? Contact our support team for assistance with your purchase.
        </p>
      </div>
    </div>
  )
}