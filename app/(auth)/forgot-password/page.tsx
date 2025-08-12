'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { requestPasswordReset, user, error, clearError } = useAuth()
  const router = useRouter()

  useEffect(() => {
    // Clear any previous errors when component mounts
    clearError()
  }, [clearError])

  useEffect(() => {
    // If user is already logged in, redirect to dashboard
    if (user) {
      router.push('/member/dashboard')
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      return
    }

    setIsLoading(true)
    
    try {
      const success = await requestPasswordReset(email)
      
      if (success) {
        setIsSubmitted(true)
      }
    } catch (err) {
      console.error('Password reset error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
              Check your email
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try again.
            </p>
            <div className="space-y-2">
              <Button
                onClick={() => setIsSubmitted(false)}
                variant="outline"
                className="w-full"
              >
                Try again
              </Button>
              <Button
                onClick={() => router.push('/login')}
                variant="ghost"
                className="w-full"
              >
                Back to sign in
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-cyan-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-cyan-600 bg-clip-text text-transparent">
            Reset your password
          </CardTitle>
          <p className="text-gray-600">Enter your email address and we'll send you a link to reset your password</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm text-center">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
              size="lg"
            >
              {isLoading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/login')}
              className="text-purple-600 hover:text-purple-500 text-sm font-medium"
            >
              Back to sign in
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}