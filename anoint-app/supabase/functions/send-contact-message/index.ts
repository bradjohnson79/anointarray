import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, company, subject, message, category = 'general', ...trackingData } = await req.json()

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: name, email, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Store contact submission in database
    const submissionData = {
      name,
      email,
      phone,
      company,
      subject: subject || `Contact from ${name}`,
      message,
      category,
      user_agent: req.headers.get('user-agent'),
      ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      referrer_url: trackingData.referrer_url,
      utm_source: trackingData.utm_source,
      utm_medium: trackingData.utm_medium,
      utm_campaign: trackingData.utm_campaign,
      page_url: trackingData.page_url,
      honeypot_field: trackingData.honeypot_field || null,
      submission_time_seconds: trackingData.submission_time_seconds || null,
    }

    const { data: submission, error: dbError } = await supabase
      .from('contact_submissions')
      .insert([submissionData])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to save contact submission' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send email notification using Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        const emailHtml = `
          <h2>New Contact Form Submission</h2>
          <p><strong>From:</strong> ${name} (${email})</p>
          ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
          ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
          <p><strong>Category:</strong> ${category}</p>
          <p><strong>Subject:</strong> ${subject || 'No subject'}</p>
          
          <h3>Message:</h3>
          <p style="background: #f5f5f5; padding: 15px; border-radius: 5px;">${message.replace(/\n/g, '<br>')}</p>
          
          <hr>
          <h3>Submission Details:</h3>
          <p><strong>Submission ID:</strong> ${submission.id}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          ${trackingData.utm_source ? `<p><strong>Source:</strong> ${trackingData.utm_source}</p>` : ''}
          ${trackingData.referrer_url ? `<p><strong>Referrer:</strong> ${trackingData.referrer_url}</p>` : ''}
          
          <p><a href="${supabaseUrl.replace('/rest/v1', '')}/project/default/editor" target="_blank">View in Admin Dashboard</a></p>
        `

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ANOINT Array <noreply@anointarray.com>',
            to: ['info@anoint.me'],
            subject: `[ANOINT Contact] ${subject || `Message from ${name}`}`,
            html: emailHtml,
            reply_to: email,
          }),
        })

        if (emailResponse.ok) {
          // Update submission to mark email as sent
          await supabase
            .from('contact_submissions')
            .update({ 
              email_sent: true, 
              email_sent_at: new Date().toISOString(),
              email_delivery_status: 'sent'
            })
            .eq('id', submission.id)
        } else {
          const emailError = await emailResponse.text()
          console.error('Email sending failed:', emailError)
          
          // Update submission with error
          await supabase
            .from('contact_submissions')
            .update({ 
              email_sent: false,
              email_delivery_status: 'failed',
              email_error_message: emailError
            })
            .eq('id', submission.id)
        }
      } catch (emailError) {
        console.error('Email error:', emailError)
        
        // Update submission with error
        await supabase
          .from('contact_submissions')
          .update({ 
            email_sent: false,
            email_delivery_status: 'failed',
            email_error_message: emailError.toString()
          })
          .eq('id', submission.id)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Thank you for your message! We\'ll get back to you soon.',
        submissionId: submission.id
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Contact form error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})