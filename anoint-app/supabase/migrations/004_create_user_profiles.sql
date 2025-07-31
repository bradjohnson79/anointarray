-- Create user profiles table to extend Supabase auth.users
CREATE TABLE IF NOT EXISTS user_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    display_name text,
    avatar_url text,
    phone text,
    
    -- User role and permissions
    role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'vip')),
    is_active boolean DEFAULT true,
    is_verified boolean DEFAULT false,
    
    -- User preferences
    email_notifications boolean DEFAULT true,
    marketing_emails boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    
    -- Profile information
    date_of_birth date,
    bio text,
    website text,
    location text,
    timezone text DEFAULT 'UTC',
    
    -- Healing interests and preferences
    healing_interests text[] DEFAULT '{}',
    experience_level text CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'practitioner')) DEFAULT 'beginner',
    preferred_contact_method text DEFAULT 'email' CHECK (preferred_contact_method IN ('email', 'phone', 'sms')),
    
    -- Subscription and purchase history
    is_vip_member boolean DEFAULT false,
    vip_membership_expires_at timestamp with time zone,
    total_orders integer DEFAULT 0,
    total_spent decimal(10,2) DEFAULT 0.00,
    last_order_at timestamp with time zone,
    
    -- Tracking and analytics
    signup_source text, -- How they found us
    utm_source text,
    utm_medium text,
    utm_campaign text,
    referrer_url text,
    referral_code text UNIQUE, -- Their unique referral code
    referred_by_user_id uuid REFERENCES user_profiles(user_id),
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_login_at timestamp with time zone,
    email_verified_at timestamp with time zone,
    phone_verified_at timestamp with time zone
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_user_id_idx ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);
CREATE INDEX IF NOT EXISTS user_profiles_is_active_idx ON user_profiles(is_active);
CREATE INDEX IF NOT EXISTS user_profiles_created_at_idx ON user_profiles(created_at DESC);
CREATE INDEX IF NOT EXISTS user_profiles_referral_code_idx ON user_profiles(referral_code);
CREATE INDEX IF NOT EXISTS user_profiles_referred_by_idx ON user_profiles(referred_by_user_id);

-- GIN indexes for arrays
CREATE INDEX IF NOT EXISTS user_profiles_healing_interests_gin_idx ON user_profiles USING gin(healing_interests);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all profiles" ON user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Public profiles are viewable" ON user_profiles
    FOR SELECT USING (is_active = true);

-- Create trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create profile when user signs up
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS trigger AS $$
DECLARE
    ref_code text;
BEGIN
    -- Generate unique referral code
    ref_code := 'REF' || substr(encode(gen_random_bytes(6), 'base64'), 1, 8);
    
    -- Ensure referral code is unique
    WHILE EXISTS (SELECT 1 FROM user_profiles WHERE referral_code = ref_code) LOOP
        ref_code := 'REF' || substr(encode(gen_random_bytes(6), 'base64'), 1, 8);
    END LOOP;
    
    INSERT INTO user_profiles (
        user_id,
        email,
        display_name,
        referral_code,
        email_verified_at
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
        ref_code,
        CASE WHEN NEW.email_confirmed_at IS NOT NULL THEN NEW.email_confirmed_at ELSE NULL END
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;
CREATE TRIGGER create_user_profile_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_user_profile();

-- Function to update user stats after order
CREATE OR REPLACE FUNCTION update_user_order_stats()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
        UPDATE user_profiles 
        SET 
            total_orders = COALESCE(total_orders, 0) + 1,
            total_spent = COALESCE(total_spent, 0) + NEW.total_amount,
            last_order_at = NEW.created_at,
            updated_at = now()
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status != 'completed' AND NEW.status = 'completed' THEN
        UPDATE user_profiles 
        SET 
            total_orders = COALESCE(total_orders, 0) + 1,
            total_spent = COALESCE(total_spent, 0) + NEW.total_amount,
            last_order_at = NEW.updated_at,
            updated_at = now()
        WHERE user_id = NEW.user_id;
    ELSIF TG_OP = 'UPDATE' AND OLD.status = 'completed' AND NEW.status != 'completed' THEN
        UPDATE user_profiles 
        SET 
            total_orders = GREATEST(COALESCE(total_orders, 0) - 1, 0),
            total_spent = GREATEST(COALESCE(total_spent, 0) - OLD.total_amount, 0),
            updated_at = now()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_users', COUNT(*),
        'active_users', COUNT(*) FILTER (WHERE is_active = true),
        'admin_users', COUNT(*) FILTER (WHERE role = 'admin'),
        'vip_users', COUNT(*) FILTER (WHERE is_vip_member = true),
        'verified_users', COUNT(*) FILTER (WHERE is_verified = true),
        'users_with_orders', COUNT(*) FILTER (WHERE total_orders > 0),
        'avg_orders_per_user', ROUND(AVG(total_orders), 2),
        'avg_spent_per_user', ROUND(AVG(total_spent), 2),
        'signups_7d', (
            SELECT COUNT(*) FROM user_profiles 
            WHERE created_at >= now() - interval '7 days'
        ),
        'signups_30d', (
            SELECT COUNT(*) FROM user_profiles 
            WHERE created_at >= now() - interval '30 days'
        )
    ) INTO result
    FROM user_profiles;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to find users by referral code
CREATE OR REPLACE FUNCTION get_referral_stats(ref_code text)
RETURNS json AS $$
DECLARE
    result json;
    referrer_id uuid;
BEGIN
    -- Find the referrer
    SELECT user_id INTO referrer_id 
    FROM user_profiles 
    WHERE referral_code = ref_code;
    
    IF referrer_id IS NULL THEN
        RETURN json_build_object('error', 'Referral code not found');
    END IF;
    
    SELECT json_build_object(
        'referrer_id', referrer_id,
        'total_referrals', COUNT(*),
        'active_referrals', COUNT(*) FILTER (WHERE is_active = true),
        'vip_referrals', COUNT(*) FILTER (WHERE is_vip_member = true),
        'total_referral_value', SUM(total_spent),
        'avg_referral_value', ROUND(AVG(total_spent), 2)
    ) INTO result
    FROM user_profiles
    WHERE referred_by_user_id = referrer_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE user_profiles IS 'Extended user profiles for ANOINT Array members';
COMMENT ON FUNCTION create_user_profile() IS 'Automatically creates user profile when auth user is created';
COMMENT ON FUNCTION update_user_order_stats() IS 'Updates user statistics when orders are completed';
COMMENT ON FUNCTION get_user_stats() IS 'Returns comprehensive user statistics for admin dashboard';
COMMENT ON FUNCTION get_referral_stats(text) IS 'Returns referral statistics for a given referral code';