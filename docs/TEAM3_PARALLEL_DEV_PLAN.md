# תוכנית פיתוח מקבילית למצוות 3 - סימולציית מפה אשמורת (Team 3 Master Development Plan)

מסמך זה מגדיר את תוכנית העבודה המפורטת ל-4 מפתחים במקביל. התוכנית מבוססת עקרונית על מפרט המערכת (`ashmoret_simulation_spec.md`), תוך הפרדה מלאה בין הלוגיקה, תקשורת האלגוריתם, שכבת האירועים הוויזואליים, ה-Renderer של Leaflet, ורכיבי ה-UI.

---

## 🏛️ עקרונות ארכיטקטורה וחוזים מרכזיים (Core Architecture Contracts)

```text
       Scenario
          │
          ▼
   Simulation Engine (Dev 1)
          │
    Simulation Clock
          │
   WorldSnapshotBuilder (Dev 2) ──► Algorithm API (Dev 2)
          │                                │
          ▼                                ▼
 Logical Simulation State          Engagement Decision
          │                                │
          └────────────────┬───────────────┘
                           │
                           ▼
               VisualEventBuilder (Dev 3)
                           │
                 Visual Event Queue (Dev 3)
                           │
                   Leaflet Renderer (Dev 3)
                           │
                     UI Components (Dev 4)
```

1. **תלישות מ-Leaflet (UI Decoupling):** Leaflet אינו מקור האמת. שום State או לוגיקה אינם נשמרים ב-Marker.
2. **הפרדת מצב לוגי מוויזואלי (Logical vs Visual State):** קביעה אלגוריתמית מתעדכנת ב-Logical State מיד, אך התצוגה הפיזית מנוהלת דרך Visual Event Queue.
3. **סנכרון תדרים (Decoupled Loops):**
   - **UI Render Loop:** ~60 FPS (`requestAnimationFrame`).
   - **Simulation Logic Tick:** 10-20 Ticks/Sec.
   - **Algorithm API Tick:** 1 קריאה לכל שניית סימולציה.
4. **עבודה עם Sub-Branches:** כל מפתח פותח ענף מתוך `team3/dev-plan`.

---

## 🔀 אסטרטגיית ענפים (Branching Strategy)

- **בסיס (Base Branch):** `team3/dev-plan`
- **Developer 1 Branch:** `team3/dev1-simulation-engine`
- **Developer 2 Branch:** `team3/dev2-algorithm-api`
- **Developer 3 Branch:** `team3/dev3-visual-renderer`
- **Developer 4 Branch:** `team3/dev4-ui-controls`

---

## 📋 תוכנית עבודה ו-Checklist לפי מפתחים

---

### 👤 Developer 1: Engine, Clock & Simulation State (מנוע סימולציה, שעון וניהול State לוגי)

**תחום אחריות:**
ניהול שעון הסימולציה, עדכון מיקומי איומים ומיירטים בזמן לוגי, ניהול מכלול ה-`SimulationState`, חישובי מסלולים ופגיעות בשטח (Impacts).

#### משימות לביצוע:
- [ ] **1.1 הגדרת טיפוסים בסיסיים ו-State (`src/simulation/types.ts`)**
  - [ ] הגדרת `SimulationState`, `ThreatState`, `InterceptorState`, `DefenseSystemState`.
  - [ ] הגדרת סטטוסים לוגיים (`waiting`, `active`, `interceptPending`, `intercepted`, `impacted`).
- [ ] **1.2 מימוש שעון הסימולציה (`src/simulation/SimulationClock.ts`)**
  - [ ] חישוב `deltaTime` באמצעות `requestAnimationFrame`.
  - [ ] תמיכה ב-`speedMultiplier` (`x1`, `x2`, `x5`, `x10`).
  - [ ] מנגנון `play()`, `pause()`, `restart()`, `setSpeed()`.
- [ ] **1.3 מימוש מנוע איומים (`src/simulation/ThreatEngine.ts`)**
  - [ ] בדיקת איומים בסטטוס `waiting` והעברתם ל-`active` לפי `simulationTime`.
  - [ ] פונקציה דטרמיניסטית `calculatePositionAlongRoute(route, progress)`.
  - [ ] קידום `progress` ועדכון מיקום איומים פעילים בכל Tick.
- [ ] **1.4 מימוש מנוע מיירטים (`src/simulation/InterceptorEngine.ts`)**
  - [ ] קידום מיקום מיירטים פעילים לעבר ה-`interceptPoint`.
  - [ ] עדכון סטטוס מיירט (`flying` -> `success` / `miss` -> `finished`).
- [ ] **1.5 מימוש מנוע פגיעות בשטח (`src/simulation/ImpactEngine.ts`)**
  - [ ] זיהוי איומים שסיימו מסלול (`progress >= 1`) וטרם יורטו.
  - [ ] סיווג האיום ל-`impacted` ויצירת אירוע פגיעה.
- [ ] **1.6 מימוש המנוע המרכזי (`src/simulation/SimulationEngine.ts`)**
  - [ ] איחוד כל תהליך ה-`simulationTick()` (איומים, מיירטים, פגיעות, ניהול `tickId`).
  - [ ] מנגנון Event Emitter / Subscriptions לעדכון צרכנים על שינויי State.

---

### 👤 Developer 2: Algorithm API Client & World Snapshot (תקשורת אלגוריתם ו-Snapshot)

**תחום אחריות:**
בניית ה-Snapshot של מצב העולם, תקשורת אסינכרונית מול האלגוריתם, שמירה על עקביות (`tickId`), מניעת שיגורים כפולים, ומימוש Mock Server לצורכי פיתוח ובדיקות.

#### משימות לביצוע:
- [ ] **2.1 הגדרת חוזי תקשורת (`src/algorithm/types.ts`)**
  - [ ] הגדרת `WorldSnapshot`, `AlgorithmResponse`, `EngagementDecision`.
  - [ ] הגדרת מבנה ההודעות עבור `/simulation/step`.
- [ ] **2.2 מימוש בונה Snapshot (`src/algorithm/WorldSnapshotBuilder.ts`)**
  - [ ] חילוץ איומים פעילים בלבד מתוך `SimulationState`.
  - [ ] חילוץ מערכות הגנה ומלאי מיירטים זמין.
  - [ ] שמירת מידע על איומים שרודפים אחריהם כרגע (`activeEngagements` / `engagementStatus`) למניעת הקצאות כפולות.
- [ ] **2.3 מימוש לקוח API (`src/algorithm/AlgorithmClient.ts`)**
  - [ ] ביצוע קריאות `POST /simulation/step` בקצב מוגדר (1 לשניית סימולציה).
  - [ ] שיוך וניהול `tickId` לכל קריאה ותשובה.
  - [ ] סינון תשובות ישנות/לא מסונכרנות (`response.tickId < latestProcessedTick`).
  - [ ] טיפול בשגיאות תקשורת והתאוששות (Graceful fallback כשהאלגוריתם אינו זמין).
- [ ] **2.4 מימוש Mock Algorithm Server (`src/algorithm/mockServer.ts`)**
  - [ ] שירות סימולטיבי מקומי המקבל `WorldSnapshot` ומחזיר החלטות יירוט הגיוניות.
  - [ ] סימולציית אחוז הצלחה / כשל ביירוטים למבחני קצה.

---

### 👤 Developer 3: Visual Event Queue & Leaflet Renderer (שכבת אירועים ויזואליים ורנדר Leaflet)

**תחום אחריות:**
תרגום החלטות אלגוריתם לאירועים ויזואליים, חישוב נקודת הצטלבות ויזואלית (`interceptPoint`), ניהול תור האירועים הוויזואליים, ומימוש רכיב הרנדור הבלעדי ב-Leaflet ברמת 60 FPS.

#### משימות לביצוע:
- [ ] **3.1 הגדרת טיפוסים ויזואליים (`src/visual/types.ts`)**
  - [ ] הגדרת `VisualEvent`, `VisualStatus` (`pending`, `active`, `finished`).
  - [ ] סוגי אירועים: `launch`, `interception`, `impact`, `miss`.
- [ ] **3.2 מימוש בונה אירועים ויזואליים (`src/visual/VisualEventBuilder.ts`)**
  - [ ] קבלת `EngagementDecision` והפיכתו ל-`InterceptorState` + `VisualEvent`.
  - [ ] חישוב דטרמיניסטי לנקודת יירוט: `interceptPoint = getThreatPositionAtTime(simulationTime + 3s)`.
- [ ] **3.3 מימוש תור אירועים ויזואליים (`src/visual/VisualEventQueue.ts`)**
  - [ ] תור ממוין לפי `startTime` ו-`endTime`.
  - [ ] מנגנון עדכון וניקוי אירועים שסתיימו.
- [ ] **3.4 מימוש Leaflet Renderer המרכזי (`src/map/LeafletRenderer.ts`)**
  - [ ] אתחול מפה עם `preferCanvas: true` לביצועים גבוהים.
  - [ ] ניהול `Map<string, L.Marker>` עבור threats, interceptors, defense systems, impacts.
  - [ ] עדכון מיקומים בלבד (`marker.setLatLng()`) ללא יצירת/מחיקת Markers בכל Frame.
  - [ ] לולאת רנדור 60 FPS (`requestAnimationFrame`) הנפרדת מהלוגיקה.
- [ ] **3.5 מימוש שכבות ואייקונים (`src/map/icons.ts`, `src/map/*Layer.ts`)**
  - [ ] יצירת SVG Icons מותאמים לכל סוג יישות (איום 🔴, מיירט 🔵, סוללה 🟦, פיצוץ ✴, פגיעה 💥).
  - [ ] שכבות Polylines עבור מסלולי איומים ומיירטים (כולל toggle להצגה/הסתרה).

---

### 👤 Developer 4: UI Control Panel, Event Log & App Integration (ממשק משתמש, לוג אירועים ואינטגרציה)

**תחום אחריות:**
בניית סרגל הבקרה, הצגת סטיסטיקות בזמן אמת, Event Log כרונולוגי, מקרא מפה (Legend), וחיבור כל הרכיבים באפליקציית React.

#### משימות לביצוע:
- [ ] **4.1 מימוש סרגל בקרת סימולציה (`src/ui/SimulationControls.tsx`)**
  - [ ] כפתורי Play / Pause / Restart.
  - [ ] בחירת מהירות (`x1`, `x2`, `x5`, `x10`).
  - [ ] הצגת זמן סימולציה נוכחי בדיוק רב.
- [ ] **4.2 מימוש לוח סטטיסטיקות HUD (`src/ui/SimulationStats.tsx`)**
  - [ ] מונים בזמן אמת: איומים פעילים, מיירטים באוויר, יורטו בהצלחה, נפלו בשטח.
  - [ ] אינדיקטור סטטוס חיבור לאלגוריתם (Connected / Fallback).
- [ ] **4.3 מימוש יומן אירועים כרונולוגי (`src/ui/EventLog.tsx`)**
  - [ ] רשימת אירועים נגללת המציגה שיגורים, יירוטים ופגיעות לפי שעון הסימולציה.
  - [ ] סגנון ויזואלי מובחן לפי סוג האירוע.
- [ ] **4.4 מימוש מקרא מפה ותפריט הגדרות (`src/ui/MapLegend.tsx`)**
  - [ ] מקרא סמלים ברור ומפורט (סוגי עצמים וצבעים/צורות).
  - [ ] מתגי הצגה/הסתרה של מסלולים (Threat Routes, Interceptor Routes).
- [ ] **4.5 אינטגרציה מרכזית (`src/App.tsx`, `src/ui/MapView.tsx`)**
  - [ ] טעינת תרחיש ראשוני (`Scenario`) והזנתו למנוע.
  - [ ] חיבור עטיפת Leaflet React לרנדרר האימפרטיבי.
  - [ ] עיצוב Responsive ומודרני (Glassmorphism, Dark Theme).

---

## 🔗 שלבי אינטגרציה ומיזוג (Integration Plan)

1. **שלב 1 (Core Contracts Merge):**
   - מיזוג טיפוסי נתונים (`types.ts`) של כל 4 התחומים ל-`team3/dev-plan`.
2. **שלב 2 (Engine + Mock Algorithm):**
   - חיבור Dev 1 (Engine) עם Dev 2 (Algorithm Mock) ואימות זרימת Ticks וחישוב Snapshot.
3. **שלב 3 (Visual Events + Leaflet Render):**
   - חיבור Dev 3 (Renderer) ל-Engine ואימות תנועת עצמים ויירוטים על המפה ברמת 60 FPS.
4. **שלב 4 (UI Integration & Acceptance Testing):**
   - חיבור Dev 4 (UI) לכל השכבות, בדיקת מקשי Play/Pause/Restart/Speed, ואימות כל 20 קריטריוני הקבלה.
