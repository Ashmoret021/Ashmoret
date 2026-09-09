# אפיון מערכת סימולציית מפה – אשמורת

## 1. מטרה

יש לממש רכיב סימולציה מבוסס מפה המציג בזמן אמת תרחיש של איומים אדומים ומערכות הגנה כחולות.

המפה ממומשת באמצעות **Leaflet**.

המערכת אינה מחליטה בעצמה אילו איומים ליירט. קיים שירות אלגוריתמי חיצוני שאליו נשלח מצב העולם בכל צעד סימולציה, והוא מחזיר החלטות כגון:

- איזו מערכת משגרת.
- איזה סוג מיירט משוגר.
- נגד איזה איום.
- תוצאת היירוט, אם זו כבר נקבעת בשירות.

מטרת רכיב הסימולציה היא:

1. לנהל את מצב העולם.
2. לקדם את כלל העצמים על מסלוליהם.
3. לשלוח בכל Tick את מצב העולם לשירות האלגוריתמי.
4. לקבל ממנו את החלטות הפעולה.
5. לתרגם את ההחלטות לאירועים ויזואליים.
6. להציג תנועה ריאליסטית מספיק על המפה:
   - שיגור איום.
   - תנועת איום.
   - שיגור מיירט.
   - תנועת המיירט.
   - הצטלבות בנקודת יירוט.
   - יירוט מוצלח או כושל.
   - המשך האיום במקרה של החטאה.
   - פגיעה בשטח כאשר איום מגיע לסוף מסלולו.
7. לאפשר Play / Pause / שינוי מהירות / Restart.

התרחיש עשוי לכלול כמות גדולה של איומים ומיירטים, ולכן המימוש חייב להיות יעיל ולא להיות תלוי ישירות במספר ה-Markers שעל המפה.

---

## 2. עיקרון ארכיטקטוני

יש לבצע הפרדה מלאה בין:

```text
Simulation Logic
```

לבין:

```text
Leaflet UI
```

Leaflet אינו מקור האמת של הסימולציה.

אין לשמור לוגיקה בתוך Marker, Polyline או Animation.

הארכיטקטורה תהיה:

```text
Scenario
   ↓
Simulation Engine
   ↓
Algorithm API
   ↓
Logical Simulation State
   ↓
Visual Event Builder
   ↓
Visual Event Queue
   ↓
Leaflet Renderer
```

---

## 3. שכבות המערכת

### 3.1 Scenario Layer

אחראית על טעינת נתוני התרחיש הראשוניים.

התרחיש יכלול לפחות:

```ts
interface Scenario {
  id: string;
  name: string;

  startTime: number;

  threats: ThreatDefinition[];
  defenseSystems: DefenseSystemDefinition[];
}
```

כל איום כולל:

```ts
interface ThreatDefinition {
  id: string;

  type: string;

  startTime: number;

  route: LatLng[];

  speed?: number;

  metadata?: Record<string, unknown>;
}
```

כל מערכת הגנה כוללת:

```ts
interface DefenseSystemDefinition {
  id: string;

  type: string;

  position: LatLng;

  interceptors: {
    type: string;
    quantity: number;
  }[];
}
```

---

## 4. Simulation State

יש לנהל State מרכזי אחד המהווה את מקור האמת.

```ts
interface SimulationState {
  simulationTime: number;

  status:
    | "idle"
    | "running"
    | "paused"
    | "finished";

  speedMultiplier: number;

  threats: Record<string, ThreatState>;

  defenseSystems: Record<string, DefenseSystemState>;

  interceptors: Record<string, InterceptorState>;

  visualEvents: VisualEvent[];
}
```

---

## 5. Threat State

```ts
interface ThreatState {
  id: string;

  type: string;

  status:
    | "waiting"
    | "active"
    | "interceptPending"
    | "intercepted"
    | "impacted";

  startTime: number;

  route: LatLng[];

  position: LatLng;

  progress: number;

  metadata?: Record<string, unknown>;
}
```

המשמעות:

### waiting

האיום קיים בתרחיש אך טרם הגיע זמן השיגור שלו.

### active

האיום נמצא באוויר ומתקדם במסלול.

### interceptPending

האלגוריתם כבר קבע שהאיום נמצא בתהליך יירוט, אך מבחינה ויזואלית אירוע היירוט עדיין לא הסתיים.

### intercepted

האיום יורט.

### impacted

האיום הגיע לנקודת הסיום שלו ופגע בשטח.

---

## 6. Simulation Clock

כל המערכת צריכה לעבוד לפי שעון סימולציה מרכזי.

לדוגמה:

```ts
simulationTime += realDeltaTime * speedMultiplier;
```

יש לתמוך לפחות במהירויות:

```text
x1
x2
x5
x10
```

רצוי לא לקשור את קצב הסימולציה ל-`setInterval` קבוע.

עדיף להשתמש ב:

```ts
requestAnimationFrame
```

ולחשב:

```ts
deltaTime
```

בכל Frame.

---

## 7. Tick לוגי

בנוסף ל-Render Frames, יש Tick לוגי.

לדוגמה:

```text
כל 1 שניית זמן סימולציה
```

או קצב configurable.

ה-Tick אחראי על:

```text
1. הפעלת איומים חדשים
2. קידום מיקום האיומים
3. עדכון מיירטים קיימים
4. בדיקת פגיעות
5. יצירת Snapshot של מצב העולם
6. שליחת המצב ל-Algorithm API
7. קבלת החלטות
8. יצירת אירועי יירוט חדשים
```

---

## 8. הפעלת איומים

בכל Tick יש לבדוק:

```ts
if (
  threat.status === "waiting" &&
  simulationTime >= threat.startTime
) {
  threat.status = "active";
}
```

כאשר איום הופך ל-`active`, Leaflet מתחיל להציג אותו.

---

## 9. קידום איום במסלול

לכל איום מוגדר מסלול:

```ts
route: LatLng[];
```

יש לחשב את המיקום שלו לפי:

```text
route
+
speed
+
simulationTime
```

אין להזיז Marker באופן עצמאי.

במקום זאת:

```ts
threat.position = calculatePositionAlongRoute(...);
```

ואחר כך ה-Renderer קורא את ה-State ומעדכן את ה-Marker.

---

## 10. Algorithm API

בכל Tick לוגי יש ליצור:

```ts
WorldSnapshot
```

לדוגמה:

```ts
interface WorldSnapshot {
  simulationTime: number;

  activeThreats: {
    id: string;
    type: string;
    position: LatLng;
    route: LatLng[];
    progress: number;
  }[];

  defenseSystems: {
    id: string;
    type: string;
    position: LatLng;

    interceptorInventory: {
      type: string;
      quantity: number;
    }[];
  }[];

  activeInterceptors: {
    id: string;
    type: string;
    targetId: string;
    position: LatLng;
  }[];
}
```

יש לשלוח:

```http
POST /simulation/step
```

לדוגמה:

```json
{
  "simulationTime": 120,
  "activeThreats": [],
  "defenseSystems": [],
  "activeInterceptors": []
}
```

---

## 11. תשובת השירות האלגוריתמי

השירות יחזיר החלטות.

לדוגמה:

```ts
interface AlgorithmResponse {
  engagements: EngagementDecision[];
}
```

```ts
interface EngagementDecision {
  defenseSystemId: string;

  interceptorType: string;

  targetId: string;

  result?: "success" | "failure";
}
```

דוגמה:

```json
{
  "engagements": [
    {
      "defenseSystemId": "blue-system-3",
      "interceptorType": "DartFox-S",
      "targetId": "red-42",
      "result": "success"
    }
  ]
}
```

---

## 12. טיפול בתשובת האלגוריתם

אין לבצע מיד:

```text
target.status = intercepted
```

ואין להסיר מיד את האיום מהמפה.

במקום זאת יש ליצור:

```text
Engagement
```

חדש.

---

## 13. Interceptor State

```ts
interface InterceptorState {
  id: string;

  type: string;

  sourceSystemId: string;

  targetId: string;

  status:
    | "flying"
    | "success"
    | "miss"
    | "finished";

  launchTime: number;

  position: LatLng;

  startPosition: LatLng;

  interceptPoint: LatLng;

  route: LatLng[];

  progress: number;

  outcome:
    | "success"
    | "failure";
}
```

---

## 14. Visual Event Builder

יש ליצור Service נפרד:

```ts
VisualEventBuilder
```

תפקידו להפוך החלטה אלגוריתמית לאירוע שניתן להציג.

קלט:

```text
EngagementDecision
+
SimulationState
```

פלט:

```text
InterceptorState
+
VisualEvent
```

---

## 15. חישוב נקודת יירוט

השירות האלגוריתמי אומר:

```text
מי מיירט את מי
```

אבל ה-UI צריך לדעת:

```text
איפה הם נפגשים
```

לכן יש לחשב:

```ts
interceptPoint
```

על בסיס:

```text
מיקום האיום
+
מסלול האיום
+
מיקום מערכת ההגנה
+
משך ויזואלי של אירוע היירוט
```

לגרסה הראשונה אין צורך בסימולציה בליסטית אמיתית.

יש להשתמש במודל UI פשוט ודטרמיניסטי.

לדוגמה:

```ts
visualInterceptDuration = 3 seconds
```

מחשבים היכן האיום יהיה בעוד 3 שניות סימולציה:

```ts
interceptPoint =
  getThreatPositionAtTime(
    threat,
    simulationTime + visualInterceptDuration
  );
```

המיירט נע:

```text
Defense System
       ↓
Intercept Point
```

ובמקביל האיום ממשיך:

```text
Current Position
       ↓
Intercept Point
```

---

## 16. Visual Event

```ts
interface VisualEvent {
  id: string;

  type:
    | "launch"
    | "interception"
    | "impact"
    | "miss";

  startTime: number;

  endTime?: number;

  targetId?: string;

  interceptorId?: string;

  position?: LatLng;

  status:
    | "pending"
    | "active"
    | "finished";
}
```

---

## 17. Visual Event Queue

יש להחזיק:

```ts
VisualEvent[]
```

שמתפקד כתור אירועים.

לדוגמה:

```ts
[
  {
    id: "event-1",
    type: "interception",
    startTime: 120,
    endTime: 123,
    targetId: "red-42",
    interceptorId: "blue-int-91"
  },

  {
    id: "event-2",
    type: "impact",
    startTime: 127,
    targetId: "red-51"
  }
]
```

Renderer קורא את האירועים לפי:

```ts
simulationTime
```

---

## 18. הפרדת Logical State ו-Visual State

זהו עיקרון חובה.

יכול להיות שהמערכת כבר יודעת לוגית שהאיום יורט, אך המשתמש עדיין רואה את אנימציית היירוט.

לדוגמה:

```ts
logicalState.red42.status = "intercepted";
```

במקביל:

```ts
visualState.red42.status = "interceptPending";
```

לאחר ההצטלבות:

```ts
visualState.red42.status = "intercepted";
```

אין לעכב את האלגוריתם רק כדי לחכות לאנימציה.

---

## 19. רצוי אפילו להפריד Status פנימי

במימוש עדיף להחזיק:

```ts
interface EntityState {
  logicalStatus: LogicalStatus;
  visualStatus: VisualStatus;
}
```

לדוגמה:

```ts
logicalStatus = "intercepted";
visualStatus = "flying_to_intercept";
```

כך אין ערבוב בין לוגיקת הסימולציה לבין UI.

---

## 20. תהליך יירוט מלא

לדוגמה:

```text
T = 120

Red-42 נמצא באוויר
        ↓
בניית WorldSnapshot
        ↓
POST /simulation/step
        ↓
Algorithm:
System-3 launches DartFox-S
against Red-42
        ↓
VisualEventBuilder
        ↓
חישוב interceptPoint
        ↓
יצירת Interceptor-91
        ↓
Leaflet מציג שיגור
        ↓
Red-42 ממשיך להתקדם
Interceptor-91 מתקדם
        ↓
שניהם מגיעים ל-interceptPoint
        ↓
תוצאת היירוט
```

אם הצליח:

```text
💥

Red → removed
Interceptor → removed

Impact animation
```

אם נכשל:

```text
Interceptor → removed

Red → ממשיך במסלול
```

---

## 21. פגיעה בשטח

אם איום מגיע לסוף המסלול:

```ts
threat.progress >= 1
```

ובתנאי שאינו יורט:

```ts
logicalStatus === "active"
```

יש ליצור:

```ts
ImpactEvent
```

לדוגמה:

```ts
{
  id: "impact-42",
  type: "impact",
  startTime: 144,
  targetId: "red-42",
  position: threat.position
}
```

ולעדכן:

```ts
logicalStatus = "impacted";
```

---

## 22. הצגת Impact ב-Leaflet

כאשר מגיע `ImpactEvent`:

1. הסרת האיום.
2. הצגת אפקט פגיעה.
3. הוספת Marker של נקודת פגיעה.
4. אופציונלי: Circle סביב נקודת הפגיעה.
5. האפקט הזמני נעלם לאחר מספר שניות.
6. Marker הפגיעה יכול להישאר עד סוף התרחיש.

---

## 23. Leaflet Renderer

יש לממש Service נפרד:

```text
LeafletRenderer
```

שאחראי אך ורק על התצוגה.

לדוגמה:

```ts
class LeafletRenderer {
  renderThreats(state);
  renderInterceptors(state);
  renderDefenseSystems(state);
  renderVisualEvents(events);
  removeInactiveEntities();
}
```

אסור ל-Renderer:

```text
להחליט על יירוט
להחליט על פגיעה
לעדכן מלאים
לשנות את מצב הסימולציה
לקרוא ל-Algorithm API
```

---

## 24. Markers

יש להחזיק Map בין ID ל-Marker:

```ts
const threatMarkers =
  new Map<string, L.Marker>();

const interceptorMarkers =
  new Map<string, L.Marker>();
```

כך אין ליצור Marker חדש בכל Frame.

עדכון:

```ts
marker.setLatLng(entity.position);
```

---

## 25. Routes

אפשר להציג:

```text
Threat Route
Interceptor Route
```

כ-Leaflet Polyline.

יש לאפשר הגדרה:

```ts
showThreatRoutes: boolean;
showInterceptorRoutes: boolean;
```

---

## 26. אנימציה

אין להשתמש באנימציה עצמאית לכל Marker.

כל Marker צריך לקבל את מיקומו מתוך:

```text
simulationTime
```

כך:

```text
Pause
Speed change
Restart
```

יעבדו בצורה תקינה.

---

## 27. Pause

כאשר המשתמש לוחץ Pause:

```ts
simulation.status = "paused";
```

יש לעצור:

```text
Simulation Clock
Logical Ticks
Visual Animations
```

מצב העולם נשאר כפי שהוא.

---

## 28. שינוי מהירות

שינוי מהירות צריך להשפיע על:

```text
Threat movement
Interceptor movement
Visual event timing
Simulation clock
```

לדוגמה:

```ts
speedMultiplier = 5;
```

לא לשנות פיזית את הנתונים עצמם אלא רק את קצב הזמן.

---

## 29. Restart

Restart צריך:

```text
1. לעצור Clock
2. למחוק Markers
3. למחוק Polylines
4. למחוק Visual Events
5. למחוק Interceptors
6. לאפס Simulation State
7. לטעון מחדש את Scenario
8. להחזיר Simulation Time לנקודת ההתחלה
```

---

## 30. מניעת כפילויות החלטות

ייתכן שב-Tick הבא האלגוריתם עדיין יראה איום שכבר הוקצה לו מיירט.

לכן WorldSnapshot צריך לכלול את מצב ההקצאות.

לדוגמה:

```ts
{
  threatId: "red-42",
  engagementStatus: "engaged"
}
```

או:

```ts
activeEngagements
```

כדי למנוע שיגור לא רצוי נוסף.

גם בצד הלקוח יש לבצע בדיקה:

```ts
if (
  existingEngagementForTarget(targetId)
) {
  // ignore duplicate decision
}
```

אלא אם האלגוריתם תומך במכוון במספר מיירטים על אותה מטרה.

---

## 31. טיפול בתשובת API אסינכרונית

אסור שיהיו מספר Ticks אלגוריתמיים לא מסונכרנים שיכולים לעדכן את אותו State בסדר לא נכון.

יש לשמור:

```ts
tickId
```

לדוגמה:

```json
{
  "tickId": 57,
  "simulationTime": 120
}
```

והשירות מחזיר:

```json
{
  "tickId": 57,
  "engagements": []
}
```

יש להתעלם מתגובה ישנה אם:

```ts
response.tickId < latestProcessedTick
```

---

## 32. כשל API

אם השירות האלגוריתמי אינו זמין:

אין לקרוס.

אפשר להגדיר:

```text
Simulation continues without new engagement decisions
```

ולהציג:

```text
Algorithm unavailable
```

ב-UI.

כאשר החיבור חוזר, ממשיכים מה-Tick הבא.

---

## 33. UI Control Panel

יש להציג לפחות:

```text
Play / Pause

Restart

Speed:
x1
x2
x5
x10

Simulation Time

Active Threats

Active Interceptors

Intercepted

Impacted
```

---

## 34. מקרא מפה

נדרש Legend ברור:

```text
🔴 Threat

🔵 Interceptor

🟦 Defense System

✴ Interception

💥 Impact
```

לא להסתמך רק על צבע.

יש להשתמש גם באייקון/צורה שונה.

---

## 35. Event Log

רצוי להוסיף Event Log בצד המפה.

לדוגמה:

```text
20:03:12
SkyMite-C7 launched

20:03:17
DartFox-S launched → SkyMite-C7 #42

20:03:20
Threat #42 intercepted

20:03:26
Threat #51 impacted
```

ה-Event Log מבוסס על אותם:

```text
Simulation Events
```

ולא על Leaflet events.

---

## 36. ביצועים

התרחיש עשוי לכלול אלפי עצמים, ולכן:

אין לבצע:

```text
React state update לכל Marker בכל frame
```

ואין ליצור/למחוק Marker מחדש בכל Frame.

יש לבצע:

```text
State מרכזי
+
Renderer imperative
+
setLatLng
```

ולשקול שימוש ב:

```text
Canvas renderer
```

של Leaflet עבור מספר גדול של עצמים.

לדוגמה:

```ts
L.map(..., {
  preferCanvas: true
});
```

---

## 37. קצב Render לעומת קצב Algorithm

יש להפריד ביניהם.

לדוגמה:

```text
UI Render:
~60 FPS

Simulation calculations:
10-20 FPS

Algorithm API:
1 request every simulation second
```

אין צורך לקרוא ל-API בכל Frame.

---

## 38. מבנה Services מומלץ

```text
src/
│
├── simulation/
│   ├── SimulationEngine.ts
│   ├── SimulationClock.ts
│   ├── SimulationState.ts
│   ├── ThreatEngine.ts
│   ├── InterceptorEngine.ts
│   ├── ImpactEngine.ts
│   └── types.ts
│
├── algorithm/
│   ├── AlgorithmClient.ts
│   ├── WorldSnapshotBuilder.ts
│   └── types.ts
│
├── visual/
│   ├── VisualEventBuilder.ts
│   ├── VisualEventQueue.ts
│   └── types.ts
│
├── map/
│   ├── LeafletRenderer.ts
│   ├── ThreatLayer.ts
│   ├── InterceptorLayer.ts
│   ├── DefenseLayer.ts
│   ├── ImpactLayer.ts
│   └── icons.ts
│
└── ui/
    ├── SimulationControls.tsx
    ├── SimulationStats.tsx
    ├── EventLog.tsx
    └── MapView.tsx
```

---

## 39. זרימת המידע המלאה

```text
                    Scenario
                       │
                       ▼
              Simulation Engine
                       │
                 Simulation Clock
                       │
                       ▼
              Update World State
                       │
              ┌────────┴────────┐
              │                 │
              ▼                 ▼
       Move Threats       Resolve Impacts
              │
              └────────┬────────┘
                       │
                       ▼
              WorldSnapshotBuilder
                       │
                       ▼
                Algorithm API
                       │
                       ▼
             Engagement Decisions
                       │
                       ▼
              VisualEventBuilder
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
 Create Interceptor          Visual Event
          │                         │
          ▼                         ▼
 Interceptor State        Visual Event Queue
          │                         │
          └────────────┬────────────┘
                       │
                       ▼
               Simulation State
                       │
             ┌─────────┼─────────┐
             │         │         │
             ▼         ▼         ▼
          Threats  Interceptors Events
             │         │         │
             └─────────┼─────────┘
                       │
                       ▼
                Leaflet Renderer
                       │
          ┌────────────┼─────────────┐
          ▼            ▼             ▼
     Red movement Blue movement Intercept/Impact
```

---

## 40. תהליך Tick מלא

```ts
async function simulationTick() {

  // 1
  activateWaitingThreats();

  // 2
  updateThreatPositions();

  // 3
  updateInterceptorPositions();

  // 4
  resolveFinishedVisualEvents();

  // 5
  resolveImpacts();

  // 6
  const snapshot =
    buildWorldSnapshot();

  // 7
  const response =
    await algorithmClient.step(snapshot);

  // 8
  processEngagementDecisions(response);

}
```

ה-Render מתבצע בנפרד:

```ts
function renderFrame() {

  renderer.renderThreats(state);

  renderer.renderInterceptors(state);

  renderer.renderEvents(state.visualEvents);

  requestAnimationFrame(renderFrame);
}
```

---

## 41. Acceptance Criteria

המימוש ייחשב תקין כאשר:

1. איום מופיע רק כשהגיע זמן השיגור שלו.
2. איום מתקדם ברציפות על המסלול.
3. המיקום שלו אינו נשמר בתוך Leaflet Marker כמקור האמת.
4. בכל Tick נשלח World State לשירות האלגוריתמי.
5. תשובת האלגוריתם יכולה לגרום לשיגור מיירט.
6. מיירט מופיע בנקודת מערכת ההגנה.
7. הוא מתקדם לעבר נקודת יירוט.
8. האיום ממשיך להתקדם במקביל.
9. הם מגיעים לאותה נקודת יירוט.
10. הצלחה מציגה יירוט ומסירה את האיום.
11. החטאה מסירה את המיירט בלבד.
12. איום שלא יורט ומגיע לסוף המסלול מייצר Impact.
13. Pause מקפיא את כל הסימולציה.
14. שינוי Speed משפיע על כל מרכיבי הזמן.
15. Restart מאפס את הסימולציה לחלוטין.
16. אין תלות בין קצב ה-API לבין FPS של המפה.
17. תגובות API ישנות אינן יכולות לדרוס State חדש.
18. המערכת מסוגלת להציג מספר גדול של עצמים במקביל.
19. Leaflet משמש Renderer בלבד.
20. כל לוגיקת ההחלטות וה-State נשארת מחוץ לשכבת המפה.

העיקרון המרכזי שעל המימוש לשמור עליו הוא:

```text
Algorithm decides WHAT happens.

Simulation Engine decides WHEN it happens.

Visual Event Layer decides HOW it is shown.

Leaflet only renders it.
```

זה צריך להיות הבסיס הארכיטקטוני של כל הפיתוח.
