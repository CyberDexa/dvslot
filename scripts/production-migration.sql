-- DVSlot Production Migration: 318 Official UK Test Centers
-- Execute this in Supabase SQL Editor
-- Generated: 2025-08-13T04:46:57.317Z

-- Step 1: Backup existing data (optional)
-- CREATE TABLE dvsa_test_centers_backup AS SELECT * FROM dvsa_test_centers;

-- Step 2: Clear existing data
DELETE FROM driving_test_slots WHERE center_id IS NOT NULL;
DELETE FROM dvsa_test_centers WHERE center_id IS NOT NULL;

-- Step 3: Reset sequences
ALTER SEQUENCE dvsa_test_centers_center_id_seq RESTART WITH 1;

-- Step 4: Execute the main SQL file
-- IMPORTANT: Copy and paste the contents of official-dvsa-centers.sql here
-- Or execute it separately in the SQL Editor

-- Step 5: Verify deployment
SELECT 'Total Centers:' as metric, COUNT(*) as value FROM dvsa_test_centers
UNION ALL
SELECT 'Active Centers:' as metric, COUNT(*) as value FROM dvsa_test_centers WHERE is_active = true
UNION ALL
SELECT 'Regions:' as metric, COUNT(DISTINCT region) as value FROM dvsa_test_centers
UNION ALL
SELECT 'Sample Slots:' as metric, COUNT(*) as value FROM driving_test_slots;

-- Regional distribution
SELECT 
    region,
    COUNT(*) as centers,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM dvsa_test_centers)::numeric * 100, 1) as percentage
FROM dvsa_test_centers 
GROUP BY region 
ORDER BY centers DESC;

-- Success confirmation
DO $$
BEGIN
    IF (SELECT COUNT(*) FROM dvsa_test_centers) >= 300 THEN
        RAISE NOTICE '🎉 SUCCESS: DVSlot now monitoring % UK test centers!', (SELECT COUNT(*) FROM dvsa_test_centers);
    ELSE
        RAISE WARNING '⚠️ WARNING: Expected 318+ centers, found %', (SELECT COUNT(*) FROM dvsa_test_centers);
    END IF;
END $$;
