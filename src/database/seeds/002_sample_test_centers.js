/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // This seed file has been deprecated in favor of complete UK DVSA test centers
  // Use the complete_uk_test_centers.sql file for real DVSA data
  // No longer inserting sample/mock data
  
  console.log('Sample test centers seed skipped - use real DVSA data instead');
};
