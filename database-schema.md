# Database Schema

## Overview

- **Database Technology Recommendation:** PostgreSQL.  Its robust features, including JSONB support for flexible data handling, excellent performance, and strong support for extensions, make it ideal for this application.  It also offers good scalability options.

- **Schema Design Principles:**  Normalization (3NF), ACID properties, modularity, and maintainability are key principles.  The schema will be designed to minimize data redundancy and ensure data integrity.

- **Performance Considerations:**  Indexing strategies, query optimization, and potential partitioning will be crucial for handling the high volume of data and requests expected.  Caching mechanisms will be implemented to reduce database load.

- **Scalability Strategy:**  The database will be designed for horizontal scalability using techniques like sharding (potentially by geographic region) and read replicas to handle increasing data volume and user traffic.


## Core Tables

### User Management

**1. Users:**

| Column Name        | Data Type    | Constraints                               | Description                                      |
|---------------------|---------------|-------------------------------------------|--------------------------------------------------|
| user_id            | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each user                  |
| email              | VARCHAR(255) | NOT NULL, UNIQUE, CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$') | User's email address                           |
| password_hash      | VARCHAR(255) | NOT NULL                                 | Hashed password                                  |
| first_name         | VARCHAR(255) |                                           | User's first name                               |
| last_name          | VARCHAR(255) |                                           | User's last name                               |
| created_at         | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP       | Timestamp of user creation                      |
| updated_at         | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                 | Timestamp of last update                        |
| is_active          | BOOLEAN       | NOT NULL, DEFAULT TRUE                    | Indicates if the user account is active          |
| role_id            | INTEGER       | REFERENCES Roles(role_id)                 | User's role (e.g., admin, user)                |


**2. Roles:**

| Column Name    | Data Type    | Constraints                               | Description                     |
|-----------------|---------------|-------------------------------------------|---------------------------------|
| role_id        | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each role |
| role_name      | VARCHAR(255) | NOT NULL, UNIQUE                          | Name of the role                 |


**3. UserPreferences:**

| Column Name      | Data Type    | Constraints                               | Description                                   |
|-------------------|---------------|-------------------------------------------|-----------------------------------------------|
| preference_id    | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for user preferences         |
| user_id          | INTEGER       | NOT NULL, REFERENCES Users(user_id)       | User ID                                      |
| notification_radius | INTEGER       | NOT NULL, DEFAULT 25                     | Radius in miles for location-based alerts     |
| notification_method | VARCHAR(50)  | NOT NULL, CHECK (notification_method IN ('email', 'push')) | Preferred notification method                  |
| preferred_test_types | JSONB        |                                           | Array of preferred test types (practical, theory) |


### Application Data

**1. DVSA Test Centers:**

| Column Name      | Data Type    | Constraints                               | Description                                   |
|-------------------|---------------|-------------------------------------------|-----------------------------------------------|
| center_id        | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each test center         |
| name             | VARCHAR(255) | NOT NULL                                 | Name of the test center                       |
| postcode         | VARCHAR(10)  | NOT NULL                                 | Postcode of the test center                   |
| latitude         | NUMERIC       |                                           | Latitude of the test center                   |
| longitude        | NUMERIC       |                                           | Longitude of the test center                  |


**2. DrivingTestSlots:**

| Column Name      | Data Type    | Constraints                               | Description                                   |
|-------------------|---------------|-------------------------------------------|-----------------------------------------------|
| slot_id          | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each test slot           |
| center_id        | INTEGER       | NOT NULL, REFERENCES DVSA_Test_Centers(center_id) | ID of the test center                        |
| test_type        | VARCHAR(50)  | NOT NULL, CHECK (test_type IN ('practical', 'theory')) | Type of driving test (practical or theory)    |
| date             | DATE          | NOT NULL                                 | Date of the test slot                         |
| time             | TIME          | NOT NULL                                 | Time of the test slot                         |
| available        | BOOLEAN       | NOT NULL, DEFAULT TRUE                    | Indicates if the slot is available            |
| created_at       | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP       | Timestamp of slot creation                    |
| updated_at       | TIMESTAMP     | DEFAULT CURRENT_TIMESTAMP                 | Timestamp of last update                       |


**3. UserAlerts:**

| Column Name      | Data Type    | Constraints                               | Description                                   |
|-------------------|---------------|-------------------------------------------|-----------------------------------------------|
| alert_id         | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each alert              |
| user_id          | INTEGER       | NOT NULL, REFERENCES Users(user_id)       | User ID                                      |
| slot_id          | INTEGER       | NOT NULL, REFERENCES DrivingTestSlots(slot_id) | ID of the test slot                          |
| sent             | BOOLEAN       | NOT NULL, DEFAULT FALSE                   | Indicates if the alert has been sent          |
| created_at       | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP       | Timestamp of alert creation                   |


### System Tables

**1. AuditLogs:**

| Column Name      | Data Type    | Constraints                               | Description                                   |
|-------------------|---------------|-------------------------------------------|-----------------------------------------------|
| log_id           | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each log entry           |
| user_id          | INTEGER       | REFERENCES Users(user_id)                 | User ID who performed the action              |
| action           | VARCHAR(255) | NOT NULL                                 | Description of the action performed           |
| timestamp        | TIMESTAMP     | NOT NULL, DEFAULT CURRENT_TIMESTAMP       | Timestamp of the action                       |
| details          | TEXT          |                                           | Detailed information about the action          |


**2. SystemConfig:**

| Column Name      | Data Type    | Constraints                               | Description                                   |
|-------------------|---------------|-------------------------------------------|-----------------------------------------------|
| config_id        | SERIAL PRIMARY KEY | NOT NULL, UNIQUE                          | Unique identifier for each configuration entry |
| key              | VARCHAR(255) | NOT NULL, UNIQUE                          | Configuration key                            |
| value            | TEXT          |                                           | Configuration value                           |


## Relationships

- **One-to-many:** Users to UserPreferences, Users to UserAlerts, DVSA Test Centers to DrivingTestSlots.
- **Many-to-one:** UserAlerts to Users, UserAlerts to DrivingTestSlots, DrivingTestSlots to DVSA Test Centers.


## Data Types and Constraints

Data types and constraints are specified within each table definition above.  All primary keys are SERIAL and auto-incrementing.  Foreign keys enforce referential integrity.  Appropriate checks and validation rules are included to ensure data quality.


## Migrations

- **Initial schema creation:**  SQL scripts will be used to create all tables and relationships.
- **Version control strategy:**  Git will be used to manage schema migrations, with each migration represented as a separate SQL file.
- **Migration best practices:**  Atomic migrations, rollback capabilities, and thorough testing will be implemented.


## Performance Optimization

- **Index strategy:**  Indexes will be created on frequently queried columns (e.g., `user_id`, `center_id`, `available` in `DrivingTestSlots`).
- **Query optimization:**  Careful query design, including the use of appropriate joins and filtering, will be crucial.  Query profiling tools will be used to identify and address performance bottlenecks.
- **Partitioning considerations:**  Partitioning the `DrivingTestSlots` table by date or region might be necessary to improve query performance as the data volume grows.


## Security

- **Data encryption:**  Sensitive data (passwords, etc.) will be encrypted using strong, industry-standard algorithms.
- **Access control:**  Role-based access control (RBAC) will be implemented to restrict access to sensitive data based on user roles.
- **Backup and recovery:**  Regular backups and a robust recovery plan will be in place to protect against data loss.


## Example Queries

- **Common read operations:**  Retrieving user information, finding available test slots within a specified radius, getting alerts for a user.

- **Complex joins:**  Joining `Users`, `UserAlerts`, `DrivingTestSlots`, and `DVSA Test Centers` tables to retrieve comprehensive information about user alerts and associated test slots.

- **Performance-critical queries:**  Optimized queries for retrieving available slots within a specific radius, considering factors like date, time, and test type.  These queries will be carefully indexed and potentially partitioned for optimal performance.  Example:

```sql
SELECT
    dts.slot_id,
    dts.date,
    dts.time,
    dts.test_type,
    dtc.name,
    dtc.postcode,
    ST_Distance(ST_MakePoint(dtc.longitude, dtc.latitude), ST_MakePoint(:user_longitude, :user_latitude)) AS distance
FROM
    DrivingTestSlots dts
JOIN
    DVSA_Test_Centers dtc ON dts.center_id = dtc.center_id
WHERE
    dts.available = TRUE
    AND dts.test_type = :test_type
    AND dts.date >= :start_date
    AND dts.date <= :end_date
    AND ST_Distance(ST_MakePoint(dtc.longitude, dtc.latitude), ST_MakePoint(:user_longitude, :user_latitude)) <= :radius
ORDER BY
    dts.date, dts.time;
```
(This query uses PostGIS extension for geographic calculations.  Replace placeholders with actual values.)
