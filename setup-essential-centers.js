const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Using anon key for basic operations
const SUPABASE_URL = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🚀 DVSlot - Essential UK Test Centers Setup');
console.log('==========================================');
console.log('');

// Essential test centers covering major UK regions
const essentialCenters = [
    // Major London centers
    { id: crypto.randomUUID(), name: 'London (Mill Hill)', address: 'The Hyde, Mill Hill, London', postcode: 'NW7 1RB', city: 'London', region: 'London', latitude: 51.6156, longitude: -0.2464, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'London (Hendon)', address: 'Aerodrome Road, Hendon', postcode: 'NW9 5LL', city: 'London', region: 'London', latitude: 51.5664, longitude: -0.2312, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'London (Barking)', address: 'Jenkins Lane, Barking', postcode: 'IG11 0AD', city: 'London', region: 'London', latitude: 51.5607, longitude: 0.0899, phone_number: '0300 200 1122', is_active: true },
    
    // Major regional centers
    { id: crypto.randomUUID(), name: 'Birmingham', address: 'Garretts Green, Birmingham', postcode: 'B26 2HT', city: 'Birmingham', region: 'West Midlands', latitude: 52.4506, longitude: -1.8040, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Manchester', address: 'Openshaw, Manchester', postcode: 'M11 2EJ', city: 'Manchester', region: 'North West', latitude: 53.4808, longitude: -2.2426, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Liverpool', address: 'Speke Hall Avenue, Liverpool', postcode: 'L24 1YD', city: 'Liverpool', region: 'North West', latitude: 53.3498, longitude: -2.8526, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Leeds', address: 'Harehills, Leeds', postcode: 'LS8 3DT', city: 'Leeds', region: 'Yorkshire', latitude: 53.8008, longitude: -1.5491, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Bristol', address: 'Brislington, Bristol', postcode: 'BS4 5NF', city: 'Bristol', region: 'South West', latitude: 51.4545, longitude: -2.5879, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Sheffield', address: 'Handsworth, Sheffield', postcode: 'S13 9BT', city: 'Sheffield', region: 'Yorkshire', latitude: 53.3811, longitude: -1.4701, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Newcastle', address: 'Kenton Road, Newcastle', postcode: 'NE3 3BE', city: 'Newcastle', region: 'North East', latitude: 55.0184, longitude: -1.6153, phone_number: '0300 200 1122', is_active: true },
    
    // Additional key regional centers
    { id: crypto.randomUUID(), name: 'Glasgow', address: 'Anniesland, Glasgow', postcode: 'G13 1HQ', city: 'Glasgow', region: 'Scotland', latitude: 55.8642, longitude: -4.2518, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Edinburgh', address: 'Currie, Edinburgh', postcode: 'EH14 5AA', city: 'Edinburgh', region: 'Scotland', latitude: 55.9533, longitude: -3.1883, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Cardiff', address: 'Llanishen, Cardiff', postcode: 'CF14 5GL', city: 'Cardiff', region: 'Wales', latitude: 51.4816, longitude: -3.1791, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Belfast', address: 'Balmoral Road, Belfast', postcode: 'BT12 6QL', city: 'Belfast', region: 'Northern Ireland', latitude: 54.5973, longitude: -5.9301, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Nottingham', address: 'Colwick, Nottingham', postcode: 'NG4 2JT', city: 'Nottingham', region: 'East Midlands', latitude: 52.9536, longitude: -1.0595, phone_number: '0300 200 1122', is_active: true },
    
    // South East regional coverage
    { id: crypto.randomUUID(), name: 'Brighton', address: 'Wilson Avenue, Brighton', postcode: 'BN2 0LA', city: 'Brighton', region: 'South East', latitude: 50.8225, longitude: -0.1372, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Reading', address: 'Craven Road, Reading', postcode: 'RG1 5LE', city: 'Reading', region: 'South East', latitude: 51.4543, longitude: -0.9781, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Oxford', address: 'Cowley Road, Oxford', postcode: 'OX4 2HE', city: 'Oxford', region: 'South East', latitude: 51.7520, longitude: -1.2577, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Canterbury', address: 'Sturry Road, Canterbury', postcode: 'CT1 1HU', city: 'Canterbury', region: 'South East', latitude: 51.2802, longitude: 1.0789, phone_number: '0300 200 1122', is_active: true },
    { id: crypto.randomUUID(), name: 'Portsmouth', address: 'Eastern Road, Portsmouth', postcode: 'PO6 1UN', city: 'Portsmouth', region: 'South East', latitude: 50.8198, longitude: -1.0880, phone_number: '0300 200 1122', is_active: true }
];

async function setupEssentialCenters() {
    try {
        console.log('📤 Setting up essential UK test centers...');
        console.log(`🎯 Total centers to insert: ${essentialCenters.length}`);
        console.log('');
        
        // Regional breakdown
        const regions = {};
        essentialCenters.forEach(center => {
            regions[center.region] = (regions[center.region] || 0) + 1;
        });
        
        console.log('📍 Regional coverage:');
        Object.entries(regions).forEach(([region, count]) => {
            console.log(`   ${region}: ${count} centers`);
        });
        console.log('');
        
        console.log('📤 Inserting centers...');
        
        const { data, error } = await supabase
            .from('test_centers')
            .insert(essentialCenters)
            .select();
        
        if (error) {
            console.error('❌ Error inserting centers:', error.message);
            console.error('Error details:', error);
            return false;
        }
        
        console.log('✅ All test centers inserted successfully!');
        console.log(`📊 Total: ${essentialCenters.length} centers across ${Object.keys(regions).length} regions`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Setup failed:', error.message);
        console.error('Full error:', error);
        return false;
    }
}

async function main() {
    console.log('🔗 Connecting to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log('');
    
    const success = await setupEssentialCenters();
    
    if (success) {
        console.log('');
        console.log('🎉 ESSENTIAL CENTERS SETUP COMPLETED!');
        console.log('====================================');
        console.log('');
        console.log('✅ Your database now contains essential UK DVSA test centers');
        console.log('🔄 Coverage includes all major cities and regions:');
        console.log('   • London (3 centers) - Mill Hill, Hendon, Barking');
        console.log('   • Major cities - Birmingham, Manchester, Liverpool, Leeds');
        console.log('   • Regional capitals - Glasgow, Edinburgh, Cardiff, Belfast');
        console.log('   • South East - Brighton, Reading, Oxford, Canterbury, Portsmouth');
        console.log('   • Complete UK geographic spread');
        console.log('');
        console.log('📊 This provides excellent coverage for DVSA slot finding');
        console.log('🚀 Ready to deploy your backend for 24/7 real DVSA scraping!');
        console.log('');
        console.log('Next steps:');
        console.log('1. Deploy backend: bash scripts/deploy-railway.sh');
        console.log('2. Mobile app will get live data from real test centers');
        console.log('3. Users will see actual DVSA availability across the UK');
    } else {
        console.log('');
        console.log('❌ SETUP FAILED');
        console.log('===============');
        console.log('');
        console.log('🔧 Please check error messages above');
    }
}

main();
