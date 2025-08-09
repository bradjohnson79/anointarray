# ANOINT Array - Supabase Best Practices

## Authentication System Implementation

### 1. Database Schema
Our clean authentication system uses the following schema:

```sql
-- Main user profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  email_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read and update their own profile
CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Only authenticated users can insert profiles (handled by trigger)
CREATE POLICY "Authenticated users can insert profiles" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Auto-create profile trigger
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT := 'member';
BEGIN
  -- Set admin role for specific emails
  IF NEW.email IN ('info@anoint.me', 'breanne@aetherx.co') THEN
    user_role := 'admin';
  END IF;

  INSERT INTO public.user_profiles (
    id,
    email,
    display_name,
    role,
    email_verified
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    user_role,
    NEW.email_confirmed_at IS NOT NULL
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auto-creating profiles
CREATE TRIGGER create_profile_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- Update trigger for email verification
CREATE OR REPLACE FUNCTION update_user_profile_on_auth_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email verification status
  UPDATE public.user_profiles 
  SET 
    email_verified = NEW.email_confirmed_at IS NOT NULL,
    updated_at = NOW()
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth updates
CREATE TRIGGER update_profile_on_auth_change
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION update_user_profile_on_auth_change();
```

### 2. Environment Variables
Required environment variables for production:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Supabase Auth Configuration
NEXT_PUBLIC_SITE_URL=https://anointarray.com
SUPABASE_JWT_SECRET=your_jwt_secret
```

### 3. Security Best Practices

#### Row Level Security (RLS)
- ✅ Enabled on all sensitive tables
- ✅ Policies restrict access based on authenticated user
- ✅ Admin policies for management access
- ✅ Public read policies for non-sensitive data only

#### Authentication Flow
- ✅ Email verification required for all users
- ✅ Password reset functionality with secure tokens
- ✅ Session management with automatic refresh
- ✅ Secure cookie handling with httpOnly flags

#### Data Protection
- ✅ No sensitive data in client-side storage
- ✅ All API calls authenticated via Supabase auth
- ✅ Database triggers for consistent data integrity
- ✅ Proper error handling without data leakage

### 4. Performance Optimizations

#### Database Indexing
```sql
-- Performance indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);
CREATE INDEX idx_user_profiles_email_verified ON user_profiles(email_verified);
```

#### Connection Pooling
- Using Supabase's built-in connection pooling
- Connection limits appropriate for Next.js serverless functions
- Proper client initialization to avoid connection leaks

#### Caching Strategy
- Session data cached in memory
- User profile data cached on successful authentication
- Automatic cache invalidation on profile updates

### 5. Error Handling

#### Authentication Errors
- Clear user-facing error messages
- Specific remediation instructions
- No sensitive system information exposed
- Proper logging for debugging

#### Database Errors
- Graceful fallback for connection issues
- Retry logic for transient failures
- User-friendly error messages
- Comprehensive error logging

### 6. Monitoring and Alerts

#### Key Metrics to Monitor
- Authentication success/failure rates
- Session duration and renewal patterns
- Database connection health
- API response times

#### Alert Thresholds
- Authentication failure rate > 5%
- Database connection errors
- Unusual session patterns
- High API latency

### 7. Backup and Recovery

#### Database Backups
- Daily automated backups via Supabase
- Point-in-time recovery available
- Regular backup restoration testing
- Cross-region backup replication

#### Schema Migrations
- Version-controlled schema changes
- Rollback procedures for failed migrations
- Testing on staging environment first
- Zero-downtime deployment strategies

### 8. Development Workflow

#### Local Development
1. Use Supabase CLI for local development
2. Seed data for consistent testing
3. Environment parity with production
4. Automated testing of auth flows

#### Deployment Process
1. Schema migrations applied first
2. Application deployment with health checks
3. Post-deployment verification tests
4. Rollback procedures documented

### 9. Compliance and Auditing

#### Data Privacy
- GDPR compliance for EU users
- Data retention policies implemented
- User data export/deletion capabilities
- Privacy policy aligned with data practices

#### Security Auditing
- Regular security assessments
- Penetration testing on auth flows
- Dependency vulnerability scanning
- Code review for security issues

### 10. Future Enhancements

#### Planned Improvements
- Multi-factor authentication (MFA)
- Social login integration
- Advanced user roles and permissions
- Session management dashboard

#### Scaling Considerations
- Database sharding strategies
- CDN integration for global performance
- Load balancing for high availability
- Microservices architecture planning