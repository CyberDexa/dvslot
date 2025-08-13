#!/usr/bin/env node

/**
 * Deploy Official 318 UK DVSA Test Centers to Production Database
 * 
 * This script deploys all 318 official UK test centers to the production Supabase database
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function deployOfficialCenters() {
  console.log('🚀 DVSlot Production Database Update');
  console.log('====================================\n');

  console.log('📊 Deploying complete 318 UK DVSA Test Centers...');
  console.log('   Source: Official DVSA CSV data');
  console.log('   Target: Production Supabase database\n');

  try {
    // Step 1: Load and parse the official 318 centers data
    console.log('📂 Loading official 318 UK test centers from CSV-generated SQL...');
    const sqlFilePath = path.join(__dirname, 'official-dvsa-centers.sql');
    
    if (!fs.existsSync(sqlFilePath)) {
      console.error('❌ SQL file not found:', sqlFilePath);
      console.log('💡 Run: node official-dvsa-centers.js first');
      return;
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log(`✅ SQL file loaded (${Math.round(fs.statSync(sqlFilePath).size / 1024)}KB)`);

    // Step 2: Parse the official centers data from the generated SQL
    console.log('\n🔄 Parsing official DVSA test centers...');
    const centers = parseOfficialCenters(sqlContent);
    console.log(`✅ Parsed ${centers.length} official UK test centers`);

    if (centers.length < 300) {
      console.error(`❌ Expected 300+ centers, got ${centers.length}`);
      return;
    }

    // Step 3: Deploy using Node.js pg client (more reliable than Supabase API)
    await deployViaPGClient(centers);

    console.log('\n🎉 Official UK Test Centers Deployment Complete!');
    console.log(`✅ Total Centers Deployed: ${centers.length}`);
    console.log('🚀 DVSlot production system ready for nationwide monitoring!');

  } catch (error) {
    console.error('❌ Deployment failed:', error);
  }
}

function parseOfficialCenters(sqlContent) {
  // Extract INSERT VALUES from the SQL content
  const insertMatch = sqlContent.match(/INSERT INTO dvsa_test_centers.*?VALUES\s*(.*?);/s);
  if (!insertMatch) {
    throw new Error('Could not parse SQL INSERT statement');
  }

  const valuesSection = insertMatch[1];
  const rows = [];
  
  // Simple parser for VALUES section (assumes proper SQL formatting)
  const regex = /\('([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*'([^']+)',\s*([-\d.]+),\s*([-\d.]+),\s*(true|false)/g;
  
  let match;
  while ((match = regex.exec(valuesSection)) !== null) {
    rows.push({
      center_code: match[1],
      name: match[2].replace(/''/g, "'"), // Unescape SQL quotes
      address: match[3],
      postcode: match[4], 
      city: match[5],
      region: match[6],
      latitude: parseFloat(match[7]),
      longitude: parseFloat(match[8]),
      is_active: match[9] === 'true'
    });
  }

  return rows;
}

async function deployViaPGClient(centers) {
  const { Client } = require('pg');
  
  // Use connection string format for PostgreSQL
  const client = new Client({
    connectionString: 'postgresql://postgres.mrqwzdrdbdguuaarjkwh:[YOUR-PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔄 Connecting to PostgreSQL database...');
  
  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Clear existing centers
    console.log('🗑️  Clearing existing test centers...');
    await client.query('DELETE FROM dvsa_test_centers');
    await client.query('DELETE FROM driving_test_slots');
    
    // Insert new centers in batches
    console.log('📋 Inserting official 318 UK test centers...');
    
    const batchSize = 50;
    let totalInserted = 0;

    for (let i = 0; i < centers.length; i += batchSize) {
      const batch = centers.slice(i, i + batchSize);
      
      // Build batch INSERT statement
      const values = batch.map((center, idx) => 
        `($${idx * 8 + 1}, $${idx * 8 + 2}, $${idx * 8 + 3}, $${idx * 8 + 4}, $${idx * 8 + 5}, $${idx * 8 + 6}, $${idx * 8 + 7}, $${idx * 8 + 8})`
      ).join(', ');
      
      const params = batch.flatMap(center => [
        center.center_code,
        center.name,
        center.address, 
        center.postcode,
        center.city,
        center.region,
        center.latitude,
        center.longitude
      ]);

      const query = `
        INSERT INTO dvsa_test_centers (center_code, name, address, postcode, city, region, latitude, longitude, is_active, created_at, updated_at)
        VALUES ${values}
      `;

      // Add the remaining fields that are not parameterized
      const finalQuery = query.replace(/\$(\d+)/g, (match, num) => {
        const paramIndex = parseInt(num) - 1;
        const param = params[paramIndex];
        return typeof param === 'string' ? `'${param.replace(/'/g, "''")}'` : param;
      }) + ", true, NOW(), NOW()".repeat(batch.length).replace(/^,\s*/, '').replace(/,\s*$/, '');

      // Rebuild properly
      const insertQuery = `
        INSERT INTO dvsa_test_centers (center_code, name, address, postcode, city, region, latitude, longitude, is_active, created_at, updated_at)
        VALUES ${batch.map(center => `('${center.center_code}', '${center.name.replace(/'/g, "''")}', '${center.address}', '${center.postcode}', '${center.city}', '${center.region}', ${center.latitude}, ${center.longitude}, true, NOW(), NOW())`).join(', ')}
      `;

      await client.query(insertQuery);
      totalInserted += batch.length;
      
      console.log(`   ✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(centers.length / batchSize)} (${batch.length} centers)`);
    }

    // Generate some sample slots for immediate testing
    console.log('\n🎯 Generating sample test slots for next 7 days...');
    
    const slotQuery = `
      INSERT INTO driving_test_slots (center_id, test_type, date, time, available, created_at, updated_at, last_checked)
      SELECT 
        tc.center_id,
        'practical' as test_type,
        CURRENT_DATE + (RANDOM() * 7)::integer as date,
        ('08:00'::time + (RANDOM() * interval '8 hours'))::time as time,
        (RANDOM() > 0.7) as available,
        NOW() as created_at,
        NOW() as updated_at,
        NOW() as last_checked
      FROM dvsa_test_centers tc
      CROSS JOIN generate_series(1, 5) -- 5 slots per center
      ON CONFLICT DO NOTHING;
    `;
    
    await client.query(slotQuery);
    console.log('✅ Generated sample test slots');

    // Get final counts
    const { rows: [centerCount] } = await client.query('SELECT COUNT(*) as count FROM dvsa_test_centers');
    const { rows: [slotCount] } = await client.query('SELECT COUNT(*) as count FROM driving_test_slots');

    console.log(`\n📊 Deployment Summary:`);
    console.log(`   Centers: ${centerCount.count}`);
    console.log(`   Sample Slots: ${slotCount.count}`);

    // Regional breakdown
    const { rows: regions } = await client.query(`
      SELECT region, COUNT(*) as count 
      FROM dvsa_test_centers 
      GROUP BY region 
      ORDER BY count DESC
    `);

    console.log('\n🗺️  Regional Distribution:');
    regions.slice(0, 10).forEach(({ region, count }) => {
      console.log(`   ${region}: ${count} centers`);
    });

    await client.end();
    console.log('\n✅ Database connection closed');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error.message);
    await client.end();
    throw error;
  }
}

// Run deployment
deployOfficialCenters();
