'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/auth-store'

export default function Admin() {
  const { user, profile, signOut, loading, initialize } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    initialize()
  }, [initialize])

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login')
      } else if (!profile?.is_admin) {
        router.push('/dashboard')
      }
    }
  }, [user, profile, loading, router])

  const handleSignOut = async () => {
    await signOut()
    // signOut handles the redirect internally
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  if (!user || !profile?.is_admin) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-red-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-white">Admin Panel</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="text-white hover:text-gray-200 px-3 py-2 text-sm"
              >
                Dashboard
              </button>
              <span className="text-white text-sm">
                {user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">
                Administration Dashboard
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800">User Management</h3>
                  <p className="text-blue-700 text-sm mt-2">Manage user accounts and permissions</p>
                  <button className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm">
                    Manage Users
                  </button>
                </div>
                
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800">Content Management</h3>
                  <p className="text-green-700 text-sm mt-2">Manage site content and resources</p>
                  <button className="mt-3 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm">
                    Manage Content
                  </button>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800">System Settings</h3>
                  <p className="text-yellow-700 text-sm mt-2">Configure system preferences</p>
                  <button className="mt-3 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded text-sm">
                    Settings
                  </button>
                </div>
              </div>
              
              <div className="mt-8 bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-4">Current Session</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">User:</span> {user.email}
                  </div>
                  <div>
                    <span className="font-medium">Role:</span> {profile.role || 'admin'}
                  </div>
                  <div>
                    <span className="font-medium">Admin Access:</span> Yes
                  </div>
                  <div>
                    <span className="font-medium">Session ID:</span> {user.id.slice(0, 8)}...
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}