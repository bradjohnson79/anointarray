# Admin Account Setup Guide for ANOINT Array

Since we're encountering authentication issues with the automated scripts, here's the manual process to create your admin account:

## Option 1: Supabase Dashboard (Recommended)

1. **Go to your Supabase Dashboard**
   - Visit: https://app.supabase.com/project/xmnghciitiefbwxzhgrw
   - Navigate to Authentication → Users

2. **Create New User**
   - Click "Add user" → "Create new user"
   - Email: `info@anoint.me`
   - Password: `Admin123`
   - Check "Auto Confirm Email"
   - Click "Create User"

3. **Set Admin Role**
   - Note the User ID that was created
   - Go to Table Editor → user_profiles
   - Click "Insert Row"
   - Fill in:
     - user_id: (paste the User ID from step 2)
     - email: info@anoint.me
     - first_name: ANOINT
     - last_name: Administrator
     - display_name: ANOINT Administrator
     - role: admin
     - is_active: true
     - is_verified: true
   - Click "Save"

## Option 2: SQL Editor in Supabase

1. **Go to SQL Editor in Supabase Dashboard**
   - Navigate to SQL Editor
   - Create a new query

2. **Run this SQL**:
```sql
-- Create admin user if not exists
DO $$
DECLARE
  admin_id uuid;
BEGIN
  -- Check if user exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'info@anoint.me';
  
  IF admin_id IS NULL THEN
    -- User doesn't exist, would need to use dashboard
    RAISE NOTICE 'User does not exist. Please create via Authentication dashboard.';
  ELSE
    -- User exists, update profile
    INSERT INTO user_profiles (
      user_id, email, first_name, last_name, display_name,
      role, is_active, is_verified, email_verified_at,
      created_at, updated_at
    ) VALUES (
      admin_id,
      'info@anoint.me',
      'ANOINT',
      'Administrator', 
      'ANOINT Administrator',
      'admin',
      true,
      true,
      NOW(),
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET 
      role = 'admin',
      is_active = true,
      is_verified = true,
      updated_at = NOW();
    
    RAISE NOTICE 'Admin profile created/updated successfully!';
  END IF;
END $$;
```

## Option 3: Fixed RLS Policies

First, apply the migration to fix the infinite recursion:

```bash
cd anoint-app
npx supabase migration up
```

Then try the seed script again:

```bash
npm run seed-admin
```

## Verification

After creating the admin account:

1. **Test Login**
   - Go to: https://anointarray.com/auth
   - Email: info@anoint.me
   - Password: Admin123

2. **Check Admin Access**
   - After login, you should see "Admin Dashboard" in the navigation
   - Navigate to /admin/products to verify access

## Troubleshooting

If you still have issues:

1. **Check RLS Policies**
   - In Supabase Dashboard → Database → Tables → user_profiles
   - Click on "RLS disabled/enabled" toggle
   - Temporarily disable RLS to test

2. **Check Auth Settings**
   - Authentication → Settings
   - Ensure "Enable email confirmations" is OFF for testing
   - Check that email/password auth is enabled

3. **View Logs**
   - Check Supabase Dashboard → Logs → Auth
   - Look for any error messages

## Role Hierarchy

The application uses these roles:
- `user` - Basic authenticated user
- `vip` - VIP member with special access
- `moderator` - Can moderate content and users
- `admin` - Full system access

Admins have access to all features including VIP and moderator functions.