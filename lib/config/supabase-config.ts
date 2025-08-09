// Supabase configuration following best practices
// Centralized configuration with proper error handling

export interface SupabaseConfig {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

// Validate required environment variables
function validateEnvVars(): SupabaseConfig {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !anonKey) {
    throw new Error('Missing required Supabase environment variables')
  }

  // Validate URL format
  try {
    new URL(url)
  } catch {
    throw new Error('Invalid Supabase URL format')
  }

  // Validate key formats (basic check)
  if (anonKey.length < 100) {
    throw new Error('Invalid Supabase anon key format')
  }

  return {
    url,
    anonKey,
    serviceRoleKey
  }
}

// Export validated configuration
export const supabaseConfig = validateEnvVars()

// Supabase client options for optimal performance
export const supabaseClientOptions = {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce' as const,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined
  },
  global: {
    headers: {
      'X-Client-Info': 'anoint-array-web'
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
}

// Server-side client options for middleware and API routes
export const supabaseServerOptions = {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      'X-Client-Info': 'anoint-array-server'
    }
  }
}