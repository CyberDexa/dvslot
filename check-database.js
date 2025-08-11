const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Use anon key for read operations
const SUPABASE_URL = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 DVSlot - Database Status Check');
console.log('=================================');
console.log('');

async function checkDatabase() {
    try {
        console.log('📊 Checking current test centers...');
        
        const { data, error } = await supabase
            .from('test_centers')
            .select('id, name, city, region')
            .limit(10);
            
        if (error) {
            console.error('❌ Error reading database:', error.message);
            return false;
        }
        
        console.log(`✅ Found ${data.length} test centers (showing first 10)`);
        console.log('');
        
        if (data.length > 0) {
            console.log('📋 Current centers:');
            data.forEach((center, index) => {
                console.log(`${index + 1}. ${center.name} (${center.city}, ${center.region})`);
            });
        }
        
        // Check if we can get a total count
        const { count, error: countError } = await supabase
            .from('test_centers')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.log('⚠️  Could not get total count:', countError.message);
        } else {
            console.log(`📊 Total centers in database: ${count}`);
        }
        
        return true;
        
    } catch (error) {
        console.error('❌ Database check failed:', error.message);
        return false;
    }
}

async function main() {
    console.log('🔗 Connecting to Supabase...');
    console.log(`   URL: ${SUPABASE_URL}`);
    console.log(`   Using: anon key`);
    console.log('');
    
    const success = await checkDatabase();
    
    if (success) {
        console.log('');
        console.log('✅ Database accessible and contains test centers');
        console.log('📱 Your mobile app should be working with current data');
        console.log('🔄 Backend scraper can work with existing centers');
        console.log('');
        console.log('🚀 Ready to deploy backend for real DVSA integration!');
    } else {
        console.log('');
        console.log('❌ Database access failed');
    }
}

main();
