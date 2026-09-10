-- ============================================================
-- ASHMORET - TEST SCENARIOS
-- תרחישי בדיקה - להרצה על מסד נתונים קיים לאחר seed_base_data.sql
-- ============================================================
-- קובץ זה מוסיף 2 תרחישי בדיקה חדשים, כל אחד עם קבוצת רחפנים,
-- קבוצת משגרים, רחפנים, משגרים ותחמושת משלו.
-- הקובץ מניח שטבלאות העזר הסטטיות (drone_type, launcher_type,
-- interceptor_type) כבר מאוכלסות (למשל ע"י seed_base_data.sql).
-- ============================================================

-- ============================================================
-- 1. DRONE GROUPS
-- קבוצות רחפנים
-- ============================================================

INSERT INTO scenario.drones_group (name, description)
VALUES
    (
        'רחפני בדיקה - דלתא',
        'קבוצת רחפנים עבור תרחיש הבדיקה המזרחי'
    ),
    (
        'רחפני בדיקה - אקו',
        'קבוצת רחפנים עבור תרחיש הבדיקה המערבי'
    );

-- ============================================================
-- 2. LAUNCHER GROUPS
-- קבוצות משגרים
-- ============================================================

INSERT INTO scenario.launchers_group (name, description)
VALUES
    (
        'משגרי בדיקה - דלתא',
        'קבוצת משגרים עבור תרחיש הבדיקה המזרחי'
    ),
    (
        'משגרי בדיקה - אקו',
        'קבוצת משגרים עבור תרחיש הבדיקה המערבי'
    );

-- ============================================================
-- 3. SCENARIOS
-- תרחישים
-- ============================================================

INSERT INTO scenario.scenario (
    name,
    drones_group_id,
    launchers_group_id,
    type
)
VALUES
    (
        'תרחיש בדיקה - מזרח',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'רחפני בדיקה - דלתא'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'משגרי בדיקה - דלתא'),
        'יחיד'
    ),
    (
        'תרחיש בדיקה - מערב',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'רחפני בדיקה - אקו'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'משגרי בדיקה - אקו'),
        'רב-מערכתי'
    );

-- ============================================================
-- 4. DRONES
-- רחפנים
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
         WHERE name = 'רחפני בדיקה - דלתא'),
        34.900000,
        32.050000,
        140,
        90,
        60,
        22,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן מרובע')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני בדיקה - דלתא'),
        34.910000,
        32.055000,
        180,
        120,
        120,
        33,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן כנף קבועה')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני בדיקה - אקו'),
        34.650000,
        31.900000,
        110,
        60,
        300,
        18,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן המראה ונחיתה אנכית')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני בדיקה - אקו'),
        34.640000,
        31.895000,
        260,
        210,
        200,
        38,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן תצפית')
    );

-- ============================================================
-- 5. LAUNCHERS
-- משגרים
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
         WHERE name = 'משגרי בדיקה - דלתא'),
        34.895000,
        32.045000,
        50,
        10,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר קרקעי'),
        4,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי בדיקה - אקו'),
        34.645000,
        31.905000,
        65,
        18,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר נייד'),
        3,
        TRUE
    );

-- ============================================================
-- 6. LAUNCHER AMMUNITION
-- תחמושת משגרים
-- ============================================================

INSERT INTO scenario.launcher_ammunition (
    launcher_id,
    interceptor_type_id,
    amount
)
VALUES
    -- משגר בדיקה - דלתא
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי בדיקה - דלתא'
              AND l.longitude = 34.895000
              AND l.latitude = 32.045000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט א'),
        8
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי בדיקה - דלתא'
              AND l.longitude = 34.895000
              AND l.latitude = 32.045000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ג'),
        4
    ),
    -- משגר בדיקה - אקו
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי בדיקה - אקו'
              AND l.longitude = 34.645000
              AND l.latitude = 31.905000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ב'),
        6
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי בדיקה - אקו'
              AND l.longitude = 34.645000
              AND l.latitude = 31.905000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ד'),
        3
    );
