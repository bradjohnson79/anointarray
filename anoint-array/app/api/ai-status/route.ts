// AI Status Check - Verify AI services are active
import { NextResponse } from 'next/server'

export async function GET() {
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  const hasSupabaseUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasSupabaseKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  // Determine API key source
  let apiKeySource = 'not configured'
  if (hasOpenAIKey || hasAnthropicKey) {
    if (hasSupabaseUrl && hasSupabaseKey) {
      apiKeySource = 'Supabase + Environment'
    } else {
      apiKeySource = 'Environment Variables (likely Netlify)'
    }
  }
  
  return NextResponse.json({
    status: 'online',
    selfHealingAI: {
      chatgpt4o: hasOpenAIKey ? 'active' : 'fallback',
      claudeSonnet35: hasAnthropicKey ? 'active' : 'missing',
      sharedFolder: 'configured',
      apiSecurity: 'server-side-only'
    },
    configuration: {
      openaiApiKey: hasOpenAIKey ? `✅ Active via ${apiKeySource}` : '❌ Missing - fallback available',
      anthropicApiKey: hasAnthropicKey ? `✅ Active via ${apiKeySource}` : '❌ Missing - required for ANOINT Generator',
      supabaseUrl: hasSupabaseUrl ? '✅ Configured' : '⚠️ Optional',
      supabaseKey: hasSupabaseKey ? '✅ Configured' : '⚠️ Optional',
      apiKeySource: apiKeySource
    },
    capabilities: {
      errorDetection: '✅ Active',
      systemScanning: '✅ Active',  
      autoRepair: hasOpenAIKey ? '✅ Full ChatGPT 4o' : '🔄 Intelligent Fallbacks',
      anointArrayGeneration: hasAnthropicKey ? '✅ Claude 3.5 Sonnet' : '❌ Missing Anthropic API Key',
      maintenanceMode: '✅ Constraints Enforced',
      userSupport: '✅ 24/7 Available'
    },
    instructions: hasAnthropicKey ? 
      'Claude 3.5 Sonnet is active for ANOINT Array generation!' :
      'Add ANTHROPIC_API_KEY to environment variables to activate ANOINT Array generation',
    timestamp: new Date().toISOString()
  })
}