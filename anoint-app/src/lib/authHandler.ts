import { supabase } from './supabaseClient'

export async function signUpUser(email: string, password: string, displayName = '') {
  const { data, error } = await supabase.auth.signUp({ email, password })

  if (error) {
    console.error('❌ Signup failed:', error.message)
    throw error
  }

  const user = data.user
  const session = data.session

  if (!user?.id || !session) {
    console.error('❌ Missing user ID or session after signup.')
    return
  }

  console.log('✅ Signup successful:', user.id)

  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: user.id,
    email,
    display_name: displayName
  })

  if (profileError) {
    console.error('❌ Failed to insert profile:', profileError.message)
    throw profileError
  }

  console.log('✅ Profile created and session active. No need to re-login.')
}