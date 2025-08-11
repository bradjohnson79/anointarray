# Supabase Authentication Configuration for Password Recovery

## Overview
This document outlines the configuration changes made to enable proper password recovery redirect URLs for the Anoint Array website.

## Problem Statement
When users receive Supabase password reset links, they were redirecting to the homepage instead of the proper password reset page.

## Solution Implemented

### 1. Local Configuration (✅ COMPLETED)
Updated `/supabase/config.toml` with proper redirect URLs:

```toml
[auth]
site_url = "https://anointarray.com"
additional_redirect_urls = [
  "https://anointarray.com", 
  "https://anointarray.com/reset-password",
  "https://anointarray.com/auth/callback",
  "http://localhost:3001",
  "http://localhost:3001/reset-password",
  "http://localhost:3001/auth/callback",
  "http://127.0.0.1:3001",
  "http://127.0.0.1:3001/reset-password",
  "http://127.0.0.1:3001/auth/callback"
]
```

### 2. Password Recovery Pages (✅ VERIFIED)
The following pages exist and are properly implemented:
- `/forgot-password` - Where users enter email to request reset
- `/reset-password` - Where users land from email link to set new password

### 3. Required Dashboard Configuration (⚠️ MANUAL ACTION REQUIRED)

**CRITICAL**: The following configuration must be applied through the Supabase Dashboard:

#### Dashboard Link
🔗 https://app.supabase.com/project/xmnghciitiefbwxzhgrw/auth/url-configuration

#### Configuration Settings
**Site URL:**
```
https://anointarray.com
```

**Additional redirect URLs:** (Add each URL separately)
```
https://anointarray.com
https://anointarray.com/reset-password
https://anointarray.com/auth/callback
http://localhost:3001
http://localhost:3001/reset-password
http://localhost:3001/auth/callback
http://127.0.0.1:3001
http://127.0.0.1:3001/reset-password
http://127.0.0.1:3001/auth/callback
```

## Password Recovery Flow

1. **User requests password reset**
   - Visits `/forgot-password`
   - Enters email address
   - Clicks "Send Reset Link"

2. **Supabase processes request**
   - Generates recovery link with tokens
   - Sends email to user
   - Uses configured `site_url` and `additional_redirect_urls`

3. **User clicks email link**
   - Link contains `access_token`, `refresh_token`, and `type=recovery`
   - Redirects to `/reset-password?access_token=...&refresh_token=...&type=recovery`

4. **Password reset page**
   - Validates tokens from URL parameters
   - Sets Supabase session with tokens
   - Allows user to enter new password
   - Updates password via `supabase.auth.updateUser()`

## Testing Checklist

### Development Testing (localhost:3001)
- [ ] Visit http://localhost:3001/forgot-password
- [ ] Enter valid email address
- [ ] Receive email with reset link
- [ ] Click link - should redirect to http://localhost:3001/reset-password
- [ ] Enter new password and submit
- [ ] Verify password is updated

### Production Testing (anointarray.com)
- [ ] Visit https://anointarray.com/forgot-password
- [ ] Enter valid email address
- [ ] Receive email with reset link
- [ ] Click link - should redirect to https://anointarray.com/reset-password
- [ ] Enter new password and submit
- [ ] Verify password is updated

## Troubleshooting

### If emails still redirect to homepage:
1. Verify Dashboard configuration is applied correctly
2. Check that all redirect URLs are added exactly as shown above
3. Ensure Site URL is set to `https://anointarray.com`
4. Clear browser cache and test again

### If password reset fails:
1. Check browser console for errors
2. Verify tokens are present in URL parameters
3. Confirm Supabase client configuration is correct
4. Check that user exists in Supabase Auth

## Scripts Available

### Configuration Scripts
- `scripts/update-supabase-auth-config.js` - Shows configuration details
- `scripts/supabase-auth-api-config.js` - Attempts API configuration + manual instructions
- `scripts/test-password-recovery.js` - Tests password recovery setup

### Running Scripts
```bash
cd /Users/bradjohnson/Documents/anoint-array/WEBSITE
node scripts/supabase-auth-api-config.js
node scripts/test-password-recovery.js
```

## Files Modified
- `/supabase/config.toml` - Updated auth configuration
- Created configuration and testing scripts

## Next Steps
1. **CRITICAL**: Apply the Dashboard configuration manually (see section 3 above)
2. Test password recovery flow in both development and production
3. Verify that email links redirect to correct URLs
4. Monitor for any issues and adjust configuration as needed

---
*Configuration completed by Claude Code on 2025-08-10*