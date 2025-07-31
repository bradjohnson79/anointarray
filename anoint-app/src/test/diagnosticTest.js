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

export async function testSignup(email, password) {
  console.log(`🧪 Testing signup with: ${email}`)
  
  const { data, error } = await supabase.auth.signUp({
    email: email,
    password: password
  })

  if (error) {
    console.error('❌ Signup error:', error.message)
    console.error('❌ Error code:', error.status)
    return false
  } else {
    console.log('✅ Signup success:', data)
    return true
  }
}

// If called directly
if (process.argv[2] === 'run') {
  const dynamicEmail = `test+${Date.now()}@example.com`
  testSignup(dynamicEmail, 'SecurePassword123!')
}