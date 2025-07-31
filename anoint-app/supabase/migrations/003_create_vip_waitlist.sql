-- Create VIP waitlist table for Bio-Scalar products
CREATE TABLE IF NOT EXISTS vip_waitlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text UNIQUE NOT NULL,
    first_name text,
    last_name text,
    phone text,
    interest_level text CHECK (interest_level IN ('low', 'medium', 'high', 'urgent')) DEFAULT 'medium',
    product_interests text[] DEFAULT '{}',
    source text, -- How they found us (social, referral, etc.)
    notes text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'contacted', 'converted', 'unsubscribed')),
    confirmation_sent boolean DEFAULT false,
    confirmation_sent_at timestamp with time zone,
    priority_score integer DEFAULT 0, -- For admin sorting
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    -- Contact preferences
    email_notifications boolean DEFAULT true,
    sms_notifications boolean DEFAULT false,
    -- Tracking
    utm_source text,
    utm_medium text,
    utm_campaign text,
    referrer_url text
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS vip_waitlist_email_idx ON vip_waitlist(email);
CREATE INDEX IF NOT EXISTS vip_waitlist_status_idx ON vip_waitlist(status);
CREATE INDEX IF NOT EXISTS vip_waitlist_created_at_idx ON vip_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS vip_waitlist_priority_idx ON vip_waitlist(priority_score DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS vip_waitlist_interest_level_idx ON vip_waitlist(interest_level);

-- GIN index for product interests array
CREATE INDEX IF NOT EXISTS vip_waitlist_product_interests_gin_idx ON vip_waitlist USING gin(product_interests);

-- Enable Row Level Security
ALTER TABLE vip_waitlist ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can join waitlist" ON vip_waitlist
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their own waitlist entry" ON vip_waitlist
    FOR SELECT USING (email = auth.jwt() ->> 'email');

CREATE POLICY "Admins can view all waitlist entries" ON vip_waitlist
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

-- Create trigger for updated_at
CREATE TRIGGER update_vip_waitlist_updated_at 
    BEFORE UPDATE ON vip_waitlist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to calculate priority score
CREATE OR REPLACE FUNCTION calculate_vip_priority()
RETURNS trigger AS $$
BEGIN
    -- Calculate priority based on various factors
    NEW.priority_score := 
        CASE NEW.interest_level
            WHEN 'urgent' THEN 100
            WHEN 'high' THEN 75
            WHEN 'medium' THEN 50
            WHEN 'low' THEN 25
            ELSE 50
        END +
        -- Bonus points for phone number provided
        CASE WHEN NEW.phone IS NOT NULL THEN 10 ELSE 0 END +
        -- Bonus points for multiple product interests
        (array_length(NEW.product_interests, 1) * 5) +
        -- Bonus points for referral source
        CASE WHEN NEW.source = 'referral' THEN 15 ELSE 0 END;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for priority calculation
CREATE TRIGGER calculate_vip_priority_trigger
    BEFORE INSERT OR UPDATE ON vip_waitlist
    FOR EACH ROW
    EXECUTE FUNCTION calculate_vip_priority();

-- Create function for waitlist statistics
CREATE OR REPLACE FUNCTION get_vip_waitlist_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_subscribers', COUNT(*),
        'active_subscribers', COUNT(*) FILTER (WHERE status = 'active'),
        'contacted_subscribers', COUNT(*) FILTER (WHERE status = 'contacted'),
        'converted_subscribers', COUNT(*) FILTER (WHERE status = 'converted'),
        'unsubscribed_subscribers', COUNT(*) FILTER (WHERE status = 'unsubscribed'),
        'avg_priority_score', ROUND(AVG(priority_score), 2),
        'high_interest_count', COUNT(*) FILTER (WHERE interest_level = 'high'),
        'urgent_interest_count', COUNT(*) FILTER (WHERE interest_level = 'urgent'),
        'with_phone_count', COUNT(*) FILTER (WHERE phone IS NOT NULL),
        'confirmation_sent_count', COUNT(*) FILTER (WHERE confirmation_sent = true),
        'signup_trend_7d', (
            SELECT COUNT(*) FROM vip_waitlist 
            WHERE created_at >= now() - interval '7 days'
        ),
        'signup_trend_30d', (
            SELECT COUNT(*) FROM vip_waitlist 
            WHERE created_at >= now() - interval '30 days'
        )
    ) INTO result
    FROM vip_waitlist;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to export waitlist for marketing
CREATE OR REPLACE FUNCTION export_vip_waitlist(
    status_filter text DEFAULT NULL,
    interest_filter text DEFAULT NULL
)
RETURNS TABLE(
    email text,
    first_name text,
    last_name text,
    phone text,
    interest_level text,
    product_interests text[],
    priority_score integer,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        w.email,
        w.first_name,
        w.last_name,
        w.phone,
        w.interest_level,
        w.product_interests,
        w.priority_score,
        w.created_at
    FROM vip_waitlist w
    WHERE 
        (status_filter IS NULL OR w.status = status_filter) AND
        (interest_filter IS NULL OR w.interest_level = interest_filter)
    ORDER BY w.priority_score DESC, w.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE vip_waitlist IS 'VIP waitlist for exclusive Bio-Scalar Vest and premium products';
COMMENT ON FUNCTION get_vip_waitlist_stats() IS 'Returns comprehensive statistics for admin dashboard';
COMMENT ON FUNCTION export_vip_waitlist(text, text) IS 'Export filtered waitlist data for marketing campaigns';