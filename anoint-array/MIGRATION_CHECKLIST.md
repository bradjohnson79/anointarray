# GitHub Migration Checklist

## ✅ Pre-Migration Security Audit

- [x] `.env.local` is in `.gitignore`
- [x] Created `.env.example` with placeholder values
- [x] No API keys exposed in source code
- [x] Removed PM2 scripts and logs
- [x] Updated all hardcoded localhost URLs to use environment variables
- [x] Replaced all email references with `info@anoint.me`

## ✅ Documentation Created

- [x] `DEPLOYMENT.md` - Comprehensive deployment guide
- [x] `SECURITY.md` - Security best practices
- [x] Updated `README.md` for production
- [x] `.env.example` - Environment template

## ✅ Code Updates

- [x] Converted hardcoded URLs to environment variables:
  - `/app/api/digital/generate/route.ts`
  - `/app/api/merchandise/payment/route.ts`
  - `/lib/fourthwall.ts`
  - `/app/api/merchandise/checkout/route.ts`

- [x] Updated email addresses to `info@anoint.me`:
  - `/app/terms/page.tsx`
  - `/app/privacy/page.tsx`
  - `/lib/auth.ts` (admin emails)
  - Mock user references updated

## 🔲 Final Testing Required

Before pushing to GitHub, test these locally:

- [ ] Authentication flow works
- [ ] Build completes successfully (`npm run build`)
- [ ] Environment variables load correctly
- [ ] No sensitive data in commit history

## 🔲 Git Commands

```bash
# 1. Check git status
git status

# 2. Add all files except sensitive ones
git add -A
git reset HEAD .env.local

# 3. Commit changes
git commit -m "feat: Production-ready migration with security updates

- Implemented Supabase authentication
- Converted all hardcoded URLs to environment variables
- Updated all contact emails to info@anoint.me
- Added comprehensive documentation
- Removed development-only files
- Enhanced security with auth middleware"

# 4. Push to GitHub
git push origin main
```

## 🔲 Post-Migration Tasks

- [ ] Set up environment variables on deployment platform
- [ ] Configure Supabase project settings
- [ ] Test production deployment
- [ ] Set up monitoring and error tracking
- [ ] Configure domain and SSL

## ⚠️ Important Reminders

1. **Never commit** `.env.local` file
2. **Test locally** before pushing
3. **Verify** no sensitive data in commits
4. **Configure** production environment variables
5. **Monitor** deployment for any issues

---

Migration prepared by: ANOINT Array Team
Date: August 2025