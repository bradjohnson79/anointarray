# ANOINT Array - Deployment Guide

## Overview
This deployment guide covers the complete setup for the ANOINT Array e-commerce platform with live payment processing, shipping rate calculation, and email notifications.

## Prerequisites
- Supabase project with Edge Functions enabled
- Stripe account (with webhook endpoint configured)
- PayPal developer account
- UPS and/or Canada Post API access
- Resend account with domain verification
- Node.js 18+ and npm

## 1. Supabase Setup

### Database Setup
```bash
# Run the migration to create tables
supabase db push

# Or manually run the SQL in supabase/migrations/001_create_orders_table.sql
```

### Edge Functions Deployment
```bash
# Deploy all edge functions
supabase functions deploy get-rates
supabase functions deploy checkout-session
supabase functions deploy send-email
supabase functions deploy stripe-webhook
supabase functions deploy paypal-webhook
```

### Environment Variables (Supabase Dashboard → Settings → Edge Functions)
Set these secrets in your Supabase project:

```bash
supabase secrets set CANPOST_DEV_USERNAME=your_dev_username
supabase secrets set CANPOST_DEV_PASSWORD=your_dev_password
supabase secrets set CANPOST_PROD_USERNAME=your_prod_username
supabase secrets set CANPOST_PROD_PASSWORD=your_prod_password
supabase secrets set UPS_CLIENT_ID=your_ups_client_id
supabase secrets set UPS_SECRET=your_ups_secret
supabase secrets set PAYPAL_CLIENT_ID_SANDBOX=your_paypal_sandbox_client_id
supabase secrets set PAYPAL_CLIENT_SECRET_SANDBOX=your_paypal_sandbox_secret
supabase secrets set PAYPAL_CLIENT_ID_LIVE=your_paypal_live_client_id
supabase secrets set PAYPAL_SECRET_LIVE=your_paypal_live_secret
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key
supabase secrets set STRIPE_PUBLISH_KEY=your_stripe_publishable_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
supabase secrets set RESEND_API_KEY=your_resend_api_key
```

## 2. Frontend Setup

### Environment Variables
Create `.env.local` in the anoint-app directory:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Install Dependencies
```bash
cd anoint-app
npm install
```

### Build and Deploy
```bash
npm run build
# Deploy dist/ folder to your hosting provider (Vercel, Netlify, etc.)
```

## 3. Payment Gateway Setup

### Stripe Configuration
1. Go to Stripe Dashboard → Developers → Webhooks
2. Create endpoint: `https://your-project.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `checkout.session.expired`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### PayPal Configuration
1. Go to PayPal Developer Dashboard
2. Create app for sandbox/live
3. Configure webhook endpoint: `https://your-project.supabase.co/functions/v1/paypal-webhook`
4. Select events:
   - `CHECKOUT.ORDER.APPROVED`
   - `PAYMENT.CAPTURE.COMPLETED`
   - `PAYMENT.CAPTURE.DENIED`
   - `CHECKOUT.ORDER.VOIDED`

## 4. Shipping API Setup

### Canada Post
1. Register for Canada Post Developer Program
2. Get development credentials
3. For production, apply for commercial account

### UPS
1. Register at UPS Developer Kit
2. Create application and get Client ID/Secret
3. Configure for Rating API access

## 5. Email Setup (Resend)

### Domain Configuration
1. Add domain `anointarray.com` to Resend
2. Configure DNS records:
   - TXT record for domain verification
   - MX records for `send.anointarray.com`
3. Verify domain and return-path

### Email Templates
The system uses the built-in HTML email template in `send-email` function.
From addresses configured:
- `orders@anointarray.com` - Order confirmations
- `support@anointarray.com` - Customer support

## 6. Testing

### Test Accounts
- Stripe: Use test card `4242424242424242`
- PayPal: Use sandbox accounts
- Shipping: Test with valid Canadian postal codes

### Test Coupons
Database includes test coupons:
- `SAVE10` - 10% off
- `SAVE20` - 20% off  
- `WELCOME25` - $25 off

### Test Flow
1. Add products to cart
2. Enter shipping address
3. Select shipping option (rates fetched from APIs)
4. Apply coupon code
5. Complete checkout with Stripe or PayPal
6. Verify email receipt sent
7. Check order saved in database

## 7. Production Checklist

### Security
- [ ] All API keys configured as Supabase secrets
- [ ] RLS policies enabled on all tables
- [ ] Webhook signature verification enabled
- [ ] HTTPS enforced on all endpoints

### Monitoring
- [ ] Supabase Edge Function logs monitored
- [ ] Payment webhook delivery monitoring
- [ ] Email delivery tracking via Resend
- [ ] Database performance monitoring

### Business Logic
- [ ] Inventory management integrated
- [ ] Tax calculation (if required)
- [ ] Order fulfillment workflow
- [ ] Customer support integration
- [ ] Analytics tracking

## 8. Support & Maintenance

### Database Maintenance
```sql
-- Update coupon usage counts
UPDATE coupons SET used_count = used_count + 1 WHERE code = 'COUPON_CODE';

-- Archive old orders
UPDATE orders SET status = 'archived' WHERE created_at < NOW() - INTERVAL '1 year';
```

### Monitoring Queries
```sql
-- Daily sales report
SELECT DATE(created_at), COUNT(*), SUM(total_amount) 
FROM orders 
WHERE payment_status = 'completed' 
GROUP BY DATE(created_at) 
ORDER BY DATE(created_at) DESC;

-- Failed payments
SELECT * FROM orders 
WHERE payment_status = 'failed' 
AND created_at > NOW() - INTERVAL '24 hours';
```

## 9. Troubleshooting

### Common Issues
1. **Shipping rates not loading**: Check API credentials and address format
2. **Payment webhooks failing**: Verify webhook URLs and signatures
3. **Emails not sending**: Check Resend API key and domain verification
4. **Database permission errors**: Verify RLS policies and service role key

### Debug Commands
```bash
# Check Edge Function logs
supabase functions logs get-rates
supabase functions logs checkout-session

# Test webhook locally
supabase functions serve --env-file .env.local
```

### Support Contacts
- Supabase: [Supabase Support](https://supabase.com/support)
- Stripe: [Stripe Support](https://support.stripe.com)
- PayPal: [PayPal Developer Support](https://developer.paypal.com/support)
- Resend: [Resend Support](https://resend.com/support)

---

## Architecture Summary

```
Frontend (React/Vite)
    ↓
Supabase Edge Functions
    ├── get-rates → UPS/Canada Post APIs
    ├── checkout-session → Stripe/PayPal APIs
    ├── send-email → Resend API
    ├── stripe-webhook → Order processing
    └── paypal-webhook → Order processing
    ↓
Supabase Database (PostgreSQL)
    ├── orders table
    ├── products table
    └── coupons table
```

This architecture provides a scalable, secure e-commerce solution with real-time shipping rates, multiple payment methods, and automated email notifications.