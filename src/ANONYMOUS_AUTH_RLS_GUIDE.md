# Anonymous Authentication & RLS Setup Guide

## ✅ What We've Implemented

Your iTOURu dashboard now **automatically signs in users anonymously** when they access the application. This allows the app to work with Row Level Security (RLS) policies that require authentication.

## 🔐 How It Works

### 1. **Anonymous Sign-In on App Load**
When the app loads, it automatically:
- Checks if there's an existing session (stored in localStorage)
- If no session exists, calls `supabase.auth.signInAnonymously()`
- Uses this authenticated session for all database queries

### 2. **Session Management**
```javascript
// Automatically called when app loads
await ensureAnonymousSession()
```

The session is:
- ✅ Stored in browser localStorage automatically by Supabase
- ✅ Persists across page refreshes
- ✅ Used automatically for all database queries
- ✅ Works with RLS policies that require `auth.uid()`

## 🎯 RLS Policy Options

You have **3 options** for your RLS policies:

### Option 1: Allow Authenticated Users (Current Setup) ✅
Works with anonymous authentication enabled. Users are automatically signed in.

```sql
-- Example: Allow authenticated users (including anonymous) to read
CREATE POLICY "Allow authenticated read" ON itouru_users
  FOR SELECT 
  TO authenticated
  USING (true);
```

### Option 2: Allow Anonymous Role (Alternative)
If you want to allow unauthenticated access without requiring sign-in:

```sql
-- Example: Allow anyone to read (no sign-in required)
CREATE POLICY "Allow anon read" ON itouru_users
  FOR SELECT 
  TO anon, authenticated
  USING (true);
```

### Option 3: User-Specific Policies
For policies that check specific user IDs:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users see own data" ON itouru_users
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);
```

## 📋 Complete RLS Setup for All Tables

Run this in your Supabase SQL Editor if you need to create/update policies:

```sql
-- Enable RLS on all tables
ALTER TABLE "Users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Building" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Room" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Content" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tours" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tour_Stops" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "QR Code" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tour_Visits" ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users (including anonymous) full access
-- Adjust these policies based on your security requirements

-- Users table
CREATE POLICY "Allow authenticated users full access" ON "Users"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Buildings table
CREATE POLICY "Allow authenticated users full access" ON "Building"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Rooms table
CREATE POLICY "Allow authenticated users full access" ON "Room"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Content table
CREATE POLICY "Allow authenticated users full access" ON "Content"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tours table
CREATE POLICY "Allow authenticated users full access" ON "Tours"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tour_Stops table
CREATE POLICY "Allow authenticated users full access" ON "Tour_Stops"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- QR Code table
CREATE POLICY "Allow authenticated users full access" ON "QR Code"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tour_Visits table
CREATE POLICY "Allow authenticated users full access" ON "Tour_Visits"
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
```

## 🔍 Debugging RLS Issues

### Check Current Session
Open browser console and run:
```javascript
const { data: { session } } = await supabase.auth.getSession()
console.log('Current session:', session)
```

### Check RLS Policies
In Supabase Dashboard:
1. Go to **Authentication > Policies**
2. Check which tables have RLS enabled
3. View existing policies for each table

### Common Error Messages

#### "new row violates row-level security policy"
- **Cause**: INSERT/UPDATE policy is blocking the operation
- **Fix**: Add a policy with `WITH CHECK (true)` for authenticated users

#### "permission denied for table"
- **Cause**: No SELECT policy exists for your role
- **Fix**: Add a SELECT policy with `USING (true)` for authenticated users

#### "JWT expired"
- **Cause**: Session expired (shouldn't happen with anonymous auth)
- **Fix**: Refresh the page - will create a new anonymous session

## ✨ What Happens Now

1. **On First Visit**: User is automatically signed in anonymously
2. **On Page Refresh**: Existing session is reused from localStorage
3. **All Database Queries**: Automatically include the session token
4. **RLS Policies**: Work correctly with the authenticated anonymous user

## 🎯 Next Steps

Choose one of these approaches:

### A. Keep Current Setup (Recommended for Prototypes)
- ✅ Already working with anonymous auth
- ✅ No additional configuration needed
- ✅ Users are automatically authenticated

### B. Add Explicit RLS Policies
- Run the SQL commands above in Supabase SQL Editor
- Gives you fine-grained control over data access
- Required for production applications

### C. Temporarily Disable RLS (Testing Only)
```sql
ALTER TABLE "Users" DISABLE ROW LEVEL SECURITY;
-- Repeat for other tables
```
⚠️ **Not recommended** - only use for debugging

## 📞 Need Help?

If you're still seeing RLS errors after implementing anonymous auth:

1. Check the browser console for error messages
2. Verify anonymous sign-in is enabled in Supabase Dashboard (Authentication > Settings)
3. Confirm that RLS policies exist for the `authenticated` role
4. Try the SQL commands above to create proper policies

---

**Your app is now configured to work with RLS using anonymous authentication!** 🎉
