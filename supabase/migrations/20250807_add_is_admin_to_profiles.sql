-- Add is_admin field to profiles table for role-based access control
-- This migration safely adds the field and sets the admin user

-- Add is_admin column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Set info@anoint.me as admin user
UPDATE public.profiles 
SET is_admin = TRUE 
WHERE email = 'info@anoint.me';

-- Create index for faster role lookups
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Update RLS policies to allow admin users to read all profiles (if needed for admin dashboard)
DROP POLICY IF EXISTS "Admins can read all profiles" ON public.profiles;
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IN (
      SELECT id FROM public.profiles WHERE is_admin = true
    )
  );

-- Ensure admin user gets created if they don't exist (safety net)
INSERT INTO public.profiles (id, email, display_name, full_name, is_admin)
SELECT 
  auth.users.id,
  'info@anoint.me',
  'Admin',
  'ANOINT Array Admin',
  true
FROM auth.users
WHERE auth.users.email = 'info@anoint.me'
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles WHERE email = 'info@anoint.me'
  );

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_admin IS 'Boolean flag to determine if user has admin privileges';