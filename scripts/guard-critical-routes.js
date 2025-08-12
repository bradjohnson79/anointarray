#!/usr/bin/env node

/**
 * Critical Route Guard - Ensures protected pages never get statically exported
 * Per DEPLOYMENT_RULES.md requirements
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

// Protected routes that must NEVER be static
const CRITICAL_ROUTES = [
  '/login',
  '/logout', 
  '/signup',
  '/dashboard',
  '/profile',
  '/my-seals',
  '/admin/**',
  '/api/**'
];

// Dynamic exports that must be present on critical routes
const REQUIRED_EXPORTS = [
  'export const dynamic = \'force-dynamic\'',
  'export const revalidate = 0',
  'export const fetchCache = \'force-no-store\'',
  'export const runtime = \'nodejs\''
];

async function checkCriticalRoutes() {
  console.log('🔍 Checking critical routes for proper dynamic configuration...');
  
  try {
    // Find all page files
    const pageFiles = await glob('app/**/page.{ts,tsx,js,jsx}', { cwd: process.cwd() });
    const errors = [];
    
    for (const file of pageFiles) {
      const fullPath = path.resolve(file);
      const content = fs.readFileSync(fullPath, 'utf8');
      
      // Check if this is a critical route
      const routePath = '/' + file.replace(/^app\//, '').replace(/\/page\.(ts|tsx|js|jsx)$/, '').replace(/^\(.*?\)\//, '');
      
      const isCritical = CRITICAL_ROUTES.some(pattern => {
        if (pattern.includes('**')) {
          return routePath.startsWith(pattern.replace('/**', ''));
        }
        return routePath === pattern || routePath.startsWith(pattern + '/');
      });
      
      if (isCritical) {
        // Check for required dynamic exports
        const hasForceDynamic = content.includes('export const dynamic = \'force-dynamic\'') || 
                                 content.includes('export const dynamic = "force-dynamic"');
        
        if (!hasForceDynamic) {
          errors.push(`❌ ${file}: Missing 'export const dynamic = "force-dynamic"'`);
        }
        
        console.log(`✅ Checked critical route: ${routePath}`);
      }
    }
    
    if (errors.length > 0) {
      console.error('\n🚨 Critical Route Guard FAILED:');
      errors.forEach(error => console.error(error));
      console.error('\nCritical routes must have dynamic rendering enabled to prevent static export.');
      process.exit(1);
    }
    
    console.log('\n✅ All critical routes properly configured for dynamic rendering');
    
  } catch (error) {
    console.error('❌ Critical route guard failed:', error.message);
    process.exit(1);
  }
}

checkCriticalRoutes();