const fs = require('fs');
const path = require('path');

/**
 * Database Query Optimization Analysis
 * Reviews Supabase queries and RLS policies for performance improvements
 */

class DatabaseOptimizer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      queryAnalysis: [],
      rlsAnalysis: [],
      indexRecommendations: [],
      optimizations: []
    };
  }

  async analyze() {
    console.log('🗄️ Starting Database Optimization Analysis...\n');

    try {
      // Analyze API routes for database queries
      this.analyzeApiRoutes();
      
      // Analyze RLS policies
      this.analyzeRLSPolicies();
      
      // Generate index recommendations
      this.generateIndexRecommendations();
      
      // Generate optimization recommendations
      this.generateOptimizationRecommendations();
      
      // Save report
      const reportPath = path.join('tests/performance/reports', `database-optimization-${Date.now()}.json`);
      if (!fs.existsSync('tests/performance/reports')) {
        fs.mkdirSync('tests/performance/reports', { recursive: true });
      }
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

      this.printResults(reportPath);
      
      return this.results;

    } catch (error) {
      console.error('❌ Database optimization analysis failed:', error);
      throw error;
    }
  }

  analyzeApiRoutes() {
    console.log('🔍 Analyzing API routes for database queries...');
    
    const apiDir = path.join(process.cwd(), 'app', 'api');
    const apiFiles = this.getFilesRecursively(apiDir, ['.ts', '.js']);
    
    for (const file of apiFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const relativePath = path.relative(process.cwd(), file);
      
      // Analyze query patterns
      const queries = this.extractDatabaseQueries(content, relativePath);
      this.results.queryAnalysis = this.results.queryAnalysis.concat(queries);
    }
  }

  extractDatabaseQueries(content, filePath) {
    const queries = [];
    
    // Common Supabase query patterns
    const patterns = [
      {
        pattern: /\.from\(['"`](\w+)['"`]\)/g,
        type: 'SELECT',
        performance: 'GOOD'
      },
      {
        pattern: /\.insert\(/g,
        type: 'INSERT',
        performance: 'GOOD'
      },
      {
        pattern: /\.update\(/g,
        type: 'UPDATE',
        performance: 'GOOD'
      },
      {
        pattern: /\.delete\(/g,
        type: 'DELETE',
        performance: 'GOOD'
      },
      {
        pattern: /\.select\(['"`]\*['"`]\)/g,
        type: 'SELECT_ALL',
        performance: 'NEEDS_REVIEW'
      },
      {
        pattern: /\.rpc\(['"`](\w+)['"`]/g,
        type: 'RPC',
        performance: 'GOOD'
      }
    ];

    for (const { pattern, type, performance } of patterns) {
      let match;
      pattern.lastIndex = 0; // Reset regex
      
      while ((match = pattern.exec(content)) !== null) {
        const table = match[1] || 'unknown';
        queries.push({
          file: filePath,
          type,
          table,
          performance,
          line: this.getLineNumber(content, match.index),
          query: match[0]
        });
      }
    }

    return queries;
  }

  getLineNumber(content, index) {
    return content.substring(0, index).split('\n').length;
  }

  analyzeRLSPolicies() {
    console.log('🔐 Analyzing RLS policies...');
    
    const migrationDir = path.join(process.cwd(), 'supabase', 'migrations');
    if (!fs.existsSync(migrationDir)) {
      console.log('⚠️  No migrations directory found');
      return;
    }
    
    const migrationFiles = fs.readdirSync(migrationDir)
      .filter(file => file.endsWith('.sql'))
      .map(file => path.join(migrationDir, file));
    
    for (const file of migrationFiles) {
      const content = fs.readFileSync(file, 'utf8');
      const policies = this.extractRLSPolicies(content, path.basename(file));
      this.results.rlsAnalysis = this.results.rlsAnalysis.concat(policies);
    }
  }

  extractRLSPolicies(content, fileName) {
    const policies = [];
    const policyPattern = /CREATE POLICY\s+['"`]?(\w+)['"`]?\s+ON\s+['"`]?(\w+)['"`]?\s+FOR\s+(\w+)/gi;
    
    let match;
    while ((match = policyPattern.exec(content)) !== null) {
      const [, policyName, table, operation] = match;
      policies.push({
        file: fileName,
        policyName,
        table,
        operation,
        line: this.getLineNumber(content, match.index),
        performance: this.evaluateRLSPerformance(operation, content, match.index)
      });
    }
    
    return policies;
  }

  evaluateRLSPerformance(operation, content, index) {
    // Extract the policy definition around the match
    const lines = content.split('\n');
    const lineNum = this.getLineNumber(content, index);
    const policyLines = lines.slice(Math.max(0, lineNum - 2), lineNum + 5).join('\n');
    
    // Check for performance indicators
    if (policyLines.includes('auth.uid()') || policyLines.includes('jwt()')) {
      return operation === 'SELECT' ? 'GOOD' : 'REVIEW_NEEDED';
    }
    
    if (policyLines.includes('EXISTS') || policyLines.includes('IN (')) {
      return 'NEEDS_INDEX';
    }
    
    return 'GOOD';
  }

  generateIndexRecommendations() {
    console.log('📊 Generating index recommendations...');
    
    const recommendations = [];
    
    // Analyze query patterns for common lookup fields
    const tableAccess = {};
    
    for (const query of this.results.queryAnalysis) {
      if (!tableAccess[query.table]) {
        tableAccess[query.table] = { selects: 0, total: 0 };
      }
      tableAccess[query.table].total++;
      if (query.type === 'SELECT' || query.type === 'SELECT_ALL') {
        tableAccess[query.table].selects++;
      }
    }
    
    // Recommend indexes for frequently accessed tables
    for (const [table, access] of Object.entries(tableAccess)) {
      if (access.selects > 3) {
        recommendations.push({
          table,
          type: 'INDEX',
          priority: 'HIGH',
          recommendation: `Consider adding indexes on commonly queried columns in ${table} table`,
          reasoning: `Table accessed ${access.selects} times for SELECT operations`
        });
      }
    }
    
    // Common e-commerce indexes
    const ecommerceIndexes = [
      { table: 'products', column: 'category_id', reason: 'Category filtering' },
      { table: 'products', column: 'status', reason: 'Active product queries' },
      { table: 'orders', column: 'user_id', reason: 'User order history' },
      { table: 'orders', column: 'status', reason: 'Order status filtering' },
      { table: 'orders', column: 'created_at', reason: 'Date range queries' },
      { table: 'order_items', column: 'order_id', reason: 'Order details lookup' },
      { table: 'user_profiles', column: 'user_id', reason: 'Profile lookups' },
      { table: 'shopping_cart', column: 'user_id', reason: 'Cart retrieval' }
    ];
    
    for (const index of ecommerceIndexes) {
      recommendations.push({
        table: index.table,
        type: 'INDEX',
        priority: 'MEDIUM',
        recommendation: `CREATE INDEX ON ${index.table}(${index.column})`,
        reasoning: index.reason
      });
    }
    
    this.results.indexRecommendations = recommendations;
  }

  generateOptimizationRecommendations() {
    const optimizations = [];
    
    // Check for SELECT * queries
    const selectAllQueries = this.results.queryAnalysis.filter(q => q.type === 'SELECT_ALL');
    if (selectAllQueries.length > 0) {
      optimizations.push({
        priority: 'HIGH',
        category: 'Query Optimization',
        issue: `Found ${selectAllQueries.length} SELECT * queries`,
        recommendation: 'Replace SELECT * with specific column selection to reduce bandwidth',
        files: [...new Set(selectAllQueries.map(q => q.file))]
      });
    }
    
    // Check RLS policy performance
    const slowRLSPolicies = this.results.rlsAnalysis.filter(p => p.performance === 'NEEDS_INDEX');
    if (slowRLSPolicies.length > 0) {
      optimizations.push({
        priority: 'MEDIUM',
        category: 'RLS Performance',
        issue: `Found ${slowRLSPolicies.length} RLS policies that may benefit from indexes`,
        recommendation: 'Add indexes for columns used in RLS policy conditions',
        policies: slowRLSPolicies.map(p => `${p.table}.${p.policyName}`)
      });
    }
    
    // Caching recommendations
    const highAccessTables = Object.entries(
      this.results.queryAnalysis.reduce((acc, q) => {
        acc[q.table] = (acc[q.table] || 0) + 1;
        return acc;
      }, {})
    ).filter(([, count]) => count > 5);
    
    if (highAccessTables.length > 0) {
      optimizations.push({
        priority: 'MEDIUM',
        category: 'Caching',
        issue: `High-access tables detected: ${highAccessTables.map(([t]) => t).join(', ')}`,
        recommendation: 'Implement Redis caching for frequently accessed data',
        tables: highAccessTables.map(([table, count]) => ({ table, accessCount: count }))
      });
    }
    
    this.results.optimizations = optimizations;
  }

  getFilesRecursively(dir, extensions) {
    let files = [];
    
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        files = files.concat(this.getFilesRecursively(fullPath, extensions));
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
    
    return files;
  }

  printResults(reportPath) {
    console.log('\n🗄️ Database Optimization Results:');
    
    const { queryAnalysis, optimizations, indexRecommendations } = this.results;
    
    console.log(`\n📊 Query Analysis:`);
    console.log(`Total queries analyzed: ${queryAnalysis.length}`);
    
    const queryTypes = queryAnalysis.reduce((acc, q) => {
      acc[q.type] = (acc[q.type] || 0) + 1;
      return acc;
    }, {});
    
    for (const [type, count] of Object.entries(queryTypes)) {
      console.log(`  ${type}: ${count}`);
    }
    
    // Show optimization recommendations
    if (optimizations.length > 0) {
      console.log('\n🎯 Database Optimization Recommendations:');
      const highPriority = optimizations.filter(o => o.priority === 'HIGH');
      const mediumPriority = optimizations.filter(o => o.priority === 'MEDIUM');
      
      if (highPriority.length > 0) {
        console.log('\n  🔴 High Priority:');
        highPriority.forEach(o => console.log(`    • ${o.issue}`));
      }
      
      if (mediumPriority.length > 0) {
        console.log('\n  🟡 Medium Priority:');
        mediumPriority.forEach(o => console.log(`    • ${o.issue}`));
      }
    }
    
    console.log('\n💡 Index Recommendations:');
    const highPriorityIndexes = indexRecommendations.filter(r => r.priority === 'HIGH');
    console.log(`High priority indexes needed: ${highPriorityIndexes.length}`);
    console.log(`Total index recommendations: ${indexRecommendations.length}`);

    console.log(`\n📊 Detailed report saved: ${reportPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const optimizer = new DatabaseOptimizer();
  
  optimizer.analyze()
    .then(() => {
      console.log('\n✅ Database optimization analysis completed');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Database optimization analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { DatabaseOptimizer };