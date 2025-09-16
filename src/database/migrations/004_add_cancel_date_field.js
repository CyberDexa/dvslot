/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('driving_test_slots', (table) => {
    table.timestamp('cancelled_date').nullable();
    table.string('cancellation_reason', 500).nullable();
    table.index(['cancelled_date']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('driving_test_slots', (table) => {
    table.dropColumn('cancelled_date');
    table.dropColumn('cancellation_reason');
  });
};