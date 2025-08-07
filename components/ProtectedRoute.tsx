'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'member'
  redirectTo?: string
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'member',
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth()
  const router = useRouter()
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isLoading && isMounted) {
      if (!isAuthenticated) {
        router.push(redirectTo)
        return
      }

      if (requiredRole && user) {
        const hasPermission = requiredRole === 'member' 
          ? (user.role === 'admin' || user.role === 'member')
          : user.role === requiredRole

        if (!hasPermission) {
          router.push('/unauthorized')
          return
        }
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router, redirectTo, isMounted])

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

  if (!isAuthenticated || (requiredRole && user && !((requiredRole === 'member' && (user.role === 'admin' || user.role === 'member')) || user.role === requiredRole))) {
    return null
  }

  return <>{children}</>
}