# Actual Supabase Database Schema

Based on error messages, your database uses the following table names:

## Table Names

| Code Reference | Actual Table Name | Notes |
|---------------|-------------------|-------|
| `users` | **Users** | Capitalized |
| `buildings` | **Building** | Singular, capitalized |
| `rooms` | **Room** | Singular, capitalized |
| `content_items` | **Content** | Capitalized |
| `tours` | **Tours** | Capitalized (assumed) |
| `qr_codes` | **QR Code** | ⚠️ Contains space! |
| `tour_stops` | **Tour_Stops** | Assumed with underscore |

## Table Structures

### Users Table
**NOTE:** The actual column names may differ. The code now auto-detects column names.

Common variations:
- `full_name` vs `Full_Name` vs `FullName` vs `Name`
- `email` vs `Email`
- `role` vs `Role`

```sql
CREATE TABLE "Users" (
  id UUID PRIMARY KEY,
  email VARCHAR,
  full_name VARCHAR,  -- Could be Full_Name, FullName, or Name
  role VARCHAR,
  created_at TIMESTAMP,
  last_active TIMESTAMP,
  profile_image VARCHAR
)
```

### Building Table (Singular!)
```sql
CREATE TABLE "Building" (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  address VARCHAR,
  latitude DECIMAL,
  longitude DECIMAL,
  total_rooms INTEGER,
  image_url VARCHAR,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Room Table (Singular!)
```sql
CREATE TABLE "Room" (
  id UUID PRIMARY KEY,
  building_id UUID REFERENCES "Building"(id),
  name VARCHAR,
  room_number VARCHAR,
  room_type VARCHAR,
  capacity INTEGER,
  floor_level INTEGER,
  description TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Content Table
```sql
CREATE TABLE "Content" (
  id UUID PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  content_type VARCHAR,
  file_url VARCHAR,
  thumbnail_url VARCHAR,
  file_size BIGINT,
  tags TEXT[],
  building_id UUID,
  room_id UUID,
  created_at TIMESTAMP
)
```

### Tours Table
```sql
CREATE TABLE "Tours" (
  id UUID PRIMARY KEY,
  name VARCHAR,
  description TEXT,
  tour_type VARCHAR,
  estimated_duration INTEGER,
  total_stops INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP
)
```

### QR Code Table (⚠️ With Space!)
```sql
CREATE TABLE "QR Code" (
  id UUID PRIMARY KEY,
  code VARCHAR,
  title VARCHAR,
  description TEXT,
  destination_type VARCHAR,
  destination_id VARCHAR,
  qr_url VARCHAR,
  scan_count INTEGER,
  is_active BOOLEAN,
  created_at TIMESTAMP
)
```

## Important Notes

### 1. Capitalization Matters
PostgreSQL is case-sensitive when table names are quoted. Your tables use:
- Capital letters (Users, Building, Room, Content, Tours)
- No quotes in SQL would make them case-insensitive

### 2. Singular vs Plural
Most tables are **singular** (Building, Room, Content) not plural:
- ❌ Buildings → ✅ Building
- ❌ Rooms → ✅ Room
- ✅ Users (already plural)
- ✅ Tours (already plural)

### 3. Space in Table Name
The "QR Code" table has a **space**:
- This is unusual but valid in PostgreSQL
- Supabase handles it correctly
- Consider renaming to `QR_Code` or `QRCode` for consistency

### 4. Foreign Key Relationships
```
Room.building_id → Building.id
Content.building_id → Building.id
Content.room_id → Room.id
Tour_Stops.tour_id → Tours.id
Tour_Stops.building_id → Building.id
```

## Code Mapping

The application uses `/lib/supabase.js` to map internal names to actual table names:

```javascript
// Internal → Actual Table Name
users          → 'Users'
buildings      → 'Building'
rooms          → 'Room'
content_items  → 'Content'
tours          → 'Tours'
qr_codes       → 'QR Code'
```

## Recommendations

### Option 1: Keep Current Names
- Update code to match (✅ Already done)
- Pros: No database changes needed
- Cons: Inconsistent naming (space in QR Code, mix of singular/plural)

### Option 2: Standardize Database (Recommended for production)
Rename tables in Supabase to be consistent:
```sql
ALTER TABLE "Building" RENAME TO "Buildings";
ALTER TABLE "Room" RENAME TO "Rooms";
ALTER TABLE "QR Code" RENAME TO "QR_Codes";
```

Then update `/lib/supabase.js`:
```javascript
let tableNameMappings = {
  users: 'Users',
  buildings: 'Buildings',  // Now plural
  rooms: 'Rooms',          // Now plural
  content_items: 'Content',
  tours: 'Tours',
  qr_codes: 'QR_Codes',    // No space
}
```

### Option 3: Use All Lowercase (Most Standard)
```sql
ALTER TABLE "Users" RENAME TO users;
ALTER TABLE "Building" RENAME TO buildings;
ALTER TABLE "Room" RENAME TO rooms;
-- etc.
```

Then update mappings to use lowercase.

## Current Status

✅ **Code is configured to work with your current table names**  
⚠️ **Table names are non-standard but functional**  
💡 **Consider standardizing for long-term maintainability**