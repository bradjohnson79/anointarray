'use client'

// Clean email verification page following CLAUDE_GLOBAL_RULES.md
// Handles email verification process with clear user guidance

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../../../contexts/auth-context'

export default function VerifyEmailPage() {
  const [emailSent, setEmailSent] = useState(false)
  const router = useRouter()
  const { user, requestPasswordReset, error, isLoading, clearError } = useAuth()

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError()
  }, [])

  // Redirect verified users to dashboard
  useEffect(() => {
    if (user && user.emailVerified) {
      const redirectPath = user.role === 'admin' ? '/admin/dashboard' : '/member/dashboard'
      router.replace(redirectPath)
    }
  }, [user, router])

  const handleResendEmail = async () => {
    if (!user?.email) return
    
    const result = await requestPasswordReset(user.email)
    if (result) {
      setEmailSent(true)
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
          <AlertCircle size={48} className="text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Authentication Required</h2>
          <p className="text-gray-300 mb-6">Please sign up or log in to access this page.</p>
          <div className="space-y-3">
            <a 
              href="/login"
              className="block w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Sign In
            </a>
            <a 
              href="/signup"
              className="block w-full border border-purple-500 text-purple-400 hover:bg-purple-500/10 font-semibold py-3 px-4 rounded-lg transition-all duration-200"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
        {emailSent ? (
          <>
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Email Sent</h2>
            <p className="text-gray-300 mb-6">
              We've sent a new verification email to <span className="font-medium text-purple-400">{user.email}</span>
            </p>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={32} className="text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">Verify Your Email</h2>
            <p className="text-gray-300 mb-6">
              Please check your email (<span className="font-medium text-purple-400">{user.email}</span>) and click the verification link to activate your account.
            </p>
          </>
        )}

        <p className="text-gray-400 text-sm mb-6">
          If you don't see the email, check your spam folder.
        </p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg mb-6">
            <div className="font-medium">{error.message}</div>
            {error.remediation && (
              <div className="text-sm text-red-400 mt-1">{error.remediation}</div>
            )}
          </div>
        )}

        <button
          onClick={handleResendEmail}
          disabled={isLoading || emailSent}
          className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          {isLoading ? 'Sending...' : emailSent ? 'Email Sent' : 'Resend Verification Email'}
        </button>

        <a
          href="/login"
          className="text-purple-400 hover:text-purple-300 font-medium"
        >
          Back to Login
        </a>
      </div>
    </div>
  )
}