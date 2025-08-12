#!/usr/bin/env node

/**
 * Fix JSX over-escaping - revert &quot; back to " in JSX attributes
 */

const fs = require('fs');
const { glob } = require('glob');

async function fixJSXEscaping() {
  console.log('🔧 Fixing JSX over-escaping issues...\n');
  
  const files = await glob('app/**/*.{ts,tsx}', { cwd: process.cwd() });
  let fixedFiles = 0;
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(file, 'utf8');
      
      // Fix over-escaped quotes in JSX attributes
      let fixedContent = content
        // Fix className="..." back from className=&quot;...&quot;
        .replace(/className=&quot;([^&]*?)&quot;/g, 'className="$1"')
        // Fix other common attributes
        .replace(/(href|src|alt|title|placeholder|type|value|id|key)=&quot;([^&]*?)&quot;/g, '$1="$2"')
        // Fix style attributes
        .replace(/style=&quot;([^&]*?)&quot;/g, 'style="$1"')
        // Fix data attributes
        .replace(/(data-[a-zA-Z-]+)=&quot;([^&]*?)&quot;/g, '$1="$2"')
        // Fix aria attributes
        .replace(/(aria-[a-zA-Z-]+)=&quot;([^&]*?)&quot;/g, '$1="$2"')
        // Fix role attributes
        .replace(/role=&quot;([^&]*?)&quot;/g, 'role="$1"')
        // Fix onClick and other event handlers
        .replace(/(on[A-Z][a-zA-Z]+)=&quot;([^&]*?)&quot;/g, '$1="$2"')
        // Fix any remaining attribute patterns
        .replace(/([a-zA-Z-]+)=&quot;([^&]*?)&quot;/g, '$1="$2"');
      
      if (content !== fixedContent) {
        fs.writeFileSync(file, fixedContent, 'utf8');
        console.log(`✅ Fixed JSX escaping in ${file}`);
        fixedFiles++;
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Fixed JSX escaping in ${fixedFiles} files`);
}

if (require.main === module) {
  fixJSXEscaping().catch(console.error);
}

module.exports = { fixJSXEscaping };