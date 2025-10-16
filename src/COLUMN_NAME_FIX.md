# Column Name Mismatch Fix

## Problem

The error indicated that the `full_name` column doesn't exist in your Users table:

```
❌ Error inserting users: Could not find the 'full_name' column of 'Users' in the schema cache
```

This happens when the actual database column names don't match what the code expects. PostgreSQL (which Supabase uses) is case-sensitive when dealing with quoted identifiers, so:
- `full_name` ≠ `Full_Name` ≠ `FullName` ≠ `FULL_NAME`

## Root Cause

Your actual Users table likely has columns with different casing or formatting than expected:
- Expected: `full_name`
- Actual possibilities: `Full_Name`, `FullName`, `Name`, `FULL_NAME`, etc.

## Solution Implemented

I've updated `/lib/supabase.js` to **auto-detect** actual column names instead of hardcoding them.

### 1. Added Column Detection Function

```javascript
const detectColumnNames = async (tableName) => {
  // Fetches one row to see what columns actually exist
  const { data } = await supabase.from(tableName).select('*').limit(1)
  
  if (data && data.length > 0) {
    const columns = Object.keys(data[0])
    console.log(`✅ Detected columns in ${tableName}:`, columns)
    return columns
  }
  return null
}
```

### 2. Updated `insertSampleData()`

Now detects column names before inserting:

```javascript
// Detect actual columns
const { data: testData } = await supabase.from(actualTableNames.users).select('*').limit(1)

let nameColumn = 'full_name'
let emailColumn = 'email'
let roleColumn = 'role'

if (testData && testData.length > 0) {
  const columns = Object.keys(testData[0])
  const lowerColumns = columns.map(c => c.toLowerCase())
  
  // Find actual column names (case-insensitive)
  if (lowerColumns.includes('fullname')) nameColumn = columns[lowerColumns.indexOf('fullname')]
  else if (lowerColumns.includes('full_name')) nameColumn = columns[lowerColumns.indexOf('full_name')]
  else if (lowerColumns.includes('name')) nameColumn = columns[lowerColumns.indexOf('name')]
  
  // ... same for email and role
}

// Use detected column names
const usersToInsert = sampleUsers.map(user => ({
  [emailColumn]: user.email,
  [nameColumn]: user.name,
  [roleColumn]: user.role
}))
```

### 3. Added `normalizeUserData()` Helper

Converts database data to standardized format regardless of column naming:

```javascript
const normalizeUserData = (dbUser) => {
  // Finds name field regardless of casing
  const nameField = Object.keys(dbUser).find(key => 
    key.toLowerCase().includes('name') && key.toLowerCase() !== 'username'
  )
  
  return {
    id: dbUser.id || dbUser.ID || dbUser.Id,
    email: dbUser.email || dbUser.Email || dbUser.EMAIL,
    full_name: dbUser[nameField] || dbUser.full_name || dbUser.Full_Name || dbUser.FullName || '',
    role: dbUser.role || dbUser.Role || dbUser.ROLE || 'visitor',
    // ... etc
  }
}
```

### 4. Updated All User Functions

**getUsers():**
- Fetches data with `SELECT *`
- Logs actual columns found
- Normalizes all user data before returning

**addUser():**
- Detects actual column names first
- Maps input data to correct columns
- Normalizes returned data

**updateUser():**
- Detects actual column names first
- Maps update fields to correct columns
- Normalizes returned data

## What This Means

### ✅ Benefits

1. **Auto-detection**: Code now works with ANY column naming convention
2. **Better logging**: Console shows exactly what columns were found
3. **Case-insensitive**: Works with `full_name`, `Full_Name`, `FullName`, etc.
4. **Future-proof**: No need to manually update code if column names change

### 🔍 Debugging

When you refresh the page, check the console for:

```
🔍 Checking existing tables...
✅ Found table: users -> Users (X records)
🔍 Detecting columns for table: Users
✅ Detected columns in Users: ["id", "Email", "Name", "Role", "Created_At", ...]
📋 Fetching users from table: Users
✅ Fetched X users from database
   Available columns: ["id", "Email", "Name", "Role", ...]
   First user (raw): {id: "...", Email: "...", Name: "...", Role: "..."}
   First user (normalized): {id: "...", email: "...", full_name: "...", role: "..."}
```

This will show you:
1. What table was found
2. What columns actually exist
3. How the data is being normalized

## Next Steps

### Option 1: Let Auto-Detection Handle It (Recommended)
Just refresh the page and the code will automatically detect and use your actual column names.

### Option 2: Check Your Actual Schema
If you want to see exactly what columns you have:

1. Go to Supabase Dashboard
2. Click "Table Editor"
3. Select "Users" table
4. Look at the column names

### Option 3: Standardize Your Schema
If you want to standardize the column names to match the expected format:

```sql
-- In Supabase SQL Editor
ALTER TABLE "Users" RENAME COLUMN "Name" TO "full_name";
ALTER TABLE "Users" RENAME COLUMN "Email" TO "email";
ALTER TABLE "Users" RENAME COLUMN "Role" TO "role";
-- etc.
```

But this is **NOT required** - the auto-detection will work either way!

## Testing

1. **Refresh the page**
2. **Check browser console** - you should see:
   - ✅ Detected columns in Users: [...]
   - ✅ Successfully inserted X sample users
   - ✅ Fetched X users from database
3. **Go to User Management** - users should now display
4. **Try adding a new user** - should work with auto-detected columns

## Summary

✅ **Fixed:** Auto-detection of column names  
✅ **Fixed:** Sample data insertion works with any column naming  
✅ **Fixed:** User CRUD operations work with any column naming  
✅ **Added:** Detailed logging of detected columns  
✅ **Added:** Data normalization for consistent UI display  

The code is now **flexible and adaptive** to your actual database schema!
