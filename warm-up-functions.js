/**
 * Edge Function Warm-up Strategy
 * Prevents cold starts by keeping functions warm with periodic requests
 * Based on PerfProbe scaling recommendations
 */

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://your-project.supabase.co'
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'your-anon-key'

// Function endpoints to keep warm
const FUNCTION_ENDPOINTS = [
  {
    name: 'get-rates',
    path: '/functions/v1/get-rates',
    method: 'POST',
    interval: 4 * 60 * 1000, // 4 minutes
    priority: 'high'
  },
  {
    name: 'checkout-session',
    path: '/functions/v1/checkout-session',
    method: 'POST', 
    interval: 5 * 60 * 1000, // 5 minutes
    priority: 'high'
  },
  {
    name: 'send-email',
    path: '/functions/v1/send-email',
    method: 'POST',
    interval: 6 * 60 * 1000, // 6 minutes
    priority: 'medium'
  },
  {
    name: 'stripe-webhook',
    path: '/functions/v1/stripe-webhook',
    method: 'POST',
    interval: 8 * 60 * 1000, // 8 minutes
    priority: 'low'
  },
  {
    name: 'paypal-webhook', 
    path: '/functions/v1/paypal-webhook',
    method: 'POST',
    interval: 8 * 60 * 1000, // 8 minutes
    priority: 'low'
  }
]

class FunctionWarmer {
  constructor() {
    this.intervals = new Map()
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      lastWarmup: null
    }
  }

  async warmupFunction(endpoint) {
    try {
      const response = await fetch(`${SUPABASE_URL}${endpoint.path}`, {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'X-Warmup': 'true', // Special header to identify warm-up requests
          'User-Agent': 'ANOINT-Array-Warmer/1.0'
        },
        body: JSON.stringify({
          warmup: true,
          timestamp: new Date().toISOString()
        })
      })

      this.stats.totalRequests++
      
      if (response.ok) {
        this.stats.successfulRequests++
        console.log(`✅ Warmed up ${endpoint.name} - Status: ${response.status}`)
      } else {
        this.stats.failedRequests++
        console.warn(`⚠️ Warmup failed for ${endpoint.name} - Status: ${response.status}`)
      }
      
      this.stats.lastWarmup = new Date().toISOString()
      
    } catch (error) {
      this.stats.failedRequests++
      console.error(`❌ Warmup error for ${endpoint.name}:`, error.message)
    }
  }

  startWarmup() {
    console.log('🔥 Starting Edge Functions warm-up service...')
    
    FUNCTION_ENDPOINTS.forEach(endpoint => {
      // Initial warmup
      this.warmupFunction(endpoint)
      
      // Set up recurring warmup
      const intervalId = setInterval(() => {
        this.warmupFunction(endpoint)
      }, endpoint.interval)
      
      this.intervals.set(endpoint.name, intervalId)
      console.log(`📅 Scheduled ${endpoint.name} warmup every ${endpoint.interval/1000/60} minutes`)
    })

    // Log stats every 30 minutes
    setInterval(() => {
      this.logStats()
    }, 30 * 60 * 1000)
  }

  stopWarmup() {
    console.log('🛑 Stopping warm-up service...')
    this.intervals.forEach((intervalId, functionName) => {
      clearInterval(intervalId)
      console.log(`Stopped warmup for ${functionName}`)
    })
    this.intervals.clear()
  }

  logStats() {
    const successRate = this.stats.totalRequests > 0 
      ? ((this.stats.successfulRequests / this.stats.totalRequests) * 100).toFixed(1)
      : 0

    console.log(`
📊 Warm-up Statistics:
   Total Requests: ${this.stats.totalRequests}
   Successful: ${this.stats.successfulRequests}
   Failed: ${this.stats.failedRequests}
   Success Rate: ${successRate}%
   Last Warmup: ${this.stats.lastWarmup}
    `)
  }

  getStats() {
    return { ...this.stats }
  }
}

// Auto-start if running directly
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Node.js environment
  const warmer = new FunctionWarmer()
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n🔄 Gracefully shutting down warm-up service...')
    warmer.stopWarmup()
    warmer.logStats()
    process.exit(0)
  })
  
  process.on('SIGTERM', () => {
    console.log('\n🔄 Gracefully shutting down warm-up service...')
    warmer.stopWarmup()
    warmer.logStats()
    process.exit(0)
  })
  
  warmer.startWarmup()
  
  // Keep the process alive
  setInterval(() => {
    // Heartbeat
  }, 60000)
}

// Export for use in other environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FunctionWarmer
}

// Browser/worker environment
if (typeof self !== 'undefined') {
  self.FunctionWarmer = FunctionWarmer
}

// Usage examples:
/*
// Node.js
const FunctionWarmer = require('./warm-up-functions.js')
const warmer = new FunctionWarmer()
warmer.startWarmup()

// Browser/Service Worker
const warmer = new FunctionWarmer()
warmer.startWarmup()

// Get stats
console.log(warmer.getStats())
*/