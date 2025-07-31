-- ============================================================================
-- NUCLEAR AUTH CLEANUP - Remove ALL possible conflicts
-- ============================================================================

-- Step 1: Remove ANY triggers on auth.users
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT trigger_name 
        FROM information_schema.triggers 
        WHERE event_object_table = 'users' 
        AND event_object_schema = 'auth'
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || trigger_record.trigger_name || ' ON auth.users CASCADE';
        RAISE NOTICE 'Dropped trigger: %', trigger_record.trigger_name;
    END LOOP;
END $$;

-- Step 2: Remove any functions that might be called by triggers
DROP FUNCTION IF EXISTS create_user_profile() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS create_profile_for_new_user() CASCADE;
DROP FUNCTION IF EXISTS auto_create_profile() CASCADE;

-- Step 3: Check if auth.users has any custom policies (it shouldn't)
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'users' 
        AND schemaname = 'auth'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON auth.users';
        RAISE NOTICE 'Dropped policy: %', policy_record.policyname;
    END LOOP;
END $$;

-- Step 4: Ensure auth.users RLS is OFF (default for Supabase)
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;

-- Step 5: Check for any custom constraints
SELECT 
    conname as constraint_name,
    contype as constraint_type
FROM pg_constraint 
WHERE conrelid = 'auth.users'::regclass
AND contype NOT IN ('p', 'f'); -- Exclude primary key and foreign key (those are normal)

-- Step 6: Verify cleanup
SELECT 'Auth cleanup complete - no custom triggers or policies should remain' as status;

-- Step 7: Test basic table access
SELECT COUNT(*) as user_count FROM auth.users;