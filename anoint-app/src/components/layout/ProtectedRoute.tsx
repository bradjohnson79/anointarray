import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requiredRole?: string
}

const ProtectedRoute = ({ children, requireAdmin = false, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-purple-400 text-lg">Checking authentication...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />
  }

  // For now, we'll allow all authenticated users access to admin routes
  // In a real app, you'd check user roles here
  if (requireAdmin || requiredRole) {
    // TODO: Add proper admin role checking
    console.log('Admin access required - implement role checking', requiredRole)
  }

  return <>{children}</>
}

export default ProtectedRoute