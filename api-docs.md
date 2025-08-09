# API Documentation

## Overview

This API provides real-time access to appointment availability data, primarily focusing on UK DVSA driving tests, with future expansion to other appointment types like embassy appointments and potentially NHS appointments.  It allows developers to integrate this functionality into their applications, providing users with timely alerts and streamlined appointment management.

- **API Purpose and Scope:** To provide a reliable and efficient interface for accessing and managing appointment availability data, initially for DVSA driving tests, and subsequently expanding to other appointment types.
- **Base URL:** `https://api.appointmentalert.co.uk/v1/` (Version 1)
- **Versioning Strategy:**  API versioning is handled through URL path segments (e.g., `/v1/`).  Future versions will be released as separate paths.
- **Authentication and Authorization:** API Key authentication with rate limiting to prevent abuse.
- **Rate Limiting and Usage Policies:**  See section "Rate Limiting" for details.


## Authentication

- **Authentication Methods:** API Key authentication.
- **API Key Management:** Developers register for an API key through our developer portal (link to be provided).  API keys should be treated as confidential and securely stored.
- **Token-based authentication:** Not used in this version.  Future versions may incorporate OAuth 2.0.
- **Security Considerations:**  All communication is over HTTPS.  API keys are required for all requests.  Rate limiting and input validation help mitigate abuse.


## Core Endpoints

### User Management (Optional - for developer-facing features)

- **POST `/users`:** Register a new developer account.  Requires email and password.
- **POST `/users/login`:** Authenticate a developer account. Returns an API key.
- **GET `/users/me`:** Retrieve current developer account information (requires API key).
- **PUT `/users/me`:** Update current developer account information (requires API key).


### Core Features

- **GET `/appointments/driving-tests`:** Retrieve available driving test slots.
    - **Query Parameters:**
        - `test_type`: (required) `practical` or `theory`
        - `location`: (optional) Postcode or town/city.
        - `radius`: (optional) Radius in miles from the specified location (default: 10).
        - `date_from`: (optional) Start date for the search (YYYY-MM-DD).
        - `date_to`: (optional) End date for the search (YYYY-MM-DD).
    - **Response:**  JSON array of available slots, each with details like date, time, location, and test center ID.

- **POST `/alerts`:** Subscribe to alerts for specific criteria.
    - **Request Body:** JSON object containing:
        - `test_type`: `practical` or `theory`
        - `location`: Postcode or town/city.
        - `radius`: Radius in miles.
        - `user_id`: (optional, for user-specific alerts)
    - **Response:**  JSON object confirming subscription.

- **GET `/alerts/{alert_id}`:** Retrieve details of a specific alert subscription.

- **DELETE `/alerts/{alert_id}`:** Unsubscribe from a specific alert.

- **GET `/test-centers`:** Retrieve a list of all DVSA test centers with their IDs and locations.


### Data Management

- **CRUD operations:**  Not directly exposed for appointment data.  Data is updated through web scraping and internal processes.
- **Search and filtering:**  Implemented through query parameters in `/appointments/driving-tests`.
- **Bulk operations:** Not supported in this version.


## Data Models

### `/appointments/driving-tests` Response Example:

```json
[
  {
    "id": "12345",
    "test_type": "practical",
    "date": "2024-03-15",
    "time": "10:00",
    "location": "London, SW1A 2AA",
    "test_center_id": "67890",
    "available_slots": 2
  },
  {
    "id": "12346",
    "test_type": "theory",
    "date": "2024-03-10",
    "time": "14:30",
    "location": "Manchester, M1 1AA",
    "test_center_id": "67891",
    "available_slots": 1
  }
]
```

### Error Response Format:

```json
{
  "error": {
    "code": 400,
    "message": "Invalid request parameters",
    "details": "The 'test_type' parameter is required."
  }
}
```


## Error Handling

- **HTTP Status Codes:** Standard HTTP status codes are used (e.g., 200 OK, 400 Bad Request, 401 Unauthorized, 404 Not Found, 500 Internal Server Error).
- **Error Message Formats:**  Error responses are in JSON format, including a code, message, and optional details.
- **Common Error Scenarios:**  Invalid API key, invalid request parameters, rate limit exceeded, data not found.


## Rate Limiting

- **Request Limits per Endpoint:**  100 requests per minute per API key.
- **Rate Limiting Headers:**  `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- **Quota Management:**  Exceeding the rate limit results in a 429 Too Many Requests response.


## SDKs and Integration

- **Available SDKs:**  Currently none, but we plan to release SDKs for popular languages (Python, JavaScript, etc.) in the future.
- **Webhook Support:**  Not supported in this version.
- **Integration Examples:**  Examples will be provided in the developer portal.


## Examples

**Example Request (GET `/appointments/driving-tests`):**

```bash
curl -H "X-API-Key: YOUR_API_KEY" "https://api.appointmentalert.co.uk/v1/appointments/driving-tests?test_type=practical&location=London&radius=5"
```

**Example Response (Successful):**  (See Data Models section)


This documentation provides a foundation.  Further details and specific examples will be available in the developer portal.  The API is subject to change, and updates will be announced accordingly.
