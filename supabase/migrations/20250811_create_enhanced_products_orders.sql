-- Enhanced Product and Order Management System
-- Comprehensive schema for e-commerce functionality with Canadian tax integration

-- Product categories table
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES product_categories(id),
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    seo_title VARCHAR(200),
    seo_description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Enhanced products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sku VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    images JSONB DEFAULT '[]'::jsonb,  -- Array of image URLs
    main_image_index INTEGER DEFAULT 0,
    price DECIMAL(10,2) NOT NULL,
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),  -- For profit calculations
    category_id UUID REFERENCES product_categories(id),
    keywords JSONB DEFAULT '[]'::jsonb,  -- Array of keywords for search
    product_type VARCHAR(20) NOT NULL CHECK (product_type IN ('physical', 'digital')),
    
    -- Digital product fields
    digital_file_url VARCHAR(500),
    file_size BIGINT,  -- Size in bytes
    download_limit INTEGER DEFAULT -1,  -- -1 = unlimited
    license_type VARCHAR(50),  -- e.g., 'personal', 'commercial'
    
    -- Physical product fields
    weight DECIMAL(8,2),  -- Weight in grams
    dimensions JSONB,  -- {length: 10, width: 5, height: 3} in cm
    inventory_quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Common fields
    instructions_pdf_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    is_visible BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    requires_shipping BOOLEAN DEFAULT true,
    is_taxable BOOLEAN DEFAULT true,
    related_products JSONB DEFAULT '[]'::jsonb,  -- Array of product IDs
    
    -- SEO fields
    meta_title VARCHAR(200),
    meta_description TEXT,
    meta_keywords TEXT,
    
    -- Analytics
    view_count INTEGER DEFAULT 0,
    purchase_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    published_at TIMESTAMP
);

-- Customer addresses table
CREATE TABLE customer_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('billing', 'shipping', 'both')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company VARCHAR(100),
    address_line_1 VARCHAR(200) NOT NULL,
    address_line_2 VARCHAR(200),
    city VARCHAR(100) NOT NULL,
    province VARCHAR(2) NOT NULL,
    postal_code VARCHAR(10) NOT NULL,
    country VARCHAR(2) DEFAULT 'CA',
    phone VARCHAR(20),
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(20) UNIQUE NOT NULL,
    user_id UUID REFERENCES user_profiles(id),
    guest_email VARCHAR(255),  -- For guest checkouts
    
    -- Customer information
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    
    -- Billing address
    billing_first_name VARCHAR(100) NOT NULL,
    billing_last_name VARCHAR(100) NOT NULL,
    billing_company VARCHAR(100),
    billing_address_line_1 VARCHAR(200) NOT NULL,
    billing_address_line_2 VARCHAR(200),
    billing_city VARCHAR(100) NOT NULL,
    billing_province VARCHAR(2) NOT NULL,
    billing_postal_code VARCHAR(10) NOT NULL,
    billing_country VARCHAR(2) DEFAULT 'CA',
    
    -- Shipping address (nullable if same as billing)
    shipping_first_name VARCHAR(100),
    shipping_last_name VARCHAR(100),
    shipping_company VARCHAR(100),
    shipping_address_line_1 VARCHAR(200),
    shipping_address_line_2 VARCHAR(200),
    shipping_city VARCHAR(100),
    shipping_province VARCHAR(2),
    shipping_postal_code VARCHAR(10),
    shipping_country VARCHAR(2),
    
    -- Order amounts
    subtotal DECIMAL(10,2) NOT NULL,
    shipping_cost DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    tax_amount DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Tax breakdown (calculated based on province)
    tax_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Order status and fulfillment
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
    fulfillment_status VARCHAR(20) DEFAULT 'unfulfilled' CHECK (fulfillment_status IN ('unfulfilled', 'partial', 'fulfilled')),
    financial_status VARCHAR(20) DEFAULT 'pending' CHECK (financial_status IN ('pending', 'paid', 'partially_paid', 'refunded', 'partially_refunded', 'voided')),
    
    -- Payment information
    payment_method VARCHAR(50),
    payment_status VARCHAR(20) DEFAULT 'pending',
    payment_reference VARCHAR(100),
    transaction_id VARCHAR(100),
    
    -- Shipping information
    shipping_method VARCHAR(100),
    tracking_number VARCHAR(100),
    shipped_at TIMESTAMP,
    delivered_at TIMESTAMP,
    
    -- Additional information
    notes TEXT,
    admin_notes TEXT,
    discount_code VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    cancelled_at TIMESTAMP
);

-- Order items table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    variant_id UUID,  -- For future product variants
    
    -- Item details at time of purchase
    sku VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    variant_title VARCHAR(200),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Product snapshot (store product details at time of order)
    product_snapshot JSONB NOT NULL,
    
    -- Fulfillment
    fulfilled_quantity INTEGER DEFAULT 0,
    requires_shipping BOOLEAN DEFAULT true,
    is_digital BOOLEAN DEFAULT false,
    download_url VARCHAR(500),  -- For digital products
    download_expires_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Order status history table for tracking changes
CREATE TABLE order_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    comment TEXT,
    notify_customer BOOLEAN DEFAULT false,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Inventory transactions table for tracking stock changes
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id),
    transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('sale', 'restock', 'adjustment', 'return')),
    quantity_change INTEGER NOT NULL,  -- Negative for reductions, positive for increases
    quantity_after INTEGER NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_by UUID REFERENCES user_profiles(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Functions for order management

-- Generate unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    counter INTEGER;
    order_number VARCHAR(20);
BEGIN
    -- Get next counter from tax_settings (reusing the invoice_counter)
    SELECT invoice_counter INTO counter FROM tax_settings LIMIT 1;
    
    -- Generate order number: ORD-YYYYMMDD-NNNN
    order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(counter::TEXT, 4, '0');
    
    -- Update counter
    UPDATE tax_settings SET invoice_counter = counter + 1;
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate order totals with Canadian taxes
CREATE OR REPLACE FUNCTION calculate_order_total(
    subtotal_param DECIMAL(10,2),
    shipping_cost_param DECIMAL(10,2),
    discount_amount_param DECIMAL(10,2),
    province_code_param VARCHAR(2)
)
RETURNS JSONB AS $$
DECLARE
    taxable_amount DECIMAL(10,2);
    tax_calculation JSONB;
    result JSONB;
BEGIN
    -- Calculate taxable amount (subtotal + shipping - discount)
    taxable_amount := subtotal_param + shipping_cost_param - discount_amount_param;
    
    -- Calculate tax using our Canadian tax function
    tax_calculation := calculate_canadian_tax(province_code_param, taxable_amount, false);
    
    -- Build result with all calculations
    result := jsonb_build_object(
        'subtotal', subtotal_param,
        'shipping_cost', shipping_cost_param,
        'discount_amount', discount_amount_param,
        'taxable_amount', taxable_amount,
        'tax_calculation', tax_calculation,
        'tax_amount', (tax_calculation->>'total_tax')::DECIMAL(10,2),
        'total_amount', taxable_amount + (tax_calculation->>'total_tax')::DECIMAL(10,2)
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to update product inventory
CREATE OR REPLACE FUNCTION update_product_inventory(
    product_id_param UUID,
    quantity_change_param INTEGER,
    transaction_type_param VARCHAR(20),
    reference_param VARCHAR(100) DEFAULT NULL,
    notes_param TEXT DEFAULT NULL,
    created_by_param UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    current_quantity INTEGER;
    new_quantity INTEGER;
BEGIN
    -- Get current inventory
    SELECT inventory_quantity INTO current_quantity
    FROM products
    WHERE id = product_id_param;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', product_id_param;
    END IF;
    
    -- Calculate new quantity
    new_quantity := current_quantity + quantity_change_param;
    
    -- Prevent negative inventory (unless it's a sale and backorders are allowed)
    IF new_quantity < 0 AND transaction_type_param != 'sale' THEN
        RAISE EXCEPTION 'Insufficient inventory. Current: %, Requested change: %', current_quantity, quantity_change_param;
    END IF;
    
    -- Update product inventory
    UPDATE products
    SET inventory_quantity = new_quantity,
        updated_at = NOW()
    WHERE id = product_id_param;
    
    -- Record transaction
    INSERT INTO inventory_transactions (
        product_id,
        transaction_type,
        quantity_change,
        quantity_after,
        reference,
        notes,
        created_by
    ) VALUES (
        product_id_param,
        transaction_type_param,
        quantity_change_param,
        new_quantity,
        reference_param,
        notes_param,
        created_by_param
    );
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at columns
CREATE TRIGGER update_product_categories_updated_at
    BEFORE UPDATE ON product_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customer_addresses_updated_at
    BEFORE UPDATE ON customer_addresses
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_is_visible ON products(is_visible);
CREATE INDEX idx_products_is_featured ON products(is_featured);
CREATE INDEX idx_products_created_at ON products(created_at);

CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_billing_province ON orders(billing_province);

CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

CREATE INDEX idx_inventory_transactions_product_id ON inventory_transactions(product_id);
CREATE INDEX idx_inventory_transactions_created_at ON inventory_transactions(created_at);

-- Row Level Security
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Product categories: Public read, admin write
CREATE POLICY "Anyone can view active categories" ON product_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin can manage categories" ON product_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Products: Public read for visible products, admin write
CREATE POLICY "Anyone can view published products" ON products
    FOR SELECT USING (status = 'published' AND is_visible = true);

CREATE POLICY "Admin can manage products" ON products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Customer addresses: Users can manage their own
CREATE POLICY "Users can manage their addresses" ON customer_addresses
    FOR ALL USING (user_id = auth.uid());

-- Orders: Users can view their own orders, admins can view all
CREATE POLICY "Users can view their orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin can view all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can manage orders" ON orders
    FOR INSERT, UPDATE, DELETE USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Order items: Follow same pattern as orders
CREATE POLICY "Users can view their order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

CREATE POLICY "Admin can view all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Admin-only policies for management tables
CREATE POLICY "Admin can manage order status history" ON order_status_history
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

CREATE POLICY "Admin can manage inventory transactions" ON inventory_transactions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles 
            WHERE user_profiles.id = auth.uid() 
            AND user_profiles.is_admin = true
        )
    );

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;