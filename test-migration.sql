-- DVSlot Test Migration - Simple Version
-- Test this first to verify Supabase setup works

-- Enable UUID extension (required for UUID generation)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Clear existing data
DELETE FROM test_centers;

-- Insert a few test centers to verify the structure works
INSERT INTO test_centers (id, name, address, postcode, city, region, latitude, longitude, phone_number, is_active) VALUES
(uuid_generate_v4(), 'London (Mill Hill)', 'The Hyde, Mill Hill, London', 'NW7 1RB', 'London', 'London', 51.6156, -0.2464, '0300 200 1122', true),
(uuid_generate_v4(), 'Brighton (Whitehawk)', 'Wilson Avenue, Brighton', 'BN2 5TS', 'Brighton', 'South East', 50.8225, -0.1372, '0300 200 1122', true),
(uuid_generate_v4(), 'Birmingham (Kingstanding)', 'Kingstanding Road, Birmingham', 'B44 9SU', 'Birmingham', 'Midlands', 52.5244, -1.8567, '0300 200 1122', true),
(uuid_generate_v4(), 'Manchester (Cheetham Hill)', 'Waterloo Road, Manchester', 'M8 8UF', 'Manchester', 'North West', 53.5244, -2.2567, '0300 200 1122', true),
(uuid_generate_v4(), 'Bristol (Avonmouth)', 'Lawrence Weston Road, Bristol', 'BS11 0YA', 'Bristol', 'South West', 51.5151, -2.6790, '0300 200 1122', true);

-- Verify insertion
SELECT 
    region,
    COUNT(*) as center_count,
    name as sample_center
FROM test_centers 
GROUP BY region, name
ORDER BY region;

-- Success message
SELECT 'SUCCESS: Test migration completed - 5 test centers inserted!' as status;
