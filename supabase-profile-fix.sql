-- ANOINT Array Profile Fix Script
-- Run this in Supabase SQL Editor
-- Project: xmnghciitiefbwxzhgrw

-- ========================================
-- STEP 0: Check current schema
-- ========================================
-- Run this first to see what tables exist:
SELECT table_name 
FROM information_schema.tables
WHERE table_schema='public' 
  AND table_type='BASE TABLE'
ORDER BY table_name;

-- Get your auth user ID (you'll need this for step 3):
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'info@anoint.me';

-- ========================================
-- STEP 1: Create Compatibility View
-- ========================================
-- This creates a "profiles" view that maps to "user_profiles"
-- so any legacy code looking for "profiles" will work

CREATE OR REPLACE VIEW public.profiles AS
SELECT
  id,
  email,
  full_name,
  display_name,
  phone,
  is_admin,
  loyalty_tier,
  total_orders,
  total_spent,
  business_account,
  wholesale_account,
  company,
  prefers_crypto,
  rural_delivery,
  is_first_time,
  created_at,
  updated_at
FROM public.user_profiles;

-- Grant permissions to the view
GRANT SELECT ON public.profiles TO anon, authenticated;

-- ========================================
-- STEP 2: Enable RLS with Proper Policies
-- ========================================
-- Enable Row Level Security on the base table
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "read_own_profile" ON public.user_profiles;
DROP POLICY IF EXISTS "update_own_profile" ON public.user_profiles;

-- Create new policies for authenticated users
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE 
  USING (auth.uid() = id);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_id ON public.user_profiles (id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email);

-- ========================================
-- STEP 3: Ensure Admin User Profile Exists
-- ========================================
-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with the actual ID from Step 0

-- First, check if profile exists:
SELECT * FROM public.user_profiles 
WHERE email = 'info@anoint.me';

-- If it doesn't exist or is_admin is false, run this upsert:
-- REPLACE THE ID WITH YOUR ACTUAL AUTH USER ID!
INSERT INTO public.user_profiles (
  id, 
  email,
  full_name,
  display_name,
  is_admin,
  loyalty_tier,
  total_orders,
  total_spent,
  business_account,
  wholesale_account,
  prefers_crypto,
  rural_delivery,
  is_first_time,
  created_at,
  updated_at
) VALUES (
  'YOUR_USER_ID_HERE',  -- <<<< REPLACE THIS WITH YOUR ACTUAL ID FROM STEP 0
  'info@anoint.me',
  'Brad Johnson',
  'Brad Johnson',
  true,  -- Admin flag
  'gold',
  0,
  0,
  false,
  false,
  false,
  false,
  false,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  is_admin = true,
  full_name = EXCLUDED.full_name,
  display_name = EXCLUDED.display_name,
  updated_at = NOW();

-- ========================================
-- STEP 4: Verify Everything Works
-- ========================================
-- Test the view works:
SELECT id, email, is_admin FROM public.profiles 
WHERE email = 'info@anoint.me';

-- Test the base table:
SELECT id, email, is_admin FROM public.user_profiles 
WHERE email = 'info@anoint.me';

-- Both should return the same data with is_admin = true

-- ========================================
-- STEP 5: Create Trigger for Auto Profile Creation (Optional)
-- ========================================
-- This ensures new users automatically get a profile

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    display_name,
    is_admin,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE 
      WHEN NEW.email IN ('info@anoint.me', 'breanne@aetherx.co') THEN true
      ELSE false
    END,
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================
-- DONE! Your admin dashboard should now work
-- ========================================