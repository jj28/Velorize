-- Velorize Database Initialization Script
-- This script will run when PostgreSQL container starts

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search

-- Create a schema for application data (optional)
-- CREATE SCHEMA IF NOT EXISTS velorize;

-- Grant necessary permissions to the application user
GRANT ALL PRIVILEGES ON DATABASE velorize_db TO velorize;

-- Create a simple logging function for debugging
CREATE OR REPLACE FUNCTION log_action() RETURNS trigger AS $$
BEGIN
    -- This is a placeholder for future audit logging
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Display initialization completion message
DO $$
BEGIN
    RAISE NOTICE 'Velorize database initialized successfully!';
    RAISE NOTICE 'Database: velorize_db';
    RAISE NOTICE 'User: velorize';
    RAISE NOTICE 'Extensions: uuid-ossp, pg_trgm';
END $$;