'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter, useSearchParams } from 'next/navigation'
import { Eye, EyeOff, CheckCircle } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const { login, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const registered = searchParams.get('registered')
    if (registered === 'true') {
      setShowSuccess(true)
      // Hide success message after 10 seconds
      const timer = setTimeout(() => setShowSuccess(false), 10000)
      return () => clearTimeout(timer)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Clean the inputs
    const cleanEmail = email.trim()
    const cleanPassword = password.replace(/[*]/g, '').trim() // Remove asterisks and trim
    
    console.log('🔐 Login form submitted with:')
    console.log('  📧 Email from form:', `"${email}"`)
    console.log('  🔑 Password from form:', `"${password}"`)
    console.log('  📧 Clean email:', `"${cleanEmail}"`)
    console.log('  🔑 Clean password:', `"${cleanPassword}"`)
    console.log('  🔄 Auth loading state:', isLoading)

    try {
      console.log('📞 Calling login function...')
      const result = await login(cleanEmail, cleanPassword)
      console.log('📨 Login result received:', result)
      
      if (result.success) {
        console.log('✅ Login successful! Checking session...')
        
        // Small delay to ensure session is stored
        await new Promise(resolve => setTimeout(resolve, 100))
        
        const sessionData = sessionStorage.getItem('anoint_auth_session')
        console.log('💾 Session data:', sessionData)
        
        if (sessionData) {
          const user = JSON.parse(sessionData)
          console.log('👤 Parsed user:', user)
          
          if (user.role === 'admin') {
            console.log('🏠 Redirecting to admin dashboard...')
            window.location.href = '/admin/dashboard'
          } else {
            console.log('🏠 Redirecting to member dashboard...')
            window.location.href = '/member/dashboard'
          }
        } else {
          console.log('⚠️ No session data found, redirecting to admin dashboard as fallback')
          window.location.href = '/admin/dashboard'
        }
      } else {
        console.log('❌ Login failed:', result.error)
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      console.error('🚨 Login error caught:', error)
      setError('An unexpected error occurred')
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">ANOINT Array</h1>
          <p className="text-purple-300">Welcome back</p>
        </div>

        {showSuccess && (
          <div className="mb-6 bg-green-900/50 border border-green-500 text-green-300 px-4 py-3 rounded-lg flex items-center">
            <CheckCircle size={20} className="mr-3 flex-shrink-0" />
            <div>
              <p className="font-medium">Account created successfully!</p>
              <p className="text-sm text-green-400 mt-1">You can now sign in with your credentials below.</p>
            </div>
          </div>
        )}

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
                placeholder="Enter your password"
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

          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center mt-4">
            <a href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
              Forgot your password?
            </a>
          </div>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-700">
          <p className="text-gray-400 text-sm text-center">
            Don't have an account?{' '}
            <a href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}