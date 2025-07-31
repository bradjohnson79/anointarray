-- Create contact submissions table for contact form
CREATE TABLE IF NOT EXISTS contact_submissions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Contact information
    name text NOT NULL,
    email text NOT NULL,
    phone text,
    company text,
    
    -- Message details
    subject text,
    message text NOT NULL,
    category text DEFAULT 'general' CHECK (category IN (
        'general', 'support', 'sales', 'partnership', 
        'technical', 'billing', 'feedback', 'press'
    )),
    
    -- Admin workflow
    status text DEFAULT 'new' CHECK (status IN (
        'new', 'in_progress', 'responded', 'resolved', 'closed'
    )),
    priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    assigned_to_user_id uuid REFERENCES user_profiles(user_id),
    
    -- Response tracking
    responded_at timestamp with time zone,
    responded_by_user_id uuid REFERENCES user_profiles(user_id),
    response_notes text,
    internal_notes text, -- Admin-only notes
    
    -- Spam prevention and tracking
    user_agent text,
    ip_address inet,
    honeypot_field text, -- Should always be empty for real submissions
    submission_time_seconds integer, -- Time taken to fill form (spam detection)
    
    -- Source tracking
    referrer_url text,
    utm_source text,
    utm_medium text,
    utm_campaign text,
    page_url text,
    
    -- Email delivery tracking
    email_sent boolean DEFAULT false,
    email_sent_at timestamp with time zone,
    email_delivery_status text,
    email_error_message text,
    
    -- Follow-up tracking
    follow_up_required boolean DEFAULT false,
    follow_up_date date,
    follow_up_completed boolean DEFAULT false,
    
    -- Customer relationship
    is_existing_customer boolean DEFAULT false,
    customer_user_id uuid REFERENCES user_profiles(user_id),
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS contact_submissions_email_idx ON contact_submissions(email);
CREATE INDEX IF NOT EXISTS contact_submissions_status_idx ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS contact_submissions_category_idx ON contact_submissions(category);
CREATE INDEX IF NOT EXISTS contact_submissions_priority_idx ON contact_submissions(priority);
CREATE INDEX IF NOT EXISTS contact_submissions_created_at_idx ON contact_submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_assigned_to_idx ON contact_submissions(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS contact_submissions_customer_idx ON contact_submissions(customer_user_id);

-- Composite indexes for admin dashboard queries
CREATE INDEX IF NOT EXISTS contact_submissions_status_priority_created_idx 
    ON contact_submissions(status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS contact_submissions_unresponded_idx 
    ON contact_submissions(created_at DESC) WHERE responded_at IS NULL;

-- Enable Row Level Security
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admins can view all contact submissions" ON contact_submissions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Admins can update all contact submissions" ON contact_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

CREATE POLICY "Users can view their own submissions" ON contact_submissions
    FOR SELECT USING (
        customer_user_id = auth.uid() OR 
        email = (SELECT email FROM user_profiles WHERE user_id = auth.uid())
    );

-- Anyone can create contact submissions (public contact form)
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions
    FOR INSERT WITH CHECK (true);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_submissions_updated_at 
    BEFORE UPDATE ON contact_submissions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Function to auto-assign priority based on keywords
CREATE OR REPLACE FUNCTION auto_assign_contact_priority()
RETURNS trigger AS $$
BEGIN
    -- Auto-assign high priority for urgent keywords
    IF NEW.message ILIKE '%urgent%' OR 
       NEW.message ILIKE '%emergency%' OR 
       NEW.message ILIKE '%asap%' OR
       NEW.subject ILIKE '%urgent%' OR
       NEW.category = 'technical' THEN
        NEW.priority := 'high';
    END IF;
    
    -- Check if this is from an existing customer
    SELECT user_id INTO NEW.customer_user_id 
    FROM user_profiles 
    WHERE email = NEW.email 
    LIMIT 1;
    
    IF NEW.customer_user_id IS NOT NULL THEN
        NEW.is_existing_customer := true;
        -- VIP customers get higher priority
        IF EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_id = NEW.customer_user_id 
            AND (is_vip_member = true OR role = 'vip')
        ) THEN
            NEW.priority := CASE 
                WHEN NEW.priority = 'low' THEN 'normal'
                WHEN NEW.priority = 'normal' THEN 'high'
                ELSE NEW.priority
            END;
        END IF;
    END IF;
    
    -- Spam detection
    IF NEW.honeypot_field IS NOT NULL AND NEW.honeypot_field != '' THEN
        NEW.status := 'closed';
        NEW.internal_notes := 'Flagged as spam: honeypot field filled';
    END IF;
    
    -- Suspicious submission time (too fast = likely bot)
    IF NEW.submission_time_seconds IS NOT NULL AND NEW.submission_time_seconds < 5 THEN
        NEW.priority := 'low';
        NEW.internal_notes := COALESCE(NEW.internal_notes || E'\n', '') || 
                             'Fast submission time: ' || NEW.submission_time_seconds || 's';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-assignment
CREATE TRIGGER auto_assign_contact_priority_trigger
    BEFORE INSERT ON contact_submissions
    FOR EACH ROW
    EXECUTE FUNCTION auto_assign_contact_priority();

-- Function to get contact submission statistics
CREATE OR REPLACE FUNCTION get_contact_stats()
RETURNS json AS $$
DECLARE
    result json;
BEGIN
    SELECT json_build_object(
        'total_submissions', COUNT(*),
        'new_submissions', COUNT(*) FILTER (WHERE status = 'new'),
        'in_progress_submissions', COUNT(*) FILTER (WHERE status = 'in_progress'),
        'responded_submissions', COUNT(*) FILTER (WHERE status = 'responded'),
        'resolved_submissions', COUNT(*) FILTER (WHERE status = 'resolved'),
        'high_priority_submissions', COUNT(*) FILTER (WHERE priority = 'high'),
        'urgent_submissions', COUNT(*) FILTER (WHERE priority = 'urgent'),
        'unassigned_submissions', COUNT(*) FILTER (WHERE assigned_to_user_id IS NULL),
        'overdue_submissions', COUNT(*) FILTER (WHERE 
            status IN ('new', 'in_progress') AND 
            created_at < now() - interval '24 hours'
        ),
        'avg_response_time_hours', (
            SELECT ROUND(AVG(EXTRACT(EPOCH FROM (responded_at - created_at))/3600), 2)
            FROM contact_submissions 
            WHERE responded_at IS NOT NULL
        ),
        'submissions_7d', (
            SELECT COUNT(*) FROM contact_submissions 
            WHERE created_at >= now() - interval '7 days'
        ),
        'submissions_30d', (
            SELECT COUNT(*) FROM contact_submissions 
            WHERE created_at >= now() - interval '30 days'
        ),
        'category_breakdown', (
            SELECT json_object_agg(category, cnt)
            FROM (
                SELECT category, COUNT(*) as cnt 
                FROM contact_submissions 
                GROUP BY category
            ) t
        )
    ) INTO result
    FROM contact_submissions;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search contact submissions
CREATE OR REPLACE FUNCTION search_contact_submissions(search_term text)
RETURNS TABLE(
    id uuid,
    name text,
    email text,
    subject text,
    category text,
    status text,
    priority text,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.email,
        c.subject,
        c.category,
        c.status,
        c.priority,
        c.created_at
    FROM contact_submissions c
    WHERE 
        c.name ILIKE '%' || search_term || '%' OR
        c.email ILIKE '%' || search_term || '%' OR
        c.subject ILIKE '%' || search_term || '%' OR
        c.message ILIKE '%' || search_term || '%' OR
        c.company ILIKE '%' || search_term || '%'
    ORDER BY 
        CASE WHEN c.priority = 'urgent' THEN 1
             WHEN c.priority = 'high' THEN 2
             WHEN c.priority = 'normal' THEN 3
             ELSE 4 END,
        c.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to export contact submissions for CRM
CREATE OR REPLACE FUNCTION export_contact_submissions(
    status_filter text DEFAULT NULL,
    category_filter text DEFAULT NULL,
    date_from timestamp with time zone DEFAULT NULL,
    date_to timestamp with time zone DEFAULT NULL
)
RETURNS TABLE(
    id uuid,
    name text,
    email text,
    phone text,
    company text,
    subject text,
    message text,
    category text,
    status text,
    priority text,
    is_existing_customer boolean,
    created_at timestamptz,
    responded_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.email,
        c.phone,
        c.company,
        c.subject,
        c.message,
        c.category,
        c.status,
        c.priority,
        c.is_existing_customer,
        c.created_at,
        c.responded_at
    FROM contact_submissions c
    WHERE 
        (status_filter IS NULL OR c.status = status_filter) AND
        (category_filter IS NULL OR c.category = category_filter) AND
        (date_from IS NULL OR c.created_at >= date_from) AND
        (date_to IS NULL OR c.created_at <= date_to)
    ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE contact_submissions IS 'Contact form submissions with admin workflow and spam prevention';
COMMENT ON FUNCTION auto_assign_contact_priority() IS 'Automatically assigns priority and detects spam in contact submissions';
COMMENT ON FUNCTION get_contact_stats() IS 'Returns comprehensive contact submission statistics for admin dashboard';
COMMENT ON FUNCTION search_contact_submissions(text) IS 'Full-text search across contact submissions';
COMMENT ON FUNCTION export_contact_submissions(text, text, timestamptz, timestamptz) IS 'Export filtered contact submissions for CRM integration';