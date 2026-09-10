-- ============================================================
-- ASHMORET - DEMO DATA
-- Data Manipulation Language (DML)
-- ============================================================
--
-- All SERIAL IDs are generated automatically by PostgreSQL.
-- No explicit IDs are supplied for SERIAL columns.
--
-- Foreign keys are resolved using subqueries against the
-- corresponding reference/group records.
-- ============================================================


-- ============================================================
-- 1. STATIC REFERENCE TABLES
-- ============================================================

INSERT INTO scenario.drone_type (name)
VALUES
    ('Quadcopter'),
    ('Fixed Wing'),
    ('VTOL'),
    ('Surveillance Drone');


INSERT INTO scenario.launcher_type (name, reload_time)
VALUES
    ('Surface Launcher', 60),
    ('Mobile Launcher', 90),
    ('Heavy Launcher', 120);


INSERT INTO scenario.interceptor_type (name)
VALUES
    ('Interceptor A'),
    ('Interceptor B'),
    ('Interceptor C'),
    ('Interceptor D');


-- ============================================================
-- 2. DRONE GROUPS
-- ============================================================

INSERT INTO scenario.drones_group (name, description)
VALUES
    (
        'Alpha Drones',
        'Primary drone group for the northern scenario'
    ),
    (
        'Bravo Drones',
        'Primary drone group for the southern scenario'
    ),
    (
        'Charlie Drones',
        'Long-range surveillance drone group'
    ),
    (
        'Training Drones',
        'Drones used for training and testing scenarios'
    );


-- ============================================================
-- 3. LAUNCHER GROUPS
-- ============================================================

INSERT INTO scenario.launchers_group (name, description)
VALUES
    (
        'Northern Launchers',
        'Launcher group positioned in the northern area'
    ),
    (
        'Southern Launchers',
        'Launcher group positioned in the southern area'
    ),
    (
        'Central Launchers',
        'Launcher group positioned in the central area'
    ),
    (
        'Training Launchers',
        'Launchers used for training and testing scenarios'
    );


-- ============================================================
-- 4. SCENARIOS
-- ============================================================

INSERT INTO scenario.scenario (
    id,
    name,
    drones_group_id,
    launchers_group_id,
    type
)
VALUES
    (
        'SCENARIO-001',
        'Northern Defense',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'Alpha Drones'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'Northern Launchers'),
        'Single'
    ),
    (
        'SCENARIO-002',
        'Southern Defense',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'Bravo Drones'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'Southern Launchers'),
        'Multi'
    ),
    (
        'SCENARIO-003',
        'Central Surveillance',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'Charlie Drones'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'Central Launchers'),
        'Single'
    ),
    (
        'SCENARIO-004',
        'Training Exercise',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'Training Drones'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'Training Launchers'),
        'Multi'
    );


-- ============================================================
-- 5. DRONES
-- ============================================================

INSERT INTO scenario.drone (
    drones_group_id,
    longitude,
    latitude,
    asl,
    agl,
    heading,
    velocity,
    type
)
VALUES
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Alpha Drones'),
        34.781800,
        32.085300,
        120,
        80,
        45,
        25,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Quadcopter')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Alpha Drones'),
        34.790200,
        32.090100,
        150,
        100,
        90,
        30,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Quadcopter')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Alpha Drones'),
        34.800500,
        32.095500,
        200,
        150,
        180,
        35,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Fixed Wing')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Bravo Drones'),
        34.810000,
        31.950000,
        100,
        70,
        270,
        20,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'VTOL')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Bravo Drones'),
        34.820000,
        31.960000,
        130,
        90,
        315,
        28,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Quadcopter')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Charlie Drones'),
        34.750000,
        32.000000,
        250,
        200,
        135,
        40,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Surveillance Drone')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Charlie Drones'),
        34.760000,
        32.010000,
        300,
        250,
        225,
        45,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Fixed Wing')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'Training Drones'),
        34.770000,
        32.020000,
        80,
        50,
        0,
        15,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'Quadcopter')
    );


-- ============================================================
-- 6. LAUNCHERS
-- ============================================================

INSERT INTO scenario.launcher (
    launchers_group_id,
    longitude,
    latitude,
    asl,
    agl,
    type,
    amount,
    active
)
VALUES
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Northern Launchers'),
        34.770000,
        32.070000,
        50,
        10,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Surface Launcher'),
        4,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Northern Launchers'),
        34.775000,
        32.075000,
        55,
        12,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Mobile Launcher'),
        3,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Southern Launchers'),
        34.830000,
        31.940000,
        45,
        8,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Surface Launcher'),
        5,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Southern Launchers'),
        34.835000,
        31.945000,
        60,
        15,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Heavy Launcher'),
        2,
        FALSE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Central Launchers'),
        34.760000,
        32.030000,
        70,
        20,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Mobile Launcher'),
        4,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Central Launchers'),
        34.765000,
        32.035000,
        75,
        25,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Surface Launcher'),
        6,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'Training Launchers'),
        34.750000,
        32.010000,
        30,
        5,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'Mobile Launcher'),
        2,
        TRUE
    );


-- ============================================================
-- 7. LAUNCHER AMMUNITION
-- ============================================================
--
-- Launcher IDs are generated automatically, so they are
-- resolved using the launcher's unique position/group.
-- ============================================================

INSERT INTO scenario.launcher_ammunition (
    launcher_id,
    interceptor_type_id,
    amount
)
VALUES
    -- Northern Launcher 1
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Northern Launchers'
              AND l.longitude = 34.770000
              AND l.latitude = 32.070000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor A'),
        10
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Northern Launchers'
              AND l.longitude = 34.770000
              AND l.latitude = 32.070000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor B'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Northern Launchers'
              AND l.longitude = 34.770000
              AND l.latitude = 32.070000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor C'),
        2
    ),

    -- Northern Launcher 2
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Northern Launchers'
              AND l.longitude = 34.775000
              AND l.latitude = 32.075000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor A'),
        8
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Northern Launchers'
              AND l.longitude = 34.775000
              AND l.latitude = 32.075000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor B'),
        4
    ),

    -- Southern Launcher 1
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Southern Launchers'
              AND l.longitude = 34.830000
              AND l.latitude = 31.940000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor A'),
        12
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Southern Launchers'
              AND l.longitude = 34.830000
              AND l.latitude = 31.940000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor C'),
        6
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Southern Launchers'
              AND l.longitude = 34.830000
              AND l.latitude = 31.940000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor D'),
        3
    ),

    -- Southern Launcher 2
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Southern Launchers'
              AND l.longitude = 34.835000
              AND l.latitude = 31.945000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor B'),
        10
    ),

    -- Central Launcher 1
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Central Launchers'
              AND l.longitude = 34.760000
              AND l.latitude = 32.030000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor A'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Central Launchers'
              AND l.longitude = 34.760000
              AND l.latitude = 32.030000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor B'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Central Launchers'
              AND l.longitude = 34.760000
              AND l.latitude = 32.030000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor D'),
        2
    ),

    -- Central Launcher 2
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Central Launchers'
              AND l.longitude = 34.765000
              AND l.latitude = 32.035000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor A'),
        15
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Central Launchers'
              AND l.longitude = 34.765000
              AND l.latitude = 32.035000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor C'),
        5
    ),

    -- Training Launcher
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Training Launchers'
              AND l.longitude = 34.750000
              AND l.latitude = 32.010000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor A'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'Training Launchers'
              AND l.longitude = 34.750000
              AND l.latitude = 32.010000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'Interceptor B'),
        3
    );

