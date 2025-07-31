import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface ContactFormData {
  fullName: string
  email: string
  subject: string
  message: string
  userAgent?: string
  timestamp?: string
}

// Generate contact message email HTML
function generateContactEmailHTML(data: ContactFormData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission - ANOINT Array</title>
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
            background: white;
            border-radius: 12px;
            padding: 30px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            border: 1px solid #e1e5e9;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #8b5cf6;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #8b5cf6;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #6b7280;
            font-size: 16px;
        }
        .content {
            margin-bottom: 30px;
        }
        .field-group {
            margin-bottom: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #8b5cf6;
        }
        .field-label {
            font-weight: 600;
            color: #374151;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 8px;
        }
        .field-value {
            color: #1f2937;
            font-size: 16px;
            word-wrap: break-word;
        }
        .message-content {
            background-color: #f3f4f6;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #06b6d4;
            font-style: italic;
            line-height: 1.7;
        }
        .metadata {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
        }
        .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #9ca3af;
            font-size: 14px;
        }
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #8b5cf6, #06b6d4);
            color: white;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            margin: 20px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <div class="logo">ANOINT: Array</div>
            <div class="subtitle">New Contact Form Submission</div>
        </div>

        <div class="content">
            <p>You have received a new message through the ANOINT Array contact form:</p>
            
            <div class="field-group">
                <div class="field-label">Full Name</div>
                <div class="field-value">${data.fullName}</div>
            </div>
            
            <div class="field-group">
                <div class="field-label">Email Address</div>
                <div class="field-value">
                    <a href="mailto:${data.email}" style="color: #8b5cf6; text-decoration: none;">
                        ${data.email}
                    </a>
                </div>
            </div>
            
            <div class="field-group">
                <div class="field-label">Subject</div>
                <div class="field-value">${data.subject}</div>
            </div>
            
            <div class="field-group">
                <div class="field-label">Message</div>
                <div class="message-content">
                    ${data.message.replace(/\n/g, '<br>')}
                </div>
            </div>
            
            <div style="text-align: center;">
                <a href="mailto:${data.email}?subject=Re: ${encodeURIComponent(data.subject)}" class="cta-button">
                    Reply to ${data.fullName}
                </a>
            </div>
        </div>
        
        <div class="metadata">
            <p><strong>Submission Details:</strong></p>
            <p>📅 <strong>Received:</strong> ${new Date(data.timestamp || new Date()).toLocaleString()}</p>
            <p>🌐 <strong>User Agent:</strong> ${data.userAgent || 'Not provided'}</p>
            <p>📧 <strong>Reply To:</strong> ${data.email}</p>
        </div>

        <div class="footer">
            <p>
                <strong>ANOINT: Array Contact System</strong><br>
                This message was sent from the contact form at anointarray.com
            </p>
        </div>
    </div>
</body>
</html>
  `
}

// Generate plain text version
function generateContactEmailText(data: ContactFormData): string {
  return `
ANOINT: Array - New Contact Form Submission

You have received a new message through the ANOINT Array contact form:

CONTACT DETAILS:
Name: ${data.fullName}
Email: ${data.email}
Subject: ${data.subject}

MESSAGE:
${data.message}

SUBMISSION DETAILS:
Received: ${new Date(data.timestamp || new Date()).toLocaleString()}
User Agent: ${data.userAgent || 'Not provided'}

To reply, simply respond to this email - it will go directly to ${data.email}.

---
ANOINT: Array Contact System
This message was sent from the contact form at anointarray.com
  `
}

serve(async (req) => {
  // Handle CORS
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

  // Only allow POST requests
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
    const contactData: ContactFormData = await req.json()

    // Validate required fields
    if (!contactData.fullName || !contactData.email || !contactData.message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: fullName, email, message' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    if (!emailRegex.test(contactData.email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Basic spam protection - check for common spam patterns
    const spamKeywords = ['viagra', 'casino', 'lottery', 'winner', 'urgent', 'click here now']
    const messageContent = contactData.message.toLowerCase()
    const hasSpam = spamKeywords.some(keyword => messageContent.includes(keyword))
    
    if (hasSpam) {
      console.log('Potential spam detected:', contactData.email)
      // Still return success to not reveal spam detection
      return new Response(
        JSON.stringify({ success: true, message: 'Message received' }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Check for Resend API key
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not configured - contact form will not send emails')
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Contact form received (email service not configured)' 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Prepare email content
    const htmlContent = generateContactEmailHTML(contactData)
    const textContent = generateContactEmailText(contactData)

    // Send email via Resend
    const emailPayload = {
      from: 'ANOINT Array Contact <contact@anointarray.com>',
      to: ['info@anoint.me'],
      reply_to: contactData.email, // Allow direct reply to the sender
      subject: `Contact Form: ${contactData.subject}`,
      html: htmlContent,
      text: textContent,
      tags: [
        { name: 'category', value: 'contact-form' },
        { name: 'source', value: 'website' }
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
      throw new Error(`Failed to send contact message: ${response.status}`)
    }

    const result = await response.json()
    console.log('Contact message sent successfully:', result.id)

    // Optional: Log to Supabase for persistence
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      )

      const { error: logError } = await supabase
        .from('contact_submissions')
        .insert([
          {
            full_name: contactData.fullName,
            email: contactData.email,
            subject: contactData.subject,
            message: contactData.message,
            user_agent: contactData.userAgent,
            submitted_at: contactData.timestamp || new Date().toISOString(),
            email_sent: true,
            email_id: result.id
          }
        ])

      if (logError) {
        console.warn('Failed to log contact submission to database:', logError)
        // Don't fail the request if logging fails
      }
    } catch (dbError) {
      console.warn('Database logging error:', dbError)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        emailId: result.id,
        message: 'Message sent successfully'
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-contact-message function:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to send contact message',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})