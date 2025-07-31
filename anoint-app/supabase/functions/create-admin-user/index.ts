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
    // This function should only be called by authenticated admin users or during setup
    const { email = 'info@anoint.me', password = 'Admin123', firstName = 'ANOINT', lastName = 'Admin' } = await req.json()

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Check if admin user already exists
    const { data: existingUsers, error: userCheckError } = await supabase.auth.admin.listUsers()
    
    if (userCheckError) {
      console.error('Error checking existing users:', userCheckError)
      return new Response(
        JSON.stringify({ error: 'Failed to check existing users' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const existingAdmin = existingUsers.users?.find(user => user.email === email)
    
    if (existingAdmin) {
      // Update existing user's profile to ensure admin role
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert([{
          user_id: existingAdmin.id,
          email: existingAdmin.email,
          first_name: firstName,
          last_name: lastName,
          display_name: `${firstName} ${lastName}`,
          role: 'admin',
          is_active: true,
          is_verified: true,
        }], { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })

      if (profileError) {
        console.error('Error updating admin profile:', profileError)
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Admin user already exists and profile updated',
          userId: existingAdmin.id,
          email: existingAdmin.email
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create new admin user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        role: 'admin'
      }
    })

    if (createError) {
      console.error('Error creating admin user:', createError)
      return new Response(
        JSON.stringify({ error: 'Failed to create admin user: ' + createError.message }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    if (!newUser.user) {
      return new Response(
        JSON.stringify({ error: 'User creation failed - no user returned' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create admin profile (this should be triggered automatically by the trigger, but let's ensure it)
    const { error: profileError } = await supabase
      .from('user_profiles')
      .upsert([{
        user_id: newUser.user.id,
        email: newUser.user.email,
        first_name: firstName,
        last_name: lastName,
        display_name: `${firstName} ${lastName}`,
        role: 'admin',
        is_active: true,
        is_verified: true,
        email_verified_at: new Date().toISOString(),
      }], { 
        onConflict: 'user_id',
        ignoreDuplicates: false 
      })

    if (profileError) {
      console.error('Error creating admin profile:', profileError)
      // Don't fail the request if profile creation fails, as the trigger should handle it
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Admin user created successfully',
        userId: newUser.user.id,
        email: newUser.user.email,
        credentials: {
          email,
          password: '***' // Don't return actual password
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Admin user creation error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error: ' + error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})