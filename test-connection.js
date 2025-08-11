const { createClient } = require('@supabase/supabase-js');

// Test with anon key first
const SUPABASE_URL = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔍 Testing Supabase Connection...');
console.log('=================================');
console.log('');

async function testConnection() {
    try {
        console.log('📡 Testing basic connection...');
        
        // Test simple select
        const { data, error } = await supabase
            .from('test_centers')
            .select('count')
            .limit(1);
            
        if (error) {
            console.error('❌ Connection error:', error.message);
            return false;
        }
        
        console.log('✅ Connection successful!');
        console.log(`📊 Current centers in database: ${data ? 'accessible' : 'none'}`);
        
        return true;
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        return false;
    }
}

async function main() {
    const connected = await testConnection();
    
    if (connected) {
        console.log('');
        console.log('✅ Ready to proceed with migration');
        console.log('🔑 Will need service role key for full access');
    } else {
        console.log('');
        console.log('❌ Connection failed - check credentials');
    }
}

main();
