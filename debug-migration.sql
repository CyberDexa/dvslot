-- Simple test to verify table structure and insert one record
-- Run this in Supabase SQL Editor to test

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Check table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'test_centers';

-- Try inserting one test record
INSERT INTO test_centers (id, name, address, postcode, city, region, latitude, longitude, phone_number, is_active) 
VALUES (uuid_generate_v4(), 'TEST - London Mill Hill', 'Test Address', 'NW7 1RB', 'London', 'London', 51.6156, -0.2464, '0300 200 1122', true);

-- Verify the insert worked
SELECT COUNT(*) as total_records FROM test_centers;
SELECT name, region, is_active FROM test_centers LIMIT 3;
