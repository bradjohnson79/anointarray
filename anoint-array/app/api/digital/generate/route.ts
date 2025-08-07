import { NextRequest, NextResponse } from 'next/server'
import { createHash, randomBytes } from 'crypto'

// Digital Download Link Generation API
// Creates secure, time-limited download links for digital products

interface GenerateDownloadRequest {
  orderId: string
  orderItems: Array<{
    productId: string
    productTitle: string
    sku: string
    digitalFile: string
    quantity: number
  }>
  customerEmail: string
  customerName: string
  expiryHours?: number // Default 168 (7 days)
  maxDownloads?: number // Default 3
}

interface DownloadLink {
  id: string
  productId: string
  productTitle: string
  url: string
  token: string
  expiresAt: string
  maxDownloads: number
  createdAt: string
}

interface GenerateDownloadResponse {
  success: boolean
  orderId: string
  downloadLinks: DownloadLink[]
  expiryDate: string
  error?: string
}

// Generate cryptographically secure token
function generateSecureToken(): string {
  return randomBytes(32).toString('hex')
}

// Generate unique download ID
function generateDownloadId(): string {
  const timestamp = Date.now().toString(36)
  const random = randomBytes(4).toString('hex')
  return `dl_${timestamp}_${random}`
}

// Create secure download URL
function createDownloadUrl(token: string, baseUrl: string): string {
  return `${baseUrl}/api/digital/download/${token}`
}

// Hash customer email for security
function hashCustomerEmail(email: string, salt: string): string {
  return createHash('sha256').update(email + salt).digest('hex')
}

// Validate digital product file exists (mock function)
function validateDigitalFile(filePath: string): boolean {
  // In production, this would check if the file exists in secure storage
  const validFiles = [
    '/digital/products/meditation-frequency-pack.zip',
    '/digital/products/astral-projection-course.zip',
    '/digital/products/moon-calendar-2025.zip',
    '/digital/products/tarot-reading-guide.zip',
    '/digital/products/crystal-healing-manual.zip'
  ]
  
  return validFiles.includes(filePath)
}

// Send download email to customer (mock function)
async function sendDownloadEmail(
  customerEmail: string,
  customerName: string,
  downloadLinks: DownloadLink[],
  orderId: string
): Promise<boolean> {
  try {
    // In production, this would use a real email service like SendGrid, Mailgun, etc.
    const emailData = {
      to: customerEmail,
      from: 'noreply@anoint.me',
      subject: `Your Digital Products from ANOINT Array - Order ${orderId}`,
      template: 'digital-download',
      templateData: {
        customerName,
        orderId,
        downloadLinks: downloadLinks.map(link => ({
          productTitle: link.productTitle,
          downloadUrl: link.url,
          expiresAt: new Date(link.expiresAt).toLocaleDateString(),
          maxDownloads: link.maxDownloads
        })),
        expiryDate: new Date(downloadLinks[0].expiresAt).toLocaleDateString(),
        supportEmail: 'support@anoint.me',
        websiteUrl: 'https://anoint.me'
      }
    }
    
    console.log('Digital download email would be sent:', emailData)
    
    // Mock successful email send
    return true
  } catch (error) {
    console.error('Failed to send download email:', error)
    return false
  }
}

// Log download link generation for audit
function logDownloadGeneration(
  orderId: string,
  customerEmail: string,
  productCount: number,
  expiryDate: string
) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event: 'digital_download_generated',
    orderId,
    customerEmail: hashCustomerEmail(customerEmail, 'audit_salt'),
    productCount,
    expiryDate,
    source: 'admin_panel'
  }
  
  // In production, this would write to a proper audit log
  console.log('Digital download generation:', logEntry)
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateDownloadRequest = await request.json()
    
    // Validate required fields
    if (!body.orderId || !body.orderItems || !body.customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: orderId, orderItems, customerEmail'
      }, { status: 400 })
    }

    // Validate order items
    if (!Array.isArray(body.orderItems) || body.orderItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No digital products found in order'
      }, { status: 400 })
    }

    // Filter for digital products only
    const digitalItems = body.orderItems.filter(item => item.digitalFile)
    
    if (digitalItems.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No digital products found'
      }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.customerEmail)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid email address'
      }, { status: 400 })
    }

    // Set defaults
    const expiryHours = body.expiryHours || 168 // 7 days
    const maxDownloads = body.maxDownloads || 3
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL || ''
    
    // Calculate expiry date
    const expiryDate = new Date(Date.now() + (expiryHours * 60 * 60 * 1000))
    
    const downloadLinks: DownloadLink[] = []
    const errors: string[] = []

    // Generate download links for each digital product
    for (const item of digitalItems) {
      try {
        // Validate digital file exists
        if (!validateDigitalFile(item.digitalFile)) {
          errors.push(`Digital file not found for product: ${item.productTitle}`)
          continue
        }

        // Generate multiple links if quantity > 1 (for gifting scenarios)
        for (let i = 0; i < item.quantity; i++) {
          const token = generateSecureToken()
          const downloadId = generateDownloadId()
          
          const downloadLink: DownloadLink = {
            id: downloadId,
            productId: item.productId,
            productTitle: item.productTitle,
            url: createDownloadUrl(token, baseUrl),
            token,
            expiresAt: expiryDate.toISOString(),
            maxDownloads,
            createdAt: new Date().toISOString()
          }
          
          downloadLinks.push(downloadLink)
        }
      } catch (error) {
        console.error(`Error generating download for ${item.productTitle}:`, error)
        errors.push(`Failed to generate download for: ${item.productTitle}`)
      }
    }

    // Check if any downloads were generated
    if (downloadLinks.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Failed to generate any download links',
        details: errors
      }, { status: 500 })
    }

    // In production, save download links to database
    // For now, we'll just log them
    console.log(`Generated ${downloadLinks.length} download links for order ${body.orderId}`)

    // Send email to customer
    const emailSent = await sendDownloadEmail(
      body.customerEmail,
      body.customerName || 'Customer',
      downloadLinks,
      body.orderId
    )

    if (!emailSent) {
      console.warn(`Failed to send download email for order ${body.orderId}`)
    }

    // Log the generation for audit purposes
    logDownloadGeneration(
      body.orderId,
      body.customerEmail,
      downloadLinks.length,
      expiryDate.toISOString()
    )

    const response: GenerateDownloadResponse = {
      success: true,
      orderId: body.orderId,
      downloadLinks: downloadLinks.map(link => ({
        ...link,
        token: link.token.substring(0, 8) + '***' // Mask token in response
      })),
      expiryDate: expiryDate.toISOString()
    }

    // Include warnings if some products failed
    if (errors.length > 0) {
      response.error = `Some products failed: ${errors.join(', ')}`
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Download generation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// GET endpoint to check download link status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const customerEmail = searchParams.get('customerEmail')
    
    if (!orderId && !customerEmail) {
      return NextResponse.json({
        success: false,
        error: 'Order ID or customer email required'
      }, { status: 400 })
    }

    // Mock response - in production this would query the database
    const mockDownloadStatus = {
      success: true,
      orderId: orderId || 'order_123',
      downloadLinks: [
        {
          id: 'dl_123456',
          productTitle: 'Meditation Frequency Generator Pack',
          downloadCount: 1,
          maxDownloads: 3,
          expiresAt: '2025-08-08T10:30:00Z',
          isExpired: false,
          canDownload: true,
          lastDownloadAt: '2025-08-02T14:30:00Z'
        }
      ],
      totalProducts: 1,
      emailSent: true,
      generatedAt: '2025-08-01T10:30:00Z'
    }

    return NextResponse.json(mockDownloadStatus)
  } catch (error) {
    console.error('Download status check error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to check download status'
    }, { status: 500 })
  }
}

// DELETE endpoint to revoke download links (admin only)
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')
    const token = searchParams.get('token')
    
    if (!orderId && !token) {
      return NextResponse.json({
        success: false,
        error: 'Order ID or token required'
      }, { status: 400 })
    }

    // In production, this would revoke the download links in the database
    console.log(`Revoking download links for ${orderId ? `order ${orderId}` : `token ${token}`}`)

    return NextResponse.json({
      success: true,
      message: 'Download links revoked successfully',
      revokedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Download revocation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to revoke download links'
    }, { status: 500 })
  }
}