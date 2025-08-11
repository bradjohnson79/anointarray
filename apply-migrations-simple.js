#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function executeSQLDirect(sql) {
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
        },
        body: JSON.stringify({ sql })
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    return await response.json();
}

async function executeSQLFile(filePath) {
    console.log(`\n📄 Applying migration: ${path.basename(filePath)}`);
    
    try {
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        console.log(`  File size: ${(sqlContent.length / 1024).toFixed(1)} KB`);
        
        // Clean up the SQL content
        const cleanedSQL = sqlContent
            .replace(/--.*$/gm, '') // Remove comments
            .replace(/\n\s*\n/g, '\n') // Remove empty lines
            .trim();
        
        if (!cleanedSQL) {
            console.log('  ⚠️ No SQL content found');
            return false;
        }
        
        console.log('  🔄 Executing SQL...');
        
        try {
            // Try using the SQL editor endpoint
            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${supabaseServiceKey}`,
                    'apikey': supabaseServiceKey,
                    'Prefer': 'return=minimal'
                },
                body: JSON.stringify({ 
                    query: cleanedSQL 
                })
            });
            
            if (response.ok) {
                console.log(`  ✅ Migration applied successfully: ${path.basename(filePath)}`);
                return true;
            } else {
                const errorText = await response.text();
                console.error(`  ❌ HTTP Error ${response.status}:`, errorText);
                return false;
            }
            
        } catch (fetchError) {
            console.error(`  ❌ Network error:`, fetchError.message);
            return false;
        }
        
    } catch (error) {
        console.error(`❌ Failed to process ${filePath}:`, error.message);
        return false;
    }
}

async function testConnection() {
    console.log('🔍 Testing Supabase connection...');
    try {
        const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1 });
        if (error) {
            throw new Error(error.message);
        }
        console.log('✅ Successfully connected to Supabase');
        return true;
    } catch (err) {
        console.error('❌ Connection failed:', err.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Database Migration Tool');
    console.log('📡 Target:', supabaseUrl);
    console.log('=' .repeat(60));
    
    // Test connection
    const connected = await testConnection();
    if (!connected) {
        console.log('💡 Tip: Make sure your SUPABASE_SERVICE_ROLE_KEY is correct in .env.local');
        return;
    }
    
    // Define migration files in execution order
    const migrations = [
        {
            name: 'Canadian Tax System',
            file: '/Users/bradjohnson/Documents/anoint-array/WEBSITE/supabase/migrations/20250811_create_canadian_tax_system.sql'
        },
        {
            name: 'Enhanced Products & Orders',
            file: '/Users/bradjohnson/Documents/anoint-array/WEBSITE/supabase/migrations/20250811_create_enhanced_products_orders.sql'
        }
    ];
    
    console.log(`\n📋 Found ${migrations.length} migrations to apply:`);
    migrations.forEach((m, i) => {
        console.log(`  ${i + 1}. ${m.name}`);
    });
    
    let successCount = 0;
    let totalCount = 0;
    
    for (const migration of migrations) {
        totalCount++;
        if (fs.existsSync(migration.file)) {
            const success = await executeSQLFile(migration.file);
            if (success) successCount++;
        } else {
            console.error(`❌ Migration file not found: ${migration.file}`);
        }
        
        // Add a small delay between migrations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('🎉 Migration Process Complete!');
    console.log(`📊 Results: ${successCount}/${totalCount} migrations applied successfully`);
    
    if (successCount === totalCount) {
        console.log('\n🔍 Verifying migration results...');
        
        // Test if key tables exist by trying to query them
        const verifications = [
            { name: 'tax_rates', query: () => supabase.from('tax_rates').select('province_code').limit(1) },
            { name: 'tax_settings', query: () => supabase.from('tax_settings').select('id').limit(1) },
            { name: 'products', query: () => supabase.from('products').select('id').limit(1) },
            { name: 'orders', query: () => supabase.from('orders').select('id').limit(1) },
            { name: 'product_categories', query: () => supabase.from('product_categories').select('id').limit(1) }
        ];
        
        for (const verification of verifications) {
            try {
                const { data, error } = await verification.query();
                if (error) {
                    console.log(`  ⚠️ ${verification.name}: ${error.message}`);
                } else {
                    console.log(`  ✅ ${verification.name}: Table accessible`);
                }
            } catch (err) {
                console.log(`  ❌ ${verification.name}: ${err.message}`);
            }
        }
        
        console.log('\n🎊 Database migration completed successfully!');
        console.log('💡 Your Canadian tax system and enhanced product management are now ready!');
        
    } else {
        console.log('\n⚠️ Some migrations failed. Please review the error messages above.');
        console.log('💡 You may need to manually apply the failed migrations using the Supabase dashboard.');
    }
}

main().catch(error => {
    console.error('💥 Fatal error:', error.message);
    process.exit(1);
});