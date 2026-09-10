-- ============================================================
-- ASHMORET - DEMO DATA
-- נתוני הדגמה
-- ============================================================

-- ============================================================
-- 1. STATIC REFERENCE TABLES
-- טבלאות עזר סטטיות
-- ============================================================

INSERT INTO scenario.drone_type (name)
VALUES
    ('רחפן מרובע'),
    ('רחפן כנף קבועה'),
    ('רחפן המראה ונחיתה אנכית'),
    ('רחפן תצפית');


INSERT INTO scenario.launcher_type (name, reload_time)
VALUES
    ('משגר קרקעי', 60),
    ('משגר נייד', 90),
    ('משגר כבד', 120);


INSERT INTO scenario.interceptor_type (name)
VALUES
    ('מיירט א'),
    ('מיירט ב'),
    ('מיירט ג'),
    ('מיירט ד');


-- ============================================================
-- 2. DRONE GROUPS
-- קבוצות רחפנים
-- ============================================================

INSERT INTO scenario.drones_group (name, description)
VALUES
    (
        'רחפני אלפא',
        'קבוצת הרחפנים הראשית עבור התרחיש הצפוני'
    ),
    (
        'רחפני בראבו',
        'קבוצת הרחפנים הראשית עבור התרחיש הדרומי'
    ),
    (
        'רחפני צ׳רלי',
        'קבוצת רחפני תצפית לטווח ארוך'
    ),
    (
        'רחפני אימון',
        'רחפנים המשמשים לתרחישי אימון ובדיקות'
    );


-- ============================================================
-- 3. LAUNCHER GROUPS
-- קבוצות משגרים
-- ============================================================

INSERT INTO scenario.launchers_group (name, description)
VALUES
    (
        'משגרי הצפון',
        'קבוצת משגרים הממוקמת באזור הצפוני'
    ),
    (
        'משגרי הדרום',
        'קבוצת משגרים הממוקמת באזור הדרומי'
    ),
    (
        'משגרי המרכז',
        'קבוצת משגרים הממוקמת באזור המרכזי'
    ),
    (
        'משגרי אימון',
        'משגרים המשמשים לתרחישי אימון ובדיקות'
    );


-- ============================================================
-- 4. SCENARIOS
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
        'הגנה צפונית',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'רחפני אלפא'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'משגרי הצפון'),
        'יחיד'
    ),
    (
        'הגנה דרומית',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'רחפני בראבו'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'משגרי הדרום'),
        'רב-מערכתי'
    ),
    (
        'תצפית מרכזית',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'רחפני צ׳רלי'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'משגרי המרכז'),
        'יחיד'
    ),
    (
        'תרגיל אימון',
        (SELECT id
         FROM scenario.drones_group
         WHERE name = 'רחפני אימון'),
        (SELECT id
         FROM scenario.launchers_group
         WHERE name = 'משגרי אימון'),
        'רב-מערכתי'
    );


-- ============================================================
-- 5. DRONES
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
         WHERE name = 'רחפני אלפא'),
        34.781800,
        32.085300,
        120,
        80,
        45,
        25,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן מרובע')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני אלפא'),
        34.790200,
        32.090100,
        150,
        100,
        90,
        30,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן מרובע')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני אלפא'),
        34.800500,
        32.095500,
        200,
        150,
        180,
        35,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן כנף קבועה')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני בראבו'),
        34.810000,
        31.950000,
        100,
        70,
        270,
        20,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן המראה ונחיתה אנכית')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני בראבו'),
        34.820000,
        31.960000,
        130,
        90,
        315,
        28,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן מרובע')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני צ׳רלי'),
        34.750000,
        32.000000,
        250,
        200,
        135,
        40,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן תצפית')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני צ׳רלי'),
        34.760000,
        32.010000,
        300,
        250,
        225,
        45,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן כנף קבועה')
    ),
    (
        (SELECT id FROM scenario.drones_group
         WHERE name = 'רחפני אימון'),
        34.770000,
        32.020000,
        80,
        50,
        0,
        15,
        (SELECT id FROM scenario.drone_type
         WHERE name = 'רחפן מרובע')
    );


-- ============================================================
-- 6. LAUNCHERS
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
         WHERE name = 'משגרי הצפון'),
        34.770000,
        32.070000,
        50,
        10,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר קרקעי'),
        4,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי הצפון'),
        34.775000,
        32.075000,
        55,
        12,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר נייד'),
        3,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי הדרום'),
        34.830000,
        31.940000,
        45,
        8,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר קרקעי'),
        5,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי הדרום'),
        34.835000,
        31.945000,
        60,
        15,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר כבד'),
        2,
        FALSE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי המרכז'),
        34.760000,
        32.030000,
        70,
        20,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר נייד'),
        4,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי המרכז'),
        34.765000,
        32.035000,
        75,
        25,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר קרקעי'),
        6,
        TRUE
    ),
    (
        (SELECT id FROM scenario.launchers_group
         WHERE name = 'משגרי אימון'),
        34.750000,
        32.010000,
        30,
        5,
        (SELECT id FROM scenario.launcher_type
         WHERE name = 'משגר נייד'),
        2,
        TRUE
    );


-- ============================================================
-- 7. LAUNCHER AMMUNITION
-- תחמושת משגרים
-- ============================================================

INSERT INTO scenario.launcher_ammunition (
    launcher_id,
    interceptor_type_id,
    amount
)
VALUES
    -- משגר צפוני 1
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הצפון'
              AND l.longitude = 34.770000
              AND l.latitude = 32.070000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט א'),
        10
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הצפון'
              AND l.longitude = 34.770000
              AND l.latitude = 32.070000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ב'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הצפון'
              AND l.longitude = 34.770000
              AND l.latitude = 32.070000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ג'),
        2
    ),

    -- משגר צפוני 2
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הצפון'
              AND l.longitude = 34.775000
              AND l.latitude = 32.075000
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
            WHERE lg.name = 'משגרי הצפון'
              AND l.longitude = 34.775000
              AND l.latitude = 32.075000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ב'),
        4
    ),

    -- משגר דרומי 1
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הדרום'
              AND l.longitude = 34.830000
              AND l.latitude = 31.940000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט א'),
        12
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הדרום'
              AND l.longitude = 34.830000
              AND l.latitude = 31.940000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ג'),
        6
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הדרום'
              AND l.longitude = 34.830000
              AND l.latitude = 31.940000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ד'),
        3
    ),

    -- משגר דרומי 2
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי הדרום'
              AND l.longitude = 34.835000
              AND l.latitude = 31.945000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ב'),
        10
    ),

    -- משגר מרכזי 1
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי המרכז'
              AND l.longitude = 34.760000
              AND l.latitude = 32.030000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט א'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי המרכז'
              AND l.longitude = 34.760000
              AND l.latitude = 32.030000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ב'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי המרכז'
              AND l.longitude = 34.760000
              AND l.latitude = 32.030000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ד'),
        2
    ),

    -- משגר מרכזי 2
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי המרכז'
              AND l.longitude = 34.765000
              AND l.latitude = 32.035000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט א'),
        15
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי המרכז'
              AND l.longitude = 34.765000
              AND l.latitude = 32.035000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ג'),
        5
    ),

    -- משגר אימון
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי אימון'
              AND l.longitude = 34.750000
              AND l.latitude = 32.010000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט א'),
        5
    ),
    (
        (
            SELECT l.id
            FROM scenario.launcher l
            JOIN scenario.launchers_group lg
                ON lg.id = l.launchers_group_id
            WHERE lg.name = 'משגרי אימון'
              AND l.longitude = 34.750000
              AND l.latitude = 32.010000
        ),
        (SELECT id FROM scenario.interceptor_type
         WHERE name = 'מיירט ב'),
        3
    );

