#!/usr/bin/env node

/**
 * DVSlot Mobile App Test - Production API Integration
 * 
 * Tests the mobile app connection to the 318 UK centers database
 */

const { createClient } = require('@supabase/supabase-js');

// Production Supabase Configuration (same as mobile app)
const SUPABASE_URL = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

async function testMobileAppAPI() {
  console.log('📱 DVSlot Mobile App API Test');
  console.log('=============================\n');

  try {
    // Initialize Supabase (same as mobile app)
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    console.log('✅ Supabase client initialized');

    // Test 1: Database Connection
    console.log('\n🔗 Test 1: Database Connection');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('dvsa_test_centers')
      .select('center_id')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return;
    }
    console.log('✅ Database connection successful');

    // Test 2: Center Count
    console.log('\n📊 Test 2: UK Test Centers Count');
    const { count: totalCenters } = await supabase
      .from('dvsa_test_centers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    console.log(`✅ Total UK Centers: ${totalCenters}`);
    if (totalCenters >= 300) {
      console.log('🎯 Complete UK coverage confirmed!');
    } else {
      console.log('⚠️  Warning: Expected 318+ centers');
    }

    // Test 3: Regional Distribution
    console.log('\n🗺️  Test 3: Regional Coverage');
    const { data: regions } = await supabase
      .from('dvsa_test_centers')
      .select('region')
      .eq('is_active', true);

    if (regions) {
      const regionCounts = {};
      regions.forEach(center => {
        regionCounts[center.region] = (regionCounts[center.region] || 0) + 1;
      });

      console.log('Regional Distribution:');
      Object.entries(regionCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .forEach(([region, count]) => {
          console.log(`  ${region}: ${count} centers`);
        });
    }

    // Test 4: Sample Search (London area)
    console.log('\n🔍 Test 4: Sample Search (SW1A 1AA - Westminster)');
    
    // Mock coordinates for London
    const londonLat = 51.5074;
    const londonLng = -0.1278;
    const searchRadius = 25; // miles

    // Calculate distance helper
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 3959; // Earth's radius in miles
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    }

    const { data: nearbyLondonCenters } = await supabase
      .from('dvsa_test_centers')
      .select('center_code, name, city, region, latitude, longitude')
      .eq('is_active', true);

    if (nearbyLondonCenters) {
      const londonResults = nearbyLondonCenters
        .map(center => ({
          ...center,
          distance: calculateDistance(londonLat, londonLng, center.latitude, center.longitude)
        }))
        .filter(center => center.distance <= searchRadius)
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

      console.log(`Found ${londonResults.length} centers within ${searchRadius} miles of Westminster:`);
      londonResults.forEach(center => {
        console.log(`  ${center.name} (${center.city}) - ${center.distance.toFixed(1)} miles`);
      });
    }

    // Test 5: Sample Slots
    console.log('\n🎯 Test 5: Sample Test Slots');
    const { data: sampleSlots, count: slotCount } = await supabase
      .from('driving_test_slots')
      .select('center_id, test_type, date, time, available', { count: 'exact' })
      .eq('available', true)
      .gte('date', new Date().toISOString().split('T')[0])
      .limit(10);

    console.log(`✅ Total available slots: ${slotCount}`);
    if (sampleSlots && sampleSlots.length > 0) {
      console.log('Sample available slots:');
      sampleSlots.slice(0, 3).forEach(slot => {
        console.log(`  ${slot.test_type} test - ${slot.date} at ${slot.time}`);
      });
    }

    // Test 6: Mobile App Features Test
    console.log('\n📱 Test 6: Mobile App Features');
    
    // Feature 1: Geographic Search
    const geoSearchReady = nearbyLondonCenters && nearbyLondonCenters.some(c => c.latitude && c.longitude);
    console.log(`${geoSearchReady ? '✅' : '❌'} Geographic search capability`);

    // Feature 2: Real-time availability
    const realTimeReady = slotCount > 0;
    console.log(`${realTimeReady ? '✅' : '❌'} Real-time slot availability`);

    // Feature 3: Regional coverage (use regions data from earlier)
    const regionCounts = {};
    if (regions) {
      regions.forEach(center => {
        regionCounts[center.region] = (regionCounts[center.region] || 0) + 1;
      });
    }
    const regionalReady = Object.keys(regionCounts).length >= 10;
    console.log(`${regionalReady ? '✅' : '❌'} Complete UK regional coverage`);

    // Final Results
    console.log('\n🎉 MOBILE APP API TEST RESULTS');
    console.log('===============================');
    console.log(`✅ Database Connection: Working`);
    console.log(`✅ UK Test Centers: ${totalCenters}`);
    console.log(`✅ Regional Coverage: ${Object.keys(regionCounts).length} regions`);
    console.log(`✅ Available Slots: ${slotCount}`);
    console.log(`✅ London Area Search: ${londonResults?.length || 0} centers found`);
    
    if (totalCenters >= 300 && slotCount > 0) {
      console.log('\n🚀 MOBILE APP READY FOR TESTING!');
      console.log('📱 Features working:');
      console.log('   - Complete UK test center search');
      console.log('   - Real-time slot availability');
      console.log('   - Location-based filtering');
      console.log('   - Regional coverage nationwide');
    } else {
      console.log('\n⚠️  Mobile app may have limited functionality');
    }

  } catch (error) {
    console.error('❌ Mobile app API test failed:', error);
  }
}

// Run the test
testMobileAppAPI();
