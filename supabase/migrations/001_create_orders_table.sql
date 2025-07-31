-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
    id BIGSERIAL PRIMARY KEY,
    customer_email TEXT NOT NULL,
    items JSONB NOT NULL,
    shipping_address JSONB NOT NULL,
    shipping_option JSONB NOT NULL,
    coupon_code TEXT,
    discount DECIMAL(5,2) DEFAULT 0,
    payment_method TEXT NOT NULL CHECK (payment_method IN ('stripe', 'paypal')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'failed')),
    payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    
    -- Payment gateway specific fields
    stripe_session_id TEXT,
    stripe_payment_intent_id TEXT,
    paypal_order_id TEXT,
    paypal_capture_id TEXT,
    
    -- Amounts
    subtotal_amount DECIMAL(10,2),
    shipping_amount DECIMAL(10,2),
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ,
    shipped_at TIMESTAMPTZ,
    
    -- Shipping info
    tracking_number TEXT,
    shipping_carrier TEXT,
    
    -- Notes
    notes TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON public.orders(customer_email);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS orders_stripe_session_idx ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS orders_paypal_order_idx ON public.orders(paypal_order_id);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON public.orders(created_at);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own orders
CREATE POLICY "Users can view own orders" ON public.orders
    FOR SELECT USING (auth.jwt() ->> 'email' = customer_email);

-- Service role can do anything (for webhooks and admin functions)
CREATE POLICY "Service role full access" ON public.orders
    FOR ALL USING (auth.role() = 'service_role');

-- Create products table for catalog
CREATE TABLE IF NOT EXISTS public.products (
    id BIGSERIAL PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    category TEXT,
    tags TEXT[],
    image_url TEXT,
    weight DECIMAL(8,3) DEFAULT 0.5, -- Weight in kg
    stock_quantity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample products
INSERT INTO public.products (title, description, price, category, tags, weight, stock_quantity) VALUES
('AetherX Card Decks: Body, Mind, Energy', 'Transcendental Imbued and Scalar enhanced sacred geometrical cards to detoxify and rejuvenate the body, mind, and energy.', 24.11, 'Cards', ARRAY['healing', 'cards', 'energy'], 0.3, 100),
('ANOINT Manifestation Sphere', 'Manifestation Sphere''s enhanced transcendental and Scalar frequencies designed to help empower manifestation and personal healing.', 111.32, 'Technology', ARRAY['manifestation', 'scalar', '3d-printed'], 0.8, 50),
('ANOINT Pet Collars', 'Transcendental Imbuing & Scalar Enhanced pet collar to charge the cells of your pet encouraging self-healing.', 12.32, 'Pet Products', ARRAY['pets', 'healing', 'collar'], 0.1, 200),
('Wooden Wall Arrays', 'Transcendental Imbuing & Scalar Enhanced wooden rejuvenation wall arrays that can be used for personal healing or hung up to balance environmental energies.', 22.31, 'Arrays', ARRAY['wooden', 'wall', 'healing'], 0.6, 75),
('ANOINT Torus Donut Necklaces', 'Transcendental Imbuing & Scalar Enhanced torus donut necklace to help balance the cells of the body encouraging self-healing.', 12.32, 'Jewelry', ARRAY['jewelry', 'torus', 'healing'], 0.05, 150),
('ANOINT Crystal Bracelets', 'Transcendental Imbuing & Scalar Enhanced crystal bracelets to help balance cells of the body encouraging self-healing.', 12.32, 'Jewelry', ARRAY['jewelry', 'crystal', 'healing'], 0.03, 300)
ON CONFLICT DO NOTHING;

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Anyone can read products
CREATE POLICY "Anyone can view products" ON public.products
    FOR SELECT USING (is_active = true);

-- Only service role can modify products (for admin functions)
CREATE POLICY "Service role can modify products" ON public.products
    FOR ALL USING (auth.role() = 'service_role');

-- Create coupons table
CREATE TABLE IF NOT EXISTS public.coupons (
    id BIGSERIAL PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    expiration_date DATE,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert sample coupons
INSERT INTO public.coupons (code, type, value, expiration_date, usage_limit) VALUES
('SAVE10', 'percentage', 10, '2025-03-01', 100),
('SAVE20', 'percentage', 20, '2025-02-15', 50),
('WELCOME25', 'fixed', 25, '2025-06-01', NULL)
ON CONFLICT DO NOTHING;

-- Enable RLS on coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Anyone can read active coupons (needed for validation)
CREATE POLICY "Anyone can view active coupons" ON public.coupons
    FOR SELECT USING (is_active = true AND (expiration_date IS NULL OR expiration_date >= CURRENT_DATE));

-- Service role can modify coupons
CREATE POLICY "Service role can modify coupons" ON public.coupons
    FOR ALL USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON public.coupons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();