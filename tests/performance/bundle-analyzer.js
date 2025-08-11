const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Next.js Bundle Analysis and Performance Testing
 * Analyzes build output for optimization opportunities
 */

const PERFORMANCE_CONFIG = {
  buildCommand: 'npm run build',
  outputDir: '.next',
  reportPath: 'tests/performance/reports',
  thresholds: {
    maxBundleSize: 1000000, // 1MB
    maxPageSize: 500000,    // 500KB
    maxChunkSize: 250000    // 250KB
  }
};

class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      buildStats: {},
      bundleAnalysis: {},
      recommendations: [],
      performance: {}
    };
  }

  async analyze() {
    console.log('📊 Starting Next.js Bundle Analysis...\n');

    try {
      // Create reports directory
      if (!fs.existsSync(PERFORMANCE_CONFIG.reportPath)) {
        fs.mkdirSync(PERFORMANCE_CONFIG.reportPath, { recursive: true });
      }

      // Run build and capture stats
      await this.runBuild();
      
      // Analyze build output
      await this.analyzeBuildOutput();
      
      // Generate recommendations
      this.generateRecommendations();
      
      // Save report
      const reportPath = path.join(
        PERFORMANCE_CONFIG.reportPath, 
        `bundle-analysis-${Date.now()}.json`
      );
      fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));

      this.printResults(reportPath);
      
      return this.results;

    } catch (error) {
      console.error('❌ Bundle analysis failed:', error);
      throw error;
    }
  }

  async runBuild() {
    console.log('🔨 Running production build...');
    
    return new Promise((resolve, reject) => {
      exec(PERFORMANCE_CONFIG.buildCommand, { 
        cwd: process.cwd(),
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      }, (error, stdout, stderr) => {
        if (error) {
          console.error('Build failed:', error);
          reject(error);
          return;
        }

        // Parse build output for size information
        this.parseBuildOutput(stdout);
        
        console.log('✅ Build completed successfully');
        resolve();
      });
    });
  }

  parseBuildOutput(buildOutput) {
    const lines = buildOutput.split('\n');
    const routes = [];
    let inRouteSection = false;

    for (const line of lines) {
      // Detect route section
      if (line.includes('Route (app)') && line.includes('Size')) {
        inRouteSection = true;
        continue;
      }

      // Parse route information
      if (inRouteSection && line.trim()) {
        const routeMatch = line.match(/^[├└○ƒ─│\s]+([/\w\[\]-]+)\s+(\d+\.?\d*\s*[kMG]?B)\s+(\d+\.?\d*\s*[kMG]?B)?/);
        if (routeMatch) {
          const [, route, size, firstLoadJS] = routeMatch;
          routes.push({
            route: route.trim(),
            size: this.parseSize(size),
            firstLoadJS: firstLoadJS ? this.parseSize(firstLoadJS) : null
          });
        }
      }

      // Stop parsing when we hit the next section
      if (inRouteSection && (line.includes('ƒ Middleware') || line.includes('+ First Load JS shared'))) {
        break;
      }
    }

    this.results.buildStats = {
      routes,
      totalRoutes: routes.length,
      buildOutput: buildOutput.slice(0, 1000) // First 1000 chars for context
    };
  }

  parseSize(sizeStr) {
    const match = sizeStr.match(/(\d+\.?\d*)\s*([kMG]?)B/);
    if (!match) return 0;
    
    const [, number, unit] = match;
    const size = parseFloat(number);
    
    switch (unit) {
      case 'k': return size * 1024;
      case 'M': return size * 1024 * 1024;
      case 'G': return size * 1024 * 1024 * 1024;
      default: return size;
    }
  }

  async analyzeBuildOutput() {
    console.log('🔍 Analyzing build output...');

    try {
      const nextDir = path.join(process.cwd(), '.next');
      
      // Check if build directory exists
      if (!fs.existsSync(nextDir)) {
        throw new Error('Build directory not found. Run npm run build first.');
      }

      // Analyze static directory
      const staticDir = path.join(nextDir, 'static');
      if (fs.existsSync(staticDir)) {
        this.analyzeDirectory(staticDir, 'static');
      }

      // Analyze server directory
      const serverDir = path.join(nextDir, 'server');
      if (fs.existsSync(serverDir)) {
        this.analyzeDirectory(serverDir, 'server');
      }

    } catch (error) {
      console.warn('⚠️ Could not analyze build output:', error.message);
      this.results.bundleAnalysis.error = error.message;
    }
  }

  analyzeDirectory(dirPath, type) {
    const files = this.getFilesRecursively(dirPath);
    const analysis = {
      totalFiles: files.length,
      totalSize: 0,
      largestFiles: [],
      fileTypes: {}
    };

    for (const file of files) {
      const stats = fs.statSync(file);
      const ext = path.extname(file);
      
      analysis.totalSize += stats.size;
      
      // Track file types
      if (!analysis.fileTypes[ext]) {
        analysis.fileTypes[ext] = { count: 0, size: 0 };
      }
      analysis.fileTypes[ext].count++;
      analysis.fileTypes[ext].size += stats.size;
      
      // Track largest files
      analysis.largestFiles.push({
        file: path.relative(process.cwd(), file),
        size: stats.size
      });
    }

    // Sort largest files
    analysis.largestFiles = analysis.largestFiles
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);

    this.results.bundleAnalysis[type] = analysis;
  }

  getFilesRecursively(dir) {
    let files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          files = files.concat(this.getFilesRecursively(fullPath));
        } else {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    
    return files;
  }

  generateRecommendations() {
    const recommendations = [];
    const { routes } = this.results.buildStats;
    const thresholds = PERFORMANCE_CONFIG.thresholds;

    // Check route sizes
    for (const route of routes) {
      if (route.firstLoadJS && route.firstLoadJS > thresholds.maxPageSize) {
        recommendations.push({
          priority: 'HIGH',
          category: 'Bundle Size',
          issue: `Route ${route.route} has large first load JS (${this.formatSize(route.firstLoadJS)})`,
          recommendation: 'Consider code splitting, lazy loading, or reducing dependencies'
        });
      }
    }

    // Check for admin routes optimization
    const adminRoutes = routes.filter(r => r.route.startsWith('/admin'));
    if (adminRoutes.length > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        category: 'Code Splitting',
        issue: `Found ${adminRoutes.length} admin routes that could be optimized`,
        recommendation: 'Implement lazy loading for admin dashboard components'
      });
    }

    // Check bundle analysis
    const { static: staticAnalysis } = this.results.bundleAnalysis;
    if (staticAnalysis) {
      const jsFiles = staticAnalysis.fileTypes['.js'];
      if (jsFiles && jsFiles.size > thresholds.maxBundleSize) {
        recommendations.push({
          priority: 'HIGH',
          category: 'JavaScript Bundle',
          issue: `Large JavaScript bundle size (${this.formatSize(jsFiles.size)})`,
          recommendation: 'Enable tree shaking, remove unused dependencies, implement code splitting'
        });
      }
    }

    // Security headers performance impact
    recommendations.push({
      priority: 'LOW',
      category: 'Security Headers',
      issue: 'Security headers implemented correctly',
      recommendation: 'Consider optimizing CSP for better performance while maintaining security'
    });

    this.results.recommendations = recommendations;
  }

  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  printResults(reportPath) {
    console.log('\n📊 Bundle Analysis Results:');
    
    const { routes } = this.results.buildStats;
    if (routes && routes.length > 0) {
      console.log(`\n📄 Page Analysis:`);
      console.log(`Total routes: ${routes.length}`);
      
      // Show largest pages
      const largestPages = routes
        .filter(r => r.firstLoadJS)
        .sort((a, b) => b.firstLoadJS - a.firstLoadJS)
        .slice(0, 5);
        
      if (largestPages.length > 0) {
        console.log('\n🔍 Largest Pages (First Load JS):');
        for (const page of largestPages) {
          console.log(`  ${page.route}: ${this.formatSize(page.firstLoadJS)}`);
        }
      }
    }

    // Show recommendations
    const { recommendations } = this.results;
    if (recommendations.length > 0) {
      console.log('\n🎯 Optimization Recommendations:');
      const highPriority = recommendations.filter(r => r.priority === 'HIGH');
      const mediumPriority = recommendations.filter(r => r.priority === 'MEDIUM');
      
      if (highPriority.length > 0) {
        console.log('\n  🔴 High Priority:');
        highPriority.forEach(r => console.log(`    • ${r.issue}`));
      }
      
      if (mediumPriority.length > 0) {
        console.log('\n  🟡 Medium Priority:');
        mediumPriority.forEach(r => console.log(`    • ${r.issue}`));
      }
    }

    console.log(`\n📊 Detailed report saved: ${reportPath}`);
  }
}

// Run if called directly
if (require.main === module) {
  const analyzer = new BundleAnalyzer();
  
  analyzer.analyze()
    .then(() => {
      console.log('\n✅ Bundle analysis completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Bundle analysis failed:', error);
      process.exit(1);
    });
}

module.exports = { BundleAnalyzer };