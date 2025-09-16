# DVSlot API - Cancel Test Date Documentation

## Overview

The DVSlot API has been enhanced to support tracking and viewing cancelled driving test appointments. All mock data has been removed and the system now connects to real DVSA data sources.

## Key Changes

### 1. Mock Data Removal
- ❌ Removed all sample/mock test center data
- ❌ Removed artificial slot generation
- ✅ Now uses real UK DVSA test center data (350+ centers)
- ✅ Connects to actual DVSA booking website

### 2. Cancel Test Date Functionality

#### Database Schema Updates
```sql
-- New fields added to driving_test_slots table
ALTER TABLE driving_test_slots ADD COLUMN cancelled_date TIMESTAMP;
ALTER TABLE driving_test_slots ADD COLUMN cancellation_reason VARCHAR(500);
```

#### API Endpoints

##### Get Cancelled Appointments
```
GET /api/v1/appointments/cancelled
```

**Parameters:**
- `hours` (optional): Hours to look back for cancellations (default: 24)
- `test_type` (optional): Filter by 'practical' or 'theory'
- `limit` (optional): Maximum results to return (default: 20)

**Response:**
```json
{
  "message": "Recently cancelled appointments retrieved successfully",
  "data": {
    "cancelled_appointments": [
      {
        "slot_id": 123,
        "test_type": "practical",
        "date": "2024-01-15",
        "time": "10:30",
        "cancelled_date": "2024-01-10T09:15:00Z",
        "cancellation_reason": "Detected as cancelled during scraping",
        "center": {
          "center_id": 1,
          "name": "London (Wood Green)",
          "postcode": "N22 5BN",
          "region": "London"
        }
      }
    ],
    "criteria": {
      "hours_back": 24,
      "test_type": "practical",
      "limit": 20
    }
  }
}
```

#### Enhanced Existing Endpoints

All appointment endpoints now include cancellation data:

##### Regular Appointments
```
GET /api/v1/appointments/driving-tests
POST /api/v1/appointments/search
GET /api/v1/appointments/:slotId
```

**Enhanced Response Format:**
```json
{
  "appointments": [
    {
      "slot_id": 456,
      "test_type": "practical",
      "date": "2024-01-20",
      "time": "14:00",
      "available": true,
      "cancelled_date": null,
      "cancellation_reason": null,
      "last_checked": "2024-01-15T12:30:00Z",
      "center": { /* center details */ }
    }
  ]
}
```

### 3. Real DVSA Integration

#### Updated Scraper Service
- ✅ Connects to official DVSA booking website
- ✅ Uses real test center IDs and postcodes
- ✅ Detects cancelled/unavailable slots automatically
- ✅ Handles various DVSA date/time formats
- ✅ Publishes cancellation events for real-time alerts

#### DVSA URL Structure
```
https://driverpracticaltest.dvsa.gov.uk/application?testType=practical&testCentreId=123&driving-licence-postcode=N22 5BN
```

### 4. Real-time Cancellation Detection

The scraper now automatically:
1. Detects slots marked as cancelled on DVSA website
2. Updates database with cancellation timestamp and reason
3. Publishes cancellation events to message queue
4. Notifies alert system of cancelled slots

### 5. Cancellation Tracking

#### Model Methods
```javascript
// Mark a slot as cancelled
await DrivingTestSlot.markCancelled(slotId, "Reason for cancellation");

// Get recently cancelled slots
const cancelled = await DrivingTestSlot.getRecentlyCancelled(24); // 24 hours
```

## Testing

### Test Real API Connection
```bash
node scripts/test-real-api.js
```

### Test Cancel Endpoint
```bash
node scripts/test-cancel-endpoint.js
```

## Migration Guide

To apply the new schema changes:

```bash
npm run migrate
```

## Environment Variables

Updated `.env` configuration (mock flags removed):

```env
# Real DVSA endpoints
DVSA_BASE_URL=https://driverpracticaltest.dvsa.gov.uk
DVSA_BOOKING_URL=https://driverpracticaltest.dvsa.gov.uk/manage
DVSA_APPLICATION_URL=https://driverpracticaltest.dvsa.gov.uk/application

# Scraping configuration
SCRAPING_DELAY_MIN=5000
SCRAPING_DELAY_MAX=15000
MAX_CONCURRENT_SCRAPERS=5
```

## Breaking Changes

1. **Mock Data Removed**: If you were relying on sample data, you'll need to use real DVSA data
2. **New Fields**: All appointment responses now include `cancelled_date` and `cancellation_reason` fields
3. **Real Scraping**: The system now requires proper delays and rate limiting for DVSA compliance

## Benefits

- ✅ **Real Data**: All data comes from official DVSA sources
- ✅ **Cancellation Tracking**: Users can see when tests are cancelled
- ✅ **Real-time Updates**: Automatic detection of cancelled slots
- ✅ **Improved Reliability**: No more artificial data inconsistencies
- ✅ **Better User Experience**: Users get accurate, up-to-date information