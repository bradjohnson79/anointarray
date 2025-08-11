#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function listAvailableFunctions() {
    console.log('🔍 Checking available RPC functions...');
    
    // Try different ways to discover available functions
    const approaches = [
        {
            name: 'information_schema.routines',
            query: async () => {
                const response = await fetch(`${supabaseUrl}/rest/v1/information_schema.routines?routine_type=eq.FUNCTION&select=routine_name,routine_type`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey
                    }
                });
                return response.ok ? await response.json() : null;
            }
        },
        {
            name: 'pg_proc system table',
            query: async () => {
                const response = await fetch(`${supabaseUrl}/rest/v1/pg_proc?select=proname&limit=20`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey
                    }
                });
                return response.ok ? await response.json() : null;
            }
        }
    ];
    
    for (const approach of approaches) {
        try {
            console.log(`\n📋 Trying: ${approach.name}`);
            const result = await approach.query();
            if (result) {
                console.log(`  ✅ Found ${result.length} functions`);
                result.slice(0, 10).forEach((func, i) => {
                    const name = func.routine_name || func.proname || JSON.stringify(func);
                    console.log(`    ${i + 1}. ${name}`);
                });
                if (result.length > 10) {
                    console.log(`    ... and ${result.length - 10} more`);
                }
            } else {
                console.log(`  ❌ No results`);
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
        }
    }
}

async function testSimpleQueries() {
    console.log('\n🧪 Testing simple database operations...');
    
    const tests = [
        {
            name: 'List current tables',
            query: async () => {
                const response = await fetch(`${supabaseUrl}/rest/v1/information_schema.tables?table_schema=eq.public&select=table_name`, {
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'apikey': supabaseServiceKey
                    }
                });
                return response.ok ? await response.json() : null;
            }
        },
        {
            name: 'Check user_profiles table',
            query: async () => {
                const { data, error } = await supabase.from('user_profiles').select('id').limit(1);
                return error ? null : 'Table accessible';
            }
        }
    ];
    
    for (const test of tests) {
        try {
            console.log(`\n📊 ${test.name}:`);
            const result = await test.query();
            if (result) {
                if (Array.isArray(result)) {
                    console.log(`  ✅ Found ${result.length} items`);
                    result.slice(0, 5).forEach((item, i) => {
                        console.log(`    ${i + 1}. ${item.table_name || JSON.stringify(item)}`);
                    });
                } else {
                    console.log(`  ✅ ${result}`);
                }
            } else {
                console.log(`  ❌ No results`);
            }
        } catch (err) {
            console.log(`  ❌ Error: ${err.message}`);
        }
    }
}

async function main() {
    console.log('🔧 Supabase Function Discovery Tool');
    console.log('=' .repeat(50));
    
    await listAvailableFunctions();
    await testSimpleQueries();
    
    console.log('\n💡 Next steps:');
    console.log('  1. If no exec_sql function exists, we need to apply migrations manually');
    console.log('  2. Consider using Supabase Dashboard SQL editor');
    console.log('  3. Or apply migrations table by table using REST API');
}

main().catch(console.error);