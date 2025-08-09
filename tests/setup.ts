import { beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { AppDataSource } from '../src/config/database';
import { createTestDatabase, dropTestDatabase } from './helpers/database';

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'dvslot_test';
  
  // Create test database
  await createTestDatabase();
  
  // Initialize database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  
  // Run migrations
  await AppDataSource.runMigrations();
}, 30000);

afterAll(async () => {
  // Close database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }
  
  // Drop test database
  await dropTestDatabase();
}, 30000);

beforeEach(async () => {
  // Clear all tables before each test
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    const repository = AppDataSource.getRepository(entity.name);
    await repository.clear();
  }
});

afterEach(async () => {
  // Clean up after each test if needed
});
