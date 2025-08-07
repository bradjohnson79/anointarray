# ANOINT Array - Production Deployment Guide

This guide provides step-by-step instructions for deploying the ANOINT Array website to production.

## Prerequisites

- Node.js 18.x or higher
- npm or yarn package manager
- Git
- Access to deployment platform (Vercel, Netlify, or similar)
- All required API keys and credentials

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/bradjohnson79/anointarray.git
cd anointarray
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

1. Copy the environment template:
```bash
cp .env.example .env.local
```

2. Edit `.env.local` and fill in all required values:

#### Essential Variables

```env
# Supabase (Required for authentication)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com

# Admin Account
SUPABASE_ADMIN_EMAIL=info@anoint.me
SUPABASE_ADMIN_PASSWORD=secure_password_here
```

#### Payment Services

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_PUBLISH_KEY=pk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# PayPal
PAYPAL_CLIENT_ID_LIVE=xxx
PAYPAL_SECRET_LIVE=xxx

# NowPayments (Crypto)
NOWPAYMENTS_API_KEY=xxx
```

#### AI Services

```env
# OpenAI (Optional - for ChatGPT integration)
OPENAI_API_KEY=sk-xxx

# Anthropic (Required for Array Generation)
ANTHROPIC_API_KEY=sk-ant-xxx
```

#### Other Services

```env
# Email
RESEND_API_KEY=re_xxx

# Fourthwall Merchandise
FOURTHWALL_API_USERNAME=xxx
FOURTHWALL_API_PASSWORD=xxx
FOURTHWALL_STOREFRONT_TOKEN=xxx
FOURTHWALL_SHOP_URL=https://fourthwall.com/shop/anoint-array

# Shipping
CANPOST_PROD_USERNAME=xxx
CANPOST_PROD_PASSWORD=xxx
UPS_CLIENT_ID=xxx
UPS_SECRET=xxx
```

## Deployment Platforms

### Vercel (Recommended)

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel --prod
```

3. Set environment variables in Vercel dashboard:
   - Go to your project settings
   - Navigate to "Environment Variables"
   - Add all variables from `.env.local`

### Netlify

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Build and deploy:
```bash
npm run build
netlify deploy --prod --dir=.next
```

3. Set environment variables in Netlify dashboard

### Manual Server Deployment

1. Build the application:
```bash
npm run build
```

2. Set environment variables on your server

3. Start the production server:
```bash
npm start
```

## Post-Deployment Checklist

### 1. Database Setup

- [ ] Ensure Supabase project is configured
- [ ] Run any necessary database migrations
- [ ] Create admin user profile in Supabase

### 2. Payment Integration

- [ ] Configure Stripe webhook endpoints
- [ ] Set up PayPal IPN notifications
- [ ] Test payment flows in production

### 3. Security

- [ ] Verify all environment variables are set
- [ ] Check CORS settings for your domain
- [ ] Ensure HTTPS is enabled
- [ ] Test authentication flows

### 4. Functionality Testing

- [ ] Test user registration and login
- [ ] Verify array generation works
- [ ] Check payment processing
- [ ] Test email notifications
- [ ] Verify merchandise integration

### 5. Performance

- [ ] Enable caching headers
- [ ] Configure CDN if applicable
- [ ] Test page load speeds
- [ ] Verify image optimization

## Monitoring

### Application Health

- Monitor error logs in your deployment platform
- Set up uptime monitoring (e.g., UptimeRobot)
- Configure error tracking (e.g., Sentry)

### Performance Metrics

- Use Google Analytics or similar
- Monitor Core Web Vitals
- Track conversion rates

## Troubleshooting

### Common Issues

1. **Authentication not working**
   - Verify Supabase URL and keys
   - Check CORS settings in Supabase

2. **Payment failures**
   - Ensure production API keys are used
   - Verify webhook endpoints are accessible

3. **Array generation errors**
   - Check Anthropic API key is valid
   - Monitor API rate limits

4. **Email not sending**
   - Verify Resend API key
   - Check spam folders

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=true
```

## Support

For deployment support or issues:
- Email: info@anoint.me
- GitHub Issues: https://github.com/bradjohnson79/anointarray/issues

## Security Notes

- Never commit `.env.local` to version control
- Rotate API keys regularly
- Use strong passwords for admin accounts
- Enable 2FA where possible
- Monitor for suspicious activity

---

Last updated: August 2025