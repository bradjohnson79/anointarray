// Secure path utilities to prevent path traversal attacks
// Following OWASP recommendations for file handling security

import { join, normalize, resolve } from 'path'

/**
 * Sanitizes a filename by removing dangerous characters and path separators
 * Prevents path traversal attacks by stripping directory navigation
 */
export function sanitizeFilename(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    throw new Error('Invalid filename provided')
  }

  // Remove any path separators and dangerous characters
  const sanitized = filename
    .replace(/[/\\:*?"<>|]/g, '') // Remove path separators and dangerous chars
    .replace(/\.\./g, '') // Remove directory traversal attempts
    .replace(/^\.+/, '') // Remove leading dots
    .trim()

  if (!sanitized) {
    throw new Error('Filename becomes empty after sanitization')
  }

  // Limit filename length to prevent buffer overflows
  return sanitized.substring(0, 255)
}

/**
 * Validates that a path is within the allowed base directory
 * Prevents path traversal by ensuring resolved path stays within bounds
 */
export function validatePathWithinBase(basePath: string, userPath: string): string {
  const normalizedBase = resolve(basePath)
  const resolvedPath = resolve(basePath, userPath)

  // Ensure the resolved path is within the base directory
  if (!resolvedPath.startsWith(normalizedBase + '/') && resolvedPath !== normalizedBase) {
    throw new Error('Path traversal attempt detected')
  }

  return resolvedPath
}

/**
 * Safely joins paths for backup operations
 * Combines sanitization and base path validation
 */
export function safeBackupPath(backupId: string): string {
  const baseDir = join(process.cwd(), 'backups')
  const sanitizedId = sanitizeFilename(backupId)
  const filename = `${sanitizedId}.json`
  
  return validatePathWithinBase(baseDir, filename)
}

/**
 * Safely joins paths for template operations
 * Ensures template files stay within templates directory
 */
export function safeTemplatePath(templateName: string): string {
  const baseDir = join(process.cwd(), 'templates')
  const sanitizedName = sanitizeFilename(templateName)
  
  return validatePathWithinBase(baseDir, sanitizedName)
}

/**
 * Validates backup ID format
 * Only allows alphanumeric characters, hyphens, and underscores
 */
export function validateBackupId(backupId: string): string {
  if (!backupId || typeof backupId !== 'string') {
    throw new Error('Invalid backup ID')
  }

  // Only allow safe characters
  if (!/^[a-zA-Z0-9_-]+$/.test(backupId)) {
    throw new Error('Backup ID contains invalid characters')
  }

  // Length limits
  if (backupId.length < 1 || backupId.length > 100) {
    throw new Error('Backup ID length must be between 1 and 100 characters')
  }

  return backupId
}

/**
 * Validates template name format
 */
export function validateTemplateName(templateName: string): string {
  if (!templateName || typeof templateName !== 'string') {
    throw new Error('Invalid template name')
  }

  // Only allow safe characters and dots for extensions
  if (!/^[a-zA-Z0-9._-]+$/.test(templateName)) {
    throw new Error('Template name contains invalid characters')
  }

  // Length limits
  if (templateName.length < 1 || templateName.length > 200) {
    throw new Error('Template name length must be between 1 and 200 characters')
  }

  return templateName
}