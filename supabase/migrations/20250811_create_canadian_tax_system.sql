-- Canadian Tax System Schema
-- Create comprehensive tax management for GST/HST/PST across all provinces

-- Tax rates table for provincial tax configuration
CREATE TABLE tax_rates (
    id SERIAL PRIMARY KEY,
    province_code VARCHAR(2) NOT NULL UNIQUE,
    province_name VARCHAR(50) NOT NULL,
    gst_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0500,  -- 5% GST
    hst_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,  -- HST (where applicable)
    pst_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,  -- Provincial Sales Tax
    qst_rate DECIMAL(5,4) NOT NULL DEFAULT 0.0000,  -- Quebec Sales Tax
    tax_type VARCHAR(10) NOT NULL CHECK (tax_type IN ('GST_ONLY', 'HST', 'GST_PST', 'GST_QST')),
    effective_date DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tax configuration settings
CREATE TABLE tax_settings (
    id SERIAL PRIMARY KEY,
    business_number VARCHAR(20) NOT NULL DEFAULT '743839342RT0001',
    company_name VARCHAR(100) NOT NULL DEFAULT 'ANOINT Array',
    company_address JSONB NOT NULL DEFAULT '{}',
    registration_threshold DECIMAL(10,2) DEFAULT 30000.00,
    tax_calculation_method VARCHAR(20) DEFAULT 'INCLUSIVE' CHECK (tax_calculation_method IN ('INCLUSIVE', 'EXCLUSIVE')),
    invoice_prefix VARCHAR(10) DEFAULT 'INV',
    invoice_counter INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert 2025 Canadian tax rates
INSERT INTO tax_rates (province_code, province_name, gst_rate, hst_rate, pst_rate, qst_rate, tax_type) VALUES
-- HST Provinces (Harmonized Sales Tax)
('ON', 'Ontario', 0.0000, 0.1300, 0.0000, 0.0000, 'HST'),
('NS', 'Nova Scotia', 0.0000, 0.1400, 0.0000, 0.0000, 'HST'),  -- Reduced from 15% to 14% in 2025
('NB', 'New Brunswick', 0.0000, 0.1500, 0.0000, 0.0000, 'HST'),
('NL', 'Newfoundland and Labrador', 0.0000, 0.1500, 0.0000, 0.0000, 'HST'),
('PE', 'Prince Edward Island', 0.0000, 0.1500, 0.0000, 0.0000, 'HST'),

-- GST + PST Provinces
('BC', 'British Columbia', 0.0500, 0.0000, 0.0700, 0.0000, 'GST_PST'),
('SK', 'Saskatchewan', 0.0500, 0.0000, 0.0600, 0.0000, 'GST_PST'),
('MB', 'Manitoba', 0.0500, 0.0000, 0.0700, 0.0000, 'GST_PST'),
('QC', 'Quebec', 0.0500, 0.0000, 0.0000, 0.09975, 'GST_QST'),

-- GST Only Provinces/Territories
('AB', 'Alberta', 0.0500, 0.0000, 0.0000, 0.0000, 'GST_ONLY'),
('NT', 'Northwest Territories', 0.0500, 0.0000, 0.0000, 0.0000, 'GST_ONLY'),
('NU', 'Nunavut', 0.0500, 0.0000, 0.0000, 0.0000, 'GST_ONLY'),
('YT', 'Yukon', 0.0500, 0.0000, 0.0000, 0.0000, 'GST_ONLY');

-- Insert default tax settings
INSERT INTO tax_settings (
    business_number,
    company_name,
    company_address,
    registration_threshold
) VALUES (
    '743839342RT0001',
    'ANOINT Array',
    '{
        "street": "",
        "city": "",
        "province": "",
        "postal_code": "",
        "country": "Canada"
    }',
    30000.00
);

-- Function to calculate tax for a given province and amount
CREATE OR REPLACE FUNCTION calculate_canadian_tax(
    province_code_param VARCHAR(2),
    amount_param DECIMAL(10,2),
    tax_inclusive BOOLEAN DEFAULT false
)
RETURNS JSONB AS $$
DECLARE
    tax_info RECORD;
    base_amount DECIMAL(10,2);
    gst_amount DECIMAL(10,2) := 0;
    hst_amount DECIMAL(10,2) := 0;
    pst_amount DECIMAL(10,2) := 0;
    qst_amount DECIMAL(10,2) := 0;
    total_tax DECIMAL(10,2) := 0;
    total_amount DECIMAL(10,2);
    result JSONB;
BEGIN
    -- Get tax rates for the province
    SELECT * INTO tax_info
    FROM tax_rates
    WHERE province_code = UPPER(province_code_param)
    AND is_active = true
    LIMIT 1;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tax rates not found for province: %', province_code_param;
    END IF;
    
    -- Calculate base amount (before tax)
    IF tax_inclusive THEN
        -- If amount includes tax, extract the base amount
        CASE tax_info.tax_type
            WHEN 'HST' THEN
                base_amount := amount_param / (1 + tax_info.hst_rate);
                hst_amount := amount_param - base_amount;
            WHEN 'GST_PST' THEN
                base_amount := amount_param / (1 + tax_info.gst_rate + tax_info.pst_rate);
                gst_amount := base_amount * tax_info.gst_rate;
                pst_amount := base_amount * tax_info.pst_rate;
            WHEN 'GST_QST' THEN
                -- QST is calculated on GST-inclusive amount in Quebec
                base_amount := amount_param / (1 + tax_info.gst_rate + tax_info.qst_rate * (1 + tax_info.gst_rate));
                gst_amount := base_amount * tax_info.gst_rate;
                qst_amount := (base_amount + gst_amount) * tax_info.qst_rate;
            WHEN 'GST_ONLY' THEN
                base_amount := amount_param / (1 + tax_info.gst_rate);
                gst_amount := amount_param - base_amount;
        END CASE;
    ELSE
        -- If amount excludes tax, calculate tax on the full amount
        base_amount := amount_param;
        
        CASE tax_info.tax_type
            WHEN 'HST' THEN
                hst_amount := base_amount * tax_info.hst_rate;
            WHEN 'GST_PST' THEN
                gst_amount := base_amount * tax_info.gst_rate;
                pst_amount := base_amount * tax_info.pst_rate;
            WHEN 'GST_QST' THEN
                gst_amount := base_amount * tax_info.gst_rate;
                qst_amount := (base_amount + gst_amount) * tax_info.qst_rate;
            WHEN 'GST_ONLY' THEN
                gst_amount := base_amount * tax_info.gst_rate;
        END CASE;
    END IF;
    
    -- Calculate totals
    total_tax := gst_amount + hst_amount + pst_amount + qst_amount;
    total_amount := base_amount + total_tax;
    
    -- Build result JSON
    result := jsonb_build_object(
        'province_code', tax_info.province_code,
        'province_name', tax_info.province_name,
        'tax_type', tax_info.tax_type,
        'base_amount', ROUND(base_amount, 2),
        'tax_breakdown', jsonb_build_object(
            'gst', jsonb_build_object(
                'rate', tax_info.gst_rate,
                'amount', ROUND(gst_amount, 2)
            ),
            'hst', jsonb_build_object(
                'rate', tax_info.hst_rate,
                'amount', ROUND(hst_amount, 2)
            ),
            'pst', jsonb_build_object(
                'rate', tax_info.pst_rate,
                'amount', ROUND(pst_amount, 2)
            ),
            'qst', jsonb_build_object(
                'rate', tax_info.qst_rate,
                'amount', ROUND(qst_amount, 2)
            )
        ),
        'total_tax', ROUND(total_tax, 2),
        'total_amount', ROUND(total_amount, 2)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to get tax summary for all provinces (useful for admin dashboard)
CREATE OR REPLACE FUNCTION get_all_tax_rates()
RETURNS JSONB AS $$
DECLARE
    result JSONB := '[]'::jsonb;
    tax_record RECORD;
BEGIN
    FOR tax_record IN 
        SELECT * FROM tax_rates 
        WHERE is_active = true 
        ORDER BY province_name
    LOOP
        result := result || jsonb_build_object(
            'province_code', tax_record.province_code,
            'province_name', tax_record.province_name,
            'tax_type', tax_record.tax_type,
            'gst_rate', tax_record.gst_rate,
            'hst_rate', tax_record.hst_rate,
            'pst_rate', tax_record.pst_rate,
            'qst_rate', tax_record.qst_rate,
            'total_rate', CASE
                WHEN tax_record.tax_type = 'HST' THEN tax_record.hst_rate
                WHEN tax_record.tax_type = 'GST_PST' THEN tax_record.gst_rate + tax_record.pst_rate
                WHEN tax_record.tax_type = 'GST_QST' THEN tax_record.gst_rate + tax_record.qst_rate + (tax_record.gst_rate * tax_record.qst_rate)
                WHEN tax_record.tax_type = 'GST_ONLY' THEN tax_record.gst_rate
                ELSE 0
            END
        );
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_tax_rates_updated_at
    BEFORE UPDATE ON tax_rates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tax_settings_updated_at
    BEFORE UPDATE ON tax_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX idx_tax_rates_province_code ON tax_rates(province_code);
CREATE INDEX idx_tax_rates_active ON tax_rates(is_active);
CREATE INDEX idx_tax_rates_effective_date ON tax_rates(effective_date);

-- Row Level Security (RLS)
ALTER TABLE tax_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE tax_settings ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can modify tax settings
CREATE POLICY "Admin can view tax rates" ON tax_rates
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can modify tax rates" ON tax_rates
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can view tax settings" ON tax_settings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can modify tax settings" ON tax_settings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Grant permissions
GRANT SELECT ON tax_rates TO authenticated;
GRANT EXECUTE ON FUNCTION calculate_canadian_tax(VARCHAR(2), DECIMAL(10,2), BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_all_tax_rates() TO authenticated;