# תוכנית תיקון ושלמות – סימולציית מפה אשמורת (Team 3 Fix Plan)

מסמך זה מפרט את כל הפערים שנותרו לאחר הפיתוח המקבילי הראשון, ומחלק אותם ל-3 מפתחים.

**עדכון אחרון:** לאחר מיזוג `dev2-algorithm-api` — שכבת האלגוריתם קיימת כעת במלואה.

**בסיס:** כל עבודה יוצאת מ-`team-3` ומתמזגת אליו לפי שלבי האינטגרציה בסוף המסמך.

---

## סקירת מצב נוכחי

| תחום | מצב |
|------|-----|
| `src/algorithm/types.ts` | ✅ הושלם |
| `src/algorithm/WorldSnapshotBuilder.ts` | ✅ הושלם |
| `src/algorithm/AlgorithmClient.ts` | ✅ הושלם |
| `src/algorithm/mockServer.ts` | ✅ הושלם |
| `src/visual/types.ts` | ✅ הושלם |
| `src/visual/VisualEventBuilder.ts` | ✅ הושלם (יש bug קטן — ראה A.1) |
| `src/visual/VisualEventQueue.ts` | ✅ הושלם |
| `src/map/LeafletRenderer.ts` | ⚠️ קיים אך מפר ארכיטקטורה — ראה C.2 |
| `src/map/icons.ts` | ✅ הושלם |
| `src/ui/*` | ✅ הושלם |
| `src/simulation/ThreatEngine.ts` | ❌ חסר |
| `src/simulation/InterceptorEngine.ts` | ❌ חסר |
| `src/simulation/ImpactEngine.ts` | ❌ חסר |
| `src/simulation/SimulationEngine.ts` | ❌ חסר |
| `App.tsx` — חיבור לאלגוריתם | ❌ עדיין שימוש ב-mock inline ישן |
| `AlgorithmClient` — fallback ל-mock | ❌ לא מחובר ל-`MockAlgorithmServer` |
| `VisualEvent` — כפילות טיפוסים | ❌ שני הגדרות סותרות |
| `SimulationStats.tsx` — סטטוס אלגוריתם | ❌ לא מחובר ל-`getIsAvailable()` |

---

## 👤 Developer A: Simulation Engine Files

**תחום:** יצירת קבצי ה-Engine החסרים וניקוי `App.tsx` מלוגיקת tick inline.

**ענף:** `fix/dev-a-engine`

---

### A.1 — תיקון import ב-`src/visual/VisualEventBuilder.ts`

**הבעיה:** `VisualEventBuilder.ts` מגדיר `EngagementDecision` מקומית (שורה 38). כעת `src/algorithm/types.ts` קיים עם ההגדרה הרשמית.

**מה לשנות:**
```ts
// הסר את ה-interface המקומי (שורות 38–53) והחלף ב:
import type { EngagementDecision } from '../algorithm/types';
```

וודא שהשדות תואמים — שני ה-interfaces זהים לחלוטין, אין שינוי לוגי.

---

### A.2 — יצירת `src/simulation/ThreatEngine.ts`

```ts
// הפעלת איומים ממתינים
export function activateWaitingThreats(
  threats: Record<number, DroneSimState>,
  simulationTime: number,
): Record<number, DroneSimState>

// חישוב מיקום לאורך מסלול פוליליין (דטרמיניסטי, לפי velocity)
// שים לב: הלוגיקה הזו כבר קיימת ב-VisualEventBuilder.ts (calculateRouteLength,
// getPositionAtProgress) — לחלץ לקובץ utils משותף או לייבא ישירות
export function calculatePositionAlongRoute(
  route: Location[],
  progress: number,
): Location

// קידום כל האיומים הפעילים לפי velocity אמיתית (m/s) ומרחק מסלול
export function updateThreatPositions(
  threats: Record<number, DroneSimState>,
  deltaTime: number,
  speedMultiplier: number,
): Record<number, DroneSimState>
```

**חשוב:** ה-`App.tsx` הנוכחי משתמש ב-`flightDuration = 35` קשיח עם linear interpolation.
זה צריך להיות מוחלף בחישוב לפי `drone.velocity` (m/s) + אורך מסלול haversine אמיתי.
הפונקציות `calculateRouteLength` ו-`getPositionAtProgress` כבר כתובות ב-`VisualEventBuilder.ts` — לשתף אותן.

---

### A.3 — יצירת `src/simulation/InterceptorEngine.ts`

כרגע תנועת המיירטים מנוהלת ב-`LeafletRenderer.ts` (שורות 348–381) — הפרה של ארכיטקטורה.

```ts
// קידום progress ומיקום מיירטים לפי simulationTime
export function updateInterceptorPositions(
  interceptors: Record<string, InterceptorSimState>,
  simulationTime: number,
): Record<string, InterceptorSimState>

// זיהוי מיירטים שהגיעו ליעד — עדכון סטטוס + עדכון האיום המותקף
export function resolveArrivedInterceptors(
  interceptors: Record<string, InterceptorSimState>,
  threats: Record<number, DroneSimState>,
): {
  updatedInterceptors: Record<string, InterceptorSimState>;
  updatedThreats: Record<number, DroneSimState>;
}
```

לאחר יצירת קובץ זה, `LeafletRenderer.ts` יסיר את חישוב `progress`/`position` ויקרא את הערכים ישירות מה-State (ראה C.2).

---

### A.4 — יצירת `src/simulation/ImpactEngine.ts`

```ts
// זיהוי איומים שהגיעו לסוף מסלולם ועדיין פעילים לוגית
export function resolveImpacts(
  threats: Record<number, DroneSimState>,
  simulationTime: number,
  onImpact: (threatId: string, position: Location, simTime: number) => void,
): Record<number, DroneSimState>
```

לקרוא ל-`buildImpactEvent` מ-`VisualEventBuilder.ts` — כבר קיים ומיוצא.

---

### A.5 — יצירת `src/simulation/SimulationEngine.ts`

מאחד את כל שלבי ה-Tick לפונקציה מרכזית אחת עם ניהול `tickId`.

```ts
let currentTickId = 0;

export function getNextTickId(): number {
  return ++currentTickId;
}

export function resetTickId(): void {
  currentTickId = 0;
}

// הפונקציה המרכזית שנקראת מתוך onTick בכל frame
export function runSimulationTick(
  deltaTime: number,
  simulationTime: number,
  options: {
    onEngagementDecisions: (decisions: EngagementDecision[], tickId: number) => void;
  }
): void {
  const state = getState();
  if (state.status !== 'running') return;

  // 1. activateWaitingThreats
  // 2. updateThreatPositions
  // 3. updateInterceptorPositions
  // 4. resolveArrivedInterceptors
  // 5. resolveImpacts (עם enqueue ל-visualEventQueue)
  // 6. setState עם הכל
  // 7. buildWorldSnapshot עם tickId
  // 8. algorithmClient.step(snapshot) — async, לא חוסם את ה-tick
  // 9. (async callback) options.onEngagementDecisions(decisions, tickId)
}
```

**הערה חשובה לגבי async:** הקריאה ל-`algorithmClient.step()` היא async. ה-tick עצמו לא יכול להיות async (הוא נקרא ב-60 FPS מ-`requestAnimationFrame`). הפתרון: `step()` נקרא ויוצא ב-fire-and-forget, והתשובה מגיעה ב-callback נפרד. להוסיף guard שמונע שתי קריאות מקבילות:

```ts
let pendingApiCall = false;

// בתוך runSimulationTick, בחלק של API:
if (!pendingApiCall && shouldFireApiTick(simulationTime)) {
  pendingApiCall = true;
  algorithmClient.step(snapshot).then((response) => {
    pendingApiCall = false;
    if (response) options.onEngagementDecisions(response.engagements, response.tickId);
  });
}
```

---

### A.6 — ניקוי `App.tsx`

לאחר השלמת A.2–A.5, `App.tsx` אמור להכיל רק:

```tsx
const unsubscribe = onTick((deltaTime, simTime) => {
  runSimulationTick(deltaTime, simTime, {
    onEngagementDecisions: (decisions, tickId) => {
      for (const decision of decisions) {
        const bundle = processEngagementDecision(decision, getState());
        if (bundle) {
          visualEventQueue.enqueue(bundle.visualEvent);
          rendererRef.current?.registerInterceptorVisualState(bundle.interceptorState);
        }
      }
    },
  });
});
```

**מה למחוק מ-`App.tsx`:**
- כל לוגיקת `for (const [idStr, threat] of Object.entries(...))` — עוברת ל-ThreatEngine
- חישוב `progress` ו-`currentPos` עם `flightDuration = 35` — עוברת ל-ThreatEngine
- לוגיקת impact (`isImpacted`) — עוברת ל-ImpactEngine
- mock אלגוריתם inline (`timeSinceLaunch >= 5`) — מוחלף ע"י AlgorithmClient
- `engagedDronesRef` — deduplication כבר מנוהל ב-WorldSnapshotBuilder (engagementStatus)
- `checkRemoval` onTick נסתר — מוחלף ע"י resolveArrivedInterceptors

---

## 👤 Developer B: Algorithm Wiring

**תחום:** חיבור שכבת האלגוריתם שנוצרה ל-`App.tsx` ול-`AlgorithmClient`, הוספת fallback ל-mock, ניהול tickId.

**ענף:** `fix/dev-b-wiring`

---

### B.1 — חיבור `MockAlgorithmServer` כ-fallback ב-`AlgorithmClient`

**הבעיה:** `AlgorithmClient.ts` כרגע כשה-API לא זמין מחזיר `null`. `MockAlgorithmServer` קיים אך לא מחובר לשום דבר.

**מה לשנות ב-`AlgorithmClient.ts`:**

```ts
import { MockAlgorithmServer } from './mockServer';

export class AlgorithmClient {
  private mockServer = new MockAlgorithmServer({ successRate: 0.85 });

  public async step(snapshot: WorldSnapshot): Promise<AlgorithmResponse | null> {
    const useMock =
      !this.baseUrl ||
      import.meta.env.VITE_USE_MOCK_ALGORITHM === 'true';

    if (useMock) {
      return this.mockServer.handleStep(snapshot);
    }

    try {
      // ... existing HTTP fetch logic ...
    } catch (error) {
      this.isAvailable = false;
      console.warn('Algorithm API unavailable, falling back to mock:', error);
      // Graceful fallback to mock instead of returning null
      return this.mockServer.handleStep(snapshot);
    }
  }
}
```

להוסיף לקובץ `.env.example`:
```
VITE_ALGORITHM_URL=http://localhost:3001
VITE_USE_MOCK_ALGORITHM=true
```

---

### B.2 — יצירת singleton מוכן לשימוש ב-`AlgorithmClient.ts`

```ts
// בסוף הקובץ, לאחר ה-class:
export const algorithmClient = new AlgorithmClient({
  baseUrl: import.meta.env.VITE_ALGORITHM_URL ?? '',
});
```

כך `SimulationEngine.ts` (Dev A) ו-`SimulationStats.tsx` (Dev C) יוכלו לייבא ישירות:
```ts
import { algorithmClient } from '../algorithm/AlgorithmClient';
```

---

### B.3 — הוספת `reset()` ל-tickId ב-`Restart`

`AlgorithmClient.reset()` כבר קיים. צריך לוודא שנקרא ב-`handleRestart` ב-`App.tsx`:

```ts
const handleRestart = useCallback(() => {
  stopClock();
  algorithmClient.reset();  // ← להוסיף
  resetTickId();            // ← להוסיף (מ-SimulationEngine)
  engagedDronesRef.current.clear();
  visualEventQueue.clear();
  // ...
}, []);
```

---

### B.4 — וידוא `shouldFireApiTick` — קצב קריאות לאלגוריתם

לפי המפרט §37: קריאה ל-API פעם אחת לכל שניית סימולציה (לא כל frame).

להוסיף ל-`SimulationEngine.ts` (או ל-`AlgorithmClient.ts`):

```ts
let lastApiTickSimTime = -Infinity;
const API_TICK_INTERVAL_S = 1; // שניית סימולציה

export function shouldFireApiTick(simulationTime: number): boolean {
  if (simulationTime - lastApiTickSimTime >= API_TICK_INTERVAL_S) {
    lastApiTickSimTime = simulationTime;
    return true;
  }
  return false;
}
```

---

## 👤 Developer C: Integration Cleanup & Acceptance Testing

**תחום:** תיקון שני באגים ארכיטקטוניים (VisualEvent כפילות + LeafletRenderer לוגיקה), חיבור SimulationStats, ובדיקת קבלה.

**ענף:** `fix/dev-c-integration`

**תלות:** יש להתחיל רק לאחר ש-Dev A מסיים A.2–A.4 (כדי לדעת מה להסיר מ-LeafletRenderer).

---

### C.1 — איחוד טיפוסי `VisualEvent`

**הבעיה:** קיימות שתי הגדרות:
- `SimulationContext.ts` שורה 48: `VisualEvent` פשוט עם `location: Location`, `createdAt`, `duration`.
- `visual/types.ts`: `VisualEvent` מלא לפי המפרט עם `position: LatLng`, `targetId`, `interceptorId`, `status`.

`App.tsx` משתמש ב-`visualEventQueue.enqueue()` עם מבנה `visual/types.ts`, אבל `SimulationState.visualEvents: VisualEvent[]` מצביע לטיפוס מ-`SimulationContext.ts`.

**מה לעשות:**
1. ב-`SimulationContext.ts` — מחוק את ה-`interface VisualEvent` המקומי (שורות 48–55).
2. ב-`SimulationContext.ts` — הוסף import:
   ```ts
   import type { VisualEvent } from '../visual/types';
   ```
3. עדכן את `SimulationState.visualEvents: VisualEvent[]` להשתמש בטיפוס המיובא.
4. בדוק שכל הייבואים ב-`App.tsx`, `EventLog.tsx`, `SimulationStats.tsx` ממשיכים לעבוד (לרוב ייבאו מ-`SimulationContext` — הטיפוס יהיה זהה כי re-exported אוטומטית).

---

### C.2 — הוצאת חישוב מיירטים מ-`LeafletRenderer.ts`

**הבעיה:** `LeafletRenderer.ts` מחשב `progress`, `position`, ו-`visualStatus` של מיירטים (שורות 348–381 בפונקציה `renderInterceptors`). זו לוגיקה שאינה שייכת לרנדרר.

**תלות:** להמתין לסיום Dev A (A.3 — `InterceptorEngine.ts`), שאז מיקום המיירטים יגיע ב-State.

**מה לשנות ב-`LeafletRenderer.ts`:**

```ts
// לפני — Renderer מחשב progress בעצמו:
const elapsed = simulationTime - ivs.launchTime;
const progress = Math.min(1, elapsed / VISUAL_INTERCEPT_DURATION_S);
ivs.progress = progress;
const pos = lerpLatLng(ivs.startPosition, ivs.interceptPoint, progress);
ivs.position = pos;
if (progress >= 1 && ivs.visualStatus === 'flying') {
  ivs.visualStatus = ivs.outcome === 'success' ? 'exploding' : 'missing';
  this.handleInterceptorArrival(id, ivs);
}

// אחרי — Renderer קורא מהמצב שחושב ע"י InterceptorEngine:
private renderInterceptors(): void {
  const state = getState();
  for (const interceptor of Object.values(state.interceptors)) {
    const pos: LatLng = {
      latitude: interceptor.location.latitude,
      longitude: interceptor.location.longitude,
    };
    if (interceptor.status === 'flying') {
      // setLatLng על marker קיים, או יצירת marker חדש
    } else if (interceptor.status === 'intercepted' || interceptor.status === 'missed') {
      this.handleInterceptorArrival(String(interceptor.id), interceptor);
    }
  }
}
```

`handleInterceptorArrival` נשאר ב-Renderer (הוא תצוגה בלבד — explosion marker + setTimeout).

---

### C.3 — חיבור `SimulationStats.tsx` לסטטוס האלגוריתם

`SimulationStats.tsx` כבר מכיל placeholder לאינדיקטור חיבור.

**מה להוסיף:**
```tsx
import { algorithmClient } from '../algorithm/AlgorithmClient';

// בתוך הקומפוננט:
const [algoAvailable, setAlgoAvailable] = useState(true);

useEffect(() => {
  const id = setInterval(() => {
    setAlgoAvailable(algorithmClient.getIsAvailable());
  }, 1000);
  return () => clearInterval(id);
}, []);

// לחבר ל-Chip/indicator הקיים שכבר מוצג ב-UI
```

---

### C.4 — בדיקת 20 קריטריוני הקבלה

לאחר שכל 3 המפתחים ממזגים, Dev C מריץ בדיקת קבלה ידנית מול כל 20 הקריטריונים שב-`ashmoret_simulation_spec.md` §41.

**Checklist:**
- [ ] 1. איום מופיע רק כשהגיע זמן השיגור שלו
- [ ] 2. איום מתקדם ברציפות על המסלול
- [ ] 3. מיקום לא נשמר ב-Leaflet Marker כמקור האמת
- [ ] 4. בכל Tick נשלח World State לשירות האלגוריתמי
- [ ] 5. תשובת האלגוריתם יכולה לגרום לשיגור מיירט
- [ ] 6. מיירט מופיע בנקודת מערכת ההגנה
- [ ] 7. מיירט מתקדם לעבר נקודת יירוט
- [ ] 8. האיום ממשיך להתקדם במקביל
- [ ] 9. שניהם מגיעים לאותה נקודת יירוט
- [ ] 10. הצלחה מציגה יירוט ומסירה את האיום
- [ ] 11. החטאה מסירה את המיירט בלבד
- [ ] 12. איום שלא יורט ומגיע לסוף המסלול מייצר Impact
- [ ] 13. Pause מקפיא את כל הסימולציה
- [ ] 14. שינוי Speed משפיע על כל מרכיבי הזמן
- [ ] 15. Restart מאפס את הסימולציה לחלוטין
- [ ] 16. אין תלות בין קצב ה-API לבין FPS של המפה
- [ ] 17. תגובות API ישנות אינן יכולות לדרוס State חדש
- [ ] 18. המערכת מציגה מספר גדול של עצמים במקביל
- [ ] 19. Leaflet משמש Renderer בלבד
- [ ] 20. כל לוגיקת ההחלטות נשארת מחוץ לשכבת המפה

---

## 🔗 תוכנית אינטגרציה

```
Dev A ו-Dev B עובדים במקביל
Dev C ממתין לסיום A.2–A.4 לפני C.2

שלב 1 — במקביל:
  fix/dev-a-engine     →  A.1 (VisualEventBuilder import fix)
                          A.2 ThreatEngine
                          A.3 InterceptorEngine
                          A.4 ImpactEngine
                          A.5 SimulationEngine
                          A.6 ניקוי App.tsx

  fix/dev-b-wiring     →  B.1 MockServer fallback ב-AlgorithmClient
                          B.2 Singleton export
                          B.3 reset() ב-Restart
                          B.4 shouldFireApiTick

שלב 2 — לאחר מיזוג Dev A:
  fix/dev-c-integration → C.1 VisualEvent type unification
                          C.2 LeafletRenderer interceptor cleanup
                          C.3 SimulationStats wiring
                          C.4 Acceptance testing checklist

שלב 3 — מיזוג ל-team-3
```

---

## קבצים לפי מפתח — סיכום

| קובץ | מפתח | פעולה |
|------|-------|--------|
| `src/visual/VisualEventBuilder.ts` | A | עדכון import של `EngagementDecision` |
| `src/simulation/ThreatEngine.ts` | A | יצירה |
| `src/simulation/InterceptorEngine.ts` | A | יצירה |
| `src/simulation/ImpactEngine.ts` | A | יצירה |
| `src/simulation/SimulationEngine.ts` | A | יצירה |
| `src/App.tsx` | A | ניקוי לוגיקה inline, חיבור ל-SimulationEngine |
| `src/algorithm/AlgorithmClient.ts` | B | הוספת MockServer fallback + singleton export |
| `frontend/.env.example` | B | הוספת `VITE_USE_MOCK_ALGORITHM` |
| `src/App.tsx` (handleRestart) | B | הוספת `algorithmClient.reset()` + `resetTickId()` |
| `src/simulation/SimulationContext.ts` | C | הסרת `VisualEvent` local, import מ-visual/types |
| `src/map/LeafletRenderer.ts` | C | הסרת חישוב progress ממיירטים |
| `src/ui/SimulationStats.tsx` | C | חיבור `algorithmClient.getIsAvailable()` |
