// Test specific tables that the app uses
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTables() {
    console.log('Testing specific tables used by the app...');
    
    const tables = ['dvsa_test_centers', 'driving_test_slots', 'test_centers'];
    
    for (const table of tables) {
        try {
            console.log(`\n--- Testing table: ${table} ---`);
            
            const { count, error: countError } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });
                
            if (countError) {
                console.error(`${table} - Count error:`, countError);
                continue;
            }
            
            console.log(`${table} - Record count:`, count);
            
            if (count > 0) {
                const { data, error } = await supabase
                    .from(table)
                    .select('*')
                    .limit(1);
                    
                if (error) {
                    console.error(`${table} - Data error:`, error);
                } else {
                    console.log(`${table} - Sample data keys:`, Object.keys(data[0] || {}));
                }
            }
        } catch (err) {
            console.error(`${table} - Exception:`, err.message);
        }
    }
}

testTables();