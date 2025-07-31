# Netlify Environment Variables Setup

The login error showing `xmnghciitifbwxzhgorw.supabase.co` (with a typo) instead of the correct `xmnghciitiefbwxzhgrw.supabase.co` indicates that Netlify is not using the correct environment variables during build.

## Required Environment Variables

You need to set these in your Netlify dashboard:

### 1. Go to Netlify Dashboard
- Navigate to your site: https://app.netlify.com
- Go to **Site configuration** → **Environment variables**

### 2. Add These Variables

```
VITE_SUPABASE_URL = https://xmnghciitiefbwxzhgrw.supabase.co
```
```
VITE_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4
```

### 3. Clear Build Cache and Redeploy

After adding the environment variables:

1. In Netlify dashboard, go to **Deploys**
2. Click **Trigger deploy** → **Clear cache and deploy site**

This ensures the new environment variables are used during the build process.

## Alternative: Using .env File

If you prefer to commit the environment variables (since they're public keys):

1. Create `/anoint-app/.env.production`:
```env
VITE_SUPABASE_URL=https://xmnghciitiefbwxzhgrw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhtbmdoY2lpdGllZmJ3eHpoZ3J3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MjM0NzMsImV4cCI6MjA2OTI5OTQ3M30.dIeGonQS9a0ZhFo5WVYj1zMxtmm5juE35oCJSMm62a4
```

2. Commit and push this file
3. Netlify will use it during build

## Debugging the Issue

To verify the correct URL is being used:

1. Open browser DevTools
2. Go to Network tab
3. Try to login
4. Look for the failed request
5. Check if the URL contains the typo

The error `xmnghciitifbwxzhgorw` (missing 'r' before 'w') suggests either:
- Old cached build
- Environment variables not set in Netlify
- Browser cache issue

## Quick Fix

1. Clear your browser cache
2. Try incognito/private browsing mode
3. Check Netlify build logs for any errors