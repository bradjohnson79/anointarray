-- Full E-commerce Database Schema Extension
-- Creates all missing tables for complete e-commerce functionality

-- =======================
-- COUPONS & DISCOUNTS
-- =======================

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percent', 'fixed_amount')),
    value_cents INTEGER NOT NULL, -- For percent: 1000 = 10%, for fixed: actual amount in cents
    description TEXT,
    
    -- Usage restrictions
    max_redemptions INTEGER,
    current_redemptions INTEGER DEFAULT 0,
    min_order_value_cents INTEGER, -- Minimum order value to apply coupon
    
    -- Product/category restrictions
    applicable_to JSONB DEFAULT '{"type": "all"}'::jsonb, -- {type: "all"} or {type: "products", ids: []} or {type: "categories", ids: []}
    
    -- User restrictions
    first_time_only BOOLEAN DEFAULT false,
    user_limit INTEGER DEFAULT NULL, -- Max uses per user
    
    -- Time restrictions
    starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coupon redemptions tracking
CREATE TABLE IF NOT EXISTS coupon_redemptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    order_id UUID NOT NULL, -- Will reference orders(id) when created
    user_id UUID REFERENCES auth.users(id),
    discount_amount_cents INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- SHIPMENTS & LOGISTICS
-- =======================

CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL, -- Will reference orders(id)
    
    -- Carrier information
    carrier VARCHAR(50) NOT NULL CHECK (carrier IN ('ups', 'canadapost', 'fedex', 'dhl', 'purolator')),
    service_type VARCHAR(100) NOT NULL, -- 'Ground', 'Express', 'Overnight', etc.
    
    -- Shipping details
    tracking_number TEXT UNIQUE,
    label_url TEXT,
    rate_data JSONB, -- Original rate quote data
    
    -- Costs
    shipping_cost_cents INTEGER NOT NULL,
    insurance_cost_cents INTEGER DEFAULT 0,
    total_cost_cents INTEGER GENERATED ALWAYS AS (shipping_cost_cents + insurance_cost_cents) STORED,
    
    -- Addresses (normalized)
    from_address JSONB NOT NULL,
    to_address JSONB NOT NULL,
    
    -- Package information
    packages JSONB NOT NULL, -- Array of package details
    total_weight_grams INTEGER,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'label_created', 'in_transit', 'delivered', 'exception', 'returned')),
    shipped_at TIMESTAMP WITH TIME ZONE,
    estimated_delivery TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Tracking events
    tracking_events JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- ARRAYS & CONTENT
-- =======================

CREATE TABLE IF NOT EXISTS arrays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Array metadata
    title TEXT NOT NULL,
    description TEXT,
    array_type VARCHAR(50) DEFAULT 'custom', -- 'custom', 'template', 'generated'
    
    -- Configuration
    dimensions JSONB NOT NULL, -- {width: 800, height: 600, dpi: 300}
    glyph_count INTEGER NOT NULL DEFAULT 0,
    layout_config JSONB DEFAULT '{}'::jsonb, -- Layout parameters
    
    -- Generated files
    png_url TEXT, -- URL to generated PNG
    pdf_url TEXT, -- URL to generated PDF
    thumbnail_url TEXT,
    
    -- File metadata
    file_size_bytes INTEGER,
    generation_time_ms INTEGER,
    
    -- Status
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'generating', 'completed', 'failed')),
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    
    -- Usage tracking
    download_count INTEGER DEFAULT 0,
    view_count INTEGER DEFAULT 0,
    
    -- SEO & Discovery
    tags TEXT[] DEFAULT '{}',
    slug TEXT UNIQUE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Array compositions (many-to-many with glyphs)
CREATE TABLE IF NOT EXISTS array_glyphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    array_id UUID NOT NULL REFERENCES arrays(id) ON DELETE CASCADE,
    glyph_id UUID NOT NULL, -- Will reference glyphs(id)
    
    -- Position and styling
    position_x FLOAT NOT NULL,
    position_y FLOAT NOT NULL,
    rotation FLOAT DEFAULT 0,
    scale FLOAT DEFAULT 1.0,
    opacity FLOAT DEFAULT 1.0,
    
    -- Color overrides
    fill_color VARCHAR(7), -- Hex color #RRGGBB
    stroke_color VARCHAR(7),
    stroke_width FLOAT DEFAULT 0,
    
    -- Layer order
    z_index INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- GLYPHS & ASSETS
-- =======================

CREATE TABLE IF NOT EXISTS glyphs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- Categorization
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    
    -- File information
    image_path TEXT NOT NULL, -- Path in storage bucket
    svg_path TEXT, -- Optional SVG version
    
    -- Visual properties
    dimensions JSONB NOT NULL, -- {width, height, viewBox}
    colors JSONB DEFAULT '[]'::jsonb, -- Extracted color palette
    
    -- Usage & licensing
    is_premium BOOLEAN DEFAULT false,
    license_type VARCHAR(50) DEFAULT 'standard',
    credit_required BOOLEAN DEFAULT false,
    
    -- Metadata for search
    keywords TEXT[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}'::jsonb, -- Flexible metadata
    
    -- Usage statistics
    usage_count INTEGER DEFAULT 0,
    download_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- AFFILIATES & MARKETING
-- =======================

CREATE TABLE IF NOT EXISTS affiliates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Affiliate details
    affiliate_code TEXT UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'active', 'suspended', 'terminated')),
    
    -- Commission structure
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0.1000, -- 10% default
    commission_type VARCHAR(20) DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed')),
    
    -- Minimum payout threshold
    payout_threshold_cents INTEGER DEFAULT 5000, -- $50 minimum
    
    -- Performance tracking
    total_clicks INTEGER DEFAULT 0,
    total_orders INTEGER DEFAULT 0,
    total_sales_cents INTEGER DEFAULT 0,
    total_commissions_cents INTEGER DEFAULT 0,
    total_paid_out_cents INTEGER DEFAULT 0,
    
    -- Payment information
    payment_method JSONB, -- PayPal email, bank details, etc.
    tax_information JSONB, -- Tax ID, business info
    
    -- Referral tracking
    referral_source TEXT, -- How they found the program
    
    -- Timestamps
    approved_at TIMESTAMP WITH TIME ZONE,
    last_payout_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Affiliate clicks tracking
CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
    
    -- Click details
    ip_address INET NOT NULL,
    user_agent TEXT,
    referrer TEXT,
    landing_page TEXT,
    
    -- Geographic info
    country VARCHAR(2),
    city TEXT,
    
    -- Conversion tracking
    converted_to_sale BOOLEAN DEFAULT false,
    order_id UUID, -- Reference to order if converted
    
    -- Timestamps
    clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- WEBHOOKS & INTEGRATIONS
-- =======================

CREATE TABLE IF NOT EXISTS webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Source identification
    source VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', 'nowpayments', 'internal'
    event_type VARCHAR(100) NOT NULL,
    external_id TEXT, -- External event ID for deduplication
    
    -- Payload
    payload JSONB NOT NULL,
    headers JSONB DEFAULT '{}'::jsonb,
    
    -- Processing status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'ignored')),
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    
    -- Processing results
    processed_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    
    -- Related records
    order_id UUID, -- If webhook relates to an order
    user_id UUID REFERENCES auth.users(id),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for external events
    UNIQUE (source, external_id)
);

-- =======================
-- SYSTEM LOGS
-- =======================

CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Log level and classification
    level VARCHAR(20) NOT NULL CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
    category VARCHAR(100) NOT NULL, -- 'auth', 'payment', 'shipping', 'email', 'api', 'system'
    
    -- Message
    message TEXT NOT NULL,
    
    -- Context
    user_id UUID REFERENCES auth.users(id),
    session_id TEXT,
    request_id TEXT,
    
    -- Technical details
    metadata JSONB DEFAULT '{}'::jsonb,
    stack_trace TEXT,
    
    -- Request context
    ip_address INET,
    user_agent TEXT,
    request_url TEXT,
    request_method VARCHAR(10),
    
    -- Timing
    duration_ms INTEGER,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- RATE LIMITING
-- =======================

CREATE TABLE IF NOT EXISTS rate_limits (
    key TEXT PRIMARY KEY,
    count INTEGER NOT NULL DEFAULT 1,
    window_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================
-- INDEXES FOR PERFORMANCE
-- =======================

-- Coupons
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_expires_at ON coupons(expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupon_redemptions_coupon_user ON coupon_redemptions(coupon_id, user_id);

-- Shipments
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number) WHERE tracking_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);

-- Arrays
CREATE INDEX IF NOT EXISTS idx_arrays_user_id ON arrays(user_id);
CREATE INDEX IF NOT EXISTS idx_arrays_status ON arrays(status);
CREATE INDEX IF NOT EXISTS idx_arrays_public ON arrays(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_arrays_featured ON arrays(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_arrays_slug ON arrays(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_array_glyphs_array_id ON array_glyphs(array_id);

-- Glyphs
CREATE INDEX IF NOT EXISTS idx_glyphs_slug ON glyphs(slug);
CREATE INDEX IF NOT EXISTS idx_glyphs_category ON glyphs(category);
CREATE INDEX IF NOT EXISTS idx_glyphs_active ON glyphs(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_glyphs_featured ON glyphs(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_glyphs_keywords ON glyphs USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_glyphs_tags ON glyphs USING GIN(tags);

-- Affiliates
CREATE INDEX IF NOT EXISTS idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX IF NOT EXISTS idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX IF NOT EXISTS idx_affiliates_status ON affiliates(status);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_affiliate_id ON affiliate_clicks(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_date ON affiliate_clicks(clicked_at);

-- Webhooks
CREATE INDEX IF NOT EXISTS idx_webhooks_source_type ON webhooks(source, event_type);
CREATE INDEX IF NOT EXISTS idx_webhooks_status ON webhooks(status);
CREATE INDEX IF NOT EXISTS idx_webhooks_created_at ON webhooks(created_at);
CREATE INDEX IF NOT EXISTS idx_webhooks_order_id ON webhooks(order_id) WHERE order_id IS NOT NULL;

-- Logs
CREATE INDEX IF NOT EXISTS idx_logs_level ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_category ON logs(category);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at);
CREATE INDEX IF NOT EXISTS idx_logs_user_id ON logs(user_id) WHERE user_id IS NOT NULL;

-- Rate limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(window_expires_at);

-- =======================
-- ROW LEVEL SECURITY (RLS)
-- =======================

-- Enable RLS on user-owned tables
ALTER TABLE arrays ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_redemptions ENABLE ROW LEVEL SECURITY;

-- Arrays: Users can only see their own arrays, admins can see all, public arrays visible to all
CREATE POLICY "Users can view own arrays" ON arrays FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own arrays" ON arrays FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own arrays" ON arrays FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own arrays" ON arrays FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Public arrays are visible to all" ON arrays FOR SELECT USING (is_public = true);

-- Admin policies (will be added when admin role system is implemented)
-- CREATE POLICY "Admins can manage all arrays" ON arrays FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Affiliates: Users can only see their own affiliate data
CREATE POLICY "Users can view own affiliate data" ON affiliates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own affiliate data" ON affiliates FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own affiliate data" ON affiliates FOR UPDATE USING (auth.uid() = user_id);

-- Coupon redemptions: Users can only see their own redemptions
CREATE POLICY "Users can view own coupon redemptions" ON coupon_redemptions FOR SELECT USING (auth.uid() = user_id);

-- Public read access for reference tables
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE glyphs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active coupons are publicly readable" ON coupons FOR SELECT USING (is_active = true);
CREATE POLICY "Active glyphs are publicly readable" ON glyphs FOR SELECT USING (is_active = true);

-- System tables (webhooks, logs, etc.) - admin only access
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipments ENABLE ROW LEVEL SECURITY;

-- These will need admin role policies when implemented
-- CREATE POLICY "Admin access to system tables" ON webhooks FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
-- CREATE POLICY "Admin access to logs" ON logs FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
-- CREATE POLICY "Admin access to shipments" ON shipments FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =======================
-- TRIGGERS FOR AUTOMATION
-- =======================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_shipments_updated_at BEFORE UPDATE ON shipments FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_arrays_updated_at BEFORE UPDATE ON arrays FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_glyphs_updated_at BEFORE UPDATE ON glyphs FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_rate_limits_updated_at BEFORE UPDATE ON rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Coupon redemption counter
CREATE OR REPLACE FUNCTION increment_coupon_redemptions()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE coupons 
    SET current_redemptions = current_redemptions + 1 
    WHERE id = NEW.coupon_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_coupon_usage AFTER INSERT ON coupon_redemptions FOR EACH ROW EXECUTE FUNCTION increment_coupon_redemptions();

-- Array slug generation
CREATE OR REPLACE FUNCTION generate_array_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.slug IS NULL THEN
        NEW.slug = lower(regexp_replace(NEW.title, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substring(NEW.id::text from 1 for 8);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_array_slug_trigger BEFORE INSERT ON arrays FOR EACH ROW EXECUTE FUNCTION generate_array_slug();

-- Glyph usage counter
CREATE OR REPLACE FUNCTION increment_glyph_usage()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE glyphs 
    SET usage_count = usage_count + 1 
    WHERE id = NEW.glyph_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_glyph_usage_trigger AFTER INSERT ON array_glyphs FOR EACH ROW EXECUTE FUNCTION increment_glyph_usage();

-- =======================
-- COMMENTS FOR DOCUMENTATION
-- =======================

COMMENT ON TABLE coupons IS 'Discount coupons with flexible rules and usage tracking';
COMMENT ON TABLE coupon_redemptions IS 'Track individual coupon usage per user/order';
COMMENT ON TABLE shipments IS 'Shipping labels, tracking, and logistics management';
COMMENT ON TABLE arrays IS 'User-generated mystical arrays with glyphs and layouts';
COMMENT ON TABLE array_glyphs IS 'Glyph placement and styling within arrays';
COMMENT ON TABLE glyphs IS 'Mystical symbols and icons for array composition';
COMMENT ON TABLE affiliates IS 'Affiliate program management and commission tracking';
COMMENT ON TABLE affiliate_clicks IS 'Click tracking for affiliate links';
COMMENT ON TABLE webhooks IS 'External webhook events processing queue';
COMMENT ON TABLE logs IS 'System and application logging for debugging and monitoring';
COMMENT ON TABLE rate_limits IS 'API and feature rate limiting storage';