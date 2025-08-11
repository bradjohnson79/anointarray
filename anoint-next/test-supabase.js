const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testSupabaseConnection() {
    console.log('🔍 Testing Supabase Connection');
    console.log('===============================');
    
    let adminUser = null;
    
    try {
        // Test 1: Check if user exists
        console.log('\n📝 TEST 1: Check if admin user exists in auth.users');
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) {
            console.error('❌ Error fetching users:', usersError.message);
        } else {
            console.log(`✅ Found ${users.users.length} users in database`);
            adminUser = users.users.find(u => u.email === 'info@anoint.me');
            
            if (adminUser) {
                console.log('✅ Admin user found:', adminUser.email);
                console.log('  - User ID:', adminUser.id);
                console.log('  - Created:', adminUser.created_at);
                console.log('  - Email confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');
            } else {
                console.log('❌ Admin user not found - needs to be created');
                
                // Create the admin user
                console.log('\n📝 Creating admin user...');
                const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
                    email: 'info@anoint.me',
                    password: 'Admin123',
                    email_confirm: true
                });
                
                if (createError) {
                    console.error('❌ Error creating user:', createError.message);
                } else {
                    console.log('✅ Admin user created successfully:', newUser.user.email);
                    console.log('  - User ID:', newUser.user.id);
                }
            }
        }
        
        // Test 2: Check user_profiles table
        console.log('\n📝 TEST 2: Check user_profiles table');
        const { data: profiles, error: profilesError } = await supabase
            .from('user_profiles')
            .select('*')
            .limit(5);
            
        if (profilesError) {
            console.error('❌ Error fetching profiles:', profilesError.message);
            
            // Try to create the table if it doesn't exist
            console.log('\n📝 Creating user_profiles table...');
            const { error: tableError } = await supabase.rpc('exec', {
                sql: `
                    CREATE TABLE IF NOT EXISTS user_profiles (
                        id UUID REFERENCES auth.users ON DELETE CASCADE,
                        email TEXT,
                        role TEXT DEFAULT 'user',
                        is_admin BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                        updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
                        PRIMARY KEY (id)
                    );
                    
                    -- Create RLS policies
                    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
                    
                    CREATE POLICY "Users can view their own profile" ON user_profiles
                        FOR SELECT USING (auth.uid() = id);
                        
                    CREATE POLICY "Users can update their own profile" ON user_profiles
                        FOR UPDATE USING (auth.uid() = id);
                `
            });
            
            if (tableError) {
                console.error('❌ Error creating table:', tableError.message);
            } else {
                console.log('✅ user_profiles table created');
            }
        } else {
            console.log('✅ user_profiles table exists with', profiles.length, 'records');
            profiles.forEach(profile => {
                console.log(`  - ${profile.email}: ${profile.role}${profile.is_admin ? ' (admin)' : ''}`);
            });
        }
        
        // Test 3: Check user details and reset password if needed
        console.log('\n📝 TEST 3: Check user details and reset password');
        if (adminUser) {
            console.log('User details:');
            console.log('  - Email confirmed:', adminUser.email_confirmed_at ? 'Yes' : 'No');
            console.log('  - Phone confirmed:', adminUser.phone_confirmed_at ? 'Yes' : 'No');
            console.log('  - Last sign in:', adminUser.last_sign_in_at || 'Never');
            console.log('  - Banned until:', adminUser.banned_until || 'Not banned');
            console.log('  - Role:', adminUser.role);
            
            // Reset password to ensure it's correct
            console.log('\n📝 Resetting admin password...');
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
                adminUser.id,
                { 
                    password: 'Admin123',
                    email_confirm: true
                }
            );
            
            if (updateError) {
                console.error('❌ Error updating password:', updateError.message);
            } else {
                console.log('✅ Password reset successfully');
            }
        }
        
        // Test 4: Test sign in
        console.log('\n📝 TEST 4: Test admin sign in after password reset');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'info@anoint.me',
            password: 'Admin123'
        });
        
        if (signInError) {
            console.error('❌ Sign in failed:', signInError.message);
        } else {
            console.log('✅ Sign in successful');
            console.log('  - User:', signInData.user.email);
            console.log('  - Session valid until:', new Date(signInData.session.expires_at * 1000));
            
            // Sign out
            await supabase.auth.signOut();
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

testSupabaseConnection().catch(console.error);