-- DVSlot Database Schema for Supabase (Clean Version)
-- Copy and paste this into your Supabase SQL Editor

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin', 'premium');
CREATE TYPE alert_status AS ENUM ('active', 'paused', 'completed');
CREATE TYPE notification_type AS ENUM ('email', 'push', 'sms');

-- Users table (extends Supabase auth.users)
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role user_role DEFAULT 'user',
  is_premium BOOLEAN DEFAULT false,
  premium_expires_at TIMESTAMPTZ,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test Centers table
CREATE TABLE public.test_centers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  postcode TEXT NOT NULL,
  city TEXT NOT NULL,
  region TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  phone_number TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Driving Test Slots table
CREATE TABLE public.driving_test_slots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  test_center_id UUID REFERENCES test_centers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  test_type TEXT DEFAULT 'practical',
  price DECIMAL(6,2) DEFAULT 62.00,
  instructor_name TEXT,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(test_center_id, date, time)
);

-- User Alerts table
CREATE TABLE public.alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  test_center_id UUID REFERENCES test_centers(id) ON DELETE CASCADE,
  preferred_dates DATE[],
  preferred_times TIME[],
  max_price DECIMAL(6,2) DEFAULT 62.00,
  status alert_status DEFAULT 'active',
  notification_types notification_type[] DEFAULT ARRAY['push'::notification_type],
  last_notification_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Log table
CREATE TABLE public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES alerts(id) ON DELETE CASCADE,
  slot_id UUID REFERENCES driving_test_slots(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'
);

-- User Preferences table
CREATE TABLE public.user_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
  notification_email BOOLEAN DEFAULT true,
  notification_push BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  alert_frequency INTEGER DEFAULT 15,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '07:00',
  timezone TEXT DEFAULT 'Europe/London',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Row Level Security (RLS) Policies
-- Users can only see and edit their own profile
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);

-- Users can only see and manage their own alerts
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alerts" ON alerts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own alerts" ON alerts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own alerts" ON alerts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own alerts" ON alerts FOR DELETE USING (auth.uid() = user_id);

-- Test centers are public (read-only for users)
ALTER TABLE test_centers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Test centers are viewable by everyone" ON test_centers FOR SELECT TO authenticated USING (true);

-- Driving test slots are public (read-only for users)
ALTER TABLE driving_test_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Slots are viewable by everyone" ON driving_test_slots FOR SELECT TO authenticated USING (true);

-- Users can only see their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);

-- Users can only see and edit their own preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_alerts_user_id ON alerts(user_id);
CREATE INDEX idx_alerts_test_center_id ON alerts(test_center_id);
CREATE INDEX idx_alerts_status ON alerts(status);
CREATE INDEX idx_slots_test_center_date ON driving_test_slots(test_center_id, date);
CREATE INDEX idx_slots_available ON driving_test_slots(is_available);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_test_centers_postcode ON test_centers(postcode);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_test_centers_updated_at BEFORE UPDATE ON test_centers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_driving_test_slots_updated_at BEFORE UPDATE ON driving_test_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
