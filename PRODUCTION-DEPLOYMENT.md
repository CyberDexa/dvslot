# DVSlot Production Deployment Guide

## 🚀 Complete UK Test Centers Deployment (318 Centers)

### **Prerequisites**
- Supabase project with SQL Editor access
- PostgreSQL database ready

---

## **Step 1: Create Database Schema** 
⚠️ **EXECUTE THIS FIRST**

1. Open **Supabase Dashboard** → **SQL Editor**
2. Execute: `scripts/create-database-schema.sql`
3. Wait for completion message: "DVSlot Database Schema Created Successfully!"
4. Verify tables created:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   ORDER BY table_name;
   ```

**Expected Output**: 
- `dvsa_test_centers` ✅
- `driving_test_slots` ✅  
- `users` ✅
- `user_alerts` ✅
- And 6 other system tables

---

## **Step 2: Deploy 318 UK Test Centers**
🎯 **Execute the official centers data**

1. In **SQL Editor**, execute: `scripts/official-dvsa-centers.sql`
2. Monitor progress (may take 30-60 seconds)
3. Wait for success message

**Verification Commands**:
```sql
-- Check total centers
SELECT COUNT(*) as total_centers FROM dvsa_test_centers;
-- Should return: 318

-- Regional breakdown  
SELECT region, COUNT(*) as centers 
FROM dvsa_test_centers 
GROUP BY region 
ORDER BY centers DESC;

-- Sample data
SELECT center_code, name, city, region 
FROM dvsa_test_centers 
LIMIT 10;

-- Check sample slots generated
SELECT COUNT(*) as sample_slots FROM driving_test_slots;
```

**Expected Regional Distribution**:
- Scotland: 72 centers
- Greater London: 31 centers
- South East: 28 centers
- Yorkshire: 25 centers
- West Midlands: 24 centers
- North West: 22 centers
- Wales: 22 centers
- East Midlands: 21 centers
- South West: 20 centers
- East of England: 18 centers
- North East: 15 centers

---

## **Step 3: Verification & Testing**

### **Database Health Check**:
```sql
-- Complete system verification
SELECT 
    'dvsa_test_centers' as table_name,
    COUNT(*) as records,
    COUNT(CASE WHEN is_active THEN 1 END) as active_records
FROM dvsa_test_centers
UNION ALL
SELECT 
    'driving_test_slots',
    COUNT(*),
    COUNT(CASE WHEN available THEN 1 END)
FROM driving_test_slots;

-- Performance test
SELECT region, COUNT(*) FROM dvsa_test_centers GROUP BY region;

-- Available slots view test  
SELECT * FROM available_slots_view LIMIT 5;
```

### **Expected Final State**:
- ✅ **318 test centers** across all UK regions
- ✅ **Sample test slots** for immediate testing
- ✅ **Performance indexes** created
- ✅ **System views** available
- ✅ **Regional coverage** complete

---

## **Step 4: System Configuration**

### **Optional: Create Test User**
```sql
-- Create a test user for frontend testing
INSERT INTO users (email, password_hash, first_name, last_name) 
VALUES ('test@dvslot.com', '$2b$12$example', 'Test', 'User');

-- Create test preferences
INSERT INTO user_preferences (user_id, notification_radius, notification_method)
SELECT user_id, 25, 'email' FROM users WHERE email = 'test@dvslot.com';
```

### **System Status Check**:
```sql
-- Final verification
DO $$
DECLARE
    center_count INTEGER;
    slot_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO center_count FROM dvsa_test_centers;
    SELECT COUNT(*) INTO slot_count FROM driving_test_slots;
    
    RAISE NOTICE '🎉 DEPLOYMENT COMPLETE!';
    RAISE NOTICE '📊 Centers: %', center_count;
    RAISE NOTICE '🎯 Sample Slots: %', slot_count;
    
    IF center_count >= 318 THEN
        RAISE NOTICE '✅ SUCCESS: Complete UK coverage achieved!';
    ELSE
        RAISE WARNING '⚠️ WARNING: Expected 318+ centers, found %', center_count;
    END IF;
END $$;
```

---

## **Troubleshooting**

### **Common Issues**:

1. **"relation does not exist"** → Run Step 1 (schema creation) first
2. **"column does not exist"** → Ensure schema script completed fully  
3. **Slow performance** → Check if indexes were created properly
4. **Data insertion fails** → Verify foreign key constraints

### **Recovery Commands**:
```sql
-- Reset everything if needed
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
-- Then start from Step 1
```

---

## **🎉 Success Confirmation**

When deployment is complete, you should see:

1. **318 test centers** in database
2. **Complete UK regional coverage**
3. **Sample test slots** for testing
4. **All system tables** and views created
5. **Performance indexes** in place

Your DVSlot system now monitors **ALL official UK driving test centers**! 🚗🇬🇧

---

## **Next Steps**
- Test frontend connectivity
- Configure alert systems  
- Set up monitoring dashboards
- Deploy mobile app updates
