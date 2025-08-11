-- ANOINT Array - Fix user_profiles schema for clean rebuild
-- This script updates the existing user_profiles table to match the clean auth store expectations

-- Add missing columns to user_profiles table
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;

-- Update existing admin users to have email_verified = true
UPDATE public.user_profiles 
SET email_verified = true 
WHERE role = 'admin';

-- Update existing users with is_verified = true to have email_verified = true
UPDATE public.user_profiles 
SET email_verified = is_verified 
WHERE is_verified = true;

-- Create indexes for performance on new column
CREATE INDEX IF NOT EXISTS idx_user_profiles_email_verified ON public.user_profiles(email_verified);

-- Ensure RLS is enabled on user_profiles table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to recreate them cleanly)
DROP POLICY IF EXISTS "user_profiles_select_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_select_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON public.user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;

-- Create RLS policies that match the clean auth store expectations
-- Users can view their own profile
CREATE POLICY "user_profiles_select_own" ON public.user_profiles
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can update their own profile (but not change role)
CREATE POLICY "user_profiles_update_own" ON public.user_profiles
  FOR UPDATE USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text AND role = (SELECT role FROM public.user_profiles WHERE id::text = auth.uid()::text));

-- Users can insert their own profile (for sign-up scenarios)
CREATE POLICY "user_profiles_insert_own" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid()::text = id::text);

-- Admins can view all profiles
CREATE POLICY "user_profiles_admin_select_all" ON public.user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id::text = auth.uid()::text AND (role = 'admin' OR is_admin = true)
    )
  );

-- Admins can update all profiles
CREATE POLICY "user_profiles_admin_update_all" ON public.user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id::text = auth.uid()::text AND (role = 'admin' OR is_admin = true)
    )
  );

-- Create or replace the profiles view for backward compatibility
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
  email_verified,  -- Include the new column
  created_at,
  updated_at
FROM public.user_profiles;

-- Grant permissions on the view
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT ALL ON public.profiles TO service_role;

-- Create updated_at trigger if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;

-- Create the trigger
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user registration (updated version)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    role,
    email_verified,
    is_verified,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.email IN ('info@anoint.me', 'breanne@aetherx.co') THEN 'admin'
      ELSE COALESCE(NEW.raw_user_meta_data->>'role', 'member')
    END,
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    CASE 
      WHEN NEW.email IN ('info@anoint.me', 'breanne@aetherx.co') THEN true
      ELSE false
    END,
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    email_verified = EXCLUDED.email_verified,
    is_verified = EXCLUDED.is_verified,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify the setup
SELECT 'Schema update completed' as status;
SELECT 'Admin users count:' as status, count(*) as count FROM public.user_profiles WHERE role = 'admin' OR is_admin = true;
SELECT 'Total users:' as status, count(*) as count FROM public.user_profiles;
SELECT 'RLS enabled:' as status, relrowsecurity as enabled FROM pg_class WHERE relname = 'user_profiles';
SELECT 'Policies count:' as status, count(*) as count FROM pg_policies WHERE tablename = 'user_profiles';
SELECT 'Profiles view exists:' as status, count(*) as count FROM information_schema.views WHERE table_name = 'profiles';

-- Test query that matches what auth store will do
SELECT 
  'Auth store compatibility test:' as status,
  id, email, role, display_name, email_verified, created_at, updated_at
FROM public.user_profiles 
WHERE role = 'admin' 
LIMIT 1;