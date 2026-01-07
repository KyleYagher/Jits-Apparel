-- PostgreSQL Database Setup Script for Jits.API

-- Drop existing databases and user if they exist
DROP DATABASE IF EXISTS jitsdb;
DROP DATABASE IF EXISTS jitsdb_dev;
DROP USER IF EXISTS jitsapi;

-- Create user with password
CREATE USER jitsapi WITH PASSWORD 'S3rv3r01!';

-- Create databases with jitsapi as owner
CREATE DATABASE jitsdb OWNER jitsapi;
CREATE DATABASE jitsdb_dev OWNER jitsapi;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE jitsdb TO jitsapi;
GRANT ALL PRIVILEGES ON DATABASE jitsdb_dev TO jitsapi;

-- Connect to jitsdb and grant schema permissions
\c jitsdb
GRANT ALL ON SCHEMA public TO jitsapi;

-- Connect to jitsdb_dev and grant schema permissions
\c jitsdb_dev
GRANT ALL ON SCHEMA public TO jitsapi;
