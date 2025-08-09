'use client'

import { useAuth } from '../../contexts/auth-context'
import { useRouter } from 'next/navigation'
import { Shield, ArrowLeft } from 'lucide-react'

export default function UnauthorizedPage() {
  const { user, signOut } = useAuth()
  const router = useRouter()

  const goBack = () => {
    router.back() // Just go back in history, no role-based logic
  }

  const handleLogout = async () => {
    await signOut()
    // AuthContext will handle redirect after logout
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800/80 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-red-500/20 text-center">
        <div className="mb-6">
          <Shield className="mx-auto text-red-400" size={64} />
        </div>
        
        <h1 className="text-2xl font-bold text-white mb-4">Access Denied</h1>
        <p className="text-gray-300 mb-6">
          You don&apos;t have permission to access this page. Please contact an administrator if you believe this is an error.
        </p>
        
        {user && (
          <div className="bg-gray-700/50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-400">Logged in as:</p>
            <p className="text-white font-medium">{user.email}</p>
            <p className="text-purple-300 text-sm">Role: {user.role}</p>
          </div>
        )}

        <div className="space-y-3">
          <button
            onClick={goBack}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft size={16} />
            Go to Dashboard
          </button>
          
          <button
            onClick={handleLogout}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  )
}