-- Product Variants System
-- Supports flexible variant options (size, color, material, etc.) with individual pricing and inventory

-- Product variant option types (size, color, material, etc.)
CREATE TABLE product_variant_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    option_name VARCHAR(50) NOT NULL, -- 'Size', 'Color', 'Material', etc.
    option_values JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['Small', 'Medium', 'Large'] or ['Red', 'Blue', 'Green']
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(product_id, option_name)
);

-- Individual product variants (combinations of options)
CREATE TABLE product_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(200), -- 'Medium Blue Cotton Shirt'
    option_values JSONB NOT NULL DEFAULT '{}'::jsonb, -- {'Size': 'Medium', 'Color': 'Blue', 'Material': 'Cotton'}
    
    -- Pricing (can override product base price)
    price DECIMAL(10,2), -- If null, uses product base price
    compare_at_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    
    -- Inventory (individual tracking per variant)
    inventory_quantity INTEGER DEFAULT 0,
    track_inventory BOOLEAN DEFAULT true,
    allow_backorder BOOLEAN DEFAULT false,
    low_stock_threshold INTEGER DEFAULT 5,
    
    -- Physical properties (can override product values)
    weight DECIMAL(8,2), -- Weight in grams
    dimensions JSONB, -- {length: 10, width: 5, height: 3} in cm
    
    -- Settings
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false, -- One default variant per product
    sort_order INTEGER DEFAULT 0,
    
    -- Images specific to this variant
    images JSONB DEFAULT '[]'::jsonb,
    main_image_index INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_default_variant_per_product 
        EXCLUDE (product_id WITH =) WHERE (is_default = true)
);

-- Update order_items to support variants
ALTER TABLE order_items 
ADD COLUMN variant_id UUID REFERENCES product_variants(id),
ADD COLUMN variant_title VARCHAR(200);

-- Indexes for performance
CREATE INDEX idx_product_variant_options_product_id ON product_variant_options(product_id);
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_is_active ON product_variants(is_active);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- Function to generate variant SKU
CREATE OR REPLACE FUNCTION generate_variant_sku(
    base_sku VARCHAR(50),
    option_values JSONB
) RETURNS VARCHAR(100) AS $$
DECLARE
    variant_suffix VARCHAR(50) := '';
    option_key TEXT;
    option_value TEXT;
BEGIN
    -- Create suffix from option values (e.g., 'SM-BLU' for Size: Small, Color: Blue)
    FOR option_key IN SELECT jsonb_object_keys(option_values)
    LOOP
        option_value := option_values ->> option_key;
        -- Take first 3 characters of each value, uppercase
        variant_suffix := variant_suffix || '-' || UPPER(LEFT(option_value, 3));
    END LOOP;
    
    -- Remove leading dash
    variant_suffix := LTRIM(variant_suffix, '-');
    
    -- Return combined SKU
    RETURN CASE 
        WHEN variant_suffix = '' THEN base_sku
        ELSE base_sku || '-' || variant_suffix
    END;
END;
$$ LANGUAGE plpgsql;

-- Function to update product inventory from variants
CREATE OR REPLACE FUNCTION update_product_inventory_from_variants()
RETURNS TRIGGER AS $$
BEGIN
    -- Update parent product inventory_quantity to sum of all active variants
    UPDATE products 
    SET inventory_quantity = (
        SELECT COALESCE(SUM(inventory_quantity), 0)
        FROM product_variants 
        WHERE product_id = NEW.product_id 
        AND is_active = true
        AND track_inventory = true
    ),
    updated_at = NOW()
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to maintain inventory consistency
CREATE TRIGGER trigger_update_product_inventory_on_variant_change
    AFTER INSERT OR UPDATE OR DELETE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_product_inventory_from_variants();

-- Function to ensure only one default variant per product
CREATE OR REPLACE FUNCTION ensure_single_default_variant()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        -- Unset other default variants for this product
        UPDATE product_variants 
        SET is_default = false, updated_at = NOW()
        WHERE product_id = NEW.product_id 
        AND id != NEW.id 
        AND is_default = true;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_variant
    BEFORE INSERT OR UPDATE ON product_variants
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_variant();

-- Row Level Security (RLS) policies
ALTER TABLE product_variant_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active variants
CREATE POLICY "Public can view active variant options" ON product_variant_options
    FOR SELECT USING (true);

CREATE POLICY "Public can view active variants" ON product_variants
    FOR SELECT USING (is_active = true);

-- Allow authenticated users to manage their own data (admin check done in app)
CREATE POLICY "Authenticated users can manage variant options" ON product_variant_options
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage variants" ON product_variants
    FOR ALL USING (auth.uid() IS NOT NULL);

-- Sample data for testing
INSERT INTO product_variant_options (product_id, option_name, option_values) VALUES 
    -- Assuming we have a product with ID - replace with actual product ID when testing
    -- ('product-uuid-here', 'Size', '["Small", "Medium", "Large", "X-Large"]'),
    -- ('product-uuid-here', 'Color', '["Red", "Blue", "Green", "Black", "White"]');

COMMENT ON TABLE product_variant_options IS 'Defines the variant option types (size, color, etc.) available for each product';
COMMENT ON TABLE product_variants IS 'Individual product variants with specific option combinations, pricing, and inventory';
COMMENT ON FUNCTION generate_variant_sku IS 'Generates SKU codes for variants based on option values';
COMMENT ON FUNCTION update_product_inventory_from_variants IS 'Maintains product inventory totals from variant quantities';