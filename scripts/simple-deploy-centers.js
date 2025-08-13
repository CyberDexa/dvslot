#!/usr/bin/env node

/**
 * Simple Production Deployment: 318 Official UK DVSA Test Centers
 * 
 * Deploys the complete official UK test center database to production
 */

const fs = require('fs');
const path = require('path');

async function deployOfficialCenters() {
  console.log('🚀 DVSlot Production Deployment');
  console.log('===============================\n');

  console.log('📊 Deploying 318 Official UK DVSA Test Centers');
  console.log('   Data Source: Official DVSA CSV');
  console.log('   Generated: Complete UK coverage\n');

  try {
    // Load the official centers from the generated SQL file
    console.log('📂 Loading official test centers data...');
    const sqlFilePath = path.join(__dirname, 'official-dvsa-centers.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.log('⚠️  SQL file not found, generating from CSV...');
      
      // Import and run the official generator
      const OfficialGenerator = require('./official-dvsa-centers.js');
      const generator = new OfficialGenerator();
      await generator.run();
      
      console.log('✅ Generated official centers SQL file');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    const fileSize = Math.round(fs.statSync(sqlFilePath).size / 1024);
    console.log(`✅ Loaded official data (${fileSize}KB)`);

    // Parse the center count from SQL
    const insertMatches = sqlContent.match(/INSERT INTO.*?VALUES/gs);
    const centerCount = insertMatches ? insertMatches.length : 'Unknown';

    console.log(`📋 Ready to deploy ${centerCount} test centers`);

    // Deployment options
    console.log('\n🎯 Deployment Options:');
    console.log('1. Manual SQL Execution (Recommended)');
    console.log('2. Generate migration script');
    console.log('3. Show deployment instructions\n');

    // Option 1: Provide SQL for manual execution
    console.log('📋 MANUAL DEPLOYMENT (RECOMMENDED):');
    console.log('====================================');
    console.log('1. Open your Supabase dashboard');
    console.log('2. Go to SQL Editor');
    console.log('3. Execute the following file:');
    console.log(`   📁 ${sqlFilePath}`);
    console.log('4. Monitor execution progress\n');

    // Option 2: Generate a smaller migration script
    console.log('📄 Generating production migration script...');
    const migrationScript = generateMigrationScript();
    const migrationPath = path.join(__dirname, 'production-migration.sql');
    fs.writeFileSync(migrationPath, migrationScript);
    
    console.log(`✅ Migration script: ${migrationPath}`);

    // Option 3: Show verification steps
    console.log('\n✅ VERIFICATION STEPS:');
    console.log('======================');
    console.log('After SQL execution, verify:');
    console.log('1. SELECT COUNT(*) FROM dvsa_test_centers; -- Should be 318');
    console.log('2. SELECT region, COUNT(*) FROM dvsa_test_centers GROUP BY region;');
    console.log('3. SELECT * FROM dvsa_test_centers LIMIT 5;');
    console.log('4. Check that slots are generated for testing\n');

    console.log('🎉 DEPLOYMENT PACKAGE READY!');
    console.log(`📦 Files prepared:`);
    console.log(`   📁 ${sqlFilePath} (Complete database)`);
    console.log(`   📁 ${migrationPath} (Migration script)`);
    console.log('\n🚀 Execute SQL in Supabase dashboard to deploy 318 UK centers!');

  } catch (error) {
    console.error('❌ Deployment preparation failed:', error);
  }
}

function generateMigrationScript() {
  return `-- DVSlot Production Migration: 318 Official UK Test Centers
-- Execute this in Supabase SQL Editor
-- Generated: ${new Date().toISOString()}

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
`;
}

// Run deployment preparation
deployOfficialCenters();
