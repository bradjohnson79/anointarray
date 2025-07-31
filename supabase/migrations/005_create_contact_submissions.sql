-- Create contact submissions table for logging contact form submissions
CREATE TABLE IF NOT EXISTS public.contact_submissions (
    id BIGSERIAL PRIMARY KEY,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    
    -- Metadata
    user_agent TEXT,
    ip_address TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Email tracking
    email_sent BOOLEAN DEFAULT false,
    email_id TEXT, -- Resend email ID
    email_sent_at TIMESTAMPTZ,
    
    -- Admin tracking
    read_by_admin BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    admin_notes TEXT,
    
    -- Response tracking
    responded BOOLEAN DEFAULT false,
    responded_at TIMESTAMPTZ,
    response_method TEXT, -- 'email', 'phone', 'other'
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
    CONSTRAINT valid_response_method CHECK (response_method IN ('email', 'phone', 'other') OR response_method IS NULL)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS contact_submissions_email_idx ON public.contact_submissions(email);
CREATE INDEX IF NOT EXISTS contact_submissions_submitted_at_idx ON public.contact_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_read_idx ON public.contact_submissions(read_by_admin, submitted_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_responded_idx ON public.contact_submissions(responded, submitted_at DESC);

-- Enable Row Level Security
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can view contact submissions
CREATE POLICY "Admins can view all contact submissions" ON public.contact_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
        )
    );

-- Only admins can update contact submissions (for marking as read, adding notes, etc.)
CREATE POLICY "Admins can update contact submissions" ON public.contact_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.user_profiles 
            WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true
        )
    );

-- Service role has full access for Edge Functions
CREATE POLICY "Service role full access to contact submissions" ON public.contact_submissions
    FOR ALL USING (auth.role() = 'service_role');

-- Function to get contact submission statistics
CREATE OR REPLACE FUNCTION public.get_contact_stats()
RETURNS TABLE (
    total_submissions BIGINT,
    unread_submissions BIGINT,
    submissions_this_month BIGINT,
    submissions_this_week BIGINT,
    response_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_submissions,
        COUNT(*) FILTER (WHERE read_by_admin = false) as unread_submissions,
        COUNT(*) FILTER (WHERE submitted_at >= DATE_TRUNC('month', NOW())) as submissions_this_month,
        COUNT(*) FILTER (WHERE submitted_at >= DATE_TRUNC('week', NOW())) as submissions_this_week,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND(
                    (COUNT(*) FILTER (WHERE responded = true)::NUMERIC / COUNT(*)::NUMERIC) * 100, 
                    2
                )
            ELSE 0
        END as response_rate
    FROM public.contact_submissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark submission as read
CREATE OR REPLACE FUNCTION public.mark_contact_submission_read(submission_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    UPDATE public.contact_submissions 
    SET 
        read_by_admin = true,
        read_at = NOW(),
        updated_at = NOW()
    WHERE id = submission_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark submission as responded
CREATE OR REPLACE FUNCTION public.mark_contact_submission_responded(
    submission_id BIGINT, 
    response_method TEXT DEFAULT 'email'
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if current user is admin
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Admin role required.';
    END IF;
    
    UPDATE public.contact_submissions 
    SET 
        responded = true,
        responded_at = NOW(),
        response_method = mark_contact_submission_responded.response_method,
        read_by_admin = true, -- Mark as read if responding
        read_at = COALESCE(read_at, NOW()),
        updated_at = NOW()
    WHERE id = submission_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add trigger to update updated_at timestamp
CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON public.contact_submissions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_contact_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_contact_submission_read(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_contact_submission_responded(BIGINT, TEXT) TO authenticated;

COMMENT ON TABLE public.contact_submissions IS 'Contact form submissions with admin tracking and response management';