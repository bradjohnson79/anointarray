# Manual Database Migration Guide

## Overview
Due to API limitations, we need to apply the database migrations manually through the Supabase Dashboard. This guide will walk you through the process.

## Prerequisites
- Access to Supabase Dashboard: https://supabase.com/dashboard
- Your project URL: `https://xmnghciitiefbwxzhgrw.supabase.co`

## Migration Files to Apply

### 1. Canadian Tax System Migration
**File:** `supabase/migrations/20250811_create_canadian_tax_system.sql`
**Purpose:** Creates comprehensive Canadian tax management system

**What it creates:**
- `tax_rates` table - Provincial tax rates (GST, HST, PST, QST)
- `tax_settings` table - Business configuration
- Tax calculation functions
- Provincial tax data for all Canadian provinces/territories
- Row Level Security policies

### 2. Enhanced Products & Orders Migration  
**File:** `supabase/migrations/20250811_create_enhanced_products_orders.sql`
**Purpose:** Creates comprehensive e-commerce product and order management

**What it creates:**
- `product_categories` table - Product categorization
- `products` table - Enhanced product management (physical + digital)
- `customer_addresses` table - Customer address management
- `orders` table - Comprehensive order management
- `order_items` table - Order line items
- `order_status_history` table - Order status tracking
- `inventory_transactions` table - Stock management
- Business functions for orders and inventory
- Row Level Security policies

## Step-by-Step Application Process

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Sign in to your account
3. Select your "ANOINT Array" project
4. Navigate to the "SQL Editor" tab

### Step 2: Apply Canadian Tax System Migration
1. In the SQL Editor, create a new query
2. Copy the entire contents of `supabase/migrations/20250811_create_canadian_tax_system.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration
5. Verify success - you should see messages indicating tables were created

### Step 3: Apply Enhanced Products & Orders Migration
1. Create another new query in the SQL Editor
2. Copy the entire contents of `supabase/migrations/20250811_create_enhanced_products_orders.sql`
3. Paste it into the SQL Editor
4. Click "Run" to execute the migration
5. Verify success - you should see messages indicating tables were created

### Step 4: Verify Migration Results
After applying both migrations, verify they worked by checking:

1. **Go to the "Table Editor" tab** in Supabase Dashboard
2. **Confirm these tables exist:**
   - `tax_rates` - Should contain 13 rows (Canadian provinces/territories)
   - `tax_settings` - Should contain 1 row (business settings)
   - `product_categories` - Empty table ready for use
   - `products` - Empty table ready for use  
   - `customer_addresses` - Empty table ready for use
   - `orders` - Empty table ready for use
   - `order_items` - Empty table ready for use
   - `order_status_history` - Empty table ready for use
   - `inventory_transactions` - Empty table ready for use

3. **Test tax calculation function:**
   ```sql
   SELECT calculate_canadian_tax('ON', 100.00, false);
   ```
   This should return JSON with tax calculations for Ontario.

4. **Check tax rates data:**
   ```sql
   SELECT province_code, province_name, tax_type FROM tax_rates ORDER BY province_name;
   ```
   This should show all 13 Canadian provinces/territories.

## Expected Results

### Tax System Features
- **Provincial Tax Support:** All Canadian provinces with correct 2025 tax rates
- **Tax Types:** GST-only, HST, GST+PST, GST+QST (Quebec)
- **Tax Calculation:** Automatic calculation based on province and amount
- **Business Settings:** Configurable company information and tax settings

### E-commerce Features  
- **Product Management:** Physical and digital products with full metadata
- **Inventory Tracking:** Automatic stock management with transaction history
- **Order Processing:** Complete order lifecycle management
- **Customer Management:** Address storage and management
- **Tax Integration:** Automatic tax calculation using Canadian tax system

## Troubleshooting

### Common Issues

1. **"relation already exists" errors:**
   - Some tables might already exist
   - You can skip those specific CREATE TABLE statements
   - Or use `DROP TABLE IF EXISTS table_name;` before creating

2. **Permission denied errors:**
   - Make sure you're using the Service Role key
   - Check that RLS policies allow your operations

3. **Function errors:**
   - Functions depend on tables being created first
   - Apply migrations in the correct order

### Manual Verification Queries

```sql
-- Check all created tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'tax_rates', 'tax_settings', 'product_categories', 
    'products', 'customer_addresses', 'orders', 
    'order_items', 'order_status_history', 'inventory_transactions'
)
ORDER BY table_name;

-- Verify tax rates data
SELECT COUNT(*) as total_provinces FROM tax_rates;

-- Test tax calculation for different provinces
SELECT 
    province_code,
    (calculate_canadian_tax(province_code, 100.00, false)->>'total_tax')::decimal as tax_on_100
FROM tax_rates 
ORDER BY province_code;
```

## Support

If you encounter any issues during the migration:

1. **Check the error messages** carefully - they usually indicate the specific problem
2. **Apply migrations one table at a time** if needed
3. **Use the verification queries** to confirm each step
4. **Check Row Level Security** settings if you have permission issues

The migration files are well-tested and should apply cleanly to a fresh Supabase project.