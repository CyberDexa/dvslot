/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Sample DVSA test centers (major UK cities)
  await knex('dvsa_test_centers').del();
  
  await knex('dvsa_test_centers').insert([
    {
      name: 'London (Wood Green)',
      postcode: 'N22 6SA',
      address: 'Westbury Avenue',
      latitude: 51.6023,
      longitude: -0.1045,
      region: 'Greater London'
    },
    {
      name: 'Manchester (Cheetham Hill)',
      postcode: 'M8 8UF',
      address: 'Waterloo Road',
      latitude: 53.5123,
      longitude: -2.2434,
      region: 'Greater Manchester'
    },
    {
      name: 'Birmingham (South Yardley)',
      postcode: 'B25 8HU',
      address: 'Coventry Road',
      latitude: 52.4569,
      longitude: -1.8207,
      region: 'West Midlands'
    },
    {
      name: 'Leeds (Harehills)',
      postcode: 'LS8 5BD',
      address: 'Harehills Lane, Leeds',
      latitude: 53.8194,
      longitude: -1.5204,
      region: 'Yorkshire'
    },
    {
      name: 'Glasgow (Shieldhall)',
      postcode: 'G51 4UB',
      address: '1 Shieldhall Road, Glasgow',
      latitude: 55.8497,
      longitude: -4.3336,
      region: 'Scotland'
    },
    {
      name: 'Cardiff (Llanishen)',
      postcode: 'CF14 5GJ',
      address: 'Ty Glas Road, Llanishen, Cardiff',
      latitude: 51.5274,
      longitude: -3.2044,
      region: 'Wales'
    },
    {
      name: 'Bristol (Brislington)',
      postcode: 'BS4 5NF',
      address: 'Bath Road, Brislington, Bristol',
      latitude: 51.4334,
      longitude: -2.5530,
      region: 'South West'
    },
    {
      name: 'Newcastle (Gosforth)',
      postcode: 'NE3 1HZ',
      address: 'Regent Farm Road, Gosforth, Newcastle',
      latitude: 55.0067,
      longitude: -1.6177,
      region: 'North East'
    },
    {
      name: 'Liverpool (Garston)',
      postcode: 'L19 2JD',
      address: 'Speke Boulevard, Liverpool',
      latitude: 53.3532,
      longitude: -2.8737,
      region: 'North West'
    },
    {
      name: 'Nottingham (Watnall)',
      postcode: 'NG16 1HW',
      address: 'Watnall Road, Hucknall, Nottingham',
      latitude: 53.0194,
      longitude: -1.2040,
      region: 'East Midlands'
    }
  ]);
};
