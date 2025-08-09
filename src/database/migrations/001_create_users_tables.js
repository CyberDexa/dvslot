/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('roles', (table) => {
      table.increments('role_id').primary();
      table.string('role_name', 255).notNullable().unique();
      table.timestamp('created_at').defaultTo(knex.fn.now());
    })
    .createTable('users', (table) => {
      table.increments('user_id').primary();
      table.string('email', 255).notNullable().unique();
      table.string('password_hash', 255).notNullable();
      table.string('first_name', 255);
      table.string('last_name', 255);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      table.boolean('is_active').defaultTo(true).notNullable();
      table.integer('role_id').unsigned().references('role_id').inTable('roles').defaultTo(2);
      table.string('fcm_token', 500); // For push notifications
      table.timestamp('last_login');
      
      // Add indexes
      table.index(['email']);
      table.index(['is_active']);
    })
    .createTable('user_preferences', (table) => {
      table.increments('preference_id').primary();
      table.integer('user_id').unsigned().notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.integer('notification_radius').defaultTo(25).notNullable();
      table.string('notification_method', 50).defaultTo('push').notNullable()
        .checkIn(['email', 'push', 'both']);
      table.jsonb('preferred_test_types').defaultTo(JSON.stringify(['practical']));
      table.jsonb('preferred_test_centers'); // Array of test center IDs
      table.boolean('email_notifications').defaultTo(true);
      table.boolean('push_notifications').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Add unique constraint
      table.unique(['user_id']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('user_preferences')
    .dropTableIfExists('users')
    .dropTableIfExists('roles');
};
