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
    const { email, firstName, lastName, interestLevel, productInterests, ...trackingData } = await req.json()

    // Validate required fields
    if (!email) {
      return new Response(
        JSON.stringify({ error: 'Email is required' }),
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

    // Store VIP waitlist entry
    const waitlistData = {
      email,
      first_name: firstName,
      last_name: lastName,
      interest_level: interestLevel || 'medium',
      product_interests: productInterests || [],
      source: trackingData.source,
      utm_source: trackingData.utm_source,
      utm_medium: trackingData.utm_medium,
      utm_campaign: trackingData.utm_campaign,
      referrer_url: trackingData.referrer_url,
    }

    const { data: waitlistEntry, error: dbError } = await supabase
      .from('vip_waitlist')
      .upsert([waitlistData], { 
        onConflict: 'email',
        ignoreDuplicates: false 
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return new Response(
        JSON.stringify({ error: 'Failed to join VIP waitlist' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Send VIP confirmation email
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (resendApiKey) {
      try {
        const displayName = firstName ? `${firstName}${lastName ? ' ' + lastName : ''}` : 'VIP Member'
        
        const emailHtml = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
            
            <!-- Header -->
            <div style="text-align: center; padding: 40px 20px;">
              <h1 style="margin: 0; font-size: 32px; font-weight: 300; text-shadow: 0 2px 4px rgba(0,0,0,0.3);">
                🔮 ANOINT Array
              </h1>
              <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                Scalar Energy Healing Technology
              </p>
            </div>

            <!-- Main Content -->
            <div style="background: white; color: #333; margin: 0 20px; border-radius: 10px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.2);">
              
              <!-- Welcome Section -->
              <div style="padding: 40px 30px 20px 30px; text-align: center;">
                <h2 style="color: #4a5568; margin: 0 0 20px 0; font-size: 24px;">
                  Welcome to the VIP Waitlist! ✨
                </h2>
                <p style="font-size: 18px; line-height: 1.6; margin: 0;">
                  ${firstName ? `Hi ${displayName}!` : 'Hello!'} You're now on the exclusive waitlist for our revolutionary Bio-Scalar Vest and premium ANOINT Array products.
                </p>
              </div>

              <!-- Benefits Section -->
              <div style="padding: 0 30px 20px 30px;">
                <h3 style="color: #2d3748; font-size: 20px; margin: 0 0 15px 0;">
                  Your VIP Benefits Include:
                </h3>
                <ul style="list-style: none; padding: 0; margin: 0;">
                  <li style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 16px;">
                    🎯 <strong>Early Access:</strong> Be the first to purchase new scalar energy products
                  </li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 16px;">
                    💰 <strong>Exclusive Discounts:</strong> VIP-only pricing on all products
                  </li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 16px;">
                    📚 <strong>Advanced Content:</strong> Behind-the-scenes development updates
                  </li>
                  <li style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-size: 16px;">
                    🔬 <strong>Beta Testing:</strong> Test new products before public release
                  </li>
                  <li style="padding: 10px 0; font-size: 16px;">
                    💎 <strong>Priority Support:</strong> Direct line to our development team
                  </li>
                </ul>
              </div>

              ${productInterests && productInterests.length > 0 ? `
              <!-- Interest Section -->
              <div style="padding: 0 30px 20px 30px;">
                <h3 style="color: #2d3748; font-size: 20px; margin: 0 0 15px 0;">
                  Your Interests:
                </h3>
                <div style="display: flex; flex-wrap: wrap; gap: 8px;">
                  ${productInterests.map(interest => `
                    <span style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 6px 12px; border-radius: 20px; font-size: 14px; font-weight: 500;">
                      ${interest}
                    </span>
                  `).join('')}
                </div>
              </div>
              ` : ''}

              <!-- What's Next -->
              <div style="background: #f7fafc; padding: 30px; margin: 20px 0 0 0;">
                <h3 style="color: #2d3748; font-size: 20px; margin: 0 0 15px 0; text-align: center;">
                  What Happens Next?
                </h3>
                <div style="text-align: center;">
                  <p style="font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
                    We'll keep you updated on our latest developments and notify you when exclusive products become available.
                  </p>
                  <div style="margin: 20px 0;">
                    <a href="https://anointarray.com" style="display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; font-weight: 600; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                      Visit ANOINT Array →
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="text-align: center; padding: 30px 20px; font-size: 14px; opacity: 0.8;">
              <p style="margin: 0 0 10px 0;">
                ANOINT Array - Pioneering Scalar Energy Technology
              </p>
              <p style="margin: 0;">
                <a href="mailto:info@anoint.me" style="color: white; text-decoration: none;">info@anoint.me</a> | 
                <a href="https://anointarray.com" style="color: white; text-decoration: none;">anointarray.com</a>
              </p>
            </div>
          </div>
        `

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'ANOINT Array VIP <vip@anointarray.com>',
            to: [email],
            subject: '🔮 Welcome to ANOINT Array VIP Waitlist - Exclusive Access Awaits!',
            html: emailHtml,
          }),
        })

        if (emailResponse.ok) {
          // Update waitlist entry to mark confirmation as sent
          await supabase
            .from('vip_waitlist')
            .update({ 
              confirmation_sent: true, 
              confirmation_sent_at: new Date().toISOString()
            })
            .eq('id', waitlistEntry.id)
        } else {
          const emailError = await emailResponse.text()
          console.error('VIP confirmation email failed:', emailError)
        }
      } catch (emailError) {
        console.error('VIP email error:', emailError)
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Welcome to the VIP waitlist! Check your email for confirmation.',
        waitlistId: waitlistEntry.id,
        priorityScore: waitlistEntry.priority_score
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('VIP waitlist error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})