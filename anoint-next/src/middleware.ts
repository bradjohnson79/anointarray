import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  // Refresh session if needed - this helps with session synchronization
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If user is signed in and the current path is /login redirect the user to /dashboard
  if (session && req.nextUrl.pathname === '/login') {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  // Temporarily disabled - let client-side handle dashboard auth
  // if (!session && req.nextUrl.pathname === '/dashboard') {
  //   return NextResponse.redirect(new URL('/login', req.url))
  // }

  // If user is not signed in and the current path is /admin redirect the user to /login
  if (!session && req.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}