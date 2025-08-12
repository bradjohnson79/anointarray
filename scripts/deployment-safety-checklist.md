# ANOINT Array Deployment Safety Checklist

## ⚠️ CRITICAL: Run Before Every Deployment

This checklist prevents the accidental deletion of critical files that occurred on August 11, 2025.

### 🔍 Pre-Deployment Verification Steps

#### 1. Run Automated Safety Checks
```bash
npm run pre-deploy-check
```
**Must Pass:** All critical files verified ✅

#### 2. Frontend Verification (8 Marketing Pages)
- [ ] `/about` - About ANOINT Array page exists
- [ ] `/contact` - Contact form page exists  
- [ ] `/products` - Product catalog page exists
- [ ] `/vip-products` - VIP products redirect exists
- [ ] `/anoint-array` - Array generator redirect exists
- [ ] `/privacy` - Privacy policy page exists
- [ ] `/terms` - Terms & conditions page exists
- [ ] `/disclaimer` - Legal disclaimer page exists

#### 3. Authentication Flow Verification (3 Auth Pages)
- [ ] `/login` - Login page with redirect handling
- [ ] `/signup` - User registration page
- [ ] `/forgot-password` - Password recovery page

#### 4. Admin Dashboard Verification (5 Admin Pages)
- [ ] `/admin` - Admin dashboard main page
- [ ] `/admin/users` - User management page
- [ ] `/admin/orders` - Order management page  
- [ ] `/admin/products` - Product management page
- [ ] `/admin/analytics` - Analytics dashboard page

#### 5. Core Application Verification (5 App Pages)
- [ ] `/member/dashboard` - Member dashboard
- [ ] `/cart` - Shopping cart page
- [ ] `/catalog` - Product catalog page
- [ ] `/checkout` - Checkout flow page
- [ ] `/generator` - Array generator page

#### 6. Backend API Verification (25+ Critical Routes)
- [ ] Payment APIs: Stripe, PayPal, NowPayments
- [ ] Generator APIs: Create payment, generate, verify
- [ ] Admin APIs: Backup, cache, user management
- [ ] Product APIs: CRUD operations, categories
- [ ] Webhook APIs: Payment processing
- [ ] Authentication APIs: Password changes
- [ ] Digital delivery APIs: Token-based downloads

#### 7. Configuration Verification
- [ ] `package.json` - Dependencies and scripts
- [ ] `tsconfig.json` - TypeScript configuration
- [ ] `next.config.ts` - Next.js build settings
- [ ] `middleware.ts` - Route protection
- [ ] Environment files (`.env.local`, `.env.production`)
- [ ] `netlify.toml` - Deployment configuration

#### 8. Navigation Integrity Check
- [ ] Homepage navigation links work (header menu)
- [ ] Mobile navigation menu links work
- [ ] Footer links work (privacy, terms, disclaimer)
- [ ] All internal routing functional

### 🚀 Deployment Process

#### Step 1: Pre-Deployment
```bash
# 1. Run full safety checks
npm run pre-deploy-check

# 2. Run build verification
npm run build

# 3. Run type checking
npm run ts:check

# 4. Optional: Run tests if available
npm test
```

#### Step 2: Deploy Only After All Checks Pass
```bash
# Netlify deployment
netlify deploy --prod

# OR Vercel deployment  
vercel --prod

# OR Manual deployment
git push origin main
```

#### Step 3: Post-Deployment Verification
- [ ] Test all marketing page links: `/about`, `/contact`, `/products`
- [ ] Test authentication flow: Login, signup, password recovery
- [ ] Test admin dashboard access (admin users only)
- [ ] Test payment processing (test mode)
- [ ] Test array generator functionality
- [ ] Verify no 404 errors on critical pages

### 🚨 Red Flags - STOP DEPLOYMENT

If any of these conditions are true, **DO NOT DEPLOY**:

❌ Pre-deployment script fails  
❌ Any marketing page returns 404  
❌ Build process fails  
❌ TypeScript errors present  
❌ Missing critical API routes  
❌ Authentication pages not accessible  
❌ Admin dashboard broken  
❌ Navigation links broken  
❌ Environment variables missing  

### 📋 Emergency Recovery Plan

If files are accidentally deleted during deployment:

1. **Stop deployment immediately**
2. **Do not commit or push changes**
3. **Restore from git history:**
   ```bash
   git show <commit-before-deletion>:path/to/file > restored-file
   ```
4. **Run pre-deployment checks to verify restoration**
5. **Re-deploy only after verification**

### 🔧 Automation Integration

Add to `package.json` scripts:
```json
{
  "scripts": {
    "pre-deploy-check": "node scripts/pre-deployment-checks.js",
    "deploy-safe": "npm run pre-deploy-check && npm run build && echo 'Ready for deployment'",
    "deploy-netlify": "npm run deploy-safe && netlify deploy --prod",
    "deploy-vercel": "npm run deploy-safe && vercel --prod"
  }
}
```

### 📝 Deployment Log Template

**Date:** ___________  
**Deployer:** ___________  
**Branch:** ___________  
**Commit:** ___________  

**Pre-Deployment Checks:**
- [ ] Safety script passed  
- [ ] Build successful  
- [ ] All critical files verified  
- [ ] Navigation links tested  

**Post-Deployment Verification:**
- [ ] Marketing pages accessible  
- [ ] Authentication flow working  
- [ ] Admin dashboard functional  
- [ ] Payment processing working  
- [ ] No 404 errors detected  

**Notes:** ________________________________

---

**Remember: The August 11, 2025 incident taught us that even small oversights can cause major issues. Always verify before deploying!** 🛡️