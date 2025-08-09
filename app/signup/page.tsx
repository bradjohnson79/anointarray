'use client'

// Clean signup page following CLAUDE_GLOBAL_RULES.md - no console.log statements
// Uses new AuthenticationService and clean error handling

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/auth-context'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()
  const { signUp, error, isLoading, user, clearError } = useAuth()

  // No redirect logic needed - AuthContext handles all redirects

  // Clear any existing errors when component mounts
  useEffect(() => {
    clearError()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    // Client-side validation
    if (password !== confirmPassword) {
      // This would need to be handled by setting a local error state
      // since our auth context doesn't handle validation errors
      return
    }

    if (password.length < 6) {
      return
    }

    const success = await signUp(
      email.trim(),
      password.trim(),
      displayName.trim() || email.split('@')[0]
    )

    if (success) {
      setSuccess(true)
      // Don't redirect automatically - user can navigate manually
    }
    // Error handling is managed by the auth context
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-gray-300 mb-2">
              Your account has been created. Please check your email to confirm your free account.
            </p>
            <p className="text-purple-400 text-sm">
              Redirecting you to login page...
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create Account</h1>
          <p className="text-purple-300">Join ANOINT Array</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Your name (optional)"
            />
          </div>

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

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent pr-10"
                placeholder="Create a password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Confirm your password"
              required
            />
          </div>

          {(password !== confirmPassword && confirmPassword) && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              Passwords do not match
            </div>
          )}

          {(password.length > 0 && password.length < 6) && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              Password must be at least 6 characters
            </div>
          )}

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
            {isLoading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm text-center">
            Already have an account?{' '}
            <a href="/login" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}