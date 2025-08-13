-- DVSlot Production Verification Query
-- Run this in Supabase SQL Editor to confirm deployment success

-- 1. Basic System Health Check
SELECT 
    '🎯 DEPLOYMENT VERIFICATION' as status,
    '=========================' as separator;

-- 2. Table Status
SELECT 
    'Tables Status' as check_type,
    COUNT(*) as tables_created
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'dvsa_test_centers', 'driving_test_slots', 'users', 
    'user_alerts', 'alert_subscriptions', 'roles'
  );

-- 3. Test Centers Deployment
SELECT 
    '📊 Test Centers' as metric,
    COUNT(*) as total,
    COUNT(CASE WHEN is_active THEN 1 END) as active,
    COUNT(DISTINCT region) as regions
FROM dvsa_test_centers;

-- 4. Regional Distribution (Top 10)
SELECT 
    '🗺️ ' || region as region,
    COUNT(*) as centers,
    ROUND(COUNT(*)::numeric / (SELECT COUNT(*) FROM dvsa_test_centers) * 100, 1) as percentage
FROM dvsa_test_centers 
GROUP BY region 
ORDER BY COUNT(*) DESC 
LIMIT 10;

-- 5. Sample Data Check
SELECT 
    '📍 Sample Centers' as check_type,
    center_code,
    name,
    city,
    region
FROM dvsa_test_centers 
ORDER BY region, name
LIMIT 5;

-- 6. System Features Available
SELECT 
    '🚀 System Features' as feature,
    CASE 
        WHEN EXISTS (SELECT 1 FROM dvsa_test_centers WHERE latitude IS NOT NULL) 
        THEN '✅ Geographic Search Ready'
        ELSE '❌ Geographic Data Missing'
    END as geographic_search,
    CASE 
        WHEN EXISTS (SELECT 1 FROM driving_test_slots) 
        THEN '✅ Slot System Ready'
        ELSE '❌ No Slots Available'
    END as slot_system;

-- 7. Performance Index Check
SELECT 
    '⚡ Performance' as metric,
    COUNT(*) as indexes_created
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('dvsa_test_centers', 'driving_test_slots');

-- 8. Final Success Confirmation
DO $$
DECLARE
    center_count INTEGER;
    region_count INTEGER;
BEGIN
    SELECT COUNT(*), COUNT(DISTINCT region) 
    INTO center_count, region_count 
    FROM dvsa_test_centers;
    
    RAISE NOTICE '';
    RAISE NOTICE '🎉 DEPLOYMENT SUCCESS CONFIRMATION';
    RAISE NOTICE '===================================';
    RAISE NOTICE '✅ Total Centers: %', center_count;
    RAISE NOTICE '✅ UK Regions: %', region_count;
    
    IF center_count >= 300 AND region_count >= 10 THEN
        RAISE NOTICE '🚀 DVSlot: COMPLETE UK COVERAGE ACHIEVED!';
        RAISE NOTICE '🎯 Ready to monitor all official UK driving tests!';
    ELSE
        RAISE WARNING '⚠️ Coverage may be incomplete - verify data';
    END IF;
    
    RAISE NOTICE '';
END $$;
