# ANOINT Array - Claude Integration Guide

## Project Overview

ANOINT Array is a revolutionary energy healing technology platform that combines ancient sacred geometry with modern AI to create personalized healing arrays. The platform features a comprehensive e-commerce system, user authentication, payment processing, and AI-powered array generation.

### Core Technologies
- **Framework**: Next.js 15 with App Router and TypeScript
- **Authentication**: Supabase with role-based access control
- **Database**: Supabase PostgreSQL 
- **Payments**: Stripe, PayPal, and NowPayments (crypto)
- **AI**: Anthropic Claude for array generation
- **Styling**: Tailwind CSS with custom aurora theme
- **State Management**: React Context API
- **Email**: Resend API for transactional emails

## Architecture

### Authentication System
- **Supabase Auth**: Production-ready authentication
- **Role-based Access**: Admin and member roles
- **Protected Routes**: Middleware-protected admin areas
- **Session Management**: Real-time auth state updates

### API Structure
```
/app/api/
├── admin/          # Admin-only endpoints (secured with middleware)
├── payments/       # Payment processing (Stripe, PayPal, crypto)
├── generator/      # Array generation and payment flows
├── member/         # Member-specific functionality
├── digital/        # Digital product delivery
└── webhooks/       # Payment provider webhooks
```

### Security Implementation
- **Authentication Middleware**: All admin routes secured with `secureAdminRoute`
- **CSRF Protection**: Origin validation on state-changing operations
- **Rate Limiting**: API endpoint protection (50 req/15min for admin)
- **Input Validation**: Comprehensive request validation
- **Environment Variables**: All secrets in .env.local (never committed)

## Development Guidelines

### Code Standards
1. **TypeScript**: Strict typing throughout
2. **Security First**: No hardcoded secrets, proper authentication
3. **Error Handling**: Comprehensive try-catch with logging
4. **Responsive Design**: Mobile-first PWA approach
5. **Performance**: Optimized images, lazy loading, code splitting

### File Organization
```
/app/                # Next.js pages and API routes
/components/         # Reusable UI components
  ├── generator/     # Array generation components
  ├── mobile/        # Mobile-specific components
  └── ui/            # Base UI components
/lib/                # Utilities and business logic
  ├── auth.ts        # Authentication system
  ├── payments.ts    # Payment processing
  └── supabase.ts    # Database client
/contexts/           # React context providers
/public/             # Static assets and PWA files
```

### Key Components

#### Authentication (`/lib/auth.ts`)
- `SupabaseAuth` class with all auth methods
- Admin role determined by email whitelist
- Backwards compatible MockAuth for migration

#### Payment Processing (`/lib/payments.ts`)
- Multi-provider support (Stripe, PayPal, Crypto)
- Webhook handling for payment confirmations
- Order management and tracking

#### Array Generation (`/app/api/generator/generate/route.ts`)
- Anthropic Claude integration for AI generation
- Sacred geometry pattern creation
- Payment verification before generation

### Environment Variables

#### Required for Development
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Authentication
SUPABASE_ADMIN_EMAIL=info@anoint.me

# AI Services
ANTHROPIC_API_KEY=           # Required for array generation
OPENAI_API_KEY=              # Optional for additional AI features

# Payment Systems
STRIPE_SECRET_KEY=
PAYPAL_CLIENT_ID_LIVE=
NOWPAYMENTS_API_KEY=

# Application URLs
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
NEXTAUTH_URL=https://yourdomain.com
```

## Development Workflow

### Making Changes
1. **Security Check**: Ensure no secrets are exposed
2. **Authentication**: Test login/logout flows
3. **API Testing**: Verify endpoints with proper authentication
4. **Mobile Testing**: Check responsive design
5. **Build Verification**: Run `npm run build` before committing

### Testing Checklist
- [ ] Authentication flows work (login, logout, role-based access)
- [ ] API endpoints respond correctly with proper auth
- [ ] Payment systems process test transactions
- [ ] Array generation works with valid API keys
- [ ] Mobile responsive design functions properly
- [ ] No console errors or TypeScript warnings
- [ ] Environment variables load correctly

### Common Debugging Areas

#### Authentication Issues
- Check Supabase URL and keys in environment
- Verify admin email in `ADMIN_EMAILS` array
- Test auth state persistence across page reloads

#### Payment Failures
- Validate API keys for each payment provider
- Check webhook endpoints are accessible
- Verify environment (sandbox vs live) configuration

#### Array Generation Problems
- Confirm Anthropic API key is valid and has credits
- Check API rate limits and quotas
- Verify glyph assets exist in `/public/generator/glyphs/`

## Special Considerations

### Energy Healing Context
- **Sacred Geometry**: Arrays based on ancient patterns (flower of life, sri yantra)
- **Healing Intent**: Generate arrays for specific healing purposes
- **Mystical Aesthetics**: Aurora theme with purple/cyan gradients
- **Spiritual Language**: Use appropriate terminology for energy healing

### Business Model
- **Freemium**: Basic arrays free, premium features paid
- **Digital Products**: Downloadable healing arrays
- **Physical Merchandise**: Print-on-demand through Fourthwall
- **VIP Products**: Exclusive bio-scalar devices

### Contact Information
- **Primary Email**: info@anoint.me (all contact forms, legal pages)
- **Support**: Available through built-in AI chatbot
- **Admin Access**: info@anoint.me with secure password

## Commands for Claude

Use the specialized commands in `.claude/commands/` for specific tasks:
- `/screenshot-debug` - Debug UI issues from screenshots
- `/security-audit` - Security vulnerability assessment  
- `/api-test` - API endpoint testing and validation
- `/auth-debug` - Authentication troubleshooting
- `/deploy-check` - Pre-deployment validation

## Git Workflow

### Commit Standards
```
feat: Add new feature
fix: Bug fix
security: Security enhancement
docs: Documentation update
style: Code formatting/styling
refactor: Code refactoring
test: Add/update tests
```

### Branch Strategy
- `main`: Production-ready code
- Feature branches for significant changes
- Hot fixes directly to main for urgent issues

---

**Remember**: This is a production application handling real payments and user data. Always prioritize security, test thoroughly, and maintain the mystical energy healing aesthetic that makes ANOINT Array unique.

Contact: info@anoint.me for any questions or clarifications.