// Admin cache status endpoint
// Following CLAUDE_GLOBAL_RULES.md - admin monitoring capabilities

import { NextRequest, NextResponse } from 'next/server'
import { AuthCache } from '../../../../../lib/cache/auth-cache'
import { cacheConfig } from '../../../../../lib/cache/redis-config'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  try {
    // Initialize Supabase server client for admin verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )

    // Verify admin authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin using consistent logic
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    const ADMIN_EMAILS = ['info@anoint.me', 'breanne@aetherx.co']
    const isAdmin = profile?.is_admin === true || ADMIN_EMAILS.includes(session.user.email?.toLowerCase() || '')

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Get cache status and statistics
    const [healthCheck, stats] = await Promise.all([
      AuthCache.healthCheck(),
      AuthCache.getStats()
    ])

    const status = {
      cache: {
        enabled: cacheConfig.enabled,
        healthy: healthCheck.available,
        latency: healthCheck.latency,
        statistics: stats
      },
      redis: {
        url: process.env.UPSTASH_REDIS_REST_URL ? 'configured' : 'not configured',
        token: process.env.UPSTASH_REDIS_REST_TOKEN ? 'configured' : 'not configured'
      },
      performance: {
        defaultTTL: cacheConfig.defaultTTL,
        sessionTTL: cacheConfig.sessionTTL
      },
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(status)

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get cache status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Initialize Supabase server client for admin verification
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
        },
      }
    )

    // Verify admin authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Check if user is admin using consistent logic
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single()

    const ADMIN_EMAILS = ['info@anoint.me', 'breanne@aetherx.co']
    const isAdmin = profile?.is_admin === true || ADMIN_EMAILS.includes(session.user.email?.toLowerCase() || '')

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Clear all authentication cache
    await AuthCache.clearAllAuthCache()

    return NextResponse.json({ 
      success: true, 
      message: 'All authentication cache cleared',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to clear cache', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}