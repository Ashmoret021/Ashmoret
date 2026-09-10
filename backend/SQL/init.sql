-- Enable UUID extension if needed in the future
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- Schema
-- ============================================================

CREATE SCHEMA IF NOT EXISTS scenario;

-- ============================================================
-- Drop existing tables
-- Drop in reverse dependency order
-- ============================================================

DROP TABLE IF EXISTS scenario.launcher_ammunition CASCADE;
DROP TABLE IF EXISTS scenario.launcher CASCADE;
DROP TABLE IF EXISTS scenario.drone CASCADE;
DROP TABLE IF EXISTS scenario.scenario CASCADE;
DROP TABLE IF EXISTS scenario.launchers_group CASCADE;
DROP TABLE IF EXISTS scenario.drones_group CASCADE;
DROP TABLE IF EXISTS scenario.interceptor_type CASCADE;
DROP TABLE IF EXISTS scenario.launcher_type CASCADE;
DROP TABLE IF EXISTS scenario.drone_type CASCADE;

-- ============================================================
-- 1. Static Reference Tables
-- ============================================================

CREATE TABLE scenario.drone_type (

    id SERIAL NOT NULL PRIMARY KEY,

    name VARCHAR(255) NOT NULL UNIQUE

);

CREATE TABLE scenario.launcher_type (

    id SERIAL NOT NULL PRIMARY KEY,

    name VARCHAR(255) NOT NULL UNIQUE,

    reload_time NUMERIC NOT NULL

);

CREATE TABLE scenario.interceptor_type (

    id SERIAL NOT NULL PRIMARY KEY,

    name VARCHAR(255) NOT NULL UNIQUE

);

-- ============================================================
-- 2. Group Tables
-- ============================================================

CREATE TABLE scenario.drones_group (

    id SERIAL NOT NULL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT

);

CREATE TABLE scenario.launchers_group (

    id SERIAL NOT NULL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    description TEXT

);

-- ============================================================
-- 3. Core Scenario Table
-- ============================================================

CREATE TABLE scenario.scenario (

    id SERIAL NOT NULL PRIMARY KEY,

    name VARCHAR(255) NOT NULL,

    drones_group_id INTEGER NOT NULL
        REFERENCES scenario.drones_group(id)
        ON DELETE RESTRICT,

    launchers_group_id INTEGER NOT NULL
        REFERENCES scenario.launchers_group(id)
        ON DELETE RESTRICT,

    type VARCHAR(50) NOT NULL

);

-- ============================================================
-- 4. Entity Tables
-- ============================================================

CREATE TABLE scenario.drone (

    id SERIAL NOT NULL PRIMARY KEY,

    drones_group_id INTEGER NOT NULL
        REFERENCES scenario.drones_group(id)
        ON DELETE CASCADE,

    longitude NUMERIC NOT NULL,

    latitude NUMERIC NOT NULL,

    asl NUMERIC NOT NULL,

    agl NUMERIC NOT NULL,

    heading NUMERIC NOT NULL,

    velocity NUMERIC NOT NULL,

    type INTEGER NOT NULL
        REFERENCES scenario.drone_type(id)
        ON DELETE RESTRICT

);

CREATE TABLE scenario.launcher (

    id SERIAL NOT NULL PRIMARY KEY,

    launchers_group_id INTEGER NOT NULL
        REFERENCES scenario.launchers_group(id)
        ON DELETE CASCADE,

    longitude NUMERIC NOT NULL,

    latitude NUMERIC NOT NULL,

    asl NUMERIC NOT NULL,

    agl NUMERIC NOT NULL,

    type INTEGER NOT NULL
        REFERENCES scenario.launcher_type(id)
        ON DELETE RESTRICT,

    amount INTEGER NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE

);

-- ============================================================
-- 5. Ammunition Junction Table
-- ============================================================

CREATE TABLE scenario.launcher_ammunition (

    launcher_id INTEGER NOT NULL
        REFERENCES scenario.launcher(id)
        ON DELETE CASCADE,

    interceptor_type_id INTEGER NOT NULL
        REFERENCES scenario.interceptor_type(id)
        ON DELETE RESTRICT,

    amount INTEGER NOT NULL,

    PRIMARY KEY (launcher_id, interceptor_type_id)

);
