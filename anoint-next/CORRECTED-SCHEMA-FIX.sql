-- =================================================================
-- ANOINT Array - CORRECTED Schema Fix for Clean Auth Store
-- =================================================================
-- Execute this SQL in Supabase Dashboard → SQL Editor
-- This fixes the column order conflict error by properly handling the profiles view
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

-- Step 5: PROPERLY handle the profiles view by dropping it first
-- This prevents the column order conflict error
DROP VIEW IF EXISTS public.profiles CASCADE;

-- Step 6: Recreate the profiles view with the correct column order
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

-- Step 7: Grant proper permissions on the recreated view
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- =================================================================
-- Verification queries (run after the above)
-- =================================================================

-- Check that the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'email_verified';

-- Verify the profiles view has the correct structure
SELECT column_name, ordinal_position
FROM information_schema.columns 
WHERE table_name = 'profiles' 
ORDER BY ordinal_position;

-- Verify admin users have email_verified = true
SELECT email, role, is_admin, email_verified 
FROM public.profiles 
WHERE role = 'admin' OR is_admin = true;

-- Test the exact query the auth store will use
SELECT id, email, role, display_name, email_verified, created_at, updated_at
FROM public.profiles 
LIMIT 1;

-- Count total rows to ensure view is working
SELECT 'Total profiles:' as status, count(*) as count FROM public.profiles;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'Corrected schema fix completed successfully!' as status;