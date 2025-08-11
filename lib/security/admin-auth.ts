// Admin authentication and role verification utilities
// Implements server-side admin role validation for security

import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

/**
 * Verifies if a user has admin privileges
 * This performs server-side verification to prevent client-side tampering
 */
export async function verifyAdminRole(token?: string): Promise<boolean> {
  try {
    if (!token) {
      return false
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin verification
      {
        global: {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      }
    )

    // Get user from the token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      console.warn('Admin verification failed - invalid token')
      return false
    }

    // Check if user has admin role in the database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, is_admin')
      .eq('user_id', user.id)
      .single()

    if (profileError) {
      console.warn('Admin verification failed - no profile found:', profileError.message)
      return false
    }

    // User must have admin role OR is_admin flag set to true
    const isAdmin = profile?.role === 'admin' || profile?.is_admin === true

    if (!isAdmin) {
      console.warn(`User ${user.email} attempted to access admin area without proper role`)
    }

    return isAdmin
  } catch (error) {
    console.error('Admin role verification error:', error)
    return false
  }
}

/**
 * Checks if current user is admin based on cookies
 * Used in middleware for request-level admin verification
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('sb-access-token')?.value || 
                  cookieStore.get('supabase-auth-token')?.value

    if (!token) {
      return false
    }

    return await verifyAdminRole(token)
  } catch (error) {
    console.error('Current user admin check error:', error)
    return false
  }
}

/**
 * Admin route patterns that require role verification
 */
export const ADMIN_PROTECTED_ROUTES = [
  '/admin',
  '/api/admin',
  '/admin/analytics',
  '/admin/users',
  '/admin/products',
  '/admin/orders',
  '/admin/backup'
]

/**
 * Checks if a path requires admin authentication
 */
export function requiresAdminAuth(pathname: string): boolean {
  return ADMIN_PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

/**
 * Admin-only API endpoints that need role verification
 */
export const ADMIN_API_ENDPOINTS = [
  '/api/admin/backup',
  '/api/admin/cache',
  '/api/admin/generator',
  '/api/admin/users',
  '/api/admin/analytics',
  '/api/admin/system'
]

/**
 * Middleware helper to verify admin access for API routes
 */
export function isAdminApiEndpoint(pathname: string): boolean {
  return ADMIN_API_ENDPOINTS.some(endpoint => pathname.startsWith(endpoint))
}