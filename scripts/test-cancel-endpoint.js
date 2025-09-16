#!/usr/bin/env node

/**
 * Test Cancelled Appointments API Endpoint
 * This script tests the new /api/v1/appointments/cancelled endpoint
 */

const request = require('supertest');
const app = require('../src/app');

async function testCancelledEndpoint() {
  console.log('Testing /api/v1/appointments/cancelled endpoint...');
  
  try {
    const response = await request(app)
      .get('/api/v1/appointments/cancelled')
      .query({
        hours: 24,
        test_type: 'practical',
        limit: 10
      });

    console.log('Response status:', response.status);
    console.log('Response body:', JSON.stringify(response.body, null, 2));

    if (response.status === 200) {
      console.log('✅ Cancelled appointments endpoint is working');
      const data = response.body.data;
      console.log(`Found ${data.cancelled_appointments?.length || 0} cancelled appointments`);
    } else {
      console.log('❌ Endpoint failed with status:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Test regular appointments endpoint to ensure it includes cancel data
async function testRegularEndpoint() {
  console.log('\nTesting /api/v1/appointments/driving-tests endpoint...');
  
  try {
    const response = await request(app)
      .get('/api/v1/appointments/driving-tests')
      .query({
        test_type: 'practical',
        limit: 5
      });

    console.log('Response status:', response.status);
    
    if (response.status === 200) {
      console.log('✅ Regular appointments endpoint is working');
      const appointments = response.body.data?.appointments || [];
      
      if (appointments.length > 0) {
        const firstAppointment = appointments[0];
        const hasCancelFields = 'cancelled_date' in firstAppointment && 'cancellation_reason' in firstAppointment;
        console.log('Cancel fields present:', hasCancelFields ? '✅' : '❌');
      }
    } else {
      console.log('❌ Endpoint failed with status:', response.status);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

async function runTests() {
  await testCancelledEndpoint();
  await testRegularEndpoint();
  process.exit(0);
}

if (require.main === module) {
  runTests();
}

module.exports = { testCancelledEndpoint, testRegularEndpoint };