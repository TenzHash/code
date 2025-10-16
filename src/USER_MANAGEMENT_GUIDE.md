# User Management - Quick Guide

## ✅ Current Status

Your User Management section is **fully connected** to your Supabase database and pulling data from the **"Users"** table.

## 🎯 How It Works

### Automatic Column Detection
The system automatically detects your database column names to handle different naming conventions:
- `full_name`, `Full_Name`, `FullName`, or `Name` → all work!
- `email`, `Email` → detected automatically
- `role`, `Role` → detected automatically

### What You'll See

1. **Dashboard Stats** - Shows total user count from database
2. **User Management Page** - Displays all users from the "Users" table
3. **Real-time CRUD Operations**:
   - ✅ **Create** - Add new users to database
   - ✅ **Read** - View all users from database
   - ✅ **Update** - Edit existing user information
   - ✅ **Delete** - Remove users from database

## 📊 Features

### Live Database Indicators
- 🟢 Green status indicator when connected to Supabase
- "Live from Database" badge on user table
- Real-time user count in header
- Automatic column detection logs in console

### User Table Displays:
- **Full Name** - User's full name
- **Email** - User's email address
- **Role** - User's role (student, faculty, staff, visitor, admin)
- **Actions** - Edit and Delete buttons

### Buttons Available:
- **Refresh** - Reload users from database
- **Add User** - Create new user in database
- **Export** - Download user list as CSV
- **Edit** (per user) - Update user information
- **Delete** (per user) - Remove user from database

## 🔍 Checking Database Connection

### In the Console
Open browser DevTools (F12) and look for these messages:

```
✅ Supabase client created successfully
🔗 Connected to project: https://dlzlnebdpxrmqnelrbfm.supabase.co
🔄 Fetching users from Supabase "Users" table...
✅ Successfully loaded 8 users from database
👥 Sample user data: { id: '...', email: '...', full_name: '...' }
```

### On the User Management Page
Look for these visual indicators:
- ✅ Green dot next to "Connected to Supabase"
- ✅ "Live from Database" badge on table
- ✅ Green alert showing "Live Database Connected"
- ✅ User count matching your database

## 📝 Database Schema

Your "Users" table currently stores:
- ✅ **id** - Unique identifier (UUID)
- ✅ **email** - User email address (required)
- ✅ **full_name** - User's full name (required)
- ✅ **role** - User role (required)
- ⚠️ **created_at** - Timestamp (if exists)
- ⚠️ **last_active** - Timestamp (if exists)
- ⚠️ **profile_image** - Image URL (if exists)

### Fields Not Yet in Database
The form shows these fields but they're **not saved** yet:
- Phone
- Department
- College

These can be added to your database schema if needed.

## 🚀 Quick Actions

### View Users from Database
1. Navigate to **User Management** in sidebar
2. Users are automatically loaded from database
3. Use search and filters to find specific users

### Add a New User
1. Click **"Add User"** button
2. Fill in:
   - Full Name (required)
   - Email (required)
   - Role (required)
3. Click **"Add User"**
4. User is immediately saved to database

### Edit Existing User
1. Click **Edit** icon next to user
2. Modify information
3. Click **"Save Changes"**
4. Database is updated

### Delete User
1. Click **Delete** (trash) icon next to user
2. Confirm deletion
3. User is removed from database

### Refresh Data
1. Click **"Refresh"** button in header
2. Latest data is fetched from database

## 🔧 Troubleshooting

### No Users Showing?

**Check 1: Database Connection**
- Look for green dot in header
- Check console for connection messages

**Check 2: Database Has Data**
- Open Supabase dashboard
- Navigate to Table Editor → Users
- Verify table has rows

**Check 3: Column Names Match**
- The system auto-detects columns
- Check console for "Detected columns:" message
- Verify columns include id, email, and a name field

### Error Messages?

**"Could not find column"**
- System will auto-detect correct column names
- Check console for detection messages

**"Table not found"**
- Verify table is named "Users" in Supabase
- Check `/lib/supabase.js` tableNameMappings

## 📱 Sample Data

If your database is empty, the system will:
1. Detect the "Users" table exists
2. Show yellow alert: "Database Connected but Empty"
3. Suggest using "Add User" button
4. **OR** auto-insert sample users (if initialization runs)

Sample users include:
- System Administrator (admin)
- John Smith (student)
- Mary Johnson (visitor)
- Prof. Sarah Davis (faculty)
- Jane Williams (staff)

## 🎓 Next Steps

### Expand Database Schema
To add Phone, Department, and College fields:

1. In Supabase Dashboard → Table Editor
2. Select "Users" table
3. Add columns:
   - `phone` (varchar)
   - `department` (varchar)
   - `college` (varchar)

4. The system will auto-detect these new columns!

### Enable User Photos
Your schema supports `profile_image`:
1. Upload user photos to Supabase Storage
2. Store URL in `profile_image` column
3. System will display in user table

## 📞 Support

If you encounter issues:
1. Check browser console (F12) for detailed logs
2. Verify Supabase credentials in `/utils/supabase/info.tsx`
3. Use Database Inspector in Settings page
4. Check actual table structure in Supabase Dashboard

---

**Last Updated:** January 2025  
**Status:** ✅ Fully Operational with Auto-Detection
