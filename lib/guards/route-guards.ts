// Route guards following CLAUDE_GLOBAL_RULES.md - pure, testable functions
// Security requirements implementation

import type { AuthenticatedUser, UserRole } from '../types/auth'

export class RouteGuard {
  
  // Check if user has required admin role
  static requireAdmin(user: AuthenticatedUser | null): boolean {
    return user?.role === 'admin' && user.emailVerified === true
  }

  // Check if user has member access (admin or member)
  static requireMember(user: AuthenticatedUser | null): boolean {
    return (
      (user?.role === 'admin' || user?.role === 'member') && 
      user?.emailVerified === true
    )
  }

  // Check if user has specific role
  static hasRole(user: AuthenticatedUser | null, requiredRole: UserRole): boolean {
    if (!user || !user.emailVerified) return false
    
    // Admin can access member routes
    if (requiredRole === 'member') {
      return user.role === 'admin' || user.role === 'member'
    }
    
    // Only admin can access admin routes
    if (requiredRole === 'admin') {
      return user.role === 'admin'
    }
    
    return false
  }

  // Get appropriate redirect path based on user state
  static getRedirectPath(user: AuthenticatedUser | null): string {
    // No user - redirect to login
    if (!user) return '/login'
    
    // User exists but email not verified
    if (!user.emailVerified) return '/auth/verify-email'
    
    // Verified admin user
    if (user.role === 'admin') return '/admin/dashboard'
    
    // Verified member user
    return '/member/dashboard'
  }

  // Check if current path matches user's appropriate dashboard
  static isCorrectDashboard(user: AuthenticatedUser | null, currentPath: string): boolean {
    if (!user) return currentPath === '/login'
    
    if (user.role === 'admin') {
      return currentPath.startsWith('/admin')
    }
    
    return currentPath.startsWith('/member')
  }

  // Validate route access for middleware
  static validateRouteAccess(user: AuthenticatedUser | null, path: string): {
    allowed: boolean
    redirectPath?: string
    reason?: string
  } {
    // Public routes - always allowed
    const publicRoutes = ['/login', '/signup', '/forgot-password', '/auth', '/']
    if (publicRoutes.some(route => path.startsWith(route))) {
      return { allowed: true }
    }

    // No user for protected routes
    if (!user) {
      return {
        allowed: false,
        redirectPath: '/login',
        reason: 'Authentication required'
      }
    }

    // Email verification required
    if (!user.emailVerified) {
      return {
        allowed: false,
        redirectPath: '/auth/verify-email',
        reason: 'Email verification required'
      }
    }

    // Admin routes
    if (path.startsWith('/admin')) {
      if (user.role !== 'admin') {
        return {
          allowed: false,
          redirectPath: '/member/dashboard',
          reason: 'Admin access required'
        }
      }
      return { allowed: true }
    }

    // Member routes (admin can also access)
    if (path.startsWith('/member')) {
      if (user.role !== 'admin' && user.role !== 'member') {
        return {
          allowed: false,
          redirectPath: '/login',
          reason: 'Member access required'
        }
      }
      return { allowed: true }
    }

    // Default: allow access
    return { allowed: true }
  }

  // Check if user should be redirected to their appropriate dashboard
  static shouldRedirectToDashboard(user: AuthenticatedUser | null, currentPath: string): string | null {
    if (!user || !user.emailVerified) return null
    
    // If user is on login/signup pages but authenticated, redirect to dashboard
    const authPages = ['/login', '/signup', '/forgot-password']
    if (authPages.includes(currentPath)) {
      return this.getRedirectPath(user)
    }
    
    // If admin is on member dashboard, redirect to admin dashboard
    if (user.role === 'admin' && currentPath.startsWith('/member')) {
      return '/admin/dashboard'
    }
    
    // If member somehow got to admin dashboard, redirect to member dashboard
    if (user.role === 'member' && currentPath.startsWith('/admin')) {
      return '/member/dashboard'
    }
    
    return null
  }
}