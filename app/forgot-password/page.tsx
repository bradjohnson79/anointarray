'use client'

// Clean forgot password page following CLAUDE_GLOBAL_RULES.md
// Uses new AuthenticationService and clean error handling

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { requestPasswordReset, error, isLoading, user, clearError } = useAuth()

  // Redirect if user is already authenticated
  useEffect(() => {
    if (user && user.emailVerified) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'
      router.replace(redirectPath)
    }
  }, [user, router])

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await requestPasswordReset(email.trim())
    
    if (result) {
      setSuccess(true)
    }
    // Error handling is managed by the auth context
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Check your email</h2>
            <p className="text-gray-300 mb-6">
              We've sent a password reset link to <span className="font-medium text-purple-400">{email}</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              If you don't see the email, check your spam folder or try again.
            </p>
          </div>
          
          <a
            href="/login"
            className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium"
          >
            <ArrowLeft size={16} className="mr-2" />
            Back to login
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Reset Password</h1>
          <p className="text-purple-300">Enter your email to receive a reset link</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Enter your email"
              required
            />
          </div>

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              <div className="font-medium">{error.message}</div>
              {error.remediation && (
                <div className="text-sm text-red-400 mt-1">{error.remediation}</div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm text-center">
            Remember your password?{' '}
            <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}