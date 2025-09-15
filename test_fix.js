#!/usr/bin/env node

/**
 * Test script to verify the available dates fix is working
 */

const axios = require('axios');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';

async function testAvailableDates() {
  console.log('🧪 Testing DVSlot Available Dates Fix');
  console.log('=====================================\n');

  try {
    // Test 1: Health check
    console.log('1. Testing server health...');
    try {
      const healthResponse = await axios.get(`${SERVER_URL}/health`);
      console.log('✅ Server is running:', healthResponse.data.status);
    } catch (error) {
      console.log('❌ Server health check failed:', error.message);
      console.log('💡 Make sure the server is running with: npm start');
      return;
    }

    // Test 2: Check slot statistics
    console.log('\n2. Checking slot statistics...');
    try {
      const statsResponse = await axios.get(`${SERVER_URL}/admin/slot-stats`);
      const stats = statsResponse.data.data;
      
      console.log('✅ Slot Statistics:');
      console.log(`   Total available slots: ${stats.available}`);
      console.log(`   Practical tests: ${stats.practical.available}/${stats.practical.total}`);
      console.log(`   Theory tests: ${stats.theory.available}/${stats.theory.total}`);
      
      if (stats.available === 0) {
        console.log('⚠️  No available slots found - triggering population...');
        
        try {
          await axios.post(`${SERVER_URL}/admin/populate-slots`, {}, {
            headers: { 'Authorization': 'Bearer admin-debug-token' }
          });
          console.log('✅ Slot population triggered');
          
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 3000));
          const newStatsResponse = await axios.get(`${SERVER_URL}/admin/slot-stats`);
          const newStats = newStatsResponse.data.data;
          console.log(`✅ New available slots: ${newStats.available}`);
        } catch (populateError) {
          console.log('❌ Slot population failed:', populateError.response?.data || populateError.message);
        }
      }
    } catch (error) {
      console.log('❌ Slot stats failed:', error.response?.data || error.message);
    }

    // Test 3: Test appointments API
    console.log('\n3. Testing appointments API...');
    try {
      const appointmentsResponse = await axios.get(`${SERVER_URL}/api/v1/appointments/driving-tests`, {
        params: {
          test_type: 'practical',
          limit: 10
        }
      });
      
      const appointments = appointmentsResponse.data.data.appointments;
      console.log(`✅ Appointments API working - found ${appointments.length} appointments`);
      
      if (appointments.length === 0) {
        console.log('🚨 ISSUE: No appointments returned from API');
        console.log('💡 This means the available dates issue persists');
      } else {
        console.log('🎉 SUCCESS: Available dates are now showing!');
        console.log('Sample appointments:');
        appointments.slice(0, 3).forEach((apt, i) => {
          console.log(`   ${i+1}. ${apt.center.name} - ${apt.date} ${apt.time}`);
        });
      }
    } catch (error) {
      console.log('❌ Appointments API failed:', error.response?.data || error.message);
    }

    // Test 4: Test search functionality
    console.log('\n4. Testing search functionality...');
    try {
      const searchResponse = await axios.post(`${SERVER_URL}/api/v1/appointments/search`, {
        test_type: 'practical',
        limit: 5
      });
      
      const searchResults = searchResponse.data.data.appointments;
      console.log(`✅ Search API working - found ${searchResults.length} results`);
    } catch (error) {
      console.log('❌ Search API failed:', error.response?.data || error.message);
    }

    console.log('\n📋 TEST SUMMARY');
    console.log('===============');
    console.log('If you see "SUCCESS: Available dates are now showing!" above,');
    console.log('the issue has been fixed! 🎉');
    console.log('\nIf not, check the logs above for specific errors to address.');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAvailableDates();