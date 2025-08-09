// Admin configuration - Single source of truth
// Centralized admin email management

export const ADMIN_EMAILS = [
  'info@anoint.me',
  'breanne@aetherx.co'
] as const

export type AdminEmail = typeof ADMIN_EMAILS[number]

// Helper function to check if an email is an admin
export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase().trim() as AdminEmail)
}

// Admin role configuration
export const ADMIN_CONFIG = {
  emails: ADMIN_EMAILS,
  role: 'admin' as const,
  dashboardPath: '/admin/dashboard',
  settingsPath: '/admin/settings',
  permissions: [
    'user_management',
    'analytics_access', 
    'generator_settings',
    'backup_access',
    'ai_systems_access'
  ] as const
} as const