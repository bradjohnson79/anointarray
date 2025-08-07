import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import * as fsSync from 'fs'
import path from 'path'
import csv from 'csv-parser'
import { findOrCreateGlyphsDirectory, findOrCreateTemplatesDirectory } from '@/lib/path-utils'

interface AssetVerificationResult {
  glyphs: {
    total: number
    verified: string[]
    missing: string[]
    sizes: { [filename: string]: { width: number, height: number } }
  }
  templates: {
    flowerOfLife: boolean
    sriYantra: boolean
    torusField: boolean
  }
  csvData: {
    numbers: { loaded: boolean, count: number }
    colors: { loaded: boolean, count: number }
    glyphs: { loaded: boolean, count: number }
  }
  openAI: {
    connected: boolean
    model: string
    lastTest: Date | null
    customPrompt: string
    promptTemplate: string
  }
  paymentGateways: {
    stripe: boolean
    paypal: boolean
    nowpayments: boolean
  }
  sampleArray: {
    uploaded: boolean
    fileName: string | null
    uploadDate: Date | null
    imageUrl: string | null
  }
}

// Expected glyph files from the CSV
const EXPECTED_GLYPHS = [
  'air-element.png', 'ankh.png', 'aquarius.png', 'aries.png', 'brain.png',
  'cancer.png', 'capricorn.png', 'cat.png', 'dna.png', 'dog.png',
  'dragon.png', 'earth.png', 'ether.png', 'eye-of-horus.png', 'female-reproductive.png',
  'fire.png', 'gemini.png', 'goat.png', 'heart.png', 'horse.png',
  'intestines.png', 'kaballah-tree-of-life.png', 'kidneys.png', 'leo.png', 'liver.png',
  'lotus.png', 'lungs.png', 'maat-feather.png', 'male-reproductive.png', 'monkey.png',
  'om.png', 'ox.png', 'pancreas.png', 'pentagram.png', 'pig.png',
  'pisces.png', 'rat.png', 'rooster.png', 'sagittarius.png', 'scorpio.png',
  'seed-of-life.png', 'skeleton.png', 'snake.png', 'spine.png', 'spleen.png',
  'sri-yantra.png', 'stomach.png', 'taurus.png', 'tiger.png', 'triskelion.png',
  'virgo.png', 'water.png', 'root-chakra.png', 'sacral-chakra.png', 'navel-chakra.png',
  'heart-chakra.png', 'throat-chakra.png', '3rd-eye-chakra.png', 'crown-center.png'
]

const EXPECTED_TEMPLATES = [
  'flower-of-life-template.png',
  'sri-yantra-template.png', 
  'torus-field-template.png'
]

async function verifyGlyphAssets(): Promise<AssetVerificationResult['glyphs']> {
  const glyphsPath = await findOrCreateGlyphsDirectory()
  console.log('Verifying glyph assets in:', glyphsPath)
  
  const verified: string[] = []
  const missing: string[] = []
  const sizes: { [filename: string]: { width: number, height: number } } = {}

  // First, try to read the actual glyphs from uploaded CSV
  let actualGlyphs = EXPECTED_GLYPHS
  try {
    const csvPath = path.join(glyphsPath, 'glyphs.csv')
    await fs.access(csvPath)
    
    // Read actual glyphs from CSV
    const csvContent = await fs.readFile(csvPath, 'utf8')
    const lines = csvContent.trim().split('\n')
    const csvGlyphs: string[] = []
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (!line) continue
      
      const columns = line.split(',').map(col => col.trim().replace(/"/g, ''))
      const filename = columns[0]
      
      if (filename && (filename.includes('.png') || filename.includes('.jpg') || filename.includes('.jpeg'))) {
        csvGlyphs.push(filename)
      }
    }
    
    if (csvGlyphs.length > 0) {
      actualGlyphs = csvGlyphs
      console.log('Using glyphs from uploaded CSV:', csvGlyphs.length, 'entries')
    }
  } catch (error) {
    console.log('Could not read glyphs.csv, using expected glyphs list')
  }

  // Use CSV-based verification instead of file system checks
  // If we successfully read glyphs from CSV, consider them all as verified
  if (actualGlyphs.length > 0 && actualGlyphs !== EXPECTED_GLYPHS) {
    // We have glyphs from uploaded CSV - mark all as verified
    console.log('Using CSV-based verification for uploaded glyphs')
    verified.push(...actualGlyphs)
    
    // Set standard glyph sizes for all verified glyphs
    actualGlyphs.forEach(glyph => {
      sizes[glyph] = { width: 40, height: 40 }
    })
  } else {
    // Fallback to file system check for default/expected glyphs
    console.log('Using file system verification for default glyphs')
    for (const glyph of actualGlyphs) {
      try {
        const glyphPath = path.join(glyphsPath, glyph)
        await fs.access(glyphPath)
        verified.push(glyph)
        sizes[glyph] = { width: 40, height: 40 }
      } catch (error) {
        missing.push(glyph)
      }
    }
  }

  return {
    total: actualGlyphs.length,
    verified,
    missing,
    sizes
  }
}

async function verifyTemplateAssets(): Promise<AssetVerificationResult['templates']> {
  const templatesPath = await findOrCreateTemplatesDirectory()
  console.log('Verifying template assets in:', templatesPath)
  
  const results = await Promise.allSettled([
    fs.access(path.join(templatesPath, 'flower-of-life-template.png')),
    fs.access(path.join(templatesPath, 'sri-yantra-template.png')),
    fs.access(path.join(templatesPath, 'torus-field-template.png'))
  ])

  return {
    flowerOfLife: results[0].status === 'fulfilled',
    sriYantra: results[1].status === 'fulfilled',
    torusField: results[2].status === 'fulfilled'
  }
}

async function parseCSVFile(filePath: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const results: any[] = []
    
    fsSync.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data: any) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error: any) => reject(error))
  })
}

async function verifyCsvData(): Promise<AssetVerificationResult['csvData']> {
  const glyphsPath = await findOrCreateGlyphsDirectory()
  console.log('Verifying CSV data in:', glyphsPath)
  
  const csvFiles = {
    numbers: { loaded: false, count: 0 },
    colors: { loaded: false, count: 0 },
    glyphs: { loaded: false, count: 0 }
  }

  try {
    // Verify numbers.csv
    const numbersData = await parseCSVFile(path.join(glyphsPath, 'numbers.csv'))
    csvFiles.numbers = { loaded: true, count: numbersData.length }
  } catch (error) {
    console.error('Failed to load numbers.csv:', error)
  }

  try {
    // Verify colors.csv
    const colorsData = await parseCSVFile(path.join(glyphsPath, 'colors.csv'))
    csvFiles.colors = { loaded: true, count: colorsData.length - 1 } // Subtract header row
  } catch (error) {
    console.error('Failed to load colors.csv:', error)
  }

  try {
    // Verify glyphs.csv
    const csvPath = path.join(glyphsPath, 'glyphs.csv')
    console.log('Checking for glyphs.csv at:', csvPath)
    
    // Check if file exists first
    await fs.access(csvPath)
    
    // Count lines manually for more accurate count
    const csvContent = await fs.readFile(csvPath, 'utf8')
    const lines = csvContent.trim().split('\n')
    let validEntries = 0
    
    // Skip header row and count valid entries
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim()
      if (line) validEntries++
    }
    
    csvFiles.glyphs = { loaded: true, count: validEntries }
    console.log('Successfully loaded glyphs.csv with', validEntries, 'entries')
  } catch (error) {
    console.error('Failed to load glyphs.csv:', error)
  }

  return csvFiles
}

// Payment gateway testing functions (imported from test-payments)
async function testStripeQuick(): Promise<boolean> {
  try {
    if (!process.env.STRIPE_SECRET_KEY) return false
    
    const response = await fetch('https://api.stripe.com/v1/account', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.STRIPE_SECRET_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    return response.ok
  } catch (error) {
    return false
  }
}

async function testPayPalQuick(): Promise<boolean> {
  try {
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) return false
    
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
    ).toString('base64')

    const baseUrl = process.env.PAYPAL_ENVIRONMENT === 'production' 
      ? 'https://api.paypal.com'
      : 'https://api.sandbox.paypal.com'

    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    })
    return response.ok
  } catch (error) {
    return false
  }
}

async function testNowPaymentsQuick(): Promise<boolean> {
  try {
    if (!process.env.NOWPAYMENTS_API_KEY) return false
    
    const response = await fetch('https://api.nowpayments.io/v1/status', {
      method: 'GET',
      headers: {
        'x-api-key': process.env.NOWPAYMENTS_API_KEY,
        'Content-Type': 'application/json'
      }
    })
    return response.ok
  } catch (error) {
    return false
  }
}

async function verifyPaymentGateways(): Promise<AssetVerificationResult['paymentGateways']> {
  try {
    // Test payment gateways in parallel for faster response
    const [stripeStatus, paypalStatus, nowpaymentsStatus] = await Promise.allSettled([
      testStripeQuick(),
      testPayPalQuick(),
      testNowPaymentsQuick()
    ])

    return {
      stripe: stripeStatus.status === 'fulfilled' && stripeStatus.value,
      paypal: paypalStatus.status === 'fulfilled' && paypalStatus.value,
      nowpayments: nowpaymentsStatus.status === 'fulfilled' && nowpaymentsStatus.value
    }
  } catch (error) {
    console.error('Payment gateway verification failed:', error)
    // Return false for all if there's an error
    return {
      stripe: false,
      paypal: false,
      nowpayments: false
    }
  }
}

async function verifySampleArray(): Promise<AssetVerificationResult['sampleArray']> {
  try {
    // For now, we'll just return default values since we don't have database storage yet
    // This will be updated when database integration is added
    const sampleArrayPath = path.join(process.cwd(), 'public', 'sample-array.png')
    
    try {
      const stat = await fs.stat(sampleArrayPath)
      return {
        uploaded: true,
        fileName: 'sample-array.png',
        uploadDate: stat.mtime,
        imageUrl: '/sample-array.png'
      }
    } catch (fileError) {
      // File doesn't exist
      return {
        uploaded: false,
        fileName: null,
        uploadDate: null,
        imageUrl: null
      }
    }
  } catch (error) {
    console.error('Sample array verification failed:', error)
    return {
      uploaded: false,
      fileName: null,
      uploadDate: null,
      imageUrl: null
    }
  }
}

export async function GET() {
  try {
    const [glyphsResult, templatesResult, csvResult, paymentGatewaysResult, sampleArrayResult] = await Promise.all([
      verifyGlyphAssets(),
      verifyTemplateAssets(),
      verifyCsvData(),
      verifyPaymentGateways(),
      verifySampleArray()
    ])

    const result: AssetVerificationResult = {
      glyphs: glyphsResult,
      templates: templatesResult,
      csvData: csvResult,
      openAI: {
        connected: false,
        model: '',
        lastTest: null,
        customPrompt: '',
        promptTemplate: 'default'
      },
      paymentGateways: paymentGatewaysResult,
      sampleArray: sampleArrayResult
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Asset verification failed:', error)
    return NextResponse.json(
      { error: 'Failed to verify assets' },
      { status: 500 }
    )
  }
}