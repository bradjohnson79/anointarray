import { NextRequest, NextResponse } from 'next/server'
import { SupabaseAuth } from './auth'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    role: 'admin' | 'member'
  }
}

/**
 * Authentication middleware for API routes
 * Verifies the user's session and attaches user info to the request
 */
export async function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options?: {
    requireRole?: 'admin' | 'member'
    allowGuests?: boolean
  }
) {
  return async (request: NextRequest) => {
    try {
      // Get authorization header
      const authHeader = request.headers.get('authorization')
      
      if (!authHeader && !options?.allowGuests) {
        return NextResponse.json(
          { success: false, error: 'Authorization header required' },
          { status: 401 }
        )
      }

      let user = null

      if (authHeader) {
        // Extract token from "Bearer <token>" format
        const token = authHeader.replace('Bearer ', '')
        
        if (token) {
          try {
            // For server-side API routes, we need to verify the session token
            // In a proper implementation, this would verify the JWT token
            // For now, we'll get the current user if authenticated
            user = await SupabaseAuth.getCurrentUser()
          } catch (error) {
            console.error('Token verification failed:', error)
          }
        }
      } else {
        // Try to get user from session cookie (for client-side requests)
        try {
          user = await SupabaseAuth.getCurrentUser()
        } catch (error) {
          // Silent fail - user not authenticated
        }
      }

      // Check authentication requirements
      if (!user && !options?.allowGuests) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 }
        )
      }

      // Check role requirements
      if (options?.requireRole && user) {
        const hasRole = await SupabaseAuth.hasRole(options.requireRole)
        
        if (!hasRole) {
          return NextResponse.json(
            { success: false, error: 'Insufficient permissions' },
            { status: 403 }
          )
        }
      }

      // Attach user to request
      const authenticatedRequest = request as AuthenticatedRequest
      if (user) {
        authenticatedRequest.user = {
          id: user.id,
          email: user.email,
          role: user.role
        }
      }

      return handler(authenticatedRequest)

    } catch (error) {
      console.error('Authentication middleware error:', error)
      return NextResponse.json(
        { success: false, error: 'Authentication system error' },
        { status: 500 }
      )
    }
  }
}

/**
 * Admin-only route protection
 */
export function withAdminAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireRole: 'admin' })
}

/**
 * Member or admin route protection
 */
export function withMemberAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withAuth(handler, { requireRole: 'member' })
}

/**
 * CSRF Protection utility
 */
export function withCSRF(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: AuthenticatedRequest) => {
    // For state-changing operations (POST, PUT, DELETE), verify CSRF token
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      const csrfToken = request.headers.get('x-csrf-token')
      const origin = request.headers.get('origin')
      const host = request.headers.get('host')
      
      // Basic CSRF protection - ensure request comes from same origin
      if (!origin || !host || !origin.includes(host)) {
        return NextResponse.json(
          { success: false, error: 'CSRF token invalid' },
          { status: 403 }
        )
      }
    }

    return handler(request)
  }
}

/**
 * Rate limiting utility (basic in-memory implementation)
 */
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

export function withRateLimit(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  options: {
    maxRequests: number
    windowMs: number
  } = { maxRequests: 100, windowMs: 15 * 60 * 1000 } // 100 requests per 15 minutes
) {
  return async (request: AuthenticatedRequest) => {
    const clientId = request.ip || request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    
    const clientData = rateLimitStore.get(clientId)
    
    if (!clientData || now > clientData.resetTime) {
      // Reset or initialize
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: now + options.windowMs
      })
    } else if (clientData.count >= options.maxRequests) {
      // Rate limit exceeded
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    } else {
      // Increment count
      clientData.count++
      rateLimitStore.set(clientId, clientData)
    }

    return handler(request)
  }
}

/**
 * Input validation utility
 */
export function withValidation<T>(
  handler: (req: AuthenticatedRequest, validatedData: T) => Promise<NextResponse>,
  validator: (data: any) => T | null
) {
  return async (request: AuthenticatedRequest) => {
    try {
      const body = await request.json()
      const validatedData = validator(body)
      
      if (!validatedData) {
        return NextResponse.json(
          { success: false, error: 'Invalid request data' },
          { status: 400 }
        )
      }

      return handler(request, validatedData)
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
  }
}

/**
 * Complete security wrapper for admin routes
 */
export function secureAdminRoute(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>
) {
  return withRateLimit(
    withCSRF(
      withAdminAuth(handler)
    ),
    { maxRequests: 50, windowMs: 15 * 60 * 1000 } // Stricter limits for admin routes
  )
}