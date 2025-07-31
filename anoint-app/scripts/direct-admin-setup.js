#!/usr/bin/env node

/**
 * Direct admin setup script using service role key
 */

import pg from 'pg'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env.local') })

// Parse database URL from Supabase URL
const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const projectRef = SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1]
const DATABASE_URL = `postgresql://postgres.${projectRef}:postgres@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

async function createAdminDirectly() {
  console.log('🔮 Direct Admin Setup')
  console.log('====================')
  
  if (!projectRef) {
    console.error('❌ Could not parse project reference from Supabase URL')
    return
  }

  console.log(`📡 Project: ${projectRef}`)
  console.log('🎯 Target: info@anoint.me / Admin123')
  
  const client = new pg.Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  })

  try {
    console.log('\n🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected to database')

    // Start transaction
    await client.query('BEGIN')

    // Check for existing user
    console.log('\n🔍 Checking for existing admin...')
    const checkResult = await client.query(
      `SELECT id FROM auth.users WHERE email = $1`,
      ['info@anoint.me']
    )

    let userId
    
    if (checkResult.rows.length > 0) {
      userId = checkResult.rows[0].id
      console.log(`⚠️  User already exists with ID: ${userId}`)
      
      // Update the existing user
      console.log('🔄 Updating existing user...')
      const hashedPassword = await bcrypt.hash('Admin123', 10)
      
      await client.query(
        `UPDATE auth.users 
         SET encrypted_password = $1, 
             email_confirmed_at = NOW(),
             raw_user_meta_data = $2,
             updated_at = NOW()
         WHERE id = $3`,
        [
          hashedPassword,
          JSON.stringify({
            first_name: 'ANOINT',
            last_name: 'Administrator',
            role: 'admin'
          }),
          userId
        ]
      )
    } else {
      console.log('🆕 Creating new admin user...')
      
      // Generate user ID
      userId = crypto.randomUUID()
      const hashedPassword = await bcrypt.hash('Admin123', 10)
      
      // Insert into auth.users
      await client.query(
        `INSERT INTO auth.users (
          id, 
          email, 
          encrypted_password,
          email_confirmed_at,
          raw_user_meta_data,
          created_at,
          updated_at,
          aud,
          role
        ) VALUES ($1, $2, $3, NOW(), $4, NOW(), NOW(), 'authenticated', 'authenticated')`,
        [
          userId,
          'info@anoint.me',
          hashedPassword,
          JSON.stringify({
            first_name: 'ANOINT',
            last_name: 'Administrator',
            role: 'admin'
          })
        ]
      )
    }

    // Create or update user profile
    console.log('\n👤 Setting up admin profile...')
    await client.query(
      `INSERT INTO user_profiles (
        user_id, email, first_name, last_name, display_name, 
        role, is_active, is_verified, email_verified_at,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW(), NOW())
      ON CONFLICT (user_id) 
      DO UPDATE SET 
        role = EXCLUDED.role,
        is_active = EXCLUDED.is_active,
        is_verified = EXCLUDED.is_verified,
        updated_at = NOW()`,
      [
        userId,
        'info@anoint.me',
        'ANOINT',
        'Administrator',
        'ANOINT Administrator',
        'admin',
        true,
        true
      ]
    )

    // Commit transaction
    await client.query('COMMIT')
    
    console.log('\n✅ Admin account setup complete!')
    console.log('\n🎯 Login Credentials:')
    console.log('   Email: info@anoint.me')
    console.log('   Password: Admin123')
    console.log('\n🚀 Login at: https://anointarray.com/auth')

  } catch (error) {
    await client.query('ROLLBACK')
    console.error('\n❌ Error:', error.message)
    console.log('\n💡 Note: This approach requires direct database access.')
    console.log('   For production, use Supabase dashboard or Edge Functions.')
  } finally {
    await client.end()
  }
}

// Check if pg module is available
import('pg').then(() => {
  createAdminDirectly()
}).catch(() => {
  console.log('📦 Installing required dependencies...')
  import('child_process').then(({ execSync }) => {
    execSync('npm install pg bcryptjs', { stdio: 'inherit' })
    console.log('✅ Dependencies installed. Please run the script again.')
  })
})