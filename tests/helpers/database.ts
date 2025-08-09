import knex from 'knex';
import knexConfig from '../../knexfile';

let testDb: any;

export const createTestDatabase = async () => {
  const config = knexConfig.test;
  const adminDb = knex({
    ...config,
    connection: {
      ...config.connection,
      database: 'postgres' // Connect to default database first
    }
  });

  try {
    // Drop test database if exists
    await adminDb.raw(`DROP DATABASE IF EXISTS dvslot_test`);
    
    // Create test database
    await adminDb.raw(`CREATE DATABASE dvslot_test`);
    
    console.log('Test database created successfully');
  } catch (error) {
    console.error('Error creating test database:', error);
  } finally {
    await adminDb.destroy();
  }
};

export const dropTestDatabase = async () => {
  if (testDb) {
    await testDb.destroy();
  }

  const config = knexConfig.test;
  const adminDb = knex({
    ...config,
    connection: {
      ...config.connection,
      database: 'postgres'
    }
  });

  try {
    await adminDb.raw(`DROP DATABASE IF EXISTS dvslot_test`);
    console.log('Test database dropped successfully');
  } catch (error) {
    console.error('Error dropping test database:', error);
  } finally {
    await adminDb.destroy();
  }
};

export const getTestDatabase = () => {
  if (!testDb) {
    const config = knexConfig.test;
    testDb = knex(config);
  }
  return testDb;
};

export const cleanDatabase = async () => {
  const db = getTestDatabase();
  
  // Get all table names
  const tables = await db.raw(`
    SELECT tablename FROM pg_tables 
    WHERE schemaname = 'public' 
    AND tablename != 'knex_migrations' 
    AND tablename != 'knex_migrations_lock'
  `);
  
  // Truncate all tables
  for (const table of tables.rows) {
    await db.raw(`TRUNCATE TABLE "${table.tablename}" RESTART IDENTITY CASCADE`);
  }
};
