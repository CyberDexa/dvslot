-- DVSlot Essential UK Test Centers Migration
-- Run this directly in your Supabase SQL Editor

-- First, temporarily disable RLS for migration (re-enable after)
ALTER TABLE test_centers DISABLE ROW LEVEL SECURITY;

-- Clear any existing data
DELETE FROM test_centers;

-- Insert essential UK test centers with proper UUIDs
INSERT INTO test_centers (id, name, address, postcode, city, region, latitude, longitude, phone_number, is_active) VALUES
  -- London centers (3)
  (gen_random_uuid(), 'London (Mill Hill)', 'The Hyde, Mill Hill, London', 'NW7 1RB', 'London', 'London', 51.6156, -0.2464, '0300 200 1122', true),
  (gen_random_uuid(), 'London (Hendon)', 'Aerodrome Road, Hendon', 'NW9 5LL', 'London', 'London', 51.5664, -0.2312, '0300 200 1122', true),
  (gen_random_uuid(), 'London (Barking)', 'Jenkins Lane, Barking', 'IG11 0AD', 'London', 'London', 51.5607, 0.0899, '0300 200 1122', true),
  
  -- Major regional centers
  (gen_random_uuid(), 'Birmingham', 'Garretts Green, Birmingham', 'B26 2HT', 'Birmingham', 'West Midlands', 52.4506, -1.8040, '0300 200 1122', true),
  (gen_random_uuid(), 'Manchester', 'Openshaw, Manchester', 'M11 2EJ', 'Manchester', 'North West', 53.4808, -2.2426, '0300 200 1122', true),
  (gen_random_uuid(), 'Liverpool', 'Speke Hall Avenue, Liverpool', 'L24 1YD', 'Liverpool', 'North West', 53.3498, -2.8526, '0300 200 1122', true),
  (gen_random_uuid(), 'Leeds', 'Harehills, Leeds', 'LS8 3DT', 'Leeds', 'Yorkshire', 53.8008, -1.5491, '0300 200 1122', true),
  (gen_random_uuid(), 'Sheffield', 'Handsworth, Sheffield', 'S13 9BT', 'Sheffield', 'Yorkshire', 53.3811, -1.4701, '0300 200 1122', true),
  (gen_random_uuid(), 'Bristol', 'Brislington, Bristol', 'BS4 5NF', 'Bristol', 'South West', 51.4545, -2.5879, '0300 200 1122', true),
  (gen_random_uuid(), 'Newcastle', 'Kenton Road, Newcastle', 'NE3 3BE', 'Newcastle', 'North East', 55.0184, -1.6153, '0300 200 1122', true),
  
  -- National capitals and major centers
  (gen_random_uuid(), 'Glasgow', 'Anniesland, Glasgow', 'G13 1HQ', 'Glasgow', 'Scotland', 55.8642, -4.2518, '0300 200 1122', true),
  (gen_random_uuid(), 'Edinburgh', 'Currie, Edinburgh', 'EH14 5AA', 'Edinburgh', 'Scotland', 55.9533, -3.1883, '0300 200 1122', true),
  (gen_random_uuid(), 'Cardiff', 'Llanishen, Cardiff', 'CF14 5GL', 'Cardiff', 'Wales', 51.4816, -3.1791, '0300 200 1122', true),
  (gen_random_uuid(), 'Belfast', 'Balmoral Road, Belfast', 'BT12 6QL', 'Belfast', 'Northern Ireland', 54.5973, -5.9301, '0300 200 1122', true),
  (gen_random_uuid(), 'Nottingham', 'Colwick, Nottingham', 'NG4 2JT', 'Nottingham', 'East Midlands', 52.9536, -1.0595, '0300 200 1122', true),
  
  -- South East regional coverage
  (gen_random_uuid(), 'Brighton', 'Wilson Avenue, Brighton', 'BN2 0LA', 'Brighton', 'South East', 50.8225, -0.1372, '0300 200 1122', true),
  (gen_random_uuid(), 'Reading', 'Craven Road, Reading', 'RG1 5LE', 'Reading', 'South East', 51.4543, -0.9781, '0300 200 1122', true),
  (gen_random_uuid(), 'Oxford', 'Cowley Road, Oxford', 'OX4 2HE', 'Oxford', 'South East', 51.7520, -1.2577, '0300 200 1122', true),
  (gen_random_uuid(), 'Canterbury', 'Sturry Road, Canterbury', 'CT1 1HU', 'Canterbury', 'South East', 51.2802, 1.0789, '0300 200 1122', true),
  (gen_random_uuid(), 'Portsmouth', 'Eastern Road, Portsmouth', 'PO6 1UN', 'Portsmouth', 'South East', 50.8198, -1.0880, '0300 200 1122', true);

-- Re-enable RLS after migration
ALTER TABLE test_centers ENABLE ROW LEVEL SECURITY;

-- Verify the data
SELECT 
    region,
    COUNT(*) as center_count
FROM test_centers 
GROUP BY region 
ORDER BY center_count DESC;

-- Show total count and sample data
SELECT 
    COUNT(*) as total_centers,
    'Migration completed successfully' as status
FROM test_centers;

SELECT 
    name,
    city,
    region,
    latitude,
    longitude
FROM test_centers 
ORDER BY region, city
LIMIT 10;
