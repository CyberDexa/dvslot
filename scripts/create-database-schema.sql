-- DVSlot Complete Database Schema Setup
-- Execute this FIRST in Supabase SQL Editor before deploying centers
-- Generated: 2025-08-13

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS driving_test_slots CASCADE;
DROP TABLE IF EXISTS user_alerts CASCADE;
DROP TABLE IF EXISTS dvsa_test_centers CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS system_config CASCADE;
DROP TABLE IF EXISTS alert_subscriptions CASCADE;

-- 1. Roles Table
CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert default roles
INSERT INTO roles (role_name) VALUES 
    ('admin'),
    ('user'),
    ('premium_user');

-- 2. Users Table
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$'),
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    role_id INTEGER REFERENCES roles(role_id) DEFAULT 2
);

-- 3. DVSA Test Centers Table (MAIN TABLE FOR 318 CENTERS)
CREATE TABLE dvsa_test_centers (
    center_id SERIAL PRIMARY KEY,
    center_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(255),
    postcode VARCHAR(10) NOT NULL,
    city VARCHAR(100),
    region VARCHAR(100),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Driving Test Slots Table
CREATE TABLE driving_test_slots (
    slot_id SERIAL PRIMARY KEY,
    center_id INTEGER NOT NULL REFERENCES dvsa_test_centers(center_id) ON DELETE CASCADE,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('practical', 'theory')),
    date DATE NOT NULL,
    time TIME NOT NULL,
    available BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_checked TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(center_id, test_type, date, time)
);

-- 5. User Preferences Table
CREATE TABLE user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    notification_radius INTEGER NOT NULL DEFAULT 25,
    notification_method VARCHAR(50) NOT NULL DEFAULT 'email' CHECK (notification_method IN ('email', 'push', 'both')),
    preferred_test_types JSONB DEFAULT '["practical"]'::jsonb,
    preferred_locations JSONB DEFAULT '[]'::jsonb,
    max_travel_distance INTEGER DEFAULT 50,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Alert Subscriptions Table
CREATE TABLE alert_subscriptions (
    subscription_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    center_id INTEGER REFERENCES dvsa_test_centers(center_id) ON DELETE CASCADE,
    test_type VARCHAR(50) NOT NULL CHECK (test_type IN ('practical', 'theory')),
    preferred_date_start DATE,
    preferred_date_end DATE,
    preferred_time_start TIME,
    preferred_time_end TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. User Alerts Table
CREATE TABLE user_alerts (
    alert_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    slot_id INTEGER REFERENCES driving_test_slots(slot_id) ON DELETE SET NULL,
    subscription_id INTEGER REFERENCES alert_subscriptions(subscription_id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    sent BOOLEAN NOT NULL DEFAULT FALSE,
    sent_at TIMESTAMP,
    notification_method VARCHAR(50),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. System Configuration Table
CREATE TABLE system_config (
    config_id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE,
    config_value TEXT,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Audit Logs Table
CREATE TABLE audit_logs (
    log_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id),
    action VARCHAR(255) NOT NULL,
    table_name VARCHAR(100),
    record_id INTEGER,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance

-- Primary performance indexes for slot queries
CREATE INDEX idx_slots_center_date_available ON driving_test_slots(center_id, date, available) WHERE available = true;
CREATE INDEX idx_slots_date_type_available ON driving_test_slots(date, test_type, available) WHERE available = true;
CREATE INDEX idx_slots_available_date ON driving_test_slots(available, date) WHERE available = true;

-- Geographic index for location-based queries  
CREATE INDEX idx_centers_location ON dvsa_test_centers USING GIST (ST_MakePoint(longitude, latitude));

-- User and alert indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_active ON users(is_active) WHERE is_active = true;
CREATE INDEX idx_alerts_user_sent ON user_alerts(user_id, sent);
CREATE INDEX idx_subscriptions_user_active ON alert_subscriptions(user_id, is_active) WHERE is_active = true;

-- Region and center indexes
CREATE INDEX idx_centers_region ON dvsa_test_centers(region) WHERE is_active = true;
CREATE INDEX idx_centers_postcode ON dvsa_test_centers(postcode);
CREATE INDEX idx_centers_active ON dvsa_test_centers(is_active) WHERE is_active = true;

-- Insert default system configuration
INSERT INTO system_config (config_key, config_value, description) VALUES 
    ('scraping_interval_minutes', '15', 'How often to scrape DVSA for new slots'),
    ('max_slots_per_center', '100', 'Maximum slots to store per center'),
    ('notification_batch_size', '50', 'Number of notifications to send per batch'),
    ('system_maintenance_mode', 'false', 'Whether system is in maintenance mode'),
    ('max_distance_miles', '100', 'Maximum distance for location-based searches'),
    ('slot_cache_duration_minutes', '5', 'How long to cache slot availability');

-- Create useful views for common queries

-- Available slots with center information
CREATE OR REPLACE VIEW available_slots_view AS
SELECT 
    dts.slot_id,
    dts.center_id,
    dts.test_type,
    dts.date,
    dts.time,
    dts.last_checked,
    dtc.center_code,
    dtc.name as center_name,
    dtc.address,
    dtc.postcode,
    dtc.city,
    dtc.region,
    dtc.latitude,
    dtc.longitude
FROM driving_test_slots dts
JOIN dvsa_test_centers dtc ON dts.center_id = dtc.center_id
WHERE dts.available = true 
  AND dtc.is_active = true
  AND dts.date >= CURRENT_DATE;

-- Regional availability summary
CREATE OR REPLACE VIEW regional_availability AS
SELECT 
    region,
    COUNT(DISTINCT dtc.center_id) as centers_count,
    COUNT(dts.slot_id) as total_slots,
    COUNT(CASE WHEN dts.available THEN 1 END) as available_slots,
    ROUND(
        COUNT(CASE WHEN dts.available THEN 1 END)::numeric / 
        NULLIF(COUNT(dts.slot_id), 0)::numeric * 100, 1
    ) as availability_percent
FROM dvsa_test_centers dtc
LEFT JOIN driving_test_slots dts ON dtc.center_id = dts.center_id
    AND dts.date >= CURRENT_DATE
WHERE dtc.is_active = true
GROUP BY region
ORDER BY available_slots DESC;

-- User alert summary
CREATE OR REPLACE VIEW user_alert_summary AS
SELECT 
    u.user_id,
    u.email,
    u.first_name,
    u.last_name,
    COUNT(CASE WHEN ua.sent = false THEN 1 END) as pending_alerts,
    COUNT(CASE WHEN ua.sent = true THEN 1 END) as sent_alerts,
    COUNT(asub.subscription_id) as active_subscriptions
FROM users u
LEFT JOIN user_alerts ua ON u.user_id = ua.user_id
LEFT JOIN alert_subscriptions asub ON u.user_id = asub.user_id AND asub.is_active = true
WHERE u.is_active = true
GROUP BY u.user_id, u.email, u.first_name, u.last_name;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '🎉 DVSlot Database Schema Created Successfully!';
    RAISE NOTICE '📊 Ready for 318 UK test centers deployment';
    RAISE NOTICE '🚀 Execute official-dvsa-centers.sql next';
END $$;

-- Verification query
SELECT 
    'Tables Created:' as status,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('dvsa_test_centers', 'driving_test_slots', 'users', 'user_alerts');
