# Authentication System Debugging

Comprehensive debugging guide for ANOINT Array's Supabase authentication system.

## Common Authentication Issues

### 1. Login Failures
**Symptoms**: Users can't log in, authentication errors, infinite loading

**Debug Steps**:
```bash
# Check Supabase configuration
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Verify admin email configuration
grep -r "ADMIN_EMAILS" lib/auth.ts

# Check browser console for errors
# Look for: "Supabase signin error", "Authentication system error"
```

**Common Causes**:
- [ ] Incorrect Supabase URL or anon key
- [ ] User not confirmed in Supabase dashboard
- [ ] Email not in admin whitelist for admin access
- [ ] CORS issues with Supabase project settings

### 2. Session Persistence Problems
**Symptoms**: Users logged out on page refresh, auth state not persisting

**Debug Steps**:
```javascript
// Check auth state listener in AuthContext.tsx
console.log('Auth state change:', event, !!session)

// Verify session storage
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
```

**Solutions**:
- Verify `onAuthStateChange` listener is properly set up
- Check browser local storage for auth tokens
- Ensure Supabase client is configured correctly

### 3. Role-Based Access Issues
**Symptoms**: Admins can't access admin pages, wrong role assigned

**Debug Steps**:
```javascript
// Check user role assignment in lib/auth.ts
const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase())
console.log('User email:', email, 'Is admin:', isAdmin)

// Verify middleware protection
curl -X GET /api/admin/dashboard \
  -H "Authorization: Bearer <token>"
```

**Solutions**:
- Add user email to `ADMIN_EMAILS` array
- Verify email case sensitivity
- Check middleware is applied to admin routes

## Authentication Flow Debugging

### Supabase Authentication Process
1. **User Registration**: `SupabaseAuth.signUp()`
2. **Email Confirmation**: Supabase email verification
3. **User Login**: `SupabaseAuth.signIn()`
4. **Role Assignment**: Based on `ADMIN_EMAILS` array
5. **Session Management**: `onAuthStateChange` listener

### Debug Logging
Add detailed logging to track auth flow:

```javascript
// In lib/auth.ts
console.log('🔐 SupabaseAuth.signIn called with email:', email)
console.log('✅ SupabaseAuth: Authentication successful for:', user.displayName)
console.log('Auth state change:', event, !!session)
```

### Browser DevTools Inspection
1. **Network Tab**: Check Supabase API calls
2. **Application Tab**: Inspect local storage for auth tokens
3. **Console**: Look for authentication errors
4. **Sources**: Set breakpoints in auth code

## Environment Configuration Issues

### Missing Environment Variables
```bash
# Check all required variables are set
cat .env.local | grep -E "(SUPABASE|AUTH)"

# Verify in running application
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log('Admin Email:', process.env.SUPABASE_ADMIN_EMAIL)
```

### Production vs Development
- [ ] Different Supabase projects for dev/prod
- [ ] Correct environment variables in deployment
- [ ] CORS settings match deployment domain

## Database-Related Auth Issues

### Profile Creation Problems
```sql
-- Check if profiles table exists
SELECT * FROM profiles WHERE email = 'user@example.com';

-- Verify RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';
```

### User Data Synchronization
```javascript
// Check profile creation in signUp flow
const { error: profileError } = await supabase
  .from('profiles')
  .insert({
    id: data.user.id,
    email: data.user.email,
    display_name: displayName || email.split('@')[0]
  })
```

## Middleware Debugging

### Protected Route Issues
```javascript
// Check middleware configuration in middleware.ts
const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
console.log('Protected route check:', pathname, isProtectedRoute)

// Verify auth token in middleware
const authToken = request.cookies.get('auth-token')?.value
console.log('Auth token found:', !!authToken)
```

### API Route Protection
```javascript
// Debug auth middleware in lib/auth-middleware.ts
console.log('Authentication middleware called for:', request.url)
console.log('User authenticated:', !!user)
console.log('User role:', user?.role)
```

## Common Error Messages

### "Authentication system error"
- Check Supabase configuration
- Verify network connectivity
- Review browser console for detailed errors

### "Insufficient permissions"
- User not in admin role
- Check `ADMIN_EMAILS` array
- Verify role assignment logic

### "Invalid JSON in request body"
- Malformed request payload
- Check Content-Type headers
- Verify request structure

## Testing Authentication

### Manual Testing Checklist
- [ ] User registration with email confirmation
- [ ] User login with valid credentials
- [ ] Admin access with whitelisted email
- [ ] Session persistence across page refreshes
- [ ] Logout functionality and session cleanup
- [ ] Password reset flow
- [ ] Role-based route protection

### Automated Testing
```javascript
// Test auth functions
describe('Authentication', () => {
  test('should sign in valid user', async () => {
    const result = await SupabaseAuth.signIn('test@example.com', 'password')
    expect(result.user).toBeTruthy()
    expect(result.error).toBeNull()
  })
  
  test('should assign admin role correctly', async () => {
    const result = await SupabaseAuth.signIn('info@anoint.me', 'password')
    expect(result.user?.role).toBe('admin')
  })
})
```

## Recovery Procedures

### Reset User Authentication
1. Clear browser local storage
2. Sign out from Supabase dashboard
3. Reset user password if needed
4. Re-verify email if required

### Fix Supabase Configuration
1. Check project URL and keys
2. Verify email templates
3. Review RLS policies
4. Update CORS settings

---

Use this guide to systematically debug any authentication issues in the ANOINT Array platform.

*Debug Context: $ARGUMENTS*