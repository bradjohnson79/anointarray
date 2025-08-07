'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle, AlertCircle, Loader } from 'lucide-react'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the code and other params from the URL
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        if (error) {
          console.error('Auth callback error:', error, errorDescription)
          setStatus('error')
          setMessage(errorDescription || error)
          return
        }

        if (code) {
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError)
            setStatus('error')
            setMessage(exchangeError.message)
            return
          }

          if (data.session) {
            console.log('✅ Email confirmed, session created:', data.session.user.email)
            setStatus('success')
            setMessage('Email confirmed successfully!')
            
            // Redirect to dashboard after 2 seconds
            setTimeout(() => {
              // Check user role from session
              const isAdmin = data.session.user.email === 'info@anoint.me'
              if (isAdmin) {
                router.push('/admin/dashboard')
              } else {
                router.push('/member/dashboard')
              }
            }, 2000)
          } else {
            setStatus('error')
            setMessage('Failed to create session')
          }
        } else {
          // No code parameter, might be a direct access
          setStatus('error')
          setMessage('Invalid authentication callback')
        }
      } catch (err) {
        console.error('Auth callback error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred during authentication')
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
        {status === 'loading' && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Loader size={32} className="text-purple-400 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Confirming Email...</h2>
            <p className="text-gray-300">Please wait while we verify your email address.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-green-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Email Confirmed!</h2>
            <p className="text-gray-300 mb-2">{message}</p>
            <p className="text-purple-400 text-sm">Redirecting to your dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="mb-6">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle size={32} className="text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verification Failed</h2>
            <p className="text-gray-300 mb-4">{message}</p>
            <div className="space-y-3">
              <a
                href="/login"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Try Logging In
              </a>
              <a
                href="/signup"
                className="block w-full border border-purple-500 text-purple-400 hover:bg-purple-500/10 font-semibold py-3 px-4 rounded-lg transition-colors"
              >
                Create New Account
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}