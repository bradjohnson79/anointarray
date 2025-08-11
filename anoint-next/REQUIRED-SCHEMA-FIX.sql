-- =================================================================
-- ANOINT Array - REQUIRED Schema Fix for Clean Auth Store
-- =================================================================
-- Execute this SQL in Supabase Dashboard → SQL Editor
-- This fixes compatibility with the clean rebuild auth store
-- =================================================================

-- Step 1: Add the missing email_verified column
ALTER TABLE public.user_profiles 
ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;

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

-- Step 5: Update the profiles view to include the new column
CREATE OR REPLACE VIEW public.profiles AS
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

-- =================================================================
-- Verification queries (run after the above)
-- =================================================================

-- Check that the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND column_name = 'email_verified';

-- Verify admin users have email_verified = true
SELECT email, role, is_admin, email_verified 
FROM public.user_profiles 
WHERE role = 'admin' OR is_admin = true;

-- Test the exact query the auth store will use
SELECT id, email, role, display_name, email_verified, created_at, updated_at
FROM public.user_profiles 
LIMIT 1;

-- =================================================================
-- SUCCESS MESSAGE
-- =================================================================
SELECT 'Schema fix completed successfully!' as status;