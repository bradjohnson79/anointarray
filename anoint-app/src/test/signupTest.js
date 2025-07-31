import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

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