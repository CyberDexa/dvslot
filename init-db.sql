-- Create database if it doesn't exist
SELECT 'CREATE DATABASE dvslot_dev' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'dvslot_dev');

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE dvslot_dev TO dvslot_user;
