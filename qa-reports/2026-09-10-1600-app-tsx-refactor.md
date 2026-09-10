# QA Report: App.tsx refactor

## Task Summary

Refactor the frontend `App.tsx` file to remove useless or duplicate code and separate logic that does not need to live in the root app component.

## Files Changed

- `frontend/src/App.tsx`
- `frontend/src/components/ToastNotification.tsx`
- `frontend/src/components/EventsPanel/EventScenarioCard.tsx`
- `frontend/src/components/EventsPanel/EventsPanel.tsx`
- `frontend/src/components/Header/Header.tsx`
- `frontend/src/hooks/useAttackScenarioBuilder.ts`
- `frontend/src/hooks/useLeafletMapController.ts`
- `frontend/src/hooks/useSimulationRuntime.ts`
- `frontend/src/hooks/useThreatSelection.ts`
- `frontend/src/hooks/useToast.ts`
- `frontend/src/layouts/MainLayout.tsx`
- `frontend/src/ui/MapView.tsx`
- `frontend/src/utils/threatPresentation.ts`

## Checks Performed

- Reviewed the `App.tsx` diff for behavior preservation and accidental unrelated rewrites.
- Checked extracted simulation tick/restart logic, Leaflet map setup, attack placement state, threat selection, and threat presentation helpers.
- Verified the duplicate dark tile layer in the main App flow is removed by letting `useLeafletMapController` own the base layers while `MapView` remains reusable.
- Fixed stale `EventsPanel` filters to match the current `ScenarioItem` model so the frontend build can pass.

## Commands Executed

| Command | Result |
| --- | --- |
| `npm run build` in `frontend` | PASS - TypeScript and Vite production build completed. Vite reported the existing large chunk warning. |
| `npx eslint src/App.tsx src/hooks/useAttackScenarioBuilder.ts src/hooks/useLeafletMapController.ts src/hooks/useSimulationRuntime.ts src/hooks/useThreatSelection.ts src/components/ToastNotification.tsx src/utils/threatPresentation.ts src/layouts/MainLayout.tsx src/ui/MapView.tsx src/components/Header/Header.tsx src/components/EventsPanel/EventsPanel.tsx src/components/EventsPanel/EventScenarioCard.tsx` in `frontend` | PASS - Changed files pass lint. |
| `npm run lint` in `frontend` | FAIL - Existing unrelated lint errors remain across untouched files. |
| `npm run build` in `backend` | PASS - Backend TypeScript build completed. |
| `npm run format:check` in repo root | FAIL - Missing root script. |
| `npm run lint` in repo root | FAIL - Missing root script. |
| `npm run build` in repo root | FAIL - Missing root script. |
| `npm run test` in repo root | FAIL - Missing root script. |
| `npm run format:check` in `frontend` | FAIL - Missing frontend script. |
| `npm run test` in `frontend` | FAIL - Missing frontend script. |

## Test/Lint/Build/Typecheck Results

- Frontend build passes after the refactor.
- Backend build passes and was unaffected.
- Changed frontend files pass targeted lint.
- Full frontend lint is still blocked by pre-existing lint debt in files such as `WorldSnapshotBuilder.ts`, API hooks, scenario modal pages, `DefenseSide`, `DroneCard`, `DroneModal`, `LaunchersDronesPanel`, and others.
- Root QA template commands are not available because the root package has no scripts.

## Issues Found

- The project lacks root-level scripts required by the portfolio QA template.
- Full frontend lint still fails on unrelated existing issues outside this refactor.

## Fixes Applied

- Extracted App simulation runtime behavior into `useSimulationRuntime`.
- Extracted map setup, layers, overlay loading, coordinate pin behavior, and map move ticks into `useLeafletMapController`.
- Extracted attack wave/scenario placement state and marker rendering into `useAttackScenarioBuilder`.
- Extracted threat selection and modal positioning into `useThreatSelection`.
- Extracted toast state and rendering into `useToast` and `ToastNotification`.
- Extracted threat modal labels and distance calculation into `threatPresentation`.
- Added `useDefaultMapLayer` through `MainLayout` and `MapView` to avoid duplicate base tile layers in the main App path.
- Fixed `EventsPanel` filtering to use `ScenarioType` and `scenario.drones.length`.
- Removed adjacent dead imports/destructuring in touched files.

## Remaining Risks

- Full lint cannot pass until the unrelated existing lint errors are cleaned up.
- No automated tests are configured in the frontend package.
- This was verified with compile/lint checks, not an interactive browser smoke test.

## Final QA Status

FAIL

Reviewed by QA Agent
