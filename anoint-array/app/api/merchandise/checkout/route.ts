import { NextResponse } from 'next/server'

interface CartItem {
  productId: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface CheckoutRequest {
  cartItems: CartItem[]
  sealArrayImage: string
  customerEmail?: string
}

export async function POST(request: Request) {
  try {
    let body: CheckoutRequest
    
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }
    
    const { cartItems, sealArrayImage, customerEmail } = body

    if (!cartItems || cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in cart' },
        { status: 400 }
      )
    }

    if (!sealArrayImage) {
      return NextResponse.json(
        { success: false, error: 'No seal array image provided' },
        { status: 400 }
      )
    }

    // For now, we'll create a FourthWall store URL
    // In a full implementation, this would:
    // 1. Upload the seal array image to FourthWall
    // 2. Create a custom product collection with the image
    // 3. Generate a checkout URL with the selected products
    
    // Construct FourthWall store URL with parameters
    const baseUrl = process.env.FOURTHWALL_SHOP_URL || 'https://fourthwall.com/shop/anoint-array'
    const params = new URLSearchParams()
    
    // Add cart items as URL parameters
    cartItems.forEach((item, index) => {
      params.append(`item_${index}`, item.productId)
      params.append(`quantity_${index}`, item.quantity.toString())
      if (item.selectedSize) params.append(`size_${index}`, item.selectedSize)
      if (item.selectedColor) params.append(`color_${index}`, item.selectedColor)
    })
    
    // Add seal array reference
    params.append('custom_design', 'user_upload')
    params.append('design_ref', Date.now().toString()) // Temporary reference
    
    // Add customer email if provided
    if (customerEmail) {
      params.append('customer_email', customerEmail)
    }

    const checkoutUrl = `${baseUrl}?${params.toString()}`

    // In a real implementation, you would also:
    // - Store the order in your database
    // - Send the design to FourthWall's API
    // - Set up webhooks for order completion
    // - Handle payment gateway integration

    return NextResponse.json({
      success: true,
      checkoutUrl,
      orderReference: `ANOINT-${Date.now()}`,
      message: 'Checkout URL generated successfully'
    })

  } catch (error) {
    console.error('Checkout failed:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process checkout' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve order status (for webhooks later)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orderRef = searchParams.get('orderRef')
  
  if (!orderRef) {
    return NextResponse.json(
      { success: false, error: 'Order reference required' },
      { status: 400 }
    )
  }

  // In a real implementation, this would query your database
  // for the order status and return it
  
  return NextResponse.json({
    success: true,
    order: {
      reference: orderRef,
      status: 'pending', // pending, processing, completed, cancelled
      items: [],
      total: 0,
      createdAt: new Date().toISOString()
    }
  })
}