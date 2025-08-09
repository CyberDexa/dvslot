const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('roles').del();
  
  // Insert default roles
  await knex('roles').insert([
    { role_name: 'admin' },
    { role_name: 'user' },
    { role_name: 'instructor' }
  ]);

  // Create default admin user
  const hashedPassword = await bcrypt.hash('admin123', 12);
  const adminRoleId = await knex('roles').where('role_name', 'admin').first().then(role => role.role_id);
  
  await knex('users').del();
  await knex('users').insert([
    {
      email: 'admin@dvslot.co.uk',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role_id: adminRoleId,
      is_active: true
    }
  ]);
};
