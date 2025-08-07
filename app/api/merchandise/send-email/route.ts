import { NextResponse } from 'next/server'

interface CartItem {
  productId: string
  quantity: number
  selectedSize?: string
  selectedColor?: string
}

interface EmailRequest {
  type: 'order_confirmation' | 'receipt'
  customerEmail: string
  customerName: string
  orderReference: string
  cartItems: CartItem[]
  totalAmount: number
  paymentMethod: string
  sealArrayImage?: string
}

// Email templates
const getOrderConfirmationTemplate = (data: EmailRequest) => {
  const itemsList = data.cartItems.map(item => {
    const product = require('@/lib/merchandise').MERCHANDISE_CATALOG[item.productId]
    if (!product) return ''
    
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">
          <strong>${product.name}</strong><br>
          ${item.selectedSize ? `Size: ${item.selectedSize}` : ''}
          ${item.selectedSize && item.selectedColor ? ' • ' : ''}
          ${item.selectedColor ? `Color: ${item.selectedColor}` : ''}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">
          ${item.quantity}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">
          $${(product.sellingPrice * item.quantity).toFixed(2)}
        </td>
      </tr>
    `
  }).join('')

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation - ANOINT Array</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; background: #f9fafb; }
        .order-box { background: white; border: 2px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        .total-row { background: #f3f4f6; font-weight: bold; }
        .footer { text-align: center; padding: 20px; font-size: 14px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🎯 Order Confirmed!</h1>
        <p>Thank you for your ANOINT Array merchandise order</p>
      </div>
      
      <div class="content">
        <p>Dear ${data.customerName},</p>
        
        <p>We've received your order and are excited to create your custom merchandise with your unique seal array design!</p>
        
        <div class="order-box">
          <h3>Order Details</h3>
          <p><strong>Order Reference:</strong> ${data.orderReference}</p>
          <p><strong>Payment Method:</strong> ${data.paymentMethod.toUpperCase()}</p>
          <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
          
          <table style="margin-top: 20px;">
            <thead>
              <tr style="background: #f3f4f6;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsList}
              <tr class="total-row">
                <td colspan="2" style="padding: 12px; text-align: right;">
                  <strong>Order Total:</strong>
                </td>
                <td style="padding: 12px; text-align: right;">
                  <strong>$${data.totalAmount.toFixed(2)}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        
        <div class="order-box">
          <h3>What happens next?</h3>
          <ol>
            <li><strong>Design Application:</strong> Your custom seal array will be applied to each product</li>
            <li><strong>Quality Check:</strong> Each item is reviewed before printing</li>
            <li><strong>Printing & Production:</strong> 2-3 business days</li>
            <li><strong>Shipping:</strong> 3-5 business days via standard delivery</li>
            <li><strong>Tracking:</strong> You'll receive tracking information via email</li>
          </ol>
        </div>
        
        <p>If you have any questions about your order, please reply to this email or contact our support team.</p>
        
        <p>Thank you for choosing ANOINT Array!</p>
        
        <p>Best regards,<br>
        The ANOINT Team</p>
      </div>
      
      <div class="footer">
        <p>© 2024 ANOINT Array. All rights reserved.</p>
        <p>This is an automated message. Please do not reply directly to this email.</p>
      </div>
    </body>
    </html>
  `
}

const getReceiptTemplate = (data: EmailRequest) => {
  return getOrderConfirmationTemplate(data) // Same template for now, could be customized
}

// Mock email sending function (replace with actual email service)
async function sendEmail(to: string, subject: string, htmlContent: string) {
  // In a real implementation, this would use services like:
  // - SendGrid
  // - Amazon SES 
  // - Mailgun
  // - Nodemailer with SMTP
  
  console.log(`[EMAIL] To: ${to}`)
  console.log(`[EMAIL] Subject: ${subject}`)
  console.log(`[EMAIL] Content length: ${htmlContent.length} characters`)
  
  // Simulate email sending delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  // For now, always return success
  return { success: true, messageId: `mock_${Date.now()}` }
}

export async function POST(request: Request) {
  try {
    const emailData = await request.json() as EmailRequest

    // Validate required fields
    if (!emailData.type || !emailData.customerEmail || !emailData.orderReference) {
      return NextResponse.json(
        { success: false, error: 'Missing required email data' },
        { status: 400 }
      )
    }

    if (!emailData.cartItems || emailData.cartItems.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No items in order' },
        { status: 400 }
      )
    }

    let subject: string
    let htmlContent: string

    // Generate email based on type
    switch (emailData.type) {
      case 'order_confirmation':
        subject = `Order Confirmation - ${emailData.orderReference} - ANOINT Array`
        htmlContent = getOrderConfirmationTemplate(emailData)
        break
      case 'receipt':
        subject = `Payment Receipt - ${emailData.orderReference} - ANOINT Array`
        htmlContent = getReceiptTemplate(emailData)
        break
      default:
        return NextResponse.json(
          { success: false, error: 'Invalid email type' },
          { status: 400 }
        )
    }

    // Send email
    const emailResult = await sendEmail(emailData.customerEmail, subject, htmlContent)

    if (!emailResult.success) {
      return NextResponse.json(
        { success: false, error: 'Failed to send email' },
        { status: 500 }
      )
    }

    // In a real implementation, you might also:
    // - Store email log in database
    // - Send copy to admin
    // - Track email opens/clicks
    // - Handle email bounces

    return NextResponse.json({
      success: true,
      messageId: emailResult.messageId,
      emailType: emailData.type,
      message: 'Email sent successfully'
    })

  } catch (error) {
    console.error('Email sending failed:', error)
    return NextResponse.json(
      { success: false, error: 'Email processing failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check email status
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const messageId = searchParams.get('messageId')
  
  if (!messageId) {
    return NextResponse.json(
      { success: false, error: 'Message ID required' },
      { status: 400 }
    )
  }

  // In a real implementation, this would check email delivery status
  return NextResponse.json({
    success: true,
    status: 'delivered', // delivered, pending, failed, bounced
    messageId,
    deliveredAt: new Date().toISOString()
  })
}