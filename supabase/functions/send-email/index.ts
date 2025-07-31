import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface OrderItem {
  id: string
  title: string
  price: number
  quantity: number
}

interface ShippingAddress {
  name: string
  address: string
  city: string
  province: string
  postalCode: string
  country: string
}

interface EmailData {
  orderNumber: string
  customerEmail: string
  customerName: string
  items: OrderItem[]
  subtotal: number
  shippingCost: number
  discount: number
  total: number
  shippingAddress: ShippingAddress
  shippingMethod: string
  paymentMethod: string
  orderDate: string
  trackingNumber?: string
}

// Generate HTML email template
function generateOrderReceiptHTML(data: EmailData): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)} CAD`
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation - ANOINT Array</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8f9fa;
        }
        .email-container {
            background-color: white;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #8b5cf6;
        }
        .logo {
            font-size: 32px;
            font-weight: bold;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .order-number {
            font-size: 24px;
            color: #8b5cf6;
            margin-bottom: 5px;
        }
        .thank-you {
            font-size: 18px;
            color: #666;
        }
        .section {
            margin: 25px 0;
            padding: 20px;
            background-color: #f8f9fa;
            border-radius: 8px;
        }
        .section-title {
            font-size: 18px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 15px;
            border-bottom: 1px solid #e9ecef;
            padding-bottom: 10px;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .item-row:last-child {
            border-bottom: none;
        }
        .item-name {
            font-weight: 500;
        }
        .item-details {
            color: #666;
            font-size: 14px;
        }
        .item-price {
            font-weight: bold;
        }
        .totals-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
        }
        .total-final {
            font-size: 20px;
            font-weight: bold;
            color: #8b5cf6;
            border-top: 2px solid #8b5cf6;
            padding-top: 10px;
            margin-top: 10px;
        }
        .shipping-address {
            background-color: white;
            padding: 15px;
            border-radius: 5px;
            border-left: 4px solid #06b6d4;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
        }
        .support-info {
            background-color: #f0f8ff;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #06b6d4;
        }
        .tracking-info {
            background-color: #f0f9ff;
            padding: 15px;
            border-radius: 8px;
            text-align: center;
            border: 2px solid #06b6d4;
        }
        .tracking-number {
            font-family: monospace;
            font-size: 18px;
            font-weight: bold;
            color: #0369a1;
            margin: 10px 0;
        }
        @media (max-width: 600px) {
            body {
                padding: 10px;
            }
            .email-container {
                padding: 20px;
            }
            .item-row {
                flex-direction: column;
                align-items: flex-start;
            }
            .totals-row {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">ANOINT: Array</div>
            <div class="order-number">Order #${data.orderNumber}</div>
            <div class="thank-you">Thank you for your order!</div>
        </div>

        <div class="section">
            <div class="section-title">Order Summary</div>
            ${data.items.map(item => `
                <div class="item-row">
                    <div>
                        <div class="item-name">${item.title}</div>
                        <div class="item-details">Quantity: ${item.quantity} × ${formatCurrency(item.price)}</div>
                    </div>
                    <div class="item-price">${formatCurrency(item.price * item.quantity)}</div>
                </div>
            `).join('')}
            
            <div style="margin-top: 20px;">
                <div class="totals-row">
                    <span>Subtotal:</span>
                    <span>${formatCurrency(data.subtotal)}</span>
                </div>
                ${data.discount > 0 ? `
                <div class="totals-row" style="color: #10b981;">
                    <span>Discount:</span>
                    <span>-${formatCurrency(data.discount)}</span>
                </div>
                ` : ''}
                <div class="totals-row">
                    <span>Shipping (${data.shippingMethod}):</span>
                    <span>${formatCurrency(data.shippingCost)}</span>
                </div>
                <div class="totals-row total-final">
                    <span>Total:</span>
                    <span>${formatCurrency(data.total)}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-title">Shipping Information</div>
            <div class="shipping-address">
                <strong>${data.shippingAddress.name}</strong><br>
                ${data.shippingAddress.address}<br>
                ${data.shippingAddress.city}, ${data.shippingAddress.province} ${data.shippingAddress.postalCode}<br>
                ${data.shippingAddress.country}
            </div>
            <p style="margin-top: 15px;"><strong>Shipping Method:</strong> ${data.shippingMethod}</p>
            <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        </div>

        ${data.trackingNumber ? `
        <div class="tracking-info">
            <div class="section-title" style="margin-bottom: 10px;">📦 Tracking Information</div>
            <p>Your order has been shipped! Track your package with:</p>
            <div class="tracking-number">${data.trackingNumber}</div>
        </div>
        ` : ''}

        <div class="support-info">
            <strong>Need Help?</strong><br>
            If you have any questions about your order, please contact our support team:<br>
            📧 Email: orders@anointarray.com<br>
            📞 Phone: 1-800-ANOINT-1<br>
            🌐 Visit: <a href="https://anointarray.com/support">anointarray.com/support</a>
        </div>

        <div class="footer">
            <p><strong>ANOINT: Array</strong><br>
            Energy healing technology for the modern age</p>
            <p style="font-size: 12px; margin-top: 20px;">
                Order Date: ${new Date(data.orderDate).toLocaleDateString('en-CA', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                })}<br>
                This email was sent to ${data.customerEmail}
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Generate plain text email
function generateOrderReceiptText(data: EmailData): string {
  const formatCurrency = (amount: number) => `$${amount.toFixed(2)} CAD`
  
  return `
ANOINT: Array - Order Confirmation

Order #${data.orderNumber}
Thank you for your order, ${data.customerName}!

ORDER SUMMARY:
${data.items.map(item => 
  `${item.title} - Qty: ${item.quantity} × ${formatCurrency(item.price)} = ${formatCurrency(item.price * item.quantity)}`
).join('\n')}

Subtotal: ${formatCurrency(data.subtotal)}
${data.discount > 0 ? `Discount: -${formatCurrency(data.discount)}\n` : ''}Shipping (${data.shippingMethod}): ${formatCurrency(data.shippingCost)}
Total: ${formatCurrency(data.total)}

SHIPPING INFORMATION:
${data.shippingAddress.name}
${data.shippingAddress.address}
${data.shippingAddress.city}, ${data.shippingAddress.province} ${data.shippingAddress.postalCode}
${data.shippingAddress.country}

Shipping Method: ${data.shippingMethod}
Payment Method: ${data.paymentMethod}

${data.trackingNumber ? `TRACKING INFORMATION:
Your order has been shipped! Track your package with: ${data.trackingNumber}

` : ''}NEED HELP?
Email: orders@anointarray.com
Phone: 1-800-ANOINT-1
Website: https://anointarray.com/support

Order Date: ${new Date(data.orderDate).toLocaleDateString('en-CA')}

ANOINT: Array
Energy healing technology for the modern age
  `
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { 
          status: 405,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const emailData: EmailData = await req.json()

    // Validate required fields
    if (!emailData.orderNumber || !emailData.customerEmail || !emailData.items) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not found')
    }

    // Prepare email content
    const htmlContent = generateOrderReceiptHTML(emailData)
    const textContent = generateOrderReceiptText(emailData)

    // Send email via Resend
    const emailPayload = {
      from: 'ANOINT Array <orders@anointarray.com>',
      to: [emailData.customerEmail],
      subject: `Order Confirmation #${emailData.orderNumber} - ANOINT Array`,
      html: htmlContent,
      text: textContent,
      reply_to: 'support@anointarray.com'
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Resend API Error:', response.status, errorData)
      throw new Error(`Failed to send email: ${response.status}`)
    }

    const result = await response.json()
    console.log('Email sent successfully:', result.id)

    // Also send a copy to the admin (optional)
    const adminEmailPayload = {
      from: 'ANOINT Array <orders@anointarray.com>',
      to: ['admin@anointarray.com'], // Replace with actual admin email
      subject: `New Order #${emailData.orderNumber} - ${emailData.customerEmail}`,
      html: `
        <h2>New Order Received</h2>
        <p><strong>Order:</strong> #${emailData.orderNumber}</p>
        <p><strong>Customer:</strong> ${emailData.customerEmail}</p>
        <p><strong>Total:</strong> $${emailData.total.toFixed(2)} CAD</p>
        <p><strong>Items:</strong> ${emailData.items.length}</p>
        <p><strong>Payment:</strong> ${emailData.paymentMethod}</p>
        <p><strong>Shipping:</strong> ${emailData.shippingMethod}</p>
        <hr>
        <p>Full order details have been sent to the customer.</p>
      `,
      text: `New Order #${emailData.orderNumber} from ${emailData.customerEmail} - Total: $${emailData.total.toFixed(2)} CAD`
    }

    // Send admin notification (don't wait for it)
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminEmailPayload),
    }).catch(error => console.error('Failed to send admin notification:', error))

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: result.id,
        message: 'Order confirmation email sent successfully'
      }),
      { 
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error in send-email function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send email',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})