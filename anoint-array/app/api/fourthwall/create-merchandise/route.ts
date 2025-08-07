import { NextRequest, NextResponse } from 'next/server'
import { fourthwallClient } from '@/lib/fourthwall'
import { calculateTotalProfit, calculateTotalPrice, STAFF_PICKS } from '@/lib/merchandise'

export async function POST(request: NextRequest) {
  try {
    const { sealArrayImage, sealArrayId, customerEmail } = await request.json()

    if (!sealArrayImage || !sealArrayId) {
      return NextResponse.json(
        { error: 'Missing required fields: sealArrayImage and sealArrayId' },
        { status: 400 }
      )
    }

    // Convert base64 image to buffer
    let imageBuffer: Buffer
    try {
      const base64Data = sealArrayImage.split(',')[1] || sealArrayImage
      imageBuffer = Buffer.from(base64Data, 'base64')
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid image data format' },
        { status: 400 }
      )
    }

    // Validate FourthWall connection
    const isConnected = await fourthwallClient.validateConnection()
    if (!isConnected) {
      return NextResponse.json(
        { 
          error: 'FourthWall integration temporarily unavailable. Please try again later or contact support.',
          code: 'FOURTHWALL_UNAVAILABLE'
        },
        { status: 503 }
      )
    }

    // Create full merchandise experience
    const checkoutSession = await fourthwallClient.createFullMerchandiseExperience(
      imageBuffer,
      sealArrayId,
      customerEmail
    )

    // Calculate totals for response
    const totalProducts = checkoutSession.items.length
    const estimatedShipping = totalProducts > 2 ? 0 : 9.99 // Free shipping over 3 items
    
    return NextResponse.json({
      success: true,
      checkoutSession: {
        id: checkoutSession.id,
        url: checkoutSession.url,
        totalAmount: checkoutSession.totalAmount,
        totalProfit: checkoutSession.totalProfit,
        estimatedShipping,
        productCount: totalProducts
      },
      products: checkoutSession.items.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        productType: item.productType
      })),
      designId: checkoutSession.items[0]?.designId,
      message: `Successfully created ${totalProducts} products with your seal array design`
    })

  } catch (error) {
    console.error('FourthWall merchandise creation error:', error)
    
    // Return specific error messages for different failure types
    if (error instanceof Error) {
      if (error.message.includes('upload')) {
        return NextResponse.json(
          { error: 'Failed to upload your seal array design. Please try again.' },
          { status: 500 }
        )
      } else if (error.message.includes('product')) {
        return NextResponse.json(
          { error: 'Failed to create merchandise products. Please try again.' },
          { status: 500 }
        )
      } else if (error.message.includes('checkout')) {
        return NextResponse.json(
          { error: 'Failed to create checkout session. Please try again.' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json(
      { 
        error: 'Failed to create merchandise. Our team has been notified.',
        details: process.env.NODE_ENV === 'development' ? error : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed. Use POST to create merchandise.' },
    { status: 405 }
  )
}