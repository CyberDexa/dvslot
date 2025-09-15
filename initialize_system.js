#!/usr/bin/env node

/**
 * DVSlot System Initialization Script
 * 
 * This script ensures the system has data and services are running
 */

const slotPopulationService = require('./src/services/slotPopulationService');
const schedulerService = require('./src/services/schedulerService');
const logger = require('./src/utils/logger');
const { supabase } = require('./supabase-config');

async function initializeSystem() {
  console.log('🚀 DVSlot System Initialization');
  console.log('===============================\n');

  try {
    // Step 1: Check if test centers exist
    console.log('1. Checking test centers...');
    const { data: centers, error: centersError, count } = await supabase
      .from('dvsa_test_centers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    if (centersError) {
      console.error('❌ Failed to check test centers:', centersError.message);
      console.log('💡 Please ensure the dvsa_test_centers table exists and is populated');
      return;
    }

    console.log(`✅ Found ${count} active test centers`);

    if (count === 0) {
      console.log('⚠️  No test centers found. Please populate test centers first.');
      return;
    }

    // Step 2: Check existing slots
    console.log('\n2. Checking existing available slots...');
    const { data: existingSlots, error: slotsError, count: slotsCount } = await supabase
      .from('driving_test_slots')
      .select('*', { count: 'exact', head: true })
      .eq('available', true)
      .gt('date', new Date().toISOString().split('T')[0]);

    if (slotsError) {
      console.error('❌ Failed to check slots:', slotsError.message);
      console.log('💡 The driving_test_slots table might not exist');
      return;
    }

    console.log(`✅ Found ${slotsCount} available future slots`);

    // Step 3: Populate slots if needed
    if (slotsCount < 100) { // If less than 100 available slots, populate more
      console.log('\n3. Populating available slots...');
      console.log('   This will create realistic mock data for demonstration');
      
      const result = await slotPopulationService.populateAllCenterSlots();
      
      if (result.success) {
        console.log(`✅ Successfully created ${result.slotsCreated} slots across ${result.centersProcessed} centers`);
      }
    } else {
      console.log('\n3. ✅ Sufficient slots already exist, skipping population');
    }

    // Step 4: Get updated statistics
    console.log('\n4. Final system statistics...');
    const stats = await slotPopulationService.getSlotStats();
    console.log(`✅ System ready with ${stats.available} available slots:`);
    console.log(`   - Practical tests: ${stats.practical.available}/${stats.practical.total}`);
    console.log(`   - Theory tests: ${stats.theory.available}/${stats.theory.total}`);

    // Step 5: Start scheduler
    console.log('\n5. Starting scheduler service...');
    try {
      schedulerService.start();
      slotPopulationService.startScheduler();
      console.log('✅ Scheduler services started');
    } catch (error) {
      console.log('⚠️  Scheduler start warning:', error.message);
    }

    console.log('\n🎉 System initialization complete!');
    console.log('The app should now show available dates.');
    console.log('\n📝 Next steps:');
    console.log('- Start the API server: npm start');
    console.log('- Test the appointments endpoint: GET /api/v1/appointments/driving-tests?test_type=practical');

  } catch (error) {
    console.error('❌ System initialization failed:', error);
    console.log('\n💡 Troubleshooting:');
    console.log('- Check Supabase connection');
    console.log('- Ensure database tables exist');
    console.log('- Verify environment variables');
  }
}

// Run initialization if called directly
if (require.main === module) {
  initializeSystem()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Initialization failed:', error);
      process.exit(1);
    });
}

module.exports = { initializeSystem };