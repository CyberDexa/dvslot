// Quick Supabase connection test
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    try {
        console.log('Testing Supabase connection...');
        
        // Check if table exists with count
        const { count, error: countError } = await supabase
            .from('test_centers')
            .select('*', { count: 'exact', head: true });
            
        if (countError) {
            console.error('Count error:', countError);
            return;
        }
        
        console.log('Table exists! Record count:', count);
        
        if (count > 0) {
            // Get some sample data
            const { data, error } = await supabase
                .from('test_centers')
                .select('name, region, is_active')
                .limit(3);
                
            if (error) {
                console.error('Data error:', error);
                return;
            }
            
            console.log('Sample data:', data);
        } else {
            console.log('Table is empty - migration may have failed');
        }
        
    } catch (err) {
        console.error('Connection failed:', err);
    }
}

testConnection();
