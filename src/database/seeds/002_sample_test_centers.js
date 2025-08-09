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
      postcode: 'N22 5BN',
      address: '1 Westbury Avenue, Wood Green, London',
      latitude: 51.5994,
      longitude: -0.1059,
      region: 'London'
    },
    {
      name: 'Manchester (Cheetham Hill)',
      postcode: 'M8 8EP',
      address: '411 Cheetham Hill Road, Manchester',
      latitude: 53.5141,
      longitude: -2.2436,
      region: 'North West'
    },
    {
      name: 'Birmingham (Garretts Green)',
      postcode: 'B33 0SH',
      address: 'Garretts Green Lane, Birmingham',
      latitude: 52.4622,
      longitude: -1.7840,
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
