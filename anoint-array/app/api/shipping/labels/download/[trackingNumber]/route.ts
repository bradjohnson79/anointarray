import { NextRequest, NextResponse } from 'next/server'

// Shipping Label Download Endpoint
// Serves generated 4x6 thermal shipping labels in PDF format

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ trackingNumber: string }> }
) {
  const params = await context.params
  try {
    const { trackingNumber } = params
    
    if (!trackingNumber) {
      return NextResponse.json({
        error: 'Tracking number required'
      }, { status: 400 })
    }

    // Validate tracking number format
    const isCanadaPost = /^CP\d{9}$/.test(trackingNumber)
    const isUPS = /^1Z999AA\d{9}$/.test(trackingNumber)
    
    if (!isCanadaPost && !isUPS) {
      return NextResponse.json({
        error: 'Invalid tracking number format'
      }, { status: 400 })
    }

    // In production, this would retrieve the actual label from storage
    // For now, we'll generate a mock PDF label
    const carrier = isCanadaPost ? 'Canada Post' : 'UPS'
    const pdfContent = generateMockShippingLabel(trackingNumber, carrier)

    // Return the PDF with appropriate headers
    return new NextResponse(pdfContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="shipping-label-${trackingNumber}.pdf"`,
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'Expires': '0',
        'Pragma': 'no-cache'
      }
    })
  } catch (error) {
    console.error('Label download error:', error)
    return NextResponse.json({
      error: 'Failed to retrieve shipping label'
    }, { status: 500 })
  }
}

// Generate mock PDF shipping label (4x6 thermal format)
function generateMockShippingLabel(trackingNumber: string, carrier: string): Buffer {
  // This is a mock PDF. In production, you would:
  // 1. Retrieve the actual label from Canada Post/UPS APIs
  // 2. Or generate a PDF using a library like PDFKit
  // 3. Store labels securely and serve them

  const mockPdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj

2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj

3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 288 432]
/Contents 4 0 R
/Resources <<
  /Font <<
    /F1 5 0 R
  >>
>>
>>
endobj

4 0 obj
<<
/Length 800
>>
stream
BT
/F1 12 Tf
20 400 Td
(ANOINT Array Shipping Label) Tj
0 -20 Td
(${carrier}) Tj
0 -30 Td
(Tracking: ${trackingNumber}) Tj
0 -30 Td
(FROM:) Tj
0 -15 Td
(ANOINT Array Inc.) Tj
0 -15 Td
(123 Spiritual Street, Suite 100) Tj
0 -15 Td
(Toronto, ON M5H 1T1) Tj
0 -30 Td
(TO:) Tj
0 -15 Td
(Customer Name) Tj
0 -15 Td
(Customer Address) Tj
0 -15 Td
(City, Province Postal) Tj
0 -30 Td
(Service: Express) Tj
0 -15 Td
(Weight: 2.5 kg) Tj
0 -15 Td
(Date: ${new Date().toISOString().split('T')[0]}) Tj
ET
endstream
endobj

5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj

xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000274 00000 n 
0000001126 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
1183
%%EOF`

  return Buffer.from(mockPdfContent)
}

// Alternative endpoint for base64 encoded labels (for browser display)
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ trackingNumber: string }> }
) {
  const params = await context.params
  try {
    const { trackingNumber } = params
    
    if (!trackingNumber) {
      return NextResponse.json({
        error: 'Tracking number required'
      }, { status: 400 })
    }

    // Generate base64 encoded label for display
    const carrier = trackingNumber.startsWith('CP') ? 'Canada Post' : 'UPS'
    const pdfContent = generateMockShippingLabel(trackingNumber, carrier)
    const base64Content = pdfContent.toString('base64')

    return NextResponse.json({
      success: true,
      trackingNumber,
      carrier,
      labelBase64: base64Content,
      mimeType: 'application/pdf'
    })
  } catch (error) {
    console.error('Label base64 generation error:', error)
    return NextResponse.json({
      error: 'Failed to generate label'
    }, { status: 500 })
  }
}