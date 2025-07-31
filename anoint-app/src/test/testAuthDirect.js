import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

async function testAuthFlow() {
  console.log('🧪 Testing auth flow with clean database...')
  
  const testEmail = `test+${Date.now()}@example.com`
  const testPassword = 'SecureTest123!'
  
  console.log(`📧 Testing with: ${testEmail}`)
  
  try {
    // Step 1: Test basic signup
    console.log('1️⃣ Testing basic signup...')
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword
    })

    if (signUpError) {
      console.error('❌ Sign-up failed:', signUpError.message)
      return
    }

    const user = signUpData?.user
    if (!user?.id) {
      console.error('❌ No user ID returned from signup')
      return
    }

    console.log('✅ Basic signup successful!')
    console.log('   User ID:', user.id)
    console.log('   Email:', user.email)

    // Step 2: Test profile creation
    console.log('2️⃣ Testing profile creation...')
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: user.id,
      email: testEmail,
      display_name: 'Test User',
      role: testEmail === 'info@anoint.me' ? 'admin' : 'user'
    })

    if (profileError) {
      console.error('❌ Profile insert failed:', profileError.message)
      return
    }

    console.log('✅ Profile created successfully!')

    // Step 3: Test profile read
    console.log('3️⃣ Testing profile read...')
    const { data: profile, error: readError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (readError) {
      console.error('❌ Profile read failed:', readError.message)
      return
    }

    console.log('✅ Profile read successful!')
    console.log('   Profile:', profile)

    console.log('\n🎉 ALL TESTS PASSED - Authentication system is working!')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testAuthFlow()