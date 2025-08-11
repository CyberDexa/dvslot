-- Fix RLS permissions for API access
-- Run this in Supabase SQL Editor

-- Check if RLS is enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'test_centers';

-- Disable RLS to allow public API access
ALTER TABLE test_centers DISABLE ROW LEVEL SECURITY;

-- Verify data is accessible
SELECT COUNT(*) as total_records FROM test_centers;
SELECT name, region, is_active FROM test_centers WHERE region = 'London' LIMIT 5;
