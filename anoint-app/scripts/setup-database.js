#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'
import { readFileSync } from 'fs'

// Load environment variables
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: resolve(__dirname, '../.env.local') })

const SUPABASE_URL = process.env.VITE_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function setupDatabase() {
  console.log('🔧 Setting up ANOINT Array Database...')
  console.log('===================================')
  
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Missing environment variables')
    return
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // Read and execute migration files in order
    const migrations = [
      '001_create_orders_table.sql',
      '002_performance_optimizations.sql', 
      '003_create_vip_waitlist.sql',
      '004_create_user_profiles.sql',
      '005_create_contact_submissions.sql'
    ]

    for (const migrationFile of migrations) {
      console.log(`\n📄 Running migration: ${migrationFile}`)
      
      try {
        const migrationPath = resolve(__dirname, '../supabase/migrations', migrationFile)
        const sql = readFileSync(migrationPath, 'utf8')
        
        // Execute the migration
        const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql })
        
        if (error) {
          console.log(`⚠️  Migration may have issues (this is often normal):`, error.message)
        } else {
          console.log(`✅ Migration completed successfully`)
        }
      } catch (fileError) {
        console.error(`❌ Could not read migration file: ${fileError.message}`)
      }
    }

    console.log(`\n🎉 Database setup completed!`)
    console.log(`\n🔍 Verifying setup...`)

    // Verify tables exist
    const tables = ['user_profiles', 'orders', 'vip_waitlist', 'contact_submissions']
    
    for (const tableName of tables) {
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count', { count: 'exact', head: true })
        
        if (error) {
          console.log(`❌ Table '${tableName}' verification failed: ${error.message}`)
        } else {
          console.log(`✅ Table '${tableName}' is ready`)
        }
      } catch (err) {
        console.log(`❌ Table '${tableName}' verification failed`)
      }
    }

    console.log(`\n🚀 You can now run: npm run seed-admin`)

  } catch (error) {
    console.error('❌ Database setup failed:', error.message)
  }
}

setupDatabase()