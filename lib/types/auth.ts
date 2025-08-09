// Authentication types following CODE_STANDARDS.md - clean TypeScript interfaces
// Human-readable names as per CLAUDE_GLOBAL_RULES.md

export interface AuthenticatedUser {
  id: string
  email: string
  role: 'admin' | 'member'
  displayName: string
  emailVerified: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthenticationState {
  user: AuthenticatedUser | null
  isLoading: boolean
  error: AuthenticationError | null
}

export interface AuthenticationError {
  code: string
  message: string
  remediation?: string // Following CLAUDE_GLOBAL_RULES - clear remediation hints
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupCredentials {
  email: string
  password: string
  displayName: string
}

export interface AuthenticationResult {
  success: boolean
  user?: AuthenticatedUser
  error?: AuthenticationError
}

export interface PasswordResetRequest {
  email: string
}

export interface EmailVerificationRequest {
  token: string
}

// Route protection types
export type UserRole = 'admin' | 'member'

export interface RouteProtectionConfig {
  requiredRole: UserRole
  redirectPath: string
  allowUnverified?: boolean
}

// Session management types
export interface UserSession {
  user: AuthenticatedUser
  expiresAt: string
  refreshToken: string
}

// Database profile type matching Supabase schema
export interface UserProfile {
  id: string
  display_name: string
  is_admin: boolean
  created_at: string
  updated_at: string
}