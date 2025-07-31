# Supabase Initialization Guide 🔮

This guide walks you through setting up your ANOINT Array project with Supabase, including database migrations and admin user creation.

## 📋 Prerequisites

Before starting, ensure you have:

1. **Node.js 18+** installed
2. **A Supabase account** at [supabase.com](https://supabase.com)
3. **Environment variables** configured in `.env.local`

## 🚀 Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or login to your account
3. Click **"New Project"**
4. Fill in:
   - **Project name**: `anoint-array` (or your choice)
   - **Database password**: Save this securely!
   - **Region**: Choose closest to your users
5. Click **"Create Project"** and wait for setup (2-3 minutes)

## 🔑 Step 2: Get Your API Keys

1. In your Supabase project dashboard
2. Go to **Settings** → **API**
3. Copy these values:
   - **Project URL**: `https://[your-project-id].supabase.co`
   - **anon/public key**: Long string starting with `eyJ...`
   - **service_role key**: Another long string (keep SECRET!)

## ⚙️ Step 3: Configure Environment Variables

Update your `/anoint-app/.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://[your-project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your-anon-key...
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key...

# Optional: Email service for contact forms
RESEND_API_KEY=your-resend-key-here
```

## 🗄️ Step 4: Run Database Migrations

You have two options for running migrations:

### Option A: Manual Migration (Recommended)

1. In Supabase dashboard, go to **SQL Editor**
2. Run each migration file in order:

```sql
-- 1. Copy and run: supabase/migrations/001_create_orders_table.sql
-- 2. Copy and run: supabase/migrations/002_performance_optimizations.sql  
-- 3. Copy and run: supabase/migrations/003_create_vip_waitlist.sql
-- 4. Copy and run: supabase/migrations/004_create_user_profiles.sql
-- 5. Copy and run: supabase/migrations/005_create_contact_submissions.sql
```

### Option B: Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Initialize Supabase locally
supabase init

# Link to your remote project
supabase link --project-ref [your-project-id]

# Push migrations
supabase db push
```

## 👤 Step 5: Create Admin User

Run the admin seeding script:

```bash
cd anoint-app
npm run seed-admin
```

This creates your default admin user:
- **Email**: `info@anoint.me`
- **Password**: `Admin123`

⚠️ **Important**: Change the admin password after first login!

## 🎯 Step 6: Test Your Setup

1. Start the development server:
```bash
npm run dev
```

2. Visit http://localhost:5173/auth

3. Login with admin credentials:
   - Email: `info@anoint.me`
   - Password: `Admin123`

4. If successful, you should see the admin dashboard

## 🔧 Step 7: Deploy Edge Functions (Optional)

If you want contact forms and VIP waitlist to send emails:

1. In Supabase dashboard, go to **Edge Functions**
2. Create these functions by copying the code from:
   - `supabase/functions/send-contact-message/index.ts`
   - `supabase/functions/send-vip-confirmation/index.ts`
   - `supabase/functions/create-admin-user/index.ts`

3. Set environment variables in function settings:
   - `RESEND_API_KEY` (for email sending)

## 🎉 Verification Checklist

✅ **Database Tables Created**:
- `orders` - Order management
- `user_profiles` - Extended user information  
- `vip_waitlist` - VIP product waitlist
- `contact_submissions` - Contact form submissions

✅ **Admin User Created**:
- Can login at `/auth`
- Has admin role in `user_profiles` table
- Can access admin dashboard at `/admin/*`

✅ **Authentication Working**:
- User signup/login functional
- Protected routes working
- Role-based access control enabled

✅ **Features Functional**:
- Contact form submits successfully
- VIP waitlist signup works
- Admin dashboard shows data

## 🚨 Troubleshooting

### "Failed to fetch" Error
- ✅ Check `VITE_SUPABASE_URL` is correct
- ✅ Ensure you're using the **anon key** (not service role) for `VITE_SUPABASE_ANON_KEY`
- ✅ Verify project is active in Supabase dashboard

### Cannot Login as Admin
- ✅ Run `npm run seed-admin` to create admin user
- ✅ Check migrations ran successfully (verify tables exist)
- ✅ Ensure `user_profiles` table has admin user with `role = 'admin'`

### CORS Issues
- ✅ In Supabase: **Authentication** → **URL Configuration**
- ✅ Add `http://localhost:5173` to allowed URLs

### Database Errors
- ✅ Check Supabase logs: **Dashboard** → **Logs** → **Recent Logs**
- ✅ Verify all migrations ran without errors
- ✅ Test connection: SQL Editor → `SELECT NOW();`

### Email Not Sending
- ✅ Set up Resend API key at [resend.com](https://resend.com)
- ✅ Deploy Edge Functions to Supabase
- ✅ Configure function environment variables

## 📞 Need Help?

If you're still having issues:

1. Check the **Supabase logs** in your dashboard
2. Verify all **environment variables** are set correctly
3. Ensure **database migrations** completed successfully
4. Test basic **database connection** in the SQL Editor

## 🔐 Security Notes

⚠️ **CRITICAL**:
- Never commit `.env.local` to git
- Keep your **service role key** SECRET
- Change the **default admin password** immediately
- Use **Row Level Security** (enabled by default in migrations)
- Regularly rotate your **API keys**

---

**🚀 Your ANOINT Array platform is now ready for scalar energy healing!**