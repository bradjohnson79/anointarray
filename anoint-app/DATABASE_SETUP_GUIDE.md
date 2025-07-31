# 🚀 Database Setup & User Creation Testing Guide

This guide shows you exactly how to set up the database and test user creation functionality.

## 📋 **STEP 1: Database Setup (Required First)**

You need to run this SQL in your Supabase dashboard first:

1. Go to: https://supabase.com/dashboard/project/xmnghciitiefbwxzhgrw/sql
2. Run this SQL:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator', 'vip')),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION handle_updated_at() 
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
```

## 🧪 **STEP 2: Test User Creation**

After running the SQL above, test user creation:

### **Method A: Using the Script**
```bash
cd anoint-app
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/create-admin.js
```

### **Method B: Using the Website**
1. Go to: https://anointarray.com/auth
2. Click "Sign Up"
3. Enter email: `info@anoint.me`
4. Enter password: `Admin123`
5. Click "Create Account"

## 🔍 **STEP 3: Verify Everything Works**

Run the verification script:
```bash
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key node scripts/verify-database.js
```

## 📊 **Expected Results**

### ✅ **If Working Correctly:**
- User creation should succeed without errors
- User profiles should be created automatically
- You should be able to sign in
- Admin dashboard should show users
- Role-based access should work

### ❌ **If Not Working:**
- Check that you ran the SQL setup first
- Verify your service role key is correct
- Check browser console for errors
- Run the verification script to debug

## 🛠 **Troubleshooting**

### **Common Issues:**

1. **"Database error creating new user"**
   - Run the SQL setup in Supabase dashboard first
   - Check RLS policies are correct

2. **"Profile creation failed"**
   - Verify user_profiles table exists
   - Check RLS policies allow user insertion

3. **"Access denied" on admin pages**
   - Make sure user has 'admin' role
   - Check RLS policies allow profile reading

### **Debug Commands:**
```bash
# Check database state
SUPABASE_SERVICE_ROLE_KEY=key node scripts/verify-database.js

# Test website functionality
# Open browser developer tools and go to Network tab
# Try signup at https://anointarray.com/auth
# Check for any failed API calls
```

## 🎯 **Success Criteria**

The system is working correctly when:
- [x] Users can sign up through website interface
- [x] User profiles are automatically created
- [x] Users can sign in after signup
- [x] Admin users can access /admin pages
- [x] Admin users can manage other users
- [x] Role-based permissions work correctly

## 📝 **Testing Checklist**

1. [ ] Run SQL setup in Supabase dashboard
2. [ ] Create admin account (info@anoint.me / Admin123)
3. [ ] Test login with admin account
4. [ ] Access admin dashboard at /admin/users
5. [ ] Create a test user through admin interface
6. [ ] Test role changes and user management
7. [ ] Test regular user signup through website
8. [ ] Verify all functionality works end-to-end

Once you complete these steps, the entire user management system will be fully functional!