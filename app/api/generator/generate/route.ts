import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { promises as fs, createReadStream } from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { findOrCreateGlyphsDirectory } from '@/lib/path-utils'
import { ensureGlyphsInPublic } from '@/lib/glyph-loader'

interface UserInput {
  fullName: string
  birthdate: { month: number, day: number, year: number }
  birthTime?: { hour: number, minute: number, period: 'AM' | 'PM' }
  birthPlace?: {
    displayName: string
    latitude: number
    longitude: number
  }
  template: 'torus-field' | 'flower-of-life' | 'sri-yantra'
  category: string
  sealType: string
  additionalComments?: string
  debugMode?: boolean  // Add debug mode flag
}

interface GenerationOutput {
  ring1: Array<{
    number: number
    color: string
    position: string
    angle: number
    x: number
    y: number
  }>
  ring2: Array<{
    glyph: string
    color: string
    position: string
    angle: number
    x: number
    y: number
  }>
  ring3: {
    text: string
    language: string
    repetitions: number
  }
  explanation: string
  metadata: {
    generated: Date | string
    userId?: string
    template: string
    category: string
    sealType: string
  }
}

// Available colors from colors.csv
const AVAILABLE_COLORS = [
  'WHITE', 'RED', 'ORANGE', 'YELLOW', 'GREEN', 
  'AQUA', 'BLUE', 'INDIGO', 'PURPLE', 'VIOLET', 
  'GOLD', 'SILVER', 'GRAY'
]

// 24-point time positions
const TIME_POSITIONS = [
  '12:00', '12:30', '01:00', '01:30', '02:00', '02:30',
  '03:00', '03:30', '04:00', '04:30', '05:00', '05:30',
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30',
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30'
]

let anthropic: Anthropic | null = null

// Sanitize JSON string to handle control characters
function sanitizeJsonString(jsonString: string): string {
  // Replace problematic control characters in JSON strings
  return jsonString
    // Fix unescaped newlines in strings
    .replace(/"([^"\\]*)\\n([^"\\]*)"/g, (match, before, after) => {
      return `"${before}\\\\n${after}"`
    })
    // Fix unescaped tabs in strings  
    .replace(/"([^"\\]*)\\t([^"\\]*)"/g, (match, before, after) => {
      return `"${before}\\\\t${after}"`
    })
    // Fix unescaped carriage returns
    .replace(/"([^"\\]*)\\r([^"\\]*)"/g, (match, before, after) => {
      return `"${before}\\\\r${after}"`
    })
    // Fix literal newlines within JSON strings (most common issue)
    .replace(/"([^"]*)\n([^"]*)"/g, (match, before, after) => {
      return `"${before}\\\\n${after}"`
    })
    // Fix literal tabs within JSON strings
    .replace(/"([^"]*)\t([^"]*)"/g, (match, before, after) => {
      return `"${before}\\\\t${after}"`
    })
}

// Attempt fallback JSON parsing with various repair strategies
function attemptFallbackJsonParsing(response: string): any | null {
  try {
    // Strategy 1: Find JSON and aggressively clean it
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null
    
    let jsonString = jsonMatch[0]
    
    // More aggressive sanitization
    jsonString = jsonString
      // Remove any non-printable characters except intended escapes
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      // Fix common JSON formatting issues
      .replace(/,\s*}/g, '}') // Remove trailing commas
      .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
    
    return JSON.parse(jsonString)
  } catch (error) {
    console.error('Fallback parsing attempt failed:', error)
    return null
  }
}

// Initialize Anthropic client lazily
function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('Anthropic API key not configured')
    }
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })
  }
  return anthropic
}

// Load available glyphs from CSV
async function getAvailableGlyphs(): Promise<string[]> {
  try {
    const glyphsDir = await findOrCreateGlyphsDirectory()
    const glyphsCsvPath = path.join(glyphsDir, 'glyphs.csv')
    const glyphs: string[] = []
    
    console.log('Loading glyphs from:', glyphsCsvPath)
    
    // Check if file exists first
    try {
      await fs.access(glyphsCsvPath)
    } catch (error) {
      console.error('Glyphs CSV file not found:', glyphsCsvPath)
      // Try to read PNG files directly from directory
      try {
        const files = await fs.readdir(glyphsDir)
        const pngFiles = files.filter(f => f.endsWith('.png'))
        console.log('Found PNG files in directory:', pngFiles.length)
        if (pngFiles.length > 0) {
          return pngFiles
        }
      } catch (dirError) {
        console.error('Could not read glyph directory:', dirError)
      }
      return [] // Return empty array if file doesn't exist
    }

    return new Promise((resolve, reject) => {
      createReadStream(glyphsCsvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Assuming CSV format: filename,description
          const filename = Object.keys(row)[0] // First column
          if (filename && filename.endsWith('.png')) {
            glyphs.push(filename)
          }
        })
        .on('end', () => {
          console.log('Loaded glyphs from CSV:', glyphs.length)
          resolve(glyphs)
        })
        .on('error', (error) => reject(error))
    })
  } catch (error) {
    console.error('Failed to load glyphs:', error)
    // Fallback to expected glyphs
    return [
      'brain.png', 'heart.png', 'om.png', 'ankh.png', 'lotus.png',
      'fire.png', 'water.png', 'earth.png', 'air-element.png', 'ether.png',
      'root-chakra.png', 'sacral-chakra.png', 'navel-chakra.png', 'heart-chakra.png',
      'throat-chakra.png', '3rd-eye-chakra.png', 'crown-center.png',
      'liver.png', 'kidneys.png', 'lungs.png', 'spleen.png', 'stomach.png',
      'pancreas.png', 'intestines.png'
    ]
  }
}

// Calculate position coordinates
function calculatePosition(timePosition: string, radius: number): { x: number, y: number, angle: number } {
  const timeIndex = TIME_POSITIONS.indexOf(timePosition)
  const angle = timeIndex * 15 // 15° intervals
  const radian = (angle - 90) * (Math.PI / 180) // -90 to start at 12:00
  
  return {
    x: 600 + Math.cos(radian) * radius,
    y: 600 + Math.sin(radian) * radius,
    angle: angle
  }
}

// Generate AI prompt
function generatePrompt(userInput: UserInput, availableGlyphs: string[]): string {
  // Handle optional birth time
  let birthTimeText = 'Not specified'
  if (userInput.birthTime) {
    const birthTime24 = userInput.birthTime.period === 'PM' && userInput.birthTime.hour !== 12
      ? userInput.birthTime.hour + 12
      : userInput.birthTime.hour === 12 && userInput.birthTime.period === 'AM'
      ? 0
      : userInput.birthTime.hour
    birthTimeText = `${birthTime24}:${userInput.birthTime.minute.toString().padStart(2, '0')}`
  }

  // Handle optional birth place
  let birthPlaceText = 'Not specified'
  let coordinatesText = 'Not specified'
  if (userInput.birthPlace) {
    birthPlaceText = userInput.birthPlace.displayName
    coordinatesText = `${userInput.birthPlace.latitude}, ${userInput.birthPlace.longitude}`
  }

  return `Generate a personalized ANOINT Array configuration for:

User Information:
- Name: ${userInput.fullName}
- Birth Date: ${userInput.birthdate.month}/${userInput.birthdate.day}/${userInput.birthdate.year}
- Birth Time: ${birthTimeText}
- Birth Location: ${birthPlaceText}
- GPS Coordinates: ${coordinatesText}
- Selected Template: ${userInput.template}
- Category: ${userInput.category}
- Seal Type: ${userInput.sealType}
${userInput.additionalComments ? `- Additional Notes: ${userInput.additionalComments}` : ''}

CRITICAL FOCUS: This seal array is specifically for "${userInput.sealType}" with emphasis on "${userInput.category}". 
ALL selections must directly support and enhance the healing intention of "${userInput.sealType}".

${userInput.sealType.toLowerCase().includes('liver') ? 'For liver-related healing, prioritize: liver.png glyph, digestive system glyphs (stomach.png, spleen.png, pancreas.png), detox-supporting elements, and numbers associated with renewal and cleansing.' : ''}
${userInput.sealType.toLowerCase().includes('heart') ? 'For heart-related healing, prioritize: heart.png glyph, heart-chakra.png, circulation-supporting elements, and numbers associated with love and emotional balance.' : ''}
${userInput.sealType.toLowerCase().includes('kidney') ? 'For kidney-related healing, prioritize: kidneys.png glyph, water element symbols, and numbers associated with filtration and flow.' : ''}

Generate exactly 24 unique combinations for each ring based on the user's personal energy signature, birth data, and intention:

CRITICAL: Use Chinese Bazi calculations with the SOLAR calendar, NOT the lunar calendar. This is essential for accurate metaphysical calculations and energy alignment.

Ring 1 (Numbers): Select 24 different numbers from 1-999, each paired with a unique color - relate each number to the "${userInput.sealType}" healing intention
Ring 2 (Glyphs): Select 24 different glyphs from the available list, each paired with a unique color - prioritize glyphs that support "${userInput.sealType}"
Ring 3 (Affirmation): Create 1 powerful affirmation under 10 words that specifically addresses "${userInput.sealType}"

MANDATORY DETAILED EXPLANATIONS - FAILURE TO PROVIDE ALL 24 EXPLANATIONS WILL RESULT IN REJECTION:
1. Overall significance specifically mentioning how this configuration supports "${userInput.sealType}"
2. DETAILED explanation for EACH of ALL 24 numbers - how each relates to "${userInput.sealType}"
3. DETAILED explanation for EACH of ALL 24 glyphs - why each was chosen for "${userInput.sealType}"
4. The significance of color choices in relation to the healing intention
5. How the Ring 3 affirmation activates the healing matrix for "${userInput.sealType}"

CRITICAL FORMATTING REQUIREMENTS - YOU MUST INCLUDE ALL 24 EXPLANATIONS OR YOUR RESPONSE WILL BE INVALID:

RING 1 NUMBERS (ALL 24 REQUIRED):
- [number] at [position] ([Color]) - [detailed explanation of how this number supports ${userInput.sealType}]
[MUST CONTINUE FOR ALL 24 POSITIONS - NO EXCEPTIONS]

RING 2 GLYPHS (ALL 24 REQUIRED):
- [glyph].png at [position] ([Color]) - [detailed explanation of why this glyph was chosen for ${userInput.sealType}]
[MUST CONTINUE FOR ALL 24 POSITIONS - NO EXCEPTIONS]

EXAMPLE FORMAT:
- liver.png at 12:00 (Green) - Direct liver support, detoxification, and regeneration
- spleen.png at 12:30 (Yellow) - Supports liver through digestive harmony and energy transformation
- kidneys.png at 01:00 (Blue) - Assists liver by filtering toxins and maintaining fluid balance

YOU MUST PROVIDE DETAILED, MEANINGFUL EXPLANATIONS FOR ALL 48 ITEMS (24 numbers + 24 glyphs)

Available Colors: ${AVAILABLE_COLORS.join(', ')}
Available Glyphs: ${availableGlyphs.join(', ')}
Time Positions: ${TIME_POSITIONS.join(', ')}

IMPORTANT: 
- No duplicate numbers in Ring 1
- No duplicate glyphs in Ring 2  
- Colors can repeat but try to distribute evenly
- Consider the user's birth data and intention when selecting numbers and glyphs
- Make selections meaningful to their personal energy signature

CRITICAL JSON FORMATTING: Return ONLY valid, properly escaped JSON. All newlines in explanations must be escaped as \\n, not literal newlines. Use proper JSON string escaping.

Return ONLY valid JSON in this exact format:
{
  "ring1": [
    {"number": 777, "color": "GOLD", "position": "12:00"},
    {"number": 22, "color": "PURPLE", "position": "12:30"},
    ... (22 more entries for all 24 positions)
  ],
  "ring2": [
    {"glyph": "brain.png", "color": "BLUE", "position": "12:00"},
    {"glyph": "heart.png", "color": "GREEN", "position": "12:30"},
    ... (22 more entries for all 24 positions)
  ],
  "ring3": {
    "text": "Divine Light Illuminates My Path",
    "language": "English"
  },
  "explanation": "Your personalized ANOINT Array reflects your unique energy signature created specifically for [Full Name].\\n\\nOVERALL CONFIGURATION: This array harmonizes with your birth energy of [Birth Date] at [Birth Time] in [Location], creating a personalized matrix for spiritual growth and manifestation.\\n\\nRING 1 NUMBERS (Inner Circle):\\n- 777 at 12:00 (Gold) - Spiritual awakening and divine connection aligned with your crown energy\\n- 22 at 12:30 (Purple) - Master builder number reflecting your soul's purpose\\n[Continue for all 24 numbers with specific meanings]\\n\\nRING 2 GLYPHS (Outer Circle):\\n- Brain at 12:00 (Blue) - Mental clarity and wisdom for your spiritual path\\n- Heart at 12:30 (Green) - Emotional healing and compassion activation\\n[Continue for all 24 glyphs with specific meanings]\\n\\nRING 3 AFFIRMATION: \\\"Divine Light Illuminates My Path\\\" creates the vibrational foundation that unifies all elements, resonating with your birth frequency and life purpose.\\n\\nThis configuration creates a powerful energy matrix specifically attuned to your personal coordinates and life mission."
}`
}

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now()
    
    // Validate environment variables
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('PLACEHOLDER')) {
      return NextResponse.json({
        success: false,
        error: 'Anthropic API key not configured. Please add a valid ANTHROPIC_API_KEY to your environment variables.',
        code: 'MISSING_API_KEY'
      }, { status: 500 })
    }

    const userInput: UserInput = await request.json()
    const debugMode = userInput.debugMode || false

    // Validate required fields
    if (!userInput.fullName || !userInput.template || !userInput.category || !userInput.sealType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Ensure glyphs are accessible from public directory
    await ensureGlyphsInPublic()
    
    // Get available glyphs
    const glyphStartTime = Date.now()
    const availableGlyphs = await getAvailableGlyphs()
    const glyphLoadTime = Date.now() - glyphStartTime

    // Generate AI prompt
    const promptStartTime = Date.now()
    const prompt = generatePrompt(userInput, availableGlyphs)
    const promptGenTime = Date.now() - promptStartTime

    console.log('Generating ANOINT Array for:', userInput.fullName)
    if (debugMode) {
      console.log('Debug mode enabled - will return detailed information')
    }

    // Call Claude 3.5 Sonnet
    const aiStartTime = Date.now()
    const completion = await getAnthropicClient().messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 8000, // Increased for detailed explanations
      temperature: 0.8, // Higher creativity for personalized results
      system: "You are an expert metaphysical practitioner specializing in personalized energy seal arrays. Generate precise, meaningful selections based on the user's birth data, location, and intentions. CRITICAL: Use Chinese Bazi calculations with the SOLAR calendar, NOT the lunar calendar - this is essential for accurate metaphysical calculations. Ensure all selections are unique within each ring and personally relevant. YOU MUST provide detailed explanations for ALL 24 numbers and ALL 24 glyphs - no exceptions. Any response missing complete explanations will be rejected.",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    })
    const aiCallTime = Date.now() - aiStartTime

    const response = completion.content[0]?.type === 'text' ? completion.content[0].text : null

    if (!response) {
      throw new Error('No response from Claude')
    }

    // Sanitize and parse JSON response
    let aiResponse: any
    try {
      console.log('Raw AI response length:', response.length)
      console.log('Raw AI response preview:', response.substring(0, 500) + '...')
      
      // Clean response - remove any non-JSON content
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error('No JSON found in response. Full response:', response)
        throw new Error('No JSON found in response')
      }
      
      let jsonString = jsonMatch[0]
      console.log('Extracted JSON length:', jsonString.length)
      
      // Sanitize JSON string to handle control characters properly
      jsonString = sanitizeJsonString(jsonString)
      
      console.log('Sanitized JSON preview:', jsonString.substring(0, 500) + '...')
      
      aiResponse = JSON.parse(jsonString)
      console.log('Successfully parsed JSON response')
    } catch (parseError) {
      console.error('JSON parse error:', parseError)
      console.error('Failed to parse AI response. Attempting fallback parsing...')
      
      // Fallback: Try to fix common JSON issues
      try {
        const fallbackParsed = attemptFallbackJsonParsing(response)
        if (fallbackParsed) {
          aiResponse = fallbackParsed
          console.log('Successfully parsed with fallback method')
        } else {
          throw new Error('Fallback parsing also failed')
        }
      } catch (fallbackError) {
        console.error('Fallback parsing failed:', fallbackError)
        throw new Error(`Invalid JSON response from Claude AI. Original error: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
      }
    }

    // Validate AI response structure
    if (!aiResponse.ring1 || !aiResponse.ring2 || !aiResponse.ring3 || !aiResponse.explanation) {
      throw new Error('Invalid response structure from AI')
    }

    if (!Array.isArray(aiResponse.ring1) || !Array.isArray(aiResponse.ring2)) {
      throw new Error('Rings must be arrays')
    }

    if (aiResponse.ring1.length !== 24 || aiResponse.ring2.length !== 24) {
      throw new Error('Each ring must have exactly 24 entries')
    }

    // Calculate coordinates for each position
    const processedRing1 = aiResponse.ring1.map((item: any) => {
      const coords = calculatePosition(item.position, 360) // Ring 1 radius
      return {
        ...item,
        angle: coords.angle,
        x: Math.round(coords.x),
        y: Math.round(coords.y)
      }
    })

    const processedRing2 = aiResponse.ring2.map((item: any) => {
      const coords = calculatePosition(item.position, 460) // Ring 2 radius
      return {
        ...item,
        angle: coords.angle,
        x: Math.round(coords.x),
        y: Math.round(coords.y)
      }
    })

    // Process Ring 3 text for repetitions
    const textLength = aiResponse.ring3.text.split(' ').length
    let repetitions = 1
    
    if (textLength <= 3) {
      repetitions = 2 // Repeat twice for very short affirmations
    } else if (textLength <= 5) {
      repetitions = 1 // Repeat once for medium affirmations
    }
    // No repetition for longer affirmations (6-10 words)

    const result: GenerationOutput = {
      ring1: processedRing1,
      ring2: processedRing2,
      ring3: {
        ...aiResponse.ring3,
        repetitions
      },
      explanation: aiResponse.explanation,
      metadata: {
        generated: new Date().toISOString(),
        template: userInput.template,
        category: userInput.category,
        sealType: userInput.sealType
      }
    }

    console.log('Successfully generated ANOINT Array for:', userInput.fullName)

    const baseResponse = {
      success: true,
      data: result,
      tokensUsed: completion.usage.input_tokens + completion.usage.output_tokens,
      cost: ((completion.usage.input_tokens * 0.003 + completion.usage.output_tokens * 0.015) / 1000).toFixed(4) // Claude 3.5 Sonnet pricing
    }

    // Add debug information if requested
    if (debugMode) {
      const totalTime = Date.now() - startTime
      
      return NextResponse.json({
        ...baseResponse,
        debug: {
          prompt: {
            fullText: prompt,
            userInput: userInput,
            availableGlyphsCount: availableGlyphs.length
          },
          aiResponse: {
            raw: response,
            parsed: aiResponse,
            model: "claude-3-5-sonnet-20241022",
            temperature: 0.8,
            maxTokens: 8000
          },
          timing: {
            total: totalTime,
            glyphLoad: glyphLoadTime,
            promptGeneration: promptGenTime,
            aiCall: aiCallTime,
            parsing: totalTime - startTime - glyphLoadTime - promptGenTime - aiCallTime
          },
          tokens: {
            input: completion.usage.input_tokens,
            output: completion.usage.output_tokens,
            total: completion.usage.input_tokens + completion.usage.output_tokens
          },
          coordinateCalculations: {
            ring1Sample: processedRing1[0],
            ring2Sample: processedRing2[0],
            ring3: result.ring3
          }
        }
      })
    }

    return NextResponse.json(baseResponse)

  } catch (error: any) {
    console.error('Generation failed:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Failed to generate ANOINT Array',
      code: error.code || 'GENERATION_FAILED'
    }, { status: 500 })
  }
}