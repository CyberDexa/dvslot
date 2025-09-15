-- TEST CENTRE ADDRESS VALIDATION QUERIES
-- Use these to verify the corrections have been applied correctly

-- 1. Check total count
SELECT 'Total Centers' as metric, COUNT(*) as value 
FROM dvsa_test_centers WHERE is_active = true;

-- 2. Verify Aberdeen is actually in Aberdeen (not Glasgow!)
SELECT name, city, region, 
       ROUND(latitude::numeric, 4) as lat, 
       ROUND(longitude::numeric, 4) as lng,
       address, postcode
FROM dvsa_test_centers 
WHERE name LIKE '%Aberdeen%'
ORDER BY name;

-- 3. Check Alnwick is in North East England (not Scotland!)
SELECT name, city, region, 
       ROUND(latitude::numeric, 4) as lat, 
       ROUND(longitude::numeric, 4) as lng,
       address, postcode
FROM dvsa_test_centers 
WHERE name LIKE '%Alnwick%' OR name LIKE '%Berwick%';

-- 4. Regional distribution (should look realistic)
SELECT region, COUNT(*) as centers_count,
       COUNT(DISTINCT city) as cities_count
FROM dvsa_test_centers 
WHERE is_active = true 
GROUP BY region 
ORDER BY centers_count DESC;

-- 5. Sample addresses (should be real, not fake like "High Drive")
SELECT name, address, postcode, city, region 
FROM dvsa_test_centers 
WHERE is_active = true 
ORDER BY RANDOM() 
LIMIT 10;

-- 6. Check for coordinates that might still be wrong
-- (All Scottish centers should have latitude > 55)
SELECT name, city, region, latitude, longitude
FROM dvsa_test_centers 
WHERE region = 'Scotland' AND latitude < 55.0
ORDER BY latitude;

-- 7. Verify London centers are actually in London coordinate range
SELECT name, city, region, 
       ROUND(latitude::numeric, 4) as lat, 
       ROUND(longitude::numeric, 4) as lng
FROM dvsa_test_centers 
WHERE region = 'Greater London' 
  AND (latitude < 51.3 OR latitude > 51.7 OR longitude < -0.5 OR longitude > 0.3)
ORDER BY name;

-- 8. Check for suspicious postcodes (should match regions)
SELECT name, postcode, city, region
FROM dvsa_test_centers 
WHERE (region = 'Scotland' AND postcode NOT LIKE 'EH%' AND postcode NOT LIKE 'G%' 
       AND postcode NOT LIKE 'AB%' AND postcode NOT LIKE 'DD%' AND postcode NOT LIKE 'KY%'
       AND postcode NOT LIKE 'PA%' AND postcode NOT LIKE 'ML%')
   OR (region = 'Wales' AND postcode NOT LIKE 'CF%' AND postcode NOT LIKE 'SA%' 
       AND postcode NOT LIKE 'LL%' AND postcode NOT LIKE 'NP%' AND postcode NOT LIKE 'HR%')
   OR (region = 'Greater London' AND postcode NOT LIKE 'SW%' AND postcode NOT LIKE 'SE%' 
       AND postcode NOT LIKE 'NW%' AND postcode NOT LIKE 'N%' AND postcode NOT LIKE 'E%' 
       AND postcode NOT LIKE 'W%' AND postcode NOT LIKE 'EC%' AND postcode NOT LIKE 'WC%'
       AND postcode NOT LIKE 'EN%' AND postcode NOT LIKE 'DA%' AND postcode NOT LIKE 'BR%'
       AND postcode NOT LIKE 'CR%' AND postcode NOT LIKE 'IG%' AND postcode NOT LIKE 'RM%'
       AND postcode NOT LIKE 'UB%' AND postcode NOT LIKE 'TW%' AND postcode NOT LIKE 'KT%'
       AND postcode NOT LIKE 'SM%' AND postcode NOT LIKE 'HA%' AND postcode NOT LIKE 'WD%');

-- 9. Final summary - should show improvement
SELECT 
    'VALIDATION COMPLETE' as status,
    COUNT(*) as total_centers,
    COUNT(DISTINCT region) as regions,
    COUNT(DISTINCT city) as cities,
    MIN(latitude) as min_lat,
    MAX(latitude) as max_lat,
    MIN(longitude) as min_lng, 
    MAX(longitude) as max_lng
FROM dvsa_test_centers 
WHERE is_active = true;