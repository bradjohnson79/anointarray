-- Create VIP waitlist table for Bio-Scalar Vest early access
CREATE TABLE IF NOT EXISTS public.vip_waitlist (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional fields for better tracking
    ip_address TEXT,
    user_agent TEXT,
    referrer TEXT,
    confirmed BOOLEAN DEFAULT false,
    confirmed_at TIMESTAMPTZ,
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS vip_waitlist_email_idx ON public.vip_waitlist(email);
CREATE INDEX IF NOT EXISTS vip_waitlist_created_at_idx ON public.vip_waitlist(created_at DESC);
CREATE INDEX IF NOT EXISTS vip_waitlist_confirmed_idx ON public.vip_waitlist(confirmed) WHERE confirmed = true;

-- Enable Row Level Security
ALTER TABLE public.vip_waitlist ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can insert their own record (public signup)
CREATE POLICY "Anyone can sign up for VIP waitlist" ON public.vip_waitlist
    FOR INSERT WITH CHECK (true);

-- Only authenticated users can view their own entry
CREATE POLICY "Users can view own VIP signup" ON public.vip_waitlist
    FOR SELECT USING (email = auth.jwt() ->> 'email');

-- Service role has full access (for admin functions)
CREATE POLICY "Service role full access to VIP waitlist" ON public.vip_waitlist
    FOR ALL USING (auth.role() = 'service_role');

-- Function to check if email already exists (for frontend validation)
CREATE OR REPLACE FUNCTION public.check_vip_email_exists(check_email TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (SELECT 1 FROM public.vip_waitlist WHERE email = check_email);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get VIP waitlist stats (for admin dashboard)
CREATE OR REPLACE FUNCTION public.get_vip_waitlist_stats()
RETURNS TABLE (
    total_signups BIGINT,
    confirmed_signups BIGINT,
    signups_last_7_days BIGINT,
    signups_last_30_days BIGINT,
    latest_signup TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_signups,
        COUNT(*) FILTER (WHERE confirmed = true)::BIGINT as confirmed_signups,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days')::BIGINT as signups_last_7_days,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::BIGINT as signups_last_30_days,
        MAX(created_at) as latest_signup
    FROM public.vip_waitlist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some test data (optional - remove in production)
-- INSERT INTO public.vip_waitlist (name, email, confirmed, confirmed_at) VALUES
-- ('John Doe', 'john@example.com', true, NOW()),
-- ('Jane Smith', 'jane@example.com', false, NULL),
-- ('Energy Enthusiast', 'energy@example.com', true, NOW() - INTERVAL '2 days')
-- ON CONFLICT (email) DO NOTHING;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.check_vip_email_exists(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_vip_waitlist_stats() TO authenticated;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_vip_waitlist_updated_at BEFORE UPDATE ON public.vip_waitlist
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.vip_waitlist IS 'VIP waitlist for ANOINT Bio-Scalar Vest early access signups';