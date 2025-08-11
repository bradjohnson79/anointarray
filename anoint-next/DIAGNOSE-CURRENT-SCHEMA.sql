-- =================================================================
-- ANOINT Array - Database Schema Diagnostic Script
-- =================================================================
-- Run this FIRST to understand the current state before applying fixes
-- Execute this SQL in Supabase Dashboard → SQL Editor
-- =================================================================

-- 1. Check if user_profiles table exists and its structure
SELECT 'user_profiles table structure:' as info;
SELECT 
    column_name, 
    ordinal_position,
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Check if profiles view exists and its structure
SELECT 'profiles view structure:' as info;
SELECT 
    column_name, 
    ordinal_position,
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. Get the actual view definition
SELECT 'profiles view definition:' as info;
SELECT definition 
FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'profiles';

-- 4. Check if email_verified column already exists
SELECT 'email_verified column check:' as info;
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'user_profiles' 
              AND column_name = 'email_verified'
              AND table_schema = 'public'
        ) 
        THEN 'email_verified column EXISTS in user_profiles'
        ELSE 'email_verified column MISSING from user_profiles'
    END as status;

-- 5. Sample data from user_profiles table
SELECT 'Sample user_profiles data:' as info;
SELECT id, email, role, is_admin, is_verified, created_at
FROM public.user_profiles 
LIMIT 3;

-- 6. Sample data from profiles view (if it exists)
SELECT 'Sample profiles view data:' as info;
SELECT id, email, role, created_at
FROM public.profiles 
LIMIT 3;

-- 7. Check for any dependent objects on profiles view
SELECT 'Objects depending on profiles view:' as info;
SELECT 
    dependent_ns.nspname as dependent_schema,
    dependent_view.relname as dependent_view,
    source_table.relname as source_table
FROM pg_depend 
JOIN pg_rewrite ON pg_depend.objid = pg_rewrite.oid 
JOIN pg_class as dependent_view ON pg_rewrite.ev_class = dependent_view.oid 
JOIN pg_class as source_table ON pg_depend.refobjid = source_table.oid 
JOIN pg_namespace dependent_ns ON dependent_ns.oid = dependent_view.relnamespace
WHERE source_table.relname = 'profiles';

-- 8. Check RLS status on user_profiles
SELECT 'RLS status:' as info;
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 9. Count current policies
SELECT 'Current policies count:' as info;
SELECT count(*) as policy_count
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- 10. Show current policies
SELECT 'Current policies:' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'user_profiles';

-- =================================================================
-- DIAGNOSTIC COMPLETE
-- =================================================================
SELECT 'Diagnostic complete - review results above before applying fix!' as status;