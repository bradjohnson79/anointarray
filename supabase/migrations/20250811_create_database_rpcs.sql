-- Database RPCs (Remote Procedure Calls)
-- Business logic functions for e-commerce operations

-- =======================
-- COUPON VALIDATION & APPLICATION
-- =======================

CREATE OR REPLACE FUNCTION apply_coupon(
    coupon_code TEXT,
    subtotal_cents INTEGER,
    user_id_param UUID DEFAULT NULL,
    product_ids UUID[] DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    coupon_record RECORD;
    discount_amount INTEGER := 0;
    result JSONB;
    user_redemption_count INTEGER := 0;
BEGIN
    -- Find the coupon
    SELECT * INTO coupon_record 
    FROM coupons 
    WHERE code = coupon_code 
    AND is_active = true 
    AND (starts_at IS NULL OR starts_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW());

    -- Check if coupon exists and is valid
    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Coupon not found or expired',
            'discount_cents', 0
        );
    END IF;

    -- Check redemption limits
    IF coupon_record.max_redemptions IS NOT NULL AND 
       coupon_record.current_redemptions >= coupon_record.max_redemptions THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', 'Coupon has reached maximum redemptions',
            'discount_cents', 0
        );
    END IF;

    -- Check minimum order value
    IF coupon_record.min_order_value_cents IS NOT NULL AND 
       subtotal_cents < coupon_record.min_order_value_cents THEN
        RETURN jsonb_build_object(
            'valid', false,
            'error', format('Minimum order value is $%s', (coupon_record.min_order_value_cents / 100.0)),
            'discount_cents', 0
        );
    END IF;

    -- Check user-specific limits
    IF user_id_param IS NOT NULL THEN
        -- Check if first-time only
        IF coupon_record.first_time_only THEN
            SELECT COUNT(*) INTO user_redemption_count
            FROM coupon_redemptions
            WHERE user_id = user_id_param;
            
            IF user_redemption_count > 0 THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', 'Coupon is for first-time customers only',
                    'discount_cents', 0
                );
            END IF;
        END IF;

        -- Check per-user limit
        IF coupon_record.user_limit IS NOT NULL THEN
            SELECT COUNT(*) INTO user_redemption_count
            FROM coupon_redemptions
            WHERE coupon_id = coupon_record.id AND user_id = user_id_param;
            
            IF user_redemption_count >= coupon_record.user_limit THEN
                RETURN jsonb_build_object(
                    'valid', false,
                    'error', format('You have already used this coupon %s time(s)', coupon_record.user_limit),
                    'discount_cents', 0
                );
            END IF;
        END IF;
    END IF;

    -- Calculate discount
    IF coupon_record.type = 'percent' THEN
        discount_amount := (subtotal_cents * coupon_record.value_cents) / 10000; -- value_cents is in basis points
    ELSE -- fixed_amount
        discount_amount := coupon_record.value_cents;
    END IF;

    -- Don't allow discount to exceed order value
    IF discount_amount > subtotal_cents THEN
        discount_amount := subtotal_cents;
    END IF;

    -- Return success result
    RETURN jsonb_build_object(
        'valid', true,
        'discount_cents', discount_amount,
        'coupon_id', coupon_record.id,
        'coupon_code', coupon_record.code,
        'description', coupon_record.description
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- ORDER CREATION FROM CART
-- =======================

CREATE OR REPLACE FUNCTION create_order_from_cart(
    user_id_param UUID,
    cart_items JSONB,
    coupon_code_param TEXT DEFAULT NULL,
    shipping_option JSONB DEFAULT NULL,
    billing_address JSONB DEFAULT NULL,
    shipping_address JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    order_id UUID;
    subtotal INTEGER := 0;
    tax_total INTEGER := 0;
    shipping_total INTEGER := 0;
    discount_total INTEGER := 0;
    final_total INTEGER := 0;
    coupon_result JSONB;
    item JSONB;
    product_record RECORD;
BEGIN
    -- Generate order ID
    order_id := gen_random_uuid();

    -- Calculate subtotal from cart items
    FOR item IN SELECT * FROM jsonb_array_elements(cart_items)
    LOOP
        -- Validate product exists and get current price
        SELECT price, tax_rate INTO product_record
        FROM products 
        WHERE id = (item->>'product_id')::UUID
        AND status = 'published'
        AND is_visible = true;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Product % not found or not available', item->>'product_id';
        END IF;

        subtotal := subtotal + (product_record.price * (item->>'quantity')::INTEGER);
    END LOOP;

    -- Apply coupon if provided
    IF coupon_code_param IS NOT NULL THEN
        SELECT apply_coupon(coupon_code_param, subtotal, user_id_param) INTO coupon_result;
        
        IF (coupon_result->>'valid')::BOOLEAN THEN
            discount_total := (coupon_result->>'discount_cents')::INTEGER;
        ELSE
            RAISE EXCEPTION 'Coupon error: %', coupon_result->>'error';
        END IF;
    END IF;

    -- Calculate shipping
    IF shipping_option IS NOT NULL THEN
        shipping_total := (shipping_option->>'cost_cents')::INTEGER;
    END IF;

    -- Calculate tax (simplified - use tax calculation service for production)
    tax_total := ROUND((subtotal - discount_total) * 0.13); -- 13% HST for Ontario

    -- Final total
    final_total := subtotal + tax_total + shipping_total - discount_total;

    -- Create the order
    INSERT INTO orders (
        id,
        user_id,
        order_number,
        status,
        financial_status,
        fulfillment_status,
        
        -- Totals
        subtotal,
        tax_total,
        shipping_total,
        discount_total,
        total,
        
        -- Addresses
        billing_address,
        shipping_address,
        
        -- Metadata
        items_data
    ) VALUES (
        order_id,
        user_id_param,
        'ORD-' || to_char(NOW(), 'YYYYMMDD') || '-' || UPPER(substr(order_id::text, 1, 8)),
        'pending',
        'pending',
        'unfulfilled',
        
        subtotal,
        tax_total,
        shipping_total,
        discount_total,
        final_total,
        
        billing_address,
        COALESCE(shipping_address, billing_address),
        
        cart_items
    );

    -- Create order items
    FOR item IN SELECT * FROM jsonb_array_elements(cart_items)
    LOOP
        SELECT * INTO product_record FROM products WHERE id = (item->>'product_id')::UUID;
        
        INSERT INTO order_items (
            order_id,
            product_id,
            variant_id,
            sku,
            title,
            price,
            quantity,
            total
        ) VALUES (
            order_id,
            (item->>'product_id')::UUID,
            CASE WHEN item->>'variant_id' != 'null' THEN (item->>'variant_id')::UUID ELSE NULL END,
            product_record.sku,
            product_record.title,
            product_record.price,
            (item->>'quantity')::INTEGER,
            product_record.price * (item->>'quantity')::INTEGER
        );
    END LOOP;

    -- Record coupon redemption if applicable
    IF coupon_code_param IS NOT NULL AND discount_total > 0 THEN
        INSERT INTO coupon_redemptions (
            coupon_id,
            order_id,
            user_id,
            discount_amount_cents
        ) VALUES (
            (coupon_result->>'coupon_id')::UUID,
            order_id,
            user_id_param,
            discount_total
        );
    END IF;

    RETURN order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- SHIPPING RATES CALCULATION
-- =======================

CREATE OR REPLACE FUNCTION get_live_shipping_rates(
    origin_address JSONB,
    destination_address JSONB,
    packages JSONB
) RETURNS JSONB AS $$
DECLARE
    cache_key TEXT;
    cached_rates JSONB;
    rates_result JSONB;
BEGIN
    -- Create cache key from addresses and packages
    cache_key := 'shipping_rates:' || md5(
        (origin_address::text || destination_address::text || packages::text)
    );

    -- Try to get from cache first (if Redis is available)
    -- This would be handled by the edge function in practice
    
    -- For now, return mock rates based on destination
    -- In production, this would call UPS/Canada Post APIs
    
    CASE 
        WHEN destination_address->>'country' = 'CA' THEN
            rates_result := jsonb_build_array(
                jsonb_build_object(
                    'carrier', 'canadapost',
                    'service', 'Regular Parcel',
                    'cost_cents', 1200,
                    'delivery_days', 3,
                    'guaranteed', false
                ),
                jsonb_build_object(
                    'carrier', 'canadapost',
                    'service', 'Expedited Parcel',
                    'cost_cents', 2400,
                    'delivery_days', 2,
                    'guaranteed', false
                ),
                jsonb_build_object(
                    'carrier', 'ups',
                    'service', 'UPS Ground',
                    'cost_cents', 1500,
                    'delivery_days', 3,
                    'guaranteed', true
                )
            );
        WHEN destination_address->>'country' = 'US' THEN
            rates_result := jsonb_build_array(
                jsonb_build_object(
                    'carrier', 'ups',
                    'service', 'UPS Ground',
                    'cost_cents', 2500,
                    'delivery_days', 5,
                    'guaranteed', true
                ),
                jsonb_build_object(
                    'carrier', 'ups',
                    'service', 'UPS 2nd Day Air',
                    'cost_cents', 4200,
                    'delivery_days', 2,
                    'guaranteed', true
                )
            );
        ELSE
            rates_result := jsonb_build_array(
                jsonb_build_object(
                    'carrier', 'ups',
                    'service', 'UPS Worldwide Expedited',
                    'cost_cents', 8500,
                    'delivery_days', 7,
                    'guaranteed', true
                )
            );
    END CASE;

    RETURN jsonb_build_object(
        'success', true,
        'rates', rates_result,
        'cached', false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- USER ANALYTICS & INSIGHTS
-- =======================

CREATE OR REPLACE FUNCTION get_user_analytics(user_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_orders INTEGER;
    total_spent INTEGER;
    arrays_created INTEGER;
    favorite_category TEXT;
BEGIN
    -- Get basic stats
    SELECT 
        COUNT(*),
        COALESCE(SUM(total), 0)
    INTO total_orders, total_spent
    FROM orders 
    WHERE user_id = user_id_param 
    AND financial_status = 'paid';

    -- Get arrays created
    SELECT COUNT(*) INTO arrays_created
    FROM arrays 
    WHERE user_id = user_id_param;

    -- Get favorite glyph category
    SELECT g.category INTO favorite_category
    FROM array_glyphs ag
    JOIN arrays a ON a.id = ag.array_id
    JOIN glyphs g ON g.id = ag.glyph_id
    WHERE a.user_id = user_id_param
    GROUP BY g.category
    ORDER BY COUNT(*) DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'total_orders', total_orders,
        'total_spent_cents', total_spent,
        'arrays_created', arrays_created,
        'favorite_category', COALESCE(favorite_category, 'none')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- PRODUCT SEARCH & FILTERING
-- =======================

CREATE OR REPLACE FUNCTION search_products(
    search_term TEXT DEFAULT NULL,
    category_filter TEXT DEFAULT NULL,
    min_price_cents INTEGER DEFAULT NULL,
    max_price_cents INTEGER DEFAULT NULL,
    tags_filter TEXT[] DEFAULT NULL,
    limit_count INTEGER DEFAULT 20,
    offset_count INTEGER DEFAULT 0
) RETURNS JSONB AS $$
DECLARE
    products_result JSONB;
    total_count INTEGER;
BEGIN
    -- Build the query with filters
    WITH filtered_products AS (
        SELECT *
        FROM products
        WHERE status = 'published'
        AND is_visible = true
        AND (search_term IS NULL OR 
             title ILIKE '%' || search_term || '%' OR 
             description ILIKE '%' || search_term || '%' OR
             sku ILIKE '%' || search_term || '%')
        AND (category_filter IS NULL OR category = category_filter)
        AND (min_price_cents IS NULL OR price >= min_price_cents)
        AND (max_price_cents IS NULL OR price <= max_price_cents)
        AND (tags_filter IS NULL OR tags && tags_filter)
    )
    SELECT 
        jsonb_agg(
            jsonb_build_object(
                'id', id,
                'title', title,
                'description', description,
                'price', price,
                'images', images,
                'category', category,
                'tags', tags,
                'sku', sku
            )
        ),
        COUNT(*) OVER()
    INTO products_result, total_count
    FROM filtered_products
    ORDER BY created_at DESC
    LIMIT limit_count
    OFFSET offset_count;

    RETURN jsonb_build_object(
        'products', COALESCE(products_result, '[]'::jsonb),
        'total_count', COALESCE(total_count, 0),
        'page_size', limit_count,
        'offset', offset_count
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- INVENTORY MANAGEMENT
-- =======================

CREATE OR REPLACE FUNCTION update_inventory_on_order(order_id_param UUID)
RETURNS VOID AS $$
DECLARE
    item RECORD;
BEGIN
    -- Decrease inventory for each order item
    FOR item IN 
        SELECT product_id, variant_id, quantity
        FROM order_items
        WHERE order_id = order_id_param
    LOOP
        IF item.variant_id IS NOT NULL THEN
            -- Update variant inventory
            UPDATE product_variants
            SET inventory_quantity = inventory_quantity - item.quantity,
                updated_at = NOW()
            WHERE id = item.variant_id
            AND track_inventory = true;
        ELSE
            -- Update product inventory
            UPDATE products
            SET inventory_quantity = inventory_quantity - item.quantity,
                updated_at = NOW()
            WHERE id = item.product_id
            AND track_inventory = true;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- ADMIN DASHBOARD STATS
-- =======================

CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    total_users INTEGER;
    total_orders INTEGER;
    total_revenue_cents INTEGER;
    orders_today INTEGER;
    pending_orders INTEGER;
    low_stock_products INTEGER;
BEGIN
    -- Get user count
    SELECT COUNT(*) INTO total_users FROM auth.users;

    -- Get order stats
    SELECT 
        COUNT(*),
        COALESCE(SUM(total), 0)
    INTO total_orders, total_revenue_cents
    FROM orders
    WHERE financial_status = 'paid';

    -- Orders today
    SELECT COUNT(*) INTO orders_today
    FROM orders
    WHERE DATE(created_at) = CURRENT_DATE;

    -- Pending orders
    SELECT COUNT(*) INTO pending_orders
    FROM orders
    WHERE status IN ('pending', 'processing')
    AND financial_status != 'cancelled';

    -- Low stock products
    SELECT COUNT(*) INTO low_stock_products
    FROM products
    WHERE track_inventory = true
    AND inventory_quantity <= low_stock_threshold;

    RETURN jsonb_build_object(
        'total_users', total_users,
        'total_orders', total_orders,
        'total_revenue_cents', total_revenue_cents,
        'orders_today', orders_today,
        'pending_orders', pending_orders,
        'low_stock_products', low_stock_products
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- LOGGING HELPER
-- =======================

CREATE OR REPLACE FUNCTION log_event(
    level_param TEXT,
    category_param TEXT,
    message_param TEXT,
    user_id_param UUID DEFAULT NULL,
    metadata_param JSONB DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    INSERT INTO logs (
        level,
        category,
        message,
        user_id,
        metadata
    ) VALUES (
        level_param,
        category_param,
        message_param,
        user_id_param,
        COALESCE(metadata_param, '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- RATE LIMITING FUNCTIONS
-- =======================

CREATE OR REPLACE FUNCTION check_rate_limit(
    key_param TEXT,
    limit_count INTEGER,
    window_seconds INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    current_count INTEGER := 0;
    window_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    window_expires_at := NOW() + (window_seconds || ' seconds')::INTERVAL;
    
    -- Try to update existing record
    UPDATE rate_limits
    SET count = count + 1,
        updated_at = NOW()
    WHERE key = key_param 
    AND window_expires_at > NOW()
    RETURNING count INTO current_count;
    
    -- If no record found or window expired, create new one
    IF NOT FOUND THEN
        INSERT INTO rate_limits (key, count, window_expires_at)
        VALUES (key_param, 1, window_expires_at)
        ON CONFLICT (key) DO UPDATE SET
            count = 1,
            window_expires_at = window_expires_at,
            updated_at = NOW();
        current_count := 1;
    END IF;
    
    -- Return whether limit is exceeded
    RETURN current_count <= limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- PERMISSIONS
-- =======================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION apply_coupon TO authenticated;
GRANT EXECUTE ON FUNCTION create_order_from_cart TO authenticated;
GRANT EXECUTE ON FUNCTION get_live_shipping_rates TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_analytics TO authenticated;
GRANT EXECUTE ON FUNCTION search_products TO authenticated;
GRANT EXECUTE ON FUNCTION search_products TO anon; -- Allow anonymous product search

-- Admin functions (will need proper admin role in production)
GRANT EXECUTE ON FUNCTION get_admin_dashboard_stats TO authenticated;
GRANT EXECUTE ON FUNCTION update_inventory_on_order TO authenticated;

-- System functions
GRANT EXECUTE ON FUNCTION log_event TO authenticated;
GRANT EXECUTE ON FUNCTION check_rate_limit TO authenticated;

-- =======================
-- COMMENTS
-- =======================

COMMENT ON FUNCTION apply_coupon IS 'Validates and calculates discount for a coupon code';
COMMENT ON FUNCTION create_order_from_cart IS 'Creates a complete order from cart items with totals calculation';
COMMENT ON FUNCTION get_live_shipping_rates IS 'Returns shipping options and rates for given addresses';
COMMENT ON FUNCTION get_user_analytics IS 'Returns user activity and purchase analytics';
COMMENT ON FUNCTION search_products IS 'Full-text product search with filtering and pagination';
COMMENT ON FUNCTION update_inventory_on_order IS 'Decreases inventory counts when order is placed';
COMMENT ON FUNCTION get_admin_dashboard_stats IS 'Returns key metrics for admin dashboard';
COMMENT ON FUNCTION log_event IS 'Helper function for structured application logging';
COMMENT ON FUNCTION check_rate_limit IS 'Rate limiting implementation using database storage';