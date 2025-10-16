-- iTOURu Virtual Tour System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  full_name VARCHAR,
  role VARCHAR DEFAULT 'visitor',
  created_at TIMESTAMP DEFAULT NOW(),
  last_active TIMESTAMP DEFAULT NOW(),
  profile_image VARCHAR
);

-- Buildings table
CREATE TABLE IF NOT EXISTS buildings (
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
);

-- Rooms table
CREATE TABLE IF NOT EXISTS rooms (
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
);

-- Content/Media table
CREATE TABLE IF NOT EXISTS content_items (
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
);

-- Tours table
CREATE TABLE IF NOT EXISTS tours (
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
);

-- Tour stops table
CREATE TABLE IF NOT EXISTS tour_stops (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES tours(id) ON DELETE CASCADE,
  building_id UUID REFERENCES buildings(id),
  room_id UUID REFERENCES rooms(id),
  stop_order INTEGER NOT NULL,
  title VARCHAR NOT NULL,
  description TEXT,
  estimated_time INTEGER, -- in minutes
  created_at TIMESTAMP DEFAULT NOW()
);

-- QR Codes table
CREATE TABLE IF NOT EXISTS qr_codes (
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
);

-- Analytics/Activities table
CREATE TABLE IF NOT EXISTS activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  activity_type VARCHAR NOT NULL, -- 'registration', 'media_upload', 'qr_generated', 'tour_started', etc.
  title VARCHAR NOT NULL,
  description TEXT,
  user_id UUID REFERENCES users(id),
  related_id UUID, -- ID of related entity (building, tour, etc.)
  related_type VARCHAR, -- Type of related entity
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tour visits/analytics table
CREATE TABLE IF NOT EXISTS tour_visits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID REFERENCES tours(id),
  user_id UUID REFERENCES users(id),
  building_id UUID REFERENCES buildings(id),
  room_id UUID REFERENCES rooms(id),
  visit_duration INTEGER, -- in seconds
  completed BOOLEAN DEFAULT false,
  device_type VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- System notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR NOT NULL, -- 'alert', 'info', 'success', 'warning'
  title VARCHAR NOT NULL,
  description TEXT,
  priority VARCHAR DEFAULT 'medium', -- 'high', 'medium', 'low'
  is_read BOOLEAN DEFAULT false,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  read_at TIMESTAMP
);

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Basic policies for read access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON users FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON buildings FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON rooms FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON content_items FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tours FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tour_stops FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON qr_codes FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON activities FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON tour_visits FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON notifications FOR SELECT USING (true);

-- Enable insert/update/delete for authenticated users (adjust as needed)
CREATE POLICY "Enable insert for authenticated users only" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON buildings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON rooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON content_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON tours FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON tour_stops FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON qr_codes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON activities FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON tour_visits FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable insert for authenticated users only" ON notifications FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users only" ON users FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON buildings FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON rooms FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON content_items FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON tours FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON tour_stops FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON qr_codes FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON activities FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON tour_visits FOR UPDATE USING (true);
CREATE POLICY "Enable update for authenticated users only" ON notifications FOR UPDATE USING (true);