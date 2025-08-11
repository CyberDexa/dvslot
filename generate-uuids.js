const crypto = require('crypto');

// Generate UUID v4
function generateUUID() {
    return crypto.randomUUID();
}

// Create our test centers with proper UUIDs
const testCentersWithUUIDs = [];

// Sample data to convert
const sampleCenters = [
    { name: 'London (Mill Hill)', address: 'The Hyde, Mill Hill, London', postcode: 'NW7 1RB', city: 'London', region: 'London', latitude: 51.6156, longitude: -0.2464 },
    { name: 'Birmingham', address: 'Garretts Green, Birmingham', postcode: 'B26 2HT', city: 'Birmingham', region: 'West Midlands', latitude: 52.4506, longitude: -1.8040 },
    { name: 'Manchester', address: 'Openshaw, Manchester', postcode: 'M11 2EJ', city: 'Manchester', region: 'North West', latitude: 53.4808, longitude: -2.2426 },
    { name: 'Leeds', address: 'Harehills, Leeds', postcode: 'LS8 3DT', city: 'Leeds', region: 'Yorkshire', latitude: 53.8008, longitude: -1.5491 },
    { name: 'Liverpool', address: 'Speke Hall Avenue, Liverpool', postcode: 'L24 1YD', city: 'Liverpool', region: 'North West', latitude: 53.3498, longitude: -2.8526 }
];

sampleCenters.forEach(center => {
    testCentersWithUUIDs.push({
        id: generateUUID(),
        name: center.name,
        address: center.address,
        postcode: center.postcode,
        city: center.city,
        region: center.region,
        latitude: center.latitude,
        longitude: center.longitude,
        phone_number: '0300 200 1122',
        is_active: true
    });
});

console.log('Test centers with UUIDs:');
console.log(JSON.stringify(testCentersWithUUIDs, null, 2));
