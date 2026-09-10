-- init.sql
-- Creates all PostgreSQL tables for the Ashmoret system based on the TypeORM entities
-- in backend/src/Entities. Safe to re-run: each table is dropped (if it exists) before
-- being recreated.

CREATE SCHEMA IF NOT EXISTS scenario_management;
SET search_path TO scenario_management;

-- ==========================================================================
-- Lookup / reference tables
-- ==========================================================================

DROP TABLE IF EXISTS drone_type CASCADE;
CREATE TABLE drone_type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

DROP TABLE IF EXISTS interceptor_type CASCADE;
CREATE TABLE interceptor_type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE
);

DROP TABLE IF EXISTS launcher_type CASCADE;
CREATE TABLE launcher_type (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  reload_time DOUBLE PRECISION NOT NULL
);

-- ==========================================================================
-- Groups
-- ==========================================================================

DROP TABLE IF EXISTS drones_group CASCADE;
CREATE TABLE drones_group (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

DROP TABLE IF EXISTS launchers_group CASCADE;
CREATE TABLE launchers_group (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT
);

-- ==========================================================================
-- Scenario
-- ==========================================================================

DROP TABLE IF EXISTS scenario CASCADE;
CREATE TABLE scenario (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  drones_group_id INTEGER NOT NULL REFERENCES drones_group (id),
  launchers_group_id INTEGER NOT NULL REFERENCES launchers_group (id),
  type VARCHAR(255) NOT NULL
);

-- ==========================================================================
-- Drone
-- ==========================================================================

DROP TABLE IF EXISTS drone CASCADE;
CREATE TABLE drone (
  id SERIAL PRIMARY KEY,
  drones_group_id INTEGER NOT NULL REFERENCES drones_group (id),
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  asl DOUBLE PRECISION NOT NULL,
  agl DOUBLE PRECISION NOT NULL,
  heading DOUBLE PRECISION NOT NULL,
  velocity DOUBLE PRECISION NOT NULL,
  type INTEGER NOT NULL REFERENCES drone_type (id)
);

-- ==========================================================================
-- Launcher
-- ==========================================================================

DROP TABLE IF EXISTS launcher CASCADE;
CREATE TABLE launcher (
  id SERIAL PRIMARY KEY,
  launchers_group_id INTEGER NOT NULL REFERENCES launchers_group (id),
  longitude DOUBLE PRECISION NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  asl DOUBLE PRECISION NOT NULL,
  agl DOUBLE PRECISION NOT NULL,
  type INTEGER NOT NULL REFERENCES launcher_type (id),
  amount INTEGER NOT NULL,
  active BOOLEAN NOT NULL
);

-- ==========================================================================
-- Launcher ammunition (launcher <-> interceptor_type join table)
-- ==========================================================================

DROP TABLE IF EXISTS launcher_ammunition CASCADE;
CREATE TABLE launcher_ammunition (
  launcher_id INTEGER NOT NULL REFERENCES launcher (id),
  interceptor_type_id INTEGER NOT NULL REFERENCES interceptor_type (id),
  amount INTEGER NOT NULL,
  PRIMARY KEY (launcher_id, interceptor_type_id)
);
