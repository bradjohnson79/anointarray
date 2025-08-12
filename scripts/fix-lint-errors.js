#!/usr/bin/env node

/**
 * Systematic ESLint/TypeScript Error Fixer
 * Fixes common patterns that violate our coding standards
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

const COMMON_FIXES = {
  // Fix explicit any types
  EXPLICIT_ANY: {
    pattern: /:\s*any(?!\w)/g,
    replacement: ': unknown',
    description: 'Replace explicit any with unknown'
  },
  
  // Fix unescaped quotes in JSX
  UNESCAPED_QUOTES: {
    pattern: /([^\\])"([^"]*)"([^"]*>)/g,
    replacement: '$1&quot;$2&quot;$3',
    description: 'Escape quotes in JSX'
  },
  
  // Fix unescaped apostrophes in JSX
  UNESCAPED_APOSTROPHES: {
    pattern: /([^\\])'([^']*)'([^']*>)/g,
    replacement: '$1&apos;$2&apos;$3', 
    description: 'Escape apostrophes in JSX'
  }
};

async function getTypeScriptFiles() {
  const patterns = [
    'app/**/*.{ts,tsx}',
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'contexts/**/*.{ts,tsx}',
    'middleware.ts'
  ];
  
  let files = [];
  for (const pattern of patterns) {
    const matched = await glob(pattern, { cwd: process.cwd() });
    files = files.concat(matched);
  }
  
  // Remove duplicates and exclude problematic files
  const uniqueFiles = [...new Set(files)]
    .filter(file => !file.includes('node_modules'))
    .filter(file => !file.includes('.next'))
    .filter(file => !file.includes('anoint-next')); // Skip legacy folder
    
  return uniqueFiles;
}

function analyzeFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  // Find unused imports
  const importLines = content.split('\n')
    .map((line, index) => ({ line, number: index + 1 }))
    .filter(({ line }) => line.trim().startsWith('import'));
    
  importLines.forEach(({ line, number }) => {
    const importMatch = line.match(/import\s*{([^}]+)}\s*from/);
    if (importMatch) {
      const imports = importMatch[1].split(',').map(i => i.trim());
      const unusedImports = imports.filter(imp => {
        const regex = new RegExp(`\\b${imp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
        const matches = (content.match(regex) || []).length;
        return matches <= 1; // Only appears in import line
      });
      
      if (unusedImports.length > 0) {
        issues.push({
          type: 'unused-import',
          line: number,
          imports: unusedImports,
          originalLine: line
        });
      }
    }
  });
  
  // Find explicit any types
  const anyMatches = [...content.matchAll(/:\s*any\b/g)];
  anyMatches.forEach(match => {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'explicit-any',
      line: lineNumber,
      position: match.index
    });
  });
  
  // Find unescaped JSX characters
  const quoteMatches = [...content.matchAll(/([^\\])"([^"]*)"([^"]*>)/g)];
  quoteMatches.forEach(match => {
    const lineNumber = content.substring(0, match.index).split('\n').length;
    issues.push({
      type: 'unescaped-quote',
      line: lineNumber,
      position: match.index
    });
  });
  
  return { content, issues };
}

function fixFileIssues(filePath, content, issues) {
  let fixedContent = content;
  let fixCount = 0;
  
  // Fix from end to start to preserve positions
  const sortedIssues = issues.sort((a, b) => (b.position || b.line) - (a.position || a.line));
  
  for (const issue of sortedIssues) {
    switch (issue.type) {
      case 'explicit-any':
        // Only replace simple any types, not complex ones
        const beforeFix = fixedContent;
        fixedContent = fixedContent.replace(/:\s*any\b(?![<\w])/g, ': unknown');
        if (beforeFix !== fixedContent) fixCount++;
        break;
        
      case 'unescaped-quote':
        fixedContent = fixedContent.replace(/([^\\])"([^"]*)"([^"]*>)/g, '$1&quot;$2&quot;$3');
        fixCount++;
        break;
        
      case 'unused-import':
        // Remove unused imports from the import line
        const originalLine = issue.originalLine;
        const imports = originalLine.match(/import\s*{([^}]+)}\s*from/)[1]
          .split(',')
          .map(i => i.trim())
          .filter(imp => !issue.imports.includes(imp));
          
        if (imports.length === 0) {
          // Remove entire import line
          fixedContent = fixedContent.replace(originalLine + '\n', '');
        } else {
          // Keep only used imports
          const newLine = originalLine.replace(
            /import\s*{[^}]+}/,
            `import { ${imports.join(', ')} }`
          );
          fixedContent = fixedContent.replace(originalLine, newLine);
        }
        fixCount++;
        break;
    }
  }
  
  return { fixedContent, fixCount };
}

async function fixAllFiles() {
  console.log('🔧 Starting systematic TypeScript/ESLint fixes...\n');
  
  const files = await getTypeScriptFiles();
  console.log(`Found ${files.length} TypeScript files to analyze\n`);
  
  let totalFixes = 0;
  let totalFiles = 0;
  
  for (const file of files) {
    try {
      const { content, issues } = analyzeFile(file);
      
      if (issues.length > 0) {
        console.log(`📁 ${file}: ${issues.length} issues found`);
        
        const { fixedContent, fixCount } = fixFileIssues(file, content, issues);
        
        if (fixCount > 0) {
          fs.writeFileSync(file, fixedContent, 'utf8');
          console.log(`   ✅ Fixed ${fixCount} issues`);
          totalFixes += fixCount;
          totalFiles++;
        }
      }
    } catch (error) {
      console.error(`   ❌ Error processing ${file}:`, error.message);
    }
  }
  
  console.log(`\n🎉 Complete! Fixed ${totalFixes} issues across ${totalFiles} files`);
  console.log('\n⚠️  Note: Some complex issues may still require manual fixes');
  console.log('Run npm run lint to see remaining issues\n');
}

if (require.main === module) {
  fixAllFiles().catch(console.error);
}

module.exports = { fixAllFiles };