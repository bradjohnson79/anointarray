'use client'

import { useAuthStatus } from '../contexts/auth-context'
import { useState, useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'member'
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'member'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuthStatus()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Show loading spinner while checking authentication
  if (isLoading || !isMounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-300 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  // Simple authentication check - let individual pages handle redirects
  if (!isAuthenticated) {
    return null // Page components will handle redirects
  }

  // Simple role check - let individual pages handle role-specific redirects
  if (requiredRole && user) {
    const hasPermission = requiredRole === 'member' 
      ? (user.role === 'admin' || user.role === 'member')
      : user.role === requiredRole

    if (!hasPermission) {
      return null // Page components will handle role redirects
    }
  }

  return <>{children}</>
}