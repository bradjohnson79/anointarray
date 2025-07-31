import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface CreateAdminRequest {
  email: string
  password: string
  full_name?: string
  force_create?: boolean // Override existing user check
}

serve(async (req) => {
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
    const { email, password, full_name, force_create = false }: CreateAdminRequest = await req.json()

    // Validate required fields
    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: 'Email and password are required' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Validate password strength
    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: 'Password must be at least 6 characters long' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create Supabase admin client (service role)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if user already exists
    const { data: existingProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('email, role, is_active')
      .eq('email', email)
      .single()

    if (existingProfile && !force_create) {
      return new Response(
        JSON.stringify({ 
          error: 'User already exists',
          existing_user: {
            email: existingProfile.email,
            role: existingProfile.role,
            is_active: existingProfile.is_active
          }
        }),
        { 
          status: 409,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the user in Supabase Auth
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: full_name || 'Admin User',
        role: 'admin'
      }
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      
      // Handle specific error cases
      if (authError.message.includes('already registered')) {
        return new Response(
          JSON.stringify({ 
            error: 'Email already registered in auth system',
            details: authError.message
          }),
          { 
            status: 409,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      throw authError
    }

    if (!authUser.user) {
      throw new Error('User creation failed - no user returned')
    }

    // Update or create the user profile with admin role
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        user_id: authUser.user.id,
        email: email,
        full_name: full_name || 'Admin User',
        role: 'admin',
        is_active: true,
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      
      // Try to clean up auth user if profile creation fails
      try {
        await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      } catch (cleanupError) {
        console.error('Failed to cleanup auth user:', cleanupError)
      }
      
      throw profileError
    }

    // Get the complete user profile
    const { data: userProfile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', authUser.user.id)
      .single()

    console.log(`✅ Admin user created successfully: ${email}`)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Admin user created successfully',
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          full_name: userProfile?.full_name,
          role: userProfile?.role,
          created_at: authUser.user.created_at,
          email_confirmed: authUser.user.email_confirmed_at !== null
        }
      }),
      { 
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error creating admin user:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create admin user',
        message: error.message,
        details: error.stack
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})