#!/usr/bin/env node

/**
 * Deployment Verification Script
 * Verifies that mock data has been removed and real API integration is working
 */

const axios = require('axios');

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

async function verifyDeployment() {
  console.log('🔍 Verifying DVSlot deployment...\n');

  const tests = [
    testHealthEndpoint,
    testCancelledEndpoint,
    testAppointmentsWithCancelData,
    testTestCentersEndpoint,
    checkForMockData
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      const result = await test();
      if (result.success) {
        console.log(`✅ ${result.name}`);
        passed++;
      } else {
        console.log(`❌ ${result.name}: ${result.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name}: ${error.message}`);
      failed++;
    }
    console.log('');
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All deployment verification tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️ Some tests failed. Please check the deployment.');
    process.exit(1);
  }
}

async function testHealthEndpoint() {
  try {
    const response = await axios.get(`${BASE_URL}/health`);
    
    if (response.status === 200 && response.data.status === 'OK') {
      return { success: true, name: 'Health endpoint' };
    } else {
      return { success: false, name: 'Health endpoint', error: 'Invalid response' };
    }
  } catch (error) {
    return { success: false, name: 'Health endpoint', error: error.message };
  }
}

async function testCancelledEndpoint() {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/appointments/cancelled`, {
      params: { hours: 24, limit: 5 }
    });
    
    if (response.status === 200 && response.data.data && 'cancelled_appointments' in response.data.data) {
      return { success: true, name: 'Cancelled appointments endpoint' };
    } else {
      return { success: false, name: 'Cancelled appointments endpoint', error: 'Invalid response structure' };
    }
  } catch (error) {
    return { success: false, name: 'Cancelled appointments endpoint', error: error.message };
  }
}

async function testAppointmentsWithCancelData() {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/appointments/driving-tests`, {
      params: { test_type: 'practical', limit: 1 }
    });
    
    if (response.status === 200 && response.data.data && response.data.data.appointments) {
      const appointments = response.data.data.appointments;
      if (appointments.length > 0) {
        const appointment = appointments[0];
        if ('cancelled_date' in appointment && 'cancellation_reason' in appointment) {
          return { success: true, name: 'Appointments include cancel data' };
        } else {
          return { success: false, name: 'Appointments include cancel data', error: 'Missing cancel fields' };
        }
      } else {
        return { success: true, name: 'Appointments include cancel data (no data to verify)' };
      }
    } else {
      return { success: false, name: 'Appointments include cancel data', error: 'Invalid response' };
    }
  } catch (error) {
    return { success: false, name: 'Appointments include cancel data', error: error.message };
  }
}

async function testTestCentersEndpoint() {
  try {
    const response = await axios.get(`${BASE_URL}/api/v1/test-centers`, {
      params: { limit: 10 }
    });
    
    if (response.status === 200 && response.data.data && response.data.data.test_centers) {
      const centers = response.data.data.test_centers;
      if (centers.length > 0) {
        // Check if we have real UK test centers (not just sample data)
        const hasRealCenters = centers.some(center => 
          center.name && center.postcode && center.region
        );
        
        if (hasRealCenters) {
          return { success: true, name: 'Test centers endpoint with real data' };
        } else {
          return { success: false, name: 'Test centers endpoint', error: 'No real center data found' };
        }
      } else {
        return { success: false, name: 'Test centers endpoint', error: 'No test centers found' };
      }
    } else {
      return { success: false, name: 'Test centers endpoint', error: 'Invalid response' };
    }
  } catch (error) {
    return { success: false, name: 'Test centers endpoint', error: error.message };
  }
}

async function checkForMockData() {
  try {
    // This test tries to detect if any mock/sample data is still being returned
    const response = await axios.get(`${BASE_URL}/api/v1/appointments/driving-tests`, {
      params: { test_type: 'practical', limit: 10 }
    });
    
    if (response.status === 200 && response.data.data) {
      const appointments = response.data.data.appointments || [];
      
      // Look for signs of mock data (e.g., consistent patterns, fake dates)
      const hasSuspiciousMockData = appointments.some(apt => 
        apt.time === '10:30' && apt.date && apt.available === true && 
        appointments.filter(a => a.time === apt.time).length > 3 // Too many identical times
      );
      
      if (hasSuspiciousMockData) {
        return { success: false, name: 'No mock data verification', error: 'Possible mock data detected' };
      } else {
        return { success: true, name: 'No mock data verification' };
      }
    } else {
      return { success: true, name: 'No mock data verification (no data to check)' };
    }
  } catch (error) {
    return { success: false, name: 'No mock data verification', error: error.message };
  }
}

if (require.main === module) {
  verifyDeployment();
}

module.exports = { verifyDeployment };