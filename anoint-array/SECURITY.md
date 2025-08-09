# Security Policy

## Reporting Security Vulnerabilities

If you discover a security vulnerability in ANOINT Array, please report it responsibly:

1. **DO NOT** create a public GitHub issue
2. Email details to: info@anoint.me
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if available)

We will acknowledge receipt within 48 hours and provide updates on the fix.

## Security Best Practices

### Environment Variables and Secrets Management

#### ⚠️ CRITICAL RULES ⚠️
- **NEVER HARDCODE** credentials in source files
- **NEVER COMMIT** `.env*` files to Git 
- **ALWAYS USE** Vercel/Supabase dashboard environment variables for production
- **ROTATE KEYS** immediately after any security incident

#### Safe Credential Storage
✅ **CORRECT:**
- Store in Vercel Environment Variables dashboard
- Store in Supabase Project Settings → API
- Use `.env.local` (ignored by Git) for development
- Use placeholder templates like `.env.mcp` (committed as template)

❌ **DANGEROUS:**
- Hardcoding: `const API_KEY = "sk_live_abc123"`
- Committing: `git add .env.production`
- Sharing: Sending credentials via Slack/email

#### Template Files Protocol
1. Create templates with `REPLACE_WITH_YOUR_*` placeholders
2. Add security warnings in comments
3. Always add template extensions to `.gitignore`
4. Document setup instructions clearly

### Recent Security Incidents

#### August 8, 2025 - Vercel Token Exposure
- **Issue**: Hardcoded Vercel API token in `vercel-monitor.sh`
- **Response**: Immediate file deletion, secure replacement created
- **Prevention**: Enhanced .gitignore, template security protocols

#### Supabase Credentials Cleanup
- **Issue**: Multiple files with hardcoded service role keys
- **Files Removed**: 
  - `supabase-database-reset.js` (contained `sbp_92bfde77d9c9bd925002296c9aa54cf03e37297c`)
  - `supabase-schema-executor.js` (contained JWT tokens)
  - `supabase-reset-direct.js` (contained JWT tokens)
- **Prevention**: Added patterns to .gitignore, enhanced security documentation

### Authentication

- Passwords must be at least 8 characters
- Admin accounts should use strong, unique passwords
- Enable 2FA on all service accounts (GitHub, Supabase, etc.)
- Regular audit of user permissions

### API Security

- All admin routes require authentication
- Rate limiting is implemented on all API endpoints
- CSRF protection on state-changing operations
- Input validation on all user inputs

### Payment Security

- PCI compliance through Stripe
- No credit card data stored locally
- Webhook signatures verified
- SSL/TLS required for all transactions

### Data Protection

- User data encrypted at rest (Supabase)
- Secure session management
- No sensitive data in logs
- Regular security audits

## Security Headers

The application implements these security headers:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Content-Security-Policy: [configured for your domain]
```

## Dependencies

- Regular updates of npm packages
- Security audit with `npm audit`
- No known vulnerabilities in production

## Compliance

- GDPR considerations for EU users
- Privacy policy at `/privacy`
- Terms of service at `/terms`
- Data deletion requests honored

## Enhanced Git Security

### .gitignore Security Patterns
The following patterns prevent credential exposure:

```gitignore
# Environment files
.env*
*.env
*.local

# Credential files  
*auth-test*
*test-report*
*credentials*
*secrets*
*.key
*.pem

# Specific security-sensitive files
supabase-database-reset.js
supabase-schema-executor.js
supabase-reset-direct.js
webhook-monitor.js
```

### Pre-Commit Security Checklist
Before each commit, verify:
- [ ] No hardcoded credentials in changed files
- [ ] No `.env*` files being committed
- [ ] All placeholder values use `REPLACE_WITH_YOUR_*` format
- [ ] Security-sensitive files are in .gitignore
- [ ] No temporary test files with real credentials

## Incident Response Protocol

### Immediate Response (0-1 hour)
1. **Contain**: Immediately delete/revoke exposed credentials
2. **Assess**: Identify scope of exposure (files, duration, access)
3. **Secure**: Create secure replacements with environment variables
4. **Document**: Log incident with timestamp and actions taken

### Short-term Response (1-24 hours)  
1. **Rotate**: Generate new credentials for all potentially affected services
2. **Audit**: Check service logs for unauthorized access
3. **Clean**: Remove credentials from Git history if needed
4. **Verify**: Ensure new secure setup works correctly

### Long-term Prevention (24+ hours)
1. **Review**: Update security policies and documentation
2. **Enhance**: Improve .gitignore patterns and templates
3. **Train**: Update team on new security procedures
4. **Monitor**: Set up alerts for future credential exposure

## Contact

Security concerns: info@anoint.me

---

Last reviewed: August 2025