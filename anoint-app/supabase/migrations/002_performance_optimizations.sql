-- Performance optimizations for ANOINT Array database

-- Add database-level performance settings
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
SELECT pg_reload_conf();

-- Create extension for UUID generation (if not exists)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create extension for better text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for JSONB columns for better search performance
CREATE INDEX IF NOT EXISTS orders_items_gin_idx ON orders USING gin(items);
CREATE INDEX IF NOT EXISTS orders_shipping_address_gin_idx ON orders USING gin(shipping_address);
CREATE INDEX IF NOT EXISTS orders_billing_address_gin_idx ON orders USING gin(billing_address);

-- Optimize commonly queried columns with composite indexes
CREATE INDEX IF NOT EXISTS orders_user_status_created_idx ON orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status, created_at DESC);

-- Add partial indexes for active orders only (performance optimization)
CREATE INDEX IF NOT EXISTS orders_active_idx ON orders(created_at DESC) 
    WHERE status NOT IN ('completed', 'cancelled');

-- Create materialized view for order statistics (admin dashboard)
CREATE MATERIALIZED VIEW IF NOT EXISTS order_stats AS
SELECT 
    date_trunc('day', created_at) as date,
    status,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as avg_order_value
FROM orders 
GROUP BY date_trunc('day', created_at), status
ORDER BY date DESC;

-- Create index on materialized view
CREATE INDEX IF NOT EXISTS order_stats_date_idx ON order_stats(date DESC);

-- Create function to refresh stats (call this periodically)
CREATE OR REPLACE FUNCTION refresh_order_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW order_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for efficient order search
CREATE OR REPLACE FUNCTION search_orders(search_term text)
RETURNS TABLE(
    id uuid,
    order_number text,
    email text,
    status text,
    total_amount decimal,
    created_at timestamptz
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.id,
        o.order_number,
        o.email,
        o.status,
        o.total_amount,
        o.created_at
    FROM orders o
    WHERE 
        o.order_number ILIKE '%' || search_term || '%' OR
        o.email ILIKE '%' || search_term || '%' OR
        o.items::text ILIKE '%' || search_term || '%'
    ORDER BY o.created_at DESC
    LIMIT 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments for documentation
COMMENT ON TABLE orders IS 'Customer orders for ANOINT Array scalar energy products';
COMMENT ON FUNCTION search_orders(text) IS 'Full-text search across orders for admin dashboard';
COMMENT ON MATERIALIZED VIEW order_stats IS 'Daily order statistics for analytics dashboard';