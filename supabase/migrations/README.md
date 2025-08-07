# Supabase Migrations

## How to Run Migrations

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `20250807_create_profiles_table.sql`
4. Paste and run the SQL

### Option 2: Supabase CLI
```bash
supabase db push
```

## Migration Files

### 20250807_create_profiles_table.sql
Creates the `profiles` table required for user authentication:
- Links to Supabase auth.users table
- Stores user profile information
- Includes RLS policies for security
- Auto-creates profile on user signup

## Important Notes
- The profiles table is **required** for the authentication system to work
- Run this migration before creating any user accounts
- The trigger automatically creates a profile when users sign up