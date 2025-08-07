# Pre-Deployment Validation

Run comprehensive checks before deploying ANOINT Array to production.

## Environment Verification
- **Environment Variables**: Verify all required variables are set correctly
- **API Keys**: Confirm all third-party service keys are valid and active
- **Database**: Check Supabase connection and schema integrity
- **Payment Systems**: Validate Stripe, PayPal, and NowPayments integration

## Build & Code Quality
- **TypeScript**: Ensure no type errors (`npm run build`)
- **Linting**: Run ESLint and fix any critical issues
- **Security Scan**: Check for exposed secrets or vulnerabilities
- **Performance**: Verify bundle size and load times

## Functionality Testing
- **Authentication**: Test login, logout, and role-based access
- **Array Generation**: Verify AI-powered generation works with proper API keys
- **Payment Processing**: Test all payment methods in sandbox mode
- **Email Delivery**: Confirm transactional emails send correctly
- **Mobile Experience**: Validate PWA functionality and responsive design

## Security Checklist
- [ ] No API keys or secrets in source code
- [ ] All admin routes protected with authentication middleware
- [ ] HTTPS enforced for all environments
- [ ] CORS properly configured for production domain
- [ ] Rate limiting active on API endpoints
- [ ] Input validation implemented on all user inputs

## Performance Optimization
- **Image Optimization**: Ensure all images are properly optimized
- **Code Splitting**: Verify dynamic imports and lazy loading
- **Caching Headers**: Check browser and CDN caching configuration
- **Bundle Analysis**: Review webpack bundle for optimization opportunities

## Production Configuration
- **Domain Setup**: SSL certificate and DNS configuration
- **Error Monitoring**: Sentry or similar error tracking configured
- **Analytics**: Google Analytics or similar tracking implemented
- **Backup Strategy**: Database backup and recovery procedures

## Post-Deployment Verification
- [ ] All pages load without errors
- [ ] Authentication flows work correctly
- [ ] Payment processing functions in live mode
- [ ] Email notifications send properly
- [ ] Mobile app experience works across devices
- [ ] Performance metrics meet expectations

## Rollback Plan
- **Previous Version**: Maintain ability to rollback quickly
- **Database Migrations**: Ensure migrations are reversible
- **Environment Restore**: Keep previous environment configuration
- **Monitoring**: Active monitoring for first 24 hours post-deployment

---

Run this checklist before every production deployment to ensure reliability and security.

*Arguments: $ARGUMENTS*