#!/usr/bin/env node

/**
 * DVSlot Issue Diagnosis Script
 * 
 * This script diagnoses why available dates are not showing up
 */

const { createClient } = require('@supabase/supabase-js');

// Use the existing Supabase configuration from the codebase
const SUPABASE_URL = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function diagnoseIssue() {
  console.log('🔍 DVSlot Available Dates Issue Diagnosis');
  console.log('==========================================\n');

  // Test 1: Check test centers
  console.log('1. Testing Test Centers Table...');
  try {
    const { data: centers, error: centersError, count } = await supabase
      .from('dvsa_test_centers')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .limit(5);

    if (centersError) {
      console.log('❌ Test centers query failed:', centersError.message);
      if (centersError.message.includes('relation') || centersError.message.includes('does not exist')) {
        console.log('💡 Fix: The dvsa_test_centers table does not exist or has wrong name');
      }
    } else {
      console.log(`✅ Test centers table exists with ${count} active centers`);
      if (count === 0) {
        console.log('⚠️  No active test centers found - this could be part of the issue');
      } else {
        console.log('Sample centers:', centers.slice(0, 3).map(c => c.name));
      }
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  // Test 2: Check driving test slots
  console.log('\n2. Testing Driving Test Slots Table...');
  try {
    const { data: slots, error: slotsError, count } = await supabase
      .from('driving_test_slots')
      .select('*', { count: 'exact' })
      .eq('available', true)
      .limit(5);

    if (slotsError) {
      console.log('❌ Driving test slots query failed:', slotsError.message);
      if (slotsError.message.includes('relation') || slotsError.message.includes('does not exist')) {
        console.log('💡 Fix: The driving_test_slots table does not exist or has wrong name');
      }
    } else {
      console.log(`✅ Driving test slots table exists with ${count} available slots`);
      if (count === 0) {
        console.log('🚨 ISSUE FOUND: No available slots in database!');
        console.log('💡 This is likely why the app shows no available dates');
        
        // Check if there are any slots at all
        const { count: totalSlots } = await supabase
          .from('driving_test_slots')
          .select('*', { count: 'exact', head: true });
        
        console.log(`   Total slots in database: ${totalSlots || 0}`);
        
        if (totalSlots === 0) {
          console.log('💡 Fix needed: The scraper needs to run to populate slots');
        } else {
          console.log('💡 Fix needed: All slots are marked as unavailable - scraper or data issue');
        }
      } else {
        console.log('Sample slots:', slots.map(s => `${s.date} ${s.time} at center ${s.center_id}`));
      }
    }
  } catch (error) {
    console.log('❌ Connection error:', error.message);
  }

  console.log('\n📋 DIAGNOSIS SUMMARY:');
  console.log('====================');
  console.log('Based on the analysis above, the most likely fixes are:');
  console.log('1. 🔧 Run the scraper service to populate available slots');
  console.log('2. 🔧 Ensure scheduler service is running regularly');
  console.log('3. 🔧 Check if DVSA scraping is working correctly');
  console.log('4. 🔧 Verify database schema matches code expectations');
}

diagnoseIssue().catch(error => {
  console.error('❌ Diagnosis failed:', error);
  console.log('\n💡 Possible issues:');
  console.log('- Network connectivity to Supabase');
  console.log('- Invalid Supabase credentials');
  console.log('- Database not properly configured');
});