import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface VipConfirmationData {
  name: string
  email: string
}

// Generate VIP confirmation email HTML
function generateVipConfirmationHTML(data: VipConfirmationData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to VIP Access - ANOINT Array</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #e5e7eb;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background: linear-gradient(135deg, #0f0f23 0%, #1a1a3e 50%, #0f0f23 100%);
        }
        .email-container {
            background: rgba(17, 24, 39, 0.8);
            border-radius: 20px;
            padding: 40px;
            border: 1px solid rgba(139, 92, 246, 0.3);
            backdrop-filter: blur(10px);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #8b5cf6;
        }
        .logo {
            font-size: 36px;
            font-weight: bold;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .vip-badge {
            display: inline-flex;
            align-items: center;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
            color: white;
            padding: 8px 16px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 20px;
        }
        .content {
            font-size: 16px;
            line-height: 1.8;
            margin-bottom: 30px;
        }
        .highlight {
            color: #06b6d4;
            font-weight: 600;
        }
        .benefits {
            background: rgba(139, 92, 246, 0.1);
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #8b5cf6;
            margin: 20px 0;
        }
        .benefits h3 {
            color: #8b5cf6;
            margin-bottom: 15px;
            font-size: 18px;
        }
        .benefits ul {
            list-style: none;
            padding: 0;
        }
        .benefits li {
            padding: 8px 0;
            position: relative;
            padding-left: 25px;
        }
        .benefits li::before {
            content: "✨";
            position: absolute;
            left: 0;
            color: #06b6d4;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #374151;
            color: #9ca3af;
            font-size: 14px;
        }
        .social-links {
            margin: 20px 0;
        }
        .social-links a {
            color: #8b5cf6;
            text-decoration: none;
            margin: 0 10px;
        }
        @media (max-width: 600px) {
            body { padding: 10px; }
            .email-container { padding: 20px; }
            .logo { font-size: 28px; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">ANOINT: Array</div>
            <div class="vip-badge">
                👑 VIP Access Granted
            </div>
        </div>

        <div class="content">
            <h2 style="color: #8b5cf6; margin-bottom: 20px;">Welcome to VIP Access, ${data.name}!</h2>
            
            <p>Thank you for joining our exclusive VIP waitlist for the <span class="highlight">ANOINT Bio-Scalar Vest</span>. You're now part of an elite group of early adopters who will get first access to this revolutionary wearable energy technology.</p>
            
            <p>As a VIP member, you'll be among the first to know about our development progress, breakthrough moments, and testing opportunities. This isn't just a product launch—it's the beginning of a new era in wearable scalar energy technology.</p>

            <div class="benefits">
                <h3>Your VIP Benefits Include:</h3>
                <ul>
                    <li>Exclusive behind-the-scenes development updates</li>
                    <li>First opportunity to participate in beta testing</li>
                    <li>Special early-bird pricing when we launch</li>
                    <li>Direct line to our development team for feedback</li>
                    <li>Access to VIP-only webinars and Q&A sessions</li>
                </ul>
            </div>

            <p>We're currently in the advanced prototype phase, fine-tuning the scalar field modulation patterns and optimizing the copper coil arrays. Our latest tests have shown remarkable results in cellular repair support and biofield alignment.</p>

            <p><strong>What's Next?</strong> Keep an eye on your inbox over the coming weeks. We'll be sharing exclusive content, development milestones, and opportunities to get involved in the testing process.</p>

            <p>Once again, welcome to the VIP family. You're not just early adopters—you're pioneers in the scalar energy revolution.</p>

            <p style="margin-top: 30px;">
                <em>With quantum gratitude,</em><br>
                <strong>The ANOINT Array Team</strong>
            </p>
        </div>

        <div class="footer">
            <div class="social-links">
                <a href="https://anointarray.com">Visit Our Website</a> |
                <a href="https://anointarray.com/about">Learn More</a> |
                <a href="https://anointarray.com/vip-products">VIP Portal</a>
            </div>
            
            <p>
                <strong>ANOINT: Array</strong><br>
                Pioneering Scalar Energy Technology
            </p>
            
            <p style="font-size: 12px; margin-top: 20px;">
                You're receiving this email because you signed up for VIP access to the ANOINT Bio-Scalar Vest.<br>
                If you no longer wish to receive these updates, you can unsubscribe at any time.<br>
                Email sent to: ${data.email}
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Generate plain text version
function generateVipConfirmationText(data: VipConfirmationData): string {
  return `
ANOINT: Array - VIP Access Confirmed

Welcome to VIP Access, ${data.name}!

Thank you for joining our exclusive VIP waitlist for the ANOINT Bio-Scalar Vest. You're now part of an elite group of early adopters who will get first access to this revolutionary wearable energy technology.

VIP BENEFITS:
- Exclusive behind-the-scenes development updates
- First opportunity to participate in beta testing  
- Special early-bird pricing when we launch
- Direct line to our development team for feedback
- Access to VIP-only webinars and Q&A sessions

WHAT'S NEXT:
Keep an eye on your inbox over the coming weeks. We'll be sharing exclusive content, development milestones, and opportunities to get involved in the testing process.

Welcome to the VIP family. You're not just early adopters—you're pioneers in the scalar energy revolution.

With quantum gratitude,
The ANOINT Array Team

---
ANOINT: Array
Pioneering Scalar Energy Technology
Website: https://anointarray.com
VIP Portal: https://anointarray.com/vip-products

You're receiving this email because you signed up for VIP access to the ANOINT Bio-Scalar Vest.
Email sent to: ${data.email}
  `
}

serve(async (req) => {
  // Handle CORS with restricted origins
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin')
    const allowedOrigins = ['https://anointarray.com', 'https://www.anointarray.com', 'http://localhost:5173']
    
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': allowedOrigins.includes(origin || '') ? origin! : 'null',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Max-Age': '86400'
      },
    })
  }

  // Security: Validate request method
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    const vipData: VipConfirmationData = await req.json()

    // Validate required fields
    if (!vipData.name || !vipData.email) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured - skipping email')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email service not configured' 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare email content
    const htmlContent = generateVipConfirmationHTML(vipData)
    const textContent = generateVipConfirmationText(vipData)

    // Send confirmation email via Resend
    const emailPayload = {
      from: 'ANOINT Array VIP <vip@anointarray.com>',
      to: [vipData.email],
      subject: `👑 Welcome to VIP Access - ANOINT Bio-Scalar Vest`,
      html: htmlContent,
      text: textContent,
      reply_to: 'vip@anointarray.com',
      tags: [
        { name: 'category', value: 'vip-confirmation' },
        { name: 'product', value: 'bio-scalar-vest' }
      ]
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
      throw new Error(`Failed to send VIP confirmation email: ${response.status}`)
    }

    const result = await response.json()
    console.log('VIP confirmation email sent successfully:', result.id)

    // Optional: Send notification to admin
    const adminEmailPayload = {
      from: 'ANOINT Array VIP <vip@anointarray.com>',
      to: ['admin@anointarray.com'], // Replace with actual admin email
      subject: `🎯 New VIP Signup: ${vipData.email}`,
      html: `
        <h2>New VIP Waitlist Signup</h2>
        <p><strong>Name:</strong> ${vipData.name}</p>
        <p><strong>Email:</strong> ${vipData.email}</p>
        <p><strong>Product:</strong> ANOINT Bio-Scalar Vest</p>
        <p><strong>Signup Time:</strong> ${new Date().toISOString()}</p>
        <hr>
        <p>Confirmation email has been sent to the user.</p>
        <p><a href="https://anointarray.com/admin/vip-subscribers">View All VIP Subscribers</a></p>
      `,
      text: `New VIP Signup: ${vipData.name} (${vipData.email}) for ANOINT Bio-Scalar Vest`
    }

    // Send admin notification (don't wait for it)
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(adminEmailPayload),
    }).catch(error => console.error('Failed to send admin VIP notification:', error))

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: result.id,
        message: 'VIP confirmation email sent successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-vip-confirmation function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send VIP confirmation email',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})