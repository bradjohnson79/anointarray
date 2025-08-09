// Simplified middleware - ONLY handles basic auth validation
// No profile fetching, no complex redirects, no competing systems

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Skip middleware for public routes and static assets
  const publicRoutes = ['/login', '/signup', '/forgot-password', '/auth', '/', '/about', '/contact', '/privacy', '/terms']
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route)) || 
                       pathname.startsWith('/_next') || 
                       pathname.startsWith('/public') ||
                       pathname.includes('.')

  if (isPublicRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  try {
    // Initialize Supabase server client
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            request.cookies.set({
              name,
              value,
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            request.cookies.set({
              name,
              value: '',
              ...options,
            })
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            })
            response.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Simple session check - NO PROFILE FETCHING
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    // For protected routes, ensure user has a valid session
    if ((pathname.startsWith('/admin') || pathname.startsWith('/member')) && (!session?.user || sessionError)) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Let individual pages handle role-based access and redirects
    return response

  } catch (error) {
    // On any error, redirect to login
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}