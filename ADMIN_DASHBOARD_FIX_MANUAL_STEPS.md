# Admin Dashboard Fix - Manual Steps Required

## Summary
The SQL commands to fix the admin dashboard cannot be executed programmatically via the Supabase REST API without additional setup. These commands need to be executed manually in the Supabase Dashboard SQL Editor.

## Manual Steps Required

### 1. Access Supabase Dashboard
1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Navigate to your project: `xmnghciitiefbwxzhgrw`
3. Go to the SQL Editor tab

### 2. Execute the Following SQL Commands (in order)

```sql
-- Step 1: Create the profiles view
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.user_profiles;

-- Step 2: Grant permissions on the view
GRANT SELECT ON public.profiles TO anon, authenticated;

-- Step 3: Enable Row Level Security on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Step 4: Drop existing select policy (if exists)
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;

-- Step 5: Create select policy
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Step 6: Drop existing update policy (if exists)  
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Step 7: Create update policy
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);
```

### 3. Verification Query
After executing the above commands, run this to verify everything is working:

```sql
-- Verify the view was created and works
SELECT * FROM public.profiles WHERE email = 'info@anoint.me';
```

## What This Fix Accomplishes

1. **Creates `profiles` View**: Creates a view that maps to `user_profiles` table, which is what the admin dashboard is expecting to query.

2. **Grants Permissions**: Ensures that both anonymous and authenticated users can read from the profiles view.

3. **Enables RLS**: Activates Row Level Security on the `user_profiles` table to ensure data security.

4. **Creates Security Policies**: 
   - Users can only view their own profile data
   - Users can only update their own profile data

## Expected Results

After executing these commands:
- The admin dashboard should be able to query the `profiles` view
- User authentication and profile access will be properly secured
- The infinite loading issue in the admin dashboard should be resolved

## Files Created During This Process

- `/Users/bradjohnson/Documents/anoint-array/WEBSITE/temp-supabase-admin-fix.js` - Node.js script (unsuccessful)
- `/Users/bradjohnson/Documents/anoint-array/WEBSITE/execute-admin-fix.sh` - Shell script (unsuccessful)
- `/Users/bradjohnson/Documents/anoint-array/WEBSITE/ADMIN_DASHBOARD_FIX_MANUAL_STEPS.md` - This documentation

## Environment Variables Used

- `NEXT_PUBLIC_SUPABASE_URL`: https://xmnghciitiefbwxzhgrw.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY`: (Service role key from .env.local)

## Why Manual Execution is Required

Supabase hosted instances don't allow direct DDL (Data Definition Language) operations via the REST API for security reasons. These operations must be performed through:
1. The Supabase Dashboard SQL Editor
2. Database migrations using the Supabase CLI
3. Custom database functions (which would need to be created first)

## Next Steps

1. Execute the SQL commands manually in the Supabase Dashboard
2. Test the admin dashboard to confirm the fix works
3. Clean up temporary files if desired
4. Consider setting up proper database migrations for future schema changes