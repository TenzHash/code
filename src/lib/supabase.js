import { createClient } from '@supabase/supabase-js'

// In Figma Make environment, Supabase credentials are automatically injected
// We'll use environment variables if available, otherwise fallback to your specific credentials
export const supabaseUrl = (typeof window !== 'undefined' && window.SUPABASE_URL) || 
                   (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL) || 
                   'https://dlzlnebdpxrmqnelrbfm.supabase.co'
const supabaseAnonKey = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) || 
                       (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY) || 
                       'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsemxuZWJkcHhybXFuZWxyYmZtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwMTExNDksImV4cCI6MjA3MzU4NzE0OX0.GUUpkHK5pGBxPgUNdU3OlzKXmpIoskxEofFG7jUYSuw'

// Only create Supabase client if we have valid credentials
let supabase = null
const hasValidCredentials = supabaseUrl && supabaseAnonKey && supabaseUrl !== '' && supabaseAnonKey !== '' && supabaseUrl !== 'undefined' && supabaseAnonKey !== 'undefined'

if (hasValidCredentials) {
  try {
    supabase = createClient(supabaseUrl, supabaseAnonKey)
    console.log('✅ Supabase client created successfully')
    console.log('🔗 Connected to project:', supabaseUrl)
    console.log('🎯 iTOURu Dashboard ready with live database!')
  } catch (error) {
    console.error('❌ Failed to create Supabase client:', error)
    supabase = null
  }
} else {
  console.log('ℹ️ Supabase credentials not found, running in demo mode')
  console.log('URL available:', !!supabaseUrl, 'Key available:', !!supabaseAnonKey)
  console.log('URL value:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'not found')
}

export { supabase }

// Anonymous session management
let anonymousSessionInitialized = false

/**
 * Ensures an anonymous session exists for database access with RLS policies.
 * This is required when RLS is enabled and requires authentication.
 * Supabase automatically stores the session in localStorage.
 */
export const ensureAnonymousSession = async () => {
  if (!isSupabaseConfigured()) {
    console.log('ℹ️ Supabase not configured, skipping anonymous auth')
    return null
  }

  try {
    // Check if we already have an active session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (session) {
      console.log('✅ Active session found:', session.user.id)
      anonymousSessionInitialized = true
      return session
    }

    // No session exists, sign in anonymously
    console.log('🔐 No active session found, signing in anonymously...')
    const { data, error } = await supabase.auth.signInAnonymously()
    
    if (error) {
      console.warn('⚠️ Anonymous sign-in error:', error.message)
      console.log('   This is expected if RLS policies allow anon role access')
      return null
    }
    
    if (data.session) {
      console.log('✅ Anonymous session created:', data.session.user.id)
      anonymousSessionInitialized = true
      return data.session
    }
    
    return null
  } catch (error) {
    console.warn('⚠️ Could not establish anonymous session:', error.message)
    console.log('   Continuing without session - RLS policies may block access')
    return null
  }
}

/**
 * Get the current authenticated user (anonymous or otherwise)
 */
export const getCurrentUser = async () => {
  if (!isSupabaseConfigured()) return null
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  } catch (error) {
    console.log('Could not get current user:', error.message)
    return null
  }
}

// Table name mappings (hardcoded to match your actual Supabase database)
// Based on error messages from database
let tableNameMappings = {
  users: 'Users',  
  buildings: 'Building',  // Error said "Perhaps you meant the table 'public.Building'"
  rooms: 'Room',  // Error said "Perhaps you meant the table 'public.Room'"
  content_items: 'Content',
  activities: null,  // Table doesn't exist - will use mock data
  notifications: null,  // Table doesn't exist - will use mock data
  tours: 'Tours',  // Assuming this exists based on pattern
  tour_stops: 'Tour_Stops',
  qr_codes: 'QR Code',  // Error said "Perhaps you meant the table 'public.QR Code'" (with space!)
  tour_visits: 'Tour_Visits'
}

// Column name mappings for tables with different column naming conventions
// This helps handle cases where table columns use different casing (e.g., 'ID' vs 'id')
let columnMappings = {
  Users: {
    user_id: null, // Will be detected during initialization
    email: null,
    first_name: null,
    middle_name: null,
    last_name: null,
    user_type: null,
    phone_number: null,
    college: null
  },
  Content: {
    id: null,
    title: null,
    file_url: null,
    content_type: null
  },
  Buildings: {
    id: null,
    name: null
  },
  Tours: {
    id: null,
    name: null
  }
}

// Check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabase !== null
}

// Function to detect actual column names in a table
const detectColumnNames = async (tableName) => {
  try {
    console.log(`🔍 Detecting columns for table: ${tableName}`)
    
    // Fetch one row to see what columns exist
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .limit(1)
    
    if (error) {
      console.log(`⚠️ Could not detect columns for ${tableName}:`, error.message)
      return null
    }
    
    if (data && data.length > 0) {
      const columns = Object.keys(data[0])
      console.log(`✅ Detected columns in ${tableName}:`, columns)
      return columns
    }
    
    // If table is empty, try inserting and deleting a test row to detect columns
    console.log(`⚠️ Table ${tableName} is empty, cannot detect columns automatically`)
    return null
  } catch (error) {
    console.log(`⚠️ Error detecting columns:`, error.message)
    return null
  }
}

// Database initialization function
export const initializeDatabase = async () => {
  if (!isSupabaseConfigured()) {
    console.log('Supabase not configured, using mock data')
    return Promise.resolve()
  }
  
  try {
    // IMPORTANT: Ensure anonymous session exists before accessing database
    // This is required when RLS policies require authentication
    console.log('🔐 Ensuring anonymous session for RLS access...')
    await ensureAnonymousSession()
    
    // Check what tables actually exist by testing different possible names
    console.log('🔍 Checking existing tables...')
    const tableVariants = {
      users: ['Users', 'users', 'user', 'User'],
      buildings: ['Building', 'Buildings', 'buildings', 'building'],
      rooms: ['Room', 'Rooms', 'rooms', 'room'],
      content_items: ['Content', 'content_items', 'content', 'Content_Items'],
      activities: ['Activity', 'Activities', 'activities', 'activity'],
      notifications: ['Notification', 'Notifications', 'notifications', 'notification'],
      tours: ['Tours', 'tours', 'tour', 'Tour'],
      qr_codes: ['QR Code', 'QR_Codes', 'qr_codes', 'qrcodes', 'QRCodes']
    }
    
    const actualTableNames = {}
    
    for (const [expectedName, variants] of Object.entries(tableVariants)) {
      let found = false
      for (const variant of variants) {
        try {
          // Use * selector with head:true to just check table exists without fetching data
          const { count, error } = await supabase
            .from(variant)
            .select('*', { count: 'exact', head: true })
          
          if (!error) {
            actualTableNames[expectedName] = variant
            console.log(`✅ Found table: ${expectedName} -> ${variant} (${count} records)`)
            found = true
            break
          }
          // Silently continue if this variant doesn't exist
        } catch (e) {
          // Silently continue trying other variants
        }
      }
      
      if (!found) {
        // Use the default mapping instead of null
        actualTableNames[expectedName] = tableNameMappings[expectedName]
        if (actualTableNames[expectedName]) {
          console.log(`📋 Using default mapping: ${expectedName} -> ${actualTableNames[expectedName]}`)
        } else {
          console.log(`❌ Table not found: ${expectedName} (will use mock data)`)
        }
      }
    }
    
    // Store the actual table names in module variable and window for backup
    tableNameMappings = actualTableNames
    window.actualTableNames = actualTableNames
    
    console.log('📋 Table mappings:', tableNameMappings)
    
    // Detect column names for Users table
    if (actualTableNames.users) {
      const userColumns = await detectColumnNames(actualTableNames.users)
      if (userColumns) {
        window.userTableColumns = userColumns
      }
      
      // Also inspect the actual schema to verify column names
      console.log('🔍 Verifying actual Users table schema...');
      const schemaInfo = await inspectTableSchema(actualTableNames.users);
      if (schemaInfo) {
        window.usersTableSchema = schemaInfo;
        console.log('✅ Users table schema verified');
      }
      
      // Sample data insertion removed - users already exist in database
    }
    
    console.log('✅ Database initialization completed')
    
  } catch (error) {
    console.error('Database initialization error:', error)
    throw error
  }
}

// Create all necessary tables
const createTables = async () => {
  // Note: In a real environment, these would be created via Supabase Dashboard or migrations
  // This is just for demonstration purposes
  
  const tableCreationQueries = [
    // Users table
    `CREATE TABLE IF NOT EXISTS public.users (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    -- numeric short id used by legacy code (keeps smallint constraints)
    user_id smallint UNIQUE GENERATED ALWAYS AS IDENTITY, -- auto-increment smallint
    email varchar(255) UNIQUE NOT NULL,
    full_name varchar(255),
    user_type varchar(100),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    last_active timestamp with time zone DEFAULT now() NOT NULL,
    profile_image varchar(1024)
    );

    CREATE EXTENSION IF NOT EXISTS "pgcrypto";

    CREATE INDEX IF NOT EXISTS idx_users_user_id ON public.users (user_id);
    CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
    );`,

    // Buildings table
    `CREATE TABLE IF NOT EXISTS buildings (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      address VARCHAR,
      latitude DECIMAL,
      longitude DECIMAL,
      image_url VARCHAR,
      total_rooms INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Rooms table
    `CREATE TABLE IF NOT EXISTS rooms (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      building_id UUID REFERENCES buildings(id) ON DELETE CASCADE,
      name VARCHAR NOT NULL,
      room_number VARCHAR,
      description TEXT,
      floor_level INTEGER,
      room_type VARCHAR,
      capacity INTEGER,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Content/Media table
    `CREATE TABLE IF NOT EXISTS content_items (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title VARCHAR NOT NULL,
      description TEXT,
      content_type VARCHAR NOT NULL, -- 'image', 'video', 'audio', '360_image'
      file_url VARCHAR NOT NULL,
      thumbnail_url VARCHAR,
      building_id UUID REFERENCES buildings(id),
      room_id UUID REFERENCES rooms(id),
      tags TEXT[],
      file_size BIGINT,
      duration INTEGER, -- for videos/audio
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Tours table
    `CREATE TABLE IF NOT EXISTS tours (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      name VARCHAR NOT NULL,
      description TEXT,
      tour_type VARCHAR DEFAULT 'self_guided', -- 'self_guided', 'guided', 'virtual'
      estimated_duration INTEGER, -- in minutes
      is_active BOOLEAN DEFAULT true,
      total_stops INTEGER DEFAULT 0,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    );`,

    // Tour stops table
    `CREATE TABLE IF NOT EXISTS tour_stops (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
      building_id UUID REFERENCES buildings(id),
      room_id UUID REFERENCES rooms(id),
      stop_order INTEGER NOT NULL,
      title VARCHAR NOT NULL,
      description TEXT,
      estimated_time INTEGER, -- in minutes
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // QR Codes table
    `CREATE TABLE IF NOT EXISTS qr_codes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      code VARCHAR UNIQUE NOT NULL,
      qr_url VARCHAR NOT NULL,
      destination_type VARCHAR NOT NULL, -- 'building', 'room', 'tour'
      destination_id UUID NOT NULL,
      title VARCHAR NOT NULL,
      description TEXT,
      scan_count INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      last_scanned TIMESTAMP
    );`,

    // Analytics/Activities table
    `CREATE TABLE IF NOT EXISTS activities (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      activity_type VARCHAR NOT NULL, -- 'registration', 'media_upload', 'qr_generated', 'tour_started', etc.
      title VARCHAR NOT NULL,
      description TEXT,
      user_id UUID REFERENCES users(id),
      related_id UUID, -- ID of related entity (building, tour, etc.)
      related_type VARCHAR, -- Type of related entity
      metadata JSONB,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // Tour visits/analytics table
    `CREATE TABLE IF NOT EXISTS tour_visits (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      tour_id UUID REFERENCES tours(id),
      user_id UUID REFERENCES users(id),
      building_id UUID REFERENCES buildings(id),
      room_id UUID REFERENCES rooms(id),
      visit_duration INTEGER, -- in seconds
      completed BOOLEAN DEFAULT false,
      device_type VARCHAR,
      created_at TIMESTAMP DEFAULT NOW()
    );`,

    // System notifications table
    `CREATE TABLE IF NOT EXISTS notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      type VARCHAR NOT NULL, -- 'alert', 'info', 'success', 'warning'
      title VARCHAR NOT NULL,
      description TEXT,
      priority VARCHAR DEFAULT 'medium', -- 'high', 'medium', 'low'
      is_read BOOLEAN DEFAULT false,
      user_id UUID REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      read_at TIMESTAMP
    );`
  ]

  // Execute table creation (in real app, this would be done via Supabase migrations)
  for (const query of tableCreationQueries) {
    try {
      await supabase.rpc('execute_sql', { query })
    } catch (error) {
      // Tables likely already exist, which is fine
      console.log('Table creation note:', error.message)
    }
  }
}

// Mock data fallbacks
const mockStats = {
  totalUsers: 2947,
  buildingsMapped: 24,
  contentItems: 1452,
  tourViews: 18921
}

const mockActivities = [
  {
    id: 1,
    type: 'registration',
    title: 'New User Registration',
    description: '15 users registered for virtual tours',
    time: '2 hours ago',
    user: 'System',
    icon: 'Users',
    color: 'bg-blue-500'
  },
  {
    id: 2,
    type: 'media_upload',
    title: 'Media Upload Complete',
    description: 'Added 8 photos to Science Building tour',
    time: '4 hours ago',
    user: 'Admin',
    icon: 'Upload',
    color: 'bg-green-500'
  },
  {
    id: 3,
    type: 'qr_generated',
    title: 'QR Code Generated',
    description: 'New QR Codes for Library entrance',
    time: '6 hours ago',
    user: 'System',
    icon: 'QrCode',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    type: 'content_updated',
    title: 'Building Content Updated',
    description: 'Engineering Building tour content revised',
    time: '8 hours ago',
    user: 'Admin',
    icon: 'Building',
    color: 'bg-orange-500'
  }
]

const mockNotifications = [
  {
    id: 1,
    type: 'alert',
    title: 'System Maintenance',
    description: 'Scheduled maintenance tonight 2:00 AM - 4:00 AM',
    time: '1 hour ago',
    read: false,
    priority: 'high'
  },
  {
    id: 2,
    type: 'info',
    title: 'New Feature Available',
    description: 'QR Code analytics dashboard is now live',
    time: '3 hours ago',
    read: false,
    priority: 'medium'
  },
  {
    id: 3,
    type: 'success',
    title: 'Backup Completed',
    description: 'Daily data backup finished successfully',
    time: '5 hours ago',
    read: true,
    priority: 'low'
  }
]

// Function to inspect actual table schema
export const inspectTableSchema = async (tableName) => {
  if (!isSupabaseConfigured()) {
    console.log('❌ Supabase not configured');
    return null;
  }

  try {
    console.log(`🔍 Inspecting schema for table: ${tableName}`);
    
    // Get a sample row to see actual column names
    const { data: sampleData, error: sampleError } = await supabase
      .from(tableName)
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error(`❌ Error getting sample from ${tableName}:`, sampleError);
      return null;
    }
    
    if (sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0]);
      console.log(`📋 Actual columns in ${tableName}:`, columns);
      console.log(`📋 Sample data:`, sampleData[0]);
      return { columns, sampleData: sampleData[0] };
    } else {
      console.log(`⚠️ Table ${tableName} is empty`);
      return { columns: [], sampleData: null };
    }
  } catch (error) {
    console.error(`❌ Error inspecting ${tableName}:`, error);
    return null;
  }
};

// Helper function to get actual table name
export const getTableName = (expectedName) => {
  // Always use module-level mapping which has the correct defaults
  const tableName = tableNameMappings[expectedName]
  
  // If null (table doesn't exist), return null so queries can be skipped
  if (tableName === null) {
    return null
  }
  
  // Otherwise return the mapped name (capitalized) or fallback to original
  return tableName || expectedName
}

// API Functions for dashboard statistics
export const getDashboardStats = async () => {
  if (!isSupabaseConfigured()) {
    // Return mock data with slight variations to simulate real data
    return Promise.resolve({
      totalUsers: mockStats.totalUsers + Math.floor(Math.random() * 100),
      buildingsMapped: mockStats.buildingsMapped,
      contentItems: mockStats.contentItems + Math.floor(Math.random() * 50),
      tourViews: mockStats.tourViews + Math.floor(Math.random() * 500)
    })
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 10000)
    );

    const usersTable = getTableName('users')
    const buildingsTable = getTableName('buildings')
    const contentTable = getTableName('content_items')
    const toursTable = getTableName('tours')

    const dataPromise = Promise.all([
      usersTable ? supabase.from(usersTable).select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
      buildingsTable ? supabase.from(buildingsTable).select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
      contentTable ? supabase.from(contentTable).select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 }),
      toursTable ? supabase.from(toursTable).select('*', { count: 'exact', head: true }) : Promise.resolve({ count: 0 })
    ]);

    const [
      { count: totalUsers },
      { count: buildingsMapped },
      { count: contentItems },
      { count: tourViews }
    ] = await Promise.race([dataPromise, timeoutPromise]);

    console.log('📊 Stats retrieved:', { totalUsers, buildingsMapped, contentItems, tourViews })

    return {
      totalUsers: totalUsers || 0,
      buildingsMapped: buildingsMapped || 0,
      contentItems: contentItems || 0,
      tourViews: tourViews || 0
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return mock data as fallback
    return mockStats
  }
}

// Get recent activities
export const getRecentActivities = async (limit = 10) => {
  if (!isSupabaseConfigured()) {
    // Return mock activities with some randomization
    return Promise.resolve(mockActivities.slice(0, limit).map(activity => ({
      ...activity,
      time: getRandomTimeAgo()
    })))
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );

    const activitiesTable = getTableName('activities')
    const usersTable = getTableName('users')
    
    if (!activitiesTable) {
      console.log('ℹ️ Activities table not configured, using mock data')
      return mockActivities.slice(0, limit)
    }
    // Try with created_at ordering; if that column doesn't exist, retry without ordering
    const baseSelect = supabase
      .from(activitiesTable)
      .select(`
        *,
        ${usersTable}(full_name)
      `)
      .limit(limit);

    let { data, error } = await Promise.race([
      baseSelect.order('created_at', { ascending: false }),
      timeoutPromise
    ]);

    if (error && error.message && error.message.includes('created_at does not exist')) {
      console.log('⚠️ created_at column not found in Activity table, fetching without ordering');
      const fallback = await Promise.race([baseSelect, timeoutPromise]);
      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      console.log('ℹ️ Activities query failed (expected if table not created), using mock data')
      return mockActivities.slice(0, limit)
    }

    return data?.map(activity => ({
      id: activity.id,
      type: activity.activity_type,
      title: activity.title,
      description: activity.description,
      time: formatTimeAgo(activity.created_at),
      user: activity[usersTable]?.full_name || 'System',
      icon: getActivityIcon(activity.activity_type),
      color: getActivityColor(activity.activity_type)
    })) || []
  } catch (error) {
    console.log('ℹ️ Error fetching activities (using mock data):', error.message || error)
    return mockActivities.slice(0, limit)
  }
}

// Get notifications
export const getNotifications = async (userId = null) => {
  if (!isSupabaseConfigured()) {
    return Promise.resolve(mockNotifications)
  }

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), 8000)
    );

    const notificationsTable = getTableName('notifications')
    
    if (!notificationsTable) {
      console.log('ℹ️ Notifications table not configured, using mock data')
      return mockNotifications
    }

    let query = supabase
      .from(notificationsTable)
      .select('*')
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data, error } = await Promise.race([query, timeoutPromise]);

    if (error) {
      console.log('ℹ️ Notifications query failed (expected if table not created), using mock data')
      return mockNotifications
    }

    return data?.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      description: notification.description,
      time: formatTimeAgo(notification.created_at),
      read: notification.is_read,
      priority: notification.priority
    })) || []
  } catch (error) {
    console.log('ℹ️ Error fetching notifications (using mock data):', error.message || error)
    return mockNotifications
  }
}

// Helper functions
const formatTimeAgo = (dateString) => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInHours = Math.floor((now - date) / (1000 * 60 * 60))
  
  if (diffInHours < 1) return 'Just now'
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
  
  const diffInDays = Math.floor(diffInHours / 24)
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
}

const getActivityIcon = (type) => {
  const icons = {
    'registration': 'Users',
    'media_upload': 'Upload',
    'qr_generated': 'QrCode',
    'tour_started': 'Route',
    'content_updated': 'Building'
  }
  return icons[type] || 'Activity'
}

const getActivityColor = (type) => {
  const colors = {
    'registration': 'bg-blue-500',
    'media_upload': 'bg-green-500',
    'qr_generated': 'bg-purple-500',
    'tour_started': 'bg-orange-500',
    'content_updated': 'bg-yellow-500'
  }
  return colors[type] || 'bg-gray-500'
}

// Get random time ago for mock data
const getRandomTimeAgo = () => {
  const timeOptions = [
    '2 minutes ago', '15 minutes ago', '1 hour ago', '2 hours ago', 
    '4 hours ago', '6 hours ago', '8 hours ago', '1 day ago'
  ]
  return timeOptions[Math.floor(Math.random() * timeOptions.length)]
}

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  if (!isSupabaseConfigured()) {
    // For mock mode, just return success
    console.log('Mock: Marked notification as read:', notificationId)
    return Promise.resolve(true)
  }

  try {
    const notificationsTable = getTableName('notifications')
    
    if (!notificationsTable) {
      console.log('Notifications table not found, skipping update')
      return true
    }

    const { error } = await supabase
      .from(notificationsTable)
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking notification as read:', error)
    return false
  }
}

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId = null) => {
  if (!isSupabaseConfigured()) {
    // For mock mode, just return success
    console.log('Mock: Marked all notifications as read')
    return Promise.resolve(true)
  }

  try {
    const notificationsTable = getTableName('notifications')
    
    if (!notificationsTable) {
      console.log('Notifications table not found, skipping update')
      return true
    }

    let query = supabase
      .from(notificationsTable)
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('is_read', false)

    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { error } = await query

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking all notifications as read:', error)
    return false
  }
}

// ========================================
// ====== USER MANAGEMENT FUNCTIONS =======
// ========================================

const normalizeUserData = (dbUser) => {
  if (!dbUser) return null
  
  return {
    id: dbUser.user_id || dbUser.ID || dbUser.Id,
    user_id: dbUser.user_id || dbUser.ID || dbUser.Id,
    email: dbUser.email || dbUser.Email || dbUser.EMAIL,
    first_name: dbUser.first_name || dbUser.First_Name || dbUser.FirstName || dbUser.firstname || '',
    middle_name: dbUser.middle_name || dbUser.Middle_Name || dbUser.MiddleName || dbUser.middlename || '',
    last_name: dbUser.last_name || dbUser.Last_Name || dbUser.LastName || dbUser.lastname || '',
    user_type: dbUser.user_type || dbUser.user_type || dbUser.user_type || 'visitor',
    phone_number: dbUser.phone_number || dbUser.phone_number || '',
    college: dbUser.college || dbUser.College || '',
    status: dbUser.status || dbUser.Status || 'Active',
    created_at: dbUser.created_at || dbUser.Created_At || dbUser.CreatedAt,
    last_active: dbUser.last_active || dbUser.Last_Active || dbUser.LastActive,
    profile_image: dbUser.profile_image || dbUser.Profile_Image || dbUser.ProfileImage
  }
}

export const getUsers = async () => {
  if (!isSupabaseConfigured()) {
    console.log('⚠️ Supabase not configured, returning empty users array')
    return []
  }

  try {
    const usersTable = getTableName('users')
    console.log('📋 Fetching users from table:', usersTable)
    
    if (!usersTable) {
      console.log('❌ Users table name not found in mappings')
      return []
    }

    const { data, error } = await supabase
      .from(usersTable)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Error from Supabase:', error.message, error.details)
      throw error
    }
    
    console.log(`✅ Fetched ${data?.length || 0} users from database`)
    if (data && data.length > 0) {
      console.log('   First user (raw):', data[0])
      console.log('   Available columns:', Object.keys(data[0]))
    }
    
    // Normalize the data to expected format
    const normalizedData = data?.map(normalizeUserData) || []
    
    if (normalizedData.length > 0) {
      console.log('   First user (normalized):', normalizedData[0])
    }
    
    return normalizedData
  } catch (error) {
    console.error('❌ Error fetching users:', error.message || error)
    return []
  }
}

export const getColleges = async () => {
  if (!isSupabaseConfigured()) return []

  try {
    const { data, error } = await supabase
      .from('College')
      .select('*')
      .order('college_name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching colleges:', error)
    return []
  }
}

export const addUser = async (userData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const usersTable = getTableName('users')
    if (!usersTable) return null

    // Map to actual column names based on your database schema
    const filteredData = {
      email: userData.email,
      first_name: userData.first_name,
      middle_name: userData.middle_name || '',
      last_name: userData.last_name,
      user_type: userData.user_type,
      phone_number: userData.phone_number || '',
      college: userData.college || ''
    }
    
    console.log('📝 Adding user with data:', filteredData)

    const { data, error } = await supabase
      .from(usersTable)
      .insert([filteredData])
      .select()

    if (error) throw error
    
    // Normalize the returned data
    return normalizeUserData(data?.[0]) || null
  } catch (error) {
    console.error('Error adding user:', error)
    throw error
  }
}

export const updateUser = async (userId, updates) => {
  if (!isSupabaseConfigured()) return null

  try {
    const usersTable = getTableName('users')
    if (!usersTable) return null

    // Detect actual column names from existing data
    const { data: sampleData } = await supabase
      .from(usersTable)
      .select('*')
      .limit(1)
    
    let nameColumn = 'full_name'
    let emailColumn = 'email'
    let roleColumn = 'user_type'
    let profileImageColumn = 'profile_image'
    
    if (sampleData && sampleData.length > 0) {
      const columns = Object.keys(sampleData[0])
      const lowerColumns = columns.map(c => c.toLowerCase())
      
      // Find actual column names
      if (lowerColumns.includes('fullname')) nameColumn = columns[lowerColumns.indexOf('fullname')]
      else if (lowerColumns.includes('full_name')) nameColumn = columns[lowerColumns.indexOf('full_name')]
      else if (lowerColumns.includes('name') && !columns[lowerColumns.indexOf('name')].toLowerCase().includes('user')) {
        nameColumn = columns[lowerColumns.indexOf('name')]
      }
      
      if (lowerColumns.includes('email')) emailColumn = columns[lowerColumns.indexOf('email')]
      if (lowerColumns.includes('user_type')) roleColumn = columns[lowerColumns.indexOf('user_type')]
      
      const profileImgIdx = lowerColumns.findIndex(c => c.includes('profile') && c.includes('image'))
      if (profileImgIdx >= 0) profileImageColumn = columns[profileImgIdx]
    }

    // Map to actual column names
    const filteredUpdates = {}
    if (updates.email !== undefined) filteredUpdates[emailColumn] = updates.email
    if (updates.full_name !== undefined) filteredUpdates[nameColumn] = updates.full_name
    if (updates.user_type !== undefined) filteredUpdates[roleColumn] = updates.user_type
    if (updates.profile_image !== undefined) filteredUpdates[profileImageColumn] = updates.profile_image

    console.log('📝 Updating user with data:', filteredUpdates)

    const { data, error } = await supabase
      .from(usersTable)
      .update(filteredUpdates)
      .eq('id', userId)
      .select()

    if (error) throw error
    
    // Normalize the returned data
    return normalizeUserData(data?.[0]) || null
  } catch (error) {
    console.error('Error updating user:', error)
    throw error
  }
}

export const deleteUser = async (userId) => {
  console.log("🧠 deleteUser called with:", userId, "| typeof:", typeof userId);
  console.trace("🧩 deleteUser call stack:");
  if (!isSupabaseConfigured()) return false;

  try {
    // Normalize object input (like { user_id: 8 }, { id: 8 }, etc.)
    let normalizedId = userId;
    if (normalizedId && typeof normalizedId === 'object') {
      // Prioritize user_id since that's the actual primary key column
      normalizedId = normalizedId.user_id ?? normalizedId.id ?? normalizedId.userId ?? normalizedId.userid ?? normalizedId.ID;
    }

    if (normalizedId === undefined || normalizedId === null || normalizedId === '') {
      console.error('❌ deleteUser: missing user identifier');
      return false;
    }

    const usersTable = getTableName('users');
    if (!usersTable) {
      console.error('❌ deleteUser: could not resolve users table name');
      return false;
    }

    // Attempt deletion by discovered identifier columns for robustness
    let attempts = [];
    let discoveredColumns = null; // set of actual columns if we could sample

    // Gather candidate id columns from provided object first (preserve exact casing)
    if (typeof userId === 'object' && userId) {
      const isIdKey = (k) => {
        const lc = k.toLowerCase();
        return lc === 'id' || lc === 'user_id' || lc.endsWith('_id');
      };
      const providedKeys = Object.keys(userId).filter(isIdKey);
      for (const key of providedKeys) {
        attempts.push({ column: key, value: userId[key] });
      }
    }

    // Discover id-like columns from a sample row in the table
    try {
      const { data: sampleRows } = await supabase.from(usersTable).select('*').limit(1);
      if (sampleRows && sampleRows.length > 0) {
        const sampleCols = Object.keys(sampleRows[0]);
        discoveredColumns = new Set(sampleCols);
        const idLike = sampleCols.filter(c => c.toLowerCase() === 'id' || c.toLowerCase() === 'user_id' || (c.toLowerCase().endsWith('id') && c.length <= 6));
        // Prioritize 'user_id' first since that's the actual primary key
        const priority = (c) => {
          const lc = c.toLowerCase();
          if (lc === 'user_id') return 0;
          if (lc === 'id') return 1;
          return 2;
        };
        idLike.sort((a,b) => priority(a) - priority(b));
        for (const col of idLike) {
          attempts.push({ column: col, value: normalizedId });
        }
      }
    } catch (_) {
      // ignore discovery errors, fallback below
    }

    // Final fallbacks if nothing found
    if (attempts.length === 0) {
      attempts.push({ column: 'user_id', value: normalizedId });
    }

    // If we discovered actual columns, drop any attempts for non-existent columns
    if (discoveredColumns) {
      attempts = attempts.filter(a => discoveredColumns.has(a.column));
    }

    // Include provided keys again after discovery filtering, but only if they exist
    if (typeof userId === 'object' && userId) {
      const isIdKey = (k) => {
        const lc = k.toLowerCase();
        return lc === 'id' || lc === 'user_id' || lc.endsWith('_id');
      };
      const providedKeys = Object.keys(userId).filter(isIdKey);
      for (const key of providedKeys) {
        if (!discoveredColumns || discoveredColumns.has(key)) {
          attempts.push({ column: key, value: userId[key] });
        }
      }
    }

    // De-duplicate attempts by column, preserving first occurrence
    const seen = new Set();
    attempts = attempts.filter(a => {
      const lc = a.column.toLowerCase();
      if (seen.has(lc)) return false;
      seen.add(lc);
      return true;
    });

    // Ensure our preferred priority: user_id first, then others
    attempts.sort((a, b) => {
      const pa = a.column.toLowerCase() === 'user_id' ? 0 : 1;
      const pb = b.column.toLowerCase() === 'user_id' ? 0 : 1;
      return pa - pb;
    });

    console.log('🔍 Delete attempts:', attempts.map(a => `${a.column}=${a.value}`));
    
    // Check if the user exists first
    console.log('🔍 Checking if user exists before deletion...');
    const { data: existingUser, error: checkError } = await supabase
      .from(usersTable)
      .select('*')
      .eq('user_id', normalizedId)
      .limit(1);
    
    if (checkError) {
      console.warn('⚠️ Error checking if user exists:', checkError.message);
      return false;
    } else if (!existingUser || existingUser.length === 0) {
      console.log('❌ User does not exist with user_id =', normalizedId);
      return false;
    }
    
    console.log('✅ User exists:', existingUser[0]);
    
    let deleted = false;
    let lastError = null;
    for (const attempt of attempts) {
      // Determine value typing based on column name
      let value = attempt.value;
      const colLc = attempt.column.toLowerCase();
      if (colLc === 'user_id' || colLc.endsWith('_id')) {
        // If the provided value is an integer-like string/number, use integer;
        // otherwise, keep as-is (e.g., UUID strings)
        const n = Number(value);
        if (Number.isInteger(n)) {
          value = n;
        }
      }

      console.info(`🗑️ deleteUser: trying ${usersTable} where ${attempt.column} = ${value} (type: ${typeof value})`);
      const { data, error } = await supabase
        .from(usersTable)
        .delete()
        .eq(attempt.column, value)
        // Do not request a specific column in case it doesn't exist; just return deleted rows
        .select();
      
      console.log(`🔍 Delete result for ${attempt.column}=${value}:`, { data, error });
      
      if (error) {
        console.warn(`⚠️ deleteUser: error with ${attempt.column}=${value}:`, error.message);
        lastError = error;
        continue;
      }
      if (data && data.length > 0) {
        console.log(`✅ deleteUser: successfully deleted ${data.length} row(s)`);
        deleted = true;
        break;
      } else {
        console.log(`⚠️ deleteUser: no rows matched ${attempt.column}=${value}`);
      }
    }

    if (!deleted) {
      if (lastError) console.warn('⚠️ deleteUser: attempts ended with last error:', lastError.message);
      console.warn('⚠️ deleteUser: no rows deleted using id/user_id attempts');
      return false;
    }

    console.info('✅ deleteUser: successfully deleted user');
    return true;

  } catch (error) {
    console.error('❌ Error deleting user:', error);
    return false;
  }
};

// ========================================
// BUILDINGS & ROOMS FUNCTIONS
// ========================================

export const getBuildings = async () => { 
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const buildingsTable = getTableName('buildings')
    if (!buildingsTable) return []

    // First try with created_at, fallback to no ordering if column doesn't exist
    let { data, error } = await supabase
      .from(buildingsTable)
      .select('*')
      .order('created_at', { ascending: false })

    if (error && error.message.includes('created_at does not exist')) {
      console.log('⚠️ created_at column not found in Building table, fetching without ordering');
      const result = await supabase
        .from(buildingsTable)
        .select('*')
      data = result.data
      error = result.error
    }

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching buildings:', error)
    return []
  }
}

export const addBuilding = async (buildingData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const buildingsTable = getTableName('buildings')
    if (!buildingsTable) return null

    // Map the input data to the actual Building table schema
    // building_id is required and must be an integer, so generate a small unique ID
    const mappedData = {
      building_id: Math.floor(Math.random() * 10000) + 100, // Generate random integer between 100-10099
      building_name: buildingData.name || buildingData.building_name,
      building_nickname: buildingData.building_nickname || '',
      building_type: buildingData.building_type || 'Academic',
      address: buildingData.address || '', // Add address support
    };

    // Remove undefined values
    const filteredData = Object.fromEntries(
      Object.entries(mappedData).filter(([_, value]) => value !== undefined)
    );

    console.log('🔍 Adding building with filtered data:', filteredData);

    const { data, error } = await supabase
      .from(buildingsTable)
      .insert([filteredData])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error adding building:', error)
    throw error
  }
}

export const updateBuilding = async (buildingId, updates) => {
  if (!isSupabaseConfigured()) return null

  try {
    const buildingsTable = getTableName('buildings')
    if (!buildingsTable) return null

    // Filter updates to only include fields that exist in the Building table
    // Based on the sample data: building_id, college_id, building_name, building_nickname, building_type
    const allowedFields = {
      building_name: updates.name || updates.building_name,
      building_nickname: updates.building_nickname,
      building_type: updates.building_type,
      address: updates.address, // Add address support
      description: updates.description, // Add description support
    };

    // Remove undefined values
    const filteredUpdates = Object.fromEntries(
      Object.entries(allowedFields).filter(([_, value]) => value !== undefined)
    );

    console.log('🔍 Updating building with filtered fields:', filteredUpdates);

    const { data, error } = await supabase
      .from(buildingsTable)
      .update(filteredUpdates)
      .eq('building_id', buildingId) // Use building_id instead of id
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error updating building:', error)
    throw error
  }
}

export const deleteBuilding = async (buildingId) => {
  console.log("🧠 deleteBuilding called with:", buildingId, "| typeof:", typeof buildingId);
  console.trace("🧩 deleteBuilding call stack:");
  if (!isSupabaseConfigured()) return false;

  try {
    // Normalize object input (like { building_id: 15 }, { id: 15 }, etc.)
    let normalizedId = buildingId;
    if (normalizedId && typeof normalizedId === 'object') {
      // Prioritize building_id since that's the actual primary key column
      normalizedId = normalizedId.building_id ?? normalizedId.id ?? normalizedId.buildingId ?? normalizedId.buildingid ?? normalizedId.ID;
    }

    if (normalizedId === undefined || normalizedId === null || normalizedId === '') {
      console.error('❌ deleteBuilding: missing building identifier');
      return false;
    }

    const buildingsTable = getTableName('buildings');
    if (!buildingsTable) {
      console.error('❌ deleteBuilding: could not resolve buildings table name');
      return false;
    }

    // Attempt deletion by discovered identifier columns for robustness
    let attempts = [];
    let discoveredColumns = null; // set of actual columns if we could sample

    // Gather candidate id columns from provided object first (preserve exact casing)
    if (typeof buildingId === 'object' && buildingId) {
      const isIdKey = (k) => {
        const lc = k.toLowerCase();
        return lc === 'id' || lc === 'building_id' || lc.endsWith('_id');
      };
      const providedKeys = Object.keys(buildingId).filter(isIdKey);
      for (const key of providedKeys) {
        attempts.push({ column: key, value: buildingId[key] });
      }
    }

    // Discover id-like columns from a sample row in the table
    try {
      const { data: sampleRows } = await supabase.from(buildingsTable).select('*').limit(1);
      if (sampleRows && sampleRows.length > 0) {
        const sampleCols = Object.keys(sampleRows[0]);
        discoveredColumns = new Set(sampleCols);
        const idLike = sampleCols.filter(c => c.toLowerCase() === 'id' || c.toLowerCase() === 'building_id' || (c.toLowerCase().endsWith('id') && c.length <= 10));
        // Prioritize 'building_id' first since that's the actual primary key
        const priority = (c) => {
          const lc = c.toLowerCase();
          if (lc === 'building_id') return 0;
          if (lc === 'id') return 1;
          return 2;
        };
        idLike.sort((a,b) => priority(a) - priority(b));
        for (const col of idLike) {
          attempts.push({ column: col, value: normalizedId });
        }
      }
    } catch (_) {
      // ignore discovery errors, fallback below
    }

    // Final fallbacks if nothing found
    if (attempts.length === 0) {
      attempts.push({ column: 'building_id', value: normalizedId });
    }

    // If we discovered actual columns, drop any attempts for non-existent columns
    if (discoveredColumns) {
      attempts = attempts.filter(a => discoveredColumns.has(a.column));
    }

    // Include provided keys again after discovery filtering, but only if they exist
    if (typeof buildingId === 'object' && buildingId) {
      const isIdKey = (k) => {
        const lc = k.toLowerCase();
        return lc === 'id' || lc === 'building_id' || lc.endsWith('_id');
      };
      const providedKeys = Object.keys(buildingId).filter(isIdKey);
      for (const key of providedKeys) {
        if (!discoveredColumns || discoveredColumns.has(key)) {
          attempts.push({ column: key, value: buildingId[key] });
        }
      }
    }

    // De-duplicate attempts by column, preserving first occurrence
    const seen = new Set();
    attempts = attempts.filter(a => {
      const lc = a.column.toLowerCase();
      if (seen.has(lc)) return false;
      seen.add(lc);
      return true;
    });

    // Ensure our preferred priority: building_id first, then others
    attempts.sort((a, b) => {
      const pa = a.column.toLowerCase() === 'building_id' ? 0 : 1;
      const pb = b.column.toLowerCase() === 'building_id' ? 0 : 1;
      return pa - pb;
    });

    console.log('🔍 Delete attempts:', attempts.map(a => `${a.column}=${a.value}`));
    
    // Check if the building exists first
    console.log('🔍 Checking if building exists before deletion...');
    const { data: existingBuilding, error: checkError } = await supabase
      .from(buildingsTable)
      .select('*')
      .eq('building_id', normalizedId)
      .limit(1);
    
    if (checkError) {
      console.warn('⚠️ Error checking if building exists:', checkError.message);
      return false;
    } else if (!existingBuilding || existingBuilding.length === 0) {
      console.log('❌ Building does not exist with building_id =', normalizedId);
      return false;
    }
    
    console.log('✅ Building exists:', existingBuilding[0]);
    
    let deleted = false;
    let lastError = null;
    for (const attempt of attempts) {
      // Determine value typing based on column name
      let value = attempt.value;
      const colLc = attempt.column.toLowerCase();
      if (colLc === 'building_id' || colLc.endsWith('_id')) {
        // If the provided value is an integer-like string/number, use integer;
        // otherwise, keep as-is (e.g., UUID strings)
        const n = Number(value);
        if (Number.isInteger(n)) {
          value = n;
        }
      }

      console.info(`🗑️ deleteBuilding: trying ${buildingsTable} where ${attempt.column} = ${value} (type: ${typeof value})`);
      const { data, error } = await supabase
        .from(buildingsTable)
        .delete()
        .eq(attempt.column, value)
        // Do not request a specific column in case it doesn't exist; just return deleted rows
        .select();
      
      console.log(`🔍 Delete result for ${attempt.column}=${value}:`, { data, error });
      
      if (error) {
        console.warn(`⚠️ deleteBuilding: error with ${attempt.column}=${value}:`, error.message);
        lastError = error;
        continue;
      }
      if (data && data.length > 0) {
        console.log(`✅ deleteBuilding: successfully deleted ${data.length} row(s)`);
        deleted = true;
        break;
      } else {
        console.log(`⚠️ deleteBuilding: no rows matched ${attempt.column}=${value}`);
      }
    }

    if (!deleted) {
      if (lastError) console.warn('⚠️ deleteBuilding: attempts ended with last error:', lastError.message);
      console.warn('⚠️ deleteBuilding: no rows deleted using id/building_id attempts');
      
      // If deletion failed due to foreign key constraints, try soft delete
      if (lastError && (lastError.message.includes('violates not-null constraint') || lastError.message.includes('foreign key'))) {
        console.log('💡 Trying soft delete approach due to foreign key constraints...');
        
        const { data: softDeleteData, error: softDeleteError } = await supabase
          .from(buildingsTable)
          .update({ 
            building_name: `DELETED_${Date.now()}`,
            building_nickname: `DELETED_${Date.now()}`,
            building_type: 'DELETED'
          })
          .eq('building_id', normalizedId)
          .select();
        
        if (softDeleteError) {
          console.log('❌ Soft delete also failed:', softDeleteError.message);
          return false;
        } else {
          console.log('✅ Building marked as deleted (soft delete):', softDeleteData);
          return true;
        }
      }
      
      return false;
    }

    console.info('✅ deleteBuilding: successfully deleted building');
    return true;

  } catch (error) {
    console.error('❌ Error deleting building:', error);
    return false;
  }
}

export const getRooms = async (buildingId = null) => {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const roomsTable = getTableName('rooms')
    if (!roomsTable) return []

    let query = supabase
      .from(roomsTable)
      .select('*')

    if (buildingId) {
      query = query.eq('building_id', buildingId)
    }

    // First try with created_at, fallback to no ordering if column doesn't exist
    let { data, error } = await query.order('created_at', { ascending: false })

    if (error && error.message.includes('created_at does not exist')) {
      console.log('⚠️ created_at column not found in Room table, fetching without ordering');
      let fallbackQuery = supabase
        .from(roomsTable)
        .select('*')
      
      if (buildingId) {
        fallbackQuery = fallbackQuery.eq('building_id', buildingId)
      }
      
      const result = await fallbackQuery
      data = result.data
      error = result.error
    }

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching rooms:', error)
    return []
  }
}

export const addRoom = async (roomData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const roomsTable = getTableName('rooms')
    if (!roomsTable) return null

    // First, get a sample room to see what columns actually exist
    const { data: sampleData } = await supabase
      .from(roomsTable)
      .select('*')
      .limit(1)

    console.log('🔍 Sample room data:', sampleData?.[0])
    console.log('🔍 Available room columns:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No rooms found')

    // Map the roomData to the correct column names
    const mappedData = {
      room_id: Math.floor(Math.random() * 1000000), // Generate unique room_id
      building_id: roomData.building_id,
      room_name: roomData.room_name,
      room_number: roomData.room_number,
      room_type: roomData.room_type,
      floor_level: roomData.floor_level
    }

    // Filter out undefined values
    const filteredData = Object.fromEntries(
      Object.entries(mappedData).filter(([_, value]) => value !== undefined)
    )

    console.log('🔍 Filtered room data for insertion:', filteredData)

    const { data, error } = await supabase
      .from(roomsTable)
      .insert([filteredData])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error adding room:', error)
    throw error
  }
}

export const updateRoom = async (roomId, updates) => {
  if (!isSupabaseConfigured()) return null

  try {
    const roomsTable = getTableName('rooms')
    if (!roomsTable) return null

    const { data, error } = await supabase
      .from(roomsTable)
      .update(updates)
      .eq('id', roomId)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error updating room:', error)
    throw error
  }
}

export const deleteRoom = async (roomId) => {
  if (!isSupabaseConfigured()) return false

  try {
    const roomsTable = getTableName('rooms')
    if (!roomsTable) return false

    const { error } = await supabase
      .from(roomsTable)
      .delete()
      .eq('id', roomId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting room:', error)
    return false
  }
}

// ========================================
// CONTENT MANAGEMENT FUNCTIONS
// ========================================

export const getContent = async () => {
  if (!isSupabaseConfigured()) {
    return []
  }

  // Helper: map mimetype to our four categories
  const toContentType = (mime, name) => {
    const m = (mime || '').toLowerCase()
    if (m.startsWith('image/')) return 'image'
    if (m.startsWith('video/')) return 'video'
    if (m.startsWith('audio/')) return 'audio'
    // Derive from filename if mimetype missing
    const n = (name || '').toLowerCase()
    if (n.match(/\.(png|jpe?g|gif|webp|bmp|svg)$/)) return 'image'
    if (n.match(/\.(mp4|mov|webm|mkv|avi)$/)) return 'video'
    if (n.match(/\.(mp3|wav|aac|flac|ogg)$/)) return 'audio'
    return 'document'
  }

  try {
    // Prefer pulling from the snapshot table
    // Build bucketId -> bucketName map for URL generation
    let bucketIdToName = {}
    try {
      const { data: allBuckets } = await supabase.storage.listBuckets()
      ;(allBuckets || []).forEach((b) => {
        if (b) bucketIdToName[b.id || b.name] = b.name
      })
    } catch (_) {
      // If storage API not available for anon user, we'll still return rows without URLs below
    }

    let { data: snapshotRows, error: snapshotError } = await supabase
      .from('storage_objects_snapshot')
      .select('*')
      .order('updated_at', { ascending: false })

    // If table missing or access denied, snapshotError may be set
    if (!snapshotError && Array.isArray(snapshotRows)) {
      const mapped = snapshotRows.map((row) => {
        const bucketName = bucketIdToName[row.bucket_id] || row.bucket_id
        const objectPath = row.name || row.filename || ''
        const mime = row.metadata_mimetype || row?.metadata?.mimetype || row?.metadata?.type
        const size = (row?.metadata && (row.metadata.size || row.metadata.bytes)) || null
        const publicUrl = bucketName && objectPath
          ? buildPublicStorageUrl(bucketName, objectPath)
          : ''
        const type = toContentType(mime, objectPath)
        const thumb = type === 'image' ? publicUrl : ''
        return {
          id: row.id,
          title: row.filename || row.name || 'file',
          description: row?.user_metadata?.description || '',
          content_type: type,
          file_url: publicUrl,
          thumbnail_url: thumb,
          file_size: typeof size === 'number' ? size : 0,
          tags: Array.isArray(row?.user_metadata?.tags) ? row.user_metadata.tags : [],
          building_id: null,
          room_id: null,
          created_at: row.created_at || row.updated_at
        }
      })
      return mapped
    }

    // Fallback to legacy content_items table
    const contentTable = getTableName('content_items')
    if (!contentTable) return []

    let { data, error } = await supabase
      .from(contentTable)
      .select('*')
      .order('created_at', { ascending: false })

    if (error && error.message && error.message.includes('created_at does not exist')) {
      console.log('⚠️ created_at column not found in Content table, fetching without ordering');
      const result = await supabase
        .from(contentTable)
        .select('*')
      data = result.data
      error = result.error
    }

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching content:', error)
    return []
  }
}

export const addContent = async (contentData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const contentTable = getTableName('content_items')
    if (!contentTable) return null

    const { data, error } = await supabase
      .from(contentTable)
      .insert([contentData])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error adding content:', error)
    throw error
  }
}

export const updateContent = async (contentId, updates) => {
  if (!isSupabaseConfigured()) return null

  try {
    const contentTable = getTableName('content_items')
    if (!contentTable) return null

    const { data, error } = await supabase
      .from(contentTable)
      .update(updates)
      .eq('id', contentId)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error updating content:', error)
    throw error
  }
}

export const deleteContent = async (contentId) => {
  if (!isSupabaseConfigured()) return false

  try {
    const contentTable = getTableName('content_items')
    if (!contentTable) return false

    const { error } = await supabase
      .from(contentTable)
      .delete()
      .eq('id', contentId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting content:', error)
    return false
  }
}

// ========================================
// TOURS & TRAILS FUNCTIONS
// ========================================

export const getTours = async () => {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const toursTable = getTableName('tours')
    if (!toursTable) return []

    const { data, error } = await supabase
      .from(toursTable)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching tours:', error)
    return []
  }
}

export const addTour = async (tourData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const toursTable = getTableName('tours')
    if (!toursTable) return null

    const { data, error } = await supabase
      .from(toursTable)
      .insert([tourData])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error adding tour:', error)
    throw error
  }
}

export const updateTour = async (tourId, updates) => {
  if (!isSupabaseConfigured()) return null

  try {
    const toursTable = getTableName('tours')
    if (!toursTable) return null

    const { data, error } = await supabase
      .from(toursTable)
      .update(updates)
      .eq('id', tourId)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error updating tour:', error)
    throw error
  }
}

export const deleteTour = async (tourId) => {
  if (!isSupabaseConfigured()) return false

  try {
    const toursTable = getTableName('tours')
    if (!toursTable) return false

    const { error } = await supabase
      .from(toursTable)
      .delete()
      .eq('id', tourId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting tour:', error)
    return false
  }
}

export const getTourStops = async (tourId = null) => {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const stopsTable = getTableName('tour_stops')
    if (!stopsTable) return []

    let query = supabase
      .from(stopsTable)
      .select('*')

    if (tourId) {
      query = query.eq('tour_id', tourId)
    }

    const { data, error } = await query.order('stop_order', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching tour stops:', error)
    return []
  }
}

export const addTourStop = async (stopData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const stopsTable = getTableName('tour_stops')
    if (!stopsTable) return null

    const { data, error } = await supabase
      .from(stopsTable)
      .insert([stopData])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error adding tour stop:', error)
    throw error
  }
}

// ========================================
// QR CODES FUNCTIONS
// ========================================

export const getQRCodes = async () => {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const qrCodesTable = getTableName('qr_codes')
    if (!qrCodesTable) return []

    const { data, error } = await supabase
      .from(qrCodesTable)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching QR codes:', error)
    return []
  }
}

export const addQRCode = async (qrData) => {
  if (!isSupabaseConfigured()) return null

  try {
    const qrCodesTable = getTableName('qr_codes')
    if (!qrCodesTable) return null

    const { data, error } = await supabase
      .from(qrCodesTable)
      .insert([qrData])
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error adding QR code:', error)
    throw error
  }
}

export const updateQRCode = async (qrId, updates) => {
  if (!isSupabaseConfigured()) return null

  try {
    const qrCodesTable = getTableName('qr_codes')
    if (!qrCodesTable) return null

    const { data, error } = await supabase
      .from(qrCodesTable)
      .update(updates)
      .eq('id', qrId)
      .select()

    if (error) throw error
    return data?.[0] || null
  } catch (error) {
    console.error('Error updating QR code:', error)
    throw error
  }
}

export const deleteQRCode = async (qrId) => {
  if (!isSupabaseConfigured()) return false

  try {
    const qrCodesTable = getTableName('qr_codes')
    if (!qrCodesTable) return false

    const { error } = await supabase
      .from(qrCodesTable)
      .delete()
      .eq('id', qrId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting QR code:', error)
    return false
  }
}

// ========================================
// STORAGE (BUCKETS & FILES)
// ========================================

export const getStorageBuckets = async () => {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase.storage.listBuckets()
    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching storage buckets:', error)
    return []
  }
}

export const listBucketFiles = async (bucketName, path = '', options = {}) => {
  if (!isSupabaseConfigured()) {
    return []
  }

  try {
    const { data, error } = await supabase.storage.from(bucketName).list(path, options)
    if (error) throw error
    return data || []
  } catch (error) {
    console.error(`Error listing files for bucket ${bucketName}:`, error)
    return []
  }
}

// ========================================
// STORAGE OBJECTS SNAPSHOT (DB VIEW)
// ========================================

// Cache map of bucket name -> id for efficient lookups
const bucketNameToIdCache = {}

const resolveBucketIdByName = async (bucketName) => {
  if (!isSupabaseConfigured()) return null
  if (bucketNameToIdCache[bucketName]) return bucketNameToIdCache[bucketName]
  try {
    const { data } = await supabase.storage.listBuckets()
    const found = (data || []).find((b) => b.name === bucketName)
    if (found) {
      bucketNameToIdCache[bucketName] = found.id || found.name
      return bucketNameToIdCache[bucketName]
    }
    return null
  } catch (_) {
    return null
  }
}

export const getStorageObjectsSnapshot = async (bucketName, prefix = '') => {
  if (!isSupabaseConfigured()) return []
  try {
    const bucketId = await resolveBucketIdByName(bucketName)
    if (!bucketId) return []

    // Filter by bucket and optional path prefix
    let query = supabase
      .from('storage_objects_snapshot')
      .select('*')
      .eq('bucket_id', bucketId)

    if (prefix) {
      const like = prefix.endsWith('/') ? `${prefix}%` : `${prefix}/%`
      query = query.ilike('name', like)
    }

    // Prefer updated_at ordering, fallback to none if not present
    let { data, error } = await query.order('updated_at', { ascending: false })
    if (error && error.message && error.message.includes('updated_at does not exist')) {
      const res = await supabase
        .from('storage_objects_snapshot')
        .select('*')
        .eq('bucket_id', bucketId)
      data = res.data
      error = res.error
    }
    if (error) throw error
    return data || []
  } catch (e) {
    console.error('Error fetching storage_objects_snapshot:', e)
    return []
  }
}

export const buildPublicStorageUrl = (bucketName, objectPath) => {
  if (!supabaseUrl) return ''
  const normalized = (objectPath || '').replace(/^\/+/, '')
  return `${supabaseUrl.replace(/\/$/, '')}/storage/v1/object/public/${encodeURIComponent(bucketName)}/${encodeURIComponent(normalized)}`
}