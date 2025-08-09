// Error handling utilities following CLAUDE_GLOBAL_RULES.md
// Centralized error handling with user-friendly messages

export interface AppError {
  code: string
  message: string
  remediation?: string
  technical?: string
  timestamp: string
}

// Error codes for different scenarios
export const ERROR_CODES = {
  // Authentication errors
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_SESSION_EXPIRED: 'AUTH_SESSION_EXPIRED',
  AUTH_WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  AUTH_EMAIL_EXISTS: 'AUTH_EMAIL_EXISTS',
  
  // Database errors
  DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
  DB_QUERY_FAILED: 'DB_QUERY_FAILED',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',
  
  // Network errors
  NETWORK_OFFLINE: 'NETWORK_OFFLINE',
  NETWORK_TIMEOUT: 'NETWORK_TIMEOUT',
  
  // System errors
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  CONFIG_ERROR: 'CONFIG_ERROR',
} as const

// User-friendly error messages with remediation
export const ERROR_MESSAGES: Record<string, { message: string; remediation: string }> = {
  [ERROR_CODES.AUTH_INVALID_CREDENTIALS]: {
    message: 'Invalid email or password',
    remediation: 'Please check your credentials and try again. If you forgot your password, use the password reset option.'
  },
  [ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED]: {
    message: 'Email address not verified',
    remediation: 'Please check your email and click the verification link. Check your spam folder if you don\'t see it.'
  },
  [ERROR_CODES.AUTH_ACCOUNT_LOCKED]: {
    message: 'Account temporarily locked',
    remediation: 'Too many failed login attempts. Please try again in 15 minutes or reset your password.'
  },
  [ERROR_CODES.AUTH_SESSION_EXPIRED]: {
    message: 'Your session has expired',
    remediation: 'Please sign in again to continue using the application.'
  },
  [ERROR_CODES.AUTH_WEAK_PASSWORD]: {
    message: 'Password does not meet requirements',
    remediation: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.'
  },
  [ERROR_CODES.AUTH_EMAIL_EXISTS]: {
    message: 'An account with this email already exists',
    remediation: 'Try signing in instead, or use the password reset option if you forgot your password.'
  },
  [ERROR_CODES.DB_CONNECTION_FAILED]: {
    message: 'Unable to connect to the database',
    remediation: 'This is a temporary issue. Please try again in a moment.'
  },
  [ERROR_CODES.DB_QUERY_FAILED]: {
    message: 'Database operation failed',
    remediation: 'Please try your request again. If the problem persists, contact support.'
  },
  [ERROR_CODES.DB_RECORD_NOT_FOUND]: {
    message: 'Requested data not found',
    remediation: 'The information you\'re looking for may have been removed or doesn\'t exist.'
  },
  [ERROR_CODES.NETWORK_OFFLINE]: {
    message: 'No internet connection',
    remediation: 'Please check your internet connection and try again.'
  },
  [ERROR_CODES.NETWORK_TIMEOUT]: {
    message: 'Request timed out',
    remediation: 'The request is taking longer than expected. Please try again.'
  },
  [ERROR_CODES.SYSTEM_ERROR]: {
    message: 'An unexpected error occurred',
    remediation: 'Please try again. If the problem persists, contact support with the error code.'
  },
  [ERROR_CODES.CONFIG_ERROR]: {
    message: 'System configuration error',
    remediation: 'This is a system issue. Please contact support for assistance.'
  }
}

// Create standardized error object
export function createError(
  code: string,
  technicalDetails?: string,
  customMessage?: string,
  customRemediation?: string
): AppError {
  const errorInfo = ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.SYSTEM_ERROR]
  
  return {
    code,
    message: customMessage || errorInfo.message,
    remediation: customRemediation || errorInfo.remediation,
    technical: technicalDetails,
    timestamp: new Date().toISOString()
  }
}

// Handle Supabase auth errors
export function handleSupabaseAuthError(error: unknown): AppError {
  const message = error?.message?.toLowerCase() || ''
  
  if (message.includes('invalid credentials') || message.includes('email not confirmed')) {
    return createError(ERROR_CODES.AUTH_INVALID_CREDENTIALS, error.message)
  }
  
  if (message.includes('email not confirmed')) {
    return createError(ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED, error.message)
  }
  
  if (message.includes('too many requests')) {
    return createError(ERROR_CODES.AUTH_ACCOUNT_LOCKED, error.message)
  }
  
  if (message.includes('weak password')) {
    return createError(ERROR_CODES.AUTH_WEAK_PASSWORD, error.message)
  }
  
  if (message.includes('already registered')) {
    return createError(ERROR_CODES.AUTH_EMAIL_EXISTS, error.message)
  }
  
  // Default to system error for unknown auth issues
  return createError(ERROR_CODES.SYSTEM_ERROR, error.message)
}

// Handle database errors
export function handleDatabaseError(error: unknown): AppError {
  const message = error?.message?.toLowerCase() || ''
  
  if (message.includes('connection') || message.includes('timeout')) {
    return createError(ERROR_CODES.DB_CONNECTION_FAILED, error.message)
  }
  
  if (message.includes('not found') || message.includes('no rows')) {
    return createError(ERROR_CODES.DB_RECORD_NOT_FOUND, error.message)
  }
  
  // Default to query failed
  return createError(ERROR_CODES.DB_QUERY_FAILED, error.message)
}

// Handle network errors
export function handleNetworkError(error: unknown): AppError {
  if (!navigator.onLine) {
    return createError(ERROR_CODES.NETWORK_OFFLINE)
  }
  
  if (error?.name === 'TimeoutError' || error?.code === 'ETIMEDOUT') {
    return createError(ERROR_CODES.NETWORK_TIMEOUT, error.message)
  }
  
  return createError(ERROR_CODES.SYSTEM_ERROR, error.message)
}

// Log error for monitoring (production ready - no console.log)
export function logError(error: AppError, context?: string): void {
  // In production, this would send to monitoring service
  // For now, we'll use a structured approach that can be easily replaced
  
  const errorLog = {
    ...error,
    context,
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'server',
    url: typeof window !== 'undefined' ? window.location.href : 'server'
  }
  
  // TODO: Replace with actual monitoring service (e.g., Sentry, DataDog)
  if (process.env.NODE_ENV === 'development') {
    console.error('Error logged:', errorLog)
  }
}