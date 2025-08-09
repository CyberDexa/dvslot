/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .createTable('user_alerts', (table) => {
      table.increments('alert_id').primary();
      table.integer('user_id').unsigned().notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.integer('slot_id').unsigned().notNullable().references('slot_id').inTable('driving_test_slots').onDelete('CASCADE');
      table.boolean('sent').defaultTo(false).notNullable();
      table.timestamp('sent_at');
      table.string('notification_type', 50).defaultTo('push'); // push, email, both
      table.text('message_content');
      table.boolean('user_clicked').defaultTo(false);
      table.timestamp('clicked_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Add indexes
      table.index(['user_id', 'sent']);
      table.index(['slot_id']);
      table.index(['created_at']);
    })
    .createTable('alert_subscriptions', (table) => {
      table.increments('subscription_id').primary();
      table.integer('user_id').unsigned().notNullable().references('user_id').inTable('users').onDelete('CASCADE');
      table.string('test_type', 50).notNullable().checkIn(['practical', 'theory', 'both']);
      table.string('location', 255); // Postcode or city
      table.decimal('latitude', 10, 8);
      table.decimal('longitude', 11, 8);
      table.integer('radius').defaultTo(25); // Miles
      table.jsonb('preferred_centers'); // Array of center IDs
      table.date('date_from');
      table.date('date_to');
      table.jsonb('preferred_times'); // Array of time ranges
      table.boolean('is_active').defaultTo(true);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Add indexes
      table.index(['user_id', 'is_active']);
      table.index(['test_type']);
      table.index(['location']);
    })
    .createTable('audit_logs', (table) => {
      table.increments('log_id').primary();
      table.string('action', 100).notNullable();
      table.string('entity_type', 50); // user, alert, slot, etc.
      table.integer('entity_id');
      table.integer('user_id').unsigned().references('user_id').inTable('users');
      table.jsonb('old_values');
      table.jsonb('new_values');
      table.string('ip_address', 45);
      table.string('user_agent', 500);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Add indexes
      table.index(['action']);
      table.index(['entity_type', 'entity_id']);
      table.index(['user_id']);
      table.index(['created_at']);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('audit_logs')
    .dropTableIfExists('alert_subscriptions')
    .dropTableIfExists('user_alerts');
};
