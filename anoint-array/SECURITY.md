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

### Environment Variables

- **Never commit** `.env.local` or any file containing secrets
- Use `.env.example` as a template only
- Rotate API keys regularly
- Use different keys for development and production

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

## Incident Response

In case of a security incident:

1. Isolate affected systems
2. Assess the impact
3. Fix the vulnerability
4. Notify affected users if required
5. Document lessons learned

## Contact

Security concerns: info@anoint.me

---

Last reviewed: August 2025