'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  Download, 
  ArrowLeft,
  Loader2,
  AlertTriangle
} from 'lucide-react'

export default function PaymentSuccessPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  
  const sessionId = searchParams.get('session_id')
  const sealId = searchParams.get('seal_id')

  const verifyPaymentAndUnlock = async () => {
    try {
      if (!sessionId || !sealId) {
        throw new Error('Missing payment session information')
      }

      // Verify payment with backend
      const response = await fetch('/api/generator/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId,
          sealId
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || 'Payment verification failed')
      }

      // Payment verified, unlock the download
      setIsUnlocked(true)

      // Notify parent window if this is a popup
      if (window.opener) {
        window.opener.postMessage({
          type: 'payment_success',
          sessionId: sessionId,
          sealId: sealId
        }, window.location.origin)
        
        // Close popup after a delay
        setTimeout(() => {
          window.close()
        }, 3000)
      }

    } catch (error: any) {
      console.error('Payment verification failed:', error)
      setError(error.message || 'Failed to verify payment')
      
      // Notify parent window of error
      if (window.opener) {
        window.opener.postMessage({
          type: 'payment_error',
          error: error.message
        }, window.location.origin)
      }
    } finally {
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    verifyPaymentAndUnlock()
  }, [sessionId, sealId])

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Verifying Payment...</h1>
          <p className="text-gray-600">
            Please wait while we confirm your purchase and unlock your download.
          </p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-red-600 mb-2">Payment Verification Failed</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          
          <div className="space-y-2">
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline"
              className="w-full"
            >
              Try Again
            </Button>
            
            {!window.opener && (
              <Button 
                onClick={() => window.location.href = '/member/generator'}
                className="w-full"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Generator
              </Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        
        <h1 className="text-2xl font-bold text-green-600 mb-2">
          Payment Successful!
        </h1>
        
        <p className="text-gray-600 mb-6">
          Your ANOINT Array purchase has been completed successfully. 
          {window.opener 
            ? ' This window will close automatically.'
            : ' You can now download your personalized seal array.'
          }
        </p>

        <Alert className="mb-6">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your download has been unlocked! You can now access the high-resolution, 
            watermark-free version from the generator page or your member dashboard.
          </AlertDescription>
        </Alert>

        {window.opener ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-500">
              This popup window will close in a few seconds...
            </p>
            <Button 
              onClick={() => window.close()}
              variant="outline"
              className="w-full"
            >
              Close Window
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Button 
              onClick={() => window.location.href = '/member/generator'}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              <Download className="mr-2 h-4 w-4" />
              Go to Downloads
            </Button>
            
            <Button 
              onClick={() => window.location.href = '/member/dashboard'}
              variant="outline"
              className="w-full"
            >
              View Dashboard
            </Button>
          </div>
        )}

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500">
            <strong>Transaction ID:</strong> {sessionId}
          </p>
          <p className="text-xs text-gray-500">
            <strong>Seal Array ID:</strong> {sealId}
          </p>
        </div>
      </div>
    </div>
  )
}