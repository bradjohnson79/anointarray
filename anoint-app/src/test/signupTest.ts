import { supabase } from '../lib/supabaseClient'

async function testSignup() {
  const { data, error } = await supabase.auth.signUp({
    email: 'testuser@example.com',
    password: 'SecureTest123!'
  })

  if (error) {
    console.error('❌ Signup error:', error.message)
  } else {
    console.log('✅ Signup success:', data)
  }
}

testSignup()