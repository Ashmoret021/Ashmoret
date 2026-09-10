-- seed_base_data.sql
-- Source: מידול מערכות עד חצות (1).xlsx
--   מידול רחפנים אדומים: B3:L7
--   מידול מערכות כחולות: B2:I10
--
-- Run AFTER the supplied init.sql, against the same PostgreSQL database:
--    psql -d ashmoret -v ON_ERROR_STOP=1 -f seed_base_data.sql
-- This file uses the scenario_management schema (matching init.sql / the app's
-- DataSource config). Change the search_path below if needed.
--
-- SCHEMA CHANGES INCLUDED:
--    Adds workbook attributes to the three type tables and creates two
--    type-level relationship tables. Update the corresponding TypeORM entities.
--    In particular, launcher_type.reload_time becomes nullable because the
--    workbook provides no reload times. Existing reload times are preserved.
--    Do not use TypeORM synchronize to revert these additions or nullability.

BEGIN;
SET LOCAL search_path = scenario_management, pg_catalog;
SET LOCAL standard_conforming_strings = on;

DO $preflight$
BEGIN
    IF to_regclass('drone_type') IS NULL
       OR to_regclass('launcher_type') IS NULL
       OR to_regclass('interceptor_type') IS NULL
       OR to_regclass('drones_group') IS NULL
       OR to_regclass('launchers_group') IS NULL
       OR to_regclass('scenario') IS NULL
       OR to_regclass('drone') IS NULL
       OR to_regclass('launcher') IS NULL
       OR to_regclass('launcher_ammunition') IS NULL THEN
         RAISE EXCEPTION 'Required schema tables are missing. Run init.sql first.';
    END IF;
END;
$preflight$;

-- 1. Extend the base catalog to hold the workbook data.

ALTER TABLE drone_type
    ADD COLUMN IF NOT EXISTS category VARCHAR(255),
    ADD COLUMN IF NOT EXISTS source_estimated_attack_quantity INTEGER,
    ADD COLUMN IF NOT EXISTS unit_cost_ils NUMERIC(18,2),
    ADD COLUMN IF NOT EXISTS source_total_cost_ils NUMERIC(18,2),
    ADD COLUMN IF NOT EXISTS threat_description TEXT,
    ADD COLUMN IF NOT EXISTS flight_range_km DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS estimated_damage NUMERIC(18,2),
    ADD COLUMN IF NOT EXISTS flight_speed_kmh DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS source_estimate_lebanon INTEGER,
    ADD COLUMN IF NOT EXISTS source_estimate_gaza INTEGER;

ALTER TABLE interceptor_type
    ADD COLUMN IF NOT EXISTS unit_cost_ils NUMERIC(18,2);

ALTER TABLE launcher_type
    ALTER COLUMN reload_time DROP NOT NULL,
    ADD COLUMN IF NOT EXISTS source_system_quantity INTEGER;

CREATE TABLE IF NOT EXISTS launcher_type_ammunition (
    launcher_type_id INTEGER NOT NULL REFERENCES launcher_type(id),
    interceptor_type_id INTEGER NOT NULL REFERENCES interceptor_type(id),
    ammunition_per_system INTEGER NOT NULL CHECK (ammunition_per_system >= 0),
    source_total_ammunition INTEGER NOT NULL CHECK (source_total_ammunition >= 0),
    operating_range_km DOUBLE PRECISION NOT NULL CHECK (operating_range_km >= 0),
    PRIMARY KEY (launcher_type_id, interceptor_type_id)
);

CREATE TABLE IF NOT EXISTS launcher_type_interception_rate (
    launcher_type_id INTEGER NOT NULL,
    interceptor_type_id INTEGER NOT NULL,
    drone_type_id INTEGER NOT NULL REFERENCES drone_type(id),
    success_rate_percent NUMERIC(5,2) NOT NULL
        CHECK (success_rate_percent BETWEEN 0 AND 100),
    PRIMARY KEY (launcher_type_id, interceptor_type_id, drone_type_id),
    FOREIGN KEY (launcher_type_id, interceptor_type_id)
        REFERENCES launcher_type_ammunition(launcher_type_id, interceptor_type_id)
);

COMMENT ON TABLE launcher_type_ammunition IS
    'Workbook model-level ammunition load and operating range. Actual launcher inventory remains in launcher_ammunition.';
COMMENT ON TABLE launcher_type_interception_rate IS
    'Only workbook-supplied percentages for each launcher/interceptor/drone combination. Missing entries mean unspecified.';

-- 2. Stage the exact source records for catalog types.

CREATE TEMP TABLE _ashmoret_seed_drone (
    name VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    source_estimated_attack_quantity INTEGER NOT NULL,
    unit_cost_ils NUMERIC(18,2) NOT NULL,
    source_total_cost_ils NUMERIC(18,2) NOT NULL,
    threat_description TEXT NOT NULL,
    flight_range_km DOUBLE PRECISION NOT NULL,
    estimated_damage NUMERIC(18,2) NOT NULL,
    flight_speed_kmh DOUBLE PRECISION NOT NULL,
    source_estimate_lebanon INTEGER NOT NULL,
    source_estimate_gaza INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ashmoret_seed_drone (name, category, source_estimated_attack_quantity, unit_cost_ils, source_total_cost_ils, threat_description, flight_range_km, estimated_damage, flight_speed_kmh, source_estimate_lebanon, source_estimate_gaza)
VALUES
    ('SkyMite-C7', 'רחפן מסחרי קל', 1200, 2500, 3000000, 'הצפה כמותית, חתימה נמוכה, מתאים לשחיקת קשב וגלאים.', 15.0, 350000, 60.0, 800, 400),
    ('LoadBee-M2', 'רחפן נשיאת מטען קל', 650, 8000, 5200000, 'נשיאת מטען מוגבל, איום נקודתי על אתרים רגישים.', 15.0, 1000000, 60.0, 500, 150),
    ('Falcon-Long X4', 'רחפן ארוך־טווח מאולתר', 320, 18000, 5760000, 'חדירה מעומק, דורש גילוי מוקדם ותעדוף מיירטים יקרים.', 50.0, 2000000, 60.0, 200, 120),
    ('NanoSwarm-Q9', 'נחיל רחפנים זעירים', 2400, 900, 2160000, 'איום רווי וזול, מיועד לשחיקת מלאי וליצירת ריבוי מטרות.', 25.0, 150000, 60.0, 1000, 1400);

CREATE TEMP TABLE _ashmoret_seed_launcher (
    name VARCHAR(255) NOT NULL,
    source_system_quantity INTEGER NOT NULL
) ON COMMIT DROP;

INSERT INTO _ashmoret_seed_launcher (name, source_system_quantity)
VALUES
    ('ShieldNest-Lite', 8),
    ('IronHook-SR', 6),
    ('HorizonEye-MX', 4),
    ('CloudFence-Area', 10);

CREATE TEMP TABLE _ashmoret_seed_interceptor (
    name VARCHAR(255) NOT NULL,
    unit_cost_ils NUMERIC(18,2) NOT NULL
) ON COMMIT DROP;

INSERT INTO _ashmoret_seed_interceptor (name, unit_cost_ils)
VALUES
    ('BuzzStop-15', 15000),
    ('NetWing-30', 22000),
    ('DartFox-S', 45000),
    ('SpearMini-70', 68000),
    ('SkyLance-M', 120000),
    ('FalconClip-H', 180000),
    ('SwarmMist-5', 7500),
    ('MicroNet-R', 18000);

CREATE TEMP TABLE _ashmoret_seed_ammunition (
    launcher_name VARCHAR(255) NOT NULL,
    interceptor_name VARCHAR(255) NOT NULL,
    ammunition_per_system INTEGER NOT NULL,
    source_total_ammunition INTEGER NOT NULL,
    operating_range_km DOUBLE PRECISION NOT NULL
) ON COMMIT DROP;

INSERT INTO _ashmoret_seed_ammunition (launcher_name, interceptor_name, ammunition_per_system, source_total_ammunition, operating_range_km)
VALUES
    ('ShieldNest-Lite', 'BuzzStop-15', 24, 192, 10.0),
    ('ShieldNest-Lite', 'NetWing-30', 16, 128, 10.0),
    ('IronHook-SR', 'DartFox-S', 15, 90, 30.0),
    ('IronHook-SR', 'SpearMini-70', 10, 60, 30.0),
    ('HorizonEye-MX', 'SkyLance-M', 12, 48, 50.0),
    ('HorizonEye-MX', 'FalconClip-H', 6, 24, 70.0),
    ('CloudFence-Area', 'SwarmMist-5', 45, 450, 5.0),
    ('CloudFence-Area', 'MicroNet-R', 15, 150, 7.0);

CREATE TEMP TABLE _ashmoret_seed_rate (
    launcher_name VARCHAR(255) NOT NULL,
    interceptor_name VARCHAR(255) NOT NULL,
    drone_name VARCHAR(255) NOT NULL,
    success_rate_percent NUMERIC(5,2) NOT NULL
) ON COMMIT DROP;

INSERT INTO _ashmoret_seed_rate (launcher_name, interceptor_name, drone_name, success_rate_percent)
VALUES
    ('ShieldNest-Lite', 'BuzzStop-15', 'SkyMite-C7', 72.0),
    ('ShieldNest-Lite', 'BuzzStop-15', 'NanoSwarm-Q9', 38.0),
    ('ShieldNest-Lite', 'NetWing-30', 'SkyMite-C7', 81.0),
    ('ShieldNest-Lite', 'NetWing-30', 'LoadBee-M2', 64.0),
    ('IronHook-SR', 'DartFox-S', 'LoadBee-M2', 77.0),
    ('IronHook-SR', 'DartFox-S', 'SkyMite-C7', 69.0),
    ('IronHook-SR', 'SpearMini-70', 'LoadBee-M2', 84.0),
    ('IronHook-SR', 'SpearMini-70', 'Falcon-Long X4', 58.0),
    ('HorizonEye-MX', 'SkyLance-M', 'Falcon-Long X4', 74.0),
    ('HorizonEye-MX', 'FalconClip-H', 'Falcon-Long X4', 86.0),
    ('HorizonEye-MX', 'FalconClip-H', 'LoadBee-M2', 79.0),
    ('CloudFence-Area', 'SwarmMist-5', 'NanoSwarm-Q9', 55.0),
    ('CloudFence-Area', 'MicroNet-R', 'NanoSwarm-Q9', 68.0),
    ('CloudFence-Area', 'MicroNet-R', 'SkyMite-C7', 73.0);

-- 3. Check source quantities, then upsert catalog records.

DO $source_checks$
BEGIN
    IF EXISTS (
        SELECT 1 FROM _ashmoret_seed_drone
        WHERE source_estimated_attack_quantity <> source_estimate_lebanon + source_estimate_gaza
           OR source_total_cost_ils <> unit_cost_ils * source_estimated_attack_quantity
    ) THEN
        RAISE EXCEPTION 'Drone source quantities or costs do not reconcile.';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM _ashmoret_seed_ammunition AS a
        LEFT JOIN _ashmoret_seed_launcher AS l ON l.name = a.launcher_name
        WHERE l.name IS NULL
           OR a.source_total_ammunition <> a.ammunition_per_system * l.source_system_quantity
    ) THEN
        RAISE EXCEPTION 'Launcher source quantities do not reconcile.';
    END IF;
END;
$source_checks$;

INSERT INTO drone_type (name, category, source_estimated_attack_quantity, unit_cost_ils, source_total_cost_ils, threat_description, flight_range_km, estimated_damage, flight_speed_kmh, source_estimate_lebanon, source_estimate_gaza)
SELECT name, category, source_estimated_attack_quantity, unit_cost_ils, source_total_cost_ils, threat_description, flight_range_km, estimated_damage, flight_speed_kmh, source_estimate_lebanon, source_estimate_gaza
FROM _ashmoret_seed_drone
ON CONFLICT (name) DO UPDATE SET
    category = EXCLUDED.category,
    source_estimated_attack_quantity = EXCLUDED.source_estimated_attack_quantity,
    unit_cost_ils = EXCLUDED.unit_cost_ils,
    source_total_cost_ils = EXCLUDED.source_total_cost_ils,
    threat_description = EXCLUDED.threat_description,
    flight_range_km = EXCLUDED.flight_range_km,
    estimated_damage = EXCLUDED.estimated_damage,
    flight_speed_kmh = EXCLUDED.flight_speed_kmh,
    source_estimate_lebanon = EXCLUDED.source_estimate_lebanon,
    source_estimate_gaza = EXCLUDED.source_estimate_gaza;

INSERT INTO interceptor_type (name, unit_cost_ils)
SELECT name, unit_cost_ils
FROM _ashmoret_seed_interceptor
ON CONFLICT (name) DO UPDATE SET
    unit_cost_ils = EXCLUDED.unit_cost_ils;

INSERT INTO launcher_type (name, reload_time, source_system_quantity)
SELECT name, NULL::DOUBLE PRECISION, source_system_quantity
FROM _ashmoret_seed_launcher
ON CONFLICT (name) DO UPDATE SET
    source_system_quantity = EXCLUDED.source_system_quantity;

-- 4. Create model-level type relationships.

DO $relationships$
DECLARE
    affected INTEGER;
BEGIN
    INSERT INTO launcher_type_ammunition (
        launcher_type_id, interceptor_type_id, ammunition_per_system,
        source_total_ammunition, operating_range_km
    )
    SELECT l.id, i.id, s.ammunition_per_system,
           s.source_total_ammunition, s.operating_range_km
    FROM _ashmoret_seed_ammunition AS s
    JOIN launcher_type AS l ON l.name = s.launcher_name
    JOIN interceptor_type AS i ON i.name = s.interceptor_name
    ON CONFLICT (launcher_type_id, interceptor_type_id) DO UPDATE SET
        ammunition_per_system = EXCLUDED.ammunition_per_system,
        source_total_ammunition = EXCLUDED.source_total_ammunition,
        operating_range_km = EXCLUDED.operating_range_km;

    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> (SELECT COUNT(*) FROM _ashmoret_seed_ammunition) THEN
        RAISE EXCEPTION 'Could not resolve every launcher/interceptor relationship.';
    END IF;

    INSERT INTO launcher_type_interception_rate (
        launcher_type_id, interceptor_type_id, drone_type_id, success_rate_percent
    )
    SELECT l.id, i.id, d.id, s.success_rate_percent
    FROM _ashmoret_seed_rate AS s
    JOIN launcher_type AS l ON l.name = s.launcher_name
    JOIN interceptor_type AS i ON i.name = s.interceptor_name
    JOIN drone_type AS d ON d.name = s.drone_name
    ON CONFLICT (launcher_type_id, interceptor_type_id, drone_type_id) DO UPDATE SET
        success_rate_percent = EXCLUDED.success_rate_percent;

    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> (SELECT COUNT(*) FROM _ashmoret_seed_rate) THEN
        RAISE EXCEPTION 'Could not resolve every source success-rate relationship.';
    END IF;
END;
$relationships$;

-- ==========================================================================
-- 5. Seed Instance Data (Groups, Scenarios, Drones, Launchers, Ammunition)
-- ==========================================================================

-- Seed Drone Groups
INSERT INTO drones_group (id, name, description) VALUES
    (1, 'Northern Sector Incursion Vector', 'Commercial and long-range threat profile in Northern sector'),
    (2, 'Southern Swarms Attack Force', 'High-density micro-drone swarm vectors in Southern sector')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description;

-- Seed Launcher Groups
INSERT INTO launchers_group (id, name, description) VALUES
    (1, 'Galilee Tiered Air Defense Grid', 'Integrated forward and mid-range interception network'),
    (2, 'Negev Area Defense Battery', 'Point and area defense deployment for high-value assets')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    description = EXCLUDED.description;

-- Reset sequence counters for auto-increment PKs
SELECT setval('drones_group_id_seq', (SELECT MAX(id) FROM drones_group));
SELECT setval('launchers_group_id_seq', (SELECT MAX(id) FROM launchers_group));

-- Seed Scenarios
INSERT INTO scenario (id, name, drones_group_id, launchers_group_id, type) VALUES
    ('SCN-NORTH-001', 'Northern Incursion & Multi-Tier Interception', 1, 1, 'AIR_DEFENSE_SIMULATION'),
    ('SCN-SOUTH-002', 'Southern High-Density Swarm Saturation', 2, 2, 'SWARM_MITIGATION')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    drones_group_id = EXCLUDED.drones_group_id,
    launchers_group_id = EXCLUDED.launchers_group_id,
    type = EXCLUDED.type;

-- Seed Drone Instances
INSERT INTO drone (drones_group_id, longitude, latitude, asl, agl, heading, velocity, type)
SELECT 1, 35.5123, 33.1200, 450.0, 150.0, 180.0, dt.flight_speed_kmh, dt.id FROM drone_type dt WHERE dt.name = 'SkyMite-C7'
UNION ALL
SELECT 1, 35.5150, 33.1220, 460.0, 160.0, 180.0, dt.flight_speed_kmh, dt.id FROM drone_type dt WHERE dt.name = 'SkyMite-C7'
UNION ALL
SELECT 1, 35.5200, 33.1300, 600.0, 300.0, 175.0, dt.flight_speed_kmh, dt.id FROM drone_type dt WHERE dt.name = 'LoadBee-M2'
UNION ALL
SELECT 1, 35.4950, 33.1500, 850.0, 550.0, 185.0, dt.flight_speed_kmh, dt.id FROM drone_type dt WHERE dt.name = 'Falcon-Long X4'
UNION ALL
SELECT 2, 34.7800, 31.2500, 250.0, 50.0, 45.0, dt.flight_speed_kmh, dt.id FROM drone_type dt WHERE dt.name = 'NanoSwarm-Q9'
UNION ALL
SELECT 2, 34.7820, 31.2510, 255.0, 55.0, 45.0, dt.flight_speed_kmh, dt.id FROM drone_type dt WHERE dt.name = 'NanoSwarm-Q9';

-- Seed Launcher Instances
INSERT INTO launcher (id, launchers_group_id, longitude, latitude, asl, agl, type, amount, active)
SELECT 1, 1, 35.5000, 33.0500, 300.0, 10.0, lt.id, 1, TRUE FROM launcher_type lt WHERE lt.name = 'ShieldNest-Lite'
UNION ALL
SELECT 2, 1, 35.5300, 33.0200, 320.0, 12.0, lt.id, 1, TRUE FROM launcher_type lt WHERE lt.name = 'IronHook-SR'
UNION ALL
SELECT 3, 1, 35.4800, 32.9800, 410.0, 15.0, lt.id, 1, TRUE FROM launcher_type lt WHERE lt.name = 'HorizonEye-MX'
UNION ALL
SELECT 4, 2, 34.8000, 31.2000, 180.0, 5.0, lt.id, 1, TRUE FROM launcher_type lt WHERE lt.name = 'CloudFence-Area'
ON CONFLICT (id) DO UPDATE SET
    launchers_group_id = EXCLUDED.launchers_group_id,
    longitude = EXCLUDED.longitude,
    latitude = EXCLUDED.latitude,
    asl = EXCLUDED.asl,
    agl = EXCLUDED.agl,
    type = EXCLUDED.type,
    amount = EXCLUDED.amount,
    active = EXCLUDED.active;

SELECT setval('launcher_id_seq', (SELECT MAX(id) FROM launcher));

-- Seed Active Launcher Ammunition Allocations
INSERT INTO launcher_ammunition (launcher_id, interceptor_type_id, amount)
SELECT 1, it.id, 24 FROM interceptor_type it WHERE it.name = 'BuzzStop-15'
UNION ALL
SELECT 1, it.id, 16 FROM interceptor_type it WHERE it.name = 'NetWing-30'
UNION ALL
SELECT 2, it.id, 15 FROM interceptor_type it WHERE it.name = 'DartFox-S'
UNION ALL
SELECT 2, it.id, 10 FROM interceptor_type it WHERE it.name = 'SpearMini-70'
UNION ALL
SELECT 3, it.id, 12 FROM interceptor_type it WHERE it.name = 'SkyLance-M'
UNION ALL
SELECT 3, it.id, 6  FROM interceptor_type it WHERE it.name = 'FalconClip-H'
UNION ALL
SELECT 4, it.id, 45 FROM interceptor_type it WHERE it.name = 'SwarmMist-5'
UNION ALL
SELECT 4, it.id, 15 FROM interceptor_type it WHERE it.name = 'MicroNet-R'
ON CONFLICT (launcher_id, interceptor_type_id) DO UPDATE SET
    amount = EXCLUDED.amount;

-- 6. Import summary including active entity records.
SELECT
    (SELECT COUNT(*) FROM drone_type) AS drone_types,
    (SELECT COUNT(*) FROM launcher_type) AS launcher_types,
    (SELECT COUNT(*) FROM interceptor_type) AS interceptor_types,
    (SELECT COUNT(*) FROM drones_group) AS drones_groups,
    (SELECT COUNT(*) FROM launchers_group) AS launchers_groups,
    (SELECT COUNT(*) FROM scenario) AS scenarios,
    (SELECT COUNT(*) FROM drone) AS active_drones,
    (SELECT COUNT(*) FROM launcher) AS active_launchers,
    (SELECT COUNT(*) FROM launcher_ammunition) AS active_ammunition_records;

COMMIT;