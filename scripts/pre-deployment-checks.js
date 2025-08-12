#!/usr/bin/env node

/**
 * ANOINT Array Pre-Deployment Safety Checks
 * Prevents accidental file deletion during deployment
 */

const fs = require('fs')
const path = require('path')

console.log('🔍 ANOINT Array Pre-Deployment Safety Checks\n')

// Critical files and directories that must exist
const CRITICAL_FRONTEND_FILES = [
  // Marketing Pages
  'app/(marketing)/about/page.tsx',
  'app/(marketing)/contact/page.tsx', 
  'app/(marketing)/products/page.tsx',
  'app/(marketing)/vip-products/page.tsx',
  'app/(marketing)/anoint-array/page.tsx',
  'app/(marketing)/privacy/page.tsx',
  'app/(marketing)/terms/page.tsx',
  'app/(marketing)/disclaimer/page.tsx',
  
  // Authentication Pages
  'app/(auth)/login/page.tsx',
  'app/(auth)/signup/page.tsx',
  'app/(auth)/forgot-password/page.tsx',
  
  // App Pages
  'app/(app)/admin/page.tsx',
  'app/(app)/admin/users/page.tsx',
  'app/(app)/admin/orders/page.tsx',
  'app/(app)/admin/products/page.tsx',
  'app/(app)/admin/analytics/page.tsx',
  'app/(app)/member/dashboard/page.tsx',
  'app/(app)/cart/page.tsx',
  'app/(app)/catalog/page.tsx',
  'app/(app)/checkout/page.tsx',
  'app/(app)/generator/page.tsx',
  
  // Core Files
  'app/layout.tsx',
  'app/page.tsx',
  'app/globals.css',
  
  // Context and Components
  'contexts/auth-context.tsx',
  'components/Layout.tsx',
  'components/AuroraBackground.tsx',
  'components/ErrorBoundary.tsx'
]

const CRITICAL_BACKEND_FILES = [
  // Admin API Routes
  'app/api/admin/backup/create/route.ts',
  'app/api/admin/backup/delete/[id]/route.ts',
  'app/api/admin/backup/download/[id]/route.ts',
  'app/api/admin/backup/restore/route.ts',
  'app/api/admin/cache/status/route.ts',
  'app/api/admin/generator/get-sample-array/route.ts',
  'app/api/admin/generator/test-ai/route.ts',
  'app/api/admin/generator/upload-csv/route.ts',
  'app/api/admin/generator/verify-assets/route.ts',
  
  // Core API Routes  
  'app/api/auth/change-password/route.ts',
  'app/api/generator/create-payment/route.ts',
  'app/api/generator/generate/route.ts',
  'app/api/generator/verify-payment/route.ts',
  'app/api/digital/download/[token]/route.ts',
  'app/api/digital/generate/route.ts',
  
  // Payment & Commerce
  'app/api/payments/stripe/route.ts',
  'app/api/payments/nowpayments/route.ts',
  'app/api/payments/paypal/route.ts',
  'app/api/webhooks/stripe/route.ts',
  'app/api/webhooks/nowpayments/route.ts',
  'app/api/merchandise/checkout/route.ts',
  'app/api/merchandise/payment/route.ts',
  
  // Products & Orders
  'app/api/products/route.ts',
  'app/api/products/[id]/route.ts',
  'app/api/products/categories/route.ts',
  'app/api/orders/route.ts',
  
  // Core Services
  'app/api/ai-collaboration/route.ts',
  'app/api/ai-status/route.ts',
  'app/api/self-healing-ai/route.ts',
  'app/api/shipping/rates/route.ts',
  'app/api/taxes/calculate/route.ts'
]

const CRITICAL_CONFIG_FILES = [
  'package.json',
  'tsconfig.json',
  'next.config.ts',
  'tailwind.config.js',
  'middleware.ts',
  '.env.local',
  '.env.production',
  'netlify.toml'
]

let hasErrors = false
const errors = []
const warnings = []

function checkFileExists(filePath) {
  const fullPath = path.resolve(filePath)
  if (!fs.existsSync(fullPath)) {
    errors.push(`❌ CRITICAL: Missing file - ${filePath}`)
    hasErrors = true
    return false
  }
  return true
}

function checkDirectoryExists(dirPath) {
  const fullPath = path.resolve(dirPath)
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    errors.push(`❌ CRITICAL: Missing directory - ${dirPath}`)
    hasErrors = true
    return false
  }
  return true
}

function checkFileSize(filePath) {
  try {
    const stats = fs.statSync(path.resolve(filePath))
    if (stats.size === 0) {
      warnings.push(`⚠️  WARNING: Empty file - ${filePath}`)
    }
    return stats.size
  } catch (error) {
    return 0
  }
}

// Check Frontend Files
console.log('📱 Frontend Files Check:')
let frontendOk = 0
CRITICAL_FRONTEND_FILES.forEach(filePath => {
  if (checkFileExists(filePath)) {
    checkFileSize(filePath)
    frontendOk++
    console.log(`  ✅ ${filePath}`)
  }
})

console.log(`\n📱 Frontend Status: ${frontendOk}/${CRITICAL_FRONTEND_FILES.length} files verified\n`)

// Check Backend Files  
console.log('⚙️  Backend API Routes Check:')
let backendOk = 0
CRITICAL_BACKEND_FILES.forEach(filePath => {
  if (checkFileExists(filePath)) {
    checkFileSize(filePath)
    backendOk++
    console.log(`  ✅ ${filePath}`)
  }
})

console.log(`\n⚙️  Backend Status: ${backendOk}/${CRITICAL_BACKEND_FILES.length} API routes verified\n`)

// Check Configuration Files
console.log('🔧 Configuration Files Check:')
let configOk = 0
CRITICAL_CONFIG_FILES.forEach(filePath => {
  if (checkFileExists(filePath)) {
    configOk++
    console.log(`  ✅ ${filePath}`)
  }
})

console.log(`\n🔧 Config Status: ${configOk}/${CRITICAL_CONFIG_FILES.length} config files verified\n`)

// Check Critical Directories
console.log('📁 Critical Directories Check:')
const criticalDirs = [
  'app/(marketing)',
  'app/(auth)', 
  'app/(app)',
  'app/api',
  'components',
  'contexts',
  'lib',
  'public',
  'mcp'
]

let dirsOk = 0
criticalDirs.forEach(dirPath => {
  if (checkDirectoryExists(dirPath)) {
    dirsOk++
    console.log(`  ✅ ${dirPath}/`)
  }
})

console.log(`\n📁 Directories Status: ${dirsOk}/${criticalDirs.length} directories verified\n`)

// Navigation Links Verification
console.log('🧭 Navigation Links Verification:')
const navLinks = ['/about', '/contact', '/products', '/vip-products', '/anoint-array', '/privacy', '/terms', '/disclaimer']
const homepageContent = fs.existsSync('app/page.tsx') ? fs.readFileSync('app/page.tsx', 'utf8') : ''
let navOk = 0

navLinks.forEach(link => {
  if (homepageContent.includes(`href="${link}"`)) {
    navOk++
    console.log(`  ✅ Navigation link: ${link}`)
  } else {
    warnings.push(`⚠️  WARNING: Navigation link not found in homepage: ${link}`)
  }
})

console.log(`\n🧭 Navigation Status: ${navOk}/${navLinks.length} links verified\n`)

// Display Results
console.log('═'.repeat(60))
console.log('📊 PRE-DEPLOYMENT SAFETY CHECK RESULTS')
console.log('═'.repeat(60))

if (warnings.length > 0) {
  console.log('\n⚠️  WARNINGS:')
  warnings.forEach(warning => console.log(warning))
}

if (errors.length > 0) {
  console.log('\n❌ CRITICAL ERRORS:')
  errors.forEach(error => console.log(error))
  console.log('\n🚨 DEPLOYMENT BLOCKED - Please fix critical errors before deploying!')
  process.exit(1)
} else {
  const totalFiles = CRITICAL_FRONTEND_FILES.length + CRITICAL_BACKEND_FILES.length + CRITICAL_CONFIG_FILES.length
  const totalOk = frontendOk + backendOk + configOk
  
  console.log('\n✅ ALL CRITICAL FILES VERIFIED!')
  console.log(`📊 Total: ${totalOk}/${totalFiles} files (${Math.round(totalOk/totalFiles*100)}%)`)
  console.log(`📁 Directories: ${dirsOk}/${criticalDirs.length}`)
  console.log(`🧭 Navigation: ${navOk}/${navLinks.length}`)
  
  if (warnings.length > 0) {
    console.log(`⚠️  Warnings: ${warnings.length} (review recommended)`)
  }
  
  console.log('\n🚀 DEPLOYMENT SAFETY CHECKS PASSED - Ready to deploy!')
  process.exit(0)
}