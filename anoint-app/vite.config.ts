import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' }
  },
  build: {
    // Enable code splitting and chunk optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react'],
          'data-vendor': ['@supabase/supabase-js', '@tanstack/react-query'],
          // Admin pages in separate chunk
          'admin': [
            './src/pages/admin/Users.tsx',
            './src/pages/admin/Products.tsx', 
            './src/pages/admin/Shipping.tsx',
            './src/pages/admin/Orders.tsx',
            './src/pages/admin/Marketing.tsx'
          ]
        }
      }
    },
    // Enable chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Optimize asset handling
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    // Enable source maps for production debugging
    sourcemap: true
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'lucide-react'
    ]
  },
  // Enable gzip compression in dev mode for testing
  server: {
    middlewareMode: false,
    hmr: {
      overlay: false // Less intrusive HMR overlay
    }
  }
})
