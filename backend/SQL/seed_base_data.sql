-- seed_base_data.sql
-- Source: מידול מערכות עד חצות (1).xlsx
--   מידול רחפנים אדומים: B3:L7
--   מידול מערכות כחולות: B2:I10
--
-- Run AFTER the supplied init.sql, against the same PostgreSQL database:
--   psql -d ashmoret -v ON_ERROR_STOP=1 -f seed_base_data.sql
-- This file uses the scenario_management schema (matching init.sql / the app's
-- DataSource config). Change the search_path below if needed.
--
-- SCHEMA CHANGES INCLUDED:
--   Adds workbook attributes to the three type tables and creates two
--   type-level relationship tables. Update the corresponding TypeORM entities.
--   In particular, launcher_type.reload_time becomes nullable because the
--   workbook provides no reload times. Existing reload times are preserved.
--   Do not use TypeORM synchronize to revert these additions or nullability.
--
-- IMPORT RULES:
--   4 drone types, 4 launcher types, 8 interceptor types, 8 ammunition mappings,
--   and 14 supplied success-rate entries. All names come from the workbook.
--   Names resolve database-generated IDs; no hard-coded foreign-key IDs.
--   Re-runs update the supplied catalog values without duplicating records.
--   Unrelated records and existing scenario/instance data are preserved.
--   No DROP or TRUNCATE. Re-running init.sql itself WILL delete existing data.
--
--   Repeated system quantities belong to the same launcher model: 28 systems
--   in the workbook, not 56. Inventory figures are saved as source estimates.
--   No drone, launcher, group, scenario, or launcher_ammunition rows are created:
--   positions, ASL/AGL, headings, group assignments, active states, and the
--   intended meaning of launcher.amount are not supplied in the workbook.
--   drone_type.flight_speed_kmh is a model value, not drone.velocity.
--
-- UNITS:
--   Costs are ILS, as shown by the workbook's shekel number formats.
--   The estimated-damage column has no stated unit; no currency is assumed.
--   Distances remain km; model speeds remain km/h; rates remain percentages
--   (72.00 means 72%, not 0.72). Unlisted pairings remain absent, not 0%.
--   Operating range and rates stay attached to each launcher/interceptor pair,
--   matching the source rows rather than inferring model-wide values.

BEGIN;
SET LOCAL search_path = scenario_management, pg_catalog;
SET LOCAL standard_conforming_strings = on;

DO $preflight$
BEGIN
    IF to_regclass('drone_type') IS NULL
       OR to_regclass('launcher_type') IS NULL
       OR to_regclass('interceptor_type') IS NULL THEN
        RAISE EXCEPTION 'Required type tables are missing. Run init.sql first.';
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
COMMENT ON COLUMN launcher_type.source_system_quantity IS
    'System quantity in the source workbook, counted once per launcher model. Not a count of launcher table rows.';
COMMENT ON COLUMN drone_type.estimated_damage IS
    'Source workbook value. Its unit is not specified.';
COMMENT ON COLUMN drone_type.flight_speed_kmh IS
    'Model flight speed in km/h. The unit of drone.velocity is not defined by init.sql.';

-- 2. Stage the exact source records for this transaction.
--    Temporary tables are removed automatically at COMMIT or ROLLBACK.

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

-- 3. Check source quantities, then upsert the type records.

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
WHERE true
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
WHERE true
ON CONFLICT (name) DO UPDATE SET
    unit_cost_ils = EXCLUDED.unit_cost_ils;

-- NULL means "not supplied", not zero. Keep any existing reload_time value.
INSERT INTO launcher_type (name, reload_time, source_system_quantity)
SELECT name, NULL::DOUBLE PRECISION, source_system_quantity
FROM _ashmoret_seed_launcher
WHERE true
ON CONFLICT (name) DO UPDATE SET
    source_system_quantity = EXCLUDED.source_system_quantity;

-- 4. Resolve IDs by name and create the model-level relationships.
--    Check affected counts so a failed lookup cannot silently drop a source row.

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
    WHERE true
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
    WHERE true
    ON CONFLICT (launcher_type_id, interceptor_type_id, drone_type_id) DO UPDATE SET
        success_rate_percent = EXCLUDED.success_rate_percent;

    GET DIAGNOSTICS affected = ROW_COUNT;
    IF affected <> (SELECT COUNT(*) FROM _ashmoret_seed_rate) THEN
        RAISE EXCEPTION 'Could not resolve every source success-rate relationship.';
    END IF;
END;
$relationships$;

-- 5. Import summary. These counts describe catalog records, not instances.
SELECT
    (SELECT COUNT(*) FROM drone_type d JOIN _ashmoret_seed_drone s USING (name)) AS drone_types,
    (SELECT COUNT(*) FROM launcher_type l JOIN _ashmoret_seed_launcher s USING (name)) AS launcher_types,
    (SELECT COUNT(*) FROM interceptor_type i JOIN _ashmoret_seed_interceptor s USING (name)) AS interceptor_types,
    (SELECT COUNT(*) FROM _ashmoret_seed_ammunition) AS ammunition_mappings,
    (SELECT COUNT(*) FROM _ashmoret_seed_rate) AS supplied_success_rates,
    (SELECT SUM(source_estimated_attack_quantity) FROM _ashmoret_seed_drone) AS source_estimated_drones,
    (SELECT SUM(source_system_quantity) FROM _ashmoret_seed_launcher) AS source_systems,
    (SELECT SUM(source_total_ammunition) FROM _ashmoret_seed_ammunition) AS source_interceptors;
-- Expected: 4, 4, 8, 8, 14, 4570, 28, 1142.

COMMIT;

-- Instance relationships are already defined by init.sql:
--   drone.type -> drone_type.id
--   drone.drones_group_id -> drones_group.id
--   launcher.type -> launcher_type.id
--   launcher.launchers_group_id -> launchers_group.id
--   launcher_ammunition.launcher_id -> launcher.id
--   launcher_ammunition.interceptor_type_id -> interceptor_type.id
--   scenario.drones_group_id / launchers_group_id -> the respective groups.
-- A launcher_type ID must never be used as launcher_ammunition.launcher_id.
-- Populate actual launcher ammunition only once the corresponding launcher
-- instances and their intended quantities are defined.
