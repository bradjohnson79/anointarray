import { NextRequest, NextResponse } from 'next/server'

// Define route patterns for different access levels
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/privacy',
  '/terms',
  '/disclaimer',
  '/products',
  '/anoint-array',
  '/catalog',
  '/api/products',
  '/api/products/categories',
  '/api/shipping/rates',
]

const AUTH_ROUTES = [
  '/auth',
  '/auth/callback',
  '/auth/reset-password',
  '/auth/verify-email',
  '/login',
  '/signup',
  '/forgot-password',
]

const PROTECTED_ROUTES = [
  '/member',
  '/cart',
  '/checkout',
  '/generator',
]

const ADMIN_ROUTES = [
  '/admin',
  '/api/admin',
]

const VIP_ROUTES = [
  '/vip-products',
]

export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone()
  const pathname = url.pathname

  // Get session token from cookies
  const token = req.cookies.get('sb-access-token')?.value || 
                req.cookies.get('supabase-auth-token')?.value

  console.log(`Middleware: ${pathname}, Token: ${token ? 'Yes' : 'No'}`)

  // Handle public routes - always allow
  if (PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    return NextResponse.next()
  }

  // Handle auth routes - redirect to dashboard if already logged in
  if (AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + '/'))) {
    if (token && pathname !== '/auth/callback') {
      url.pathname = '/member/dashboard'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Handle webhook routes - allow without auth
  if (pathname.startsWith('/api/webhooks/')) {
    return NextResponse.next()
  }

  // Handle protected routes - require authentication
  if (PROTECTED_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // Handle admin routes - require admin role
  if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // For now, allow all authenticated users to admin routes
    // In production, you'd verify admin role server-side
    return NextResponse.next()
  }

  // Handle VIP routes - require VIP access
  if (VIP_ROUTES.some(route => pathname.startsWith(route))) {
    if (!token) {
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }

    // For now, allow all authenticated users to VIP routes
    // In production, you'd verify VIP status server-side
    return NextResponse.next()
  }

  // Handle API routes
  if (pathname.startsWith('/api/')) {
    // Public API routes that don't require authentication
    const publicApiRoutes = [
      '/api/products',
      '/api/shipping/rates',
      '/api/test-payments', // Allow testing endpoint
      '/api/test-stripe' // Allow payment API testing
    ]
    
    const isPublicApi = publicApiRoutes.some(route => pathname.startsWith(route))
    
    // Most API routes require authentication
    if (!token && !isPublicApi) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )
    }

    // Admin API routes - will be handled by the API routes themselves
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}