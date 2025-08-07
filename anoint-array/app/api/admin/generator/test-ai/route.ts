import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST() {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'Anthropic API key not configured',
        model: null
      })
    }

    // Test the connection with a simple request
    const testPrompt = `Generate a test ANOINT Array configuration. Return JSON only:
{
  "ring1": [
    {"number": 777, "color": "GOLD", "position": "12:00"},
    {"number": 22, "color": "PURPLE", "position": "01:00"},
    {"number": 333, "color": "SILVER", "position": "02:00"}
  ],
  "ring2": [
    {"glyph": "brain.png", "color": "BLUE", "position": "12:00"},
    {"glyph": "heart.png", "color": "GREEN", "position": "01:00"},
    {"glyph": "om.png", "color": "GOLD", "position": "02:00"}
  ],
  "ring3": {
    "text": "Test Affirmation",
    "language": "English"
  }
}`

    const startTime = Date.now()
    
    const completion = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1000,
      temperature: 0.7,
      system: "You are an ANOINT Array generator. Generate precise configurations for metaphysical seal arrays.",
      messages: [
        {
          role: "user", 
          content: testPrompt
        }
      ]
    })

    const responseTime = Date.now() - startTime
    const response = completion.content[0]?.type === 'text' ? completion.content[0].text : null

    // Try to parse the response as JSON to validate format
    let parsedResponse = null
    try {
      parsedResponse = JSON.parse(response || '{}')
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError)
    }

    const isValidResponse = parsedResponse && 
      parsedResponse.ring1 && 
      parsedResponse.ring2 && 
      parsedResponse.ring3 &&
      Array.isArray(parsedResponse.ring1) &&
      Array.isArray(parsedResponse.ring2)

    return NextResponse.json({
      success: true,
      model: completion.model,
      responseTime,
      tokensUsed: completion.usage.input_tokens + completion.usage.output_tokens,
      validFormat: isValidResponse,
      testResponse: parsedResponse,
      rawResponse: response
    })

  } catch (error: any) {
    console.error('Claude test failed:', error)
    
    let errorMessage = 'Unknown error'
    let errorCode = 'UNKNOWN'
    
    if (error.code === 'invalid_api_key') {
      errorMessage = 'Invalid API key'
      errorCode = 'INVALID_API_KEY'
    } else if (error.code === 'insufficient_quota') {
      errorMessage = 'Insufficient quota'
      errorCode = 'INSUFFICIENT_QUOTA'
    } else if (error.code === 'rate_limit_exceeded') {
      errorMessage = 'Rate limit exceeded'
      errorCode = 'RATE_LIMIT'
    } else if (error.message) {
      errorMessage = error.message
    }

    return NextResponse.json({
      success: false,
      error: errorMessage,
      errorCode,
      model: null
    })
  }
}