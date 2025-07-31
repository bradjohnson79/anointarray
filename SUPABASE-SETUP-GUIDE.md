# Supabase Setup Guide for ANOINT Array

## Quick Setup Steps

### 1. Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login to your account
3. Click "New Project"
4. Fill in:
   - Project name: `anoint-array` (or your choice)
   - Database password: (save this securely)
   - Region: Choose closest to your users
5. Click "Create Project" and wait for setup

### 2. Get Your API Keys

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. You'll see:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon/public key**: A long string starting with `eyJ...`
   - **service_role key**: Another long string (keep this SECRET!)

### 3. Update Environment Variables

1. Copy your keys from Supabase
2. Update `/anoint-app/.env.local`:

```env
# Replace these with your actual values
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...
```

### 4. Run Database Migrations

1. In Supabase dashboard, go to **SQL Editor**
2. Run each migration file in order:
   - `001_create_orders_table.sql`
   - `002_performance_optimizations.sql`
   - `003_create_vip_waitlist.sql`
   - `004_create_user_profiles.sql`
   - `005_create_contact_submissions.sql`

### 5. Create Admin User

After migrations are complete:

```bash
cd anoint-app
npm run seed-admin
```

This will create your admin user:
- Email: `info@anoint.me`
- Password: `Admin123`

### 6. Deploy Edge Functions (Optional)

In Supabase dashboard, go to **Edge Functions** and deploy:
- `send-contact-message`
- `send-vip-confirmation`
- `create-admin-user`
- etc.

### 7. Test Your Setup

1. Restart the dev server:
```bash
npm run dev
```

2. Go to http://localhost:5173/auth
3. Login with your admin credentials

## Troubleshooting

### "Failed to fetch" Error
- Check that your Supabase URL is correct
- Ensure you're using the anon key (not service role) in VITE_SUPABASE_ANON_KEY
- Verify your project is active in Supabase dashboard

### Cannot Login
- Make sure you've run all migrations
- Ensure the admin user was created with `npm run seed-admin`
- Check Supabase dashboard → Authentication → Users

### CORS Issues
- In Supabase dashboard → Authentication → URL Configuration
- Add `http://localhost:5173` to allowed URLs

### Need Help?
- Check Supabase logs: Dashboard → Logs → Recent Logs
- Verify migrations ran: Dashboard → Table Editor
- Test connection: Dashboard → SQL Editor → Run `SELECT NOW();`

## Security Notes

⚠️ **IMPORTANT**: 
- Never commit `.env.local` to git
- Keep your service role key SECRET
- Use Row Level Security (RLS) on all tables
- The migrations already include RLS policies