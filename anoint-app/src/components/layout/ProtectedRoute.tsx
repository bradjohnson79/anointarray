import { Navigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requiredRole?: 'admin' | 'moderator' | 'vip'
}

const ProtectedRoute = ({ children, requireAdmin = false, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, isAdmin, isModerator, isVip, getUserRole } = useAuth()

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

  // Check role-based access
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Access Denied</h1>
          <p className="text-gray-400 mb-8">You don't have admin privileges to access this page.</p>
          <p className="text-gray-500 text-sm">Your role: {getUserRole() || 'user'}</p>
          <button 
            onClick={() => window.history.back()} 
            className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (requiredRole) {
    let hasAccess = false
    
    switch (requiredRole) {
      case 'admin':
        hasAccess = isAdmin()
        break
      case 'moderator':
        hasAccess = isModerator()
        break
      case 'vip':
        hasAccess = isVip()
        break
      default:
        hasAccess = false
    }

    if (!hasAccess) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-red-500 mb-4">Insufficient Privileges</h1>
            <p className="text-gray-400 mb-8">You need {requiredRole} role to access this page.</p>
            <p className="text-gray-500 text-sm">Your role: {getUserRole() || 'user'}</p>
            <button 
              onClick={() => window.history.back()} 
              className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      )
    }
  }

  return <>{children}</>
}

export default ProtectedRoute