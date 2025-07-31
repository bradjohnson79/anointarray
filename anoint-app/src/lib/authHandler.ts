import { supabase } from './supabaseClient'

export async function signUpAndCreateProfile(email, password, display_name = '') {
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password
  })

  if (signUpError) {
    console.error('❌ Sign-up failed:', signUpError.message)
    throw signUpError
  }

  const user = signUpData?.user
  if (!user?.id) {
    console.error('❌ No user ID returned from signup')
    return
  }

  const { error: profileError } = await supabase.from('user_profiles').insert({
    user_id: user.id,
    email,
    display_name
  })

  if (profileError) {
    console.error('❌ Profile insert failed:', profileError.message)
    throw profileError
  }

  console.log('✅ User and profile created successfully')
}