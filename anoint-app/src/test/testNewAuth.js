import { signUpAndCreateProfile } from '../lib/authHandler.js'
import dotenv from 'dotenv'

dotenv.config()

console.log('🧪 Testing new auth handler with clean database...')

const testEmail = `test+${Date.now()}@example.com`
const testPassword = 'SecureTest123!'

try {
  await signUpAndCreateProfile(testEmail, testPassword, 'Test User')
  console.log('🎉 SUCCESS: Auth handler working perfectly!')
} catch (error) {
  console.error('❌ Test failed:', error.message)
}