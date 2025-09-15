// Supabase Configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://mrqwzdrdbdguuaarjkwh.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ycXd6ZHJkYmRndXVhYXJqa3doIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ3NzU5MTIsImV4cCI6MjA3MDM1MTkxMn0.gqFf3XrSOx43xSp4evDA0sunxUTv7331s6WXbvzZbe4';

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = { supabase };
