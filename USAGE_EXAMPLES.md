# DVSlot API Usage Examples

## Get Recently Cancelled Appointments

```bash
# Get cancelled appointments from the last 24 hours
curl -X GET "http://localhost:3000/api/v1/appointments/cancelled?hours=24&limit=10"

# Get only cancelled practical test appointments
curl -X GET "http://localhost:3000/api/v1/appointments/cancelled?test_type=practical&hours=48"
```

## Get Regular Appointments (Now Include Cancel Data)

```bash
# Get available practical test appointments
curl -X GET "http://localhost:3000/api/v1/appointments/driving-tests?test_type=practical&limit=5"

# Response now includes cancel data:
{
  "data": {
    "appointments": [
      {
        "slot_id": 123,
        "test_type": "practical",
        "date": "2024-01-20",
        "time": "10:30",
        "available": true,
        "cancelled_date": null,           // NEW: null if not cancelled
        "cancellation_reason": null,      // NEW: reason if cancelled
        "center": { /* center details */ }
      }
    ]
  }
}
```

## Advanced Search with Cancel Data

```javascript
// POST request to search for appointments
const response = await fetch('/api/v1/appointments/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    test_type: 'practical',
    location: { latitude: 51.5074, longitude: -0.1278 },
    radius: 25,
    date_from: '2024-01-15',
    date_to: '2024-01-30'
  })
});

const data = await response.json();
// All appointments include cancelled_date and cancellation_reason fields
```

## Using the Cancellation Detection in Code

```javascript
const DrivingTestSlot = require('./src/models/DrivingTestSlot');

// Mark a slot as cancelled
await DrivingTestSlot.markCancelled(slotId, "Test centre temporarily closed");

// Get recently cancelled slots
const cancelledSlots = await DrivingTestSlot.getRecentlyCancelled(24); // last 24 hours

// Check if a slot was cancelled
const slot = await DrivingTestSlot.findById(123);
if (slot.cancelled_date) {
  console.log(`Slot cancelled on ${slot.cancelled_date}: ${slot.cancellation_reason}`);
}
```

## Real DVSA Scraping

The scraper now automatically:

1. **Connects to real DVSA URLs**:
   ```
   https://driverpracticaltest.dvsa.gov.uk/application?testType=practical&testCentreId=123&driving-licence-postcode=N22%205BN
   ```

2. **Detects cancelled slots** by looking for:
   - Elements with 'cancelled' or 'unavailable' classes
   - Text content indicating cancellation
   - Missing slots that were previously available

3. **Processes cancellations automatically**:
   - Updates database with cancellation timestamp
   - Publishes cancellation events to message queue
   - Triggers alerts for affected users

## Migration

To apply the database changes:

```bash
npm run migrate
```

This adds the new `cancelled_date` and `cancellation_reason` fields to your database.

## Testing

```bash
# Test the real API connection
node scripts/test-real-api.js

# Test the cancel endpoint
node scripts/test-cancel-endpoint.js

# Verify deployment
node scripts/verify-deployment.js

# See functionality demo
node scripts/demo-functionality.js
```