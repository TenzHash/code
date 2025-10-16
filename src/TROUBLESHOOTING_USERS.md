# 🔧 User Management Troubleshooting Guide

Quick solutions to common issues when working with the Users database integration.

---

## 🚨 Common Issues & Solutions

### Issue 1: No Users Showing in Table

**Symptoms:**
- User Management page loads but shows "No users found"
- Table is empty
- User count shows 0

**Possible Causes & Solutions:**

#### Cause A: Database is Empty
**Check:**
1. Open Supabase Dashboard
2. Go to Table Editor → Users
3. Check if table has rows

**Solution:**
- If empty, click "Add User" to create first user
- OR wait for automatic sample data insertion
- OR manually add data in Supabase dashboard

#### Cause B: Connection Issue
**Check:**
- Look for green dot in header
- Console should show: "✅ Supabase client created successfully"

**Solution:**
1. Check internet connection
2. Verify Supabase credentials in `/utils/supabase/info.tsx`
3. Check Supabase status at status.supabase.com

#### Cause C: Table Name Mismatch
**Check Console For:**
- "❌ Users table name not found in mappings"
- "Table 'users' does not exist"

**Solution:**
1. Verify table is named "Users" (capital U) in Supabase
2. Check `/lib/supabase.js` → `tableNameMappings`
3. Auto-detection should find it automatically

---

### Issue 2: Console Shows "Could not find column" Error

**Symptoms:**
```
❌ Error from Supabase: Could not find column 'full_name'
```

**This is NORMAL!** The system will:
1. Detect the error
2. Auto-discover actual column names
3. Retry with correct names
4. Log success message

**Expected Flow:**
```
⚠️ Could not find column 'full_name'
🔍 Detecting columns for table: Users
✅ Detected columns: ['id', 'email', 'Full_Name', 'role']
✅ Using columns: name=Full_Name, email=email, role=role
✅ Successfully loaded 8 users from database
```

**No Action Needed** - System self-corrects!

---

### Issue 3: Can't Add New Users

**Symptoms:**
- Click "Add User"
- Fill form
- Click "Add User" button
- Nothing happens or error appears

**Common Causes:**

#### Cause A: Duplicate Email
**Error:** "duplicate key value violates unique constraint"

**Solution:**
- Use a different email address
- Emails must be unique in database

#### Cause B: Missing Required Fields
**Check:**
- Full Name filled in?
- Email filled in?
- Role selected?

**Solution:**
- All three fields are required
- Fill in all fields marked with red asterisk (*)

#### Cause C: Invalid Email Format
**Solution:**
- Use valid email format: name@domain.com
- Check for typos

---

### Issue 4: Edits Not Saving

**Symptoms:**
- Click Edit
- Make changes
- Click "Save Changes"
- Changes don't appear

**Solutions:**

#### Check 1: Look for Error in Console
**If you see:**
- "❌ Error updating user"
- Read the specific error message

#### Check 2: Required Fields
- Make sure Name, Email, and Role are still filled
- Can't remove required information

#### Check 3: Network Issue
- Check internet connection
- Try clicking "Refresh" button
- Try again

---

### Issue 5: Delete Not Working

**Symptoms:**
- Click Delete icon
- Confirm deletion
- User still appears

**Solutions:**

#### Check 1: Foreign Key Constraints
**If user is referenced in other tables:**
- Tours created by user
- Content created by user
- May prevent deletion

**Solution:**
- Check console for specific error
- May need to delete related records first

#### Check 2: Permissions
**Check:**
- Supabase RLS (Row Level Security) policies
- User might not have delete permission

---

### Issue 6: Search/Filter Not Working

**Symptoms:**
- Type in search box
- No results or wrong results

**Solutions:**

#### If No Results:
- Check spelling
- Try partial match (e.g., "john" instead of "john smith")
- Clear search and try again

#### If Wrong Results:
- Search looks in: Name, Email, College
- Make sure searching correct field
- Use role filter for role-specific search

---

### Issue 7: Green Status Indicator Not Showing

**Symptoms:**
- No green dot in header
- Shows "Database not connected"

**Solutions:**

#### Check 1: Supabase Configuration
**Console should show:**
```
✅ Supabase client created successfully
```

**If not:**
1. Check `/utils/supabase/info.tsx`
2. Verify SUPABASE_URL is set
3. Verify SUPABASE_ANON_KEY is set

#### Check 2: Network/Firewall
- Check if Supabase domain is accessible
- Check browser console for CORS errors
- Try accessing Supabase dashboard

---

### Issue 8: Refresh Button Does Nothing

**Symptoms:**
- Click "Refresh" button
- No loading spinner
- Data doesn't reload

**Solutions:**

#### Check 1: Already Loading
- If already fetching data, button is disabled
- Wait for current operation to complete

#### Check 2: Console Errors
- Open console (F12)
- Look for error messages
- May indicate connection issue

#### Check 3: Clear and Retry
- Refresh entire browser page (Ctrl+R)
- Try "Refresh" button again

---

### Issue 9: Export Not Working

**Symptoms:**
- Click "Export" button
- No CSV file downloads

**Solutions:**

#### Check 1: Browser Permissions
- Browser may be blocking downloads
- Check browser's download settings
- Allow downloads from this site

#### Check 2: No Data to Export
- Must have at least one user to export
- Empty table = nothing to export

#### Check 3: Pop-up Blocker
- Disable pop-up blocker for this site
- Try again

---

### Issue 10: Role Badge Not Showing

**Symptoms:**
- User role displayed as text, not badge
- Or role shows as "undefined"

**Solutions:**

#### Check 1: Role Value in Database
**Open Supabase Dashboard:**
1. Table Editor → Users
2. Check "role" column
3. Should be: student, faculty, staff, visitor, or admin

#### Check 2: Case Sensitivity
- Roles should be lowercase
- "Student" → should be "student"

**Auto-detection handles this!**

---

## 🔍 Diagnostic Commands

### Quick Health Check (Paste in Console)

```javascript
// 1. Check Supabase connection
console.log('Supabase URL:', window.SUPABASE_URL || 'NOT SET');
console.log('Has Anon Key:', !!(window.SUPABASE_ANON_KEY));

// 2. Check table mappings
console.log('Table Mappings:', window.actualTableNames);

// 3. Check detected columns
console.log('User Columns:', window.userTableColumns);

// 4. Check if on Users page
console.log('Current page:', window.location.pathname);
```

### Force Reload Users

```javascript
// Manually trigger user reload
// (Only works when on User Management page)
window.location.reload();
```

---

## 📊 Console Log Interpretation

### ✅ Good (Everything Working)

```
✅ Supabase client created successfully
✅ Found table: users -> Users (8 records)
✅ Successfully loaded 8 users from database
```

**Meaning:** All systems operational!

### ⚠️ Warning (Non-Critical)

```
⚠️ Could not detect columns for Users
⚠️ Table Users is empty
```

**Meaning:** System working, but no data or minor issue

### ❌ Error (Needs Attention)

```
❌ Error from Supabase: permission denied
❌ Users table name not found
❌ Error fetching users: network error
```

**Meaning:** Issue needs to be resolved

---

## 🆘 Emergency Reset

### If Nothing Works:

#### Step 1: Hard Browser Refresh
```
Windows/Linux: Ctrl + Shift + R
Mac: Cmd + Shift + R
```

#### Step 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

#### Step 3: Check Supabase Dashboard
1. Login to Supabase dashboard
2. Verify "Users" table exists
3. Check if data is there
4. Verify project is active

#### Step 4: Verify Credentials
**File:** `/utils/supabase/info.tsx`

Should contain:
```typescript
export const projectId = 'dlzlnebdpxrmqnelrbfm'
export const publicAnonKey = 'eyJhbGc...'
```

#### Step 5: Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Filter for "supabase"
4. Look for failed requests (red)
5. Check error details

---

## 📞 When to Ask for Help

### Contact Support If:

1. ❌ Console shows persistent errors
2. ❌ Green indicator never appears
3. ❌ No data after verifying database has records
4. ❌ CRUD operations fail consistently
5. ❌ Browser console shows authentication errors

### Before Asking for Help:

**Gather This Info:**

1. **Console Output:**
   - Copy all messages from console
   - Include errors (red text)

2. **Screenshots:**
   - User Management page
   - Console output
   - Supabase table editor

3. **Steps to Reproduce:**
   - What you did
   - What you expected
   - What actually happened

4. **Environment:**
   - Browser (Chrome, Firefox, etc.)
   - Browser version
   - Operating system

---

## 🎯 Prevention Tips

### Best Practices:

1. **Always Check Console** (F12)
   - Catches issues early
   - Shows exactly what's happening

2. **Use Unique Emails**
   - Prevents duplicate key errors
   - Makes users easier to find

3. **Fill Required Fields**
   - Name, Email, Role are mandatory
   - Check for red asterisk (*)

4. **Regular Backups**
   - Export users as CSV regularly
   - Keep backup of database

5. **Test in Supabase Dashboard**
   - Verify table structure
   - Check data directly
   - Test queries there first

6. **Monitor Supabase Status**
   - Check status.supabase.com
   - Be aware of maintenance windows

---

## ✅ Verification After Fix

After resolving an issue, verify:

- [ ] Green dot appears in header
- [ ] User count shows correct number
- [ ] "Live from Database" badge visible
- [ ] Users display in table
- [ ] Can add new user
- [ ] Can edit existing user
- [ ] Can delete user
- [ ] Search works
- [ ] Filter works
- [ ] Refresh works
- [ ] No console errors

---

## 📚 Additional Resources

- **Quick Start:** `/README_USERS.md`
- **User Guide:** `/USER_MANAGEMENT_GUIDE.md`
- **Verification:** `/VERIFICATION_CHECKLIST.md`
- **Database Schema:** `/ACTUAL_DATABASE_SCHEMA.md`

---

## 🔑 Quick Fixes Cheat Sheet

| Problem | Quick Fix |
|---------|-----------|
| No users | Check Supabase has data, click Refresh |
| Column error | Wait for auto-detection, check console |
| Can't add | Check email is unique, fill required fields |
| Can't edit | Check required fields filled |
| Can't delete | Check console for constraint errors |
| No search results | Try partial name, check spelling |
| No green dot | Verify Supabase credentials |
| Refresh not working | Hard refresh browser (Ctrl+Shift+R) |
| Export not working | Check browser allows downloads |
| Role not showing | Check database has valid role value |

---

**Last Updated:** January 2025  
**Version:** 1.0  
**Status:** Production Ready

**Remember:** Most issues self-resolve with auto-detection. Check console first! 🔍
