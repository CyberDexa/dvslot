/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('dvsa_test_centers', (table) => {
      table.increments('center_id').primary();
      table.string('name', 255).notNullable();
      table.string('postcode', 10).notNullable();
      table.string('address', 500);
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.string('region', 100);
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Add indexes
      table.index(['postcode']);
      table.index(['is_active']);
      table.index(['latitude', 'longitude']);
    })
    .createTable('driving_test_slots', (table) => {
      table.increments('slot_id').primary();
      table.integer('center_id').unsigned().notNullable().references('center_id').inTable('dvsa_test_centers');
      table.string('test_type', 50).notNullable().checkIn(['practical', 'theory']);
      table.date('date').notNullable();
      table.time('time').notNullable();
      table.boolean('available').defaultTo(true).notNullable();
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.timestamp('last_checked').defaultTo(knex.fn.now());
      table.string('external_id', 255); // ID from DVSA system if available
      
      // Add indexes
      table.index(['center_id', 'test_type']);
      table.index(['date', 'time']);
      table.index(['available']);
      table.index(['last_checked']);
      
      // Unique constraint to prevent duplicate slots
      table.unique(['center_id', 'test_type', 'date', 'time']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('driving_test_slots')
    .dropTableIfExists('dvsa_test_centers');
};
