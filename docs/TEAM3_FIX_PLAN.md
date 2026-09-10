# תוכנית תיקונים – מצוות 3 (Team 3 Fix Plan)

מסמך זה מגדיר את עבודת התיקון ל-4 מפתחים **במקביל מלא**. כל מפתח יוצר קובץ משלו **ועורך סקציה שונה** ב-`App.tsx` — אין תלויות בזמן פיתוח. סדר מיזוג מוגדר בסוף.

---

## 🐛 פערים שזוהו בקוד (Code-Verified Gaps)

| # | הבעיה | קובץ | השפעה |
|---|---|---|---|
| G1 | תנועת איומים משתמשת ב-`flightDuration = 40` קבוע, מתעלמת מ-`drone.velocity` | `App.tsx:69` | כל האיומים טסים באותו קצב |
| G2 | מסלול מחשב רק בין `route[0]` ל-`route[last]` | `App.tsx:72-79` | איומים מדלגים על נקודות ביניים |
| G3 | `state.interceptors` לא מאוכלס לעולם | `App.tsx:147-197` | SimulationStats תמיד מציג 0 מיירטים; WorldSnapshot שולח `activeInterceptors` ריק |
| G4 | `decision.result === 'failure'` מתעלם — תמיד מסמן `intercepted` | `App.tsx:170-188` | יירוטים כושלים שקטים |
| G5 | `<MapLegend />` לא מרונדר ב-`App.tsx` | `App.tsx` JSX | המקרא בלתי גלוי |
| G6 | Toggle callbacks לא מחוברים ל-`LeafletRenderer` | `App.tsx:handleMapReady` | מתגי מסלולים לא עושים כלום |
| G7 | בחירת תרחיש מהפאנל לא עושה כלום — `EventsPanel` קיים אך לא מרונדר ב-`App.tsx` ואין מיפוי ל-`Scenario` אמיתי | `MainLayout.tsx`, `mock/events.ts` | תמיד רץ אותו `sampleScenario` |
| G8 | אין קובץ `.env.local` — `VITE_ALGORITHM_URL` ריק ו-`VITE_USE_MOCK_ALGORITHM=true` תמיד פעיל | `.env.example` | האלגוריתם האמיתי לא עובד בשום מצב |

---

## 🗂️ חלוקת עבודה — סקציות ב-`App.tsx` + קבצים חדשים

```
App.tsx onTick callback
├── [Dev 1 owns]  שורות ~47-85   — Threat activation + movement (for loop)
├── [Dev 4 owns]  שורות ~86-129  — Impact detection + finish detection
└── [Dev 2 owns]  שורות ~131-207 — Algorithm API response handler

App.tsx component body
├── [Dev 2 owns]  הוספת interceptorOutcomesRef + resolveCompletedInterceptors
├── [Dev 3 owns]  הוספת selectedScenario state + onScenarioSelect handler
├── [Dev 3 owns]  handleMapReady — הוספת toggle callbacks
├── [Dev 4 owns]  handleRestart  — ניקוי refs
└── [Dev 3 owns]  JSX return     — הוספת <MapLegend /> + <EventsPanel />

קבצים חדשים
├── [Dev 1 owns]  src/simulation/ThreatEngine.ts
├── [Dev 2 owns]  src/simulation/InterceptorEngine.ts
├── [Dev 3 owns]  src/simulation/scenarios.ts  — תרחישים אמיתיים
└── [Dev 4 owns]  src/ui/AlgorithmSettings.tsx — חיבור לאלגוריתם אמיתי
                  frontend/.env.local
```

כל מפתח עורך טווח שורות שונה → אין קונפליקטים במיזוג.

---

## 🔀 אסטרטגיית ענפים

- **בסיס:** `team-3`
- **Dev 1:** `team3/fix-dev1-threat-engine`
- **Dev 2:** `team3/fix-dev2-interceptor-engine`
- **Dev 3:** `team3/fix-dev3-scenarios-legend`
- **Dev 4:** `team3/fix-dev4-impact-api`

---

## 👤 Developer 1 — תנועת איומים (Fix Threat Movement)
> **במה זה עוסק?** כרגע כל האיומים טסים באותה מהירות ומתעלמים מנקודות ביניים במסלול. אתה יוצר קובץ `ThreatEngine.ts` שמחשב תנועה אמיתית לפי מהירות הרחפן ועוקב אחרי כל נקודות המסלול.

**קבצים:**
- יצירה: `frontend/src/simulation/ThreatEngine.ts`
- עריכה: `frontend/src/App.tsx` — **סקציה: for loop תנועת איומים (שורות ~47-85)**

**פערים:** G1, G2

#### משימות לביצוע:

- [x] **1.1 יצירת `src/simulation/ThreatEngine.ts`**

  ```ts
  import type { DroneSimState } from './SimulationContext';
  import type { Location } from '../../../types/types';

  const EARTH_RADIUS_M = 6_371_000;

  function toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  function haversineDistance(a: Location, b: Location): number {
    const dLat = toRad(b.latitude - a.latitude);
    const dLng = toRad(b.longitude - a.longitude);
    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);
    const chord =
      sinLat * sinLat +
      Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
    return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(chord));
  }

  function routeLength(route: Location[]): number {
    let total = 0;
    for (let i = 1; i < route.length; i++) total += haversineDistance(route[i - 1], route[i]);
    return total;
  }

  export function calculateProgress(route: Location[], velocity: number, elapsedTime: number): number {
    if (route.length < 2 || velocity <= 0) return 0;
    const total = routeLength(route);
    if (total === 0) return 1;
    return Math.min(1, (velocity * elapsedTime) / total);
  }

  export function calculatePositionAlongRoute(route: Location[], progress: number): Location {
    const p = Math.max(0, Math.min(1, progress));
    if (route.length === 0) return { latitude: 0, longitude: 0, asl: 0, agl: 0 };
    if (route.length === 1 || p <= 0) return { ...route[0] };
    if (p >= 1) return { ...route[route.length - 1] };
    const segCount = route.length - 1;
    const segSize = 1 / segCount;
    const segIdx = Math.min(Math.floor(p / segSize), segCount - 1);
    const localT = (p - segIdx * segSize) / segSize;
    const a = route[segIdx];
    const b = route[segIdx + 1];
    return {
      latitude: a.latitude + (b.latitude - a.latitude) * localT,
      longitude: a.longitude + (b.longitude - a.longitude) * localT,
      asl: a.asl + (b.asl - a.asl) * localT,
      agl: a.agl + (b.agl - a.agl) * localT,
    };
  }

  export function activateWaitingThreats(
    threats: Record<number, DroneSimState>,
    simTime: number,
  ): Record<number, DroneSimState> {
    let changed = false;
    const next = { ...threats };
    for (const [idStr, threat] of Object.entries(threats)) {
      if (threat.logicalStatus === 'waiting' && simTime >= threat.startTime) {
        next[Number(idStr)] = {
          ...threat,
          logicalStatus: 'active',
          visualStatus: 'flying',
          progress: 0,
          location: threat.route[0] ?? threat.location,
        };
        changed = true;
      }
    }
    return changed ? next : threats;
  }

  export function advanceThreatPositions(
    threats: Record<number, DroneSimState>,
    simTime: number,
  ): Record<number, DroneSimState> {
    let changed = false;
    const next = { ...threats };
    for (const [idStr, threat] of Object.entries(threats)) {
      if (threat.logicalStatus !== 'active' && threat.logicalStatus !== 'interceptPending') continue;
      const elapsed = simTime - threat.startTime;
      if (elapsed < 0) continue;
      const progress = calculateProgress(threat.route, threat.velocity, elapsed);
      const location = calculatePositionAlongRoute(threat.route, progress);
      next[Number(idStr)] = { ...threat, progress, location };
      changed = true;
    }
    return changed ? next : threats;
  }
  ```

- [x] **1.2 עדכון `App.tsx` — הוסף import**

  ליד שאר imports של `./simulation/`:
  ```ts
  import { activateWaitingThreats, advanceThreatPositions } from './simulation/ThreatEngine';
  ```

- [x] **1.3 עדכון `App.tsx` — החלפת for loop תנועת איומים**

  מצא וסמן את הסקציה שמתחילה ב-`for (const [idStr, threat] of Object.entries(updatedThreats)) {` ומסתיימת לפני `if (changed) { setState... }` (הסקציה שמכילה `const flightDuration = 40`).

  **החלף אותה** ב:
  ```ts
  // --- Dev 1: Threat activation + movement via ThreatEngine ---
  const prevThreats = updatedThreats;
  updatedThreats = activateWaitingThreats(updatedThreats, simTime);
  for (const [idStr, t] of Object.entries(updatedThreats)) {
    if (t.logicalStatus === 'active' && prevThreats[Number(idStr)]?.logicalStatus === 'waiting') {
      appendLog('detection', 'זיהוי איום', `איום #${idStr} זוהה באוויר`, t.route[0]);
    }
  }
  updatedThreats = advanceThreatPositions(updatedThreats, simTime);
  changed = updatedThreats !== prevThreats;
  // --- End Dev 1 ---
  ```

- [x] **1.4 כתיבת טסטים**

  צור `frontend/src/simulation/ThreatEngine.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { calculateProgress, calculatePositionAlongRoute, activateWaitingThreats, advanceThreatPositions } from './ThreatEngine';
  import { DroneType } from '../../../types/types';

  const loc = (lat: number, lng: number) => ({ latitude: lat, longitude: lng, asl: 0, agl: 0 });
  const route = [loc(32.0, 35.0), loc(32.5, 35.0), loc(33.0, 35.0)];
  const base = { id: 1, type: DroneType.SkyMiteC7, heading: 0, velocity: 100, startTime: 0,
    location: loc(32, 35), logicalStatus: 'active' as const, visualStatus: 'flying' as const, progress: 0, route };

  it('calculateProgress 0 at elapsed=0', () => expect(calculateProgress(route, 100, 0)).toBe(0));
  it('calculateProgress clamps to 1', () => expect(calculateProgress(route, 100, 999999)).toBe(1));
  it('position at progress 0 = first point', () => expect(calculatePositionAlongRoute(route, 0).latitude).toBeCloseTo(32.0, 5));
  it('position at progress 1 = last point', () => expect(calculatePositionAlongRoute(route, 1).latitude).toBeCloseTo(33.0, 5));
  it('position at progress 0.5 = midpoint', () => expect(calculatePositionAlongRoute(route, 0.5).latitude).toBeCloseTo(32.5, 3));
  it('activates waiting threat on time', () => {
    const t = { ...base, logicalStatus: 'waiting' as const, startTime: 5 };
    expect(activateWaitingThreats({ 1: t }, 5)[1].logicalStatus).toBe('active');
  });
  it('does not activate before startTime', () => {
    const t = { ...base, logicalStatus: 'waiting' as const, startTime: 10 };
    expect(activateWaitingThreats({ 1: t }, 5)[1].logicalStatus).toBe('waiting');
  });
  it('advances active threat position', () => expect(advanceThreatPositions({ 1: base }, 10)[1].progress).toBeGreaterThan(0));
  it('does not move waiting threat', () => {
    const t = { ...base, logicalStatus: 'waiting' as const };
    expect(advanceThreatPositions({ 1: t }, 10)[1].progress).toBe(0);
  });
  ```

- [x] **1.5 הרצת טסטים**
  ```bash
  cd frontend && npx vitest run src/simulation/ThreatEngine.test.ts
  ```

- [x] **1.6 Commit**
  ```bash
  git add frontend/src/simulation/ThreatEngine.ts frontend/src/simulation/ThreatEngine.test.ts frontend/src/App.tsx
  git commit -m "feat(simulation): add ThreatEngine with velocity-based movement and multi-waypoint routes"
  ```

---

## 👤 Developer 2 — מיירטים ומעקב יירוטים (Fix Interceptor State & Miss Handling)
> **במה זה עוסק?** כרגע `state.interceptors` תמיד ריק (לכן ה-Stats מציג 0 מיירטים באוויר), ויירוט שנכשל עדיין הורג את האיום. אתה יוצר `InterceptorEngine.ts` שמנהל נכון את מצב כל מיירט, ומתקן כך שכישלון = האיום ממשיך לטוס.

**קבצים:**
- יצירה: `frontend/src/simulation/InterceptorEngine.ts`
- עריכה: `frontend/src/App.tsx` — **סקציות: interceptorOutcomesRef + algorithm response handler (שורות ~131-207)**

**פערים:** G3, G4

#### משימות לביצוע:

- [ ] **2.1 יצירת `src/simulation/InterceptorEngine.ts`**

  ```ts
  import type { InterceptorSimState, DroneSimState } from './SimulationContext';
  import type { Location } from '../../../types/types';
  import { InterceptorType } from '../../../types/types';
  import { VISUAL_INTERCEPT_DURATION_S } from '../visual/types';

  export function createInterceptorSimState(
    interceptorId: string,
    launcherId: number,
    targetDroneId: number,
    type: InterceptorType,
    launchLocation: Location,
    simTime: number,
  ): InterceptorSimState {
    return {
      id: interceptorId,
      launcherId,
      targetDroneId,
      type,
      location: { ...launchLocation },
      progress: 0,
      status: 'flying',
      launchedAt: simTime,
    };
  }

  export function resolveCompletedInterceptors(
    interceptors: Record<string, InterceptorSimState>,
    threats: Record<number, DroneSimState>,
    simTime: number,
    outcomes: Record<string, 'success' | 'failure'>,
  ): {
    updatedInterceptors: Record<string, InterceptorSimState>;
    updatedThreats: Record<number, DroneSimState>;
  } {
    let intChanged = false;
    let threatChanged = false;
    const updatedInterceptors = { ...interceptors };
    const updatedThreats = { ...threats };

    for (const [id, interceptor] of Object.entries(interceptors)) {
      if (interceptor.status !== 'flying') continue;
      if (simTime - interceptor.launchedAt < VISUAL_INTERCEPT_DURATION_S) continue;

      const outcome = outcomes[id] ?? 'success';
      updatedInterceptors[id] = { ...interceptor, status: outcome === 'success' ? 'intercepted' : 'missed' };
      intChanged = true;

      const target = updatedThreats[interceptor.targetDroneId];
      if (target) {
        if (outcome === 'success') {
          updatedThreats[interceptor.targetDroneId] = { ...target, logicalStatus: 'intercepted' };
          threatChanged = true;
        } else if (target.logicalStatus === 'interceptPending') {
          updatedThreats[interceptor.targetDroneId] = { ...target, logicalStatus: 'active' };
          threatChanged = true;
        }
      }
    }

    return {
      updatedInterceptors: intChanged ? updatedInterceptors : interceptors,
      updatedThreats: threatChanged ? updatedThreats : threats,
    };
  }
  ```

- [ ] **2.2 עדכון `App.tsx` — הוסף imports**

  ```ts
  import { createInterceptorSimState, resolveCompletedInterceptors } from './simulation/InterceptorEngine';
  import { InterceptorType } from './types/types';
  ```

- [ ] **2.3 עדכון `App.tsx` — הוסף `interceptorOutcomesRef`**

  מיד אחרי `const engagedDronesRef = useRef(new Set<number>())`, הוסף:
  ```ts
  const interceptorOutcomesRef = useRef<Record<string, 'success' | 'failure'>>({});
  ```

- [ ] **2.4 עדכון `App.tsx` — הוסף `resolveCompletedInterceptors` בתחילת ה-`onTick`**

  בתוך ה-`onTick` callback, **לפני** בלוק `if (!pendingApiCallRef.current...)`, הוסף:
  ```ts
  // --- Dev 2: Resolve completed interceptors (success or miss) ---
  const currentInterceptors = getState().interceptors;
  const currentThreats = getState().threats;
  const { updatedInterceptors, updatedThreats: resolvedThreats } = resolveCompletedInterceptors(
    currentInterceptors, currentThreats, simTime, interceptorOutcomesRef.current,
  );
  for (const [intId, interceptor] of Object.entries(updatedInterceptors)) {
    const prev = currentInterceptors[intId];
    if (prev?.status === 'flying' && interceptor.status === 'intercepted') {
      const t = resolvedThreats[interceptor.targetDroneId];
      appendLog('interception', 'יירוט מוצלח', `איום #${interceptor.targetDroneId} יורט בהצלחה`, t?.location);
    }
    if (prev?.status === 'flying' && interceptor.status === 'missed') {
      engagedDronesRef.current.delete(interceptor.targetDroneId);
    }
  }
  if (updatedInterceptors !== currentInterceptors || resolvedThreats !== currentThreats) {
    setState({ interceptors: updatedInterceptors, threats: resolvedThreats });
  }
  // --- End Dev 2 ---
  ```

- [ ] **2.5 עדכון `App.tsx` — תיקון response handler של algorithm**

  בתוך `algorithmClient.step(snapshot).then((response) => {...})`, מצא את הבלוק שיוצר engagement ומוסיף `checkRemoval` (האזור עם `onTick` פנימי). **החלף אותו** ב:
  ```ts
  for (const decision of response.engagements) {
    const targetIdNum = Number(decision.targetId);
    if (
      engagedDronesRef.current.has(targetIdNum) ||
      nextThreats[targetIdNum]?.logicalStatus !== 'active'
    ) continue;

    engagedDronesRef.current.add(targetIdNum);
    nextThreats[targetIdNum] = { ...nextThreats[targetIdNum], logicalStatus: 'interceptPending' };

    const bundle = processEngagementDecision(decision, currentState);
    if (bundle) {
      visualEventQueue.enqueue(bundle.visualEvent);
      rendererRef.current?.registerInterceptorVisualState(bundle.interceptorState);

      // Store outcome for resolveCompletedInterceptors
      interceptorOutcomesRef.current[bundle.interceptorState.id] = decision.result ?? 'success';

      // Populate state.interceptors
      const launcherId = Number(decision.defenseSystemId);
      const launcher = currentState.launchers[launcherId];
      if (launcher) {
        nextInterceptors[bundle.interceptorState.id] = createInterceptorSimState(
          bundle.interceptorState.id,
          launcherId,
          targetIdNum,
          decision.interceptorType as unknown as InterceptorType,
          launcher.location,
          simTime,
        );
      }

      appendLog(
        'launch', 'שיגור מיירט',
        `מיירט ${decision.interceptorType} שוגר מסוללה #${decision.defenseSystemId} לעבר איום #${decision.targetId}`,
        bundle.interceptorState.startPosition,
      );
      threatsStateUpdated = true;
    }
  }
  if (threatsStateUpdated) {
    setState({ threats: nextThreats, interceptors: nextInterceptors });
  }
  ```

  הוסף גם `const nextInterceptors = { ...currentState.interceptors };` לתחילת ה-`.then()` callback.

- [ ] **2.6 כתיבת טסטים**

  צור `frontend/src/simulation/InterceptorEngine.test.ts`:
  ```ts
  import { describe, it, expect } from 'vitest';
  import { createInterceptorSimState, resolveCompletedInterceptors } from './InterceptorEngine';
  import { DroneType, InterceptorType } from '../../../types/types';

  const loc = (lat: number, lng: number) => ({ latitude: lat, longitude: lng, asl: 0, agl: 0 });
  const FLIGHT = 3;

  const threat = (id: number, status: 'active' | 'interceptPending') => ({
    id, type: DroneType.SkyMiteC7, heading: 0, velocity: 100, startTime: 0,
    location: loc(32, 35), logicalStatus: status, visualStatus: 'flying' as const,
    progress: 0.5, route: [loc(32, 35), loc(33, 35)],
  });

  it('creates flying interceptor state', () => {
    const s = createInterceptorSimState('int-1', 101, 1, InterceptorType.DartFoxS, loc(32, 34), 10);
    expect(s.status).toBe('flying');
    expect(s.launchedAt).toBe(10);
  });

  it('success: interceptor intercepted, threat intercepted', () => {
    const int = createInterceptorSimState('int-1', 101, 1, InterceptorType.DartFoxS, loc(32, 34), 10);
    const { updatedInterceptors, updatedThreats } = resolveCompletedInterceptors(
      { 'int-1': int }, { 1: threat(1, 'interceptPending') }, 10 + FLIGHT + 0.1, { 'int-1': 'success' },
    );
    expect(updatedInterceptors['int-1'].status).toBe('intercepted');
    expect(updatedThreats[1].logicalStatus).toBe('intercepted');
  });

  it('failure: interceptor missed, threat back to active', () => {
    const int = createInterceptorSimState('int-2', 101, 2, InterceptorType.DartFoxS, loc(32, 34), 10);
    const { updatedInterceptors, updatedThreats } = resolveCompletedInterceptors(
      { 'int-2': int }, { 2: threat(2, 'interceptPending') }, 10 + FLIGHT + 0.1, { 'int-2': 'failure' },
    );
    expect(updatedInterceptors['int-2'].status).toBe('missed');
    expect(updatedThreats[2].logicalStatus).toBe('active');
  });

  it('still flying: no changes before flight duration', () => {
    const int = createInterceptorSimState('int-3', 101, 3, InterceptorType.DartFoxS, loc(32, 34), 10);
    const { updatedInterceptors } = resolveCompletedInterceptors(
      { 'int-3': int }, { 3: threat(3, 'interceptPending') }, 11, { 'int-3': 'success' },
    );
    expect(updatedInterceptors['int-3'].status).toBe('flying');
  });
  ```

- [ ] **2.7 הרצת טסטים**
  ```bash
  cd frontend && npx vitest run src/simulation/InterceptorEngine.test.ts
  ```

- [ ] **2.8 Commit**
  ```bash
  git add frontend/src/simulation/InterceptorEngine.ts frontend/src/simulation/InterceptorEngine.test.ts frontend/src/App.tsx
  git commit -m "feat(simulation): add InterceptorEngine, populate state.interceptors, fix miss handling"
  ```

---

## 👤 Developer 3 — בחירת תרחיש + מקרא מפה (Scenario Selection + MapLegend)
> **במה זה עוסק?** בחירת תרחיש מהפאנל השמאלי לא עושה כלום — הסימולציה תמיד טוענת את אותו `sampleScenario`. הסיבה: `EventsPanel` כלל לא מרונדר ב-`App.tsx`, וה-`ScenarioItem` שנבחר לא מחובר ל-`loadScenario`. אתה יוצר תרחישים אמיתיים, מרנדר את הפאנל, ומחבר בחירה לסימולציה. בנוסף, מוסיף את `MapLegend`.

**קבצים:**
- יצירה: `frontend/src/simulation/scenarios.ts`
- עריכה: `frontend/src/App.tsx` — **סקציות: state + handlers + JSX**

**פערים:** G5, G6, G7

#### משימות לביצוע:

- [ ] **3.1 יצירת `src/simulation/scenarios.ts` — תרחישים אמיתיים**

  מפה כל `ScenarioItem.id` לאובייקט `Scenario` אמיתי עם מסלולים, רחפנים וסוללות.
  ```ts
  import { DroneType, InterceptorType, LauncherType } from '../../../types/types';
  import type { Scenario } from './SimulationContext';

  const loc = (lat: number, lng: number, asl = 300) =>
    ({ latitude: lat, longitude: lng, asl, agl: asl });

  // sc-1: Single front — North (2 drones)
  export const scenario_sc1: Scenario = {
    id: 'sc-1', name: 'חדירה חד-זירתית - צפון', startTime: 0,
    launchers: [
      { id: 101, type: LauncherType.IronHookSR, active: true, amount: 20,
        location: loc(32.794, 34.989, 200),
        ammunition: [[InterceptorType.BuzzStop15, 10], [InterceptorType.DartFoxS, 10]] },
    ],
    drones: [
      { id: 1, type: DroneType.SkyMiteC7, heading: 195, velocity: 120, startTime: 2,
        location: loc(33.05, 35.10), route: [loc(33.05, 35.10), loc(32.09, 34.78, 200)] },
      { id: 2, type: DroneType.NanoSwarmQ9, heading: 210, velocity: 90, startTime: 5,
        location: loc(33.10, 35.55), route: [loc(33.10, 35.55), loc(32.30, 35.22, 200)] },
    ],
  };

  // sc-2: Multi-front — North + East (5 drones) — same as sampleScenario
  export { sampleScenario as scenario_sc2 } from './sampleScenario';

  // sc-3: Massive — 3 borders (10 drones)
  export const scenario_sc3: Scenario = {
    id: 'sc-3', name: 'חדירה מסיבית - 3 גבולות', startTime: 0,
    launchers: [
      { id: 101, type: LauncherType.IronHookSR, active: true, amount: 30,
        location: loc(32.794, 34.989, 200),
        ammunition: [[InterceptorType.BuzzStop15, 15], [InterceptorType.DartFoxS, 15]] },
      { id: 102, type: LauncherType.ShieldNestLite, active: true, amount: 20,
        location: loc(32.085, 34.782, 30),
        ammunition: [[InterceptorType.SkyLanceM, 10], [InterceptorType.NetWing30, 10]] },
      { id: 103, type: LauncherType.HorizonEyeMX, active: true, amount: 25,
        location: loc(31.768, 35.214, 750),
        ammunition: [[InterceptorType.SkyLanceM, 12], [InterceptorType.FalconClipH, 13]] },
    ],
    drones: [
      { id: 1, type: DroneType.SkyMiteC7,    heading: 195, velocity: 120, startTime: 2,  location: loc(33.05, 35.10), route: [loc(33.05, 35.10), loc(32.09, 34.78, 200)] },
      { id: 2, type: DroneType.FalconLongX4, heading: 200, velocity: 160, startTime: 4,  location: loc(33.20, 35.35), route: [loc(33.20, 35.35), loc(32.79, 34.99, 300)] },
      { id: 3, type: DroneType.NanoSwarmQ9,  heading: 210, velocity: 90,  startTime: 6,  location: loc(33.10, 35.55), route: [loc(33.10, 35.55), loc(32.30, 35.22, 200)] },
      { id: 4, type: DroneType.FalconLongX4, heading: 240, velocity: 145, startTime: 8,  location: loc(33.40, 36.60), route: [loc(33.40, 36.60), loc(32.08, 34.78, 300)] },
      { id: 5, type: DroneType.SkyMiteC7,    heading: 230, velocity: 110, startTime: 10, location: loc(33.00, 36.20), route: [loc(33.00, 36.20), loc(31.77, 35.21, 250)] },
      { id: 6, type: DroneType.LoadBeeM2,    heading: 260, velocity: 100, startTime: 10, location: loc(32.20, 36.80), route: [loc(32.20, 36.80), loc(31.77, 35.21, 200)] },
      { id: 7, type: DroneType.NanoSwarmQ9,  heading: 255, velocity: 85,  startTime: 13, location: loc(31.95, 36.50), route: [loc(31.95, 36.50), loc(31.77, 35.21, 200)] },
      { id: 8, type: DroneType.SkyMiteC7,    heading: 300, velocity: 130, startTime: 18, location: loc(30.20, 34.90), route: [loc(30.20, 34.90), loc(31.25, 34.79, 200)] },
      { id: 9, type: DroneType.LoadBeeM2,    heading: 315, velocity: 105, startTime: 20, location: loc(30.00, 35.20), route: [loc(30.00, 35.20), loc(31.77, 35.21, 200)] },
      { id: 10, type: DroneType.FalconLongX4, heading: 325, velocity: 155, startTime: 24, location: loc(29.55, 34.70), route: [loc(29.55, 34.70), loc(31.25, 34.79, 200)] },
    ],
  };

  // sc-4: Single drone — West approach
  export const scenario_sc4: Scenario = {
    id: 'sc-4', name: 'רחפן בודד - חדירה מערבית', startTime: 0,
    launchers: [
      { id: 105, type: LauncherType.IronHookSR, active: true, amount: 18,
        location: loc(31.804, 34.655, 10),
        ammunition: [[InterceptorType.BuzzStop15, 10], [InterceptorType.SpearMini70, 8]] },
    ],
    drones: [
      { id: 1, type: DroneType.LoadBeeM2, heading: 85, velocity: 110, startTime: 3,
        location: loc(31.80, 33.00), route: [loc(31.80, 33.00), loc(31.80, 34.65, 120)] },
    ],
  };

  // sc-5 through sc-8: reuse sc-2 data with different start offsets
  export const scenario_sc5: Scenario = { ...scenario_sc3, id: 'sc-5', name: 'חדירה משולבת - צפון ודרום',
    drones: scenario_sc3.drones.slice(0, 4).map((d, i) => ({ ...d, startTime: d.startTime + i * 2 })) };
  export const scenario_sc6: Scenario = { ...scenario_sc3, id: 'sc-6', name: 'נחיל רחפנים - גזרה מזרחית',
    drones: scenario_sc3.drones.slice(3, 8).map((d, i) => ({ ...d, id: i + 1 })) };
  export const scenario_sc7: Scenario = { ...scenario_sc3, id: 'sc-7', name: 'מתקפה מסונכרנת - מזרח ודרום',
    drones: scenario_sc3.drones.slice(3, 7).map((d, i) => ({ ...d, id: i + 1 })) };
  export const scenario_sc8: Scenario = { ...scenario_sc1, id: 'sc-8', name: 'חדירת סיור - גזרת צפון' };

  export const SCENARIO_MAP: Record<string, Scenario> = {
    'sc-1': scenario_sc1,
    'sc-2': scenario_sc2,
    'sc-3': scenario_sc3,
    'sc-4': scenario_sc4,
    'sc-5': scenario_sc5,
    'sc-6': scenario_sc6,
    'sc-7': scenario_sc7,
    'sc-8': scenario_sc8,
  };
  ```

- [ ] **3.2 עדכון `App.tsx` — הוסף imports**

  ```ts
  import { EventsPanel } from './components/EventsPanel/EventsPanel';
  import { MapLegend } from './ui/MapLegend';
  import { SCENARIO_MAP } from './simulation/scenarios';
  import type { ScenarioItem } from './types/simulation';
  ```

- [ ] **3.3 עדכון `App.tsx` — הוסף state ו-handlers לבחירת תרחיש**

  בתחילת קומפוננט `App`, הוסף:
  ```ts
  const [activeScenarioId, setActiveScenarioId] = useState<string>('sc-2');
  ```

  אחרי `handleRestart`, הוסף:
  ```ts
  const handleScenarioSelect = useCallback((scenario: ScenarioItem) => {
    const simScenario = SCENARIO_MAP[scenario.id];
    if (!simScenario) return;

    setActiveScenarioId(scenario.id);
    stopClock();
    algorithmClient.reset();
    tickIdRef.current = 0;
    lastApiTickSimTimeRef.current = -1;
    pendingApiCallRef.current = false;
    engagedDronesRef.current.clear();
    visualEventQueue.clear();
    rendererRef.current?.resetVisuals();
    loadScenario(simScenario);
    rendererRef.current?.initDefenseSystems();
  }, []);

  const handleToggleThreatRoutes = useCallback((show: boolean) => {
    rendererRef.current?.setShowThreatRoutes(show);
  }, []);

  const handleToggleInterceptorRoutes = useCallback((show: boolean) => {
    rendererRef.current?.setShowInterceptorRoutes(show);
  }, []);
  ```

- [ ] **3.4 עדכון `App.tsx` — הוסף `<EventsPanel />` ו-`<MapLegend />` ל-JSX**

  בתוך ה-`return`, הוסף:
  ```tsx
  <EventsPanel
    selectedScenarioId={activeScenarioId}
    onScenarioSelect={handleScenarioSelect}
  />
  <MapLegend
    onToggleThreatRoutes={handleToggleThreatRoutes}
    onToggleInterceptorRoutes={handleToggleInterceptorRoutes}
  />
  ```

- [ ] **3.5 בדיקה ויזואלית**
  ```bash
  cd frontend && npm run dev
  ```
  - [ ] פאנל תרחישים מופיע בצד שמאל
  - [ ] לחיצה על תרחיש אחר משנה את הסימולציה (מספר רחפנים שונה, מסלולים שונים)
  - [ ] לחיצה על sc-3 (10 רחפנים) מציגה 10 מסלולים על המפה
  - [ ] מקרא מפה מופיע ומתגי המסלולים עובדים

- [ ] **3.6 Commit**
  ```bash
  git add frontend/src/simulation/scenarios.ts frontend/src/App.tsx
  git commit -m "feat(ui): add scenario selection wiring EventsPanel to loadScenario, add MapLegend"
  ```

---

## 👤 Developer 4 — תיקון פגיעות (Impact Fix)
> **במה זה עוסק?** תיקון דליפת ה-listener בזיהוי פגיעות ותיקון finish detection. האלגוריתם ממשיך לרוץ ב-Mock — חיבור ל-API האמיתי יתווסף בעתיד כשה-API יהיה מוכן.

**קבצים:**
- עריכה: `frontend/src/App.tsx` — **סקציות: impact/finish + handleRestart**

**פערים:** G7 (חלקית), G8

#### משימות לביצוע:

- [ ] **4.1 תיקון impact detection ב-`App.tsx`**

  מצא בתוך הלולאה `for (const [idStr, threat] of Object.entries(updatedThreats))` את הבלוק שמטפל ב-`isImpacted` (מכיל `checkFinish`). **החלף אותו** ב:
  ```ts
  if (isImpacted) {
    visualEventQueue.enqueue({
      id: `evt-impact-${id}`,
      type: 'impact',
      startTime: simTime,
      targetId: `${id}`,
      position: currentPos,
      status: 'pending',
    });
    appendLog('impact', 'פגיעה בשטח', `איום #${id} פגע בשטח`, currentPos);
  }
  ```
  (**מחק** את כל בלוק `checkFinish` הישן עם ה-`onTick` הפנימי — זו הדליפה.)

- [ ] **4.2 תיקון finish detection**

  מצא בסוף ה-`onTick`:
  ```ts
  const allThreats = Object.values(updatedThreats);
  const allDone = allThreats.length > 0 && allThreats.every(...)
  if (allDone && status === 'running') { finishClock(); }
  ```
  **החלף** ב:
  ```ts
  const allValues = Object.values(updatedThreats);
  const allDone =
    allValues.length > 0 &&
    allValues.every((t) => t.logicalStatus === 'intercepted' || t.logicalStatus === 'impacted');
  if (allDone && state.status === 'running') {
    finishClock();
  }
  ```

- [ ] **4.3 תיקון `handleRestart` — ניקוי refs**

  בתוך `handleRestart`, הוסף:
  ```ts
  if (interceptorOutcomesRef?.current) interceptorOutcomesRef.current = {};
  ```
  > אם Dev 2 עוד לא מוזג, הוסף `// @ts-ignore` זמני.

- [ ] **4.4 בדיקה**
  ```bash
  cd frontend && npm run dev
  ```
  - [ ] Restart מאפס לחלוטין ומחזיר סוללות למפה
  - [ ] הסימולציה מסתיימת אוטומטית כשכל האיומים נפלו / יורטו

- [ ] **4.5 Commit**
  ```bash
  git add frontend/src/App.tsx
  git commit -m "fix(simulation): fix impact detection listener leak and finish detection logic"
  ```

---

## 🔗 סדר מיזוג (Merge Order)

כל 4 הענפים מתפתחים במקביל. סדר המיזוג הסופי:

```
Dev 1  ──┐
Dev 2  ──┼──► merge to team-3 (ללא קונפליקטים — טווחי שורות שונים)
Dev 3  ──┤
Dev 4  ──┘
```

**הערה בודדת:** Dev 4 משתמש ב-`interceptorOutcomesRef` שנוצר ע"י Dev 2. אם Dev 4 ממזג לפני Dev 2, יש להוסיף `// @ts-ignore` זמני על השורה הרלוונטית ולהסיר אחרי מיזוג Dev 2.

---

## ✨ שיפורים אופציונליים (Bonus Features)

פיצ'רים קלים שיוסיפו ערך:

### 🎯 Dynamic Threat Heading (Dev 1)
בתוך `advanceThreatPositions`, אחרי חישוב `location`, חשב bearing דינמי ועדכן `heading` — האייקון יסתובב לכיוון הטיסה האמיתי:
```ts
const nextP = Math.min(1, progress + 0.005);
const nextLoc = calculatePositionAlongRoute(threat.route, nextP);
const dLng = (nextLoc.longitude - location.longitude) * Math.PI / 180;
const lat1 = location.latitude * Math.PI / 180;
const lat2 = nextLoc.latitude * Math.PI / 180;
const heading = (Math.atan2(
  Math.sin(dLng) * Math.cos(lat2),
  Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng)
) * 180 / Math.PI + 360) % 360;
next[Number(idStr)] = { ...threat, progress, location, heading };
```

### 💣 Ammo Depletion Tracking (Dev 2)
אחרי שיגור מיירט, הפחת 1 מ-`launcher.ammunition` ב-`state.launchers` — `SimulationStats` יוכל להציג מלאי נותר.

### 📊 Simulation Summary Screen (Dev 3)
הוסף `src/ui/SimulationSummary.tsx` — overlay כשסטטוס `finished` עם אחוז הצלחה, מספר יורטו/נפלו, וכפתור Restart.
