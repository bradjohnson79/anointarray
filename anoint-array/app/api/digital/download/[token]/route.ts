import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'

// Secure Digital Download System
// Token-based authentication with 7-day expiry and 3-download limit

interface DigitalDownload {
  id: string
  orderId: string
  productId: string
  productTitle: string
  filePath: string
  token: string
  expiresAt: string
  downloadCount: number
  maxDownloads: number
  customerEmail: string
  createdAt: string
  lastDownloadAt?: string
  ipAddresses: string[]
}

interface RouteParams {
  params: {
    token: string
  }
}

// Mock database - in production this would be a real database
const mockDownloads: DigitalDownload[] = [
  {
    id: 'dl_001',
    orderId: 'order_003',
    productId: 'prod_005',
    productTitle: 'Astral Projection Training Course',
    filePath: '/digital/products/astral-projection-course.zip',
    token: 'abc123def456ghi789',
    expiresAt: '2025-08-08T06:15:00Z',
    downloadCount: 2,
    maxDownloads: 3,
    customerEmail: 'emma.thompson@email.com',
    createdAt: '2025-08-01T06:15:00Z',
    lastDownloadAt: '2025-08-02T10:30:00Z',
    ipAddresses: ['192.168.1.100', '10.0.0.50']
  },
  {
    id: 'dl_002',
    orderId: 'order_001',
    productId: 'prod_002',
    productTitle: 'Meditation Frequency Generator Pack',
    filePath: '/digital/products/meditation-frequency-pack.zip',
    token: 'xyz789abc123def456',
    expiresAt: '2025-08-08T10:30:00Z',
    downloadCount: 0,
    maxDownloads: 3,
    customerEmail: 'sarah.wilson@email.com',
    createdAt: '2025-08-01T10:30:00Z',
    ipAddresses: []
  }
]

function validateToken(token: string): DigitalDownload | null {
  return mockDownloads.find(download => download.token === token) || null
}

function updateDownloadCount(token: string, ipAddress: string): boolean {
  const downloadIndex = mockDownloads.findIndex(d => d.token === token)
  if (downloadIndex !== -1) {
    mockDownloads[downloadIndex].downloadCount += 1
    mockDownloads[downloadIndex].lastDownloadAt = new Date().toISOString()
    
    // Track IP addresses for security monitoring
    if (!mockDownloads[downloadIndex].ipAddresses.includes(ipAddress)) {
      mockDownloads[downloadIndex].ipAddresses.push(ipAddress)
    }
    
    return true
  }
  return false
}

function generateSecureFileName(originalName: string, token: string): string {
  const hash = createHash('sha256').update(token + originalName).digest('hex').substring(0, 16)
  return `${hash}_${originalName}`
}

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  return cfConnectingIP || realIP || forwarded?.split(',')[0] || '127.0.0.1'
}

function logDownloadAttempt(token: string, ipAddress: string, userAgent: string, success: boolean, reason?: string) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    token: token.substring(0, 8) + '***', // Masked for security
    ipAddress,
    userAgent,
    success,
    reason
  }
  
  // In production, this would write to a proper logging system
  console.log('Digital download attempt:', logEntry)
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params
    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || 'Unknown'
    
    if (!token) {
      logDownloadAttempt('', ipAddress, userAgent, false, 'No token provided')
      return NextResponse.json({
        error: 'Download token required'
      }, { status: 400 })
    }

    // Validate token format (should be 64 characters hex)
    if (!/^[a-f0-9]{64}$/i.test(token)) {
      logDownloadAttempt(token, ipAddress, userAgent, false, 'Invalid token format')
      return NextResponse.json({
        error: 'Invalid download token'
      }, { status: 400 })
    }

    // Find download record
    const download = validateToken(token)
    if (!download) {
      logDownloadAttempt(token, ipAddress, userAgent, false, 'Token not found')
      return NextResponse.json({
        error: 'Download link not found or expired'
      }, { status: 404 })
    }

    // Check if download has expired
    const now = new Date()
    const expiryDate = new Date(download.expiresAt)
    if (now > expiryDate) {
      logDownloadAttempt(token, ipAddress, userAgent, false, 'Token expired')
      return NextResponse.json({
        error: 'Download link has expired'
      }, { status: 410 })
    }

    // Check download limit
    if (download.downloadCount >= download.maxDownloads) {
      logDownloadAttempt(token, ipAddress, userAgent, false, 'Download limit exceeded')
      return NextResponse.json({
        error: 'Download limit exceeded'
      }, { status: 429 })
    }

    // Security check: limit downloads from too many different IP addresses
    const uniqueIPs = new Set([...download.ipAddresses, ipAddress])
    if (uniqueIPs.size > 3) {
      logDownloadAttempt(token, ipAddress, userAgent, false, 'Too many different IP addresses')
      return NextResponse.json({
        error: 'Download link has been used from too many locations'
      }, { status: 403 })
    }

    // In production, this would read the actual file from secure storage
    const mockFileContent = generateMockDigitalProduct(download.productTitle, download.token)
    
    // Update download count
    updateDownloadCount(token, ipAddress)
    
    // Generate secure filename
    const originalFileName = download.filePath.split('/').pop() || 'download.zip'
    const secureFileName = generateSecureFileName(originalFileName, token)
    
    logDownloadAttempt(token, ipAddress, userAgent, true, 'Download successful')

    // Return file with appropriate headers
    return new NextResponse(mockFileContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${secureFileName}"`,
        'Content-Length': mockFileContent.length.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache',
        'X-Robots-Tag': 'noindex, nofollow',
        'X-Download-Token': token.substring(0, 8) + '***' // Masked for logs
      }
    })
  } catch (error) {
    console.error('Digital download error:', error)
    return NextResponse.json({
      error: 'Download failed'
    }, { status: 500 })
  }
}

// GET download info without triggering download (for verification)
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = params
    const ipAddress = getClientIP(request)
    
    if (!token) {
      return NextResponse.json({
        error: 'Token required'
      }, { status: 400 })
    }

    const download = validateToken(token)
    if (!download) {
      return NextResponse.json({
        error: 'Download not found'
      }, { status: 404 })
    }

    // Check if expired
    const now = new Date()
    const expiryDate = new Date(download.expiresAt)
    const isExpired = now > expiryDate

    // Calculate remaining downloads
    const remainingDownloads = Math.max(0, download.maxDownloads - download.downloadCount)

    return NextResponse.json({
      success: true,
      productTitle: download.productTitle,
      downloadCount: download.downloadCount,
      maxDownloads: download.maxDownloads,
      remainingDownloads,
      expiresAt: download.expiresAt,
      isExpired,
      canDownload: !isExpired && remainingDownloads > 0,
      lastDownloadAt: download.lastDownloadAt
    })
  } catch (error) {
    console.error('Download info error:', error)
    return NextResponse.json({
      error: 'Failed to retrieve download info'
    }, { status: 500 })
  }
}

// Generate mock digital product file (ZIP format)
function generateMockDigitalProduct(productTitle: string, token: string): Buffer {
  // This would be the actual product file in production
  // For demonstration, we create a simple ZIP file structure
  
  const fileContent = `
ANOINT Array Digital Product
============================

Product: ${productTitle}
Download Token: ${token.substring(0, 8)}***
Generated: ${new Date().toISOString()}

Thank you for your purchase from ANOINT Array!

This is a mock digital product file. In production, this would contain:
- Audio files (MP3, WAV)
- Video files (MP4)
- PDF guides and manuals
- Additional resources

For support, contact: support@anoint.me

Terms & Conditions:
- This digital product is licensed for personal use only
- Redistribution is prohibited
- No refunds on digital products
- Download expires 7 days after purchase
- Maximum 3 downloads allowed

ANOINT Array - Spiritual Technology & Wellness
https://anoint.me
`

  // Create a simple mock ZIP file structure
  // In production, you would use a proper ZIP library
  const mockZipHeader = Buffer.from([0x50, 0x4B, 0x03, 0x04]) // ZIP signature
  const contentBuffer = Buffer.from(fileContent)
  const mockZipFooter = Buffer.from([0x50, 0x4B, 0x05, 0x06]) // End of central directory
  
  return Buffer.concat([
    mockZipHeader,
    Buffer.alloc(26), // ZIP header fields
    Buffer.from('readme.txt'),
    contentBuffer,
    mockZipFooter,
    Buffer.alloc(18) // End of central directory fields
  ])
}

// Cleanup expired downloads (would be run as a cron job)
export async function DELETE(request: NextRequest) {
  try {
    const now = new Date()
    let cleanedCount = 0
    
    // Remove expired downloads
    for (let i = mockDownloads.length - 1; i >= 0; i--) {
      const download = mockDownloads[i]
      const expiryDate = new Date(download.expiresAt)
      
      if (now > expiryDate) {
        mockDownloads.splice(i, 1)
        cleanedCount++
      }
    }
    
    console.log(`Cleaned up ${cleanedCount} expired digital downloads`)
    
    return NextResponse.json({
      success: true,
      cleanedCount,
      remainingDownloads: mockDownloads.length
    })
  } catch (error) {
    console.error('Download cleanup error:', error)
    return NextResponse.json({
      error: 'Cleanup failed'
    }, { status: 500 })
  }
}