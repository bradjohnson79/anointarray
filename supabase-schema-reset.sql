-- ANOINT Array Database Schema Reset
-- Execute this SQL in your Supabase SQL Editor

-- Drop existing tables and functions
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS auth_profiles CASCADE;

-- Create clean user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS on user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_profiles_select_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_update_own" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_select_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_update_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_insert_own" ON user_profiles;

-- Users can view their own profile
CREATE POLICY "user_profiles_select_own" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (except role)
CREATE POLICY "user_profiles_update_own" ON user_profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

-- Users can insert their own profile (for manual inserts)
CREATE POLICY "user_profiles_insert_own" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "user_profiles_admin_select_all" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "user_profiles_admin_update_all" ON user_profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, email_verified, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'full_name', 
      split_part(NEW.email, '@', 1)
    ),
    NEW.email_confirmed_at IS NOT NULL,
    COALESCE(NEW.raw_user_meta_data->>'role', 'member')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Insert admin user profiles for existing admin users
INSERT INTO user_profiles (id, email, display_name, email_verified, role)
VALUES ('de3f81eb-ae76-4617-9a30-ad8bd41bc673', 'info@anoint.me', 'ANOINT Admin', true, 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';
INSERT INTO user_profiles (id, email, display_name, email_verified, role)
VALUES ('84f4f2b8-f9ca-4a83-ab6a-e167c84287df', 'breanne@aetherx.co', 'Breanne Admin', true, 'admin')
ON CONFLICT (id) DO UPDATE SET role = 'admin';

-- Verify setup
SELECT 'Admin users created:' as status, count(*) as count FROM user_profiles WHERE role = 'admin';
SELECT 'Total users:' as status, count(*) as count FROM user_profiles;
SELECT 'RLS enabled:' as status, relrowsecurity as enabled FROM pg_class WHERE relname = 'user_profiles';
SELECT 'Policies count:' as status, count(*) as count FROM pg_policies WHERE tablename = 'user_profiles';
SELECT 'Trigger exists:' as status, count(*) as count FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created';
