-- Fix admin dashboard profile issues
-- This migration creates the profiles view and sets up proper RLS policies

-- 0. Add missing is_admin column to user_profiles
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 1. Create profiles view for compatibility
CREATE OR REPLACE VIEW public.profiles AS SELECT * FROM public.user_profiles;

-- 2. Grant permissions to the view
GRANT SELECT ON public.profiles TO anon, authenticated;

-- 3. Enable RLS on user_profiles if not already enabled
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;  
CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Create admin policies for user_profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;
CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- 6. Ensure admin user exists with correct permissions
INSERT INTO public.user_profiles (id, email, role, is_admin) 
VALUES (
  (SELECT id FROM auth.users WHERE email = 'info@anoint.me' LIMIT 1),
  'info@anoint.me', 
  'admin', 
  true
) 
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  is_admin = true,
  email = 'info@anoint.me';

-- Verify the admin profile exists and is correct (this is a comment for reference)
-- SELECT id, email, role, is_admin FROM public.user_profiles WHERE email = 'info@anoint.me';

-- Test the profiles view works (this is a comment for reference) 
-- SELECT id, email, role FROM public.profiles WHERE email = 'info@anoint.me';