#!/usr/bin/env node
/**
 * Supabase Migration Script using HTTP API
 * Executes SQL migrations via direct API calls
 */

const fs = require('fs');
const https = require('https');

const SUPABASE_URL = 'https://xmnghciitiefbwxzhgrw.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzcyMzQ3MywiZXhwIjoyMDY5Mjk5NDczfQ.b0az6NSjpooW2BW9OE3ACPQWU_n0D6yV3v1SQKESB1o';

// Migration files
const migrationFiles = [
    '/Users/bradjohnson/Documents/anoint-array/WEBSITE/supabase/migrations/20250811_create_full_ecommerce_tables.sql',
    '/Users/bradjohnson/Documents/anoint-array/WEBSITE/supabase/migrations/20250811_create_database_rpcs.sql'
];

/**
 * Execute SQL via HTTP request to Supabase
 */
function executeSQLStatement(sql) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ query: sql });
        
        const options = {
            hostname: 'xmnghciitiefbwxzhgrw.supabase.co',
            port: 443,
            path: '/rest/v1/rpc/query',
            method: 'POST',
            headers: {
                'apikey': SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
                'Prefer': 'return=minimal'
            }
        };

        const req = https.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    resolve({ success: true, data: responseData, status: res.statusCode });
                } else {
                    resolve({ success: false, error: responseData, status: res.statusCode });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.write(data);
        req.end();
    });
}

/**
 * Process a migration file
 */
async function processMigrationFile(filePath) {
    try {
        console.log(`\n📄 Processing: ${filePath}`);
        
        const sqlContent = fs.readFileSync(filePath, 'utf8');
        
        // Split SQL into individual statements (basic splitting by semicolon)
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`   Found ${statements.length} SQL statements`);
        
        let successCount = 0;
        let skipCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            try {
                const result = await executeSQLStatement(statement);
                
                if (result.success) {
                    successCount++;
                    console.log(`   ✓ Statement ${i + 1}: Success`);
                } else {
                    const errorMsg = result.error || 'Unknown error';
                    if (errorMsg.includes('already exists') || errorMsg.includes('does not exist')) {
                        skipCount++;
                        console.log(`   ⚠ Statement ${i + 1}: Already exists (skipped)`);
                    } else {
                        errorCount++;
                        console.log(`   ✗ Statement ${i + 1}: ${errorMsg}`);
                    }
                }
            } catch (error) {
                errorCount++;
                console.log(`   ✗ Statement ${i + 1}: ${error.message}`);
            }
            
            // Small delay between statements
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`   Results: ${successCount} success, ${skipCount} skipped, ${errorCount} errors`);
        return { successCount, skipCount, errorCount, total: statements.length };
        
    } catch (error) {
        console.log(`   ✗ Error reading file: ${error.message}`);
        return { successCount: 0, skipCount: 0, errorCount: 1, total: 1 };
    }
}

/**
 * Main migration process
 */
async function main() {
    console.log('🚀 Starting Supabase Migration Process');
    console.log(`   Target: ${SUPABASE_URL}`);
    console.log(`   Files: ${migrationFiles.length}`);
    
    let totalSuccess = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let totalStatements = 0;
    
    for (const filePath of migrationFiles) {
        if (!fs.existsSync(filePath)) {
            console.log(`\n❌ File not found: ${filePath}`);
            totalErrors++;
            continue;
        }
        
        const result = await processMigrationFile(filePath);
        totalSuccess += result.successCount;
        totalSkipped += result.skipCount;
        totalErrors += result.errorCount;
        totalStatements += result.total;
    }
    
    console.log('\n🎯 Migration Summary:');
    console.log(`   Total statements: ${totalStatements}`);
    console.log(`   ✓ Successful: ${totalSuccess}`);
    console.log(`   ⚠ Skipped: ${totalSkipped}`);
    console.log(`   ✗ Errors: ${totalErrors}`);
    
    if (totalErrors === 0) {
        console.log('\n🎉 All migrations completed successfully!');
        process.exit(0);
    } else {
        console.log('\n⚠️ Migration completed with some errors. Check logs above.');
        process.exit(totalSuccess > 0 ? 0 : 1);
    }
}

// Run the migration
main().catch(error => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
});