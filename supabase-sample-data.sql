-- Sample Test Centers Data for DVSlot
-- Run this AFTER the main schema in Supabase SQL Editor

INSERT INTO public.test_centers (name, address, postcode, city, region, latitude, longitude, phone_number) VALUES
('Birmingham (South Yardley)', 'Coventry Road, South Yardley', 'B25 8HU', 'Birmingham', 'West Midlands', 52.456936, -1.820717, '0300 200 1122'),
('Manchester (Salford)', 'Whitworth Street West', 'M1 5WZ', 'Manchester', 'Greater Manchester', 53.473878, -2.243877, '0300 200 1122'),
('London (Southall)', 'Havelock Road', 'UB2 4NF', 'Southall', 'Greater London', 51.5074, -0.3278, '0300 200 1122'),
('Leeds (Horsforth)', 'Low Lane', 'LS18 5NY', 'Leeds', 'West Yorkshire', 53.8321, -1.6377, '0300 200 1122'),
('Glasgow (Shieldhall)', 'Shieldhall Road', 'G51 4QZ', 'Glasgow', 'Scotland', 55.8542, -4.3267, '0300 200 1122'),
('Cardiff (Fairwater)', 'Western Avenue', 'CF5 3RP', 'Cardiff', 'Wales', 51.4816, -3.2177, '0300 200 1122'),
('Liverpool (Speke)', 'Speke Boulevard', 'L24 8QB', 'Liverpool', 'Merseyside', 53.3487, -2.8517, '0300 200 1122'),
('Bristol (Avonmouth)', 'Avonmouth Way', 'BS11 9YA', 'Bristol', 'South West', 51.5045, -2.7000, '0300 200 1122'),
('Newcastle (Cramlington)', 'Dudley Lane', 'NE23 7RH', 'Cramlington', 'North East', 55.0872, -1.5881, '0300 200 1122'),
('Nottingham (Colwick)', 'Colwick Loop Road', 'NG4 2AN', 'Nottingham', 'East Midlands', 52.9408, -1.0632, '0300 200 1122'),
('Sheffield (Handsworth)', 'Olivers Mount', 'S13 9PT', 'Sheffield', 'Yorkshire', 53.3811, -1.4701, '0300 200 1122'),
('Leicester (Wigston)', 'Saffron Road', 'LE18 4US', 'Leicester', 'East Midlands', 52.5703, -1.0909, '0300 200 1122'),
('Edinburgh (Currie)', 'Lanark Road West', 'EH14 5RL', 'Edinburgh', 'Scotland', 55.9533, -3.2058, '0300 200 1122'),
('Belfast (Balmoral)', 'Boucher Road', 'BT12 6QP', 'Belfast', 'Northern Ireland', 54.5973, -5.9301, '0300 200 1122'),
('Southampton (Maybush)', 'Maybush Roundabout', 'SO16 4GX', 'Southampton', 'South East', 50.9097, -1.4044, '0300 200 1122'),
('Reading (Calcot)', 'Bath Road', 'RG31 7QN', 'Reading', 'South East', 51.4543, -1.0264, '0300 200 1122'),
('Cambridge', 'Brooklands Avenue', 'CB2 8BB', 'Cambridge', 'East of England', 52.2053, 0.1218, '0300 200 1122'),
('Oxford (Cowley)', 'Between Towns Road', 'OX4 3LZ', 'Oxford', 'South East', 51.7520, -1.2577, '0300 200 1122'),
('Brighton (Lancing)', 'Grinstead Lane', 'BN15 9QZ', 'Lancing', 'South East', 50.8429, -0.3774, '0300 200 1122'),
('Norwich (Cringleford)', 'Newmarket Road', 'NR4 6UU', 'Norwich', 'East of England', 52.6309, 1.2974, '0300 200 1122');

-- Add some sample driving test slots (available ones) - Fixed to avoid duplicates
INSERT INTO public.driving_test_slots (test_center_id, date, time, is_available, test_type, price) 
SELECT DISTINCT
    tc.id,
    (CURRENT_DATE + (row_number() OVER (PARTITION BY tc.id) % 30))::date, -- Spread dates over 30 days
    (ARRAY['09:00', '10:30', '12:00', '13:30', '15:00', '16:30'])[(row_number() OVER (PARTITION BY tc.id, CURRENT_DATE + (row_number() OVER (PARTITION BY tc.id) % 30)) % 6) + 1]::time,
    (RANDOM() > 0.7), -- 30% chance of being available
    'practical',
    62.00
FROM test_centers tc
CROSS JOIN generate_series(1, 6) -- 6 slots per test center (one for each time slot)
ORDER BY tc.id, date, time;
