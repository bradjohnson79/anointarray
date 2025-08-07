import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Define protected routes
const protectedRoutes = [
  '/member',
  '/admin'
]

// Define admin-only routes
const adminRoutes = [
  '/admin'
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  
  if (isProtectedRoute) {
    // In a real app, you'd check for valid session tokens
    // For now, we'll allow client-side protection to handle this
    // but we could add server-side session validation here
    
    // Check for auth token (this would be a real JWT or session token)
    const authToken = request.cookies.get('auth-token')?.value
    
    // For development, we'll let client-side protection handle this
    // In production, you'd validate the token here
    if (!authToken && process.env.NODE_ENV === 'production') {
      // Redirect to login if no auth token in production
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*$).*)',
  ],
}