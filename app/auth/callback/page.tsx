'use client'

// Clean auth callback page following CLAUDE_GLOBAL_RULES.md
// Handles Supabase auth callbacks and redirects users appropriately

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

function CallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Just verify the session exists - AuthContext will handle redirects
        const { data, error } = await supabase.auth.getSession()
        
        if (error || !data.session?.user) {
          router.replace('/login?error=auth_callback_failed')
          return
        }

        // Session exists - let AuthContext handle the redirect logic
        // This will trigger the auth state change and appropriate redirects

      } catch (error) {
        router.replace('/login?error=callback_error')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
        <Loader2 size={48} className="text-purple-400 mx-auto mb-4 animate-spin" />
        <h2 className="text-2xl font-bold text-white mb-4">Completing Authentication</h2>
        <p className="text-gray-300">Please wait while we redirect you...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-cyan-900 flex items-center justify-center p-4">
        <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-purple-500/20 text-center">
          <Loader2 size={48} className="text-purple-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-4">Loading...</h2>
          <p className="text-gray-300">Initializing authentication...</p>
        </div>
      </div>
    }>
      <CallbackContent />
    </Suspense>
  )
}