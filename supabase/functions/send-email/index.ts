import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.0'

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// Resend configuration
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const FROM_EMAIL = 'orders@anoint.me'
const SUPPORT_EMAIL = 'support@anoint.me'

interface EmailRequest {
  template: string
  to: string
  data: Record<string, any>
  user_id?: string
}

// Email templates
const EMAIL_TEMPLATES = {
  order_confirmation: {
    subject: (data: any) => `Order Confirmation #${data.order_number} - Anoint Array`,
    html: (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 0; }
        .header { background: linear-gradient(135deg, #9333ea, #7c3aed); color: white; padding: 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .order-details { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
        .order-items { border-collapse: collapse; width: 100%; margin: 20px 0; }
        .order-items th, .order-items td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        .order-items th { background: #f8f9fa; font-weight: 600; }
        .total-row { font-weight: 600; border-top: 2px solid #9333ea; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .address { background: #f8f9fa; border-radius: 6px; padding: 15px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ Anoint Array</h1>
            <p>Thank you for your order!</p>
        </div>
        
        <div class="content">
            <h2>Order Confirmation</h2>
            <p>Hi ${data.customer_name || 'there'},</p>
            <p>We've received your order and it's being processed. Here are your order details:</p>
            
            <div class="order-details">
                <h3>Order #${data.order_number}</h3>
                <p><strong>Order Date:</strong> ${new Date(data.created_at).toLocaleDateString()}</p>
                <p><strong>Payment Method:</strong> ${data.payment_method}</p>
                <p><strong>Status:</strong> ${data.status}</p>
            </div>

            <h3>Items Ordered</h3>
            <table class="order-items">
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map((item: any) => `
                        <tr>
                            <td>${item.title}</td>
                            <td>${item.quantity}</td>
                            <td>$${(item.price / 100).toFixed(2)} CAD</td>
                            <td>$${((item.price * item.quantity) / 100).toFixed(2)} CAD</td>
                        </tr>
                    `).join('')}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3"><strong>Subtotal:</strong></td>
                        <td><strong>$${(data.subtotal / 100).toFixed(2)} CAD</strong></td>
                    </tr>
                    ${data.discount_total > 0 ? `
                    <tr>
                        <td colspan="3"><strong>Discount:</strong></td>
                        <td><strong>-$${(data.discount_total / 100).toFixed(2)} CAD</strong></td>
                    </tr>
                    ` : ''}
                    <tr>
                        <td colspan="3"><strong>Tax:</strong></td>
                        <td><strong>$${(data.tax_total / 100).toFixed(2)} CAD</strong></td>
                    </tr>
                    <tr>
                        <td colspan="3"><strong>Shipping:</strong></td>
                        <td><strong>$${(data.shipping_total / 100).toFixed(2)} CAD</strong></td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3"><strong>Total:</strong></td>
                        <td><strong>$${(data.total / 100).toFixed(2)} CAD</strong></td>
                    </tr>
                </tfoot>
            </table>

            ${data.shipping_address ? `
            <h3>Shipping Address</h3>
            <div class="address">
                ${data.shipping_address.name ? `<strong>${data.shipping_address.name}</strong><br>` : ''}
                ${data.shipping_address.line1}<br>
                ${data.shipping_address.line2 ? `${data.shipping_address.line2}<br>` : ''}
                ${data.shipping_address.city}, ${data.shipping_address.state} ${data.shipping_address.postal_code}<br>
                ${data.shipping_address.country}
            </div>
            ` : ''}

            <p>We'll send you another email with tracking information once your order ships.</p>
            
            <a href="https://anoint.me/dashboard/orders" class="button">View Order Details</a>
        </div>
        
        <div class="footer">
            <p>Questions about your order? Contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} Anoint Array. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  shipping_confirmation: {
    subject: (data: any) => `Your Order #${data.order_number} Has Shipped! - Anoint Array`,
    html: (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Shipping Confirmation</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #059669, #10b981); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .tracking-box { background: #f0f9ff; border: 2px solid #0ea5e9; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📦 Your Order is On Its Way!</h1>
        </div>
        
        <div class="content">
            <h2>Shipping Confirmation</h2>
            <p>Great news! Your order #${data.order_number} has been shipped and is on its way to you.</p>
            
            <div class="tracking-box">
                <h3>Tracking Information</h3>
                <p><strong>Carrier:</strong> ${data.carrier}</p>
                <p><strong>Service:</strong> ${data.service_type}</p>
                <p><strong>Tracking Number:</strong> ${data.tracking_number}</p>
                <p><strong>Estimated Delivery:</strong> ${data.estimated_delivery ? new Date(data.estimated_delivery).toLocaleDateString() : 'TBD'}</p>
                
                ${data.tracking_url ? `<a href="${data.tracking_url}" class="button">Track Your Package</a>` : ''}
            </div>
            
            <p>You can use the tracking number above to monitor your package's progress on the carrier's website.</p>
            
            <p>If you have any questions about your shipment, please contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a>.</p>
        </div>
        
        <div class="footer">
            <p>© ${new Date().getFullYear()} Anoint Array. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  password_reset: {
    subject: () => 'Reset Your Password - Anoint Array',
    html: (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Password Reset</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #9333ea, #7c3aed); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
        .warning { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Password Reset</h1>
        </div>
        
        <div class="content">
            <h2>Reset Your Password</h2>
            <p>You requested a password reset for your Anoint Array account.</p>
            
            <a href="${data.reset_url}" class="button">Reset Password</a>
            
            <div class="warning">
                <p><strong>Security Notice:</strong></p>
                <ul>
                    <li>This link will expire in 24 hours</li>
                    <li>If you didn't request this reset, please ignore this email</li>
                    <li>Never share this link with anyone</li>
                </ul>
            </div>
            
            <p>If the button doesn't work, copy and paste this URL into your browser:</p>
            <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace;">${data.reset_url}</p>
        </div>
        
        <div class="footer">
            <p>If you need help, contact us at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} Anoint Array. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  },

  welcome: {
    subject: () => 'Welcome to Anoint Array! ✨',
    html: (data: any) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to Anoint Array</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background: #f4f4f4; }
        .container { max-width: 600px; margin: 0 auto; background: white; }
        .header { background: linear-gradient(135deg, #9333ea, #7c3aed); color: white; padding: 40px; text-align: center; }
        .content { padding: 30px; }
        .button { display: inline-block; background: #9333ea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 10px; }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
        .feature { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✨ Welcome to Anoint Array</h1>
            <p>Your mystical journey begins now!</p>
        </div>
        
        <div class="content">
            <h2>Welcome, ${data.name || 'Mystic'}!</h2>
            <p>Thank you for joining Anoint Array, where ancient wisdom meets modern design. We're excited to have you as part of our mystical community.</p>
            
            <div class="feature-grid">
                <div class="feature">
                    <h3>🔮 Create Arrays</h3>
                    <p>Design powerful mystical arrays with our intuitive generator</p>
                </div>
                <div class="feature">
                    <h3>📦 Shop Mystical Items</h3>
                    <p>Discover our curated collection of mystical products</p>
                </div>
                <div class="feature">
                    <h3>💎 Premium Content</h3>
                    <p>Access exclusive glyphs and advanced features</p>
                </div>
                <div class="feature">
                    <h3>🌟 Community</h3>
                    <p>Connect with fellow practitioners and share your creations</p>
                </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <a href="https://anoint.me/dashboard" class="button">Explore Your Dashboard</a>
                <a href="https://anoint.me/generator" class="button">Create Your First Array</a>
            </div>
            
            <h3>Getting Started</h3>
            <ol>
                <li>Complete your profile setup</li>
                <li>Explore our glyph library</li>
                <li>Create your first mystical array</li>
                <li>Share your creation with the community</li>
            </ol>
        </div>
        
        <div class="footer">
            <p>Questions? We're here to help at <a href="mailto:${SUPPORT_EMAIL}">${SUPPORT_EMAIL}</a></p>
            <p>© ${new Date().getFullYear()} Anoint Array. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
    `
  }
}

async function sendEmail(template: string, to: string, data: any): Promise<any> {
  const emailTemplate = EMAIL_TEMPLATES[template as keyof typeof EMAIL_TEMPLATES]
  if (!emailTemplate) {
    throw new Error(`Email template '${template}' not found`)
  }

  const subject = emailTemplate.subject(data)
  const html = emailTemplate.html(data)

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${response.status} - ${error}`)
  }

  return await response.json()
}

serve(async (req) => {
  // Enable CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    const { template, to, data, user_id }: EmailRequest = await req.json()

    if (!template || !to) {
      return new Response('Missing required fields: template, to', { status: 400 })
    }

    // Validate email address
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response('Invalid email address', { status: 400 })
    }

    // Send the email
    const result = await sendEmail(template, to, data || {})

    // Log the email send
    await supabase.rpc('log_event', {
      level_param: 'info',
      category_param: 'email',
      message_param: `Email sent: ${template}`,
      user_id_param: user_id || null,
      metadata_param: {
        template,
        to,
        email_id: result.id,
        subject: EMAIL_TEMPLATES[template as keyof typeof EMAIL_TEMPLATES]?.subject(data || {})
      }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        success: true,
        email_id: result.id,
        template,
        to,
        message: 'Email sent successfully'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )

  } catch (error) {
    console.error('Email send error:', error)
    
    // Log the error
    await supabase.rpc('log_event', {
      level_param: 'error',
      category_param: 'email',
      message_param: `Email send error: ${error.message}`,
      metadata_param: { error: error.toString() }
    }).catch(() => {})

    return new Response(
      JSON.stringify({
        success: false,
        error: 'Failed to send email',
        message: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    )
  }
})