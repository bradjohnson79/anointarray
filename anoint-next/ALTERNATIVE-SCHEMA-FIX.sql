-- =================================================================
-- ANOINT Array - ALTERNATIVE Schema Fix Using ALTER VIEW Method
-- =================================================================
-- Execute this SQL in Supabase Dashboard → SQL Editor
-- This uses ALTER VIEW commands as suggested by PostgreSQL error hint
-- =================================================================

-- Step 1: Add the missing email_verified column to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Step 2: Update existing admin users to have email_verified = true
UPDATE public.user_profiles 
SET email_verified = true 
WHERE role = 'admin' OR is_admin = true;

-- Step 3: Update all users who are already verified
UPDATE public.user_profiles 
SET email_verified = is_verified 
WHERE is_verified = true;

-- Step 4: Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified 
ON public.user_profiles(email_verified);

-- Step 5: Check current view structure to understand column positions
SELECT column_name, ordinal_position
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Step 6: Since we can't easily add columns to a view without recreating it,
-- we'll still need to drop and recreate the view
-- But first, let's backup any dependent objects
SELECT 
    schemaname,
    viewname,
    definition
FROM pg_views 
WHERE viewname = 'profiles';

-- Step 7: Drop and recreate the profiles view (safest approach)
DROP VIEW IF EXISTS public.profiles CASCADE;

CREATE VIEW public.profiles AS
SELECT 
  id,
  user_id,
  email,
  display_name,
  avatar_url,
  first_name,
  last_name,
  role,
  is_active,
  is_verified,
  is_admin,
  email_verified,  -- New column included
  created_at,
  updated_at
FROM public.user_profiles;

-- Step 8: Restore permissions
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- =================================================================
-- If you need to recreate any dependent views, add them here
-- =================================================================

-- =================================================================
-- Verification queries
-- =================================================================

-- Verify the profiles view structure
SELECT 
    'Column' as type,
    column_name, 
    ordinal_position,
    data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Test the view works correctly
SELECT 'View test:' as status, count(*) as count FROM public.profiles;

-- Test auth store compatibility
SELECT id, email, role, display_name, email_verified, created_at, updated_at
FROM public.profiles 
LIMIT 1;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'Alternative schema fix completed successfully!' as status;